import mongoose from 'mongoose';

const TourSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a tour title'],
        maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    location: {
        type: String,
        required: [true, 'Please provide a location'],
    },
    price: {
        type: Number,
        required: [true, 'Please provide a price'],
    },
    pricing: [{
        people: Number,
        hotelType: {
            type: String,
            enum: ['Standard', 'Premium']
        },
        travelStyle: {
            type: String,
            enum: ['Full Private', 'Full Sharing', 'Mix'],
            required: false,
            default: 'Full Private'
        },
        rooms: Number,
        packagePrice: Number, // Total price for the group
        pricePerPerson: Number // Derived or explicit
    }],
    duration: {
        type: String,
        required: [true, 'Please provide a duration'],
    },
    availabilityDate: {
        type: String, // Can be "Flexible" or specific date range - KEEPING FOR BACKWARD COMPATIBILITY
    },
    availabilityBatches: {
        type: [{
            startDate: String,
            endDate: String,
            active: { type: Boolean, default: true }
        }],
        default: []
    },

    rating: {
        type: Number,
        default: 0,
    },
    reviews: {
        type: Number,
        default: 0,
    },
    image: {
        type: [String], // Array of image URLs
        required: [true, 'Please provide at least one image'],
    },
    overview: {
        type: String,
        required: [true, 'Please provide an overview'],
    },
    itinerary: [{
        day: Number,
        title: String,
        description: String,
        stay: String,
        activity: String,
        meal: String,
        transfer: String,
        stayLevel: { type: String, enum: ['dormitory', 'standard', 'premium', 'none'], default: 'none' },
        vehicleType: { type: String, enum: ['scooty', 'shared', 'private', 'none'], default: 'none' }
    }],
    locationMapLink: {
        type: String,
    },
    pickupLocation: {
        type: String,
    },
    pickupMapLink: {
        type: String,
    },
    dropLocation: {
        type: String,
    },
    dropMapLink: {
        type: String,
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
    highlights: [String],
    cancellationPolicy: [String],
    brochureUrl: {
        type: String,
    },
    totalSlots: {
        type: Number,
    },
    bookedSlots: {
        type: Number,
        default: 0,
    },
    bookingAmount: {
        type: Number, // Partial payment amount
    },
    earlyBirdDiscount: {
        type: Number, // Percentage
    },
    inclusions: [String],
    exclusions: [String],
    meals: [{
        day: Number,
        breakfast: [String],
        lunch: [String],
        dinner: [String],
        snacks: [String],
        custom: [String]
    }],
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved'
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
    },
    configurator: {
        stayOptions: [{
            type: { type: String, enum: ['dormitory', 'standard', 'premium'] },
            name: String,
            pricePerNight: Number,
            image: String,
            description: String
        }],
        mealPricing: {
            breakfast: { type: Number, default: 0 },
            lunch: { type: Number, default: 0 },
            dinner: { type: Number, default: 0 },
            fullPlan: { type: Number, default: 0 }
        },
        sightseeingOptions: [{
            type: { type: String, enum: ['scooty', 'shared', 'private'] },
            name: String,
            pricePerDay: Number,
            description: String
        }],
        transportAssistance: {
            railNormal: { type: Number, default: 0 },
            railTatkal: { type: Number, default: 0 },
            bus: { type: Number, default: 0 },
            flight: { type: Number, default: 0 }
        },
        addOnActivities: [{
            name: String,
            price: Number,
            iconType: String
        }]
    }
}, { timestamps: true });

// Pre-save hook to generate slug
TourSchema.pre('save', function (this: any) {
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

// Prevent mongoose from creating a new model if it already exists
// This is needed because in development we don't want to restart the server for every change
if (mongoose.models.Tour) {
    delete mongoose.models.Tour;
}

const Tour = mongoose.models.Tour || mongoose.model('Tour', TourSchema);

export default Tour;
