import mongoose from 'mongoose';

const HomeCitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    rating: {
        type: String,
        required: true,
    },
    reviews: {
        type: String,
        required: true,
    },
    touristPlaces: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    }
}, { timestamps: true });

// Check if the model exists before creating a new one
const HomeCity = mongoose.models.HomeCity || mongoose.model('HomeCity', HomeCitySchema);

export default HomeCity;
