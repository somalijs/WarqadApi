import { currencyConversionStage } from "../../../../func/forex.js";

const purhcaseAgg = () => {
  return [
    {
      $lookup: {
        from: "transactions",
        localField: "_id",
        foreignField: "transaction",

        pipeline: [
          {
            $match: {
              purchase: "stock-supply-clearance",
              isDeleted: false,
            },
          },
        ],
        as: "clearance",
      },
    },
    {
      $unwind: {
        path: "$clearance",
        preserveNullAndEmptyArrays: true,
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

          currencyConversionStage({
            amount: "$cost",
            accountCurrency: "$$defaultCurrency" as any,
            transactionCurrency: "$$transactionCurrency" as any,
            exchangeRate: "$$exchangeRate" as any,
            fieldName: "productCost",
          }),
          {
            $addFields: {
              totalUnit: {
                $multiply: ["$quantity", "$productData.unitQty"],
              },
            },
          },
          {
            $addFields: {
              productName: "$productData.name",
              productImage: "$productData.imgUrl",
              perCost: {
                $divide: ["$cost", "$totalUnit"],
              },
              perProductCost: {
                $divide: ["$productCost", "$totalUnit"],
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
        totalStockCost: {
          $sum: "$stocks.productCost",
        },
        defaultCurrency: "$storeObj.currency",
      },
    },
  ];
};
export const stocksAgg = () => {
  return [
    {
      $lookup: {
        from: "stocks",
        localField: "_id",
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
              _productDetails: "$productData",
              unit: "$productData.unit",
              unitQty: "$productData.unitQty",
              id: "$productData._id",
              price: "$sell",
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
  ];
};
//_productDetails
export const clearanceAgg = () => {
  return [
    {
      $addFields: {
        defaultCurrency: "$storeObj.currency",
      },
    },

    {
      $lookup: {
        from: "stocks",
        localField: "transaction",

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
              totalUnit: {
                $multiply: ["$quantity", "$productData.unitQty"],
              },
            },
          },
          {
            $addFields: {
              productName: "$productData.name",
              productImage: "$productData.imgUrl",
              unitQty: "$productData.unitQty",
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
        totalStockCost: {
          $sum: "$stocks.productCost",
        },
        totalStockQty: {
          $sum: "$stocks.quantity",
        },
        clearanceAmount: {
          $cond: {
            if: {
              $eq: ["$currency", "$defaultCurrency"],
            },
            then: "$amount",
            else: "$exchangedAmount",
          },
        },
      },
    },

    {
      $addFields: {
        original: "$stocks",
        stocks: {
          $map: {
            input: "$stocks",
            as: "stock",
            in: {
              productName: "$$stock.productName",
              productImage: "$$stock.productImage",
              clearance: {
                $divide: ["$clearanceAmount", "$totalStockQty"],
              },
              originalClearance: {
                $divide: ["$amount", "$totalStockQty"],
              },
              quantity: "$$stock.quantity",
              // unitQty: "$$stock.unitQty",
              // perClearance: {
              //   $divide: [
              //     { $divide: ["$clearanceAmount", "$totalStockQty"] },
              //     "$$stock.totalUnit",
              //   ],
              // },
            },
          },
        },
      },
    },
  ];
};
export const finalCostAgg = () => {
  return [
    {
      $addFields: {
        defaultCurrency: "$storeObj.currency",
      },
    },
    {
      $lookup: {
        from: "transactions",
        localField: "_id",
        foreignField: "transaction",

        pipeline: [
          {
            $match: {
              purchase: "stock-supply-clearance",
              isDeleted: false,
            },
          },
        ],
        as: "clearance",
      },
    },
    {
      $unwind: {
        path: "$clearance",
        preserveNullAndEmptyArrays: true,
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

          currencyConversionStage({
            amount: "$cost",
            accountCurrency: "$$defaultCurrency" as any,
            transactionCurrency: "$$transactionCurrency" as any,
            exchangeRate: "$$exchangeRate" as any,
            fieldName: "productCost",
          }),
          {
            $addFields: {
              totalUnit: {
                $multiply: ["$quantity", "$productData.unitQty"],
              },
              unit: "$productData.unit",
            },
          },
          {
            $addFields: {
              productName: "$productData.name",
              productImage: "$productData.imgUrl",
              perCost: {
                $divide: ["$cost", "$totalUnit"],
              },
              unitQty: "$productData.unitQty",
              perProductCost: {
                $divide: ["$productCost", "$totalUnit"],
              },
              cost: "$productCost",
              perUnitCost: {
                $divide: ["$productCost", "$totalUnit"],
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
        totalStockCost: {
          $sum: "$stocks.productCost",
        },
        totalStockQty: {
          $sum: "$stocks.quantity",
        },
        clearanceAmount: {
          $cond: {
            if: {
              $eq: ["$clearance.currency", "$defaultCurrency"],
            },
            then: "$clearance.amount",
            else: "$clearance.exchangedAmount",
          },
        },
      },
    },
    {
      $addFields: {
        original: "$stocks",
        stocks: {
          $map: {
            input: "$stocks",
            as: "stock",
            in: {
              productName: "$$stock.productName",
              productImage: "$$stock.productImage",
              unit: "$$stock.unit",
              unitQty: "$$stock.unitQty",
              cost: {
                $sum: [
                  "$$stock.cost",
                  {
                    $divide: ["$clearanceAmount", "$totalStockQty"],
                  },
                ],
              },
              quantity: "$$stock.quantity",

              totalUnit: "$$stock.totalUnit",
              perUnitCost: {
                $divide: [
                  {
                    $sum: [
                      "$$stock.cost",
                      {
                        $divide: ["$clearanceAmount", "$totalStockQty"],
                      },
                    ],
                  },
                  "$$stock.totalUnit",
                ],
              },
            },
          },
        },
      },
    },
  ];
};
export default purhcaseAgg;
