import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  fromUserId?: Types.ObjectId;
  name?: string; // for unauthenticated contact forms
  email?: string;
  subject: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  fromUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  name: String,
  email: String,
  subject: { type: String, required: true },
  content: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<IMessage>('Message', MessageSchema);
