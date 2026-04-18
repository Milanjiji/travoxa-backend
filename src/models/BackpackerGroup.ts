import mongoose, { Document, Schema } from "mongoose";

export interface IGroupMember {
  id: string;
  name: string;
  avatarColor: string;
  role: "host" | "co-host" | "member";
  expertise: string;
}

export interface IBadge {
  label: string;
  theme: string;
}

export interface IHostProfile {
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
  tripType: string;
  tripSource?: string;
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
  name: { type: String, required: true },
  avatarColor: { type: String, required: true },
  role: { type: String, required: true, enum: ["host", "co-host", "member"] },
  expertise: { type: String, required: true },
});

const hostProfileSchema = new Schema<IHostProfile>({
  id: { type: String, required: true },
  handle: { type: String, required: true },
  verificationLevel: { type: String, required: true },
  pastTripsHosted: { type: Number, required: true, default: 0 },
  testimonials: [String],
  bio: String,
  avatarColor: { type: String, required: true },
});

const approvalCriteriaSchema = new Schema<IApprovalCriteria>({
  minAge: { type: Number, required: true },
  genderPreference: { type: String, required: true, enum: ["any", "male", "female"] },
  trekkingExperience: { type: String, required: true, enum: ["beginner", "intermediate", "advanced"] },
  mandatoryRules: [String],
});

const planSchema = new Schema<IPlan>({
  overview: { type: String, required: true },
  itinerary: [String],
  activities: [String],
  estimatedCosts: { type: Map, of: Number },
});

const bikerRequirementsSchema = new Schema<IBikerRequirements>({
  licenseRequired: Boolean,
  ridingGearRequired: Boolean,
  speedRules: String,
});

const groupCommentSchema = new Schema<IGroupComment>({
  id: { type: String, required: true },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  avatarColor: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  roleLabel: String,
});

const joinRequestSchema = new Schema<IJoinRequest>({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  status: { type: String, required: true, enum: ["pending", "approved", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
  note: String,
});

const backpackerGroupSchema = new Schema<IBackpackerGroup>({
  id: { type: String, required: true, unique: true, index: true },
  groupName: { type: String, required: true },
  destination: { type: String, required: true },
  startDate: String,
  endDate: String,
  duration: Number,
  maxMembers: Number,
  avgBudget: Number,
  budgetRange: String,
  pickupLocation: String,
  accommodationType: String,
  approvalCriteria: approvalCriteriaSchema,
  plan: planSchema,
  tripType: String,
  tripSource: { type: String, default: "community" },
  bikerRequirements: bikerRequirementsSchema,
  documentsRequired: { aadhaar: Boolean, passport: Boolean, emergencyContact: Boolean },
  creatorId: { type: String, required: true, index: true },
  currentMembers: { type: Number, default: 1 },
  coverImage: String,
  members: [groupMemberSchema],
  hostProfile: hostProfileSchema,
  badges: [{ label: String, theme: String }],
  comments: [groupCommentSchema],
  requests: [joinRequestSchema],
  verified: { type: Boolean, default: false, index: true },
  reports: [{ reporterId: String, reason: String, createdAt: { type: Date, default: Date.now } }],
  reportCount: { type: Number, default: 0 },
  isAutoHidden: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const BackpackerGroup = mongoose.models.BackpackerGroup || mongoose.model<IBackpackerGroup>("BackpackerGroup", backpackerGroupSchema);
export default BackpackerGroup;
