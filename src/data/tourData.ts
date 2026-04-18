
export interface TourPackage {
    id: string;
    slug?: string;
    title: string;
    location: string;
    price: number;
    duration: string; // e.g. "5 Days / 4 Nights"
    rating: number;
    reviews: number;
    image: string | string[]; // Support both single image (static) and array (MongoDB)
    overview: string;
    itinerary: {
        day: number;
        title: string;
        description: string;
        stay?: string;
        activity?: string;
        meal?: string;
        transfer?: string;
    }[];
    inclusions: string[];
    exclusions: string[];
    highlights?: string[]; // New field for trip highlights
    availabilityDate?: string; // New field for MongoDB tours

    earlyBirdDiscount?: number; // New field for MongoDB tours
    pricing?: { // Added for dynamic pricing support
        people: number;
        hotelType: 'Standard' | 'Premium';
        rooms: number;
        packagePrice: number;
        pricePerPerson: number;
    }[];
    meals?: string[] | {
        day: number;
        breakfast: string[];
        lunch: string[];
        dinner: string[];
        snacks: string[];
        custom: string[];
    }[]; // Updated to support day-wise meals
    partners?: {
        name: string;
        logo?: string;
        phone?: string;
        website?: string;
        location?: string;
        state?: string;
        isVerified?: boolean;
    }[];
    vendorId?: string | {
        _id: string;
        vendorDetails?: {
            businessName: string;
        };
    };
}

// No static tour data - all tours come from MongoDB
export const tourData: TourPackage[] = [];
