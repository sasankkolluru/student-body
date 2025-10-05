import mongoose, { Schema, Document } from 'mongoose';

export interface IComment {
  _id?: string;
  userId: string;
  text: string;
  createdAt: Date;
}

export interface IGalleryImage extends Document {
  url: string; // relative URL like /uploads/gallery/...
  title: string;
  description?: string;
  category: string;
  uploadedBy: string; // userId
  uploadedAt: Date;
  likes: number;
  likedBy: string[]; // userIds
  comments: IComment[];
}

const CommentSchema = new Schema<IComment>({
  userId: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const GalleryImageSchema = new Schema<IGalleryImage>({
  url: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
  comments: { type: [CommentSchema], default: [] },
}, { timestamps: true });

export default mongoose.model<IGalleryImage>('GalleryImage', GalleryImageSchema);
