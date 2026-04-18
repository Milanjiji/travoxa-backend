import mongoose from 'mongoose';

const RecommendationCacheSchema = new mongoose.Schema({
    key: {
        type: String,
        required: [true, 'Please provide a key'],
        index: true,
        unique: true, // Example key: beach-hill-station-lat-lon
    },
    results: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Place'
    }],
    preferences: {
        primaryType: String,
        secondaryTypes: [String],
        departure: {
            name: String,
            lat: Number,
            lon: Number
        }
    },
    rawPayload: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 * 7, // Cache valid for 7 days
    },
}, {
    timestamps: true,
});

export default mongoose.models.RecommendationCache || mongoose.model('RecommendationCache', RecommendationCacheSchema);
