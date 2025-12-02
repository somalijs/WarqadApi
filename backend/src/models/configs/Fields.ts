import mongoose, { Schema } from 'mongoose';
import Enums from '../../func/Enums.js';

export const phoneSchema = new Schema(
  {
    number: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    dialCode: {
      type: String,
      required: [true, 'Dial code is required'],
    },
  },
  { _id: false }
);

export const bySchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, required: true }, // or any relevant model
    name: { type: String, required: true },
  },
  { _id: false }
);
export const modelSchema = new Schema(
  {
    type: {
      type: String,
      enums: Enums.models,
      required: [true, 'Model type is required'],
    },
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'model id is required'],
    },
  },
  { _id: false }
);

export const taxSchema = new Schema(
  {
    rate: {
      type: Number,
      default: 0,
      required: [true, 'Tax rate is required'],
    },
    type: {
      type: String,
      enum: Enums.taxTypes,
      default: 'exclusive',
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    country: {
      type: String,
      enum: Enums.countries,
    },
    pin: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);
