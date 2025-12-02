import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../types/Express.js';
import EAPI from '../../services/EAPI/index.js';

export const getWebsite = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const data = await EAPI.getWebsite({ req });
    res.status(200).json(data);
  }
);
