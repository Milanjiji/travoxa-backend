import mongoose, { Schema, Document, Model } from "mongoose";

export interface IJourney extends Document {
    title: string;
    image: string;
    desc: string;
    order: number;
    createdAt: Date;
}

const JourneySchema = new Schema<IJourney>(
    {
        title: { type: String, required: true },
        image: { type: String, default: "" },
        desc: { type: String, required: true },
        order: { type: Number, default: 0 },
        createdAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

const Journey: Model<IJourney> =
    mongoose.models.Journey || mongoose.model<IJourney>("Journey", JourneySchema);

export default Journey;
