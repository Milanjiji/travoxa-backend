import { Router } from 'express';
import { getUser } from '../lib/mongodbUtils.js';

const router = Router();

/**
 * Authentication Route Shell
 * Ported logic from NextAuth configuration in website
 */

// Login endpoint (following the logic in nextauth route)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`[Auth-Login] Login attempt for email: ${email}`);

  if (!email || !password) {
    console.warn(`[Auth-Login] Missing email or password`);
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  try {
    const FIREBASE_AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`;

    const response = await fetch(FIREBASE_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const data: any = await response.json();

    if (!response.ok) {
      console.error("❌ Firebase REST API error:", data.error?.message);
      return res.status(401).json({ success: false, error: data.error?.message || 'Authentication failed' });
    }

    // Fetch additional user data from DB
    console.log(`[Auth-Login] Firebase auth successful. Fetching DB user for: ${email}`);
    const dbUser = await getUser(email);
    console.log(`[Auth-Login] DB user found: ${!!dbUser}`);

    console.log(`[Auth-Login] Login successful for: ${email}`);
    res.json({
      success: true,
      user: {
        id: data.localId,
        email: data.email,
        name: data.displayName || data.email,
        role: dbUser?.role || 'user'
      },
      token: data.idToken, // This token can be used for subsequent requests
      expiresIn: data.expiresIn
    });

  } catch (error: any) {
    console.error("❌ [Auth-Login] Login error:", error.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Profile endpoint
router.get('/me', async (req, res) => {
  // In a real scenario, you'd verify the token here
  res.status(501).json({ error: 'Token verification not implemented yet. Use Firebase Admin SDK for this.' });
});

export default router;
