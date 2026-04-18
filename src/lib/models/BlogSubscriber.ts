import mongoose from 'mongoose';

const blogSubscriberSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    subscribedAt: {
        type: Date,
        default: Date.now,
    },
});

export const BlogSubscriber = mongoose.models.BlogSubscriber || mongoose.model('BlogSubscriber', blogSubscriberSchema);
