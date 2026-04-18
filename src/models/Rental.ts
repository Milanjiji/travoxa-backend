import mongoose from 'mongoose';

const RentalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a rental name']
    },
    type: {
        type: String,
        required: [true, 'Please provide a type'],
        enum: ['2 Seater (Scooter)', '2 Seater (Bike)', '4 Seater (Car)', '5 Seater (Car)', '7 Seater (SUV)', '12 Seater (Tempo Traveller)'],
    },
    model: {
        type: String,
        required: [true, 'Please provide a model year']
    },
    rating: {
        type: Number,
        default: 0
    },
    reviews: {
        type: Number,
        default: 0
    },
    mileage: {
        type: Number,
        required: [true, 'Please provide mileage']
    },
    seats: {
        type: Number,
        required: [true, 'Please provide number of seats']
    },
    fuel: {
        type: String,
        required: [true, 'Please provide fuel type'],
        enum: ['Petrol', 'Diesel', 'Electric', 'CNG']
    },
    helmet: {
        type: String,
        default: 'Helmet Included'
    },
    price: {
        type: Number,
        required: [true, 'Please provide a price']
    },
    image: {
        type: String,
        required: false,
    },
    verified: {
        type: Boolean,
        default: false
    },
    state: {
        type: String,
        required: [true, 'Please provide a state']
    },
    city: {
        type: String,
        required: [true, 'Please provide a city']
    },
    whatsapp: {
        type: String,
        required: [true, 'Please provide a WhatsApp number']
    },
    mapLocation: {
        type: {
            lat: Number,
            lng: Number
        },
        required: false
    },
    rentalServiceName: {
        type: String,
        required: false
    },
    // Keep location for backward compatibility (computed from state + city)
    location: {
        type: String,
        required: false
    },
    vehicleCondition: {
        type: String,
        required: false
    },
    hourlyPrice: {
        type: Number,
        required: false
    },
    weeklyPrice: {
        type: Number,
        required: false
    },
    securityDeposit: {
        type: Number,
        required: false
    },
    extraKmCharge: {
        type: Number,
        required: false
    },
    perDayKmLimit: {
        type: Number,
        required: false
    },
    minAge: {
        type: Number,
        required: false
    },
    documentsRequired: {
        type: [String],
        default: []
    },
    fuelPolicy: {
        type: String,
        required: false
    },
    lateReturnCharges: {
        type: String,
        required: false
    },
    googleMapLink: {
        type: String,
        required: false
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
    // Related Packages
    relatedTours: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tour' }],
    relatedSightseeing: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Sightseeing' }],
    relatedActivities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Activity' }],
    relatedRentals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Rental' }],
    relatedStays: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stay' }],
    relatedFood: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Food' }],
    relatedAttractions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attraction' }],
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
}, {
    timestamps: true
});

// Pre-save hook to generate slug
RentalSchema.pre('save', function (this: any) {
    if (this.isModified('name') || !this.slug) {
        this.slug = this.name
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-');
    }
});

export default mongoose.models.Rental || mongoose.model('Rental', RentalSchema);
