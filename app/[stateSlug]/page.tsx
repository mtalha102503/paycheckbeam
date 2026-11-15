import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PaycheckCalculator from "@/components/PaycheckCalculator";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";
import {
  ALL_STATE_SLUGS,
  NYC_BRACKETS_2026,
  NYC_SCHOOL_TAX_CREDIT,
  NYC_SCHOOL_TAX_CREDIT_INCOME_LIMIT,
  STATE_INSURANCE_PROGRAMS,
  STATE_TAX_DATA,
  YONKERS_SURCHARGE_RATE,
  estimateStateWithholding,
  getStateBySlug,
  getStateDeductionRules,
  stateBracketsForPage,
  topRatePct,
  type StateBracket,
  type StateInsuranceProgram,
  type StateTaxInfo,
} from "@/lib/stateTaxData";
import { STATE_SOURCES } from "@/lib/stateSources";
import {
  EXEMPLAR_FAQS,
  EXEMPLAR_SOURCES,
  StateExemplarContent,
} from "@/components/StateExemplars";
import {
  GUIDE_FAQS,
  GUIDE_SOURCES,
  GuideContent,
} from "@/components/StateGuides";
import { formatUSD0 } from "@/lib/paycheckCalc";
import { SITE_URL } from "@/lib/site";

const usd = (n: number) => `$${n.toLocaleString()}`;

