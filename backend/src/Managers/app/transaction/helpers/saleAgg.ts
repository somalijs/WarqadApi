const saleAgg = () => {
  return [
    {
      $addFields: {
        defaultCurrency: "$storeObj.currency",
      },
    },

    {
      $lookup: {
        from: "stocks",
        localField: "_id",
        let: {
          transactionCurrency: "$currency",
          exchangeRate: "$exchangeRate",
          defaultCurrency: "$storeObj.currency",
        },
        foreignField: "transaction",
        pipeline: [
          {
            $lookup: {
              from: "products",
              localField: "product",
              foreignField: "_id",
              as: "productData",
            },
          },
          {
            $unwind: {
              path: "$productData",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              totalQty: {
                $multiply: ["$quantity", "$productData.unitQty"],
              },
            },
          },
          {
            $addFields: {
              productName: "$productData.name",
              productImage: "$productData.imgUrl",
              productCost: "$cost",
              productSell: "$sell",
              unitQty: "$productData.unitQty",
              unit: "$productData.unit",
              perUnitCost: {
                $divide: ["$cost", "$totalQty"],
              },
              perUnitSale: {
                $divide: ["$sell", "$totalQty"],
              },
              productProfit: {
                $subtract: ["$sell", "$cost"],
              },
            },
          },
          {
            $project: {
              productData: 0,
            },
          },
        ],
        as: "stocks",
      },
    },
    {
      $addFields: {
        costs: {
          $sum: "$stocks.productCost",
        },
        qtys: {
          $sum: "$stocks.quantity",
        },
        sells: {
          $sum: "$stocks.productSell",
        },
        profits: {
          $sum: "$stocks.productProfit",
        },
      },
    },
  ];
};

export default saleAgg;
