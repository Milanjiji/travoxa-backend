
export interface AttractionPackage {
    id: string;
    title: string;
    city: string;
    state: string;
    location: string;
    rating: number;
    reviews: string | number;
    image: string;
    category: string; // e.g., Historical, Modern
    type: string; // e.g., Palace, Museum
    overview: string;
    price: number; // Entry fee estimation or guided tour price
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

export const attractionsPackages: AttractionPackage[] = [
    {
        id: "mysore-palace",
        title: "Mysore Palace",
        city: "Mysore",
        state: "Karnataka",
        location: "Mysore, Karnataka",
        image: "https://images.unsplash.com/photo-1590050752117-238cb0fb32b6?auto=format&fit=crop&q=80&w=800",
        rating: 4.8,
        reviews: "18k+",
        category: "Historical",
        type: "Palace",
        overview: "The official residence of the Wadiyar dynasty and the seat of the Kingdom of Mysore.",
        price: 100
    },
    {
        id: "victoria-memorial",
        title: "Victoria Memorial",
        city: "Kolkata",
        state: "West Bengal",
        location: "Kolkata, WB",
        image: "https://images.unsplash.com/photo-1558431382-27e30314225d?auto=format&fit=crop&q=80&w=800",
        rating: 4.7,
        reviews: "12k+",
        category: "Historical",
        type: "Museum",
        overview: "A large marble building in Kolkata which is dedicated to the memory of Queen Victoria.",
        price: 50
    },
    {
        id: "lotus-temple",
        title: "Lotus Temple",
        city: "New Delhi",
        state: "Delhi",
        location: "New Delhi",
        image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&q=80&w=800",
        rating: 4.6,
        reviews: "22k+",
        category: "Modern",
        type: "Temple",
        overview: "A Bahá'í House of Worship that is open to all, regardless of religion or any other qualification.",
        price: 0
    },
    {
        id: "charminar",
        title: "Charminar",
        city: "Hyderabad",
        state: "Telangana",
        location: "Hyderabad, Telangana",
        image: "https://images.unsplash.com/photo-1572445217366-26e8281180b5?auto=format&fit=crop&q=80&w=800",
        rating: 4.5,
        reviews: "9k+",
        category: "Historical",
        type: "Monument",
        overview: "The landmark has become known globally as a symbol of Hyderabad and is listed among the most recognized structures in India.",
        price: 25
    },
    {
        id: "qutub-minar",
        title: "Qutub Minar",
        city: "New Delhi",
        state: "Delhi",
        location: "New Delhi",
        image: "https://images.unsplash.com/photo-1545231027-637d2f6210f8?auto=format&fit=crop&q=80&w=800",
        rating: 4.7,
        reviews: "14k+",
        category: "UNESCO",
        type: "Tower",
        overview: "A minaret and victory tower that forms part of the Qutb complex, a UNESCO World Heritage Site.",
        price: 40
    },
    {
        id: "sun-temple",
        title: "Sun Temple",
        city: "Konark",
        state: "Odisha",
        location: "Konark, Odisha",
        image: "https://images.unsplash.com/photo-1629213856230-0199ae6cc180?auto=format&fit=crop&q=80&w=800",
        rating: 4.8,
        reviews: "10k+",
        category: "Ancient",
        type: "Temple",
        overview: "A 13th-century Sun Temple at Konark about 35 kilometres northeast from Puri.",
        price: 40
    }
];
