import z from "zod";
import zodFields from "../../../../zod/Fields.js";
import Enums from "../../../../func/Enums.js";

const listObject = z.object({
  item: z.string(),
  quantity: z.number().min(0),
  price: z.number().min(0),
});
const cargoObject = z.object({
  desc: z.string(),
  bags: z.number().min(1),
  cbm: z.number().min(0),
  price: z.number().min(0),
});
const base = z.object({
  customer: zodFields.objectId("Customer id").optional(),
  date: zodFields.date,
  currency: z.enum(Enums.currencies),
  invoiceList: z.enum(Enums.invoiceListTypes),
  note: z.string().optional(),
  store: zodFields.objectId("Store"),
  profile: z.enum(["customer", "supplier"]),
});
const productList = z.object({
  list: z.array(listObject).min(1),
});
const cargoList = z.object({
  list: z.array(cargoObject).min(1),
});

export const InvoiceSchema = {
  list: base,
  product: productList,
  cargo: cargoList,
};

export default InvoiceSchema;
