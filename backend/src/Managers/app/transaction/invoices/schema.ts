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
    description: z.string().optional(),
  }),
  unit: zodFields.objectId("Unit id"),
});
const houseInvoiceTenantDetails = z.object({
  details: z.object({
    description: z.string().optional(),
  }),
  unit: zodFields.objectId("Tenant id"),
});
const houseInvoicePaymentDetails = z.object({
  details: z.object({
    description: z.string().optional(),
  }),
  unit: zodFields.objectId("unit id"),
  drawer: zodFields.objectId("Drawer id"),
  profile: z.enum(Enums.houseInvoiceProfile),
});
const houseInvoiceJournalDetails = z.object({
  details: z.object({
    description: z.string().optional(),
  }),
  unit: zodFields.objectId("unit id"),
  profile: z.enum(Enums.houseInvoiceProfile),
  description: z.string(),
});
const houseInvoiceSaleDetails = z.object({
  unit: zodFields.objectId("Unit id"),
  broker: zodFields.objectId("Broker id").optional(),
  commission: z.number().min(0).optional(),
});
const InvoiceSchema = {
  houseInvoiceSchema,
  houseInvoiceRentDetails,
  houseInvoiceSaleDetails,
  houseInvoiceTenantDetails,
  houseInvoicePaymentDetails,
  houseInvoiceJournalDetails,
};

export default InvoiceSchema;
