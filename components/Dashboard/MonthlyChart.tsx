"use client";

import { DashboardData, formatEUR } from "./types";

type Props = { byMonth: DashboardData["byMonth"] };

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const W = 320;
const H = 140;
const PAD_L = 4;
const PAD_R = 4;
const PAD_T = 8;
const PAD_B = 20;

export function MonthlyChart({ byMonth }: Props) {
  const cumIncome: number[] = [];
  const cumDeductible: number[] = [];
  let sumI = 0;
  let sumD = 0;
  for (const m of byMonth) {
    sumI += m.income;
    sumD += m.deductible;
    cumIncome.push(sumI);
    cumDeductible.push(sumD);
  }

  const max = Math.max(...cumIncome, ...cumDeductible, 0);
  const niceMax = max > 0 ? max : 1;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const stepX = innerW / 11;

  const toPoints = (series: number[]) =>
    series
      .map((v, i) => {
        const x = PAD_L + i * stepX;
        const y = PAD_T + innerH - (v / niceMax) * innerH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  const empty = max === 0;

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-[#1a1a2e]">
          Évolution cumulée
        </h2>
        <div className="flex items-center gap-3 text-xs">
          <Legend color="bg-emerald-600" label="Recettes" />
          <Legend color="bg-red-500" label="Déductible" />
        </div>
      </div>
      <div className="mt-3 text-xs text-zinc-400">Max&nbsp;: {formatEUR(niceMax)}</div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-1 block w-full"
        role="img"
        aria-label="Recettes et déductible cumulés par mois"
      >
        <line
          x1={PAD_L}
          x2={W - PAD_R}
          y1={PAD_T + innerH}
          y2={PAD_T + innerH}
          stroke="#e4e4e7"
          strokeWidth={1}
        />
        {!empty && (
          <>
            <polyline
              fill="none"
              stroke="#059669"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              points={toPoints(cumIncome)}
            />
            <polyline
              fill="none"
              stroke="#ef4444"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              points={toPoints(cumDeductible)}
            />
          </>
        )}
        {byMonth.map((p, i) => (
          <text
            key={i}
            x={PAD_L + i * stepX}
            y={H - 6}
            fontSize={10}
            textAnchor="middle"
            fill="#a1a1aa"
          >
            {MONTHS[i]}
          </text>
        ))}
      </svg>
      {empty && (
        <p className="mt-2 text-center text-xs text-zinc-500">
          Aucune transaction pour cette année.
        </p>
      )}
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-zinc-600">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
