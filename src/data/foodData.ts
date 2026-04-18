
export interface FoodPackage {
    id: string;
    title: string;
    city: string;
    state: string;
    location: string;
    rating: number;
    reviews: string | number;
    image: string;
    category: string; // e.g., Seafood, Bakery
    cuisine: string; // e.g., Goan, Continental
    overview: string;
    priceRange: string; // e.g., ₹₹, ₹₹₹
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

export const foodPackages: FoodPackage[] = [
    {
        id: "brittos-goa",
        title: "Britto's",
        city: "Baga",
        state: "Goa",
        location: "Baga, Goa",
        image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800",
        rating: 4.6,
        reviews: "10k+",
        category: "Seafood",
        cuisine: "Goan",
        overview: "Famous beach shack known for its seafood platter and lively atmosphere.",
        priceRange: "₹₹"
    },
    {
        id: "glenarys-darjeeling",
        title: "Glenary's",
        city: "Darjeeling",
        state: "West Bengal",
        location: "Darjeeling, WB",
        image: "https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&q=80&w=800",
        rating: 4.8,
        reviews: "8k+",
        category: "Bakery",
        cuisine: "Continental",
        overview: "Historic bakery and cafe offering colonial charm and delicious pastries.",
        priceRange: "₹₹"
    },
    {
        id: "leopold-cafe-mumbai",
        title: "Leopold Cafe",
        city: "Mumbai",
        state: "Maharashtra",
        location: "Colaba, Mumbai",
        image: "https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?auto=format&fit=crop&q=80&w=800",
        rating: 4.5,
        reviews: "15k+",
        category: "Classic",
        cuisine: "Multi-Cuisine",
        overview: "A large and popular restaurant and bar on Colaba Causeway.",
        priceRange: "₹₹₹"
    },
    {
        id: "kesar-da-dhaba",
        title: "Kesar Da Dhaba",
        city: "Amritsar",
        state: "Punjab",
        location: "Amritsar, Punjab",
        image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=800",
        rating: 4.9,
        reviews: "20k+",
        category: "Authentic",
        cuisine: "Punjabi",
        overview: "Legendary dhaba serving authentic Punjabi food for over 100 years.",
        priceRange: "₹₹"
    },
    {
        id: "villa-maya-trivandrum",
        title: "Villa Maya",
        city: "Trivandrum",
        state: "Kerala",
        location: "Trivandrum, Kerala",
        image: "https://images.unsplash.com/photo-1514362545857-3bc16549766b?auto=format&fit=crop&q=80&w=800",
        rating: 4.8,
        reviews: "4k+",
        category: "Fine Dining",
        cuisine: "World",
        overview: "Restored 18th-century Dutch manor serving global cuisine.",
        priceRange: "₹₹₹₹"
    },
    {
        id: "tunday-kababi",
        title: "Tunday Kababi",
        city: "Lucknow",
        state: "Uttar Pradesh",
        location: "Lucknow, UP",
        image: "https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&q=80&w=800",
        rating: 4.7,
        reviews: "12k+",
        category: "Kebabs",
        cuisine: "Mughlai",
        overview: "Famous for its melt-in-the-mouth Galouti kebabs.",
        priceRange: "₹"
    }
];
