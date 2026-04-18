import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sightseeing',
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userImage: {
        type: String,
    },
    rating: {
        type: Number,
        required: [true, 'Please provide a rating'],
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: [true, 'Please provide a comment'],
        maxlength: [500, 'Comment cannot be more than 500 characters']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent multiple reviews from same user for same item
ReviewSchema.index({ itemId: 1, userId: 1 }, { unique: true });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
