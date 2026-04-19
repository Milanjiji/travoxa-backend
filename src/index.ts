import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { connectDB } from './lib/mongodb.js';
import aiRoutes from './routes/ai.js';
import authRoutes from './routes/auth.js';
import toursRouter from './routes/tours.js';
import rentalsRouter from './routes/rentals.js';
import sightseeingRouter from './routes/sightseeing.js';
import activitiesRouter from './routes/activities.js';
import discoveryRouter from './routes/discovery.js';
import usersRouter from './routes/users.js';
import vendorRouter from './routes/vendor.js';
import groupsRouter from './routes/groups.js';
import blogsRouter from './routes/blogs.js';
import adminRouter from './routes/admin.js';
import pusherRouter from './routes/pusher.js';
import searchRouter from './routes/search.js';
import citiesRouter from './routes/cities.js';
import miscRouter from './routes/misc.js';
import travelJournalsRouter from './routes/travelJournals.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://travoxa.in',
  'https://www.travoxa.in',
  'https://travoxa-web.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.CORS_ORIGIN === origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Enhanced Request logging
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`\n--- [${new Date().toISOString()}] ${req.method} ${req.path} ---`);
  if (Object.keys(req.query).length) console.log(`Query:`, req.query);
  if (req.body && Object.keys(req.body).length) {
    const bodyClone = { ...req.body };
    if (bodyClone.password) bodyClone.password = '******'; // Sensitive data protection
    console.log(`Body:`, bodyClone);
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`--- [Done] ${req.method} ${req.path} | Status: ${res.statusCode} | Duration: ${duration}ms ---\n`);
  });

  next();
});

// Routes
app.use('/api', aiRoutes); // Handles /ai-recommendations, /ai-planner, etc.
app.use('/api/auth', authRoutes);
app.use('/api/tours', toursRouter);
app.use('/api/rentals', rentalsRouter);
app.use('/api/sightseeing', sightseeingRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api', discoveryRouter); // Handles attractions, food, stay, helplines
app.use('/api/users', usersRouter);
app.use('/api/vendor', vendorRouter);
app.use('/api/users', vendorRouter); // Alias — web project uses /api/users/edit-vendor
app.use('/api/blogs', blogsRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/backpackers/group', groupsRouter); // Shared logic for backpacker paths
app.use('/api/admin', adminRouter);
app.use('/api/pusher', pusherRouter);
app.use('/api/search', searchRouter);
app.use('/api/cities', citiesRouter);
app.use('/api', miscRouter); // Handles contact, team, push, waitlist, save, trips, home-cities
app.use('/api/travel-journals', travelJournalsRouter);

// Root route
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: #f8fafc;">
      <h1 style="font-size: 3rem; margin-bottom: 0.5rem; background: linear-gradient(to right, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Travoxa API</h1>
      <p style="font-size: 1.25rem; color: #94a3b8;">Standalone backend service is up and running.</p>
      <div style="margin-top: 2rem; padding: 1rem; background: #1e293b; border-radius: 0.5rem; border: 1px solid #334155;">
        <code>Status: <span style="color: #4ade80;">Active</span></code>
      </div>
    </div>
  `);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connect to DB and start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
};

startServer();
