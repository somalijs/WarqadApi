import mongoose, { ClientSession } from 'mongoose';
import { ExpressRequest } from '../../../types/Express.js';
import { v4 as uuidV4 } from 'uuid';
import {
  deleteImageByUrl,
  updateImageByUrl,
  uploadFile,
} from '../upload/UploadFile.js';
import getImageModel from '../../../models/Images.js';
const updateImage = async ({
  req,
  id,
  session,
  name,
  url,
}: {
  session?: ClientSession;
  req: ExpressRequest;
  id: string | mongoose.Types.ObjectId;
  name: string;
  url: string;
}) => {
  if (!req.files || req.files.length === 0) {
    throw new Error('No files uploaded');
  }
  const Image = getImageModel(req.db!);

  const files = (req.files as Express.Multer.File[]) || [];
  if (files.length > 1) {
    throw new Error(`Only one image is allowed`);
  }
  const file = files[0];
  let upload: any;
  if (url && url !== '') {
    upload = await updateImageByUrl({
      file,
      name: name || uuidV4(),
      imageUrl: url,
    });
  } else {
    upload = await uploadFile({
      file,
      folder: 'ahbaab',
      name: name || uuidV4(),
    });
  }

  const updateData: any = {};
  if (upload.ok) {
    updateData.path = upload.url;
    updateData.status = 'done';
  } else {
    updateData.status = 'failed';
    updateData.error = upload.error;
  }
  // update the package
  const updatePackage = await Image.findOneAndUpdate(
    {
      _id: id,
    },
    updateData,
    {
      new: true, // return the replaced document
      runValidators: true,
      session, // if using a transaction
    }
  );
  if (!updatePackage) {
    // delete the uploaded file
    await deleteImageByUrl(upload?.url!);
    throw new Error('Failed to update image');
  }
  return updatePackage;
};

export default updateImage;
