import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAchievement extends Document {
  // Student Details
  studentName: string;
  registrationNumber: string;
  branch: string;
  course: string;
  // Event Details
  eventName: string;
  eventType: string;
  eventClassification: string;
  venue: string;
  dateOfParticipation: Date;
  // Achievement Details
  meritPosition: string;
  description: string;
  certificateUrl?: string;
  // Sports Specific
  sportsCategory?: string;
  teamEventType?: string;
  individualEventType?: string;
  trackAndFieldEvent?: string;
  // Meta
  status: 'pending' | 'approved' | 'rejected';
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AchievementSchema = new Schema<IAchievement>({
  studentName: { type: String, required: true },
  registrationNumber: { type: String, required: true },
  branch: { type: String, required: true },
  course: { type: String, required: true },
  eventName: { type: String, required: true },
  eventType: { type: String, required: true },
  eventClassification: { type: String, required: true },
  venue: { type: String, required: true },
  dateOfParticipation: { type: Date, required: true },
  meritPosition: { type: String, required: true },
  description: { type: String, required: true },
  certificateUrl: String,
  sportsCategory: String,
  teamEventType: String,
  individualEventType: String,
  trackAndFieldEvent: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model<IAchievement>('Achievement', AchievementSchema);
