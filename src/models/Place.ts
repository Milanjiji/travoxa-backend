import mongoose from 'mongoose';

const PlaceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
    },
    category: {
        type: String,
        required: [true, 'Please provide a category'],
        index: true,
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point',
        },
        coordinates: {
            type: [Number], // [lng, lat]
            required: true,
        },
    },
    district: String,
    area: String,
    tags: {
        type: [String],
        default: [],
        index: true,
    },
    description: String,
    image: String,
    source: {
        type: String,
        enum: ['osm', 'wiki', 'manual'],
        default: 'manual',
    },
    osmId: {
        type: String,
        unique: true,
        sparse: true,
    },
    elevation: {
        type: Number,
        default: 0,
    },
    googleMapsLink: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Add 2dsphere index for location-based queries
PlaceSchema.index({ location: '2dsphere' });

// Ensure no duplicate places based on name and district/area
PlaceSchema.index({ name: 1, district: 1, area: 1 }, { unique: true });

export default mongoose.models.Place || mongoose.model('Place', PlaceSchema);
