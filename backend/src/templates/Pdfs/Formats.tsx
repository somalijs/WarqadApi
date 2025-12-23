/**
 * Qty Component
 *
 * Displays a number with a "pc" or "pcs" suffix.
 * - Adds "pc" if value is 1
 * - Adds "pcs" if value is !== 1
 *
 * @param value - The quantity number
 * @param className - Optional classes for styling
 */
const Qty = ({
  value,
  className = '',
}: {
  value: number;
  className?: string;
}) => {
  const suffix = value === 1 ? 'pc' : 'pcs';
  return (
    <span className={className}>
      {value}
      {suffix}
    </span>
  );
};

/**
 * Amount Component
 *
 * Formats a number as a currency string.
 * - Defaults currency to 'USD' if not provided
 * - Adds commas for every 3 digits
 *
 * @param data - Object containing { amount, currency }
 * @param className - Optional classes for styling
 */
const Amount = ({
  amount,
  className = '',
  currency = 'USD',
}: {
  amount: number | string;
  className?: string;
  currency?: string;
}) => {
  const formattedAmount = Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <span className={className}>
      {currency} {formattedAmount}
    </span>
  );
};

const Formats = {
  Qty,
  Amount,
};

export default Formats;
