// Format as Indian Rupees (₹)
const CURRENCY_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
})

export function formatCurrency(amount: number) {
  return CURRENCY_FORMATTER.format(amount)
}

const NUMBER_FORMATTER = new Intl.NumberFormat("en-IN")

export function formatNumber(number: number) {
  return NUMBER_FORMATTER.format(number)
}
