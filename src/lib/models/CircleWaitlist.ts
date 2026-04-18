import mongoose from 'mongoose';

const circleWaitlistSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    joinedAt: {
        type: Date,
        default: Date.now,
    },
});

export const CircleWaitlist = mongoose.models.CircleWaitlist || mongoose.model('CircleWaitlist', circleWaitlistSchema);
