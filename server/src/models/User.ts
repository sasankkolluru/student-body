import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'admin' | 'student';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  regdNo?: string;
  employeeId?: string;
  branch?: string;
  stream?: string;
  year?: string;
  phone?: string;
  avatar?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'student'], required: true },
  regdNo: String,
  employeeId: String,
  branch: String,
  stream: String,
  year: String,
  phone: String,
  avatar: String,
  lastLogin: Date,
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
