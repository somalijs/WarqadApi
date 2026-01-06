import { Model, Schema } from "mongoose";
import Enums from "../func/Enums.js";
import { InferSchemaType } from "mongoose";
import { getDatabaseInstance } from "../config/database.js";
import { bySchema } from "./configs/Fields.js";
const accountSchema = new Schema(
  {
    // base data
    name: {
      type: String,
      trim: true,
      lowercase: true,
      minLength: [2, "Name must be at least 2 characters"],
      maxLength: [30, "Name must be less than 30 characters"],
      required: [true, "Name is required"],
    },
    phoneNumber: {
      type: String,
      trim: true,
      lowercase: true,
      maxLength: [15, "Phone number must be less than 15 characters"],
      match: [/^\+?[0-9]{5,15}$/, "Please enter a valid phone number"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: (email: string) => {
          if (email && email !== "")
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
          return true;
        },
        message: "Please enter a valid email address",
      },
    },
    houseNo: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      maxLength: [100, "Address must be less than 100 characters"],
    },
    profile: {
      type: String,
      enum: Enums.accountProfiles,
      required: [true, "Profile is required"],
    },
    // customer additional data
    guarantor: {
      name: String,
      phoneNumber: String,
      address: String,
    },
    // supplier additional data
    company: {
      name: String,
      phoneNumber: String,
      address: String,
    },
    creditLimit: {
      type: Number,
    },
    // employee additional data
    store: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "Store is required"],
    },
    salary: {
      type: Number,
    },
    type: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    by: {
      type: bySchema,
      required: [true, "Creator is required"],
    },
  },
  {
    timestamps: true,
  }
);

accountSchema.index({ name: 1, profile: 1, store: 1 }, { unique: true });

accountSchema.index({ name: 1 });
accountSchema.index({ phone: 1 });
accountSchema.index({ store: 1 });

export type AccountDocument = InferSchemaType<typeof accountSchema>;

export type CustomerFieldsType = Pick<
  AccountDocument,
  | "name"
  | "phoneNumber"
  | "email"
  | "address"
  | "profile"
  | "guarantor"
  | "creditLimit"
  | "store"
>;
export type SupplierFieldsType = Pick<
  AccountDocument,
  "name" | "phoneNumber" | "email" | "address" | "profile" | "store"
>;
export type EmployeeFieldsType = Pick<
  AccountDocument,
  "name" | "phoneNumber" | "email" | "address" | "profile" | "store" | "salary"
>;

const getAccountModel = (db: string): Model<AccountDocument> => {
  return getDatabaseInstance(db).model<AccountDocument>(
    "Accounts",
    accountSchema
  );
};

export default getAccountModel;
