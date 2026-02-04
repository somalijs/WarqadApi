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
  store: zodFields.objectId("store"),
  note: z.string().optional(),
  stocks: z.array(stockSchema).min(1, "At least one stock is required"),
  action: z.enum(["credit", "debit"]),
});
const StockAdjustmentSchema = {
  base,
};
export default StockAdjustmentSchema;
