const houseInvoiceAgg = () => {
  return [
    {
      $lookup: {
        from: "tenants",
        localField: "tenant",
        foreignField: "_id",
        as: "tenantObj",
      },
    },
    {
      $unwind: {
        path: "$tenantObj",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "accounts",
        localField: "customer._id",
        foreignField: "_id",
        as: "customerObj",
      },
    },
    {
      $unwind: {
        path: "$customerObj",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        customerName: "$customerObj.name",
        customerPhone: "$customerObj.phoneNumber",
        tenantName: {
          $concat: [
            "floor ",
            { $toString: "$tenantObj.floor" },
            " - ",
            "no ",
            { $toString: "$tenantObj.no" },
          ],
        },
        totalCredit: {
          $sum: {
            $cond: [{ $eq: ["$action", "credit"] }, "$amount", 0],
          },
        },
        totalDebit: {
          $sum: {
            $cond: [{ $eq: ["$action", "debit"] }, "$amount", 0],
          },
        },
      },
    },
    {
      $addFields: {
        total: { $subtract: ["$totalCredit", "$totalDebit"] },
      },
    },
  ];
};

export default houseInvoiceAgg;
