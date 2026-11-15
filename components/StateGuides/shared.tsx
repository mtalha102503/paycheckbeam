/**
 * PaycheckBeam — shared helpers for the 48 state guide pages.
 *
 * These are verbatim copies of the helpers from the approved CA/TX/NY
 * exemplars (components/StateExemplars.tsx), exported here so every guide
 * batch uses identical components and identical engine calls. The
 * exemplars file itself is frozen and untouched.
 *
 * Rules every guide batch must follow (see the rollout brief):
 * - Worked-example numbers are generated at render time from the shared
 *   engine (calculatePaycheck / estimateStateWithholding /
 *   estimateStateInsurance) via examplePaycheck() — never hardcoded
 *   strings, never literal engine figures in prose or FAQs.
 * - A missing state result shows "Unavailable" (formatAmountOrUnavailable)
 *   — never a silent $0.00. A genuinely calculated zero (no-tax states)
 *   still shows $0.00.
 * - Incomplete examples get a "Partial calculation" badge in the table
 *   itself (WorkedTable partialRowIndexes), never a buried footnote.
 * - Dense filing-guide material goes in ExpandableSection <details>.
 */
import type { ReactNode } from "react";
import {
  applyBrackets,
  calculatePaycheck,
  estimateFederalLiability,
  formatUSD,
  formatUSD0,
  type NyLocalOption,
  type PaycheckBreakdown,
} from "@/lib/paycheckCalc";
import {
  estimateStateInsurance,
  estimateStateWithholding,
  getStateBySlug,
  type StateBracket,
} from "@/lib/stateTaxData";

/** Zero pre-tax deductions: the worked examples are wages-only, single filer. */
const WAGES_ONLY_PRE_TAX = { k401Annual: 0, sec125Annual: 0, hsaAnnual: 0 };

/**
 * Worked examples are generated from the same calculation the calculator
 * above the fold runs, so a table row can never drift from the tool.
 * Single filer, salary, no deductions, no overtime, wages only.
 */
export function examplePaycheck(
  slug: string,
  gross: number,
  nyLocal: NyLocalOption = "none",
): PaycheckBreakdown {
  return calculatePaycheck(
    {
      payType: "salary",
      amount: gross,
      hoursPerWeek: 40,
      frequency: "biweekly",
      filingStatus: "single",
      preTax: WAGES_ONLY_PRE_TAX,
      postTaxAnnual: 0,
      overtime: { enabled: false, hoursPerPeriod: 0, multiplier: 1.5 },
      stateSlug: slug,
      nyLocal,
    },
    estimateStateWithholding,
    estimateStateInsurance,
  );
}

/**
 * Engine taxable income for a wages-only single filer: gross minus the
 * standard deduction actually subtracted (after any AL/WI/SC
 * phase-down/phaseout), minus the personal exemption actually subtracted
 * (after any MD-style phaseout), minus any federal-tax deduction (AL/MO —
 * computed from the engine's estimated federal liability, not observed
 * withholding). This is the base the state estimator taxes, so table
 * columns and bracket walks built on it can never drift from the
 * calculator's state figure. For no-tax states, which carry no effective
 * figures, it falls back to the static base.
 *
 * Use this — not stateTaxableIncome() — for any state with a personal
 * exemption, a standard-deduction phase-down/phaseout, or a federal-tax
 * deduction.
 */
export function engineTaxableIncome(slug: string, gross: number): number {
  const state = getStateBySlug(slug);
  if (!state) return Math.max(0, gross);
  const estimate = estimateStateWithholding({
    stateSlug: slug,
    annualGross: gross,
    filingStatus: "single",
    preTax: WAGES_ONLY_PRE_TAX,
    nyLocal: "none",
    annualFederal: estimateFederalLiability(
      gross,
      "single",
      WAGES_ONLY_PRE_TAX,
    ),
  });
  const effSD = estimate.effectiveStandardDeduction;
  const effEx = estimate.effectiveExemption;
  if (effSD === undefined && effEx === undefined) {
    return Math.max(
      0,
      gross -
        (state.standardDeductionSingle ?? 0) -
        (state.exemptionSingle ?? 0),
    );
  }
  return Math.max(
    0,
    gross -
      (effSD ?? 0) -
      (effEx ?? 0) -
      (estimate.federalTaxDeduction ?? 0),
  );
}

/**
 * State taxable income for a wages-only single filer: gross minus the
 * state standard deduction (the state estimator subtracts no exemption
 * for these states, so this matches its taxable base). Only valid for
 * states with no personal exemption, no standard-deduction
 * phase-down/phaseout, and no federal-tax deduction — anything else
 * must use engineTaxableIncome() above.
 */
export function stateTaxableIncome(slug: string, gross: number): number {
  const state = getStateBySlug(slug);
  const sd = state?.standardDeductionSingle ?? 0;
  return Math.max(0, gross - sd);
}

/**
 * Display for a state/local tax result: "Unavailable" when the estimate
 * is missing — never a silent $0.00 for a result that was never computed.
 * A genuinely calculated zero (e.g. Texas) still shows $0.00.
 */
