import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStoryStep {
    location: string;
    time?: string;
    description: string;
    images: string[];
    igLink?: string;
}

export interface IStory extends Document {
    type: 'story' | 'standalone_link';
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
    steps: IStoryStep[];
    status: 'draft' | 'published';
    likes: string[]; // Array of user emails
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const StoryStepSchema = new Schema<IStoryStep>({
    location: { type: String, required: true },
    time: { type: String },
    description: { type: String, required: true },
    images: [{ type: String }],
    igLink: { type: String }
});

const StorySchema = new Schema<IStory>(
    {
        type: { type: String, enum: ['story', 'standalone_link'], default: 'story' },
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
        steps: [StoryStepSchema],
        status: { type: String, enum: ['draft', 'published'], default: 'published' },
        likes: [{ type: String }],
        isPublic: { type: Boolean, default: true }
    },
    { timestamps: true }
);

const Story: Model<IStory> = mongoose.models.Story || mongoose.model<IStory>('Story', StorySchema);

export default Story;

