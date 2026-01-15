import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../types/Express.js";
import getTransactionModel, {
  TransactionDocument,
} from "../../../models/Transaction.js";
import { Model } from "mongoose";
import Generators, { addVersion } from "../../../func/Generators.js";
import adjustmentBox from "./Adjustment.js";
import mongoose from "mongoose";
import paymentBox from "./Payment.js";
import addLogs from "../../../services/Logs.js";
import MoneyTransfer from "./MoneyTransfer.js";
import expensesBox from "./Expenses.js";
import journalBox from "./journals/journal.js";
import invoiceList from "./invoices/invoiceList.js";

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
    const { id, type, store, ref, date, adjustmentType, profile, free }: any =
      this.req.query;
    const matches: any = {};
    if (free !== "true") {
      matches.isDeleted = false;
    }
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
      {
        $lookup: {
          from: "drawers",
          localField: "from._id",
          foreignField: "_id",
          as: "fromObj",
        },
      },
      {
        $lookup: {
          from: "drawers",
          localField: "to._id",
          foreignField: "_id",
          as: "toObj",
        },
      },
      {
        $unwind: {
          path: "$fromObj",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$toObj",
          preserveNullAndEmptyArrays: true,
        },
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
      const refs = await this.Model.distinct("ref");
      refNo = Generators.IdNums({ ids: refs, prefix: "ADJ" });
    }

    const result = await adjustmentBox({
      req: this.req,
      ref: refNo,
      Model: this.Model,
      session: this.session,
    });

    return {
      message: ref
        ? "Adjustment updated successfully"
        : "Adjustment created successfully",
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
      const refs = await this.Model.distinct("ref");
      refNo = Generators.IdNums({ ids: refs, prefix: "PAY" });
    }

    const result = await paymentBox({
      req: this.req,
      ref: refNo,
      Model: this.Model,
      session: this.session,
    });

    return {
      message: ref
        ? "Adjustment updated successfully"
        : "Adjustment created successfully",
      data: result,
    };
  }
  async MoneyTransfer(ref?: string) {
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
      const refs = await this.Model.distinct("ref");
      refNo = Generators.IdNums({ ids: refs, prefix: "PAY" });
    }

    const result = await MoneyTransfer({
      req: this.req,
      ref: refNo,
      Model: this.Model,
      session: this.session,
    });

    return {
      message: ref
        ? "Adjustment updated successfully"
        : "Adjustment created successfully",
      data: result,
    };
  }
  async addExpenses(ref?: string) {
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
      const refs = await this.Model.distinct("ref");
      refNo = Generators.IdNums({ ids: refs, prefix: "PAY" });
    }

    const result = await expensesBox({
      req: this.req,
      ref: refNo,
      Model: this.Model,
      session: this.session,
    });

    return {
      message: ref
        ? "Adjustment updated successfully"
        : "Adjustment created successfully",
      data: result,
    };
  }
  async reverseTransaction() {
    const { id } = this.req.params;
    // check if is exist
    const isExist = await this.Model.findOne({ _id: id }).session(
      this.session || null
    );
    if (!isExist) throw new Error(`Reference  is not exist`);
    if (isExist.isDeleted)
      throw new Error(`Transaction (${isExist.ref}) is already reversed`);
    // mark old as deleted
    isExist.isDeleted = true;
    await isExist.save({ session: this.session || null });

    // add logs
    await addLogs({
      model: { type: isExist.type, _id: isExist._id },
      data: isExist,
      old: {},
      by: this.req.by!,
      dbName: this.req.db!,
      action: "delete",
      session: this.session || null,
    });
    return { message: `Transaction (${isExist.ref}) reversed successfully` };
  }

  async create({ type, ref }: { ref?: string; type: string }) {
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
      const refs = await this.Model.distinct("ref");
      refNo = Generators.IdNums({ ids: refs, prefix: "PAY" });
    }

    let result;
    switch (type) {
      case "invoice-list":
        result = await invoiceList({
          req: this.req,
          ref: refNo,
          session: this.session!,
        });
        break;
      case "journal":
        result = await journalBox({
          req: this.req,
          ref: refNo,
          session: this.session!,
        });
        break;
      default:
        throw new Error("Invalid transaction type");
    }
    return {
      message: ref
        ? `${type} updated successfully`
        : `${type} created successfully`,
      data: result,
    };
  }
}

export default TransactionManager;
