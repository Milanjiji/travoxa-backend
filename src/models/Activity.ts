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


const ActivitySchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide an activity title'],
        maxlength: [150, 'Title cannot be more than 150 characters'],
    },
    // Location Details
    city: {
        type: String,
        required: [true, 'Please provide a city'],
    },
    state: {
        type: String,
        required: [true, 'Please provide a state'],
    },
    location: {
        name: String,
        mapLink: String,
    },
    pickupPoint: String,
    dropPoint: String,

    // Activity Details
    type: {
        type: String,
        // Enum can be enforcing or just suggested. Since user wants "Other" + custom add, string is most flexible.
        // We can handle the "Other" UI logic on frontend.
        required: [true, 'Please provide an activity type'],
    },
    difficultyLevel: {
        type: String,
        enum: ['Easy', 'Moderate', 'Difficult'],
        required: [true, 'Please provide a difficulty level'],
    },
    duration: {
        // Storing as string "2 Hours" or "3 Days" as requested to be flexible but structured input in UI
        type: String,
        required: [true, 'Please provide a duration'],
    },
    bestMonths: {
        start: String,
        end: String,
    },
    bestTimeOfDay: String, // Morning/Evening
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


    // Suitability & Requirements
    suitableFor: [String], // Solo, Couple, Family, Friends, Kids
    ageLimit: {
        min: Number,
        max: Number,
    },


    // Pricing & Includes
    price: {
        type: Number,
        required: [true, 'Please provide a price'],
    },
    priceType: {
        type: String,
        enum: ['per_person', 'per_group'],
        required: [true, 'Please provide a price type'],
        default: 'per_person'
    },
    includes: [String], // Guide, Safety Gear, Video

    // Content
    overview: {
        type: String,
        required: [true, 'Please provide an overview'],
    },
    highlights: {
        type: [String],
        default: [],
    },
    inclusions: {
        type: [String], // Certified Instructor, Safety Harness etc.
        default: [],
    },
    exclusions: {
        type: [String], // Personal expenses etc.
        default: [],
    },
    image: {
        type: String,
        required: false,
    },

    // Safety & Policies
    safetyLevel: String,
    permitRequired: Boolean,
    bookingRequired: Boolean,
    popularityLevel: String,
    weatherDependency: Boolean, // Yes/No
    medicalRestrictions: {
        exists: Boolean,
        details: String,
    },
    photographyAllowed: Boolean,
    droneAllowed: Boolean,
    parkingAvailable: { type: Boolean, default: false },

    // Organizer Info
    localOrganizer: String,
    verifiedByTravoxa: {
        type: Boolean,
        default: false,
    },

    // Legacy/Existing fields
    rating: {
        type: Number,
        default: 0,
    },
    reviews: {
        type: Number,
        default: 0,
    },
    category: {
        type: String,
        // This might be redundant with 'type' now, but keeping for backward compat if needed or mapping 'type' to it.
        // Or we can just use 'type' as the main category field. 
        // Let's make it optional or just fallback to type if not provided.
    },
    level: {
        type: String, // Keeping for backward compatibility, sync with difficultyLevel
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved'
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
    },
    slug: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true
    }
});

// Pre-save hook to generate slug
ActivitySchema.pre('save', function (this: any) {
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

export default mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
