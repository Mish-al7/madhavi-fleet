import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
    // System Fields
    booking_no: {
        type: String,
        required: true,
    },
    booking_date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company is required'],
        index: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },

    // Customer Details
    customer_name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
    },
    customer_address: {
        type: String,
        trim: true,
    },
    customer_phone: {
        type: String,
        required: [true, 'Customer phone is required'],
        trim: true,
    },

    // Trip Details
    package_name: {
        type: String,
        trim: true,
    },
    itinerary: [{
        day: String,
        time: String,
        location: String,
        remarks: String,
    }],
    pickup_location: {
        type: String,
        trim: true,
    },
    trip_destination: {
        type: String,
        trim: true,
    },
    total_persons: {
        type: Number,
        min: 1,
        default: 1,
    },
    journey_start_date: {
        type: Date,
        required: [true, 'Journey start date is required'],
    },
    journey_return_date: {
        type: Date,
        required: [true, 'Journey return date is required'],
    },

    // Time & Distance
    trip_start_time: {
        type: String, // Format: "HH:MM"
        required: [true, 'Trip start time is required'],
    },
    trip_end_time: {
        type: String, // Format: "HH:MM"
        required: [true, 'Trip end time is required'],
    },
    total_days: {
        type: Number,
        min: 1,
        default: 1,
    },
    total_kilometers: {
        type: Number,
        min: 0,
        default: 0,
    },

    // Additional Info
    night_halt_places: {
        type: String,
        trim: true,
    },
    vehicle_type: {
        type: String,
        trim: true,
    },

    // Financials
    advance_amount: {
        type: Number,
        min: 0,
        default: 0,
    },
    total_amount: {
        type: Number,
        min: 0,
        default: 0,
    },
    other_expenses: {
        type: String,
        trim: true,
    },
    driver_food_accommodation: {
        type: String,
        trim: true,
    },
    payment_status: {
        type: String,
        enum: ['received', 'pay_later'],
        default: 'pay_later',
    },
    payment_date: {
        type: Date,
        required: false,
    },


    // Vehicle (locked reference)
    vehicle_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: [true, 'Vehicle is required'],
    },
    vehicle_no: {
        type: String, // Snapshot at booking creation
        required: true,
    },
    driver_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
}, {
    timestamps: true,
});

// Index for efficient overlap queries
BookingSchema.index({ vehicle_id: 1, status: 1, journey_start_date: 1, journey_return_date: 1 });

// Booking number unique per company
BookingSchema.index({ booking_no: 1, company_id: 1 }, { unique: true });

// Static method to generate booking number
BookingSchema.statics.generateBookingNo = async function (companyId) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `BK-${dateStr}`;

    // Find the latest booking number globally (across companies) for today to avoid collisions
    const latestBooking = await this.findOne({
        booking_no: { $regex: `^${prefix}` }
    })
    .sort({ booking_no: -1 })
    .select('booking_no')
    .lean();

    let sequence = 1;
    if (latestBooking && latestBooking.booking_no) {
        const lastSequence = parseInt(latestBooking.booking_no.split('-')[2]);
        if (!isNaN(lastSequence)) {
            sequence = lastSequence + 1;
        }
    }

    const sequenceStr = String(sequence).padStart(3, '0');
    return `${prefix}-${sequenceStr}`;
};

// Static method to check vehicle availability (overlap detection)
BookingSchema.statics.checkVehicleAvailability = async function (vehicleId, startDate, endDate, startTime, endTime, excludeBookingId = null, companyId = null) {
    const query = {
        vehicle_id: vehicleId,
        status: { $in: ['pending', 'approved'] },
        // Date range overlap: existing.start <= new.end AND existing.end >= new.start
        journey_start_date: { $lte: new Date(endDate) },
        journey_return_date: { $gte: new Date(startDate) },
    };

    // Scope to company
    if (companyId) {
        query.company_id = companyId;
    }

    // Exclude current booking when updating
    if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
    }

    const conflictingBookings = await this.find(query)
        .populate('vehicle_id', 'vehicle_no')
        .lean();

    if (conflictingBookings.length === 0) {
        return { available: true, conflicts: [] };
    }

    // Check accurate time overlap for both single and multi-day bookings
    // Time overlap: existing.start < new.end AND existing.end > new.start
    const timeConflicts = conflictingBookings.filter(booking => {
        // Helper to combine date and time into a single numeric timestamp
        const combineDateTime = (dateObj, timeStr) => {
            const date = new Date(dateObj);
            const [hours, minutes] = timeStr.split(':').map(Number);
            date.setHours(hours, minutes, 0, 0);
            return date.getTime();
        };

        const existingStart = combineDateTime(booking.journey_start_date, booking.trip_start_time);
        const existingEnd = combineDateTime(booking.journey_return_date, booking.trip_end_time);
        const newStart = combineDateTime(startDate, startTime);
        const newEnd = combineDateTime(endDate, endTime);

        // Single and multi-day booking: check absolute time overlap
        return existingStart < newEnd && existingEnd > newStart;
    });

    return {
        available: timeConflicts.length === 0,
        conflicts: timeConflicts.map(b => ({
            booking_no: b.booking_no,
            dates: `${new Date(b.journey_start_date).toLocaleDateString()} - ${new Date(b.journey_return_date).toLocaleDateString()}`,
            times: `${b.trip_start_time} - ${b.trip_end_time}`,
            status: b.status
        }))
    };
};

// Pre-save hook to populate payment_date if payment_status is received
BookingSchema.pre('save', function (next) {
    if (this.payment_status === 'received' && !this.payment_date) {
        this.payment_date = this.booking_date || new Date();
    }
    next();
});

// Force model re-registration in development to pick up schema changes
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Booking;
}

const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

// Ensure static methods are always up to date
Booking.generateBookingNo = BookingSchema.statics.generateBookingNo;
Booking.checkVehicleAvailability = BookingSchema.statics.checkVehicleAvailability;

export default Booking;
