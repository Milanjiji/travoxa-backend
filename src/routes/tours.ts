import { Router } from 'express';
import Tour from '../models/Tour.js';
import TourRequest from '../models/TourRequest.js';
import CustomTourRequest from '../models/CustomTourRequest.js';
import User from '../models/User.js';
import { connectDB } from '../lib/mongodb.js';
import { authenticate, isAdmin, identifyUser, AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * @route   GET /api/tours
 * @desc    Get all tours with optional filters
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
            query.$or = [{ status: 'approved' }, { status: { $exists: false } }];
        }

        let tours = await Tour.find(query)
            .populate('vendorId', 'vendorDetails.businessName')
            .sort({ createdAt: -1 });

        // Fallback/Healing logic preserved from Next.js
        if (tours.length === 0 && !vendorId && admin !== 'true') {
            const allTours = await Tour.find({})
                .populate('vendorId', 'vendorDetails.businessName')
                .sort({ createdAt: -1 });
            const approvedTours = allTours.filter(t => t.status === 'approved');

            if (approvedTours.length > 0) {
                console.log(`[Tours] fallback triggered - found ${approvedTours.length} approved tours.`);
                tours = approvedTours;

                // Async self-healing
                allTours.forEach(async (t) => {
                    try { await Tour.findByIdAndUpdate(t._id, { status: t.status }); } catch (e) {}
                });
            }
        }

        res.json({ success: true, data: tours });
    } catch (error: any) {
        console.error('[Tours/GET] Error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch tours' });
    }
});

/**
 * @route   GET /api/tours/request
 * @desc    Get tour requests (Admin: all, User: own)
 */
