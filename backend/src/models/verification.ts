import mongoose, { InferSchemaType } from 'mongoose';

import Enums from '../func/Enums.js';

import { getDatabaseInstance } from '../config/database.js';
import { Model } from 'mongoose';
import { bySchema } from './configs/Fields.js';

const verificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Enums.VerificationTypes,
      required: [true, 'Token type is required'],
    },
    model: {
      type: String,
      enum: Enums.models,
      required: [true, 'Token model is required'],
    },
    profile: {
      type: bySchema,
      required: ['profile details is required'],
    },

    email: {
      type: String,
      validate: {
        validator: (email: string) => {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: 'Please enter a valid email address',
      },
      required: [
        function (this: any) {
          return this.type === 'email-verification';
        },
        'Email is required',
      ],
    },
    token: {
      type: String,
      required: [true, 'Token is required'],
    },
    expires: {
      type: Number,
      required: [true, 'Token expiration date is required'],
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
export type VerificationDocument = InferSchemaType<typeof verificationSchema>;
export type VerificationFields = Omit<
  VerificationDocument,
  'createdAt' | 'updatedAt' | '_id' | 'isUsed'
>;
const getVerificationModel = (dbName: string): Model<VerificationDocument> => {
  const db = getDatabaseInstance(dbName);
  return (
    (db.models.Verification as Model<VerificationDocument>) ||
    db.model<VerificationDocument>('Verification', verificationSchema)
  );
};

export default getVerificationModel;
