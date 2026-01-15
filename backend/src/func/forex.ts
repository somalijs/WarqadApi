import Enums from "./Enums.js";

type Props = {
  accountCurrency: "USD" | "CNY" | "KSH" | "TZS";
  amount: number;
  exchangeRate: number;
  transactionCurrency: "USD" | "CNY" | "KSH" | "TZS";
};

function exchangedAmount({
  accountCurrency,
  amount,
  exchangeRate,
  transactionCurrency,
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
  return Math.trunc(result);
}

export default exchangedAmount;
