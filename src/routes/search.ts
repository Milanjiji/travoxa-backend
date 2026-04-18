import { Router } from 'express';
import { connectDB } from '../lib/mongodb.js';
import Tour from '../models/Tour.js';
import Stay from '../models/Stay.js';
import Rental from '../models/Rental.js';
import Sightseeing from '../models/Sightseeing.js';
import Activity from '../models/Activity.js';
import Attraction from '../models/Attraction.js';
import Food from '../models/Food.js';

const router = Router();

/**
 * @route   GET /api/search
 */
router.get('/', async (req, res) => {
    try {
        const query = (req.query.q as string) || '';
        const location = (req.query.location as string) || '';
        const full = req.query.full === 'true';

        await connectDB();

        const searchRegex = new RegExp(query, 'i');
        const locationRegex = location ? new RegExp(location, 'i') : null;

        const getFilter = (titleField: string = 'title', supportsLoc: boolean = true) => {
            const filters: any[] = [];
            if (query) filters.push({ [titleField]: searchRegex });
            if (location && supportsLoc) {
                filters.push({ $or: [{ location: locationRegex }, { city: locationRegex }, { state: locationRegex }, { area: locationRegex }] });
            }
            if (filters.length === 0) return {};
            if (filters.length === 1) return filters[0];
            return { $and: filters };
        };

        if (!query && !location) {
            return res.json({ success: true, data: full ? { tours: [], stays: [], rentals: [], sightseeing: [], activities: [], attractions: [], food: [] } : [] });
        }

        const [tours, stays, rentals, sightseeing, activities, attractions, food] = await Promise.all([
            Tour.find(getFilter('title')).limit(full ? 10 : 3).lean(),
            Stay.find(getFilter('title')).limit(full ? 10 : 3).lean(),
            Rental.find(getFilter('name')).limit(full ? 10 : 3).lean(),
            Sightseeing.find(getFilter('title')).limit(full ? 10 : 3).lean(),
            Activity.find(getFilter('title')).limit(full ? 10 : 3).lean(),
            Attraction.find(getFilter('title')).limit(full ? 10 : 3).lean(),
            Food.find(getFilter('title')).limit(full ? 10 : 3).lean(),
        ]);

        const mapId = (items: any[]) => items.map(item => ({ ...item, id: (item._id || item.id).toString() }));

        if (full) {
            return res.json({
                success: true,
                data: {
                    tours: mapId(tours), stays: mapId(stays), rentals: mapId(rentals),
                    sightseeing: mapId(sightseeing), activities: mapId(activities),
                    attractions: mapId(attractions), food: mapId(food)
                }
            });
        }

        const formatResults = (items: any[], category: string, titleField: string = 'title') => {
            return items.map(item => {
                let loc = item.location || item.city || item.state || item.area || '';
                if (loc && typeof loc === 'object') loc = (loc as any).name || (loc as any).address || '';
                return {
                    id: (item._id || item.id).toString(),
                    title: item[titleField],
                    category,
                    location: String(loc),
                    type: item.type || category,
                    slug: item.slug || ''
                };
            });
        };

        const results: any[] = [
            ...formatResults(tours, 'Tour'), ...formatResults(stays, 'Stay'),
            ...formatResults(rentals, 'Rental', 'name'), ...formatResults(sightseeing, 'Sightseeing'),
            ...formatResults(activities, 'Activity'), ...formatResults(attractions, 'Attraction'),
            ...formatResults(food, 'Food')
        ];

        // Scoring and Sorting
        results.sort((a, b) => {
            const t1 = (a.title || "").toLowerCase();
            const t2 = (b.title || "").toLowerCase();
            const q = query.toLowerCase();
            if (!q) return t1.localeCompare(t2);

            const score = (text: string, search: string) => {
                if (text === search) return 100;
                if (text.startsWith(search)) return 80;
                if (text.includes(search)) return 40;
                return 0;
            };

            const s1 = score(t1, q);
            const s2 = score(t2, q);
            return s1 !== s2 ? s2 - s1 : t1.localeCompare(t2);
        });

        res.json({ success: true, data: results.slice(0, 15) });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

export default router;
