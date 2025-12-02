import { InferSchemaType, Schema } from 'mongoose';

import { Model } from 'mongoose';
import { getDatabaseInstance } from '../config/database.js';

const packageSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Name is required'],
    },
    type: {
      type: String,
      enum: ['umrah', 'hajj', 'hotel'],
      required: [true, 'Name is required'],
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'Name is required'],
    },

    details: {
      type: Object,
    },
    features: {
      type: [String],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
export type PackageDocument = InferSchemaType<typeof packageSchema>;
export type PackageFields = Pick<
  InferSchemaType<typeof packageSchema>,
  'name' | 'description' | 'details' | 'features' | 'price'
>;
const getPackageModel = (db: string): Model<PackageDocument> => {
  return getDatabaseInstance(db).model<PackageDocument>(
    'Package',
    packageSchema
  );
};

export default getPackageModel;