export function formatAmountOrUnavailable(value: number | null): string {
  return value === null ? "Unavailable" : formatUSD(value);
}

/**
 * Per-bracket arithmetic for a detail paragraph, generated from the
 * state's own bracket table — the same walk applyBrackets does, so the
 * lines can never drift from the engine. Returns e.g.
 * "1% × $11,456 = $114.56; 2% × $15,701 = $314.02".
 */
export function bracketDetailText(
  slug: string,
  gross: number,
  brackets: StateBracket[],
): string {
  return bracketWalk(stateTaxableIncome(slug, gross), brackets);
}

/** bracketDetailText() run on the engine taxable base (see
 *  engineTaxableIncome) — for states with an exemption, a
 *  phase-down/phaseout, or a federal-tax deduction. */
export function bracketDetailEngine(
  slug: string,
  gross: number,
  brackets: StateBracket[],
): string {
  return bracketWalk(engineTaxableIncome(slug, gross), brackets);
}

/** Shared bracket walk on an explicit taxable base. */
function bracketWalk(taxable: number, brackets: StateBracket[]): string {
  const parts: string[] = [];
  let prevTop = 0;
  for (const b of brackets) {
    const top = b.upTo ?? Infinity;
    const base = Math.min(taxable, top) - prevTop;
    if (base > 0) {
      parts.push(
        `${b.ratePct}% × ${formatUSD0(base)} = ${formatUSD((base * b.ratePct) / 100)}`,
      );
      if (b.base) parts.push(`+ ${formatUSD(b.base)} step`);
    }
    if (taxable <= top) break;
    prevTop = top;
  }
  return parts.join("; ");
}

/** Effective rate as a string, or "Unavailable" when the state result is missing. */
export function effectiveRatePct(
  annualState: number | null,
  gross: number,
): string {
  return annualState === null
    ? "Unavailable"
    : ((annualState / gross) * 100).toFixed(1);
}

export function Eyebrow({ children }: { children: string }) {
  return (
    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">
      {children}
    </p>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
      {children}
    </h2>
  );
}

export function Para({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
      {children}
    </p>
  );
}

/** Amber/blue note box for labels that must not be missed (partial rows, return-only items). */
export function NoteBox({
  tone,
  children,
}: {
  tone: "amber" | "blue";
  children: ReactNode;
}) {
  const cls =
    tone === "amber"
      ? "border-amber-300 bg-amber-50 text-amber-900"
      : "border-blue-200 bg-blue-50 text-blue-900";
  return (
    <div
      className={`mt-4 max-w-3xl rounded-2xl border px-4 py-3 text-sm leading-relaxed ${cls}`}
    >
      {children}
    </div>
  );
}

/**
 * Dense filing-guide material lives inside an expandable section so the
 * main page reads: calculator, examples, paycheck deductions, exclusions,
 * short FAQs + sources. The content is still in the HTML (and indexed);
 * it is just collapsed until the reader wants it.
 */
export function ExpandableSection({
  eyebrow,
  title,
  summary,
  children,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
      <details className="group max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-5 [&::-webkit-details-marker]:hidden">
          <span>
            <Eyebrow>{eyebrow}</Eyebrow>
            <span className="mt-2 block text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              {title}
            </span>
            <span className="mt-2 block text-sm leading-relaxed text-slate-600">
              {summary}
            </span>
          </span>
          <span className="mt-1 shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold whitespace-nowrap text-slate-600 group-open:hidden">
            Show details +
          </span>
          <span className="mt-1 hidden shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold whitespace-nowrap text-slate-600 group-open:inline">
            Hide details −
          </span>
        </summary>
        <div className="border-t border-slate-100 px-5 pb-6">{children}</div>
      </details>
    </section>
  );
}

export function WorkedTable({
  caption,
  headers,
  rows,
  footnote,
  partialRowIndexes,
}: {
  caption: string;
  headers: string[];
  rows: string[][];
  footnote?: string;
  /** Row indexes that are partial calculations — badged in the table itself, not just in the footnote. */
  partialRowIndexes?: number[];
}) {
  return (
    <div className="mt-6 max-w-3xl">
      <h3 className="text-base font-bold text-slate-900">{caption}</h3>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              {headers.map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-2.5 font-semibold text-slate-700 ${i > 0 ? "text-right" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, rowIndex) => (
              <tr key={r[0]} className="border-b border-slate-100 last:border-b-0">
                {r.map((c, i) => (
                  <td
                    key={i}
                    className={`px-4 py-2.5 tabular-nums ${i === 0 ? "text-slate-600" : "text-right font-semibold text-slate-900"}`}
                  >
                    {c}
                    {i === 0 && partialRowIndexes?.includes(rowIndex) && (
                      <span className="ml-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 align-middle text-[11px] font-bold whitespace-nowrap text-amber-800">
                        Partial calculation
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footnote && (
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-500">
          {footnote}
        </p>
      )}
    </div>
  );
}
