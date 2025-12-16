export function parseDateOrThrow(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/');

  if (!day || !month || !year) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }

  const isoDateStr = `${year.padStart(4, '0')}-${month.padStart(
    2,
    '0'
  )}-${day.padStart(2, '0')}`;
  const date = new Date(isoDateStr);

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${dateStr}`);
  }

  return date;
}
export function getDateRange({ from, to }: { from: string; to: string }) {
  const fromDate = parseDateOrThrow(from);
  const toDate = parseDateOrThrow(to);

  const starts = new Date(fromDate.setHours(0, 0, 0, 0));
  const ends = new Date(toDate.setHours(23, 59, 59, 999));

  return { starts, ends };
}

export function getDateObject(date: string) {
  const to = parseDateOrThrow(date);
  const res = new Date(to.setHours(0, 0, 0, 0));
  return res;
}
