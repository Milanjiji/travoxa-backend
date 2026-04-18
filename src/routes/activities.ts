import { Router } from 'express';
import Activity from '../models/Activity.js';
import { connectDB } from '../lib/mongodb.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = Router();

/**
 * @route   GET /api/activities
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

        const data = await Activity.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   GET /api/activities/:id
 */
router.get('/:id', async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        let activity = await Activity.findOneAndUpdate({ slug: id }, { $inc: { views: 1 } }, { new: true });
        if (!activity && id.match(/^[0-9a-fA-F]{24}$/)) {
            activity = await Activity.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
        }
        if (!activity) return res.status(404).json({ success: false, error: 'Activity not found' });
        res.json({ success: true, data: activity });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   POST /api/activities
 */
router.post('/', authenticate, async (req, res) => {
    try {
        await connectDB();
        const body = req.body;
        if (body.vendorId) body.status = 'pending';
        const data = await Activity.create(body);
        res.status(201).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   PUT /api/activities/:id
 */
router.put('/:id', authenticate, async (req, res) => {
    try {
        await connectDB();
        const data = await Activity.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!data) return res.status(404).json({ success: false, error: 'Activity not found' });
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   DELETE /api/activities/:id
 */
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
    try {
        await connectDB();
        const data = await Activity.findByIdAndDelete(req.params.id);
        if (!data) return res.status(404).json({ success: false, error: 'Activity not found' });
        res.json({ success: true, message: 'Deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
