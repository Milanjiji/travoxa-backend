import { connectDB } from "./mongodb";
import User, { IUser } from "./models/User";

export interface UserFormData {
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
  latitude?: number;
  longitude?: number;
  role?: string;
  vendorDetails?: {
    businessName: string;
    businessType: string;
    address: string;
    taxId?: string;
  };
}

export const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    await connectDB();
    const user = await User.findOne({ email: normalizedEmail });
    return !!user;
  } catch (error) {
    console.error("Error checking user exists:", error);
    throw new Error("Failed to check user existence");
  }
};

export const getUser = async (email: string): Promise<IUser | null> => {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    await connectDB();
    const user = await User.findOne({ email: normalizedEmail });
    return user;
  } catch (error) {
    console.error("Error getting user:", error);
    throw new Error("Failed to get user data");
  }
};

export const getUserById = async (id: string): Promise<IUser | null> => {
  try {
    await connectDB();
    const user = await User.findOne({ _id: id });
    return user;
  } catch (error) {
    console.error("Error getting user by ID:", error);
    throw new Error("Failed to get user data");
  }
};

export const createUser = async (userData: UserFormData): Promise<IUser> => {
  try {
    await connectDB();

    const normalizedEmail = userData.email.trim().toLowerCase();
    const newUser = new User({
      ...userData,
      email: normalizedEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await newUser.save();
  } catch (error) {
    console.error("Error creating user:", error);
    console.error("Full error details:", JSON.stringify(error, null, 2));
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw error; // Throw the original error, not a generic one
  }
};

export const updateUser = async (email: string, updates: Partial<UserFormData>): Promise<IUser | null> => {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    await connectDB();

    const updatedUser = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    return updatedUser;
  } catch (error) {
    console.error("Error updating user:", error);
    throw new Error("Failed to update user");
  }
};

export const deleteUser = async (email: string): Promise<boolean> => {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    await connectDB();
    const result = await User.deleteOne({ email: normalizedEmail });
    return result.deletedCount > 0;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new Error("Failed to delete user");
  }
};

export const getAllUsers = async (): Promise<IUser[]> => {
  try {
    await connectDB();
    return await User.find().sort({ createdAt: -1 });
  } catch (error) {
    console.error("Error getting all users:", error);
    throw new Error("Failed to get users");
  }
};