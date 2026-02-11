import { Schema, InferSchemaType, Model } from "mongoose";
import { bySchema } from "./configs/Fields.js";
import { getDatabaseInstance } from "../config/database.js";
import Enums from "../func/Enums.js";

const unitSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },
    profile: {
      type: String,
      enum: Enums.unitProfiles,
      required: [true, "Profile is required"],
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "Store is required"],
    },
    floor: {
      type: String,
      required: [true, "Floor is required"],
    },
    no: {
      type: String,
      required: [true, "No is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
    },
    currency: {
      type: String,
      enum: Enums.currencies,
      required: [true, "Currency is required"],
    },
    deposit: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: String,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: String,
    },
    by: { type: bySchema, required: [true, "Creator is required"] },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);
unitSchema.index(
  { store: 1, floor: 1, no: 1 },
  {
    unique: true,
    partialFilterExpression: { endDate: null, isDeleted: false },
  },
);
export type UnitDocument = InferSchemaType<typeof unitSchema>;
// Creation type checker — matches your other models by omitting generated fields
export type UnitFields = Omit<
  InferSchemaType<typeof unitSchema>,
  "createdAt" | "updatedAt" | "_id" | "isDeleted"
>;

const getUnitModel = (name: string): Model<UnitDocument> => {
  const db = getDatabaseInstance(name);
  return (
    (db.models.Unit as Model<UnitDocument>) ||
    db.model<UnitDocument>("Unit", unitSchema)
  );
};

export default getUnitModel;
