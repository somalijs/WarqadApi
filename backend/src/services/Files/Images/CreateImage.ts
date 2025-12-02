import mongoose, { ClientSession } from 'mongoose';
import { ExpressRequest } from '../../../types/Express.js';

import { uploadFile } from '../upload/UploadFile.js';
import getImageModel from '../../../models/Images.js';
const createImage = async ({
  req,
  id,
  session,
  name,
}: {
  session?: ClientSession;
  req: ExpressRequest;
  id: string | mongoose.Types.ObjectId;
  name: string;
}) => {
  if (!req.files || req.files.length === 0) {
    throw new Error('No files uploaded');
  }
  const Image = getImageModel(req.db!);
  const files = (req.files as Express.Multer.File[]) || [];
  const uploadedFiles = await Promise.all(
    files.map(async (file, index) => {
      const imageFiles = await Image.create(
        [{ package: id, name: `${name}-${index}` }],
        { session }
      );
      const imageFile = imageFiles[0];
      if (!imageFile) throw new Error('Failed to create image file');

      const upload = await uploadFile({
        file,
        folder: 'ahbaab',
        name: `${name}-${index}`,
      });

      if (upload.ok) {
        imageFile.path = upload.url;
        imageFile.status = 'done';
      } else {
        imageFile.status = 'failed';
        imageFile.error = upload.error;
      }

      await imageFile.save({ session });
      return imageFile;
    })
  );

  return uploadedFiles;
};

export default createImage;
