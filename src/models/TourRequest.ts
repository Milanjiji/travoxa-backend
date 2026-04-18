import mongoose from 'mongoose';

const TourRequestSchema = new mongoose.Schema({
    tourId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    members: {
        type: Number,
        required: true,
        min: 1
    },
    date: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    userDetails: {
        name: String,
        email: String,
        phone: String
    },
    priceReductionNotes: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.TourRequest || mongoose.model('TourRequest', TourRequestSchema);