function BracketTable({
  title,
  brackets,
}: {
  title: string;
  brackets: StateBracket[];
}) {
  let prev = 0;
  return (
    <div className="mt-6 max-w-3xl">
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-4 py-2.5 font-semibold text-slate-700">Taxable income</th>
              <th className="px-4 py-2.5 text-right font-semibold text-slate-700">Rate</th>
            </tr>
          </thead>
          <tbody>
            {brackets.map((b) => {
              const label =
                b.upTo === null
                  ? `Over $${prev.toLocaleString()}`
                  : prev === 0
                    ? `$0 – $${b.upTo.toLocaleString()}`
                    : `$${prev.toLocaleString()} – $${b.upTo.toLocaleString()}`;
              prev = b.upTo ?? prev;
              return (
                <tr key={`${b.upTo}-${b.ratePct}`} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-2.5 text-slate-600">{label}</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                    {b.ratePct}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Key 2026 figures for a state with an income tax — every number from
 *  lib/stateTaxData.ts, nothing invented. */
function KeyFigures({ state }: { state: StateTaxInfo }) {
  const rows: { label: string; value: string }[] = [];
  if (state.structure === "flat") {
    rows.push({
      label: "Tax structure",
      value: `Flat — ${state.flatRatePct}% on all taxable income`,
    });
  } else if (state.structure === "graduated" && state.brackets) {
    rows.push({
      label: "Tax structure",
      value: `Graduated — ${state.brackets.length} brackets, ${state.brackets[0].ratePct}% to ${topRatePct(state)}%`,
    });
  }
  const sd = (v: number | null, credit: number | null) =>
    v === null
      ? "Not in the data behind this page"
      : v === 0
        ? credit !== null
          ? "None — a credit applies instead (see below)"
          : "None"
        : usd(v);
  rows.push({
    label: "Standard deduction (single)",
    value: sd(state.standardDeductionSingle, state.creditSingle),
  });
  rows.push({
    label: "Standard deduction (married filing jointly)",
    value: sd(state.standardDeductionMfj, state.creditMfj),
  });
  if (state.exemptionSingle !== null) {
    rows.push({
      label: "Personal exemption",
      value: `${usd(state.exemptionSingle)} single / ${state.exemptionMfj !== null ? usd(state.exemptionMfj) : "—"} joint`,
    });
  }
  if (state.creditSingle !== null) {
    rows.push({
      label: "Nonrefundable credit",
      value: `${usd(state.creditSingle)} single / ${state.creditMfj !== null ? usd(state.creditMfj) : "—"} joint — subtracted after the rate is applied`,
    });
  }
  return (
    <div className="mt-8 max-w-3xl">
      <h3 className="text-base font-bold text-slate-900">
        {state.state} 2026 at a glance
      </h3>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <caption className="sr-only">
            {state.state} 2026 key tax figures
          </caption>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.label} className={i < rows.length - 1 ? "border-b border-slate-100" : ""}>
                <td className="px-4 py-2.5 text-slate-600">{r.label}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
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

/** One-line comparison of this state's tax vs California's, on a $75,000
 *  single-filer salary — computed from the verified 2026 tables, never
 *  invented. */
function CaliforniaComparison({ state }: { state: StateTaxInfo }) {
  const noDeductions = { k401Annual: 0, sec125Annual: 0, hsaAnnual: 0 };
  const stateTax = estimateStateWithholding({
    stateSlug: state.slug,
    annualGross: 75000,
    filingStatus: "single",
    preTax: noDeductions,
    nyLocal: "none",
  }).state;
  const caTax = estimateStateWithholding({
    stateSlug: "california-paycheck-calculator",
    annualGross: 75000,
    filingStatus: "single",
    preTax: noDeductions,
    nyLocal: "none",
  }).state;
  if (stateTax === null || caTax === null) return null;

  let line: React.ReactNode;
  if (state.slug === "california-paycheck-calculator") {
    line = (
      <>
        On a $75,000 salary, California takes{" "}
        <strong className="text-white">{formatUSD0(caTax)}</strong> a year in
        state tax — Texas takes <strong className="text-white">$0</strong>.
      </>
    );
  } else if (stateTax === 0) {
    line = (
      <>
        On a $75,000 salary, you&apos;d pay{" "}
        <strong className="text-emerald-300">$0</strong> in state tax here —
        California takes <strong className="text-white">{formatUSD0(caTax)}</strong>.
        That&apos;s <strong className="text-emerald-300">{formatUSD0(caTax)}</strong>{" "}
        more in your pocket every year.
      </>
    );
  } else if (stateTax < caTax) {
    line = (
      <>
        On a $75,000 salary, you&apos;d pay{" "}
        <strong className="text-white">{formatUSD0(stateTax)}</strong> a year in
        state tax here vs <strong className="text-white">{formatUSD0(caTax)}</strong>{" "}
        in California —{" "}
        <strong className="text-emerald-300">{formatUSD0(caTax - stateTax)} less</strong>.
      </>
    );
  } else if (stateTax > caTax) {
    line = (
      <>
        On a $75,000 salary, you&apos;d pay{" "}
        <strong className="text-white">{formatUSD0(stateTax)}</strong> a year in
        state tax here vs <strong className="text-white">{formatUSD0(caTax)}</strong>{" "}
        in California —{" "}
        <strong className="text-amber-300">{formatUSD0(stateTax - caTax)} more</strong>.
      </>
    );
  } else {
    line = (
      <>
        On a $75,000 salary, you&apos;d pay{" "}
        <strong className="text-white">{formatUSD0(stateTax)}</strong> a year in
        state tax here — the same as California.
      </>
    );
  }

  return (
    <div className="mt-6 max-w-2xl rounded-2xl bg-white/10 px-4 py-3.5 text-sm leading-relaxed text-slate-200 ring-1 ring-white/15">
      {line}
      <span className="mt-1 block text-xs text-slate-400">
        Single filer, $75,000 salary, 2026 rates.
      </span>
    </div>
  );
}

function StateBadge({ state }: { state: StateTaxInfo }) {
  if (state.structure === "none") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3.5 py-1.5 text-xs font-extrabold text-emerald-300 ring-1 ring-emerald-400/40">
        <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
        0% state income tax
      </span>
    );
  }
  if (state.structure === "flat") {
    return (
      <span className="inline-flex items-center rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-extrabold text-white ring-1 ring-white/25">
        Flat {state.flatRatePct}% income tax
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-extrabold text-white ring-1 ring-white/25">
      Graduated · top {topRatePct(state)}%
    </span>
  );
}

/**
 * Per-state 401(k) / Section 125 / HSA treatment, from
 * getStateDeductionRules (lib/stateTaxData.ts). Only CA, PA and NJ deviate
 * from the federal treatment; every other state with an income tax follows
 * it. Wording for the three deviants follows the verified DOR notes in
 * STATE_DEDUCTION_RULES.
 */
function DeductionTreatment({ state }: { state: StateTaxInfo }) {
  if (state.structure === "none") {
    return (
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
        With no state income tax, 401(k), Section 125 and HSA contributions
        have no state tax to reduce in {state.state}. They still reduce your
        federal income tax.
      </p>
    );
  }
  const rules = getStateDeductionRules(state.slug);
  let text: string;
  if (state.slug === "california-paycheck-calculator") {
    text =
      "California follows the federal treatment for 401(k) and Section 125 items — both are excluded from California taxable wages. HSA contributions are the exception: California taxes them, so an HSA does not reduce your CA taxable income. Your 401(k) and HSA contributions still count toward CA SDI wages — see the SDI box below.";
  } else if (state.slug === "pennsylvania-paycheck-calculator") {
    text =
      "Pennsylvania taxes 401(k), 403(b) and 457(b) employee contributions — they do not reduce your PA taxable wages. Section 125 health premiums are excluded, and an HSA contributed through a payroll Section 125 plan is excluded. (Dependent-care FSAs are taxed — the calculator's FSA line is the health FSA.)";
  } else if (state.slug === "new-jersey-paycheck-calculator") {
    text =
      "New Jersey does not adopt IRC Section 125: Section 125 health premiums, FSAs and HSAs are taxed in New Jersey and do not reduce your NJ taxable wages. 401(k) contributions are excluded, following the federal treatment. (New Jersey taxes 403(b), 457, SEP, TSP and IRA contributions instead — the calculator does not model those.)";
  } else if (!rules.k401Excluded || !rules.sec125Excluded || !rules.hsaExcluded) {
    // Guard: if a new deviation is added to the data later, do not claim
    // the federal treatment. This branch is unreachable today.
    text = `The calculator applies ${state.state}'s own deduction rules — see the results breakdown for what each deduction does to your state tax.`;
  } else {
    text = `In ${state.state}, 401(k), Section 125 and HSA contributions are all excluded from state taxable wages — the same treatment as federal — so they lower your state tax as well as your federal income tax. Enter them in the calculator above and the state-tax line falls with them.`;
  }
  return (
    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">{text}</p>
  );
}

/** New York City + Yonkers detail, from NYC_BRACKETS_2026 and the NYC
 *  school-tax-credit / Yonkers-surcharge constants. Rendered only on the
 *  New York page. */
function NycDetail() {
  return (
    <div className="mt-8 max-w-3xl">
      <h3 className="text-base font-bold text-slate-900">
        New York City and Yonkers
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        New York City residents pay a separate city income tax on the same
        taxable income as the state tax — there is no separate NYC standard
        deduction. Yonkers residents pay a {Math.round(YONKERS_SURCHARGE_RATE * 10000) / 100}%
        surcharge on their net New York State tax instead. Commuters who live
        outside the city pay neither. Pick your local layer in the calculator
        above.
      </p>
      <BracketTable
        title="NYC 2026 brackets (single filer)"
        brackets={NYC_BRACKETS_2026.single}
      />
      <BracketTable
        title="NYC 2026 brackets (married filing jointly)"
        brackets={NYC_BRACKETS_2026.marriedFilingJointly}
      />
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Married filing separately uses the same NYC schedule as single filers.
        Head of household has its own thresholds: $14,400 at 3.078%, $30,000
        at 3.762%, $60,000 at 3.819%, then 3.876%.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        The NYC school tax credit subtracts $
        {NYC_SCHOOL_TAX_CREDIT.single} ($
        {NYC_SCHOOL_TAX_CREDIT.marriedFilingJointly} for married filing
        jointly) when income is $
        {NYC_SCHOOL_TAX_CREDIT_INCOME_LIMIT.toLocaleString()} or less. The
        separate NYC rate-reduction credit is not modeled.
      </p>
    </div>
  );
}

/**
 * State FAQ, generated ONLY from lib/stateTaxData.ts:
 * tax type / top rate, standard deduction, 401(k)-HSA treatment, a
 * computed $75,000 example, payroll programs, local tax. No invented
 * facts; a question is left out when the data behind it does not exist.
 */
function buildStateFaqs(state: StateTaxInfo): FaqItem[] {
  const faqs: FaqItem[] = [];

  if (state.structure === "none") {
    faqs.push({
      q: `Does ${state.state} have a state income tax?`,
      a: `No. ${state.state} has no state income tax on wages in 2026, so nothing is withheld for state income tax. Federal income tax, Social Security and Medicare still apply.`,
    });
  } else if (state.structure === "flat" && state.flatRatePct !== null) {
    faqs.push({
      q: `Does ${state.state} have a state income tax?`,
      a: `Yes. ${state.state} taxes income at a single flat rate of ${state.flatRatePct}% in 2026 — every dollar of taxable income is taxed at that rate, after the standard deduction.`,
    });
  } else if (state.structure === "graduated" && state.brackets) {
    faqs.push({
      q: `Does ${state.state} have a state income tax?`,
      a: `Yes. ${state.state} taxes income on a graduated scale in 2026, from ${state.brackets[0].ratePct}% up to a top rate of ${topRatePct(state)}%. Only the dollars inside each bracket are taxed at that bracket's rate.`,
    });
  }

  if (state.structure === "none") {
    faqs.push({
      q: `What is the standard deduction in ${state.state}?`,
      a: `There is no standard deduction, because there is no state income tax to deduct from.`,
    });
  } else if (
    state.standardDeductionSingle === 0 &&
    state.creditSingle !== null &&
    state.slug === "utah-paycheck-calculator"
  ) {
    faqs.push({
      q: `What is the standard deduction in ${state.state} in 2026?`,
      a: `Utah has no standard deduction as a dollar amount. Instead it gives a nonrefundable credit of ${usd(state.creditSingle)} for single filers (${state.creditMfj !== null ? usd(state.creditMfj) : "—"} joint) — 6% of the federal standard deduction — subtracted after the ${state.flatRatePct}% rate is applied.`,
    });
  } else if (state.standardDeductionSingle !== null) {
    let a = `The ${state.state} standard deduction in 2026 is ${usd(state.standardDeductionSingle)} for single filers and ${state.standardDeductionMfj !== null ? usd(state.standardDeductionMfj) : "—"} for married filing jointly.`;
    if (state.exemptionSingle !== null) {
      a += ` A further ${usd(state.exemptionSingle)} personal exemption also applies (single; ${state.exemptionMfj !== null ? usd(state.exemptionMfj) : "—"} joint).`;
    }
    if (state.creditSingle !== null) {
      a += ` A nonrefundable credit of ${usd(state.creditSingle)} (single; ${state.creditMfj !== null ? usd(state.creditMfj) : "—"} joint) is subtracted after the rate is applied.`;
    }
    faqs.push({
      q: `What is the standard deduction in ${state.state} in 2026?`,
      a,
    });
  } else if (state.standardDeductionSingle === 0) {
    faqs.push({
      q: `What is the standard deduction in ${state.state} in 2026?`,
      a: `${state.state} has no standard deduction or personal exemption — the ${state.flatRatePct !== null ? `${state.flatRatePct}% ` : ""}rate applies from the first dollar of taxable wages.`,
    });
  }

  if (state.structure === "none") {
    faqs.push({
      q: `Do 401(k) contributions matter for state tax in ${state.state}?`,
      a: `There is no state tax for them to reduce. 401(k) contributions still reduce your federal income tax.`,
    });
  } else if (state.slug === "california-paycheck-calculator") {
    faqs.push({
      q: `Do 401(k) and HSA contributions reduce my California tax?`,
      a: `401(k) contributions do — they are excluded from California taxable wages. HSA contributions do not: California taxes them, so an HSA does not reduce your CA taxable income. Section 125 items are excluded.`,
    });
  } else if (state.slug === "pennsylvania-paycheck-calculator") {
    faqs.push({
      q: `Do 401(k) contributions reduce my Pennsylvania tax?`,
      a: `No. Pennsylvania taxes 401(k), 403(b) and 457(b) employee contributions, so they do not reduce your PA taxable wages. Section 125 health premiums are excluded, and an HSA contributed through a payroll Section 125 plan is excluded.`,
    });
  } else if (state.slug === "new-jersey-paycheck-calculator") {
    faqs.push({
      q: `Do 401(k) and HSA contributions reduce my New Jersey tax?`,
      a: `401(k) contributions do — they are excluded from New Jersey taxable wages. Section 125 items (health premiums, FSAs) and HSAs do not: New Jersey taxes them.`,
    });
  } else {
    faqs.push({
      q: `Do 401(k) contributions reduce my ${state.state} tax?`,
      a: `Yes. In ${state.state}, 401(k), Section 125 and HSA contributions are all excluded from state taxable wages — the same treatment as federal — so they lower your state tax as well as your federal income tax.`,
    });
  }

  const example = estimateStateWithholding({
    stateSlug: state.slug,
    annualGross: 75000,
    filingStatus: "single",
    preTax: { k401Annual: 0, sec125Annual: 0, hsaAnnual: 0 },
    nyLocal: "none",
  }).state;
  if (example !== null) {
    faqs.push({
      q: `How much ${state.state} tax would I pay on a $75,000 salary?`,
      a:
        state.structure === "none"
          ? `$0 — ${state.state} has no state income tax.`
          : `About ${formatUSD0(example)} a year in state tax, as a single filer with no pre-tax deductions at 2026 rates. That is an estimate: your employer's withholding tables and any credits or phaseouts can move it by a few dollars.${state.slug === "new-york-paycheck-calculator" ? " (Before any New York City or Yonkers local tax.)" : ""}`,
    });
  }

  const programs: StateInsuranceProgram[] =
    STATE_INSURANCE_PROGRAMS[state.slug] ?? [];
  if (programs.length > 0) {
    const capText = (p: StateInsuranceProgram) => {
      if (p.weeklyCap !== null) return `max $${p.weeklyCap.toFixed(2)}/week`;
      if (p.contributionCap !== null)
        return `max $${p.contributionCap.toLocaleString()}/year`;
      if (p.wageCap !== null)
        return `on wages up to $${p.wageCap.toLocaleString()}`;
      return "no wage ceiling";
    };
    faqs.push({
      q: `What other state deductions come out of my paycheck in ${state.state}?`,
      a: `These mandatory payroll-insurance programs are separate from income tax: ${programs.map((p) => `${p.label} — ${p.ratePct}% (${capText(p)})`).join("; ")}. The calculator shows each one as its own line.`,
    });
  }

  if (state.localTaxNote) {
    faqs.push({
      q: `Do I pay local income tax in ${state.state}?`,
      a: state.localTaxNote,
    });
  }

  return faqs;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_STATE_SLUGS.map((stateSlug) => ({ stateSlug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stateSlug: string }>;
}): Promise<Metadata> {
  const { stateSlug } = await params;
  const state = getStateBySlug(stateSlug);
  if (!state) return {};
  const title = `${state.state} Paycheck Calculator — Take-Home Pay in ${state.state} (2026)`;
  const description =
    state.structure === "none"
      ? `Free ${state.state} paycheck calculator for 2026. ${state.state} has no state income tax — see your take-home pay after federal, Social Security, and Medicare.`
      : state.structure === "flat" && state.flatRatePct !== null
        ? `Free ${state.state} paycheck calculator for 2026. ${state.state} taxes income at a flat ${state.flatRatePct}% — see your take-home pay after federal, FICA, and state tax.`
        : `Free ${state.state} paycheck calculator for 2026. See your take-home pay after federal, Social Security, Medicare, and ${state.state} state tax.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/${state.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${state.slug}`,
      type: "website",
    },
  };
}

const POPULAR = [
  "texas-paycheck-calculator",
  "california-paycheck-calculator",
  "florida-paycheck-calculator",
  "new-york-paycheck-calculator",
  "illinois-paycheck-calculator",
  "ohio-paycheck-calculator",
];

export default async function StatePage({
  params,
}: {
  params: Promise<{ stateSlug: string }>;
}) {
  const { stateSlug } = await params;
  const state = getStateBySlug(stateSlug);
  if (!state) notFound();

  const others = STATE_TAX_DATA.filter((s) => s.slug !== state.slug);
  // Exemplar states (CA / TX / NY) use their researched FAQ set; the
  // other 48 states use their batch guide FAQ set; anything else keeps
  // the generated FAQs from the data tables.
  const faqs =
    (EXEMPLAR_FAQS as Record<string, FaqItem[]>)[state.slug] ??
    (GUIDE_FAQS as Record<string, FaqItem[]>)[state.slug] ??
    buildStateFaqs(state);
  const exemplarSources =
    (EXEMPLAR_SOURCES as Record<string, { label: string; url: string }[]>)[
      state.slug
    ] ?? null;
  const guideSources =
    (GUIDE_SOURCES as Record<string, { label: string; url: string }[]>)[
      state.slug
    ] ?? null;
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const programs: StateInsuranceProgram[] =
    STATE_INSURANCE_PROGRAMS[state.slug] ?? [];
  const isNy = state.slug === "new-york-paycheck-calculator";
  const singleBrackets = stateBracketsForPage(state);
  const mfjBrackets = state.bracketsMfj;
  const mfjSame =
    singleBrackets !== null &&
    mfjBrackets !== null &&
    JSON.stringify(singleBrackets) === JSON.stringify(mfjBrackets);
  const mfjWider =
    singleBrackets !== null &&
    mfjBrackets !== null &&
    !mfjSame &&
    singleBrackets.every(
      (b, i) =>
        b.upTo === null ||
        mfjBrackets[i]?.upTo === null ||
        (mfjBrackets[i]?.upTo ?? 0) >= b.upTo,
    );
  const dorSource = STATE_SOURCES[state.slug];

  return (
    <div>
      {/* State hero — navy, giant abbreviation watermark, rate badge */}
      <section className="bg-hero-navy relative overflow-hidden">
        <div className="bg-hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="bg-hero-dots pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <span
          className="pointer-events-none absolute -bottom-6 right-0 select-none text-[8rem] font-extrabold leading-none tracking-tighter text-white/[0.07] sm:-bottom-10 sm:text-[13rem]"
          aria-hidden="true"
        >
          {state.abbreviation}
        </span>
        <div className="relative mx-auto max-w-6xl px-4 pb-28 pt-12 sm:px-6 sm:pt-16">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-beam-300">
            {state.state} · 2026
          </p>
          <div className="mt-4">
            <StateBadge state={state} />
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl">
            {state.state} Paycheck Calculator
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">
            {state.summary}
          </p>
          <CaliforniaComparison state={state} />

          {!state.verified && (
            <div className="mt-6 max-w-3xl rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm leading-relaxed text-amber-200">
              <strong>2026 {state.state} tables being verified.</strong> The
              calculator below shows your federal withholding and take-home pay
              before state tax. We publish state numbers only after confirming
              them with the {state.state} Department of Revenue — no guessed
              brackets.
            </div>
          )}
        </div>
      </section>

      {/* Calculator overlapping the hero */}
      <div id="calculator" className="relative z-10 mx-auto -mt-20 max-w-6xl scroll-mt-24 px-4 sm:px-6">
        <PaycheckCalculator defaultStateSlug={state.slug} />
      </div>

      {/* 1 — How the state tax works */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">
          How it works
        </p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          How {state.state} income tax works in 2026
        </h2>

        {state.structure === "none" && (
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600">
            {state.state} has no state income tax on wages in 2026. There are
            no state brackets, no state standard deduction and no state
            withholding line on your paycheck.
          </p>
        )}
        {state.structure === "flat" && state.flatRatePct !== null && (
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600">
            {state.state} taxes income at a single flat rate of{" "}
            {state.flatRatePct}% in 2026. Every dollar of taxable income is
            taxed at that same rate — there are no brackets to climb and no
            marginal-rate surprises as your pay rises.
          </p>
        )}
        {state.structure === "graduated" && state.brackets && (
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600">
            {state.state} taxes income on a graduated scale in 2026:{" "}
            {state.brackets.length} brackets, from {state.brackets[0].ratePct}%
            on the first dollars of taxable income up to a top rate of{" "}
            {topRatePct(state)}%. Only the dollars inside each bracket are
            taxed at that bracket&apos;s rate, so your marginal rate — the
            rate on your last dollar — is not the same as your average rate.
          </p>
        )}
        {state.structure !== "none" && (
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
            Taxable income is your gross pay minus the pre-tax deductions{" "}
            {state.state} excludes, minus the standard deduction (and any
            personal exemption shown below). The calculator estimates your
            annual state liability from that figure and spreads it across
            your pay periods. Your employer&apos;s withholding tables can
            differ by a few dollars — the state figures here are
            annual-liability brackets, not the state&apos;s official
            withholding formula — and the final amount is settled when you
            file your state return.
          </p>
        )}

        <ul className="mt-6 max-w-3xl space-y-3">
          {state.withholdingNotes.map((n) => (
            <li key={n} className="flex gap-3 text-slate-600">
              <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <span className="leading-relaxed">{n}</span>
            </li>
          ))}
        </ul>

        {state.structure !== "none" && <KeyFigures state={state} />}

        {state.structure === "graduated" && singleBrackets && (
          <>
            <BracketTable
              title={`${state.state} 2026 brackets (single filer)`}
              brackets={singleBrackets}
            />
            {mfjBrackets && (
              <>
                <BracketTable
                  title={`${state.state} 2026 brackets (married filing jointly)`}
                  brackets={mfjBrackets}
                />
                <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-500">
                  Brackets apply to taxable income — after the standard
                  deduction. Only the dollars inside each bracket are taxed at
                  that bracket&apos;s rate.{" "}
                  {mfjSame
                    ? `Married filing jointly uses the same bracket thresholds as single filers in ${state.state}.`
                    : mfjWider
                      ? "Married filing jointly uses wider brackets — the same rates, higher thresholds."
                      : "Married filing jointly uses its own bracket thresholds, shown above."}
                </p>
              </>
            )}
          </>
        )}

        {state.structure !== "none" && (
          <p className="mt-6 max-w-3xl text-xs leading-relaxed text-slate-500">
            Married filing separately and head of household: the calculator
            applies the state&apos;s single-filer schedule for these statuses.
            The data behind this page carries single and joint tables only, so
            no separate married-filing-separately or head-of-household
            brackets are shown here.
          </p>
        )}

        {state.structure === "none" && (
          <div className="mt-8 max-w-3xl rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-relaxed text-slate-700">
            <strong className="text-emerald-900">
              No state withholding in {state.state}.{" "}
            </strong>
            Your paycheck still has federal income tax, Social Security (6.2% up
            to $184,500 in 2026), and Medicare (1.45% plus 0.9% over $200,000)
            withheld — those are federal and apply in every state.
          </div>
        )}
      </section>

      {/* 2 — What affects your paycheck */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">
          Deductions &amp; local tax
        </p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          What affects your {state.state} paycheck
        </h2>

        <h3 className="mt-6 max-w-3xl text-base font-bold text-slate-900">
          401(k), Section 125 and HSA
        </h3>
        <DeductionTreatment state={state} />

        {/* State payroll-insurance programs — separate from income tax */}
        {programs.length > 0 && (
          <div className="mt-10 max-w-3xl">
            <h3 className="text-base font-bold text-slate-900">
              State payroll programs in {state.state} (2026)
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              These are mandatory employee payroll deductions, separate from
              state income tax — the calculator shows each one as its own
              line in your results.
            </p>
            <ul className="mt-4 space-y-3">
              {programs.map((p) => {
                const capText =
                  p.weeklyCap !== null
                    ? `max $${p.weeklyCap.toFixed(2)}/week`
                    : p.contributionCap !== null
                      ? `max $${p.contributionCap.toLocaleString()}/year`
                      : p.wageCap !== null
                        ? `on wages up to $${p.wageCap.toLocaleString()}`
                        : "no wage ceiling";
                return (
                  <li
                    key={p.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <p className="text-sm font-bold text-slate-900">
                      {p.label} — {p.ratePct}%{" "}
                      <span className="font-semibold text-slate-500">
                        ({capText})
                      </span>
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      {p.sourceNote}
                      {p.note ? ` ${p.note}` : ""}
                    </p>
                    {p.sourceUrl && (
                      <a
                        href={p.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs font-bold text-blue-600 hover:underline"
                      >
                        Official source ↗
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {programs.length === 0 && state.structure === "none" && (
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-slate-600">
            The data behind this page lists no mandatory state
            payroll-insurance program for {state.state}.
          </p>
        )}

        {state.localTaxNote && (
          <div className="mt-10 max-w-3xl">
            <h3 className="text-base font-bold text-slate-900">Local taxes</h3>
            <div className="mt-3 rounded-2xl border border-slate-200 bg-mist-50 px-4 py-3.5 text-sm leading-relaxed text-slate-600">
              <strong className="text-slate-900">Local taxes: </strong>
              {state.localTaxNote}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Local (city/county) income taxes are not included in this
              estimate, except for New York City and Yonkers where noted.
            </p>
          </div>
        )}

        {isNy && <NycDetail />}
      </section>

      {/* Exemplar deep content — California, Texas and New York only.
          The other 48 state pages render nothing here. */}
      <StateExemplarContent slug={state.slug} />

      {/* State-guide deep content — the other 48 states. The three
          exemplar pages render nothing here. */}
      <GuideContent slug={state.slug} />

      {/* 3 — How to calculate */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">
          Step by step
        </p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          How to calculate your {state.state} paycheck
        </h2>
        <ol className="mt-6 max-w-3xl space-y-4">
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-extrabold text-white">1</span>
            <p className="pt-1 text-sm leading-relaxed text-slate-600">
              <strong className="text-slate-900">Enter your pay in the calculator above</strong> —
              an annual salary, or an hourly rate with your hours per week.
            </p>
          </li>
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-extrabold text-white">2</span>
            <p className="pt-1 text-sm leading-relaxed text-slate-600">
              <strong className="text-slate-900">Pick your pay frequency and filing status.</strong>{" "}
              Pay frequency runs from daily to annually; filing status is
              single, married filing jointly, married filing separately or head
              of household.
            </p>
          </li>
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-extrabold text-white">3</span>
            <p className="pt-1 text-sm leading-relaxed text-slate-600">
              <strong className="text-slate-900">Add your pre-tax deductions and overtime.</strong>{" "}
              401(k), medical, dental and vision premiums, FSA, HSA, commuter
              plan and more — plus overtime hours if you work them. The
              calculator applies {state.state}&apos;s own rules for which of
              these reduce your state tax.
            </p>
          </li>
          {isNy && (
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-extrabold text-white">4</span>
              <p className="pt-1 text-sm leading-relaxed text-slate-600">
                <strong className="text-slate-900">Pick your local layer if you live in New York City or Yonkers.</strong>{" "}
                The calculator adds the NYC tax or the Yonkers surcharge to
                your estimate.
              </p>
            </li>
          )}
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-extrabold text-white">{isNy ? 5 : 4}</span>
            <p className="pt-1 text-sm leading-relaxed text-slate-600">
              <strong className="text-slate-900">Read the breakdown.</strong>{" "}
              Federal tax, Social Security, Medicare, {state.state} state tax,
              state insurance programs and your pre-tax deductions, each on its
              own line, with per-period and annual amounts. Your estimated
              take-home pay is the bottom line — change a deduction or your
              filing status and watch it move, then check it against your pay
              stub.
            </p>
          </li>
        </ol>
      </section>

      {/* 4 — FAQ + JSON-LD */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">
          Questions
        </p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {state.state} paycheck FAQs
        </h2>
        <div className="mt-6 max-w-3xl">
          <FaqAccordion faqs={faqs} />
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </section>

      {/* 5 — Sources & methodology */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">
            Sources &amp; methodology
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {state.sourceNote}
          </p>
          {exemplarSources && (
            <ul className="mt-4 space-y-2">
              {exemplarSources.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-blue-600 hover:underline"
                  >
                    {s.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          )}
          {guideSources && (
            <ul className="mt-4 space-y-2">
              {guideSources.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-blue-600 hover:underline"
                  >
                    {s.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={state.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              View source ↗
            </a>
            {dorSource && (
              <a
                href={dorSource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full px-4 py-2 text-sm font-bold text-blue-700 ring-1 ring-blue-600/40 transition hover:bg-blue-50"
              >
                {dorSource.agency} ↗
              </a>
            )}
            <Link
              href="/about"
              className="rounded-full px-4 py-2 text-sm font-bold text-blue-700 ring-1 ring-blue-600/40 transition hover:bg-blue-50"
            >
              Full methodology →
            </Link>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            State figures are annual-liability brackets and deductions, not
            the state&apos;s official withholding formula — a real pay stub can
            differ by a few dollars. Figures are estimates for planning, not
            tax advice. Local (city/county) income taxes are not included in
            this estimate, except for New York City and Yonkers.
          </p>
        </div>
      </section>

      <section className="bg-mist-50">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <h2 className="text-lg font-bold text-slate-900">
            Other state paycheck calculators
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {POPULAR.filter((s) => s !== state.slug).map((slug) => {
              const s = getStateBySlug(slug);
              if (!s) return null;
              return (
                <Link
                  key={slug}
                  href={`/${slug}`}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-600 hover:text-blue-700"
                >
                  {s.state}
                </Link>
              );
            })}
            <Link
              href="/#states"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-600 hover:text-blue-700"
            >
              All 50 states →
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            {others.length} states and DC covered ·{" "}
            <Link href="/" className="font-semibold text-blue-600 hover:underline">
              Back to the main calculator
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
