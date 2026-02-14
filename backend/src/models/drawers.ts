import { Schema, InferSchemaType, Model } from "mongoose";
import { bySchema } from "./configs/Fields.js";
import { getDatabaseInstance } from "../config/database.js";
import Enums from "../func/Enums.js";

const drawerSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Drawer name is required"],
      lowercase: true,
      trim: true,
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      //   required: [true, "Store is required"],
    },
    type: {
      type: String,
      enum: Enums.drawerTypes,
      required: [true, "Drawer type is required"],
    },
    currency: {
      type: String,
      enum: Enums.currencies,
      required: [true, "Currency is required"],
    },
    description: {
      type: String,
      lowercase: true,
      trim: true,
    },
    restricted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    by: { type: bySchema, required: [true, "Creator is required"] },
  },
  { timestamps: true },
);
drawerSchema.index(
  { name: 1, type: 1, store: 1, currency: 1 },
  { unique: true },
);

export type DrawerDocument = InferSchemaType<typeof drawerSchema>;
// Creation type checker — matches your other models by omitting generated fields
export type DrawerFields = Omit<
  InferSchemaType<typeof drawerSchema>,
  "createdAt" | "updatedAt" | "_id" | "isDeleted" | "isActive"
>;

const getDrawerModel = (name: string): Model<DrawerDocument> => {
  const db = getDatabaseInstance(name);
  return (
    (db.models.Drawer as Model<DrawerDocument>) ||
    db.model<DrawerDocument>("Drawer", drawerSchema)
  );
};

export default getDrawerModel;
