import z from "zod";
import zodFields from "../../../zod/Fields.js";
import Enums from "../../../func/Enums.js";

const TransactionSchema = {
  base: z.object({
    type: z.enum(Enums.transactionTypes),
    store: zodFields.objectId("Store"),
    currency: z.enum(Enums.currencies),
    amount: z.number().min(0),
    date: zodFields.date,
    details: z.record(z.string(), z.any()).optional(),
    note: z.string().optional(),
    action: z.enum(Enums.action),
  }),
  payment: z.object({
    profile: z.enum(Enums.accountProfiles),
    drawer: zodFields.objectId("drawer"),
  }),
  expenses: z.object({
    drawer: zodFields.objectId("drawer"),
  }),
  moneyTransfer: z.object({
    from: zodFields.objectId("from"),
    to: zodFields.objectId("to"),
  }),
  exchangedAmount: z.object({
    exchangedAmount: z.number().min(0),
  }),
  adjustment: z.object({
    adjustmentType: z.enum(Enums.adjustmentTypes),
  }),
  CB: z.object({
    broker: zodFields.objectId("Broker").optional(),
    customer: zodFields.objectId("Customer"),
    commission: z.number().optional(),
  }),

  storeId: z.object({
    store: zodFields.objectId("Store"),
  }),
  broker: z.object({
    broker: zodFields.objectId("Broker"),
  }),
  drawer: z.object({
    drawer: zodFields.objectId("drawer"),
  }),
  customer: z.object({
    customer: zodFields.objectId("customer"),
  }),

  supplier: z.object({
    supplier: zodFields.objectId("supplier"),
  }),
  employee: z.object({
    employee: zodFields.objectId("employee"),
  }),
  types: z.object({
    types: z.enum([
      ...Enums.adjustmentTypes,
      "payment",
      "money-transfer",
      "expenses",
      "invoice-list",
      "journal",
      "house-invoice",
      "stock-supply",
      "stock-supply-clearance",
      "stock-sale",
      "stock-adjustment",
    ]),
  }),
  shop: z.object({
    shop: zodFields.objectId("shop"),
  }),
  exchangeRate: z.object({
    exchangeRate: z.number().min(0),
  }),
};

export default TransactionSchema;
