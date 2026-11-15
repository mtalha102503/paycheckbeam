"use client";

import { useMemo, useState } from "react";
import {
  calculatePaycheck,
  formatUSD,
  formatUSD0,
  type FilingStatus,
  type PayFrequency,
  type PayType,
  FILING_STATUS_LABELS,
  PAY_FREQUENCY_LABELS,
} from "@/lib/paycheckCalc";
import {
  STATE_TAX_DATA,
  estimateStateWithholding,
  getStateBySlug,
  stateEstimateIsApproximate,
} from "@/lib/stateTaxData";

interface Props {
  defaultStateSlug?: string;
  compact?: boolean;
}

function num(v: string, fallback: number): number {
  const n = parseFloat(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export default function PaycheckCalculator({ defaultStateSlug }: Props) {
  const [payType, setPayType] = useState<PayType>("salary");
  const [amount, setAmount] = useState("75000");
  const [hoursPerWeek, setHoursPerWeek] = useState("40");
  const [frequency, setFrequency] = useState<PayFrequency>("biweekly");
  const [filingStatus, setFilingStatus] = useState<FilingStatus>("single");
  const [retirement401k, setRetirement401k] = useState("0");
  const [healthInsurance, setHealthInsurance] = useState("0");
  const [stateSlug, setStateSlug] = useState<string>(defaultStateSlug ?? "texas-paycheck-calculator");

  const result = useMemo(() => {
    const inputs = {
      payType,
      amount: num(amount, 0),
      hoursPerWeek: num(hoursPerWeek, 40),
      frequency,
      filingStatus,
      retirement401kAnnual: num(retirement401k, 0),
      healthInsuranceAnnual: num(healthInsurance, 0),
      stateSlug: stateSlug === "federal-only" ? null : stateSlug,
    };
    return calculatePaycheck(inputs, estimateStateWithholding);
  }, [payType, amount, hoursPerWeek, frequency, filingStatus, retirement401k, healthInsurance, stateSlug]);

  const state = stateSlug === "federal-only" ? null : getStateBySlug(stateSlug);
  const stateUnavailable = state !== null && result.annualState === null;
  const stateApproximate = state !== null && stateEstimateIsApproximate(stateSlug);

  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20";
  const labelCls = "mb-1.5 block text-sm font-semibold text-slate-700";

  const rows: Array<{ label: string; value: string; note?: string; strong?: boolean }> = [
    { label: "Gross pay", value: formatUSD(result.perPeriodGross) },
    { label: "Federal income tax", value: `− ${formatUSD(result.perPeriodFederal)}` },
    { label: "Social Security (6.2%)", value: `− ${formatUSD(result.perPeriodSocialSecurity)}` },
    { label: "Medicare (1.45%)", value: `− ${formatUSD(result.perPeriodMedicare)}` },
    {
      label: state ? `${state.state} state tax` : "State tax",
      value:
        result.perPeriodState === null
          ? "Not estimated"
          : `− ${formatUSD(result.perPeriodState)}`,
      note: stateApproximate ? "Approximate — state deduction pending verification" : undefined,
    },
    {
      label: "Pre-tax deductions (401(k) + health)",
      value: `− ${formatUSD(result.perPeriodPreTax)}`,
    },
    { label: "Take-home pay", value: formatUSD(result.perPeriodNet), strong: true },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid lg:grid-cols-5">
        {/* Inputs */}
        <div className="border-b border-slate-200 p-5 sm:p-6 lg:col-span-2 lg:border-b-0 lg:border-r">
          <h2 className="text-lg font-bold text-slate-900">Your paycheck</h2>
          <p className="mt-1 text-sm text-slate-500">
            Everything runs in your browser — nothing you type is stored or sent anywhere.
          </p>

          <div className="mt-5">
            <span className={labelCls}>Pay type</span>
            <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Pay type">
              {(["salary", "hourly"] as PayType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPayType(t)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-semibold ${
                    payType === t
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  {t === "salary" ? "Salary (annual)" : "Hourly rate"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="amount" className={labelCls}>
              {payType === "salary" ? "Annual salary" : "Hourly rate"}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                $
              </span>
              <input
                id="amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`${inputCls} pl-7`}
                placeholder={payType === "salary" ? "75000" : "25"}
              />
            </div>
          </div>

          {payType === "hourly" && (
            <div className="mt-4">
              <label htmlFor="hours" className={labelCls}>
                Hours per week
              </label>
              <input
                id="hours"
                inputMode="decimal"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(e.target.value)}
                className={inputCls}
                placeholder="40"
              />
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="frequency" className={labelCls}>
                Pay frequency
              </label>
              <select
                id="frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as PayFrequency)}
                className={inputCls}
              >
                {(Object.keys(PAY_FREQUENCY_LABELS) as PayFrequency[]).map((f) => (
                  <option key={f} value={f}>
                    {PAY_FREQUENCY_LABELS[f]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filing" className={labelCls}>
                Filing status
              </label>
              <select
                id="filing"
                value={filingStatus}
                onChange={(e) => setFilingStatus(e.target.value as FilingStatus)}
                className={inputCls}
              >
                {(Object.keys(FILING_STATUS_LABELS) as FilingStatus[]).map((f) => (
                  <option key={f} value={f}>
                    {FILING_STATUS_LABELS[f]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="state" className={labelCls}>
              State
            </label>
            <select
              id="state"
              value={stateSlug}
              onChange={(e) => setStateSlug(e.target.value)}
              className={inputCls}
            >
              <option value="federal-only">Federal only (no state)</option>
              {STATE_TAX_DATA.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.state}
                  {s.structure === "none" ? " — no income tax" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="k401" className={labelCls}>
                401(k) / year
              </label>
              <input
                id="k401"
                inputMode="decimal"
                value={retirement401k}
                onChange={(e) => setRetirement401k(e.target.value)}
                className={inputCls}
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="health" className={labelCls}>
                Health insurance / year
              </label>
              <input
                id="health"
                inputMode="decimal"
                value={healthInsurance}
                onChange={(e) => setHealthInsurance(e.target.value)}
                className={inputCls}
                placeholder="0"
              />
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            401(k) lowers income tax but not Social Security/Medicare. Health premiums
            under a cafeteria plan lower both. Estimates use the 2026 IRS Pub 15-T
            percentage method with a standard W-4.
          </p>
        </div>

        {/* Results */}
        <div className="bg-slate-50 p-5 sm:p-6 lg:col-span-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Take-home pay · {PAY_FREQUENCY_LABELS[frequency].toLowerCase()}
          </p>
          <p className="mt-1 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {formatUSD(result.perPeriodNet)}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {formatUSD0(result.annualNet)} per year · {formatUSD0(result.annualGross)}{" "}
            gross · effective total tax rate{" "}
            {result.effectiveTotalTaxRatePct.toFixed(1)}%
          </p>

          {stateUnavailable && (
            <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <strong>State estimate coming soon.</strong> We are verifying the
              official 2026 {state?.state} brackets with the state Department of
              Revenue. The figures below show federal taxes only — your actual
              take-home pay will be lower once state withholding is included.
            </div>
          )}

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.label}
                    className={`border-b border-slate-100 last:border-b-0 ${
                      r.strong ? "bg-blue-50/60" : ""
                    }`}
                  >
                    <td
                      className={`px-4 py-3 ${
                        r.strong ? "font-bold text-slate-900" : "text-slate-600"
                      }`}
                    >
                      {r.label}
                      {r.note && (
                        <span className="block text-xs font-normal text-amber-700">
                          {r.note}
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums ${
                        r.strong ? "font-bold text-slate-900" : "text-slate-800"
                      }`}
                    >
                      {r.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-slate-200 bg-white px-2 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Federal / year
              </p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {formatUSD0(result.annualFederal)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-2 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                FICA / year
              </p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {formatUSD0(result.annualSocialSecurity + result.annualMedicare)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-2 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Marginal bracket
              </p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {result.marginalFederalRatePct}%
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Estimate only — not tax advice. Your real paycheck depends on your full
            W-4, employer payroll setup, state withholding certificate, and local
            taxes. Federal figures: IRS Rev. Proc. 2025-32 / Pub 15-T (2026).
          </p>
        </div>
      </div>
    </div>
  );
}
