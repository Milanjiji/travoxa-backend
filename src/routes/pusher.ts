import { Router } from 'express';
import { pusher } from '../lib/pusher.js';
import { connectDB } from '../lib/mongodb.js';
import ChatMessage from '../models/ChatMessage.js';
import PushSubscription from '../models/PushSubscription.js';
import { messaging } from '../lib/firebaseAdmin.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * @route   POST /api/pusher/message
 * @desc    Receive message, save to DB, broadcast via Pusher, and send FCM
 */
router.post('/message', async (req, res) => {
    try {
        await connectDB();
        const { message, sender, senderId, receiverId, channel, id, timestamp, event, imageUrl } = req.body;
        const eventName = event || 'new-message';

        if ((!message && !imageUrl) || !sender || !channel) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // 1. Persistence
        let chatEntry = null;
        if (eventName === 'new-message') {
            chatEntry = await ChatMessage.create({
                text: message || '',
                sender, senderId, receiverId, channel, imageUrl, id, timestamp,
                createdAt: new Date()
            });
        }

        // 2. Pusher Broadcast
        await pusher.trigger(channel, eventName, { id, text: message || '', sender, senderId, timestamp, imageUrl });
        
        if (sender === 'user') {
            await pusher.trigger('admin-notifications', 'new-message', { id, text: message || '', sender, senderId, timestamp, imageUrl, channel });
        } else if (sender === 'admin' && messaging) {
            // 3. FCM Push for User
            try {
                const subs = await PushSubscription.find({ email: receiverId?.toLowerCase() });
                const tokens = subs.map(s => s.token);
                if (tokens.length > 0) {
                    const response = await messaging.sendEachForMulticast({
                        tokens,
                        notification: { title: 'Travoxa Support', body: message || 'You received a new image message.' },
                        data: { channel, type: 'chat_message' }
                    });
                    
                    // Cleanup failed tokens
                    const failed = response.responses.map((r, i) => !r.success ? tokens[i] : null).filter(Boolean);
                    if (failed.length > 0) await PushSubscription.deleteMany({ token: { $in: failed } });
                }
            } catch (err) { console.error('FCM Error:', err); }
        }

        res.json({ success: true, data: chatEntry });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   GET /api/pusher/message
 * @desc    Fetch chat history
 */
router.get('/message', async (req, res) => {
    try {
        await connectDB();
        const { channel } = req.query;
        if (!channel) return res.status(400).json({ error: 'Channel required' });

        const history = await ChatMessage.find({ channel }).sort({ createdAt: 1 }).limit(50).lean();
        res.json({ success: true, history });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
