import mongoose from 'mongoose';

const HelplineSchema = new mongoose.Schema({
    serviceName: {
        type: String,
        required: [true, 'Please provide a service name'],
    },
    emergencyType: {
        type: String,
        required: [true, 'Please provide an emergency type'],
    },
    fullAddress: {
        type: String,
    },
    city: {
        type: String,
        required: [true, 'Please provide a city'],
    },
    state: {
        type: String,
        required: [true, 'Please provide a state'],
    },
    phone: {
        type: String,
        required: [true, 'Please provide a phone number'],
    },
    alternatePhone: {
        type: String,
    },
    is24x7: {
        type: Boolean,
        default: true,
    },
    ownershipType: {
        type: String, // Government / Private
        default: 'Government',
    },
    googleMapLink: {
        type: String,
    },
    responseType: {
        type: String,
    },
    charges: {
        type: String,
        default: 'Free',
    },
    languageSupport: {
        type: [String],
        default: ['English', 'Hindi'],
    },
    website: {
        type: String,
    },
    isVerified: {
        type: Boolean,
        default: true,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
    notes: {
        type: String,
    },
    image: {
        type: String,
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
    createdAt: {
        type: Date,
        default: Date.now,
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
HelplineSchema.pre('save', function (this: any) {
    if (this.isModified('serviceName') || !this.slug) {
        this.slug = this.serviceName
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-');
    }
});

export default mongoose.models.Helpline || mongoose.model('Helpline', HelplineSchema);
