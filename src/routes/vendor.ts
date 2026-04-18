import { Router } from 'express';
import { checkUserExists, updateUser, getUser } from '../lib/mongodbUtils.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * @route   POST /api/users/edit-vendor
 * @desc    Initial vendor onboarding
 */
router.post('/edit-vendor', authenticate, async (req: AuthRequest, res) => {
    try {
        const body = req.body;
        const { email, businessName, businessType, address } = body;

        if (!email || !businessName || !businessType || !address) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Security: Ensure they edit their own vendor profile
        if (req.user!.email !== email && req.user!.role !== 'admin') {
            return res.status(403).json({ error: "Forbidden" });
        }

        const vendorDetails = {
            businessName,
            businessType,
            address,
            taxId: body.taxId || "",
            instagram: body.instagram || "",
            facebook: body.facebook || "",
            twitter: body.twitter || "",
            googleBusiness: body.googleBusiness || "",
            youtube: body.youtube || ""
        };

        const exists = await checkUserExists(email);
        if (exists) {
            await updateUser(email, { vendorDetails, profileComplete: true, role: 'vendor' });
            res.json({ message: "Vendor profile saved successfully" });
        } else {
            res.status(400).json({ error: "User does not exist. Please sign up first." });
        }
    } catch (error: any) {
        res.status(500).json({ error: "Failed to save vendor profile" });
    }
});

/**
 * @route   PUT /api/vendor/update
 * @desc    Update existing vendor details
 */
router.put('/update', authenticate, async (req: AuthRequest, res) => {
    try {
        if (req.user!.role !== 'vendor' && req.user!.role !== 'admin') {
            return res.status(401).json({ error: 'Unauthorized: Vendor access required' });
        }

        const body = req.body;
        const { businessName, businessType, address } = body;

        if (!businessName || !businessType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const email = req.user!.email!;
        const existingUser = await getUser(email);
        if (!existingUser) return res.status(404).json({ error: 'User not found' });

        const updates = {
            vendorDetails: {
                ...existingUser.vendorDetails,
                businessName,
                businessType,
                address,
                instagram: body.instagram,
                facebook: body.facebook,
                twitter: body.twitter,
                googleBusiness: body.googleBusiness,
                youtube: body.youtube,
            }
        };

        const updatedUser = await updateUser(email, updates as any);
        if (!updatedUser) return res.status(500).json({ error: 'Update failed' });

        res.json({ message: 'Vendor details updated successfully', vendorDetails: updatedUser.vendorDetails });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
