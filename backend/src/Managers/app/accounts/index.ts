import { ClientSession, Model } from 'mongoose';
import getAccountModel, { AccountDocument } from '../../../models/Acounts.js';
import { ExpressRequest } from '../../../types/Express.js';
import AccountSchema from './schema.js';
import addLogs from '../../../services/Logs.js';
import z from 'zod';
import getStoreModel from '../../../models/Store.js';
import mongoose from 'mongoose';

type Props = {
  db: string;
  req: ExpressRequest;
  session?: ClientSession;
};

class AccountsManager {
  readonly Model: Model<AccountDocument>;
  readonly req: ExpressRequest;
  readonly session?: ClientSession;
  readonly db: string;

  constructor({ db, req, session }: Props) {
    this.Model = getAccountModel(db);
    this.req = req;
    this.session = session;
    this.db = db;
  }
  async get() {
    const { id, profile, select, store }: any = this.req.query;
    const matches: any = {
      isDeleted: false,
    };
    if (id) matches._id = new mongoose.Types.ObjectId(id!);
    if (profile) matches.profile = profile;
    if (store) matches.store = new mongoose.Types.ObjectId(store!);
    if (this.req?.role !== 'admin') {
      matches.store = {
        $in: (this.req?.storeIds || []).map(
          (item) => new mongoose.Types.ObjectId(item)
        ),
      };
    }
    const data = await this.Model.aggregate([
      {
        $match: matches,
      },
      {
        $sort: {
          name: 1,
        },
      },
    ]);
    let result = data;
    if (select) {
      result = data.map((item) => {
        return {
          value: item._id,
          label: item.name,
          profile: item.profile,
          balance: item.balance || 0,
        };
      });
    }
    return id ? result[0] : result;
  }
  async add() {
    const base = AccountSchema.base.parse(this.req.body);
    const others = AccountSchema[
      base.profile as keyof typeof AccountSchema
    ].parse(this.req.body);
    // reject if its not admin and store is no includes req.storeids
    if (this.req?.role !== 'admin') {
      if ((this.req?.storeIds || []).includes(String(base.store)))
        throw new Error('You are not authorized For this Store');
    }
    const createData = {
      ...base,
      ...others,
    };
    // check if store exists
    const store = await getStoreModel(this.db)
      .findById(createData.store)
      .session(this?.session || null);
    if (!store) throw new Error(`Store of id (${createData.store}) not found`);
    const created = await this.Model.create(
      [{ ...createData, by: this.req.by! }],
      { session: this?.session || null }
    );

    // add logs
    await addLogs({
      model: { type: base.profile, _id: created[0]._id },
      data: created[0],
      old: {},
      by: this.req.by!,
      dbName: this.db,
      action: 'create',
      session: this?.session || null,
    });
    return created[0];
  }

  async update() {
    const { id } = this.req.params;
    const rawBody = this.req.body;

    // validate base
    const base = AccountSchema.base.parse(rawBody);
    // reject if its not admin and store is no includes req.storeids
    if (this.req?.role !== 'admin') {
      if ((this.req?.storeIds || []).includes(String(base.store)))
        throw new Error('You are not authorized For this Store');
    }
    // validate type-specific schema
    const others =
      AccountSchema[base.profile as keyof typeof AccountSchema].parse(rawBody);

    // check if account exists
    const isExist = await this.Model.findById(id).session(
      this?.session || null
    );
    if (!isExist) throw new Error(`${base.profile} of id (${id}) not found`);

    // create oldData
    const oldData: Record<string, any> = {
      name: isExist.name,
      phoneNumber: isExist.phoneNumber,
      email: isExist.email,
      address: isExist.address,
      profile: isExist.profile,
    };

    // create newData
    const newData: Record<string, any> = {
      name: base.name,
      phoneNumber: base.phoneNumber,
      email: base.email,
      address: base.address,
      profile: base.profile,
    };

    // type-specific fields
    switch (base.profile) {
      case 'customer': {
        const customerData = others as z.infer<
          (typeof AccountSchema)['customer']
        >;
        oldData.guarantor = isExist.guarantor;
        oldData.creditLimit = isExist.creditLimit;
        newData.guarantor = customerData.guarantor;
        newData.creditLimit = customerData.creditLimit;
        break;
      }
      case 'employee': {
        const employeeData = others as z.infer<
          (typeof AccountSchema)['employee']
        >;
        oldData.salary = isExist.salary;
        newData.salary = employeeData.salary;
        break;
      }
      case 'supplier': {
        const supplierData = others as z.infer<
          (typeof AccountSchema)['supplier']
        >;
        oldData.company = isExist.company;
        newData.company = supplierData.company;
        break;
      }
    }

    // check if data changed
    if (JSON.stringify(oldData) === JSON.stringify(newData)) {
      throw new Error('No changes made');
    }
    newData.store = isExist.store;
    // replace the document
    const updated = await this.Model.findOneAndReplace(
      { _id: isExist._id },
      { ...newData, by: this.req.by! },
      { session: this.session, new: true, runValidators: true }
    );

    if (!updated)
      throw new Error(`Error updating ${base.profile} of id (${id})`);

    // add logs
    await addLogs({
      model: { type: base.profile, _id: updated._id },
      data: updated,
      old: isExist,
      by: this.req.by!,
      dbName: this.db,
      action: 'update',
      session: this.session,
    });

    return updated;
  }

  async delete() {
    const { id } = this.req.params;
    const { store } = AccountSchema.storeId.parse(this.req.body);
    if (this.req?.role !== 'admin') {
      if ((this.req?.storeIds || []).includes(String(store)))
        throw new Error('You are not authorized For this Store');
    }
    const isExist = await this.Model.findOne({
      _id: id,
      store,
    }).session(this?.session || null);
    if (!isExist) throw new Error(`Account of id (${id}) not found`);

    // else delete
    const deleted = await this.Model.findOneAndDelete(
      { _id: id, store },
      { session: this?.session || null }
    );
    if (!deleted) throw new Error(`Error deleting account of id (${id})`);

    // add logs
    await addLogs({
      model: { type: isExist.profile, _id: deleted._id },
      data: deleted,
      old: isExist,
      by: this.req.by!,
      dbName: this.db,
      action: 'delete',
      session: this.session,
    });

    return deleted;
  }
}

export default AccountsManager;
