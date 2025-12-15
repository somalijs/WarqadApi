import { Schema, InferSchemaType, Model } from 'mongoose';
import { bySchema } from './configs/Fields.js';
import { getDatabaseInstance } from '../config/database.js';
import { secretKeyManager } from '../func/Encryptions.js';

const appSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'App name is required'],
      lowercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['private', 'family'],
      required: [true, 'App type is required'],
    },
    host: {
      type: String,
      required: [true, 'App name is required'],
      lowercase: true,
      trim: true,
      set: (value: string) => value.replace(/\s+/g, ''),
    },
    ref: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    key: {
      type: String,
    },
    domains: {
      type: [String],
      default: [],
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    by: { type: bySchema, required: [true, 'Creator is required'] },
  },
  { timestamps: true }
);
appSchema.index({ host: 1 }, { unique: true });
// after save add key
appSchema.pre('save', async function (next) {
  const key = await secretKeyManager.create();
  if (!this.key) {
    this.key = key.encrypted;
  }
  next();
});
export type AppDocument = InferSchemaType<typeof appSchema>;
// Creation type checker — matches your other models by omitting generated fields
export type AppFields = Omit<
  InferSchemaType<typeof appSchema>,
  'createdAt' | 'updatedAt' | '_id' | 'isDeleted' | 'domains' | 'key'
>;

const getAppModel = (): Model<AppDocument> => {
  const db = getDatabaseInstance('application');
  return (
    (db.models.App as Model<AppDocument>) ||
    db.model<AppDocument>('App', appSchema)
  );
};

export default getAppModel;
