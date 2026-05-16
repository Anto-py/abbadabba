export type DashboardData = {
  year: number;
  availableYears: number[];
  marginalTaxRate: number;
  totals: {
    income: number;
    expense: number;
    deductible: number;
    taxBeforeDeduction: number;
    taxAfterDeduction: number;
  };
  byCategory: {
    code: string;
    name: string;
    expense: number;
    deductible: number;
  }[];
  byMonth: { month: number; income: number; expense: number; deductible: number }[];
  transactionCount: number;
};

export function formatEUR(n: number) {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatEURPrecise(n: number) {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}
