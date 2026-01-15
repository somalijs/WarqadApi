import z from "zod";
import zodFields from "../../../../zod/Fields.js";
import Enums from "../../../../func/Enums.js";

const listObject = z.object({
  item: z.string(),
  quantity: z.number().min(0),
  price: z.number().min(0),
});
const base = z.object({
  customer: zodFields.objectId("Customer id").optional(),
  date: zodFields.date,
  currency: z.enum(Enums.currencies),
  list: z.array(listObject).min(1, "At least one item is required"),
  note: z.string().optional(),
  store: zodFields.objectId("Store"),
  profile: z.enum(["customer", "supplier"]),
});
export const InvoiceSchema = {
  list: base,
};

export default InvoiceSchema;
