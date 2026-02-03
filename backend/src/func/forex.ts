import Enums from "./Enums.js";

type Props = {
  accountCurrency: "USD" | "CNY" | "KSH" | "TZS";
  amount: number;
  exchangeRate: number;
  transactionCurrency: "USD" | "CNY" | "KSH" | "TZS";
  round?: boolean;
};

function exchangedAmount({
  accountCurrency,
  amount,
  exchangeRate,
  transactionCurrency,
  round = true,
}: Props): number {
  if (!Enums.currencies.includes(accountCurrency)) {
    throw new Error("Invalid account currency");
  }

  if (!Enums.currencies.includes(transactionCurrency)) {
    throw new Error("Invalid transaction currency");
  }

  let result: number;

  if (accountCurrency === transactionCurrency) {
    result = amount;
  } else if (accountCurrency === "USD") {
    result = amount / exchangeRate;
  } else if (accountCurrency === "CNY") {
    result =
      transactionCurrency === "USD"
        ? amount * exchangeRate
        : amount / exchangeRate;
  } else if (accountCurrency === "KSH") {
    result =
      transactionCurrency === "TZS"
        ? amount / exchangeRate
        : amount * exchangeRate;
  } else if (accountCurrency === "TZS") {
    result = amount * exchangeRate;
  } else {
    throw new Error("Unsupported currency conversion");
  }

  // ✅ IGNORE decimals completely
  return round ? Math.trunc(result) : result;
}
type Currency = "USD" | "CNY" | "KSH" | "TZS";

export const currencyConversionStage = ({
  amount,
  accountCurrency,
  transactionCurrency,
  exchangeRate,
  fieldName,
}: {
  amount: string;
  accountCurrency: Currency;
  transactionCurrency: Currency;
  exchangeRate: string;
  fieldName: string;
}) => ({
  $addFields: {
    [fieldName]: {
      $switch: {
        branches: [
          // same currency
          {
            case: { $eq: [accountCurrency, transactionCurrency] },
            then: amount,
          },

          // USD
          {
            case: { $eq: [accountCurrency, "USD"] },
            then: { $divide: [amount, exchangeRate] },
          },

          // CNY
          {
            case: {
              $and: [
                { $eq: [accountCurrency, "CNY"] },
                { $eq: [transactionCurrency, "USD"] },
              ],
            },
            then: { $multiply: [amount, exchangeRate] },
          },
          {
            case: { $eq: [accountCurrency, "CNY"] },
            then: { $divide: [amount, exchangeRate] },
          },

          // KSH
          {
            case: {
              $and: [
                { $eq: [accountCurrency, "KSH"] },
                { $eq: [transactionCurrency, "TZS"] },
              ],
            },
            then: { $divide: [amount, exchangeRate] },
          },
          {
            case: { $eq: [accountCurrency, "KSH"] },
            then: { $multiply: [amount, exchangeRate] },
          },

          // TZS
          {
            case: { $eq: [accountCurrency, "TZS"] },
            then: { $multiply: [amount, exchangeRate] },
          },
        ],
        default: amount,
      },
    },
  },
});

export default exchangedAmount;
