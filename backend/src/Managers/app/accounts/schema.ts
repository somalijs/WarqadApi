import z from "zod";
import zodFields from "../../../zod/Fields.js";
import Enums from "../../../func/Enums.js";

const AccountSchema = {
  base: z.object({
    name: zodFields.name,
    phoneNumber: zodFields.phoneNumber.optional(),
    email: z.string().email().or(z.literal("")).optional(),
    address: z.string().optional(),
    profile: z.enum(Enums.accountProfiles),

    store: zodFields.objectId("Store"),
  }),
  customer: z.object({
    guarantor: z
      .object({
        name: z.string().optional(),
        phoneNumber: z.string().optional(),
        address: z.string().optional(),
      })
      .optional(),
    houseNo: z.string().optional(),
    creditLimit: z.number().optional(),
  }),
  supplier: z.object({
    company: z
      .object({
        name: z.string().optional(),
        phoneNumber: z.string().optional(),
        address: z.string().optional(),
      })
      .optional(),
  }),
  employee: z.object({
    salary: z.number().optional(),
  }),
  broker: z.object({}),
  storeId: z.object({
    store: zodFields.objectId("Store"),
  }),
};

export default AccountSchema;
