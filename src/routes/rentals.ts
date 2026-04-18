import { Router } from 'express';
import Rental from '../models/Rental.js';
import { connectDB } from '../lib/mongodb.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = Router();

/**
 * @route   GET /api/rentals
 * @desc    Get all rentals with optional filters
 */
router.get('/', async (req, res) => {
    try {
        await connectDB();
        const { vendorId, admin, status } = req.query;

        const query: any = {};
        if (vendorId) {
            query.vendorId = vendorId;
        } else if (admin === 'true') {
            if (status) query.status = typeof status === 'string' ? status : undefined;
        } else {
            query.$or = [{ status: 'approved' }, { status: { $exists: false } }];
        }

        let rentals = await Rental.find(query).sort({ createdAt: -1 });

        // Fallback/Healing logic preserved from Next.js
        if (rentals.length === 0 && !vendorId && admin !== 'true') {
            const allRentalsRaw = await Rental.find({}).sort({ createdAt: -1 });
            const approvedRentals = allRentalsRaw.filter(rental => rental.status === 'approved');

            if (approvedRentals.length > 0) {
                console.log(`[Rentals] fallback triggered - found ${approvedRentals.length} approved items.`);
                rentals = approvedRentals;

                // Async self-healing
                allRentalsRaw.forEach(async (rental) => {
                    try { await Rental.findByIdAndUpdate(rental._id, { status: rental.status }); } catch (e) {}
                });
            }
        }

        res.json({ success: true, data: rentals });
    } catch (error: any) {
        console.error('[Rentals/GET] Error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch rentals' });
    }
});

/**
 * @route   GET /api/rentals/:id (ID or Slug)
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await connectDB();

        let rental = await Rental.findOneAndUpdate(
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

        if (!rental && id.match(/^[0-9a-fA-F]{24}$/)) {
            rental = await Rental.findByIdAndUpdate(
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

        if (!rental) return res.status(404).json({ success: false, error: 'Rental not found' });
        res.json({ success: true, data: rental });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   POST /api/rentals
 */
router.post('/', authenticate, async (req, res) => {
    try {
        await connectDB();
        const rentalData = req.body;

        if (rentalData.vendorId) rentalData.status = 'pending';

        if (!rentalData.name || !rentalData.type || !rentalData.price || !rentalData.state || !rentalData.city || !rentalData.whatsapp) {
            return res.status(400).json({ success: false, error: 'Please provide all required fields' });
        }

        rentalData.location = `${rentalData.city}, ${rentalData.state}`;
        const newRental = await Rental.create(rentalData);

        res.status(201).json({ success: true, data: newRental });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   PUT /api/rentals/:id
 */
router.put('/:id', authenticate, async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        const body = req.body;

        if (!body.name || !body.type || !body.price || !body.state || !body.city || !body.whatsapp) {
            return res.status(400).json({ success: false, error: 'Please provide all required fields' });
        }

        body.location = `${body.city}, ${body.state}`;
        const updatedRental = await Rental.findByIdAndUpdate(id, body, { new: true, runValidators: true });

        if (!updatedRental) return res.status(404).json({ success: false, error: 'Rental not found' });
        res.json({ success: true, data: updatedRental });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   DELETE /api/rentals/:id
 */
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
    try {
        await connectDB();
        const result = await Rental.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ success: false, error: 'Rental not found' });
        res.json({ success: true, message: 'Rental deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
