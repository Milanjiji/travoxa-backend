export interface RentalItem {
    id: string;
    slug?: string;
    name: string;
    type: string;
    model: string;
    rating: number;
    reviews: number;
    mileage: number;
    seats: number;
    fuel: string;
    helmet: string;
    price: number;
    image: string;
    verified: boolean;
    location: string;
    state?: string;
    city?: string;
    whatsapp?: string;
    mapLocation?: {
        lat: number;
        lng: number;
    };
    rentalServiceName?: string;
    vehicleCondition?: string;
    hourlyPrice?: number;
    weeklyPrice?: number;
    securityDeposit?: number;
    extraKmCharge?: number;
    perDayKmLimit?: number;
    minAge?: number;
    documentsRequired?: string[];
    fuelPolicy?: string;
    lateReturnCharges?: string;
    googleMapLink?: string;
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

// All rental items are now managed through the admin panel
// and stored in the database. This file only contains the TypeScript interface.
// Empty array exported for backward compatibility with components that use it
export const rentalsData: RentalItem[] = [];

