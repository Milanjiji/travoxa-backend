
export interface SightseeingPackage {
    id: string;
    slug?: string;
    title: string;
    city: string;
    state: string;
    duration: string; // e.g., "Full Day (8 Hours)"

    vehicleType: "4 Seater (Sedan)" | "6 Seater (SUV)" | "12 Seater (Tempo Traveller)" | "20 Seater (Mini Bus)" | "Sedan" | "SUV" | "Tempo Traveller" | "Mini Bus";
    highlights: string[];
    placesCovered: string[];
    price: number;
    pricePrivate?: number;
    priceSharing?: number;
    priceType: "per_vehicle" | "per_person";
    overview: string;
    itinerary: {
        time?: string;
        title: string;
        description: string;
    }[];
    inclusions: string[];
    exclusions: string[];
    image: string;
    rating: number;
    reviews: number;
    isPrivate: boolean;
    isSharing?: boolean;
    pickupPoints?: string[];
    fuelIncluded?: boolean;
    driverIncluded?: boolean;
    customizablePickup?: boolean;
    partners?: {
        name: string;
        logo?: string;
        phone?: string;
        website?: string;
        location?: string;
        state?: string;
        isVerified?: boolean;
    }[];
}

// All sightseeing packages are now managed through the admin panel
// and stored in the database. This file only contains the TypeScript interface.
// Empty array exported for backward compatibility with components that use it for suggestions
export const sightseeingPackages: SightseeingPackage[] = [];
