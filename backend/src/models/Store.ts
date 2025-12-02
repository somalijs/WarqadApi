import { Schema, InferSchemaType, Model } from 'mongoose';
import Enums from '../func/Enums.js';
import { bySchema, taxSchema } from './configs/Fields.js';
import { getDatabaseInstance } from '../config/database.js';

const storeSchema = new Schema({
  // details
  name: {
    type: String,
    lowercase: true,
    trim: true,
    required: [true, 'Name is required'],
    minLength: 3,
    maxLength: 25,
  },
  type: {
    type: String,
    enum: Enums.storeTypes,
    required: [true, 'Type is required'],
  },
  subType: {
    type: String,
    required: [true, 'Sub type is required'],
    validate: {
      validator: function (this: any, value: string) {
        if (this.type === 'website') {
          return Enums.websiteTypes.includes(value);
        }
        return true; // allow other types to pass
      },
      message: (props: any) =>
        `${props.value} is not a valid subType for ${props.path}`,
    },
  },
  address: {
    type: String,
    trim: true,
    minLength: 3,
    maxLength: 100,
  },
  phoneNumber: {
    type: String,
    trim: true,
    minLength: 6,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please enter a valid email address',
    },
  },
  // enums
  currencies: {
    type: [String],
    enum: Enums.currencies,
    required: [true, 'Currency is required'],
  },
  tax: {
    type: taxSchema,
  },
  app: {
    type: Schema.Types.ObjectId,
    ref: 'App',
    required: [true, 'App is required'],
  },
  // a
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  by: { type: bySchema, required: [true, 'Creator is required'] },
});

export type StoreDocument = InferSchemaType<typeof storeSchema>;

export type StoreDetailsFields = Pick<
  InferSchemaType<typeof storeSchema>,
  'name' | 'type' | 'address' | 'phoneNumber' | 'email' | 'app' | 'subType'
>;

export type StoreTaxFields = InferSchemaType<typeof taxSchema>;

// Alias requested for services usage
export type storeDetailsType = StoreDetailsFields;

const getStoreModel = (db: string): Model<StoreDocument> => {
  return getDatabaseInstance(db).model<StoreDocument>('Store', storeSchema);
};

export default getStoreModel;
