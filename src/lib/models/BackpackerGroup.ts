import mongoose, { Document, Schema } from "mongoose";

export interface IGroupMember extends Document {
  id: string;
  name: string;
  avatarColor: string;
  role: "host" | "co-host" | "member";
  expertise: string;
}

export interface IBadge {
  label: string;
  theme: "emerald" | "amber" | "sky" | "rose" | string;
}

export interface IHostProfile extends Document {
  id: string;
  handle: string;
  verificationLevel: string;
  pastTripsHosted: number;
  testimonials: string[];
  bio: string;
  avatarColor: string;
}

export interface IApprovalCriteria {
  minAge: number;
  genderPreference: "any" | "male" | "female";
  trekkingExperience: "beginner" | "intermediate" | "advanced";
  mandatoryRules: string[];
}

export interface IPlan {
  overview: string;
  itinerary: string[];
  activities: string[];
  estimatedCosts: Record<string, number>;
}

export interface IBikerRequirements {
  licenseRequired: boolean;
  ridingGearRequired: boolean;
  speedRules: string;
}

export interface IDocumentsRequired {
  aadhaar: boolean;
  passport: boolean;
  emergencyContact: boolean;
}

export interface IGroupComment {
  id: string;
  authorId: string;
  authorName: string;
  avatarColor: string;
  text: string;
  createdAt: Date;
  likes: number;
  roleLabel?: string;
}

export interface IJoinRequest {
  id: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  note?: string;
}

export interface IBackpackerGroup extends Document {
  id: string;
  groupName: string;
  destination: string;
  startDate: string;
  endDate: string;
  duration: number;
  maxMembers: number;
  avgBudget: number;
  budgetRange: string;
  pickupLocation: string;
  accommodationType: string;
  approvalCriteria: IApprovalCriteria;
  plan: IPlan;
  tripType: "trek" | "bike" | "cultural" | "wellness" | string;
  tripSource?: "community" | "hosted";
  bikerRequirements?: IBikerRequirements;
  documentsRequired: IDocumentsRequired;
  creatorId: string;
  currentMembers: number;
  coverImage: string;
  members: IGroupMember[];
  hostProfile: IHostProfile;
  badges: IBadge[];
  comments: IGroupComment[];
  requests: IJoinRequest[];
  verified: boolean;
  reports: {
    reporterId: string;
    reason: string;
    createdAt: Date;
  }[];
  reportCount: number;
  isAutoHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const groupMemberSchema = new Schema<IGroupMember>({
  id: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  avatarColor: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: ["host", "co-host", "member"]
  },
  expertise: { type: String, required: true, trim: true },
});

const hostProfileSchema = new Schema<IHostProfile>({
  id: { type: String, required: true },
  handle: { type: String, required: true, trim: true },
  verificationLevel: { type: String, required: true, trim: true },
  pastTripsHosted: { type: Number, required: true, default: 0 },
  testimonials: [{ type: String, trim: true }],
  bio: { type: String, trim: true },
  avatarColor: { type: String, required: true },
});

const approvalCriteriaSchema = new Schema<IApprovalCriteria>({
  minAge: { type: Number, required: true, min: 18, max: 80 },
  genderPreference: {
    type: String,
    required: true,
    enum: ["any", "male", "female"]
  },
  trekkingExperience: {
    type: String,
    required: true,
    enum: ["beginner", "intermediate", "advanced"]
  },
  mandatoryRules: [{ type: String, trim: true }],
});

const planSchema = new Schema<IPlan>({
  overview: { type: String, required: true, trim: true },
  itinerary: [{ type: String, trim: true }],
  activities: [{ type: String, trim: true }],
  estimatedCosts: { type: Map, of: Number },
});

const bikerRequirementsSchema = new Schema<IBikerRequirements>({
  licenseRequired: { type: Boolean, default: false },
  ridingGearRequired: { type: Boolean, default: false },
  speedRules: { type: String, trim: true },
});

