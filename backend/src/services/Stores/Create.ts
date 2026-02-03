import z from "zod";
import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../types/Express.js";
import addLogs from "../Logs.js";
import Enums from "../../func/Enums.js";
import getStoreModel, { storeDetailsType } from "../../models/Store.js";
import zodFields from "../../zod/Fields.js";
import getAppModel from "../../models/app.js";
import { dbName } from "../../server.js";
const createSchema = z.object({
  name: z
    .string()
    .min(3)
    .max(25)
    .transform((val) => val.trim().toLowerCase().replace(/\s+/g, " ")),
  type: z.enum(Enums.StoreType),
  subType: z.string(),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z
    .string()
    .email()
    .transform((v) => v.trim().toLowerCase())
    .optional(),
  app: zodFields.objectId("App ID"),
  currency: z.enum(Enums.currencies).optional(),
});

async function create({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) {
  const body = createSchema.parse(req.body);
  // @ts-ignore
  const subTypes = Enums.storeEnums[body.type];
  if (!subTypes.includes(body.subType)) {
    throw new Error(`Invalid subtype for ${body.type}`);
  }
  const createData: storeDetailsType = {
    name: body.name,
    type: body.type as any,
    address: body.address,
    phoneNumber: body.phoneNumber,
    email: body.email,
    app: body.app as any,
    subType: body.subType,
    currency: body.currency,
  };
  // check if app exists
  const isApp = await getAppModel().findOne({
    _id: body.app,
    isDeleted: false,
  });
  if (!isApp) {
    throw new Error("App not found");
  }

  const Model = getStoreModel(isApp.ref);
  // check if store already exists
  const isStore = await Model.findOne({
    name: body.name,
    app: isApp._id,
  });
  if (isStore) {
    throw new Error("Store already exists with same name and app");
  }
  const created = await Model.create(
    [
      {
        ...createData,
        by: req.by!,
      },
    ],
    { session },
  );
  if (!created.length) {
    throw new Error("Failed to create store");
  }
  const store = created[0];

  await addLogs({
    model: { type: "store", _id: store._id },
    data: createData,
    old: {},
    by: req.by!,
    action: "create",
    dbName,
    session,
  });

  return store;
}

export default create;
