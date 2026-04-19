import { Router } from 'express';
import { connectDB } from '../lib/mongodb.js';
import Tour from '../models/Tour.js';
import Activity from '../models/Activity.js';
import Rental from '../models/Rental.js';
import Sightseeing from '../models/Sightseeing.js';
import Stay from '../models/Stay.js';
import Food from '../models/Food.js';
import User from '../models/User.js';
import AIConfig from '../models/AIConfig.js';
import Place from '../models/Place.js';
import BackpackerGroup from '../models/BackpackerGroup.js';
import ChatMessage from '../models/ChatMessage.js';
import PushSubscription from '../models/PushSubscription.js';
import { fetchPlaceDetails } from '../utils/wikipedia.js';
import { scrapeMapsPlace } from '../utils/mapsScraper.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

// --- Admin Root / Global ---
// (No global middleware yet)

/**
 * @route   GET /api/admin/chat/unread-count
 */
router.get('/chat/unread-count', async (req, res) => {
    try {
        await connectDB();
        const count = await ChatMessage.countDocuments({ sender: 'user', isRead: false });
        res.json({ success: true, count });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Protected Admin Routes follow:
router.use(authenticate, isAdmin);

/**
 * @route   POST /api/admin/vendor-approval
 */
router.post('/vendor-approval', async (req, res) => {
    try {
        await connectDB();
        const { id, collectionType, status } = req.body;
        if (!id || !collectionType || !status) return res.status(400).json({ error: 'Missing parameters' });

        const models: any = { tours: Tour, activities: Activity, rentals: Rental, sightseeing: Sightseeing, stay: Stay, food: Food };
        const Model = models[collectionType.toLowerCase()];
        if (!Model) return res.status(400).json({ error: 'Invalid collection' });

        const updated = await Model.findByIdAndUpdate(id, { status }, { new: true });
        if (!updated) return res.status(404).json({ error: 'Item not found' });

        res.json({ success: true, data: updated });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   GET /api/admin/ai-config
 */
router.get('/ai-config', async (req, res) => {
    try {
        await connectDB();
        let config = await AIConfig.findOne({});
        if (!config) config = await AIConfig.create({ modelName: "google/gemini-2.0-flash-lite-preview-02-05:free" });
        res.json({ success: true, data: config });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   POST /api/admin/ai-config
 */
router.post('/ai-config', async (req, res) => {
    try {
        await connectDB();
        let config = await AIConfig.findOne({});
        if (config) {
            Object.assign(config, req.body);
            await config.save();
        } else {
            config = await AIConfig.create(req.body);
        }
        res.json({ success: true, data: config });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   POST /api/admin/ai-harvester
 */
router.post('/ai-harvester', async (req, res) => {
    try {
        const { action, locationName, url, placeData } = req.body;
        if (action === 'fetch') {
            if (url?.includes('/maps/place/')) {
                const scraped = await scrapeMapsPlace(url);
                return res.json({ success: true, data: scraped });
            }
            const wiki = await fetchPlaceDetails(locationName);
            res.json({ success: true, data: { name: locationName, description: wiki.summary, image: wiki.image } });
        } else if (action === 'seed') {
            await connectDB();
            const exists = await Place.findOne({ name: placeData.name, district: placeData.district });
            if (exists) return res.status(409).json({ error: 'Already exists' });
            const item = await Place.create(placeData);
            res.json({ success: true, data: item });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   GET /api/admin/users/search
 */
router.get('/users/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || (q as string).length < 3) return res.json({ success: true, users: [] });
        await connectDB();
        const users = await User.find({
            $or: [{ email: { $regex: q, $options: "i" } }, { name: { $regex: q, $options: "i" } }, { phone: { $regex: q, $options: "i" } }]
        }).select("name email phone").limit(10).lean();
        res.json({ success: true, users: users.map((u: any) => ({ ...u, id: u._id.toString() })) });
    } catch (error) {
        res.status(500).json({ error: "Failed to search" });
    }
});

/**
 * @route   PATCH /api/admin/groups/:id/verify
 */
router.patch('/groups/:id/verify', async (req, res) => {
    try {
        await connectDB();
        const updated = await BackpackerGroup.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        if (!updated) return res.status(404).json({ error: "Group not found" });

        if (req.body.verified === true) {
            await User.findOneAndUpdate({ email: updated.creatorId }, {
                $push: { notifications: { senderId: "system", message: `Your crew "${updated.groupName}" is verified!`, seen: false, createdAt: new Date() } }
            });
        }
        res.json({ success: true, group: updated });
    } catch (error) {
        res.status(500).json({ error: "Update failed" });
    }
});

/**
 * @route   GET /api/admin/chat/users
 * @desc    Fetch list of unique users with active chat conversations
 */
router.get('/chat/users', async (req, res) => {
    try {
        await connectDB();
        const uniqueUserIds = await ChatMessage.distinct('senderId', { sender: 'user' });

        const chatSessions = await Promise.all(uniqueUserIds.map(async (email: any) => {
            const [userProfile, lastMsg, unreadCount, pushSub] = await Promise.all([
                User.findOne({ email }).select('name email').lean(),
                ChatMessage.findOne({ senderId: email }).sort({ createdAt: -1 }).select('text timestamp createdAt').lean(),
                ChatMessage.countDocuments({ senderId: email, sender: 'user', isRead: { $ne: true } }),
                PushSubscription.findOne({ email: (email as string)?.toLowerCase() }).select('_id').lean()
            ]);

            return {
                email: email,
                name: userProfile?.name || email,
                lastMessage: lastMsg?.text || '',
                timestamp: lastMsg?.timestamp || '',
                createdAt: lastMsg?.createdAt || new Date(0),
                unreadCount: unreadCount,
                unread: unreadCount > 0,
                hasPushToken: !!pushSub
            };
        }));

        chatSessions.sort((a: any, b: any) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
        res.json({ success: true, chats: chatSessions });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   GET /api/admin/chat/unread-count
 */
router.get('/chat/unread-count', async (req, res) => {
    try {
        await connectDB();
        const count = await ChatMessage.countDocuments({ sender: 'user', isRead: false });
        res.json({ success: true, count });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   POST /api/admin/chat/read
 */
router.post('/chat/read', async (req, res) => {
    try {
        await connectDB();
        const { channel, reader, all } = req.body;
        if (!all && (!channel || !reader)) return res.status(400).json({ error: 'Missing parameters' });

        const senderToMarkAsRead = reader === 'admin' ? 'user' : 'admin';

        if (all) {
            await ChatMessage.updateMany({ sender: senderToMarkAsRead, isRead: { $ne: true } }, { $set: { isRead: true } });
        } else {
            await ChatMessage.updateMany({ channel, sender: senderToMarkAsRead, isRead: { $ne: true } }, { $set: { isRead: true } });
            // Notify specific channel
            try {
                const { pusher } = await import('../lib/pusher.js');
                await pusher.trigger(channel, 'messages-read', { reader, channel });
            } catch (e) {}
        }
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   GET /api/admin/chat/search
 */
router.get('/chat/search', async (req, res) => {
    try {
        await connectDB();
        const { query } = req.query;
        if (!query || (query as string).length < 2) return res.json({ success: true, users: [] });
        const users = await User.find({
            $or: [{ name: { $regex: query, $options: 'i' } }, { email: { $regex: query, $options: 'i' } }]
        }).select('name email').limit(10).lean();
        res.json({ success: true, users });
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Failed' });
    }
});

/**
 * @route   DELETE /api/admin/chat/delete
 */
router.delete('/chat/delete', async (req, res) => {
    try {
        await connectDB();
        const { channel, all } = req.query;
        if (all === 'true') {
            await ChatMessage.deleteMany({});
            return res.json({ success: true, message: 'All deleted' });
        } else if (channel) {
            await ChatMessage.deleteMany({ channel });
            return res.json({ success: true, message: `Deleted ${channel}` });
        }
        res.status(400).json({ error: 'Missing params' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
