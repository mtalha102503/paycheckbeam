"use client";

import { useMemo, useRef, useState } from "react";
import {
  annualToHourly,
  calculatePaycheck,
  formatUSD,
  formatUSD0,
  hourlyToAnnual,
  splitOvertime,
  validatePaycheckInputs,
  type FilingStatus,
  type NyLocalOption,
  type PayFrequency,
  type PayType,
  FILING_STATUS_LABELS,
  PAY_FREQUENCY_LABELS,
  PERIODS_PER_YEAR,
} from "@/lib/paycheckCalc";
import {
  STATE_INSURANCE_PROGRAMS,
  STATE_TAX_DATA,
  estimateStateInsurance,
  estimateStateWithholding,
  getStateBySlug,
  stateEstimateIsApproximate,
} from "@/lib/stateTaxData";

interface Props {
  defaultStateSlug?: string;
}

function num(v: string, fallback: number): number {
  const n = parseFloat(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** "75000" -> "75,000"; keeps a trailing decimal while typing. */
function withSeparators(v: string): string {
  const clean = v.replace(/[^0-9.]/g, "");
  const [int, dec] = clean.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec !== undefined ? `${grouped}.${dec}` : grouped;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.16" />
      <path
        d="M6 10.2 8.8 13 14 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ---- Pre-tax deduction definitions (SmartAsset-style panel) ----

type PreTaxId =
  | "medical"
  | "dental"
  | "vision"
  | "k401"
  | "ltd"
  | "life"
  | "commuter"
  | "fsa"
  | "hsa";

type DeductionCategory = "k401" | "sec125" | "hsa";

const PRE_TAX_DEFS: {
  id: PreTaxId;
  label: string;
  category: DeductionCategory;
  hint: string;
}[] = [
  { id: "medical", label: "Medical insurance", category: "sec125", hint: "Section 125" },
  { id: "dental", label: "Dental coverage", category: "sec125", hint: "Section 125" },
  { id: "vision", label: "Vision insurance", category: "sec125", hint: "Section 125" },
  { id: "k401", label: "401(k)", category: "k401", hint: "Income tax only" },
  { id: "ltd", label: "Long-term disability", category: "sec125", hint: "Section 125" },
  { id: "life", label: "Life insurance", category: "sec125", hint: "Section 125" },
  { id: "commuter", label: "Commuter plan", category: "sec125", hint: "Section 132" },
  { id: "fsa", label: "FSA — health (flexible spending)", category: "sec125", hint: "Section 125" },
  { id: "hsa", label: "HSA (health savings)", category: "hsa", hint: "Payroll HSA" },
];

interface PreTaxRow {
  id: PreTaxId;
  mode: "fixed" | "pct";
  value: string;
}

interface PostTaxRow {
  key: number;
  name: string;
  mode: "fixed" | "pct";
  value: string;
}

// ---- Results breakdown rows (with expandable DETAILS + % of pay) ----

interface DetailLine {
  label: string;
  value: string;
  pct: number | null;
  muted?: boolean;
}

interface ResultRow {
  key: string;
  label: string;
  value: string | null;
  pct: number | null;
  kind: "gross" | "tax" | "insurance" | "pretax" | "posttax" | "net";
  details?: DetailLine[];
  note?: string;
}

function BreakdownRow({ row }: { row: ResultRow }) {
  const [open, setOpen] = useState(false);
  const hasDetails = !!row.details && row.details.length > 0;
  const isZero = row.value === "$0.00";
  const isNet = row.kind === "net";
  return (
    <>
      <tr
        className={`border-b border-white/10 last:border-b-0 ${
          isNet ? "bg-emerald-400/10" : ""
        } ${hasDetails ? "cursor-pointer" : ""}`}
        onClick={hasDetails ? () => setOpen((o) => !o) : undefined}
      >
        <td
          className={`px-4 py-3 ${
            isNet
              ? "font-bold text-white"
              : isZero
                ? "text-slate-500"
                : "text-slate-200"
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            {hasDetails && (
              <ChevronIcon
                className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              />
            )}
            {row.label}
          </span>
          {row.note && (
            <span className="block text-xs font-normal text-amber-300">
              {row.note}
            </span>
          )}
        </td>
        <td className="px-2 py-3 text-right text-xs text-slate-400 tabular-nums">
          {row.pct === null ? "" : `${row.pct.toFixed(1)}%`}
        </td>
        <td
          className={`px-4 py-3 text-right tabular-nums ${
            isNet
              ? "font-extrabold text-emerald-400"
              : isZero
                ? "text-slate-500"
                : row.kind === "gross"
                  ? "font-semibold text-white"
                  : row.kind === "pretax" || row.kind === "posttax"
                    ? "text-slate-300"
                    : "font-semibold text-red-300"
          }`}
        >
          {row.value === null
            ? "Not estimated"
            : isZero
              ? "$0.00"
              : row.kind === "tax" ||
                  row.kind === "insurance" ||
                  row.kind === "pretax" ||
                  row.kind === "posttax"
                ? `− ${row.value}`
                : row.value}
        </td>
      </tr>
      {hasDetails &&
        open &&
        row.details!.map((d) => (
          <tr key={d.label} className="border-b border-white/10 bg-white/[0.03]">
            <td className="px-4 py-2 pl-9 text-[13px] text-slate-400">
              {d.label}
            </td>
            <td className="px-2 py-2 text-right text-xs text-slate-500 tabular-nums">
              {d.pct === null ? "" : `${d.pct.toFixed(1)}%`}
            </td>
            <td
              className={`px-4 py-2 text-right text-[13px] tabular-nums ${
                d.muted ? "text-slate-500" : "text-slate-300"
              }`}
            >
              {d.muted ? "$0.00" : d.value}
            </td>
          </tr>
        ))}
    </>
  );
}

export default function PaycheckCalculator({ defaultStateSlug }: Props) {
  const [payType, setPayType] = useState<PayType>("salary");
  // Separate values per mode — the toggle CONVERTS between them (fix #4).
  const [salaryAmount, setSalaryAmount] = useState("75000");
  const [hourlyRate, setHourlyRate] = useState("25");
  const [hoursPerWeek, setHoursPerWeek] = useState("40");
  const [frequency, setFrequency] = useState<PayFrequency>("biweekly");
  const [filingStatus, setFilingStatus] = useState<FilingStatus>("single");
  const [stateSlug, setStateSlug] = useState<string>(
    defaultStateSlug ?? "texas-paycheck-calculator",
  );
  const [nyLocal, setNyLocal] = useState<NyLocalOption>("none");
  const [view, setView] = useState<"period" | "annual">("period");
  const [copied, setCopied] = useState(false);

  // Overtime (fix #5)
  const [otEnabled, setOtEnabled] = useState(false);
  const [otHours, setOtHours] = useState("0");
  const [otMultiplier, setOtMultiplier] = useState("1.5");
  const [otOpen, setOtOpen] = useState(false);

  // Pre-tax deductions panel (9 presets, $ or % of gross)
  const [preTaxRows, setPreTaxRows] = useState<PreTaxRow[]>(
    PRE_TAX_DEFS.map((d) => ({ id: d.id, mode: "fixed" as const, value: "0" })),
  );
  const [preTaxOpen, setPreTaxOpen] = useState(true);

  // Post-tax deductions (free-form)
  const postTaxKeyRef = useRef(1);
  const [postTaxRows, setPostTaxRows] = useState<PostTaxRow[]>([]);
  const [postTaxOpen, setPostTaxOpen] = useState(false);

  // ---- Derived amounts ----
  const amount = payType === "salary" ? num(salaryAmount, 0) : num(hourlyRate, 0);
  const hrs = num(hoursPerWeek, 40);
  const periods = PERIODS_PER_YEAR[frequency];
  // Regular + overtime split (FLSA, no double-counting — same helper as
  // the engine, so the panel and the result can never disagree).
  const otSplit = splitOvertime(
    payType,
    amount,
    hrs,
    {
      enabled: otEnabled,
      hoursPerPeriod: num(otHours, 0),
      multiplier: num(otMultiplier, 1.5),
    },
    periods,
  );
  const hourlyRateNum = otSplit.hourlyRate;
  const regularAnnual = otSplit.annualRegularGross;
  const otAnnual = otSplit.annualOvertimeGross;
  const annualGross = regularAnnual + otAnnual;
  // Overtime hours the user typed, per week — vs the hours that actually
  // count (capped at hours above 40/week).
  const enteredOtHoursPerWeek = otEnabled ? (num(otHours, 0) * periods) / 52 : 0;
  const otHoursClamped =
    enteredOtHoursPerWeek - otSplit.overtimeHoursPerWeek > 0.001;
  const otRate = hourlyRateNum * num(otMultiplier, 1.5);

  // Pre-tax annual amounts ($ fixed, or % of annual gross).
  const preTaxById = useMemo(() => {
    const m = new Map<PreTaxId, number>();
    for (const def of PRE_TAX_DEFS) {
      const row = preTaxRows.find((r) => r.id === def.id);
      if (!row) continue;
      const v = num(row.value, 0);
      m.set(def.id, row.mode === "pct" ? (v / 100) * annualGross : v);
    }
    return m;
  }, [preTaxRows, annualGross]);

  const k401Annual = preTaxById.get("k401") ?? 0;
  const hsaAnnual = preTaxById.get("hsa") ?? 0;
  const sec125Annual = PRE_TAX_DEFS.filter((d) => d.category === "sec125").reduce(
    (s, d) => s + (preTaxById.get(d.id) ?? 0),
    0,
  );
  const totalPreTax = k401Annual + sec125Annual + hsaAnnual;

  const postTaxAnnual = postTaxRows.reduce((s, r) => {
    const v = num(r.value, 0);
    return s + (r.mode === "pct" ? (v / 100) * annualGross : v);
  }, 0);

  // ---- Validation (fix #3) — errors suppress the result ----
  const errors = validatePaycheckInputs({
    amount,
    payType,
    hoursPerWeek: hrs,
    overtime: {
      enabled: otEnabled,
      hoursPerPeriod: num(otHours, 0),
      multiplier: num(otMultiplier, 1.5),
    },
    totalPreTaxAnnual: totalPreTax,
    postTaxAnnual,
    annualGross,
  });

  const result = useMemo(() => {
    return calculatePaycheck(
      {
        payType,
        amount,
        hoursPerWeek: hrs,
        frequency,
        filingStatus,
        preTax: {
          k401Annual,
          sec125Annual,
          hsaAnnual,
        },
        postTaxAnnual,
        overtime: {
          enabled: otEnabled,
          hoursPerPeriod: num(otHours, 0),
          multiplier: num(otMultiplier, 1.5),
        },
        stateSlug: stateSlug === "federal-only" ? null : stateSlug,
        nyLocal,
      },
      estimateStateWithholding,
      estimateStateInsurance,
    );
  }, [
    payType,
    amount,
    hrs,
    frequency,
    filingStatus,
    k401Annual,
    sec125Annual,
    hsaAnnual,
    postTaxAnnual,
    otEnabled,
    otHours,
    otMultiplier,
    stateSlug,
    nyLocal,
  ]);

  const state = stateSlug === "federal-only" ? null : getStateBySlug(stateSlug);
  const stateUnavailable = state !== null && result.annualState === null;
  const stateApproximate = state !== null && stateEstimateIsApproximate(stateSlug);
  const isNewYork = stateSlug === "new-york-paycheck-calculator";

  const inputCls =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20";
  const labelCls = "mb-1.5 block text-sm font-semibold text-slate-700";

  const isAnnual = view === "annual";
  const val = (period: number, annual: number) => (isAnnual ? annual : period);
  const pctOfGross = (annual: number | null) =>
    annual === null || annualGross <= 0 ? null : (annual / annualGross) * 100;

  // Salary <-> hourly conversion on toggle (fix #4).
  const switchPayType = (t: PayType) => {
    if (t === payType) return;
    if (t === "hourly") {
      const sal = num(salaryAmount, 0);
      if (sal > 0 && hrs > 0) {
        setHourlyRate(String(annualToHourly(sal, hrs)));
      }
    } else {
      const rate = num(hourlyRate, 0);
      if (rate > 0 && hrs > 0) {
        setSalaryAmount(String(hourlyToAnnual(rate, hrs)));
      }
    }
    setPayType(t);
  };

  const setPreTaxRow = (id: PreTaxId, patch: Partial<PreTaxRow>) => {
    setPreTaxRows((rows) =>
      rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  };

  const addPostTaxRow = () => {
    const key = postTaxKeyRef.current++;
    setPostTaxRows((rows) => [
      ...rows,
      { key, name: "", mode: "fixed", value: "0" },
    ]);
    setPostTaxOpen(true);
  };

  // ---- Results rows (DETAILS + % column) ----
  const insurancePrograms = isNewYork || state ? STATE_INSURANCE_PROGRAMS[stateSlug] ?? [] : [];
  const rows: ResultRow[] = [
    {
      key: "gross",
      label: "Gross pay",
      value: formatUSD(val(result.perPeriodGross, result.annualGross)),
      pct: 100,
      kind: "gross",
      details: otEnabled
        ? [
            {
              label: "Regular pay",
              value: formatUSD(val(result.perPeriodRegularGross, result.annualRegularGross)),
              pct: pctOfGross(result.annualRegularGross),
            },
            {
              label: `Overtime (${num(otMultiplier, 1.5)}× · ${formatUSD(otRate)}/hr)`,
              value: formatUSD(val(result.perPeriodOvertimeGross, result.annualOvertimeGross)),
              pct: pctOfGross(result.annualOvertimeGross),
            },
          ]
        : undefined,
      note: otEnabled
        ? result.annualOvertimeGross > 0
          ? `Includes a ${formatUSD((result.annualOvertimeGross * (num(otMultiplier, 1.5) - 1)) / num(otMultiplier, 1.5))}/yr time-and-a-half premium above straight time.`
          : "Overtime is on, but you work 40 hours or fewer a week, so there are no overtime hours."
        : "Overtime excluded — enable it below to include overtime pay.",
    },
    {
      key: "federal",
      label: "Federal income tax",
      value: formatUSD(val(result.perPeriodFederal, result.annualFederal)),
      pct: pctOfGross(result.annualFederal),
      kind: "tax",
    },
    {
      key: "ss",
      label: "Social Security (6.2%)",
      value: formatUSD(val(result.perPeriodSocialSecurity, result.annualSocialSecurity)),
      pct: pctOfGross(result.annualSocialSecurity),
      kind: "tax",
      note:
        result.annualSocialSecurity >= 0.062 * 184500 - 0.01 &&
        annualGross - sec125Annual - hsaAnnual >= 184500
          ? "Capped at the $184,500 wage base"
          : undefined,
    },
    {
      key: "medicare",
      label:
        result.annualMedicareAdditional > 0
          ? "Medicare (1.45% + 0.9% additional)"
          : "Medicare (1.45%)",
      value: formatUSD(val(result.perPeriodMedicare, result.annualMedicare)),
      pct: pctOfGross(result.annualMedicare),
      kind: "tax",
      note:
        result.annualMedicareAdditional > 0
          ? "Additional 0.9% withheld on wages over $200,000 (every filing status)"
          : undefined,
    },
    {
      key: "state",
      label: state ? `${state.state} state tax` : "State tax",
      value:
        result.perPeriodState === null
          ? null
          : formatUSD(val(result.perPeriodState, result.annualState ?? 0)),
      pct: pctOfGross(result.annualState),
      kind: "tax",
      note: stateApproximate
        ? "Approximate — state deduction pending verification"
        : undefined,
    },
    ...(result.annualLocal !== null
      ? [
          {
            key: "local",
            label: result.localLabel ?? "Local tax",
            value: formatUSD(val(result.perPeriodLocal ?? 0, result.annualLocal)),
            pct: pctOfGross(result.annualLocal),
            kind: "tax" as const,
          },
        ]
      : []),
    ...(result.annualStateInsurance > 0
      ? [
          {
            key: "insurance",
            label: "State insurance programs",
            value: formatUSD(
              val(result.perPeriodStateInsurance, result.annualStateInsurance),
            ),
            pct: pctOfGross(result.annualStateInsurance),
            kind: "insurance" as const,
            details: result.stateInsuranceLines.map((l) => {
              const prog = insurancePrograms.find((p) => p.id === l.id);
              return {
                label: prog ? `${l.label} (${prog.ratePct}%)` : l.label,
                value: formatUSD(isAnnual ? l.annual : l.annual / result.periodsPerYear),
                pct: pctOfGross(l.annual),
              };
            }),
          },
        ]
      : []),
    {
      key: "pretax",
      label: "Pre-tax deductions",
      value: formatUSD(val(result.perPeriodPreTax, result.annualPreTax)),
      pct: pctOfGross(result.annualPreTax),
      kind: "pretax",
      details: PRE_TAX_DEFS.map((def) => {
        const annual = preTaxById.get(def.id) ?? 0;
        return {
          label: def.label,
          value: formatUSD(isAnnual ? annual : annual / result.periodsPerYear),
          pct: pctOfGross(annual),
          muted: annual === 0,
        };
      }),
    },
    ...(postTaxAnnual > 0
      ? [
          {
            key: "posttax",
            label: "Post-tax deductions",
            value: formatUSD(val(result.perPeriodPostTax, result.annualPostTax)),
            pct: pctOfGross(result.annualPostTax),
            kind: "posttax" as const,
            details: postTaxRows.map((r) => {
              const v = num(r.value, 0);
              const annual = r.mode === "pct" ? (v / 100) * annualGross : v;
              return {
                label: r.name.trim() || "Post-tax deduction",
                value: formatUSD(isAnnual ? annual : annual / result.periodsPerYear),
                pct: pctOfGross(annual),
              };
            }),
          },
        ]
      : []),
    {
      key: "net",
      label: "Estimated take-home pay",
      value: formatUSD(val(result.perPeriodNet, result.annualNet)),
      pct: pctOfGross(result.annualNet),
      kind: "net",
    },
  ];

  // Donut: where each gross dollar goes (annual basis).
  const donut = useMemo(() => {
    const gross = result.annualGross;
    if (gross <= 0) return null;
    const segments = [
      { label: "You keep", value: result.annualNet, color: "#16a34a" },
      { label: "Federal tax", value: result.annualFederal, color: "#dc2626" },
      {
        label: "Social Security + Medicare",
        value: result.annualSocialSecurity + result.annualMedicare,
        color: "#d97706",
      },
      { label: "State tax", value: result.annualState ?? 0, color: "#ea580c" },
      {
        label: "State insurance",
        value: result.annualStateInsurance,
        color: "#8b5cf6",
      },
      { label: "Local tax", value: result.annualLocal ?? 0, color: "#0ea5e9" },
      { label: "Pre-tax deductions", value: result.annualPreTax, color: "#64748b" },
      { label: "Post-tax deductions", value: result.annualPostTax, color: "#94a3b8" },
    ].filter((s) => s.value > 0);
    const r = 52;
    const c = 2 * Math.PI * r;
    let offset = 0;
    const parts = segments.map((s) => {
      const len = (s.value / gross) * c;
      const part = { ...s, len, offset };
      offset += len;
      return part;
    });
    return { parts, c, r, keepPct: (result.annualNet / gross) * 100 };
  }, [result]);

  const handleCopy = async () => {
    const stateLine =
      result.annualState === null
        ? "State tax: not estimated"
        : `State tax ${formatUSD0(result.annualState)}/yr`;
    const localLine =
      result.annualLocal !== null
        ? ` · ${result.localLabel} ${formatUSD0(result.annualLocal)}/yr`
        : "";
    const insuranceLine =
      result.annualStateInsurance > 0
        ? ` · State insurance ${formatUSD0(result.annualStateInsurance)}/yr`
        : "";
    const text =
      `My estimated take-home pay: ${formatUSD(result.perPeriodNet)} per ${PAY_FREQUENCY_LABELS[frequency].toLowerCase()} ` +
      `(${formatUSD0(result.annualNet)}/year) on ${formatUSD0(result.annualGross)} gross` +
      `${state ? ` in ${state.state}` : ""}. Federal ${formatUSD0(result.annualFederal)}/yr · ` +
      `Social Security + Medicare ${formatUSD0(result.annualSocialSecurity + result.annualMedicare)}/yr · ` +
      `${stateLine}${localLine}${insuranceLine} · Effective total tax ${result.effectiveTotalTaxRatePct.toFixed(1)}%. ` +
      `Calculated with PaycheckBeam (2026 IRS Pub 15-T). https://paycheckbeam.com`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_28px_60px_-24px_rgba(6,15,36,0.4)]">
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
                  onClick={() => switchPayType(t)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    payType === t
                      ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  {t === "salary" ? "Salary (annual)" : "Hourly rate"}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Switching converts your pay — $75,000 a year is about $36.06 an hour at 40 hrs/week.
            </p>
          </div>

          <div className="mt-4">
            <label htmlFor="amount" className={labelCls}>
              {payType === "salary" ? "Annual salary" : "Hourly rate"}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-slate-400">
                $
              </span>
              <input
                id="amount"
                inputMode="decimal"
                value={withSeparators(payType === "salary" ? salaryAmount : hourlyRate)}
                onChange={(e) =>
                  payType === "salary"
                    ? setSalaryAmount(e.target.value.replace(/,/g, ""))
                    : setHourlyRate(e.target.value.replace(/,/g, ""))
                }
                className={`${inputCls} pl-7 tabular-nums`}
                placeholder={payType === "salary" ? "75,000" : "25"}
              />
            </div>
          </div>

          {(payType === "hourly" || otEnabled) && (
            <div className="mt-4">
              <label htmlFor="hours" className={labelCls}>
                Hours per week
              </label>
              <input
                id="hours"
                inputMode="decimal"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(e.target.value)}
                className={`${inputCls} tabular-nums`}
                placeholder="40"
              />
              {payType === "salary" && (
                <p className="mt-1.5 text-xs text-slate-500">
                  Needed to work out your hourly overtime rate from your salary.
                </p>
              )}
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
              onChange={(e) => {
                const next = e.target.value;
                setStateSlug(next);
                if (next !== "new-york-paycheck-calculator") setNyLocal("none");
              }}
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

          {isNewYork && (
            <div className="mt-4">
              <span className={labelCls}>Where in New York?</span>
              <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="New York local tax">
                {(
                  [
                    ["none", "Rest of NY"],
                    ["nyc", "New York City"],
                    ["yonkers", "Yonkers"],
                  ] as [NyLocalOption, string][]
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setNyLocal(v)}
                    className={`rounded-xl border px-2 py-2.5 text-xs font-semibold transition sm:text-sm ${
                      nyLocal === v
                        ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {nyLocal === "nyc"
                  ? "NYC residents pay city tax (3.078%–3.876%) on top of state tax."
                  : nyLocal === "yonkers"
                    ? "Yonkers residents pay a 16.75% surcharge on their state tax."
                    : "Commuters and upstate residents pay no NYC or Yonkers tax."}
              </p>
            </div>
          )}

          {/* Overtime */}
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setOtOpen((o) => !o)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-slate-50"
              aria-expanded={otOpen}
            >
              <span className="text-sm font-bold text-slate-900">
                Overtime{" "}
                <span className="font-semibold text-slate-500">
                  · {otEnabled ? `${formatUSD0(otAnnual)}/yr` : "excluded"}
                </span>
              </span>
              <ChevronIcon
                className={`h-5 w-5 text-slate-400 transition-transform ${otOpen ? "rotate-180" : ""}`}
              />
            </button>
            {otOpen && (
              <div className="space-y-3 border-t border-slate-200 px-4 py-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={otEnabled}
                    onChange={(e) => setOtEnabled(e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  Include overtime pay
                </label>
                {otEnabled ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="ot-hours" className={labelCls}>
                          OT hours / {PAY_FREQUENCY_LABELS[frequency].toLowerCase()}
                        </label>
                        <input
                          id="ot-hours"
                          inputMode="decimal"
                          value={otHours}
                          onChange={(e) => setOtHours(e.target.value)}
                          className={`${inputCls} tabular-nums`}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label htmlFor="ot-mult" className={labelCls}>
                          Multiplier
                        </label>
                        <input
                          id="ot-mult"
                          inputMode="decimal"
                          value={otMultiplier}
                          onChange={(e) => setOtMultiplier(e.target.value)}
                          className={`${inputCls} tabular-nums`}
                          placeholder="1.5"
                        />
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-500">
                      Default 1.5× is the FLSA time-and-a-half rate for hours
                      over 40 a week. Overtime is paid at{" "}
                      {formatUSD(otRate)}/hr ({formatUSD(hourlyRateNum)} ×{" "}
                      {num(otMultiplier, 1.5)}×)
                      {payType === "salary"
                        ? " — hourly rate worked out from your salary ÷ hours/week ÷ 52"
                        : ""}
                      . Enter the overtime hours only — the hours above 40 a
                      week; regular pay already covers the first 40.
                    </p>
                    {otHoursClamped && (
                      <p className="text-xs leading-relaxed font-semibold text-amber-700">
                        Only {otSplit.overtimeHoursPerWeek.toFixed(1)} of the{" "}
                        {enteredOtHoursPerWeek.toFixed(1)} overtime hrs/week
                        you entered count — overtime is the hours above 40 a
                        week.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs leading-relaxed text-slate-500">
                    Overtime excluded — your gross pay counts straight time only.
                    Turn it on if you regularly work past 40 hours a week.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Pre-tax deductions */}
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setPreTaxOpen((o) => !o)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-slate-50"
              aria-expanded={preTaxOpen}
            >
              <span className="text-sm font-bold text-slate-900">
                Pre-tax deductions{" "}
                <span className="font-semibold text-slate-500">
                  · {formatUSD0(totalPreTax)}/yr
                </span>
              </span>
              <ChevronIcon
                className={`h-5 w-5 text-slate-400 transition-transform ${preTaxOpen ? "rotate-180" : ""}`}
              />
            </button>
            {preTaxOpen && (
              <div className="space-y-3 border-t border-slate-200 px-4 py-3">
                {PRE_TAX_DEFS.map((def) => {
                  const row = preTaxRows.find((r) => r.id === def.id)!;
                  return (
                    <div key={def.id}>
                      <label htmlFor={`ded-${def.id}`} className={labelCls}>
                        {def.label}{" "}
                        <span className="font-normal text-slate-400">
                          · {def.hint} · per year
                        </span>
                      </label>
                      <div className="flex gap-2">
                        <select
                          aria-label={`${def.label} calculation method`}
                          value={row.mode}
                          onChange={(e) =>
                            setPreTaxRow(def.id, {
                              mode: e.target.value as "fixed" | "pct",
                            })
                          }
                          className="w-24 shrink-0 rounded-xl border border-slate-300 bg-white px-2 py-2.5 text-sm text-slate-700 shadow-sm focus:border-blue-600 focus:outline-none"
                        >
                          <option value="fixed">$ amount</option>
                          <option value="pct">% of pay</option>
                        </select>
                        <div className="relative flex-1">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            {row.mode === "pct" ? "%" : "$"}
                          </span>
                          <input
                            id={`ded-${def.id}`}
                            inputMode="decimal"
                            value={withSeparators(row.value)}
                            onChange={(e) =>
                              setPreTaxRow(def.id, {
                                value: e.target.value.replace(/,/g, ""),
                              })
                            }
                            className={`${inputCls} pl-7 tabular-nums`}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                <p className="text-xs leading-relaxed text-slate-500">
                  401(k) lowers income tax but not Social Security/Medicare.
                  The rest lower both. Each state applies its own rule:
                  Pennsylvania taxes 401(k) contributions, New Jersey taxes
                  Section 125 health premiums, FSAs and HSAs (but not
                  401(k)), and California taxes HSAs.
                </p>
              </div>
            )}
          </div>

          {/* Post-tax deductions */}
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setPostTaxOpen((o) => !o)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-slate-50"
              aria-expanded={postTaxOpen}
            >
              <span className="text-sm font-bold text-slate-900">
                Post-tax deductions{" "}
                <span className="font-semibold text-slate-500">
                  · {formatUSD0(postTaxAnnual)}/yr
                </span>
              </span>
              <ChevronIcon
                className={`h-5 w-5 text-slate-400 transition-transform ${postTaxOpen ? "rotate-180" : ""}`}
              />
            </button>
            {postTaxOpen && (
              <div className="space-y-3 border-t border-slate-200 px-4 py-3">
                {postTaxRows.length === 0 && (
                  <p className="text-xs leading-relaxed text-slate-500">
                    Things taken out after tax — union dues, garnishments,
                    Roth 401(k), extra savings. They lower your take-home pay
                    only.
                  </p>
                )}
                {postTaxRows.map((r) => (
                  <div key={r.key} className="space-y-2 rounded-xl bg-slate-50 p-3">
                    <div className="flex gap-2">
                      <input
                        aria-label="Deduction name"
                        value={r.name}
                        onChange={(e) =>
                          setPostTaxRows((rows) =>
                            rows.map((x) =>
                              x.key === r.key ? { ...x, name: e.target.value } : x,
                            ),
                          )
                        }
                        className={`${inputCls} flex-1`}
                        placeholder="Deduction name (e.g. Union dues)"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPostTaxRows((rows) => rows.filter((x) => x.key !== r.key))
                        }
                        className="rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-500 transition hover:border-red-400 hover:text-red-600"
                        aria-label="Remove deduction"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <select
                        aria-label="Deduction calculation method"
                        value={r.mode}
                        onChange={(e) =>
                          setPostTaxRows((rows) =>
                            rows.map((x) =>
                              x.key === r.key
                                ? { ...x, mode: e.target.value as "fixed" | "pct" }
                                : x,
                            ),
                          )
                        }
                        className="w-24 shrink-0 rounded-xl border border-slate-300 bg-white px-2 py-2.5 text-sm text-slate-700 shadow-sm focus:border-blue-600 focus:outline-none"
                      >
                        <option value="fixed">$ / year</option>
                        <option value="pct">% of pay</option>
                      </select>
                      <div className="relative flex-1">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          {r.mode === "pct" ? "%" : "$"}
                        </span>
                        <input
                          inputMode="decimal"
                          value={withSeparators(r.value)}
                          onChange={(e) =>
                            setPostTaxRows((rows) =>
                              rows.map((x) =>
                                x.key === r.key
                                  ? { ...x, value: e.target.value.replace(/,/g, "") }
                                  : x,
                              ),
                            )
                          }
                          className={`${inputCls} pl-7 tabular-nums`}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPostTaxRow}
                  className="w-full rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-sm font-bold text-blue-700 transition hover:border-blue-600 hover:bg-blue-50"
                >
                  + Add another post-tax deduction
                </button>
              </div>
            )}
          </div>

          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Estimates use the 2026 IRS Pub 15-T percentage method with a
            standard W-4. State figures are annual-liability estimates, not
            your employer&apos;s exact withholding table.
          </p>
        </div>

        {/* Results — deep navy panel */}
        <div className="relative bg-navy-900 p-5 sm:p-6 lg:col-span-3">
          <div className="bg-hero-dots pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="relative">
            {errors.length > 0 ? (
              <div
                className="rounded-2xl border border-red-400/50 bg-red-500/10 px-5 py-5"
                role="alert"
              >
                <p className="text-base font-bold text-red-200">
                  Check your inputs — no result to show yet
                </p>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-red-100">
                  {errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs leading-relaxed text-red-200/70">
                  Fix the inputs on the left and your estimated take-home pay
                  will appear here.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-beam-300">
                      Estimated take-home pay · {PAY_FREQUENCY_LABELS[frequency].toLowerCase()}
                    </p>
                    <p className="mt-2 text-4xl font-extrabold tracking-tight text-white tabular-nums sm:text-5xl">
                      {formatUSD(val(result.perPeriodNet, result.annualNet))}
                    </p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-slate-300">
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                        <CheckIcon className="h-4 w-4" />
                        You keep {donut ? donut.keepPct.toFixed(1) : "—"}% of your pay
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {formatUSD0(result.annualNet)} per year ·{" "}
                        {formatUSD0(result.annualGross)} gross
                      </span>
                    </p>
                  </div>
                  <div
                    className="flex rounded-full bg-white/10 p-1 text-xs font-bold"
                    role="tablist"
                    aria-label="Result view"
                  >
                    {(["period", "annual"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        role="tab"
                        aria-selected={view === v}
                        onClick={() => setView(v)}
                        className={`rounded-full px-3 py-1.5 transition ${
                          view === v
                            ? "bg-white text-navy-900 shadow-sm"
                            : "text-slate-300 hover:text-white"
                        }`}
                      >
                        {v === "period" ? "Per paycheck" : "Per year"}
                      </button>
                    ))}
                  </div>
                </div>

                {stateUnavailable && (
                  <div className="mt-4 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
                    <strong>State estimate coming soon.</strong> We are verifying the
                    official 2026 {state?.state} brackets with the state Department of
                    Revenue. The figures below show federal taxes only — your actual
                    take-home pay will be lower once state withholding is included.
                  </div>
                )}

                {/* Donut + legend */}
                {donut && (
                  <div className="mt-6 flex flex-col items-center gap-5 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 sm:flex-row sm:gap-6">
                    <div className="relative shrink-0">
                      <svg width="132" height="132" viewBox="0 0 132 132" role="img" aria-label="Where your gross pay goes">
                        <circle cx="66" cy="66" r={donut.r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="20" />
                        {donut.parts.map((p) => (
                          <circle
                            key={p.label}
                            cx="66"
                            cy="66"
                            r={donut.r}
                            fill="none"
                            stroke={p.color}
                            strokeWidth="20"
                            strokeDasharray={`${Math.max(p.len - 1.5, 0)} ${donut.c - p.len + 1.5}`}
                            strokeDashoffset={-p.offset}
                            transform="rotate(-90 66 66)"
                          />
                        ))}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-extrabold text-white tabular-nums">
                          {donut.keepPct.toFixed(0)}%
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                          you keep
                        </span>
                      </div>
                    </div>
                    <ul className="w-full space-y-2 text-sm">
                      {donut.parts.map((p) => (
                        <li key={p.label} className="flex items-center gap-2.5">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: p.color }}
                            aria-hidden="true"
                          />
                          <span className="text-slate-300">{p.label}</span>
                          <span className="ml-auto font-bold text-white tabular-nums">
                            {formatUSD0(isAnnual ? p.value : p.value / result.periodsPerYear)}
                          </span>
                          <span className="w-11 text-right text-xs text-slate-400 tabular-nums">
                            {((p.value / result.annualGross) * 100).toFixed(1)}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Breakdown — colour means something: green = you keep, red/amber = tax */}
                <div className="mt-5 overflow-hidden rounded-2xl bg-white/[0.06] ring-1 ring-white/10">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        <th className="px-4 py-2.5">Where your money goes</th>
                        <th className="w-14 px-2 py-2.5 text-right">% of pay</th>
                        <th className="px-4 py-2.5 text-right">
                          {isAnnual ? "Per year" : "Per paycheck"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <BreakdownRow key={r.key} row={r} />
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
                  {[
                    { label: "Federal / year", value: formatUSD0(result.annualFederal) },
                    {
                      label: "FICA / year",
                      value: formatUSD0(result.annualSocialSecurity + result.annualMedicare),
                    },
                    {
                      label: "Effective tax rate",
                      value: `${result.effectiveTotalTaxRatePct.toFixed(1)}%`,
                    },
                    { label: "Marginal bracket", value: `${result.marginalFederalRatePct}%` },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-white/[0.06] px-2 py-3 ring-1 ring-white/10">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        {s.label}
                      </p>
                      <p className="mt-1 text-base font-bold text-white tabular-nums">{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-navy-900 shadow-sm transition hover:bg-beam-100"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="h-4 w-4 text-emerald-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <CopyIcon className="h-4 w-4" />
                        Copy result
                      </>
                    )}
                  </button>
                  <p className="text-xs leading-relaxed text-slate-400">
                    Annual take-home{" "}
                    <span className="font-bold text-slate-200">
                      {formatUSD0(result.annualNet)}
                    </span>{" "}
                    · Effective total tax rate{" "}
                    <span className="font-bold text-slate-200">
                      {result.effectiveTotalTaxRatePct.toFixed(1)}%
                    </span>{" "}
                    · Estimate only — not tax advice. Federal figures: IRS Rev. Proc.
                    2025-32 / Pub 15-T (2026).
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
