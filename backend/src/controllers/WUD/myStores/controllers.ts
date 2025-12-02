import expressAsyncHandler from 'express-async-handler';
import Store from '../../../services/Stores/index.js';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';

const getMyStores = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { aspage, id } = req.query;
    const isPage = aspage === 'true';
    const matches: Record<string, unknown> = {};
    if (req.role !== 'admin') {
      matches._id = { $in: req.stores };
    }
    const stores = await Store.get({ req, dbName: req.db!, matches });
    if (isPage && req.role !== 'admin' && id) {
      if (!req.stores || req.stores.length === 0) {
        throw new Error('You are not authorized to access this store');
      }
      const allowedStores = req.stores.map((store: any) =>
        store._id.toString()
      );
      if (!allowedStores.includes(stores?._id.toString())) {
        throw new Error('You are not authorized to access this store');
      }
    }

    res.status(200).json(stores);
  }
);

export default getMyStores;
