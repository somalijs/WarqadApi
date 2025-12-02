import expressAsyncHandler from 'express-async-handler';
import Store from '../../../services/Stores/index.js';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import getAppModel from '../../../models/app.js';

const getStores = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { app, obj } = req.query;
    const isApp = await getAppModel().findOne({ _id: app });
    if (!isApp) {
      throw new Error('App not founds');
    }
    const stores = await Store.get({ req, dbName: isApp.ref });
    if (obj === 'true') {
      res.status(200).json({
        data: stores,
        total: stores.length,
        appName: `${isApp.name}`,
      });
    } else {
      res.status(200).json(stores);
    }
  }
);

export default getStores;
