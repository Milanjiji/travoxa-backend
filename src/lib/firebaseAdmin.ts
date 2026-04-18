import * as admin from 'firebase-admin';

// Protect against multiple initializations
if (!admin.apps.length) {
    try {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;

        if (projectId && clientEmail && privateKey) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: projectId,
                    clientEmail: clientEmail,
                    // Replace literal \n with actual newlines
                    privateKey: privateKey.replace(/\\n/g, '\n'),
                }),
            });
            console.log('[FirebaseAdmin] Initialized successfully');
        } else {
            console.warn('[FirebaseAdmin] Initialization failed - Missing variables:', {
                projectId: !!projectId,
                clientEmail: !!clientEmail,
                privateKey: !!privateKey
            });
            console.warn('Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in Vercel.');
        }
    } catch (error) {
        console.error('Firebase Admin initialization error', error);
    }
}

export const messaging = admin.apps.length ? admin.messaging() : null;
