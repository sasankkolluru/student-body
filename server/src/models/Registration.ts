import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRegistration extends Document {
  userId?: Types.ObjectId; // optional if guest
  role?: 'admin' | 'student';
  formType: string; // e.g., 'event', 'club', 'workshop'
  data: Record<string, any>; // flexible payload
  status?: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationSchema = new Schema<IRegistration>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  role: { type: String, enum: ['admin', 'student'] },
  formType: { type: String, required: true },
  data: { type: Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
}, { timestamps: true });

export default mongoose.model<IRegistration>('Registration', RegistrationSchema);
