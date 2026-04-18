import { doc, getDoc, setDoc, updateDoc, query, where, getDocs, collection } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { getFirebaseAuth } from "./firebaseAuth";

export interface User {
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
  createdAt: string;
  updatedAt: string;
}

// Helper function to get current user's UID and check if they exist in Firestore

// Helper function to get current user's UID and check if they exist in Firestore