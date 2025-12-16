import { ClientSession } from 'mongoose';
import { ExpressRequest } from '../../../types/Express.js';
import getTransactionModel, {
  TransactionDocument,
} from '../../../models/Transaction.js';
import { Model } from 'mongoose';
import Generators, { addVersion } from '../../../func/Generators.js';
import adjustmentBox from './Adjustment.js';
import mongoose from 'mongoose';
import paymentBox from './Payment.js';

type Props = {
  db: string;
  req: ExpressRequest;
  session?: ClientSession;
};

class TransactionManager {
  readonly Model: Model<TransactionDocument>;
  readonly req: ExpressRequest;
  readonly session?: ClientSession;
  readonly db: string;
  constructor({ db, req, session }: Props) {
    this.Model = getTransactionModel(db);
    this.req = req;
    this.session = session;
    this.db = db;
  }
  async get() {
    const { id, type, store, ref, date, adjustmentType, profile }: any =
      this.req.query;
    const matches: any = {
      isDeleted: false,
    };
    if (id) matches._id = new mongoose.Types.ObjectId(id!);
    if (type) matches.type = type;
    if (store) matches.store = new mongoose.Types.ObjectId(store!);
    if (ref) matches.ref = ref;
    if (date) matches.date = date;
    if (adjustmentType) matches.adjustmentType = adjustmentType;
    if (profile) matches.profile = profile;

    const data = await this.Model.aggregate([
      {
        $match: matches,
      },
    ]);
    return id || ref ? data[0] : data;
  }
  async addAdjustment(ref?: string) {
    let refNo: string;
    if (ref) {
      // check if is exist
      const isExist = await this.Model.findOne({ ref }).session(
        this.session || null
      );
      if (!isExist) throw new Error(`Reference (${ref}) is not exist`);
      refNo = addVersion(isExist.ref);
      // mark old as deleted
      isExist.isDeleted = true;
      await isExist.save({ session: this.session || null });
    } else {
      const refs = await this.Model.distinct('ref');
      refNo = Generators.IdNums({ ids: refs, prefix: 'ADJ' });
    }

    const result = await adjustmentBox({
      req: this.req,
      ref: refNo,
      Model: this.Model,
      session: this.session,
    });

    return {
      message: ref
        ? 'Adjustment updated successfully'
        : 'Adjustment created successfully',
      data: result,
    };
  }
  async addPayment(ref?: string) {
    let refNo: string;
    if (ref) {
      // check if is exist
      const isExist = await this.Model.findOne({ ref }).session(
        this.session || null
      );
      if (!isExist) throw new Error(`Reference (${ref}) is not exist`);
      refNo = addVersion(isExist.ref);
      // mark old as deleted
      isExist.isDeleted = true;
      await isExist.save({ session: this.session || null });
    } else {
      const refs = await this.Model.distinct('ref');
      refNo = Generators.IdNums({ ids: refs, prefix: 'PAY' });
    }

    const result = await paymentBox({
      req: this.req,
      ref: refNo,
      Model: this.Model,
      session: this.session,
    });

    return {
      message: ref
        ? 'Adjustment updated successfully'
        : 'Adjustment created successfully',
      data: result,
    };
  }
}

export default TransactionManager;
