import { Router } from 'express';
import { connectDB } from '../lib/mongodb.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import SupportTicket from '../models/SupportTicket.js';
import HomeCity from '../models/HomeCity.js';
import TeamMember from '../models/TeamMember.js';
import Journey from '../models/Journey.js';
import PushSubscription from '../models/PushSubscription.js';
import CircleWaitlist from '../models/CircleWaitlist.js';
import SavedItem from '../models/SavedItem.js';
import Trip from '../models/Trip.js';
import { generateAIResponse } from '../lib/ai-service.js';
import { fetchPlaceDetails } from '../utils/wikipedia.js';
import AIConfig from '../models/AIConfig.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const router = Router();

// --- Support / Contact ---
router.post('/contact', async (req, res) => {
    try {
        await connectDB();
        const { name, email, phone, message } = req.body;
        if (!name || !email || !message) return res.status(400).json({ error: "Missing fields" });
        const ticket = await SupportTicket.create({ name, email, phone, message });
        res.status(201).json({ message: "Ticket created", ticket });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Home Cities ---
router.get('/home-cities', async (req, res) => {
    try {
        await connectDB();
        const cities = await HomeCity.find({}).sort({ createdAt: 1 });
        res.json({ success: true, data: cities });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/home-cities', authenticate, async (req, res) => {
    try {
        await connectDB();
        const city = await HomeCity.create(req.body);
        res.status(201).json({ success: true, data: city });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/home-cities/generate-places', async (req, res) => {
    try {
        const { cityId, cityName, lat, lon } = req.body;
        await connectDB();
        const city = await HomeCity.findById(cityId);
        if (!city) return res.status(404).json({ error: "Not found" });

        if ((city.touristPlaces || []).length >= 6) {
            return res.json({ success: true, data: city.touristPlaces, source: 'cache' });
        }

        const config = await AIConfig.findOne({});
        const prompt = (config?.cityPromptTemplate || "Find top 10 sightseeing places in {cityName}").replace('{cityName}', cityName);
        
        const aiResponse = await generateAIResponse([
            { role: 'system', content: 'Output raw JSON array of places only.' },
            { role: 'user', content: prompt }
        ], { response_format: { type: 'json_object' } });

        let aiPlaces = JSON.parse(aiResponse.content || '[]');
        if (!Array.isArray(aiPlaces)) aiPlaces = aiPlaces.places || aiPlaces.recommendations || [];

        const enriched = await Promise.all(aiPlaces.map(async (p: any) => {
            const wiki = await fetchPlaceDetails(p.name);
            return {
                _id: new mongoose.Types.ObjectId().toHexString(),
                name: p.name,
                description: wiki.summary || p.description,
                image: wiki.image,
                location: { type: "Point", coordinates: [p.lon || 0, p.lat || 0] },
                category: p.category || 'Sightseeing',
                source: 'city_ai'
            };
        }));

        city.touristPlaces = [...(city.touristPlaces || []), ...enriched];
        await city.save();
        res.json({ success: true, data: city.touristPlaces });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Team & Journey ---
router.get('/team', async (req, res) => {
    try {
        await connectDB();
        const members = await TeamMember.find({}).select('-password').sort({ createdAt: 1 });
        res.json({ success: true, data: members });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/team', async (req, res) => {
    try {
        await connectDB();
        const data = req.body;
        if (data.password) data.password = await bcrypt.hash(data.password, 10);
        const member = await TeamMember.create(data);
        const obj = member.toObject();
        delete obj.password;
        res.status(201).json({ success: true, data: obj });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/journey', async (req, res) => {
    try {
        await connectDB();
        const items = await Journey.find().sort({ order: 1 });
        res.json({ success: true, data: items });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Push & Waitlist ---
router.post('/mobile-push/register', async (req, res) => {
    try {
        await connectDB();
        const { email, token, platform } = req.body;
        const sub = await PushSubscription.findOneAndUpdate(
            { token },
            { email: email.toLowerCase(), platform, updatedAt: new Date() },
            { upsert: true, new: true }
        );
        res.json({ success: true, data: sub });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/circle-waitlist', async (req, res) => {
    try {
        await connectDB();
        const exists = await CircleWaitlist.findOne({ email: req.body.email?.toLowerCase() });
        if (exists) return res.json({ message: "Already joined" });
        await CircleWaitlist.create({ email: req.body.email });
        res.status(201).json({ message: "Joined" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Saved Items & Trips ---
router.use(identifyUser);

router.post('/save', async (req, res) => {
    try {
        await connectDB();
        const { itemId, itemType, title, itemLink, email } = req.body;
        
        // Identity: Token or Body (email) (Backcompat)
        let userId = (req as AuthRequest).user?.email || email;

        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized: User identification required' });
        
        const existing = await SavedItem.findOne({ userId, itemId, itemType });
        if (existing) {
            await SavedItem.deleteOne({ _id: existing._id });
            return res.json({ saved: false });
        }
        await SavedItem.create({ userId, itemId, itemType, title, itemLink });
        res.json({ saved: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/save', async (req, res) => {
    try {
        await connectDB();
        const { itemId, itemType, email } = req.query;
        
        let userId = (req as AuthRequest).user?.email || (email as string);

        if (!userId) return res.status(401).json({ error: "Missing email identification" });

        if (itemId && itemType) {
            const exists = await SavedItem.findOne({ userId, itemId, itemType });
            return res.json({ saved: !!exists });
        }
        const items = await SavedItem.find({ userId }).sort({ createdAt: -1 });
        res.json({ success: true, data: items });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/trips', async (req, res) => {
    try {
        await connectDB();
        const { email } = req.query;
});

export default router;
