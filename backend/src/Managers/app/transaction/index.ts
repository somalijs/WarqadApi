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
import houseInvoice from "./invoices/houseInvoice.js";
import houseInvoiceAgg from "./helpers/houseInvoiceAgg.js";
import stockSupply from "./purchase/stockSupply.js";
import purhcaseAgg, {
  clearanceAgg,
  finalCostAgg,
  stocksAgg,
} from "./helpers/purhcaseAgg.js";
import clearanceStockSupply from "./purchase/clearanceStockSupply.js";
import saleStock from "./sale/saleStock.js";
import saleAgg from "./helpers/saleAgg.js";
import StockAdjustment from "./stockAdjustment/StockAdjustment.js";
import getStoreModel from "../../../models/Store.js";
import getStocksModel from "../../../models/Stocks.js";
import getProductModel from "../../../models/inventory/Product.js";
import Payment from "./payment/Payment.js";

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
    const {
      id,
      type,
      store,
      ref,
      date,
      adjustmentType,
      profile,
      free,
      invoiceList,
      houseInvoice,
      detailsMonth,
      detailsYear,
      agg,
      purchase,
      availableClearance,
      search,
    }: any = this.req.query;
    const matches: any = {};
    if (free !== "true") {
      matches.isDeleted = false;
    }
    if (search) {
      const or: any[] = [{ ref: { $regex: search, $options: "i" } }];

      if (mongoose.Types.ObjectId.isValid(search)) {
        or.push({ _id: new mongoose.Types.ObjectId(search) });
      }

      matches.$or = or;
    }
    if (id) matches._id = new mongoose.Types.ObjectId(id!);
    if (invoiceList) matches.invoiceList = invoiceList;
    if (type) matches.type = type;
    if (store) matches.store = new mongoose.Types.ObjectId(store!);
    if (ref) matches.ref = ref;
    if (date) matches.date = date;
    if (adjustmentType) matches.adjustmentType = adjustmentType;
    if (profile) matches.profile = profile;
    if (houseInvoice) matches.houseInvoice = houseInvoice;
    if (purchase) matches.purchase = purchase;
    let availableClearanceAgg: any[] = [];
    if (availableClearance === "true") {
      availableClearanceAgg.push(
        {
          $lookup: {
            from: "transactions",
            localField: "_id",
            foreignField: "transaction",
            pipeline: [
              {
                $match: {
                  isDeleted: false,
                },
              },
            ],
            as: "clearanced",
          },
        },
        {
          $match: {
            clearanced: { $size: 0 }, // only keep docs with no matching transaction
          },
        },
        {
          $addFields: {
            name: {
              $concat: [
                { $ifNull: ["$ref", ""] },
                " - ",
                { $toString: { $trunc: ["$amount", 2] } },
                " ",
                { $ifNull: ["$currency", ""] },
              ],
            },
          },
        },
      );
    }
    if (detailsMonth && detailsYear) {
      matches["details.month"] = Number(detailsMonth);
      matches["details.year"] = Number(detailsYear);
    }
    let customAgg: any[] = [];
    if (houseInvoice) customAgg = houseInvoiceAgg();
    if (agg === "storeless") customAgg = purhcaseAgg();
    if (agg === "stock-supply-clearance") {
      customAgg = clearanceAgg();
    }
    if (agg === "final-cost") {
      customAgg = finalCostAgg();
    }
    if (agg === "stocks") {
      customAgg = stocksAgg();
    }
    if (agg === "sale") {
      customAgg = saleAgg();
    }
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
      {
        $lookup: {
          from: "stores",
          localField: "store",
          foreignField: "_id",
          as: "storeObj",
        },
      },
      {
        $unwind: {
          path: "$storeObj",
          preserveNullAndEmptyArrays: true,
        },
      },
      ...customAgg,
      ...availableClearanceAgg,
      {
        $sort: {
          dateObj: 1,
          createdAt: 1,
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
        this.session || null,
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
        this.session || null,
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
        this.session || null,
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
        this.session || null,
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
      this.session!,
    );
    if (!this.session) {
      throw new Error("Session has not been initialized");
    }
    if (!isExist) throw new Error(`Reference  is not exist`);
    if (isExist.isDeleted)
      throw new Error(`Transaction (${isExist.ref}) is already reversed`);
    // mark old as deleted
    isExist.isDeleted = true;
    if (isExist.purchase === "stock-supply-clearance") {
      const storeDoc = await getStoreModel(this.req.db!)
        .findOne({ _id: isExist.store })
        .session(this.session!);
      if (!storeDoc) throw new Error(`Clearance store is missing`);
      const purchaseDoc = await getTransactionModel(this.req.db!)
        .findOne({ _id: isExist.transaction })
        .session(this.session!);
      if (!purchaseDoc) throw new Error(`Purchase is missing`);
      const clearanceAmount =
        isExist.currency === storeDoc.currency
          ? isExist.amount
          : isExist.exchangedAmount;
      if (!clearanceAmount) throw new Error(`Clearance amount is missing`);
      const productDocs = await getStocksModel(this.req.db!)
        .find({ transaction: purchaseDoc._id })
        .sort({ _id: 1 }) // optional: ensures order if needed
        .session(this.session!)
        .lean();

      const totalQuantity = productDocs.reduce(
        (acc, item) => acc + item.quantity,
        0,
      );
      if (totalQuantity > 0) {
        const amount = clearanceAmount / totalQuantity;
        // Update the products with the clearance amount
        for (const product of productDocs) {
          await getProductModel(this.req.db!).updateOne(
            { _id: product.product },
            { $inc: { cost: -amount } },
            { session: this.session! },
          );
        }
      }
    }
    await isExist.save({ session: this.session! });

    // add logs
    await addLogs({
      model: { type: isExist.type, _id: isExist._id },
      data: isExist,
      old: {},
      by: this.req.by!,
      dbName: this.req.db!,
      action: "delete",
      session: this.session,
    });
    return { message: `Transaction (${isExist.ref}) reversed successfully` };
  }

  async create({ type, ref }: { ref?: string; type: string }) {
    let refNo: string;
    if (ref) {
      // check if is exist
      const isExist = await this.Model.findOne({ ref }).session(
        this.session || null,
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
      case "house-invoice":
        result = await houseInvoice({
          req: this.req,
          ref: refNo,
          session: this.session!,
        });
        break;
      case "stock-supply":
        result = await stockSupply({
          req: this.req,
          ref: refNo,
          session: this.session!,
        });
        break;
      case "stock-supply-clearance":
        result = await clearanceStockSupply({
          req: this.req,
          ref: refNo,
          session: this.session!,
        });
        break;
      case "stock-sale":
        result = await saleStock({
          req: this.req,
          ref: refNo,
          session: this.session!,
        });
        break;
      case "stock-adjustment":
        result = await StockAdjustment({
          req: this.req,
          ref: refNo,
          session: this.session!,
        });
        break;
      case "payments":
        result = await Payment({
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
