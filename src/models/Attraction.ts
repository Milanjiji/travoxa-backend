import mongoose from 'mongoose';

const OpeningSlotSchema = new mongoose.Schema({
    start: String,
    end: String,
}, { _id: false });

const DailyScheduleSchema = new mongoose.Schema({
    slots: { type: [OpeningSlotSchema], default: [] },
    isClosed: { type: Boolean, default: false },
    note: String,
}, { _id: false });

const ReachOptionSchema = new mongoose.Schema({
    type: { type: String, required: true }, // Metro, Bus, Cab, Train, Airport, Ferry, etc.
    station: String,
    distance: String,
    fare: String,
    minFare: Number,
    maxFare: Number,
    time: String,
    availability: String,
    fareRange: String,
    routeNote: String,
}, { _id: false });

const EntryPriceSchema = new mongoose.Schema({
    category: { type: String, required: true }, // Adult, Child, Foreigner, Camera, etc.
    price: { type: Number },
    minPrice: Number,
    maxPrice: Number,
    notes: String,
}, { _id: false });

const ExtraChargeSchema = new mongoose.Schema({
    item: { type: String, required: true }, // Guide, Parking, Boating, etc.
    priceRange: String,
    note: String
}, { _id: false });

const AttractionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide an attraction title'],
        maxlength: [150, 'Title cannot be more than 150 characters'],
    },
    city: {
        type: String,
        required: [true, 'Please provide a city'],
    },
    state: {
        type: String,
        required: [true, 'Please provide a state'],
    },
    visitDuration: {
        type: String,
        required: [true, 'Please provide a visit duration (e.g. 2-3 hours)'],
    },
    entryFee: {
        type: Number,
        required: [true, 'Please provide an entry fee (0 for free)'],
    },
    overview: {
        type: String,
        required: [true, 'Please provide an overview'],
    },
    highlights: {
        type: [String],
        default: [],
    },
    openingHours: {
        type: String,
        required: [true, 'Please provide opening hours'],
    },
    bestTime: {
        type: String, // Best time to visit e.g. "Morning", "Evening", "Oct-Mar"
        required: false
    },
    image: {
        type: String,
        required: false,
    },
    rating: {
        type: Number,
        default: 0,
    },
    reviews: {
        type: Number,
        default: 0,
    },
    category: {
        type: String, // e.g., Historical, Modern
        required: [true, 'Please provide a category'],
    },
    type: {
        type: String, // e.g., Palace, Museum
        required: [true, 'Please provide a type'],
    },
    // Extensive New Fields
    badges: {
        type: [String],
        default: [], // Popular, Free Entry, Night View, Family Friendly, Featured, Verified, etc.
    },
    categoryTags: {
        type: [String],
        default: [], // Historical, Temple, Nature, Fort, etc.
    },
    googleRating: {
        type: Number,
        default: 0,
    },
    openingHoursExtended: {
        monday: DailyScheduleSchema,
        tuesday: DailyScheduleSchema,
        wednesday: DailyScheduleSchema,
        thursday: DailyScheduleSchema,
        friday: DailyScheduleSchema,
        saturday: DailyScheduleSchema,
        sunday: DailyScheduleSchema,
        specialTimings: [{
            date: Date,
            slots: [OpeningSlotSchema],
            isClosed: Boolean,
            note: String
        }]
    },
    entryPricing: [EntryPriceSchema],
    additionalCharges: [ExtraChargeSchema],
    howToReach: [ReachOptionSchema],
    nearbyAttractions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attraction'
    }],
    nearbyFood: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Food'
    }],
    emergencyInfo: {
        hospital: { name: String, distance: String, mapLink: String },
        police: { name: String, distance: String, mapLink: String },
        emergencyNumber: String,
        customInfo: [String]
    },
    smartTips: {
        type: [String],
        default: [],
    },
    slug: {
        type: String,
        lowercase: true,
        trim: true,
        unique: true,
        sparse: true, // Allow existing docs without slug during migration
    },
    travelInformation: {
        crowdLevel: String, // Low, Moderate, High
        safetyScore: Number, // 1-10
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    partners: [{
        name: String,
        logo: String,
        phone: String,
        website: String,
        location: String,
        state: String,
        isVerified: {
            type: Boolean,
            default: false
        }
    }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved'
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    // Related Packages
    relatedTours: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tour' }],
    relatedSightseeing: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Sightseeing' }],
    relatedActivities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Activity' }],
    relatedRentals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Rental' }],
    relatedStays: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stay' }],
    relatedFood: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Food' }],
    relatedAttractions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attraction' }],
    views: {
        type: Number,
        default: 0,
    }
});

// Pre-save hook to generate slug
AttractionSchema.pre('save', function (this: any) {
    if (this.isModified('title') || !this.slug) {
        this.slug = this.title
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-');
    }
});

export default mongoose.models.Attraction || mongoose.model('Attraction', AttractionSchema);
