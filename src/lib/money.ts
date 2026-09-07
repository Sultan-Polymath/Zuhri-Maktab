export function formatMoney(amount: unknown): string {
  return `£${Number(amount).toFixed(2)}`;
}
