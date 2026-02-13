import { Model, Schema, InferSchemaType } from "mongoose";
import { getDatabaseInstance } from "../../config/database.js";
import { bySchema } from "../configs/Fields.js";
import Enums from "../../func/Enums.js";
const itemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  cost: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
});
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
      default: "pcs",
    },
    type: {
      type: String,
      enum: Enums.productTypes,
      default: "item",
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Inventory",
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: "Inventory",
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: "Store",
    },
    imgUrl: {
      type: String,
    },
    unitQty: {
      type: Number,
      default: 1,
    },
    items: {
      type: [itemSchema],
      required: [
        function (this: any) {
          return ["pressure", "bag"].includes(this.type);
        },
        "items is required",
      ],
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
  { name: 1, store: 1, type: 1 },
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
