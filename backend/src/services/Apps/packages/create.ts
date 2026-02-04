import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../types/Express.js";
import z from "zod";

import addLogs from "../../Logs.js";
import getPackageModel from "../../../models/Packages.js";

const packageSchema = z.object({
  name: z
    .string()
    .min(2, "Name is required")

    .transform((val) => val.trim().toLowerCase().replace(/\s+/g, " ")),
  type: z.enum(["umrah", "hajj", "hotel"]),
  description: z.string().min(3).max(500),
  features: z.array(z.string()).optional(),
  price: z
    .string() // receive as string from form-data
    .transform((val) => Number(val)) // convert to number
    .refine((val) => !isNaN(val), "Price must be a number"),
  details: z.record(z.any(), z.any()).optional(),
});
const addPackage = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) => {
  let datas = req.body as any;

  if (datas.features) {
    datas.features = JSON.parse(datas.features);
  }
  if (datas.details) {
    datas.details = JSON.parse(datas.details);
  }

  const { name, description, features, price, details, type } =
    packageSchema.parse(datas);

  if (["umrah", "hajj"].includes(type)) {
    if (!req.files || req.files.length === 0) {
      throw new Error("Package image is required");
    }
    if (((req.files as Express.Multer.File[]) || []).length > 1) {
      throw new Error("Only one image is allowed");
    }
  }
  if (!req.files || req.files.length === 0) {
    throw new Error("Package image is required");
  }
  if (["umrah", "hajj"].includes(type)) {
    if (((req.files as Express.Multer.File[]) || []).length > 1) {
      throw new Error("Only one image is allowed");
    }
  }
  if (["hotel"].includes(type)) {
    if (((req.files as Express.Multer.File[]) || []).length !== 5) {
      throw new Error("Hotel package must have 5 images");
    }
  }
  const createData = {
    name,
    description,
    features,
    type,
    price,
    details,
  };
  const create = await getPackageModel(req.db!).create([createData], {
    session,
  });
  if (!create.length) {
    throw new Error("Failed to create package");
  }
  const created = create[0];

  // add logs for create action
  await addLogs({
    model: { type: "package", _id: created._id },
    data: created,
    old: {},
    by: req.by!,
    action: "create",
    dbName: req.db!,
    session,
  });

  return {
    message: "Package created successfully",
    data: created,
  };
};

export default addPackage;
