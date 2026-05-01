import { Router, Response } from 'express';
import { connectDB } from '../lib/mongodb.js';
import { authenticate, identifyUser, AuthRequest } from '../middleware/auth.js';
import Story from '../models/Story.js';
import { fetchIGMetadata } from '../utils/igUtils.js';

const router = Router();

/**
 * @route GET /api/stories
 * @desc Fetch all public published stories
 */
router.get('/', identifyUser, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = parseInt(req.query.skip as string) || 0;

        const stories = await Story.find({ isPublic: true, status: 'published' })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Story.countDocuments({ isPublic: true, status: 'published' });

        res.json({ success: true, data: stories, total });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route GET /api/stories/user/:email
 * @desc Fetch stories by a specific user (drafts included if requester is owner)
 */
router.get('/user/:email', identifyUser, async (req: AuthRequest, res: Response) => {
    try {
        const { email } = req.params;
        const requesterEmail = req.user?.email;
        await connectDB();

        let query: any = { 'author.email': email };

        // Only owner or admin can see drafts
        if (requesterEmail !== email && req.user?.role !== 'admin') {
            query.status = 'published';
            query.isPublic = true;
        }

        const stories = await Story.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data: stories });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route GET /api/stories/:id
 * @desc Fetch a specific story
 */
router.get('/:id', identifyUser, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ success: false, error: 'Story not found' });

        // Privacy check
        if (story.status === 'draft' || !story.isPublic) {
            const requesterEmail = req.user?.email;
            if (requesterEmail !== story.author.email && req.user?.role !== 'admin') {
                return res.status(403).json({ success: false, error: 'Unauthorized to view this story' });
            }
        }

        res.json({ success: true, data: story });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route POST /api/stories
 * @desc Create or update a story
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { _id, ...data } = req.body;
        const user = req.user;

        if (!user || (!user.email && user.uid !== 'web-admin')) {
            return res.status(401).json({ success: false, error: 'User identification failed' });
        }

        // Automatic IG metadata fetching for standalone reels or if fields are empty
        if (data.igLink && (!data.title || !data.description)) {
            const meta = await fetchIGMetadata(data.igLink);
            if (meta.success) {
                if (!data.title) data.title = meta.title;
                if (!data.description) data.description = meta.description;
            }
        }

        // Also check steps for IG links
        if (data.steps && Array.isArray(data.steps)) {
            for (const step of data.steps) {
                if (step.igLink && !step.description) {
                   const meta = await fetchIGMetadata(step.igLink);
                   if (meta.success && meta.description) {
                       step.description = meta.description;
                   }
                }
            }
        }

        let story;
        if (_id) {
            // Update existing
            const existing = await Story.findById(_id);
            if (!existing) return res.status(404).json({ success: false, error: 'Story not found' });

            // Check ownership
            if (existing.author.email !== user.email && user.role !== 'admin') {
                return res.status(403).json({ success: false, error: 'Unauthorized to update this story' });
            }

            story = await Story.findByIdAndUpdate(_id, data, { new: true });
        } else {
            // Create new
            // Ensure author matches authenticated user
            data.author = {
                email: user.email,
                name: data.author?.name || user.email?.split('@')[0] || 'Traveler',
                image: data.author?.image || ''
            };
            story = await Story.create(data);
        }

        res.status(201).json({ success: true, data: story });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route POST /api/stories/:id/like
 * @desc Toggle like
 */
router.post('/:id/like', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const userEmail = req.user?.email;
        if (!userEmail) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ success: false, error: 'Story not found' });

        const index = story.likes.indexOf(userEmail);
        if (index === -1) {
            story.likes.push(userEmail);
        } else {
            story.likes.splice(index, 1);
        }

        await story.save();
        res.json({ success: true, likes: story.likes });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route DELETE /api/stories/:id
 * @desc Delete a story
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ success: false, error: 'Story not found' });

        if (story.author.email !== req.user?.email && req.user?.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        await Story.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Story deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;

