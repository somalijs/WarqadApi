import { Schema, InferSchemaType, Model } from "mongoose";
import { bySchema } from "./configs/Fields.js";
import { getDatabaseInstance } from "../config/database.js";

const tenantSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "Store is required"],
    },
    floor: {
      type: Number,
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
tenantSchema.index(
  { store: 1, floor: 1, no: 1 },
  {
    unique: true,
    partialFilterExpression: { endDate: null, isDeleted: false },
  },
);
export type TenantDocument = InferSchemaType<typeof tenantSchema>;
// Creation type checker — matches your other models by omitting generated fields
export type TenantFields = Omit<
  InferSchemaType<typeof tenantSchema>,
  "createdAt" | "updatedAt" | "_id" | "isDeleted"
>;

const getTenantModel = (name: string): Model<TenantDocument> => {
  const db = getDatabaseInstance(name);
  return (
    (db.models.Tenant as Model<TenantDocument>) ||
    db.model<TenantDocument>("Tenant", tenantSchema)
  );
};

export default getTenantModel;