const documentsRequiredSchema = new Schema<IDocumentsRequired>({
  aadhaar: { type: Boolean, default: true },
  passport: { type: Boolean, default: false },
  emergencyContact: { type: Boolean, default: true },
});

const groupCommentSchema = new Schema<IGroupComment>({
  id: { type: String, required: true },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true, trim: true },
  avatarColor: { type: String, required: true },
  text: { type: String, required: true, trim: true },
  createdAt: { type: Date, required: true, default: Date.now },
  likes: { type: Number, required: true, default: 0, min: 0 },
  roleLabel: { type: String, required: false },
});

const joinRequestSchema = new Schema<IJoinRequest>({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  createdAt: { type: Date, required: true, default: Date.now },
  note: { type: String, trim: true },
});

const badgeSchema = new Schema<IBadge>({
  label: { type: String, required: true, trim: true },
  theme: { type: String, required: true },
});

const backpackerGroupSchema = new Schema<IBackpackerGroup>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  groupName: {
    type: String,
    required: [true, "Group name is required"],
    trim: true,
    maxlength: [100, "Group name cannot exceed 100 characters"],
  },
  destination: {
    type: String,
    required: [true, "Destination is required"],
    trim: true,
  },
  startDate: {
    type: String,
    required: [true, "Start date is required"],
  },
  endDate: {
    type: String,
    required: [true, "End date is required"],
  },
  duration: {
    type: Number,
    required: true,
    min: [1, "Duration must be at least 1 day"],
  },
  maxMembers: {
    type: Number,
    required: true,
    min: [2, "Maximum members must be at least 2"],
    max: [50, "Maximum members cannot exceed 50"],
  },
  avgBudget: {
    type: Number,
    required: true,
    min: [0, "Average budget cannot be negative"],
  },
  budgetRange: {
    type: String,
    required: true,
    trim: true,
  },
  pickupLocation: {
    type: String,
    required: true,
    trim: true,
  },
  accommodationType: {
    type: String,
    required: true,
    trim: true,
  },
  approvalCriteria: {
    type: approvalCriteriaSchema,
    required: true,
  },
  plan: {
    type: planSchema,
    required: true,
  },
  tripType: {
    type: String,
    required: true,
    enum: ["trek", "bike", "cultural", "wellness", "open"],
  },
  tripSource: {
    type: String,
    enum: ["community", "hosted"],
    default: "community",
  },
  bikerRequirements: {
    type: bikerRequirementsSchema,
  },
  documentsRequired: {
    type: documentsRequiredSchema,
    required: true,
  },
  creatorId: {
    type: String,
    required: [true, "Creator ID is required"],
    index: true,
  },
  currentMembers: {
    type: Number,
    required: true,
    default: 1,
    min: [1, "Current members must be at least 1"],
  },
  coverImage: {
    type: String,
    required: true,
    trim: true,
  },
  members: {
    type: [groupMemberSchema],
    required: true,
    default: [],
  },
  hostProfile: {
    type: hostProfileSchema,
    required: true,
  },
  badges: {
    type: [badgeSchema],
    required: true,
    default: [],
  },
  comments: {
    type: [groupCommentSchema],
    required: true,
    default: [],
  },
  requests: {
    type: [joinRequestSchema],
    default: [],
  },
  verified: {
    type: Boolean,
    default: false,
    index: true,
  },
  reports: [{
    reporterId: { type: String, required: true },
    reason: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  reportCount: {
    type: Number,
    default: 0,
    index: true
  },
  isAutoHidden: {
    type: Boolean,
    default: false,
    index: true
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

// Compound index for efficient queries
backpackerGroupSchema.index({ creatorId: 1, createdAt: -1 });
backpackerGroupSchema.index({ tripType: 1, startDate: 1 });
backpackerGroupSchema.index({ destination: 1, startDate: 1 });

// Export the model
const BackpackerGroup = mongoose.models.BackpackerGroup || mongoose.model<IBackpackerGroup>("BackpackerGroup", backpackerGroupSchema);

// Export the model and interface
export default BackpackerGroup;