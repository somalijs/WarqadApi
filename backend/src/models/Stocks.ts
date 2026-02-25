import { Model, Schema, InferSchemaType } from "mongoose";
import { getDatabaseInstance } from "../config/database.js";

const stocksSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
    },
    cost: {
      type: Number,
      required: [true, "Cost is required"],
    },
    sell: {
      type: Number,
    },
    transaction: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      required: [true, "Transaction is required"],
    },
    from: {
      type: Schema.Types.ObjectId,
      ref: "Store",
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: "Store",
    },
  },
  {
    timestamps: true,
  },
);

export type StocksDocument = InferSchemaType<typeof stocksSchema>;

const getStocksModel = (db: string): Model<StocksDocument> => {
  return getDatabaseInstance(db).model<StocksDocument>("Stocks", stocksSchema);
};

export default getStocksModel;
