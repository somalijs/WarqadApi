import z from "zod";
import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../types/Express.js";
import addLogs from "../Logs.js";
import Compare from "../../func/compare/index.js";
import Enums from "../../func/Enums.js";
import zodFields from "../../zod/Fields.js";
import getStoreModel from "../../models/Store.js";
import { dbName } from "../../server.js";
import getAppModel from "../../models/app.js";
const paramsSchema = z.object({
  id: zodFields.objectId("Store ID is required"),
});

// Only details fields; app is intentionally NOT updatable here
const updateDetailsSchema = z.object({
  name: z
    .string()
    .min(3)
    .max(25)
    .transform((val) => val.trim().toLowerCase().replace(/\s+/g, " "))
    .optional(),
  type: z.enum(Enums.StoreType),
  address: z.string().min(3).max(100).optional(),
  phoneNumber: z.string().min(6).optional(),
  subType: z.string(),
  email: z
    .string()
    .email()
    .transform((v) => v.trim().toLowerCase())
    .optional(),
  app: zodFields.objectId("App ID is required"),
  currency: z.enum(Enums.currencies).optional(),
});

async function updateDetails({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) {
  const { id } = paramsSchema.parse(req.params);
  const updates = updateDetailsSchema.parse(req.body);
  // @ts-ignore
  if (!updates?.type) {
    throw new Error("Invalid type");
  }
  const subTypes = Enums.storeEnums[updates.type] || [];

  if (!subTypes.includes(updates?.subType)) {
    throw new Error(`Invalid subtype for ${updates.type}`);
  }
  const { app } = updates;
  const isApp = await getAppModel().findOne({ _id: app, isDeleted: false });
  if (!isApp) {
    throw new Error("App not found");
  }
  const Model = getStoreModel(isApp?.ref);
  const current = await Model.findOne({ _id: id }).session(session);
  if (!current) {
    throw new Error("Store not found");
  }

  const news: any = {
    name: updates.name ?? current.name,
    type: updates.type ?? current.type,
    address: updates.address ?? current.address,
    phoneNumber: updates.phoneNumber ?? current.phoneNumber,
    email: updates.email ?? current.email,
    subType: updates.subType ?? current.subType,
    currency: updates.currency ?? current.currency,
  };
  const olds = {
    name: current.name,
    type: current.type,
    address: current.address,
    phoneNumber: current.phoneNumber,
    email: current.email,
    subType: current.subType,
    currency: current.currency,
  };

  const changed = Compare.compareObjects({ old: olds, new: news });
  if (!changed) {
    throw new Error("No changes to update");
  }

  const updated = await Model.findByIdAndUpdate(current._id, updates, {
    new: true,
    session,
    runValidators: true,
  });
  if (!updated) {
    throw new Error("Failed to update store");
  }

  await addLogs({
    model: { type: "store", _id: updated._id },
    data: changed.new,
    old: changed.old,
    by: req.by!,
    action: "update",
    session,
    dbName,
  });

  return updated;
}

export default updateDetails;
