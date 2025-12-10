import { v4 as uuid } from 'uuid';
import bucket from '../../../config/firebase-admin.js';
import sharp from 'sharp';

export async function uploadFile({
  file,
  folder = 'unknown',
  name,
  resize,
}: {
  name?: string;
  file: Express.Multer.File;
  folder?: string;
  resize?: boolean;
}) {
  const extension = file.originalname.split('.').pop();
  let fileName: string;
  if (name) {
    fileName = name;
  } else {
    fileName = file.originalname.split('.').slice(0, -1).join('.');
  }
  const destination = `${folder}/${fileName}-${uuid()}-${Date.now()}.${extension}`;

  const fileRef = bucket.file(destination);

  console.log(`Uploading ${file.originalname}: started`);

  try {
    let fileData = file.buffer;
    if (resize) {
      // Resize the image to 1024x768 using Sharp
      fileData = await sharp(file.buffer).resize(1024, 768).toBuffer();
    }

    await fileRef.save(fileData, {
      resumable: false, // no chunk tracking needed
      contentType: file.mimetype,

      metadata: { cacheControl: 'public,max-age=31536000' },
    });
    const downloadUrl = await fileRef.getSignedUrl({
      action: 'read',
      expires: '01-01-3000', // Adjust expiration date as needed
    });
    return {
      ok: true,
      name: file.originalname,
      url: downloadUrl[0],
      status: 'uploaded',
    };
  } catch (err: any) {
    console.error(`Error uploading ${file.originalname}:`, err.message);

    return {
      ok: false,
      name: file.originalname,
      status: 'failed',
      error: err.message,
    };
  }
}

export const updateImageByUrl = async ({
  imageUrl,
  file,
  name,
}: {
  imageUrl: string;
  file: Express.Multer.File;
  name?: string;
}) => {
  try {
    const url = new URL(imageUrl);
    const decodedPath = decodeURIComponent(url.pathname);
    const pathParts = decodedPath.split('/');
    const path = pathParts.slice(2).join('/');

    // Get a reference to the file in Cloud Storage
    const fileRef = bucket.file(path);

    // Check if the old file exists
    const [exists] = await fileRef.exists();
    if (!exists) {
      return { ok: false, message: 'Old image not found', url: null };
    }

    const newPath = path.substring(0, path.lastIndexOf('/') + 1) + name;

    const newFileRef = bucket.file(newPath);

    // Save the new file
    await newFileRef.save(file.buffer, { contentType: file.mimetype });

    // Get signed URL
    const [updatedUrl] = await newFileRef.getSignedUrl({
      action: 'read',
      expires: '01-01-3000',
    });

    return { ok: true, message: 'Updated successfully', url: updatedUrl };
  } catch (error: any) {
    // console.error('Error updating image:', error);
    return { ok: false, error: error.message, url: null };
  }
};

export const deleteImageByUrl = async (imageUrl: string) => {
  try {
    const url = new URL(imageUrl);
    const decodedPath = decodeURIComponent(url.pathname);
    const pathParts = decodedPath.split('/');
    const path = pathParts.slice(2).join('/');

    // Get a reference to the file in Cloud Storage
    const fileRef = bucket.file(path);

    // Check if file exists
    const [exists] = await fileRef.exists();
    if (!exists) {
      return { ok: false, message: 'File not found' };
    }

    // Delete the file
    await fileRef.delete();

    return { ok: true, message: 'File deleted successfully' };
  } catch (error: any) {
    console.error('Error deleting file:', error);
    return { ok: false, message: error.message || 'Something went wrong' };
  }
};
