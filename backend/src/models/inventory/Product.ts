import { Model, Schema, InferSchemaType } from "mongoose";
import { getDatabaseInstance } from "../../config/database.js";
import { bySchema } from "../configs/Fields.js";

const productSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
    },
    unit: {
      type: String,
      enum: ["ctn", "pack", "pcs"],
      required: true,
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    imgUrl: {
      type: String,
    },
    unitQty: {
      type: Number,
      default: 1,
    },
    cost: {
      type: Number,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    by: {
      type: bySchema,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);
productSchema.index({ name: 1, isDeleted: 1, cost: 1, unit: 1 });
// add unique name and store and unit
productSchema.index(
  { name: 1, store: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
export type ProductDocument = InferSchemaType<typeof productSchema>;

const getProductModel = (db: string): Model<ProductDocument> => {
  return getDatabaseInstance(db).model<ProductDocument>(
    "Product",
    productSchema,
  );
};

export default getProductModel;
