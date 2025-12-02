import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';

import User from '../../../services/Profiles/users/index.js';

import getUserModel from '../../../models/profiles/User.js';
import zodFields from '../../../zod/Fields.js';
import z from 'zod';
import getAppModel from '../../../models/app.js';
const appSchema = z.object({
  app: zodFields.objectId('app id'),
});
const getUsers = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { app } = appSchema.parse(req.query);
    const isApp = await getAppModel().findOne({ _id: app, isDeleted: false });
    if (!isApp) {
      throw new Error('App not found');
    }
    const data = await User.get({ req, Model: getUserModel(isApp?.ref) });

    res.status(200).json(data);
  }
);

export { getUsers };
