import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PaycheckCalculator from "@/components/PaycheckCalculator";
import {
  ALL_STATE_SLUGS,
  STATE_INSURANCE_PROGRAMS,
  STATE_TAX_DATA,
  estimateStateWithholding,
  getStateBySlug,
  stateBracketsForPage,
  topRatePct,
  type StateInsuranceProgram,
  type StateTaxInfo,
} from "@/lib/stateTaxData";
import { formatUSD0 } from "@/lib/paycheckCalc";
import { SITE_URL } from "@/lib/site";

function StateBracketTable({ state }: { state: StateTaxInfo }) {
  const brackets = stateBracketsForPage(state);
  if (!brackets) return null;
  let prev = 0;
  return (
    <div className="mt-8 max-w-3xl">
      <h3 className="text-base font-bold text-slate-900">
        {state.state} 2026 brackets (single filer)
      </h3>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <caption className="sr-only">
            {state.state} 2026 income tax brackets
          </caption>
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
      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        Brackets apply to taxable income — after the standard deduction. Only
        the dollars inside each bracket are taxed at that bracket&apos;s rate.
        {state.bracketsMfj &&
          " Married filing jointly uses wider brackets — the calculator above applies the joint schedule when you pick that filing status."}
      </p>
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

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">
          How it works
        </p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          How {state.state} income tax works in 2026
        </h2>
        <ul className="mt-6 max-w-3xl space-y-3">
          {state.withholdingNotes.map((n) => (
            <li key={n} className="flex gap-3 text-slate-600">
              <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <span className="leading-relaxed">{n}</span>
            </li>
          ))}
        </ul>

        {state.localTaxNote && (
          <div className="mt-6 max-w-3xl rounded-2xl border border-slate-200 bg-mist-50 px-4 py-3.5 text-sm leading-relaxed text-slate-600">
            <strong className="text-slate-900">Local taxes: </strong>
            {state.localTaxNote}
          </div>
        )}

        {state.structure === "flat" && state.flatRatePct !== null && (
          <div className="mt-8 max-w-3xl">
            <h3 className="text-base font-bold text-slate-900">
              {state.state} 2026 rate at a glance
            </h3>
            <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <caption className="sr-only">
                  {state.state} 2026 income tax rate
                </caption>
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    <th className="px-4 py-2.5 font-semibold text-slate-700">Item</th>
                    <th className="px-4 py-2.5 text-right font-semibold text-slate-700">2026</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-2.5 text-slate-600">Tax structure</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                      Flat rate
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-2.5 text-slate-600">Rate</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                      {state.flatRatePct}%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-slate-600">
                      Single standard deduction / exemption
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                      {state.standardDeductionSingle === null
                        ? "Verifying"
                        : state.standardDeductionSingle === 0
                          ? "None"
                          : `$${state.standardDeductionSingle.toLocaleString()}`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {state.structure === "graduated" && <StateBracketTable state={state} />}

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

        {/* State payroll-insurance programs — separate from income tax */}
        {(() => {
          const programs: StateInsuranceProgram[] =
            STATE_INSURANCE_PROGRAMS[state.slug] ?? [];
          if (programs.length === 0) return null;
          const capText = (p: StateInsuranceProgram) => {
            if (p.weeklyCap !== null) return `max $${p.weeklyCap.toFixed(2)}/week`;
            if (p.contributionCap !== null)
              return `max $${p.contributionCap.toLocaleString()}/year`;
            if (p.wageCap !== null)
              return `on wages up to $${p.wageCap.toLocaleString()}`;
            return "no wage ceiling";
          };
          return (
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
                {programs.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <p className="text-sm font-bold text-slate-900">
                      {p.label} — {p.ratePct}%{" "}
                      <span className="font-semibold text-slate-500">
                        ({capText(p)})
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
                ))}
              </ul>
            </div>
          );
        })()}

        {/* Citation card — sources, not small grey text */}
        <div className="mt-10 max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">
            Sources &amp; methodology
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {state.sourceNote}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={state.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              View source ↗
            </a>
            <Link
              href="/about"
              className="rounded-full px-4 py-2 text-sm font-bold text-blue-700 ring-1 ring-blue-600/40 transition hover:bg-blue-50"
            >
              Full methodology →
            </Link>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Figures are estimates for planning, not tax advice. Local
            (city/county) income taxes are not included in this estimate.
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
