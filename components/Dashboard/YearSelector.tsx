"use client";

type Props = {
  year: number;
  availableYears: number[];
  onChange: (year: number) => void;
};

export function YearSelector({ year, availableYears, onChange }: Props) {
  const current = new Date().getFullYear();
  const set = new Set<number>([current, ...availableYears, year]);
  const years = Array.from(set).sort((a, b) => b - a);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500">Année fiscale</span>
      <select
        value={year}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm font-medium text-[#1a1a2e]"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
