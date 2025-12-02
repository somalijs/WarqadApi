import expressAsyncHandler from 'express-async-handler';
import z from 'zod';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import App from '../../../services/Apps/index.js';
import mongoose from 'mongoose';
import { handleTransactionError } from '../../../func/Errors.js';
import Files from '../../../services/Files/index.js';

import getImageModel from '../../../models/Images.js';

const schema = z.object({
  type: z.enum(['package', 'file']),
});
const createPackage = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { type } = schema.parse(req.params);

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      let resData;
      switch (type) {
        case 'package':
          const datas = await App.Package.add({ req, session });
          const data = datas.data;
          await Files.createImageFile({
            req,
            session,
            id: data._id,
            name: data.name,
          });
          resData = datas;
          break;
        case 'file':
          resData = await Files.deleteImageFile(req.body.url);
          break;
        default:
          throw new Error('Invalid type');
      }
      await session.commitTransaction();
      res.status(200).json(resData);
    } catch (error) {
      await handleTransactionError({ error, session });
    } finally {
      await session.endSession();
    }
  }
);
const updatePackage = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { type } = schema.parse(req.params);
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      let resData;
      switch (type) {
        case 'package':
          resData = await App.Package.replace({ req, session });
          break;
        default:
          throw new Error('Invalid type');
      }
      await session.commitTransaction();
      res.status(200).json(resData);
    } catch (error) {
      await handleTransactionError({ error, session });
    } finally {
      await session.endSession();
    }
  }
);
const deletePackage = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { type } = schema.parse(req.params);
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      let resData;
      switch (type) {
        case 'package':
          resData = await App.Package.delete({ req, session });
          break;
        default:
          throw new Error('Invalid type');
      }
      await session.commitTransaction();
      res.status(200).json(resData);
    } catch (error) {
      await handleTransactionError({ error, session });
    } finally {
      await session.endSession();
    }
  }
);
const updatePackageImage = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { id } = req.params;

      const isExist = await getImageModel(req.db!)
        .findOne({
          _id: id,
          isDeleted: false,
        })
        .session(session);
      if (!isExist) throw new Error('Package not found');
      // update image
      const updateData = await Files.updateImageFile({
        id: isExist._id,
        name: isExist.name,
        url: isExist?.path!,
        req,
        session,
      });
      await session.commitTransaction();
      res.status(200).json(updateData);
    } catch (error) {
      await handleTransactionError({ error, session });
    } finally {
      await session.endSession();
    }
  }
);
export { createPackage, updatePackage, deletePackage, updatePackageImage };
