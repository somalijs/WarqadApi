import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../types/Express.js";
import { coverImageSchema } from "./schema.js";
import getPropertyModel from "../../../models/Properties.js";
import {
  deleteImageByUrl,
  uploadFile,
} from "../../../services/Files/upload/UploadFile.js";
import { v4 as uuidV4 } from "uuid";
type props = {
  req: ExpressRequest;
  session: ClientSession;
};

const propertyImages = async ({ req, session }: props) => {
  const Property = getPropertyModel(req.db!);
  const { property } = await coverImageSchema.parseAsync(req.query);

  // check if property exists
  const propertyExists = await Property.findOne({
    _id: property,
    isDeleted: false,
  }).session(session);
  if (!propertyExists) {
    throw new Error("Property not found");
  }
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    throw new Error("Please upload at least one image");
  }

  let images: string[] = [];

  for (const file of files) {
    const name = `${propertyExists.name}-${propertyExists._id}-${uuidV4()}`;
    const upload = await uploadFile({
      file,
      folder: req.db!,
      name: name,
    });
    if (upload.ok && upload.url) {
      images.push(upload.url);
    }
  }
  if (images.length === 0) {
    throw new Error(
      `Failed to upload ${files.length > 1 ? "images" : "image"}`,
    );
  }
  const updateImages = await Property.findOneAndUpdate(
    { _id: propertyExists._id },
    { $push: { "media.images": { $each: images } } },
    { new: true, session, runValidators: true },
  );
  if (!updateImages) {
    await Promise.all(images.map((image) => deleteImageByUrl(image)));
    throw new Error("Failed to update property");
  }
  return updateImages;
};

export default propertyImages;
