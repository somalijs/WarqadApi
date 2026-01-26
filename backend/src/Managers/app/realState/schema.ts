import z from "zod";
import zodFields from "../../../zod/Fields.js";

const addTenantSchema = z.object({
  customer: zodFields.objectId("Customer id"),
  floor: z.number().int().min(0, "Floor must be a positive number"),
  no: z.string().min(1, "No is required"),
  amount: z.number().min(0, "Amount must be a positive number"),
  startDate: zodFields.date,
  deposit: z.number().optional(),
});

const updateTenantSchema = z.object({
  _id: zodFields.objectId("Tenant id"),
  floor: z.number().int().min(0, "Floor must be a positive number").optional(),
  no: z.string().min(1, "No is required").optional(),
  amount: z.number().min(0, "Amount must be a positive number").optional(),
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
