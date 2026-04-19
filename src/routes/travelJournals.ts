import { Router, Response } from 'express';
import { connectDB } from '../lib/mongodb.js';
import { authenticate, identifyUser, AuthRequest } from '../middleware/auth.js';
import TravelJournal from '../models/TravelJournal.js';
import { fetchIGMetadata } from '../utils/igUtils.js';

const router = Router();

/**
 * @route GET /api/travel-journals
 * @desc Fetch all public published journals
 */
router.get('/', identifyUser, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = parseInt(req.query.skip as string) || 0;

        const journals = await TravelJournal.find({ isPublic: true, status: 'published' })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await TravelJournal.countDocuments({ isPublic: true, status: 'published' });

        res.json({ success: true, data: journals, total });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route GET /api/travel-journals/user/:email
 * @desc Fetch journals by a specific user (drafts included if requester is owner)
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

        const journals = await TravelJournal.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data: journals });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route GET /api/travel-journals/:id
 * @desc Fetch a specific journal
 */
router.get('/:id', identifyUser, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const journal = await TravelJournal.findById(req.params.id);
        if (!journal) return res.status(404).json({ success: false, error: 'Journal not found' });

        // Privacy check
        if (journal.status === 'draft' || !journal.isPublic) {
            const requesterEmail = req.user?.email;
            if (requesterEmail !== journal.author.email && req.user?.role !== 'admin') {
                return res.status(403).json({ success: false, error: 'Unauthorized to view this journal' });
            }
        }

        res.json({ success: true, data: journal });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route POST /api/travel-journals
 * @desc Create or update a journal
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

        let journal;
        if (_id) {
            // Update existing
            const existing = await TravelJournal.findById(_id);
            if (!existing) return res.status(404).json({ success: false, error: 'Journal not found' });

            // Check ownership
            if (existing.author.email !== user.email && user.role !== 'admin') {
                return res.status(403).json({ success: false, error: 'Unauthorized to update this journal' });
            }

            journal = await TravelJournal.findByIdAndUpdate(_id, data, { new: true });
        } else {
            // Create new
            // Ensure author matches authenticated user
            data.author = {
                email: user.email,
                name: data.author?.name || user.email?.split('@')[0] || 'Traveler',
                image: data.author?.image || ''
            };
            journal = await TravelJournal.create(data);
        }

        res.status(201).json({ success: true, data: journal });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route POST /api/travel-journals/:id/like
 * @desc Toggle like
 */
router.post('/:id/like', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const userEmail = req.user?.email;
        if (!userEmail) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const journal = await TravelJournal.findById(req.params.id);
        if (!journal) return res.status(404).json({ success: false, error: 'Journal not found' });

        const index = journal.likes.indexOf(userEmail);
        if (index === -1) {
            journal.likes.push(userEmail);
        } else {
            journal.likes.splice(index, 1);
        }

        await journal.save();
        res.json({ success: true, likes: journal.likes });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route DELETE /api/travel-journals/:id
 * @desc Delete a journal
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const journal = await TravelJournal.findById(req.params.id);
        if (!journal) return res.status(404).json({ success: false, error: 'Journal not found' });

        if (journal.author.email !== req.user?.email && req.user?.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        await TravelJournal.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Journal deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
