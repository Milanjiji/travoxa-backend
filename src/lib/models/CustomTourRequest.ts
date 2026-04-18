
import mongoose, { Document, Schema } from "mongoose";

export interface ICustomTourRequest extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    destination: string;
    duration: string;
    groupSize: number;
    tripType: "Family" | "Friends" | "Couple" | "Solo" | "Corporate" | "Other";
    budget: "Budget" | "Standard" | "Premium" | "Luxury";
    startDate?: string;
    departurePlace: string;
    pickupLocation?: string;
    dropLocation?: string;
    adults?: number;
    children?: number;
    infants?: number;
    interests?: string[];
    accommodationPreference?: "Standard" | "Premium" | "Luxury" | "Budget" | "Homestay" | "Camps" | "Not Required";
    mealPlan?: string[];
    travelStyle?: "Full Private" | "Full Sharing" | "Mix";
    additionalNotes?: string;
    userDetails: {
        name: string;
        email: string;
        phone: string;
    };
    status: "pending" | "reviewed" | "contacted" | "approved" | "rejected" | "closed";
    adminResponse?: {
        totalAmount: number;
        bookingAmount: number;
        priceBreakdown: { label: string; amount: number }[];
        adminNotes: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const customTourRequestSchema = new Schema<ICustomTourRequest>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    destination: {
        type: String,
        required: [true, "Destination is required"],
        trim: true,
    },
    duration: {
        type: String, // e.g., "5 Days"
        required: [true, "Duration is required"],
    },
    groupSize: {
        type: Number,
        required: [true, "Group size is required"],
        min: [1, "Group size must be at least 1"],
    },
    tripType: {
        type: String,
        enum: ["Family", "Friends", "Couple", "Solo", "Corporate", "Other"],
        required: true,
    },
    budget: {
        type: String,
        enum: ["Budget", "Standard", "Premium", "Luxury"],
        required: true,
    },
    startDate: {
        type: String,
    },
    departurePlace: {
        type: String,
        required: [true, "Departure place is required"],
        trim: true,
    },
    pickupLocation: {
        type: String,
        trim: true,
    },
    dropLocation: {
        type: String,
        trim: true,
    },
    accommodationPreference: {
        type: String,
        enum: ["Standard", "Premium", "Luxury", "Budget", "Homestay", "Camps", "Not Required"],
    },
    adults: {
        type: Number,
        default: 1,
    },
    children: {
        type: Number,
        default: 0,
    },
    infants: {
        type: Number,
        default: 0,
    },
    interests: {
        type: [String],
    },
    mealPlan: {
        type: [String],
    },
    travelStyle: {
        type: String,
        enum: ["Full Private", "Full Sharing", "Mix"],
        required: false,
    },
    additionalNotes: {
        type: String,
        trim: true,
    },
    userDetails: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
    },
    status: {
        type: String,
        enum: ["pending", "reviewed", "contacted", "approved", "rejected", "closed"],
        default: "pending",
    },
    adminResponse: {
        totalAmount: { type: Number },
        bookingAmount: { type: Number },
        priceBreakdown: [{
            label: { type: String },
            amount: { type: Number }
        }],
        adminNotes: { type: String }
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

customTourRequestSchema.pre("save", function () {
    this.updatedAt = new Date();
});

const CustomTourRequest = mongoose.models.CustomTourRequest || mongoose.model<ICustomTourRequest>("CustomTourRequest", customTourRequestSchema);

export default CustomTourRequest;
