import mongoose, { Model } from 'mongoose';
import getStoreModel, { StoreDocument } from '../../../models/Store.js';
import { ExpressRequest } from '../../../types/Express.js';

type StoreMangerProps = {
  db: string;
};
class StoreManger {
  readonly Model: Model<StoreDocument>;
  constructor({ db }: StoreMangerProps) {
    this.Model = getStoreModel(db);
  }

  // create get
  async get(req: ExpressRequest) {
    let matches: Record<string, unknown> = { isDeleted: false };
    const { type, subType, id, search, select } = req.query as {
      type?: string;
      subType?: string;
      id?: string;
      search?: string;
      select?: string;
    };
    if (req.role !== 'admin') matches._id = { $in: [req.stores] };
    if (type) matches.type = type;
    if (subType) matches.subType = subType;
    if (id) matches._id = new mongoose.Types.ObjectId(id);
    if (search) matches.name = { $regex: search.toLowerCase(), $options: 'i' };
    if (id && req.role !== 'admin') {
      const storeIds = (req?.stores || []).map((store) => String(store._id));
      if (!storeIds.includes(id)) {
        throw new Error('You are not authorized to access this store');
      }
    }
    const stores = await this.Model.aggregate([{ $match: matches }]);
    let result = stores;
    if (select === 'true') {
      result = stores.map((store) => ({
        value: store._id,
        label: store.name,
        type: store.type,
        subType: store.subType,
      }));
    }
    return id ? result[0] : result;
  }
}

export default StoreManger;
