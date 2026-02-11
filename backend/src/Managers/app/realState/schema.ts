import z from "zod";
import zodFields from "../../../zod/Fields.js";
import Enums from "../../../func/Enums.js";

const addTenantSchema = z.object({
  profile: z.enum(Enums.unitProfiles),
  customer: zodFields.objectId("Customer id"),
  floor: z.string().min(1, "Floor is required"),
  no: z.string().min(1, "No is required"),
  amount: z.number().min(0, "Amount must be a positive number"),
  startDate: zodFields.date,
  currency: z.enum(Enums.currencies),
  deposit: z.number().optional(),
});

const updateTenantSchema = z.object({
  _id: zodFields.objectId("Tenant id"),
  floor: z.string().min(1, "Floor is required").optional(),
  no: z.string().min(1, "No is required").optional(),
  amount: z.number().min(0, "Amount must be a positive number").optional(),
  currency: z.enum(Enums.currencies).optional(),
  deposit: z.number().optional(),
  startDate: zodFields.date.optional(),
  endDate: zodFields.date.optional(),
});

const moveTenantSchema = z.object({
  _id: zodFields.objectId("Tenant id"),
  endDate: zodFields.date,
});

const deleteTenantSchema = z.object({
  _id: zodFields.objectId("Tenant id"),
});

const TenantSchema = {
  addTenantSchema,
  updateTenantSchema,
  moveTenantSchema,
  deleteTenantSchema,
};

export default TenantSchema;
