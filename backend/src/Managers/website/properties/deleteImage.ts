import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../types/Express.js";
import { coverImageSchema } from "./schema.js";
import getPropertyModel from "../../../models/Properties.js";
import { deleteImageByUrl } from "../../../services/Files/upload/UploadFile.js";

import z from "zod";
type props = {
  req: ExpressRequest;
  session: ClientSession;
};
const deleteImageSchema = z.object({
  image: z.string().min(1, "Image URL is required"),
  type: z.enum(["cover", "images"]),
});
const deleteImage = async ({ req, session }: props) => {
  const Property = getPropertyModel(req.db!);
  const { property } = coverImageSchema.parse(req.query);
  const { image, type } = deleteImageSchema.parse(req.body);

  // check if property exists
  const propertyExists = await Property.findOne({
    _id: property,
    isDeleted: false,
  }).session(session);
  if (!propertyExists) {
    throw new Error("Property not found");
  }

  const file = image;

  let updateMedia;
  if (type === "cover") {
    if (propertyExists.media?.cover !== image) {
      throw new Error("Image not found");
    }
    updateMedia = { $set: { "media.cover": "" } };
  } else {
    if (!propertyExists.media?.images.includes(image)) {
      throw new Error("Image not found");
    }
    updateMedia = { $pull: { "media.images": image } };
  }

  const updatedProperty = await Property.findOneAndUpdate(
    { _id: propertyExists._id },
    updateMedia,
    { new: true, session, runValidators: true },
  );
  if (!updatedProperty) {
    throw new Error("Failed to delete image");
  }
  const deleted = await deleteImageByUrl(file);
  if (!deleted.ok) throw new Error("Failed to delete image from cloud");
  return updatedProperty;
};

export default deleteImage;
