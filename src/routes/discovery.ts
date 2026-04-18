import { Router } from 'express';
import Attraction from '../models/Attraction.js';
import Food from '../models/Food.js';
import Stay from '../models/Stay.js';
import Helpline from '../models/Helpline.js';
import { connectDB } from '../lib/mongodb.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import { generateAttractionSlug } from '../utils/slugify.js';

const router = Router();

/**
 * Generic Fetch Handler
 */
const handleGet = (Model: any, label: string) => async (req: any, res: any) => {
    try {
        await connectDB();
        const { vendorId, admin, status } = req.query;
        const query: any = {};
        if (vendorId) {
            query.vendorId = vendorId;
        } else if (admin === 'true') {
            if (status) query.status = status;
        } else {
            query.$or = [{ status: 'approved' }, { status: { $exists: false } }];
        }
        const data = await Model.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: `Failed to fetch ${label}` });
    }
};

/**
 * Generic Detail Handler
 */
const handleGetDetail = (Model: any, label: string) => async (req: any, res: any) => {
    const { id } = req.params;
    try {
        await connectDB();
        let item = await Model.findOneAndUpdate({ slug: id }, { $inc: { views: 1 } }, { new: true });
        if (!item && id.match(/^[0-9a-fA-F]{24}$/)) {
            item = await Model.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
        }
        if (!item) return res.status(404).json({ success: false, error: `${label} not found` });
        res.json({ success: true, data: item });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Generic Create Handler
 */
const handlePost = (Model: any, label: string) => async (req: any, res: any) => {
    try {
        await connectDB();
        const body = req.body;
        if (body.vendorId) body.status = 'pending';
        
        // Attraction specific slug logic
        if (label === 'Attraction' && !body.slug) {
            body.slug = generateAttractionSlug(body.title, body.city);
        }

        const data = await Model.create(body);
        res.status(201).json({ success: true, data });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

/**
 * Routes for Attractions
 */
router.get('/attractions', handleGet(Attraction, 'Attraction'));
router.get('/attractions/:id', handleGetDetail(Attraction, 'Attraction'));
router.post('/attractions', authenticate, handlePost(Attraction, 'Attraction'));

/**
 * Routes for Food
 */
router.get('/food', handleGet(Food, 'Food'));
router.get('/food/:id', handleGetDetail(Food, 'Food'));
router.post('/food', authenticate, handlePost(Food, 'Food'));

/**
 * Routes for Stay
 */
router.get('/stay', handleGet(Stay, 'Stay'));
router.get('/stay/:id', handleGetDetail(Stay, 'Stay'));
router.post('/stay', authenticate, handlePost(Stay, 'Stay'));

/**
 * Routes for Helplines
 */
router.get('/helplines', handleGet(Helpline, 'Helpline'));
router.get('/helplines/:id', handleGetDetail(Helpline, 'Helpline'));
router.post('/helplines', authenticate, isAdmin, handlePost(Helpline, 'Helpline'));

export default router;
