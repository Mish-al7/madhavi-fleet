import mongoose from 'mongoose';

const RouteSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a route name'],
        trim: true,
    },
    from: {
        type: String,
        required: [true, 'Please provide a starting point (From)'],
        trim: true,
    },
    to: {
        type: String,
        required: [true, 'Please provide a destination (To)'],
        trim: true,
    },
    distance_km: {
        type: Number,
        required: [true, 'Please provide the distance in km'],
        min: 0,
    },
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company is required'],
        index: true,
    },
}, {
    timestamps: true,
});

// Route name unique per company (not globally)
RouteSchema.index({ name: 1, company_id: 1 }, { unique: true });

export default mongoose.models.Route || mongoose.model('Route', RouteSchema);
