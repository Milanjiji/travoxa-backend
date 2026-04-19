import { Router } from 'express';
import BackpackerGroup from '../models/BackpackerGroup.js';
import User from '../models/User.js';
import { connectDB } from '../lib/mongodb.js';
import { getUser, getUserById, checkUserExists } from '../lib/mongodbUtils.js';
import { identifyUser, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(identifyUser);

/**
 * Helper to create host profile
 */
async function createHostProfile(creatorId: string) {
    try {
        const user = await getUser(creatorId);
        const name = user?.name || creatorId;
        return {
            id: creatorId,
            name,
            handle: `@${name.toLowerCase().replace(/\s+/g, "")}`,
            verificationLevel: "Pending verification",
            pastTripsHosted: 0,
            testimonials: [],
            bio: "Host will update their bio soon.",
            avatarColor: "#34d399",
        };
    } catch (error) {
        return {
            id: creatorId,
            name: creatorId,
            handle: `@${creatorId.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
            verificationLevel: "Pending verification",
            pastTripsHosted: 0,
            testimonials: [],
            bio: "Host will update their bio soon.",
            avatarColor: "#34d399",
        };
    }
}

/**
 * @route   GET /api/groups
 */
router.get('/', async (req, res) => {
    try {
        await connectDB();
        const { admin, userId } = req.query;
        const showAll = admin === 'true';

        const query: any = showAll ? {} : { verified: true, isAutoHidden: { $ne: true } };

        if (!showAll && userId) {
            query["reports.reporterId"] = { $ne: userId };
            const user = await User.findOne({ $or: [{ _id: (userId as string).length === 24 ? userId : null }, { email: userId }] });
            if (user?.blockedUserIds?.length) {
                query.creatorId = { $nin: user.blockedUserIds };
            }
        }

        const mongoGroups = await BackpackerGroup.find(query).sort({ createdAt: -1 });
        const groups = await Promise.all(mongoGroups.map(async (group: any) => ({
            ...group.toObject(),
            id: group.id || group._id.toString(),
            hostProfile: await createHostProfile(group.creatorId),
        })));

        res.json({ groups });
    } catch (error: any) {
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @route   POST /api/groups
 */
router.post('/', async (req, res) => {
    try {
        await connectDB();
        const payload = req.body;
        
        // Identify creator: Token or Body (creatorId/email) (Backcompat)
        const creatorId = req.user?.email || payload.creatorId || payload.email || payload.userId;

        if (!creatorId) return res.status(401).json({ error: "Unauthorized: User email required" });

        const start = new Date(payload.startDate);
        const end = new Date(payload.endDate);
        const duration = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (86400000)));
        const totalCost = Object.values(payload.estimatedCosts ?? {}).reduce((sum: any, val: any) => sum + val, 0);

        const id = payload.groupName.toLowerCase().replace(/[^a-z0-9]+/g, "-").concat("-", Date.now().toString(36));
        const hostProfile = await createHostProfile(creatorId);

        const mongoGroup = new BackpackerGroup({
            ...payload, id, duration, avgBudget: totalCost,
            creatorId, currentMembers: 1,
            members: [{ id: creatorId, name: hostProfile.name, avatarColor: hostProfile.avatarColor, role: "host", expertise: "Trip curator" }],
            hostProfile,
            verified: payload.tripSource === "hosted",
        });

        const saved = await mongoGroup.save();
        res.status(201).json({ group: saved, message: "Group created" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   GET /api/groups/:id
 */
router.get('/:id', async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        let group = await BackpackerGroup.findById(id);
        if (!group) group = await BackpackerGroup.findOne({ id });
        if (!group) return res.status(404).json({ error: "Group not found" });
        res.json({ group });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @route   POST /api/groups/report
 */
router.post('/report', async (req, res) => {
    try {
        await connectDB();
        const { groupId, reason, email } = req.body;
        
        let reporterId = email;
        try {
            const { authenticate } = await import('../middleware/auth.js');
            const authReq = req as AuthRequest;
            await new Promise((resolve) => authenticate(authReq, res as any, (err) => {
                if (!err && authReq.user) reporterId = authReq.user.email;
                resolve(null);
            }));
        } catch (e) {}

        if (!reporterId) return res.status(401).json({ error: "Unauthorized" });

        let group = await BackpackerGroup.findById(groupId);
        if (!group) group = await BackpackerGroup.findOne({ id: groupId });
        if (!group) return res.status(404).json({ error: "Group not found" });

        if (group.reports.some((r: any) => r.reporterId === reporterId)) {
            return res.json({ message: "Already reported" });
        }

        group.reports.push({ reporterId, reason, createdAt: new Date() });
        group.reportCount = (group.reportCount || 0) + 1;
        if (group.reportCount >= 5) group.isAutoHidden = true;
        await group.save();

        res.json({ success: true, message: "Reported" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @route   POST /api/backpackers/group/:id/join
 */
router.post('/:id/join', async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        const { note, email } = req.body;
        
        let mongoUserId = email;
        try {
            const { authenticate } = await import('../middleware/auth.js');
            const authReq = req as AuthRequest;
            await new Promise((resolve) => authenticate(authReq, res as any, (err) => {
                if (!err && authReq.user) mongoUserId = authReq.user.email;
                resolve(null);
            }));
        } catch (e) {}

        if (!mongoUserId) return res.status(401).json({ error: "Unauthorized" });

        let group = await BackpackerGroup.findById(id);
        if (!group) group = await BackpackerGroup.findOne({ id });

        if (!group) return res.status(404).json({ error: "Group not found" });
        if (group.members.some((m: any) => m.id === mongoUserId)) return res.status(400).json({ error: "Already a member" });
        if (group.requests?.some((r: any) => r.userId === mongoUserId && r.status === "pending")) return res.status(400).json({ error: "Already requested" });
        if (group.currentMembers >= group.maxMembers) return res.status(400).json({ error: "Group full" });

        const newRequest = { id: `req_${Date.now().toString(36)}`, userId: mongoUserId, status: "pending", createdAt: new Date(), note };
        await BackpackerGroup.updateOne({ _id: group._id }, { $push: { requests: newRequest } });

        res.json({ message: "Requested", request: newRequest });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @route   POST /api/backpackers/group/:id/requests/:requestId/approve
 */
router.post('/:id/requests/:requestId/approve', async (req, res) => {
    try {
        await connectDB();
        const { id, requestId } = req.params;
        const { email } = req.body;
        
        let approverId = email;
        try {
            const { authenticate } = await import('../middleware/auth.js');
            const authReq = req as AuthRequest;
            await new Promise((resolve) => authenticate(authReq, res as any, (err) => {
                if (!err && authReq.user) approverId = authReq.user.email;
                resolve(null);
            }));
        } catch (e) {}

        if (!approverId) return res.status(401).json({ error: "Unauthorized" });

        let group = await BackpackerGroup.findById(id);
        if (!group) group = await BackpackerGroup.findOne({ id });
        if (!group) return res.status(404).json({ error: "Group not found" });

        // Auth check: Host only
        const isHost = group.members.some((m: any) => m.id === approverId && (m.role === "host" || m.role === "co-host"));
        if (!isHost && group.creatorId !== approverId) return res.status(403).json({ error: "Unauthorized" });

        const joinRequest = group.requests.id(requestId);
        if (!joinRequest || joinRequest.status !== "pending") return res.status(400).json({ error: "Invalid request" });
        if (group.currentMembers >= group.maxMembers) return res.status(400).json({ error: "Group full" });

        const memberUser = await getUser(joinRequest.userId);
        const newMember = { id: joinRequest.userId, name: memberUser?.name || joinRequest.userId, avatarColor: "#c084fc", role: "member", expertise: "Explorer" };

        group.members.push(newMember);
        group.currentMembers += 1;
        joinRequest.status = "approved";
        await group.save();

        // Notification
        if (memberUser) {
            await User.updateOne({ email: joinRequest.userId }, { $push: { notifications: { senderId: approverId, message: `Approved for "${group.groupName}"!`, seen: false, createdAt: new Date() } } });
        }

        res.json({ message: "Approved", member: newMember });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @route   POST /api/groups/:id/comments
 */
router.post('/:id/comments', async (req, res) => {
    try {
        await connectDB();
        const { text, email } = req.body;
        const { id } = req.params;
        
        let authorId = email;
        try {
            const { authenticate } = await import('../middleware/auth.js');
            const authReq = req as AuthRequest;
            await new Promise((resolve) => authenticate(authReq, res as any, (err) => {
                if (!err && authReq.user) authorId = authReq.user.email;
                resolve(null);
            }));
        } catch (e) {}

        if (!authorId) return res.status(401).json({ error: "Unauthorized" });

        let group = await BackpackerGroup.findById(id);
        if (!group) group = await BackpackerGroup.findOne({ id });
        if (!group) return res.status(404).json({ error: "Group not found" });

        const isHost = group.creatorId === authorId;
        const newComment = {
            id: `cmt_${Date.now().toString(36)}`,
            authorId: authorId,
            authorName: authorId.split('@')[0],
            avatarColor: isHost ? "#f59e0b" : "#34d399",
            text: text.trim(),
            createdAt: new Date(),
            likes: 0,
            roleLabel: isHost ? "Host" : "Explorer",
        };

        group.comments.unshift(newComment);
        await group.save();
        res.status(201).json({ comment: newComment });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

export default router;
