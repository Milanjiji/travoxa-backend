import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
    blogId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog',
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    userName: {
        type: String,
        required: true,
    },
    userImage: {
        type: String,
    },
    content: {
        type: String,
        required: [true, 'Please provide a comment'],
        maxlength: [500, 'Comment cannot be more than 500 characters'],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

export default mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
