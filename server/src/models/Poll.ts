import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPollOption {
  _id?: Types.ObjectId;
  text: string;
  votes: number;
}

export interface IPoll extends Document {
  title: string;
  description?: string;
  options: IPollOption[];
  totalVotes: number;
  endDate?: Date;
  createdBy?: Types.ObjectId;
  voters: Array<{ userId: Types.ObjectId; name?: string; email?: string; optionId: Types.ObjectId; createdAt: Date }>; 
  isActive: boolean;
  visibleAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PollOptionSchema = new Schema<IPollOption>({
  text: { type: String, required: true },
  votes: { type: Number, required: true, default: 0 },
});

const VoterSchema = new Schema<{ userId: Types.ObjectId; name?: string; email?: string; optionId: Types.ObjectId; createdAt: Date }>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: String,
  email: String,
  optionId: { type: Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const PollSchema = new Schema<IPoll>({
  title: { type: String, required: true },
  description: String,
  options: { type: [PollOptionSchema], required: true, validate: (v: IPollOption[]) => v.length >= 2 },
  totalVotes: { type: Number, default: 0 },
  endDate: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  voters: { type: [VoterSchema], default: [] },
  isActive: { type: Boolean, default: false },
  visibleAt: { type: Date },
}, { timestamps: true });

export default mongoose.model<IPoll>('Poll', PollSchema);
