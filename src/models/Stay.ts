import mongoose from 'mongoose';

const StaySchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a stay title'],
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
    location: {
        type: String,
        required: [true, 'Please provide a specific location'],
    },
    type: {
        type: String,
        enum: ['Hotel', 'Resort', 'Homestay', 'Villa', 'Apartment', 'Hostel', 'Campsite'],
        required: [true, 'Please provide a stay type'],
    },
    price: {
        type: Number,
        required: [true, 'Please provide a price'],
    },
    priceType: {
        type: String,
        enum: ['per_night', 'per_person'],
        default: 'per_night',
    },
    rating: {
        type: Number,
        default: 0,
    },
    reviews: {
        type: Number,
        default: 0,
    },
    overview: {
        type: String,
        required: [true, 'Please provide an overview'],
    },
    amenities: {
        type: [String],
        default: [],
    },
    images: {
        type: [String],
        default: [],
    },
    coverImage: {
        type: String,
        required: [true, 'Please provide a cover image'],
    },
    contactPhone: {
        type: String,
    },
    contactEmail: {
        type: String,
    },
    checkInTime: {
        type: String,
        default: '12:00 PM',
    },
    checkOutTime: {
        type: String,
        default: '11:00 AM',
    },
    maxGuests: {
        type: Number,
    },
    bedrooms: {
        type: Number,
    },
    bathrooms: {
        type: Number,
    },
    isVerified: {
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
StaySchema.pre('save', function (this: any) {
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

export default mongoose.models.Stay || mongoose.model('Stay', StaySchema);
