import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISupportTicket extends Document {
    name: string;
    email: string;
    phone?: string;
    message: string;
    responded: boolean;
    createdAt: Date;
}

const SupportTicketSchema: Schema<ISupportTicket> = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String },
        message: { type: String, required: true },
        responded: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const SupportTicket: Model<ISupportTicket> =
    mongoose.models.SupportTicket || mongoose.model<ISupportTicket>("SupportTicket", SupportTicketSchema);

export default SupportTicket;
