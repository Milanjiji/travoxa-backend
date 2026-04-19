import { Router } from 'express';
import { connectDB } from '../lib/mongodb.js';
import User from '../models/User.js';
import BackpackerGroup from '../models/BackpackerGroup.js';
import TourRequest from '../models/TourRequest.js';
import SavedItem from '../models/SavedItem.js';
import Trip from '../models/Trip.js';
import { checkUserExists, createUser, updateUser, getAllUsers } from '../lib/mongodbUtils.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * @route   GET /api/users
 * @desc    Fetch user profile or dashboard data
 */
router.get('/', async (req, res) => {
  try {
    const { email: rawEmail, includeDashboard } = req.query;
    if (!rawEmail) return res.status(400).json({ error: "Email parameter is required" });

    const email = (rawEmail as string).trim().toLowerCase();
    await connectDB();

    const dbUser = await User.findOne({ email }).lean();
    if (!dbUser) return res.json({ exists: false, userData: null });

    if (includeDashboard !== 'true') {
      return res.json({ exists: true, userData: dbUser });
    }

    const userId = dbUser._id.toString();

    // Dashboard Data
    // NOTE: creatorId and members.id are stored as email strings (see groups.ts creation logic)
    const allUserGroups = await BackpackerGroup.find({
      $or: [
        { creatorId: email },
        { "members.id": email },
        { "requests": { $elemMatch: { userId: email, status: "pending" } } }
      ]
    }).sort({ createdAt: -1 }).lean();

    const formattedGroups = allUserGroups.map((group: any) => {
      let status = 'member';
      const isCreator = group.creatorId === email;
      const isMember = group.members.some((m: any) => m.id === email);
      const hasPendingRequest = group.requests?.some((r: any) => r.userId === email && r.status === 'pending');
      if (isCreator) status = 'created';
      else if (isMember) status = 'joined';
      else if (hasPendingRequest) status = 'requested';

      return {
        id: group._id.toString(),
        groupName: group.groupName,
        destination: group.destination,
        startDate: group.startDate,
        endDate: group.endDate,
        coverImage: group.coverImage,
        verified: group.verified,
        tripType: group.tripType,
        currentMembers: group.currentMembers,
        maxMembers: group.maxMembers,
        userStatus: status,
        pendingRequestCount: isCreator ? (group.requests?.filter((r: any) => r.status === 'pending').length || 0) : 0,
      };
    });

    const tourRequests = await TourRequest.find({ userId: userId }).sort({ createdAt: -1 }).lean();
    const savedItems = await SavedItem.find({ userId: email }).sort({ createdAt: -1 }).lean();

    res.json({
      success: true, exists: true,
      userData: {
        name: dbUser.name, email: dbUser.email, phone: dbUser.phone, city: dbUser.city,
        profileComplete: dbUser.profileComplete, interests: dbUser.interests || [],
        gender: dbUser.gender, bio: dbUser.bio, travelExperience: dbUser.travelExperience,
      },
      createdGroups: formattedGroups,
      tourRequests: tourRequests.map((r: any) => ({ ...r, id: r._id.toString(), tourId: r.tourId.toString() })),
      savedItems: savedItems.map((i: any) => ({ ...i, id: i._id.toString() }))
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

/**
 * @route   POST /api/users
 * @desc    Save/Sync user data
 */
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    if (!body.email || !body.name || !body.gender) return res.status(400).json({ error: "Missing required fields" });

    const email = body.email.trim().toLowerCase();
    const exists = await checkUserExists(email);
    if (exists) await updateUser(email, body);
    else await createUser(body);

    res.json({ message: "User data saved successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save user data" });
  }
});

/**
 * @route   POST /api/users/edit
 */
router.post('/edit', authenticate, async (req: AuthRequest, res) => {
  try {
    const authReq = req as AuthRequest;
    const body = req.body;
    if (!body.email || !body.name || !body.gender || !body.city) return res.status(400).json({ error: "Missing required fields" });
    
    // Security check: ensure they are editing their own profile or are admin
    if (authReq.user!.email !== body.email && authReq.user!.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden: You can only edit your own profile" });
    }

    const exists = await checkUserExists(body.email);
    if (exists) await updateUser(body.email, body);
    else await createUser(body);

    res.json({ message: "User profile saved successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save profile" });
  }
});

/**
 * @route   POST /api/users/notifications/mark-seen
 */
router.post('/notifications/mark-seen', authenticate, async (req: AuthRequest, res) => {
  try {
    await connectDB();
    const authReq = req as AuthRequest;
    await User.updateOne({ email: authReq.user!.email }, { $set: { "notifications.$[].seen": true } });
    res.json({ success: true, message: 'Notifications marked as seen' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @route   POST /api/users/block
 */
router.post('/block', authenticate, async (req: AuthRequest, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: "Missing targetUserId" });
    
    await connectDB();
    const authReq = req as AuthRequest;
    const user = await User.findOne({ email: authReq.user!.email });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.blockedUserIds) user.blockedUserIds = [];
    if (!user.blockedUserIds.includes(targetUserId)) {
      user.blockedUserIds.push(targetUserId);
      await user.save();
    }
    res.json({ success: true, message: "User blocked successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route   GET /api/users/check
 */
router.get('/check', async (req, res) => {
  try {
    const email = (req.query.email as string)?.trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "Email required" });
    const exists = await checkUserExists(email);
    res.json({ exists });
  } catch (error) {
    res.status(500).json({ error: "Check failed" });
  }
});

/**
 * @route   DELETE /api/users
 */
router.delete('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const authReq = req as AuthRequest;
    const email = authReq.user!.email;
    await connectDB();
    const dbUser = await User.findOne({ email });
    if (!dbUser) return res.status(404).json({ error: "User not found" });

    const userId = dbUser._id;
    const userIdString = userId.toString();

    await SavedItem.deleteMany({ userId: email });
    await TourRequest.deleteMany({ userId: userId });
    await Trip.deleteMany({ userId: userId });
    await BackpackerGroup.deleteMany({ $or: [{ creatorId: userIdString }, { creatorId: email }] });
    await BackpackerGroup.updateMany({}, { $pull: { members: { id: userIdString }, requests: { userId: userIdString }, comments: { authorId: userIdString } } });
    await User.deleteOne({ _id: userId });

    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ error: "Deletion failed" });
  }
});

export default router;
