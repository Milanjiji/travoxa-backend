import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IJournalStep {
    location: string;
    time?: string;
    description: string;
    images: string[];
    igLink?: string;
}

export interface ITravelJournal extends Document {
    type: 'journal' | 'standalone_link';
    title: string;
    description: string; // Overview
    tripType?: string;
    duration?: string;
    igLink?: string; // For standalone reels or overall trip reel
    author: {
        email: string;
        name: string;
        image?: string;
    };
    steps: IJournalStep[];
    status: 'draft' | 'published';
    likes: string[]; // Array of user emails
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const JournalStepSchema = new Schema<IJournalStep>({
    location: { type: String, required: true },
    time: { type: String },
    description: { type: String, required: true },
    images: [{ type: String }],
    igLink: { type: String }
});

const TravelJournalSchema = new Schema<ITravelJournal>(
    {
        type: { type: String, enum: ['journal', 'standalone_link'], default: 'journal' },
        title: { type: String, required: true },
        description: { type: String },
        tripType: { type: String },
        duration: { type: String },
        igLink: { type: String },
        author: {
            email: { type: String, required: true },
            name: { type: String, required: true },
            image: { type: String }
        },
        steps: [JournalStepSchema],
        status: { type: String, enum: ['draft', 'published'], default: 'published' },
        likes: [{ type: String }],
        isPublic: { type: Boolean, default: true }
    },
    { timestamps: true }
);

const TravelJournal: Model<ITravelJournal> = mongoose.models.TravelJournal || mongoose.model<ITravelJournal>('TravelJournal', TravelJournalSchema);

export default TravelJournal;