router.get('/request', identifyUser, async (req: AuthRequest, res) => {
    try {
        await connectDB();
        const authReq = req;
        const user = await User.findOne({ email: authReq.user?.email || (req.query.email as string) });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { tourId, admin } = req.query;
        let query: any = {};

        if (admin === 'true' && authReq.user?.role === 'admin') {
            if (tourId) query.tourId = tourId;
        } else if (tourId) {
            query.tourId = tourId;
        } else {
            query.userId = user._id;
        }

        const requests = await TourRequest.find(query)
            .populate('tourId')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: requests });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   GET /api/tours/:id (ID or Slug)
 */
router.get('/:id', async (req, res) => {
    const { id: identifier } = req.params;
    try {
        await connectDB();

        let tour = await Tour.findOneAndUpdate(
            { slug: identifier },
            { $inc: { views: 1 } },
            { new: true }
        )
            .populate('vendorId', 'vendorDetails.businessName')
            .populate('relatedTours', 'title price rating image reviews slug');

        if (!tour && identifier.match(/^[0-9a-fA-F]{24}$/)) {
            tour = await Tour.findByIdAndUpdate(
                identifier,
                { $inc: { views: 1 } },
                { new: true }
            )
                .populate('vendorId', 'vendorDetails.businessName')
                .populate('relatedTours', 'title price rating image reviews slug');
        }

        if (!tour) return res.status(404).json({ success: false, error: 'Tour not found' });
        res.json({ success: true, data: tour });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   POST /api/tours
 */
router.post('/', authenticate, async (req, res) => {
    try {
        await connectDB();
        const body = req.body;
        if (!body.title || !body.location || !body.price) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const tour = await Tour.create({
            ...body,
            status: body.vendorId ? 'pending' : 'approved'
        });

        res.status(201).json({ success: true, data: tour });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   POST /api/tours/request
 */
router.post('/request', identifyUser, async (req: AuthRequest, res) => {
    try {
        await connectDB();
        const authReq = req;
        const user = await User.findOne({ email: authReq.user?.email || req.body.email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { tourId, members, date, userDetails, priceReductionNotes } = req.body;
        if (!tourId || !members || !date) return res.status(400).json({ error: 'Missing fields' });

        const tour = await Tour.findById(tourId);
        if (!tour) return res.status(404).json({ error: 'Tour not found' });

        const newRequest = await TourRequest.create({
            tourId,
            userId: user._id,
            title: tour.title,
            members,
            date,
            userDetails: {
                name: userDetails?.name || user.name,
                email: userDetails?.email || user.email,
                phone: userDetails?.phone || ''
            },
            priceReductionNotes: priceReductionNotes || '',
            status: 'pending'
        });

        res.status(201).json({ success: true, data: newRequest });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   PUT /api/tours/:id
 */
router.put('/:id', authenticate, async (req, res) => {
    try {
        await connectDB();
        const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedTour) return res.status(404).json({ success: false, error: 'Tour not found' });
        res.json({ success: true, data: updatedTour });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   DELETE /api/tours/:id
 */
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;

        // Cancel pending requests
        const pending = await TourRequest.find({ tourId: id, status: 'pending' });
        for (const r of pending) {
            await TourRequest.findByIdAndUpdate(r._id, { status: 'rejected' });
            await User.findByIdAndUpdate(r.userId, {
                $push: { notifications: { senderId: 'admin', message: `Tour "${id}" cancelled.`, seen: false, createdAt: new Date() } }
            });
        }

        const result = await Tour.findByIdAndDelete(id);
        if (!result) return res.status(404).json({ success: false, error: 'Tour not found' });
        res.json({ success: true, message: 'Deleted and users notified.' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   POST /api/tours/custom-request
 * @desc    Submit a custom tour request
 */
router.post('/custom-request', authenticate, async (req: AuthRequest, res) => {
    try {
        await connectDB();
        const body = req.body;
        const {
            destination, duration, groupSize, adults, children, infants,
            tripType, budget, startDate, departurePlace, pickupLocation, dropLocation,
            accommodationPreference, mealPlan, interests, additionalNotes, userDetails,
        } = body;

        if (!destination || !duration || !groupSize || !tripType || !budget || !departurePlace) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }
        if (!userDetails?.name || !userDetails?.email || !userDetails?.phone) {
            return res.status(400).json({ message: 'Contact details (name, email, phone) are required.' });
        }

        const dbUser = await User.findOne({ email: req.user!.email });
        if (!dbUser) return res.status(404).json({ message: 'User profile not found.' });

        const newRequest = await CustomTourRequest.create({
            userId: dbUser._id,
            destination, duration, groupSize, adults, children, infants,
            tripType, budget, startDate, departurePlace, pickupLocation, dropLocation,
            accommodationPreference, mealPlan, interests, additionalNotes,
            userDetails: { name: userDetails.name, email: userDetails.email, phone: userDetails.phone },
            status: 'pending',
        });

        res.status(201).json({ message: 'Request submitted successfully!', requestId: newRequest._id });
    } catch (error: any) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

/**
 * @route   GET /api/tours/custom-request
 * @desc    Get custom tour requests (admin: all, user: own)
 */
router.get('/custom-request', authenticate, async (req: AuthRequest, res) => {
    try {
        await connectDB();
        const { userId } = req.query;
        const query: any = userId ? { userId } : {};

        const requests = await CustomTourRequest.find(query)
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: requests });
    } catch (error: any) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

/**
 * @route   PUT /api/tours/custom-request
 * @desc    Update custom tour request status (admin)
 */
router.put('/custom-request', authenticate, async (req: AuthRequest, res) => {
    try {
        await connectDB();
        const { requestId, status, adminResponse } = req.body;

        if (!requestId || !status) return res.status(400).json({ message: 'Missing required fields' });

        const validStatuses = ['approved', 'rejected', 'reviewed', 'contacted', 'closed'];
        if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });

        const updateData: any = { status };
        if (adminResponse && status === 'approved') updateData.adminResponse = adminResponse;

        const updatedRequest = await CustomTourRequest.findByIdAndUpdate(requestId, updateData, { new: true });
        if (!updatedRequest) return res.status(404).json({ message: 'Request not found' });

        let message = `Your custom trip request to ${updatedRequest.destination} has been ${status}.`;
        if (status === 'approved' && adminResponse) {
            message += ` Total: ₹${adminResponse.totalAmount?.toLocaleString()}, Booking: ₹${adminResponse.bookingAmount?.toLocaleString()}. Check your dashboard for details.`;
        }

        await User.findByIdAndUpdate(updatedRequest.userId, {
            $push: { notifications: { senderId: 'admin', message, seen: false, createdAt: new Date() } }
        });

        res.json({ success: true, data: updatedRequest });
    } catch (error: any) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

export default router;
