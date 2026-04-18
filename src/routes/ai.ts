import { Router } from 'express';
import { generateAIResponse } from '../lib/ai-service.js';
import { connectDB } from '../lib/mongodb.js';
import AIConfig from '../models/AIConfig.js';
import RecommendationCache from '../models/RecommendationCache.js';
import { fetchPlaceDetails } from '../utils/wikipedia.js';
import { PHASE_PROMPTS, QuestionnairePhase } from '../lib/ai-trip-planner/prompts.js';
import mongoose from 'mongoose';

const router = Router();

// Haversine formula for distance calculation in KM
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Recommendations Endpoint
 * Supports both /api/ai-recommendations and /api/ai/recommendations
 */
router.post(['/ai-recommendations', '/ai/recommendations'], async (req, res) => {
    try {
        const { primaryType, secondaryTypes, departure } = req.body;
        console.log(`[AI-Recommendation] Started for type: ${primaryType} near ${departure.lat}, ${departure.lon}`);
        if (!primaryType || !departure) {
            console.warn(`[AI-Recommendation] Missing fields: primaryType=${!!primaryType}, departure=${!!departure}`);
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        await connectDB();

        // Prepare Cache Key
        const sortedSecondaries = secondaryTypes && secondaryTypes.length > 0 ? [...secondaryTypes].sort().join('-') : 'none';
        const cacheKey = `ai_v2-${primaryType}-${sortedSecondaries}-${departure.lat.toFixed(2)}-${departure.lon.toFixed(2)}`;
        
        const cachedResult = await RecommendationCache.findOne({ key: cacheKey });
        const existingPayload = (cachedResult && cachedResult.rawPayload) ? cachedResult.rawPayload : [];
        
        if (existingPayload.length > 0) {
            console.log(`[AI-Recommendation] Cache hit for key: ${cacheKey}`);
        } else {
            console.log(`[AI-Recommendation] Cache miss. Fetching fresh results...`);
        }
        
        const config = await AIConfig.findOne({});
        if (!config || (config.provider === 'openrouter' && !config.apiKey) || (config.provider === 'google' && !config.googleApiKey)) {
            return res.status(500).json({ success: false, error: `AI ${config?.provider || 'OpenRouter'} API Key is not configured.` });
        }

        let userPrompt = config.promptTemplate || `Find top 5 location recommendations for primaryType: {primaryType} near {lat}, {lon}. Return JSON array.`;
        userPrompt = userPrompt.replace(/\{primaryType\}/g, primaryType || '')
                               .replace(/\{lat\}/g, departure.lat.toString() || '')
                               .replace(/\{lon\}/g, departure.lon.toString() || '')
                               .replace(/\{departureName\}/g, departure.name || '');

        let aiResponse;
        try {
            console.log(`[AI-Recommendation] Sending prompt to AI: ${userPrompt.substring(0, 100)}...`);
            aiResponse = await generateAIResponse([
                { role: 'system', content: 'You are a precise AI travel assistant. You ONLY output an array of raw JSON objects.' },
                { role: 'user', content: userPrompt }
            ], { response_format: { type: 'json_object' } });
            console.log(`[AI-Recommendation] AI responded successfully.`);
        } catch (apiError: any) {
            console.error(`[AI-Recommendation] API Error:`, apiError.message);
            if (existingPayload.length > 0) {
                console.log(`[AI-Recommendation] Falling back to existing cache.`);
                return res.json({ success: true, data: existingPayload, source: 'cache_fallback' });
            }
            throw apiError;
        }

        let messageContent = aiResponse.content || '[]';
        messageContent = messageContent.replace(/```json/g, '').replace(/```/g, '').trim();

        let aiPlaces = JSON.parse(messageContent);
        if (!Array.isArray(aiPlaces)) {
            if (aiPlaces.recommendations) aiPlaces = aiPlaces.recommendations;
            else if (aiPlaces.places) aiPlaces = aiPlaces.places;
            else aiPlaces = [aiPlaces];
        }

        const freshResults = await Promise.all(aiPlaces.map(async (place: any, index: number) => {
            try {
                const lat = parseFloat(place.lat) || (place.location?.coordinates?.[1]) || departure.lat;
                const lon = parseFloat(place.lon) || (place.location?.coordinates?.[0]) || departure.lon;
                const dist = place.distance_km || place.distance || calculateDistance(departure.lat, departure.lon, lat, lon);

                let wiki = { summary: '', image: '' };
                if (index < 6 && place.name) wiki = await fetchPlaceDetails(place.name);

                return {
                    _id: new mongoose.Types.ObjectId().toHexString(),
                    name: place.name || "Unknown Place",
                    description: wiki.summary || place.highlight || place.description || "A beautiful place to visit.",
                    image: wiki.image || place.image || null,
                    location: { type: "Point", coordinates: [lon, lat] },
                    distance: dist,
                    category: place.category || primaryType,
                    tags: [primaryType, ...(secondaryTypes || [])],
                    source: 'ai_direct',
                    score: (100 - index)
                };
            } catch (err) { return null; }
        }));

        const validFreshResults = freshResults.filter((p): p is NonNullable<typeof p> => p !== null && p.name !== "Unknown Place");
        const finalResults = validFreshResults.slice(0, 12);

        if (finalResults.length > 0) {
            await RecommendationCache.updateOne({ key: cacheKey }, { 
                $set: { rawPayload: finalResults, preferences: { primaryType, secondaryTypes, departure } }
            }, { upsert: true });
        }

        console.log(`[AI-Recommendation] Completed. Returning ${finalResults.length} locations.`);
        res.json({ success: true, data: finalResults, source: validFreshResults.length > 0 ? 'fresh_ai' : 'cache_only' });
    } catch (error: any) {
        console.error(`[AI-Recommendation] Error:`, error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Trip Planner Questionnaire Endpoint
 * Supports both /api/ai-planner and /api/ai/planner
 */
router.post(['/ai-planner', '/ai/planner'], async (req, res) => {
    try {
        const { messages, current_profile, current_phase } = req.body;
        const phase = current_phase || QuestionnairePhase.ORIGIN;
        const systemPrompt = PHASE_PROMPTS[phase as QuestionnairePhase] || PHASE_PROMPTS[QuestionnairePhase.ORIGIN];
        const currentProfile = current_profile || {};

        const prompt = `${systemPrompt}\n\n**Current Profile State:**\n${JSON.stringify(currentProfile, null, 2)}\n\n**Conversation History:**\n${JSON.stringify(messages?.slice(-10) || [], null, 2)}`;

        const completion = await generateAIResponse([
            { role: "system", content: "You are a smart travel assistant that outputs JSON." },
            { role: "user", content: prompt },
        ], { response_format: { type: "json_object" } });

        console.log(`[AI-Planner] Response sent successfully.`);
        res.json(JSON.parse(completion.content || "{}"));
    } catch (error: any) {
        console.error(`[AI-Planner] Error:`, error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
