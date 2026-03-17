import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../types/Express.js";
import { coverImageSchema } from "./schema.js";
import getPropertyModel from "../../../models/Properties.js";
import {
  deleteImageByUrl,
  updateImageByUrl,
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
  const propertyExists = await Property.findOne({
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
  const file = files[0];
  const url = propertyExists?.media?.cover;
  let upload: any;
  const name = `${propertyExists.name}-${propertyExists._id}-${uuidV4()}`;
  if (url && url !== "") {
    upload = await updateImageByUrl({
      file,
      name,
      imageUrl: url,
    });
  } else {
    upload = await uploadFile({
      file,
      folder: req.db!,
      name: name,
    });
  }
  if (!upload.ok) throw new Error("Failed to upload image");
  const updateCover = await Property.findOneAndUpdate(
    { _id: propertyExists._id },
    { $set: { "media.cover": upload.url } },
    { new: true, session, runValidators: true },
  );
  if (!updateCover) {
    await deleteImageByUrl(upload.url);
    throw new Error("Failed to update property");
  }
  return updateCover;
};

export default coverImage;
