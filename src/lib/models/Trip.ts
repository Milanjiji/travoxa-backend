
import mongoose, { Document, Schema } from "mongoose";

export interface ITrip extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    name: string;
    originCity: string;
    destinationSummary: string; // e.g. "Trip to Kerala"
    profile: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const tripSchema = new Schema<ITrip>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    name: {
        type: String,
        required: true,
        default: "My Trip",
    },
    originCity: {
        type: String,
        required: true,
    },
    destinationSummary: {
        type: String, // e.g., "Family Trip to Kerala"
    },
    profile: {
        type: Object,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

tripSchema.pre("save", function () {
    this.updatedAt = new Date();
});

const Trip = mongoose.models.Trip || mongoose.model<ITrip>("Trip", tripSchema);
export default Trip;
