import { Router } from 'express';
import Blog from '../models/Blog.js';
import Comment from '../models/Comment.js';
import BlogSubscriber from '../models/BlogSubscriber.js';
import { connectDB } from '../lib/mongodb.js';
import { authenticate, isAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * @route   GET /api/blogs
 * @desc    Get all blogs
 */
router.get('/', async (req, res) => {
    try {
        await connectDB();
        const limit = parseInt(req.query.limit as string || '10');
        const blogs = await Blog.find().sort({ createdAt: -1 }).limit(limit);
        res.json({ success: true, data: blogs });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   POST /api/blogs/subscribe
 */
router.post('/subscribe', async (req, res) => {
    try {
        await connectDB();
        const { email } = req.body;
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        const existing = await BlogSubscriber.findOne({ email });
        if (existing) return res.json({ message: 'You are already subscribed!' });

        await BlogSubscriber.create({ email });
        res.status(201).json({ message: 'Successfully subscribed!' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route   GET /api/blogs/:id
 */
router.get('/:id', async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        let blog = await Blog.findOneAndUpdate({ slug: id }, { $inc: { views: 1 } }, { new: true });
        if (!blog && id.match(/^[0-9a-fA-F]{24}$/)) {
            blog = await Blog.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
        }
        if (!blog) return res.status(404).json({ success: false, error: 'Blog not found' });
        res.json({ success: true, data: blog });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   POST /api/blogs
 */
router.post('/', authenticate, isAdmin, async (req, res) => {
    try {
        await connectDB();
        const data = req.body;
        if (!data.slug && data.title) {
            data.slug = data.title.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
        }
        const blog = await Blog.create(data);
        res.status(201).json({ success: true, data: blog });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * @route   POST /api/blogs/:id/rate
 */
router.post('/:id/rate', authenticate, async (req: AuthRequest, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        const { rating } = req.body;
        if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Invalid rating 1-5' });

        const blog = await Blog.findById(id);
        if (!blog) return res.status(404).json({ error: 'Blog not found' });

        blog.ratings.push(rating);
        blog.averageRating = blog.ratings.reduce((a: number, b: number) => a + b, 0) / blog.ratings.length;
        await blog.save();

        res.json({ success: true, averageRating: blog.averageRating, totalRatings: blog.ratings.length });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   POST /api/blogs/:id/like
 */
router.post('/:id/like', authenticate, async (req: AuthRequest, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        const userId = req.user!.uid || req.user!.email!;
        const blog = await Blog.findById(id);
        if (!blog) return res.status(404).json({ error: 'Blog not found' });

        const isLiked = blog.likedBy.includes(userId);
        if (isLiked) {
            blog.likedBy = blog.likedBy.filter((uid: string) => uid !== userId);
            blog.likes = Math.max(0, blog.likes - 1);
        } else {
            blog.likedBy.push(userId);
            blog.likes += 1;
        }
        await blog.save();
        res.json({ success: true, liked: !isLiked, likes: blog.likes });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   GET /api/blogs/:id/comments
 */
router.get('/:id/comments', async (req, res) => {
    try {
        await connectDB();
        const comments = await Comment.find({ blogId: req.params.id }).sort({ createdAt: -1 });
        res.json({ success: true, data: comments });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   POST /api/blogs/:id/comments
 */
router.post('/:id/comments', authenticate, async (req: AuthRequest, res) => {
    try {
        await connectDB();
        const { content } = req.body;
        if (!content?.trim()) return res.status(400).json({ error: 'Comment empty' });

        const comment = await Comment.create({
            blogId: req.params.id,
            userId: req.user!.uid || req.user!.email!,
            userName: req.user!.email?.split('@')[0] || 'User',
            content,
        });
        res.status(201).json({ success: true, data: comment });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
