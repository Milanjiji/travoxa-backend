import mongoose from 'mongoose';

const SightseeingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a package title'],
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
    duration: {
        type: String,
        required: [true, 'Please provide a duration'],
    },

    vehicleType: {
        type: String,
        enum: ['4 Seater (Sedan)', '6 Seater (SUV)', '12 Seater (Tempo Traveller)', '20 Seater (Mini Bus)'],
        required: [true, 'Please provide a vehicle type'],
    },
    highlights: {
        type: [String],
        default: [],
    },
    placesCovered: {
        type: [String],
        default: [],
    },
    price: {
        type: Number,
        required: [true, 'Please provide a price'],
    },
    pricePrivate: {
        type: Number,
    },
    priceSharing: {
        type: Number,
    },
    priceType: {
        type: String,
        enum: ['per_vehicle', 'per_person'],
        required: [true, 'Please provide a price type'],
    },
    overview: {
        type: String,
        required: [true, 'Please provide an overview'],
    },
    itinerary: [{
        time: String,
        title: String,
        description: String,
    }],
    inclusions: {
        type: [String],
        default: [],
    },
    exclusions: {
        type: [String],
        default: [],
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
    isPrivate: {
        type: Boolean,
        default: true,
    },
    isSharing: {
        type: Boolean,
        default: false,
    },
    pickupPoints: {
        type: [String],
        default: [],
    },
    fuelIncluded: {
        type: Boolean,
        default: true,
    },
    driverIncluded: {
        type: Boolean,
        default: true,
    },
    customizablePickup: {
        type: Boolean,
        default: false,
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
SightseeingSchema.pre('save', function (this: any) {
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

export default mongoose.models.Sightseeing || mongoose.model('Sightseeing', SightseeingSchema);
