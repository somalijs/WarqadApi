import { Model, Schema } from "mongoose";
import Enums from "../func/Enums.js";

import { bySchema } from "./configs/Fields.js";
import { InferSchemaType } from "mongoose";
import { getDatabaseInstance } from "../config/database.js";
import { parseDateOrThrow } from "../func/Date.js";

const transactionSchema = new Schema(
  {
    type: {
      type: String,
      enum: Enums.transactionTypes,
      required: [true, "Transaction type is required"],
    },
    invoiceList: {
      type: String,
      enum: Enums.invoiceListTypes,
      function(this: any) {
        return this.type === "invoice-list";
      },
    },
    houseInvoice: {
      type: String,
      enum: Enums.houseInvoices,
      function(this: any) {
        return this.type === "house-invoice";
      },
    },
    houseProfile: {
      type: String,
      enum: Enums.houseInvoiceProfile,
      function(this: any) {
        return this.type === "house-invoice";
      },
    },
    amount: {
      type: Number,
      required: [true, "Transaction amount is required"],
    },
    exchangedAmount: {
      type: Number,
    },
    details: {
      type: Object,
    },
    list: {
      type: Array,
    },
    profile: {
      type: String,
      enum: Enums.accountProfiles,
      function(this: any) {
        return this.type === "payment";
      },
    },
    date: {
      type: String,
      required: [true, "Transaction date is required"],
    },
    dateObj: {
      type: Date,
    },
    ref: {
      type: String,

      trim: true,
      uppercase: true,
      required: [true, "Transaction reference is required"],
    },
    currency: {
      type: String,
      enum: Enums.currencies,
      required: [true, "Transaction currency is required"],
    },
    exchangedCurrency: {
      type: String,
      enum: Enums.currencies,
    },
    sarifCurrency: {
      type: String,
      enum: Enums.currencies,
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "Store is required"],
    },
    unit: {
      type: Schema.Types.ObjectId,
      ref: "Unit",
      function(this: any) {
        return this.type === "house-invoice";
      },
    },
    action: {
      type: String,
      enum: Enums.action,
      required: [true, "Action is required"],
    },
    adjustmentType: {
      type: String,
      enum: Enums.adjustmentTypes,
      required: function (this: any) {
        return this.type === "adjustment";
      },
    },
    exchangeRate: {
      type: Number,
    },
    fee: {
      type: Number,
    },
    sarifAmount: {
      type: Number,
    },
    note: {
      type: String,
    },
    from: {
      type: bySchema,
      function(this: any) {
        return ["money-transfer"].includes(this.type);
      },
    },
    to: {
      type: bySchema,
      function(this: any) {
        return ["money-transfer"].includes(this.type);
      },
    },
    by: { type: bySchema, required: [true, "Creator is required"] },
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // ac
    customer: {
      type: bySchema,
      required: function (this: any) {
        return (
          this.adjustmentType === "customer-broker-invoice" ||
          this.type === "house-invoice"
        );
      },
    },
    shop: {
      type: bySchema,
      required: function (this: any) {
        return this.profile === "shop";
      },
    },
    supplier: {
      type: bySchema,
      required: function (this: any) {
        return (
          this.adjustmentType === "supplier-invoice" ||
          this.profile === "supplier"
        );
      },
    },
    journalType: {
      type: String,
      enum: Enums.journalTypes,
      required: function (this: any) {
        return this.type === "journal";
      },
    },
    sarif: {
      type: bySchema,
      required: function (this: any) {
        return [this.journalType].includes("via sarif");
      },
    },
    employee: {
      type: bySchema,
      required: function (this: any) {
        return (
          this.profile === "employee" ||
          this.adjustmentType === "employee-invoice"
        );
      },
    },
    broker: {
      type: bySchema,
      required: function (this: any) {
        return (
          this.adjustmentType === "broker-invoice" || this.profile === "broker"
        );
      },
    },
    commission: {
      type: Number,
      required: function (this: any) {
        return (
          this.broker != null &&
          this.adjustmentType === "customer-broker-invoice"
        );
      },
    },
  },
  {
    timestamps: true,
  },
);
// make index
transactionSchema.index({ ref: 1 }, { unique: true });
transactionSchema.index({ store: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ dateObj: 1 });
transactionSchema.index({ currency: 1 });
transactionSchema.index({ "by._id": 1 });
transactionSchema.index({ "customer._id": 1 });
transactionSchema.index({ "supplier._id": 1 });
transactionSchema.index({ "employee._id": 1 });
transactionSchema.index({ "broker._id": 1 });

export type TransactionDocument = InferSchemaType<typeof transactionSchema>;
transactionSchema.pre<any>("save", function (next) {
  try {
    if (this.isModified("date")) {
      this.dateObj = parseDateOrThrow(this.date);
    }
    next();
  } catch (err) {
    next(err as Error);
  }
});
const getTransactionModel = (db: string): Model<TransactionDocument> => {
  return getDatabaseInstance(db).model<TransactionDocument>(
    "Transaction",
    transactionSchema,
  );
};

export default getTransactionModel;
