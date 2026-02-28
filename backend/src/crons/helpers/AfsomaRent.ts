import moment from "moment-timezone";
import getUnitModel from "../../models/Unit.js";
import mongoose from "mongoose";
import getTransactionModel from "../../models/Transaction.js";
import Generators from "../../func/Generators.js";

export const createAfsomaMonthlyRent = async () => {
  const accountPrefix = "AP0767";
  const now = moment().tz("Africa/Nairobi");
  const month = Number(now.format("MM"));
  const year = Number(now.format("YYYY"));
  const Transaction = getTransactionModel(accountPrefix);
  const Unit = getUnitModel(accountPrefix);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Fetch tenants needing processing (filtered by those with valid customer accounts)
    const tenants = await Unit.aggregate([
      {
        $match: {
          profile: "tenant",
          isDeleted: false,
          endDate: { $exists: false },
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "customer",
          pipeline: [{ $match: { profile: "customer" } }],
          foreignField: "_id",
          as: "customerDoc",
        },
      },
      { $unwind: "$customerDoc" },
      {
        $addFields: {
          customerData: {
            name: "$customerDoc.name",
            _id: "$customerDoc._id",
          },
        },
      },
      {
        $project: {
          _id: 1,
          customer: "$customerData",
          amount: 1,
          floor: 1,
          no: 1,
          store: 1,
        },
      },
    ]).session(session);

    // 2. Fetch existing transactions to prevent duplicates efficiently
    const existingTransactions = await Transaction.find({
      houseInvoice: "rent",
      "details.month": month,
      "details.year": year,
      isDeleted: false,
    })
      .session(session)
      .select("unit");

    const existingUnitIds = new Set(
      existingTransactions.map((t) => t.unit?.toString()),
    );
    const allRefs = await Transaction.distinct("ref").session(session);

    const newTransactions = [];

    // 3. Process each tenant and build transaction objects
    for (const tenant of tenants) {
      // Skip if this unit already has a rent invoice for this month
      if (existingUnitIds.has(tenant._id.toString())) {
        continue;
      }

      const ref = Generators.IdNums({ ids: allRefs, prefix: "RE" });
      allRefs.push(ref);

      newTransactions.push({
        date: now.format("DD/MM/YYYY"),
        type: "house-invoice",
        houseInvoice: "rent",
        ref,
        note: `this is auto generated rent invoice`,
        currency: "KSH",
        amount: tenant.amount,
        store: tenant.store,
        unit: tenant._id,
        customer: tenant.customer,
        by: {
          name: "Afsoma Bot",
          _id: "690440499006000000000000",
        },
        action: "credit",
        profile: "customer",
        houseProfile: "tenant",
        details: {
          month,
          year,
          floor: tenant.floor,
          houseNo: tenant.no,
          description: `Rent for ${now.format("MM/YYYY")} (Floor ${tenant.floor}, House ${tenant.no})`,
        },
      });
    }

    // 4. Batch insert new transactions
    if (newTransactions.length > 0) {
      const rents = await Transaction.create(newTransactions, {
        session,
        ordered: true,
      });
      console.log(
        `✅ Success: Created ${rents.length} rent invoices for ${now.format("MM/YYYY")}.`,
      );
    } else {
      console.log(
        `ℹ️ Info: No new rent invoices needed for ${now.format("MM/YYYY")}.`,
      );
    }

    await session.commitTransaction();
    return true;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.log(`❌ Error creating Afsoma Monthly Rent: ${error}`);
    return false;
  } finally {
    session.endSession();
  }
};
