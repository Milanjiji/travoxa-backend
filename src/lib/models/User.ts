import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  gender: string;
  dateOfBirth?: string;
  city?: string;
  languages?: string[];
  bio?: string;
  travelExperience?: string;
  comfortLevel?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalConditions?: string;
  allergies?: string;
  governmentIdUrl?: string;
  hasBike: boolean;
  bikeModel?: string;
  hasLicense?: boolean;
  hasHelmet?: boolean;
  preferredTravelMode?: string[];
  shareAccommodation?: boolean;
  smokingPreference?: string;
  drinkingPreference?: string;
  foodPreference?: string;
  activityInterests?: string[];
  weekdayAvailability?: boolean;
  weekendAvailability?: boolean;
  shortNoticeTravel?: boolean;
  socialProfileLink?: string;
  interests: string[];
  authProvider: string;
  profileComplete?: boolean;
  role: string;
  latitude?: number;
  longitude?: number;
  vendorDetails?: {
    businessName: string;
    businessType: string;
    address: string;
    taxId?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
    googleBusiness?: string;
    youtube?: string;
  };
  notifications: {
    senderId: string;
    message: string;
    seen: boolean;
    createdAt: Date;
  }[];
  blockedUserIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
  },
  phone: {
    type: String,
    trim: true,
  },
  gender: {
    type: String,
    required: [true, "Gender is required"],
    enum: ["male", "female", "other", "prefer-not-to-say"],
  },
  dateOfBirth: {
    type: String,
  },
  city: {
    type: String,
    trim: true,
  },
  languages: [{
    type: String,
    trim: true,
  }],
  bio: {
    type: String,
    maxlength: [500, "Bio cannot exceed 500 characters"],
  },
  travelExperience: {
    type: String,
    enum: ["beginner", "intermediate", "advanced", "expert"],
  },
  comfortLevel: [{
    type: String,
    enum: ["budget", "mid-range", "luxury"],
  }],
  emergencyContactName: {
    type: String,
    trim: true,
  },
  emergencyContactPhone: {
    type: String,
    trim: true,
  },
  medicalConditions: {
    type: String,
  },
  allergies: {
    type: String,
  },
  governmentIdUrl: {
    type: String,
  },
  hasBike: {
    type: Boolean,
    default: false,
  },
  bikeModel: {
    type: String,
    trim: true,
  },
  hasLicense: {
    type: Boolean,
    default: false,
  },
  hasHelmet: {
    type: Boolean,
    default: false,
  },
  preferredTravelMode: [{
    type: String,
    enum: ["bike", "car", "public-transport", "hiking", "trekking"],
  }],
  shareAccommodation: {
    type: Boolean,
    default: false,
  },
  smokingPreference: {
    type: String,
    enum: ["no", "yes", "occasionally"],
  },
  drinkingPreference: {
    type: String,
    enum: ["no", "yes", "occasionally"],
  },
  foodPreference: {
    type: String,
    enum: ["vegetarian", "non-vegetarian", "vegan", "eggetarian", "no-restriction"],
  },
  activityInterests: [{
    type: String,
    trim: true,
  }],
  weekdayAvailability: {
    type: Boolean,
    default: false,
  },
  weekendAvailability: {
    type: Boolean,
    default: true,
  },
  shortNoticeTravel: {
    type: Boolean,
    default: false,
  },
  socialProfileLink: {
    type: String,
  },
  interests: [{
    type: String,
    trim: true,
  }],
  authProvider: {
    type: String,
    required: [true, "Auth provider is required"],
    enum: ["google", "email", "github"],
  },
  profileComplete: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ["user", "vendor", "admin"],
    default: "user",
  },
  vendorDetails: {
    businessName: { type: String, trim: true },
    businessType: { type: String, trim: true },
    address: { type: String, trim: true },
    taxId: { type: String, trim: true },
    instagram: { type: String, trim: true },
    facebook: { type: String, trim: true },
    twitter: { type: String, trim: true },
    googleBusiness: { type: String, trim: true },
    youtube: { type: String, trim: true },
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  notifications: [{
    senderId: { type: String, required: true },
    message: { type: String, required: true },
    seen: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  blockedUserIds: [{ type: String, trim: true }],
});

// Update the updatedAt field before saving
userSchema.pre("save", function () {
  this.updatedAt = new Date();
});

// Compound index for efficient email lookups
// userSchema.index({ email: 1 }); // Removed to avoid duplicate index warning as email has unique: true

// Export the model
const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
export default User;