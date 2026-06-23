const moneyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

export function formatFinanceMoney(value: number): string {
  return moneyFormatter.format(value);
}

export function formatFinanceDate(value?: string | null): string {
  if (!value) return "Chưa rõ ngày";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa rõ ngày";

  return dateFormatter.format(date);
}

export function calculatePercentage(value: number, total: number): number {
  if (total <= 0) return 0;
  return (value / total) * 100;
}
