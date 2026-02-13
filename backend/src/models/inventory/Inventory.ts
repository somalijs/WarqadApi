import { Model, Schema, InferSchemaType } from "mongoose";
import { getDatabaseInstance } from "../../config/database.js";
import { bySchema } from "../configs/Fields.js";
const inventorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    type: {
      type: String,
      enum: ["brand", "category"],
      required: true,
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: "Store",
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

inventorySchema.index(
  { name: 1, store: 1, type: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

export type InventoryDocument = InferSchemaType<typeof inventorySchema>;

const getInventoryModel = (db: string): Model<InventoryDocument> => {
  return getDatabaseInstance(db).model<InventoryDocument>(
    "Inventory",
    inventorySchema,
  );
};

export default getInventoryModel;
