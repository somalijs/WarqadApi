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
    if (search) {
      const or: any[] = [{ name: { $regex: search, $options: 'i' } }];

      if (mongoose.Types.ObjectId.isValid(search)) {
        or.push({ _id: new mongoose.Types.ObjectId(search) });
      }

      matches.$or = or;
    }
    if (id && req.role !== 'admin') {
      const storeIds = req.storeIds || [];
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
    if (id && !result.length) throw new Error('Store not found');
    return id ? result[0] : result;
  }
}

export default StoreManger;
