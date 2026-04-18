
export interface ActivityPackage {
    id: string;
    title: string;
    city: string;
    state: string;
    location: string;
    duration: string;
    price: number;
    rating: number;
    reviews: string | number;
    image: string;
    category: string; // e.g., Water Sports, Trekking
    level: string; // e.g., Easy, Moderate
    highlights: string[];
    overview: string;
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

export const activitiesPackages: ActivityPackage[] = [
    {
        id: "rishikesh-rafting",
        title: "White Water Rafting",
        city: "Rishikesh",
        state: "Uttarakhand",
        location: "Rishikesh, Uttarakhand",
        image: "https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&q=80&w=800",
        rating: 4.9,
        reviews: "5k+",
        category: "Water Sports",
        level: "Moderate",
        duration: "3-4 Hours",
        price: 1500,
        highlights: ["16km Rafting", "Cliff Jumping", "Body Surfing"],
        overview: "Experience the thrill of rafting in the holy Ganges river with grade 3 and 4 rapids."
    },
    {
        id: "bir-billing-paragliding",
        title: "Paragliding",
        city: "Bir Billing",
        state: "Himachal Pradesh",
        location: "Bir Billing, Himachal",
        image: "https://images.unsplash.com/photo-1526772662000-3f88f107f598?auto=format&fit=crop&q=80&w=800",
        rating: 4.9,
        reviews: "2k+",
        category: "Air",
        level: "Moderate",
        duration: "1 Hour",
        price: 2500,
        highlights: ["High Altitude Flight", "GoPro Video", "Certified Pilot"],
        overview: "Soar high above the mountains in the paragliding capital of India."
    },
    {
        id: "triund-trek",
        title: "Triund Trek",
        city: "Mcleodganj",
        state: "Himachal Pradesh",
        location: "Mcleodganj, Himachal",
        image: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=800",
        rating: 4.8,
        reviews: "3.2k",
        category: "Trekking",
        level: "Easy",
        duration: "2 Days",
        price: 3000,
        highlights: ["Camping at Top", "Bonfire", "Panoramic Views"],
        overview: "A beautiful and easy trek suitable for beginners offering stunning views of the Dhauladhar range."
    },
    {
        id: "havelock-scuba",
        title: "Scuba Diving",
        city: "Havelock Island",
        state: "Andaman and Nicobar Islands",
        location: "Havelock Island, Andaman",
        image: "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?auto=format&fit=crop&q=80&w=800",
        rating: 4.9,
        reviews: "4k+",
        category: "Water Sports",
        level: "Easy",
        duration: "2 Hours",
        price: 4500,
        highlights: ["Coral Reefs", "Underwater Photos", "Training Session"],
        overview: "Dive into the crystal clear waters of Andaman and explore the vibrant marine life."
    },
    {
        id: "jaisalmer-camping",
        title: "Desert Camping",
        city: "Jaisalmer",
        state: "Rajasthan",
        location: "Jaisalmer, Rajasthan",
        image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=800",
        rating: 4.7,
        reviews: "6k+",
        category: "Camping",
        level: "Easy",
        duration: "Overnight",
        price: 2000,
        highlights: ["Camel Safari", "Folk Dance", "Swiss Tents"],
        overview: "Enjoy a magical night in the Thar desert with cultural performances and starlit skies."
    },
    {
        id: "jim-corbett-safari",
        title: "Jungle Safari",
        city: "Jim Corbett",
        state: "Uttarakhand",
        location: "Jim Corbett, Uttarakhand",
        image: "https://images.unsplash.com/photo-1564760055278-df032906c11d?auto=format&fit=crop&q=80&w=800",
        rating: 4.8,
        reviews: "8k+",
        category: "Wildlife",
        level: "Easy",
        duration: "4 Hours",
        price: 4000,
        highlights: ["Tiger Spotting", "Jeep Safari", "Bird Watching"],
        overview: "Explore India's oldest national park and spot the majestic Bengal Tiger."
    }
];
