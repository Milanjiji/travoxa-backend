import { Router } from 'express';
import Sightseeing from '../models/Sightseeing.js';
import Review from '../models/Review.js';
import { connectDB } from '../lib/mongodb.js';
import { authenticate, isAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * @route   GET /api/sightseeing
 */
router.get('/', async (req, res) => {
    try {
        await connectDB();
        const { vendorId, admin, status } = req.query;

        const query: any = {};
        if (vendorId) {
            query.vendorId = vendorId;
        } else if (admin === 'true') {
            if (status) query.status = status;
        } else {
            query.status = 'approved';
        }

        let packages = await Sightseeing.find(query).sort({ createdAt: -1 });

        // Fallback/Healing
        if (packages.length === 0 && !vendorId && admin !== 'true') {
            const allPackagesRaw = await Sightseeing.find({}).sort({ createdAt: -1 });
            const approvedPackages = allPackagesRaw.filter(pkg => pkg.status === 'approved');

            if (approvedPackages.length > 0) {
                console.log(`[Sightseeing] fallback triggered - found ${approvedPackages.length} approved items.`);
                packages = approvedPackages;

                allPackagesRaw.forEach(async (pkg) => {
                    try { await Sightseeing.findByIdAndUpdate(pkg._id, { status: pkg.status }); } catch (e) {}
                });
            }
        }

        res.json({ success: true, data: packages });
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Failed to fetch sightseeing' });
    }
});

/**
 * @route   GET /api/sightseeing/:id (ID or Slug)
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await connectDB();

        let pkg = await Sightseeing.findOneAndUpdate(
            { slug: id },
            { $inc: { views: 1 } },
            { new: true }
        )
            .populate('relatedTours', 'title image _id googleRating rating location city state slug')
            .populate('relatedSightseeing', 'title image _id rating location city state slug')
            .populate('relatedActivities', 'title image _id rating location city state slug')
            .populate('relatedRentals', 'title name image _id rating location city state slug')
            .populate('relatedStays', 'title name image _id rating location city state slug')
            .populate('relatedFood', 'name image _id rating location city state cuisine slug')
            .populate('relatedAttractions', 'title image _id rating location city state type category slug');

        if (!pkg && id.match(/^[0-9a-fA-F]{24}$/)) {
            pkg = await Sightseeing.findByIdAndUpdate(
                id,
                { $inc: { views: 1 } },
                { new: true }
            )
            .populate('relatedTours', 'title image _id googleRating rating location city state slug')
            .populate('relatedSightseeing', 'title image _id rating location city state slug')
            .populate('relatedActivities', 'title image _id rating location city state slug')
            .populate('relatedRentals', 'title name image _id rating location city state slug')
            .populate('relatedStays', 'title name image _id rating location city state slug')
            .populate('relatedFood', 'name image _id rating location city state cuisine slug')
            .populate('relatedAttractions', 'title image _id rating location city state type category slug');
        }

        if (!pkg) return res.status(404).json({ success: false, error: 'Sightseeing package not found' });
        res.json({ success: true, data: pkg });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   GET /api/sightseeing/:id/reviews
 */
router.get('/:id/reviews', async (req, res) => {
    try {
        await connectDB();
        const reviews = await Review.find({ itemId: req.params.id }).sort({ createdAt: -1 });
        res.json({ success: true, data: reviews });
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
    }
});

/**
 * @route   POST /api/sightseeing
 */
router.post('/', authenticate, async (req, res) => {
    try {
        await connectDB();
        const data = req.body;
        if (data.vendorId) data.status = 'pending';
        if (!data.title || !data.city || !data.state || !data.price) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }
        const pkg = await Sightseeing.create(data);
        res.status(201).json({ success: true, data: pkg });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   POST /api/sightseeing/:id/reviews
 */
router.post('/:id/reviews', authenticate, async (req: AuthRequest, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        const { rating, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Invalid rating' });
        if (!comment?.trim()) return res.status(400).json({ error: 'Comment required' });

        const existing = await Review.findOne({ itemId: id, userId: req.user!.email });
        if (existing) return res.status(400).json({ error: 'Already reviewed' });

        const review = await Review.create({
            itemId: id,
            userId: req.user!.email,
            userName: req.user!.email?.split('@')[0] || 'Anonymous', // Simplified name logic
            rating,
            comment
        });

        const all = await Review.find({ itemId: id });
        const avg = all.reduce((acc, curr) => acc + curr.rating, 0) / all.length;
        await Sightseeing.findByIdAndUpdate(id, { rating: avg, reviews: all.length });

        res.status(201).json({ success: true, data: review });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   PUT /api/sightseeing/:id
 */
router.put('/:id', authenticate, async (req, res) => {
    try {
        await connectDB();
        const updated = await Sightseeing.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ success: false, error: 'Sightseeing not found' });
        res.json({ success: true, data: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   DELETE /api/sightseeing/:id
 */
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
    try {
        await connectDB();
        const result = await Sightseeing.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ success: false, error: 'Sightseeing not found' });
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
