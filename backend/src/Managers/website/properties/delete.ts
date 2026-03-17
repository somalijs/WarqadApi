import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../types/Express.js";
import getPropertyModel from "../../../models/Properties.js";
import { propertyDeleteSchema } from "./schema.js";
import { deleteImageByUrl } from "../../../services/Files/upload/UploadFile.js";

type props = {
  req: ExpressRequest;
  session: ClientSession;
};

const deleteProperty = async ({ req, session }: props) => {
  const Property = getPropertyModel(req.db!);
  const { id } = propertyDeleteSchema.parse(req.query);

  const property = await Property.findOne({ _id: id }).session(session);
  if (!property) throw new Error("Property not found");
  if (property.isDeleted) throw new Error("Property already deleted");
  const allImages = [];
  if (property.media?.cover) allImages.push(property.media.cover);
  if (property.media?.images) allImages.push(...property.media.images);

  property.isDeleted = true;
  await property.save({ session });
  if (allImages.length > 0) {
    Promise.all(allImages.map((image) => deleteImageByUrl(image))).catch(() => {
      console.log("Image cleanup failed (non-blocking)");
    });
  }
  return { message: "Property deleted successfully" };
};

export default deleteProperty;
