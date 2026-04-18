import mongoose from 'mongoose';

const BlogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a blog title'],
        maxlength: [150, 'Title cannot be more than 150 characters'],
    },
    slug: {
        type: String,
        required: [true, 'Please provide a slug'],
        unique: true,
    },
    content: {
        type: String,
        required: [true, 'Please provide blog content'],
    },
    excerpt: {
        type: String,
        required: [true, 'Please provide an excerpt'],
        maxlength: [300, 'Excerpt cannot be more than 300 characters'],
    },
    coverImage: {
        type: String,
        required: [true, 'Please provide a cover image'],
    },
    author: {
        type: String,
        default: 'Travoxa Team',
    },
    tags: {
        type: [String],
        default: [],
    },
    likes: {
        type: Number,
        default: 0,
    },
    likedBy: {
        type: [String], // Array of user IDs/emails
        default: [],
    },
    ratings: {
        type: [Number],
        default: [],
    },
    averageRating: {
        type: Number,
        default: 0,
    },
    views: {
        type: Number,
        default: 0,
    }
}, { timestamps: true });

export default mongoose.models.Blog || mongoose.model('Blog', BlogSchema);
