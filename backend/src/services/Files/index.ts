import createImage from './Images/CreateImage.js';
import updateImage from './Images/updateImage.js';
import { deleteImageByUrl } from './upload/UploadFile.js';

const Files = {
  createImageFile: createImage,
  updateImageFile: updateImage,
  deleteImageFile: deleteImageByUrl,
};

export default Files;
