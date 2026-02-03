import { z } from "zod";
import zodFields from "../../../../zod/Fields.js";

const stockSchema = z.object({
  index: z.number(),
  product: zodFields.objectId("product"),
  quantity: z.number(),
  cost: z.number(),
});
const base = z.object({
  date: zodFields.date,
  supplier: zodFields.objectId("supplier"),
  store: zodFields.objectId("store"),
  note: z.string().optional(),
});
const stockSupply = base.extend({
  stocks: z.array(stockSchema).min(1, "At least one stock is required"),
});
const clearance = base.extend({
  transaction: zodFields.objectId("transaction"),
  amount: z.number(),
  description: z.string(),
  arrival: zodFields.date,
  departure: zodFields.date,
});
const purchaseSchema = {
  base,
  stockSupply,
  clearance,
};
export default purchaseSchema;
