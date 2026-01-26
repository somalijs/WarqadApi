import z from "zod";
import zodFields from "../../../../zod/Fields.js";
import Enums from "../../../../func/Enums.js";

const houseInvoiceSchema = z.object({
  customer: zodFields.objectId("Customer id").optional(),
  date: zodFields.date,
  type: z.enum(Enums.houseInvoices),
  amount: z.number().min(0),
  currency: z.enum(Enums.currencies),
  note: z.string().optional(),
  action: z.enum(Enums.action),
});
const houseInvoiceRentDetails = z.object({
  details: z.object({
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2025).max(2100),
  }),
  tenant: zodFields.objectId("Tenant id"),
});
const houseInvoiceSaleDetails = z.object({
  details: z.object({
    floor: z.number().int().min(0),
    houseNo: z.number().int().min(0),
    description: z.string().optional(),
  }),
  broker: zodFields.objectId("Broker id").optional(),
  commission: z.number().min(0).optional(),
  customer: zodFields.objectId("Customer id").optional(),
});
const InvoiceSchema = {
  houseInvoiceSchema,
  houseInvoiceRentDetails,
  houseInvoiceSaleDetails,
};

export default InvoiceSchema;
