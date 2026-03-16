import { Schema, InferSchemaType, Model } from "mongoose";
import { bySchema } from "./configs/Fields.js";
import { getDatabaseInstance } from "../config/database.js";
import Enums from "../func/Enums.js";

const propertyUnitSchema = new Schema(
  {
    property: {
      type: Schema.Types.ObjectId,
      ref: "Properties",
      required: [true, "Parent property is required"],
    },
    unitName: {
      type: String,
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: Enums.propertyStatus,
      default: "available",
    },
    price: {
      rent: {
        type: Number,
        default: 0,
      },
      sale: {
        type: Number,
        default: 0,
      },
    },
    rentPeriod: {
      type: String,
      default: "monthly",
      enum: Enums.rentPeriods,
    },
    details: {
      bedrooms: Number,
      bathrooms: Number,
      area: Number,
      areaUnit: { type: String, default: "sqm" },
    },
    media: {
      cover: {
        type: String,
      },
      images: [
        {
          type: String,
        },
      ],
    },
    by: { type: bySchema, required: [true, "Creator is required"] },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

propertyUnitSchema.index(
  { unitName: 1, property: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
propertyUnitSchema.index({ property: 1, status: 1 });
propertyUnitSchema.index({ "price.sale": 1 });
propertyUnitSchema.index({ "price.rent": 1 });

export type PropertyUnitDocument = InferSchemaType<typeof propertyUnitSchema>;

export type PropertyUnitFields = Omit<
  PropertyUnitDocument,
  "createdAt" | "updatedAt" | "_id" | "isDeleted"
>;

const getPropertyUnitModel = (name: string): Model<PropertyUnitDocument> => {
  const db = getDatabaseInstance(name);
  return (
    (db.models.PropertyUnit as Model<PropertyUnitDocument>) ||
    db.model<PropertyUnitDocument>("PropertyUnit", propertyUnitSchema)
  );
};

export default getPropertyUnitModel;
