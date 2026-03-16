import { Schema, InferSchemaType, Model } from "mongoose";
import { bySchema } from "./configs/Fields.js";
import { getDatabaseInstance } from "../config/database.js";
import Enums from "../func/Enums.js";

// Helper functions for slugification
const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
};

async function generateUniqueSlug(
  model: Model<any>,
  name: string,
  currentId?: any,
): Promise<string> {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await model.findOne({
      slug,
      _id: { $ne: currentId },
      isDeleted: false,
    });
    if (!existing) return slug;
    slug = `${baseSlug}-${counter++}`;
  }
}

const propertySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      lowercase: true,
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    propertyType: {
      type: String,
      enum: Enums.propertyTypes,
      required: [true, "Property type is required"],
    },
    listingType: {
      type: String,
      enum: Enums.listingTypes,
      required: [true, "Listing type is required"],
    },
    stories: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      enum: Enums.currencies,
      required: [true, "Currency is required"],
    },
    location: {
      address: { type: String, required: [true, "Address is required"] },
      city: String,
      state: String,
      zip: String,
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          default: [0, 0],
        },
      },
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
    amenities: [
      {
        type: String,
      },
    ],
    isFeatured: {
      type: Boolean,
      default: false,
    },

    by: { type: bySchema, required: [true, "Creator is required"] },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

propertySchema.index(
  { name: 1, store: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
propertySchema.index({ status: 1 });
propertySchema.index({ "location.coordinates": "2dsphere" });
propertySchema.index({ "location.city": 1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

// Middleware to generate slug
propertySchema.pre("save", async function (this: any, next) {
  if (this.isModified("name") || this.isNew) {
    this.slug = await generateUniqueSlug(
      this.constructor as Model<any>,
      this.name,
      this._id,
    );
  }
  next();
});

propertySchema.pre("findOneAndUpdate", async function (this: any, next) {
  const update = this.getUpdate() as any;
  const name = update.name || (update.$set && update.$set.name);

  if (name) {
    const model = this.model;
    const filter = this.getQuery();
    const doc = await model.findOne(filter);
    const id = doc?._id;
    const slug = await generateUniqueSlug(model, name, id);

    if (update.$set) {
      update.$set.slug = slug;
    } else {
      update.slug = slug;
    }
  }
  next();
});

export type PropertyDocument = InferSchemaType<typeof propertySchema>;

export type PropertyFields = Omit<
  PropertyDocument,
  "createdAt" | "updatedAt" | "_id" | "isDeleted"
>;

const getPropertyModel = (name: string): Model<PropertyDocument> => {
  const db = getDatabaseInstance(name);
  return (
    (db.models.Property as Model<PropertyDocument>) ||
    db.model<PropertyDocument>("Property", propertySchema)
  );
};

export default getPropertyModel;
