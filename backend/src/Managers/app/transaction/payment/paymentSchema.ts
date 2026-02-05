import z from "zod";
import zodFields from "../../../../zod/Fields.js";
import Enums from "../../../../func/Enums.js";

const base = z.object({
  profile: z.enum(Enums.accountProfiles),
  drawer: zodFields.objectId("drawer"),
  currency: z.enum(Enums.currencies),
  amount: z.number().min(0),
  date: zodFields.date,
  note: z.string().optional(),
  action: z.enum(Enums.action),
  store: zodFields.objectId("store"),
});

const paymentSchema = {
  base,
};

export default paymentSchema;
