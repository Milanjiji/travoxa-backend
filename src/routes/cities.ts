import { Router } from 'express';
import { connectDB } from '../lib/mongodb.js';
import Tour from '../models/Tour.js';
import Sightseeing from '../models/Sightseeing.js';
import Rental from '../models/Rental.js';
import Stay from '../models/Stay.js';
import Activity from '../models/Activity.js';

const router = Router();

/**
 * @route   GET /api/cities
 * @desc    Fetch unique list of cities from all active listings
 */
router.get('/', async (req, res) => {
    try {
        await connectDB();

        const [tours, sightseeing, rentals, stays, activities] = await Promise.all([
            Tour.distinct('location', { status: 'approved' }),
            Sightseeing.distinct('city', { status: 'approved' }),
            Rental.distinct('city', { status: 'approved' }),
            Stay.distinct('city', { status: 'approved' }),
            Activity.distinct('city', { status: 'approved' })
        ]);

        const allCities = new Set<string>();

        // Process Tours (location field often "City, State")
        tours.forEach(loc => {
            if (loc) {
                const city = loc.split(',')[0].trim();
                if (city) allCities.add(city);
            }
        });

        // Process standard city fields
        [...sightseeing, ...rentals, ...stays, ...activities].forEach(city => {
            if (city) {
                const trimmedCity = (city as string).trim();
                if (trimmedCity) allCities.add(trimmedCity);
            }
        });

        const sortedCities = Array.from(allCities).sort();
        res.json({ success: true, data: sortedCities });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch cities' });
    }
});

export default router;
