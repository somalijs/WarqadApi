import { InferSchemaType, Model, Schema } from 'mongoose';
import Enums from '../func/Enums.js';
import { getDatabaseInstance } from '../config/database.js';

const imageSchema = new Schema(
  {
    package: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
      required: [true, 'Package id is required'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    progress: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Enums.fileStatus,
      default: 'pending',
    },
    path: {
      type: String,
    },
    error: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export type ImageDocument = InferSchemaType<typeof imageSchema>;

export type ImageCreateSchema = Pick<ImageDocument, 'package'>;

const getImageModel = (db: string): Model<ImageDocument> => {
  return getDatabaseInstance(db).model<ImageDocument>('Image', imageSchema);
};

export default getImageModel;
