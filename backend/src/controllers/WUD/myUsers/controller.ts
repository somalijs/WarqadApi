import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import User from '../../../services/Profiles/users/index.js';
import getUserModel from '../../../models/profiles/User.js';

const getUsers = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const data = await User.get({ req, Model: getUserModel(req.db!) });

    res.status(200).json(data);
  }
);

export { getUsers };
