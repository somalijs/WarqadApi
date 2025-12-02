import expressAsyncHandler from 'express-async-handler';
import {
  ExpressNextFunction,
  ExpressRequest,
  ExpressResponse,
} from '../../types/Express.js';
import z from 'zod';
import { getClientDomain } from '../../func/customs.js';
import getAppModel from '../../models/app.js';
const schema = z.object({
  app: z.string(),
});
const EAPI = expressAsyncHandler(
  async (
    req: ExpressRequest,
    _res: ExpressResponse,
    next: ExpressNextFunction
  ) => {
    const { app } = schema.parse(req.query);
    const { hostname } = getClientDomain(req);
    const isApp = await getAppModel().findOne({ _id: app, isDeleted: false });
    if (!isApp) {
      throw new Error('Invalid App key');
    }
    const domains = isApp?.domains || [];

    if (!domains.includes(hostname)) {
      throw new Error('You are not allowed to access this app');
    }
    req.db = isApp.ref;
    req.appId = isApp._id;
    next();
  }
);

export default EAPI;
