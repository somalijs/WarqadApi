import { Schema, InferSchemaType, Model } from "mongoose";
import { getDatabaseInstance } from "../config/database.js";

const clientSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
  },
  { timestamps: true },
);

// Unique index for phoneNumber to identify clients
clientSchema.index({ phoneNumber: 1 }, { unique: true });

export type ClientDocument = InferSchemaType<typeof clientSchema>;

const getClientModel = (dbName: string): Model<ClientDocument> => {
  const db = getDatabaseInstance(dbName);
  return (
    (db.models.Client as Model<ClientDocument>) ||
    db.model<ClientDocument>("Client", clientSchema)
  );
};

export default getClientModel;
