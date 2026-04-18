import mongoose, { Schema, Document } from 'mongoose';

export interface IPushSubscription extends Document {
    email: string; // The user's email
    token: string; // FCM Token
    platform: string;
    createdAt: Date;
    updatedAt: Date;
}

const PushSubscriptionSchema: Schema = new Schema({
    email: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    platform: { type: String },
}, { timestamps: true });

// Prevent duplicate model initialization in development
export default mongoose.models.PushSubscription || mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);
