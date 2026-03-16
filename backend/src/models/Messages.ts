import { Schema, InferSchemaType, Model } from "mongoose";
import { getDatabaseInstance } from "../config/database.js";

const messageSchema = new Schema(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Client is required"],
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
    },
    unit: {
      type: Schema.Types.ObjectId,
      ref: "PropertyUnit",
    },
    message: {
      type: String,
      required: [true, "Message content is required"],
    },
  },
  { timestamps: true },
);

// Indexes for faster retrieval
messageSchema.index({ client: 1 });
messageSchema.index({ property: 1 });
messageSchema.index({ unit: 1 });

export type MessageDocument = InferSchemaType<typeof messageSchema>;

const getMessageModel = (dbName: string): Model<MessageDocument> => {
  const db = getDatabaseInstance(dbName);
  return (
    (db.models.Message as Model<MessageDocument>) ||
    db.model<MessageDocument>("Message", messageSchema)
  );
};

export default getMessageModel;
