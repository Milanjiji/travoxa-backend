import mongoose from 'mongoose';

const MobileActivitySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: false,
    },
    userEmail: {
        type: String,
        required: false,
    },
    userName: {
        type: String,
        required: false,
    },
    type: {
        type: String,
        enum: ['search', 'ai_usage', 'city_view', 'login_location'],
        required: true,
    },
    details: {
        keyword: String,           // for search
        parameters: mongoose.Schema.Types.Mixed, // for ai_usage (e.g., trip style, location)
        cityName: String,          // for city_view and ai_usage
        cityId: String,            // for city_view
    },
    platform: {
        type: String,
        enum: ['ios', 'android', 'web', 'unknown'],
        default: 'unknown'
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.MobileActivity || mongoose.model('MobileActivity', MobileActivitySchema);
