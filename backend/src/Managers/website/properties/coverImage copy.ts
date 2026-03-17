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

const coverImage = async ({ req, session }: props) => {
  const Property = getPropertyModel(req.db!);
  const { property } = await coverImageSchema.parseAsync(req.query);

  // check if property exists
  const propertyExists = await Property.findById({
    _id: property,
    isDeleted: false,
  }).session(session);
  if (!propertyExists) {
    throw new Error("Property not found");
  }
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    throw new Error("Please upload a cover image");
  }

  let images: string[] = [];
  const name = `${propertyExists.name}-${propertyExists._id}-${uuidV4()}`;
  for (const file of files) {
    const upload = await uploadFile({
      file,
      folder: req.db!,
      name: name,
    });
    if (upload.ok && upload.url) {
      images.push(upload.url);
    }
  }
  const updateCover = await Property.findByIdAndUpdate(
    { _id: propertyExists._id },
    { $push: { "media.cover": { $each: images } } },
    { new: true, session, runValidators: true },
  );
  if (!updateCover) {
    await Promise.all(images.map((image) => deleteImageByUrl(image)));
    throw new Error("Failed to update property");
  }
  return updateCover;
};

export default coverImage;
