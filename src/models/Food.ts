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


const FoodSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a name'],
        maxlength: [150, 'Name cannot be more than 150 characters'],
    },
    type: {
        type: String, // e.g. "Cafe", "Restaurant", "Street Food"
        required: [true, 'Please provide a type'],
    },
    cuisine: {
        type: [String],
        required: [true, 'Please provide cuisines'],
    },
    city: {
        type: String,
        required: [true, 'Please provide a city'],
    },
    state: {
        type: String,
        required: [true, 'Please provide a state'],
    },
    priceRange: {
        type: String,
        enum: ['$', '$$', '$$$', '$$$$'],
        required: [true, 'Please provide a price range'],
    },
    avgCost: {
        type: Number, // Approx cost for two
        required: [true, 'Please provide average cost for two'],
    },
    overview: {
        type: String,
        required: [true, 'Please provide an overview'],
    },
    famousDish: {
        type: String,
        required: [true, 'Please provide famous dish name'],
    },
    distFromAttraction: {
        type: String, // e.g. "250m away"
    },
    area: {
        type: String, // Location detail
    },
    avgCostPerPerson: {
        type: Number,
        required: [true, 'Please provide average cost for one person'],
    },
    hygieneRating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
    },
    badges: {
        type: [String],
        default: [],
    },
    dishType: {
        type: String,
        enum: ['Veg', 'Non-Veg', 'Both'],
        required: [true, 'Please provide dish type'],
    },
    openingTime: String,
    closingTime: String,
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

    bestTimeToVisit: String,
    dineIn: {
        type: Boolean,
        default: true,
    },
    takeaway: {
        type: Boolean,
        default: true,
    },
    homeDelivery: {
        type: Boolean,
        default: false,
    },
    contactPerson: String,
    phoneNumber: String,
    whatsappNumber: String,
    address: String,
    attractionName: String, // For distance context
    fullMenu: [
        {
            category: String,
            items: [
                {
                    name: String,
                    price: Number,
                }
            ]
        }
    ],
    image: {
        type: String,
        required: false,
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
FoodSchema.pre('save', function (this: any) {
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

export default mongoose.models.Food || mongoose.model('Food', FoodSchema);
