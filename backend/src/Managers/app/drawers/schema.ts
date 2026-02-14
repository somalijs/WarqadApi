import z from "zod";
import zodFields from "../../../zod/Fields.js";
import Enums from "../../../func/Enums.js";

const AccountSchema = {
  base: z.object({
    name: zodFields.name,
    description: z.string().optional(),
    type: z.enum(Enums.drawerTypes),
    store: zodFields.objectId("Store").optional(),
    restricted: z.boolean().optional(),
    currency: z.enum(Enums.currencies),
  }),

  storeId: z.object({
    store: zodFields.objectId("Store"),
  }),
};

export default AccountSchema;
