import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
    vehicle_no: {
        type: String,
        required: [true, 'Please provide a vehicle number'],
        trim: true,
        uppercase: true,
    },
    nickname: {
        type: String,
        trim: true,
    },
    vehicle_name: {
        type: String,
        trim: true,
    },
    seats: {
        type: Number,
        default: 0,
    },
    ac_type: {
        type: String,
        enum: ['AC', 'Non-AC'],
        default: 'Non-AC',
    },
    bus_type: {
        type: String,
        enum: ['Tour Bus', 'Service Bus'],
        default: 'Service Bus',
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
        enum: ['active', 'inactive'],
        default: 'active',
    },
}, {
    timestamps: true,
});

// Vehicle number unique per company (not globally)
VehicleSchema.index({ vehicle_no: 1, company_id: 1 }, { unique: true });

//export
export default mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);
