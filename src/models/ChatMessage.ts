import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  text: string;
  sender: 'user' | 'admin';
  senderId: string;   // For users, this is their email/UID
  receiverId: string; // For users, this is 'admin'
  channel: string;    // e.g., 'user-milan@example.com'
  imageUrl?: string;  // Cloudinary URL if it's an image message
  id: string;         // Client-side unique ID
  timestamp: string;  // Formatted local time
  isRead: boolean;
  createdAt: Date;
}

const ChatMessageSchema: Schema = new Schema({
  text: { type: String, required: false }, // Text can now be optional if image is present
  sender: { type: String, enum: ['user', 'admin'], required: true },
  senderId: { type: String, required: true, index: true },
  receiverId: { type: String, required: true },
  channel: { type: String, required: true, index: true },
  imageUrl: { type: String, required: false },
  id: { type: String, required: true, unique: true },
  timestamp: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: true }
});

export default mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
