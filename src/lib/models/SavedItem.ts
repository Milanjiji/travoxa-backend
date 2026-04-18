import mongoose, { Document, Schema } from "mongoose";

export interface ISavedItem extends Document {
    userId: string;
    itemId: string;
    itemType: 'tour' | 'attraction' | 'activity' | 'sightseeing' | 'stay' | 'rental' | 'food';
    title?: string;
    itemLink?: string;
    createdAt: Date;
}

const savedItemSchema = new Schema<ISavedItem>({
    userId: {
        type: String,
        required: true,
    },
    itemId: {
        type: String,
        required: true,
    },
    itemType: {
        type: String,
        required: true,
        enum: ['tour', 'attraction', 'activity', 'sightseeing', 'stay', 'rental', 'food'],
    },
    title: {
        type: String,
    },
    itemLink: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Compound index to quickly check if an item is saved by a user
savedItemSchema.index({ userId: 1, itemId: 1, itemType: 1 }, { unique: true });

const SavedItem = mongoose.models.SavedItem || mongoose.model<ISavedItem>("SavedItem", savedItemSchema);
export default SavedItem;
