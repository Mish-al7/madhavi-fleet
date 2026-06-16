import mongoose from 'mongoose';

const TripSchema = new mongoose.Schema({
    trip_date: {
        type: Date,
        required: [true, 'Please provide a trip date'],
    },
    month: {
        type: String,
        required: true, // Auto-derived, e.g., '2025-01'
        match: /^\d{4}-\d{2}$/,
    },
    vehicle_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true,
    },
    driver_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company is required'],
        index: true,
    },
    trip_route: {
        type: String,
        required: [true, 'Please provide the route'],
        trim: true,
    },

    // Financials
    income: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },

    // Expenses
    fuel: { type: Number, default: 0, min: 0 },
    fasttag: { type: Number, default: 0, min: 0 },
    driver_allowance: { type: Number, default: 0, min: 0 },
    service: { type: Number, default: 0, min: 0 },

    // New Fields
    adblue: { type: Number, default: 0, min: 0 },
    grease: { type: Number, default: 0, min: 0 },
    air: { type: Number, default: 0, min: 0 },

    deposit_to_kdr_bank: { type: Number, default: 0, min: 0 },
    other_expense: { type: Number, default: 0, min: 0 },

    total_expenses: {
        type: Number,
        required: true,
        default: 0, // Auto-calculated
    },

    notes: {
        type: String,
        trim: true,
    },

    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: false,
    },

    // Optional: name of person who physically drove (display only, not for auth)
    actual_driver_name: {
        type: String,
        trim: true,
    },

    // Nightly Service fields
    trip_type: {
        type: String,
        enum: ['regular', 'nightly'],
        default: 'regular',
    },
    route_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: false,
    },
        cleaner_name: {
        type: String,
        trim: true,
    },
    cleaner_payment: {
        type: Number,
        default: 0,
        min: 0,
    },
    driver_payment: {
        type: Number,
        default: 0,
        min: 0,
    },
    seats_filled: {
        type: Number,
        default: 0,
        min: 0,
    },
    toll: {
        type: Number,
        default: 0,
        min: 0,
    },
    office_offline_collection: {
        type: Number,
        default: 0,
        min: 0,
    },
    online_booking_collection: {
        type: Number,
        default: 0,
        min: 0,
    },
}, {
    timestamps: true,
});

// Pre-validate hook to ensure month and total_expenses are correct before validation
TripSchema.pre('validate', function () {
    // Derive month from trip_date
    if (this.trip_date) {
        const d = new Date(this.trip_date);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        this.month = `${yyyy}-${mm}`;
    }

    if (this.trip_type === 'nightly') {
        // Nightly Service calculations
        this.income = (this.office_offline_collection || 0) + (this.online_booking_collection || 0);
        this.total_expenses = (
            (this.fuel || 0) +
            (this.toll || 0) +
            (this.driver_payment || 0) +
            (this.cleaner_payment || 0) +
            (this.other_expense || 0)
        );
    } else {
        // Regular trip calculations
        this.total_expenses = (
            (this.fuel || 0) +
            (this.fasttag || 0) +
            (this.driver_allowance || 0) +
            (this.service || 0) +
            (this.adblue || 0) +
            (this.grease || 0) +
            (this.air || 0) +
            (this.deposit_to_kdr_bank || 0) +
            (this.other_expense || 0)
        );
    }
});

// Add compound index for ledger querying
TripSchema.index({ company_id: 1, vehicle_id: 1, trip_date: 1 });
TripSchema.index({ company_id: 1, driver_id: 1 });

export default mongoose.models.Trip || mongoose.model('Trip', TripSchema);
