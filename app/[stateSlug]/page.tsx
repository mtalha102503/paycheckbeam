import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PaycheckCalculator from "@/components/PaycheckCalculator";
import {
  ALL_STATE_SLUGS,
  STATE_TAX_DATA,
  getStateBySlug,
  stateBracketsForPage,
  type StateTaxInfo,
} from "@/lib/stateTaxData";
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
      <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
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
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pt-14">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
            {state.state} · 2026
          </p>
          <h1 className="mt-2 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            {state.state} Paycheck Calculator
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
            {state.summary}
          </p>

          {!state.verified && (
            <div className="mt-6 max-w-3xl rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
              <strong>2026 {state.state} tables being verified.</strong> The
              calculator below shows your federal withholding and take-home pay
              before state tax. We publish state numbers only after confirming
              them with the {state.state} Department of Revenue — no guessed
              brackets.
            </div>
          )}

          <div className="mt-8">
            <PaycheckCalculator defaultStateSlug={state.slug} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
          How {state.state} income tax works in 2026
        </h2>
        <ul className="mt-5 max-w-3xl space-y-3">
          {state.withholdingNotes.map((n) => (
            <li key={n} className="flex gap-3 text-slate-600">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
              <span className="leading-relaxed">{n}</span>
            </li>
          ))}
        </ul>

        {state.localTaxNote && (
          <div className="mt-6 max-w-3xl rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
            <strong className="text-slate-900">Local taxes: </strong>
            {state.localTaxNote}
          </div>
        )}

        {state.structure === "flat" && state.flatRatePct !== null && (
          <div className="mt-8 max-w-3xl">
            <h3 className="text-base font-bold text-slate-900">
              {state.state} 2026 rate at a glance
            </h3>
            <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
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
          <div className="mt-8 max-w-3xl rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm leading-relaxed text-slate-700">
            <strong className="text-slate-900">
              No state withholding in {state.state}.{" "}
            </strong>
            Your paycheck still has federal income tax, Social Security (6.2% up
            to $184,500 in 2026), and Medicare (1.45% plus 0.9% over $200,000)
            withheld — those are federal and apply in every state.
          </div>
        )}

        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-slate-500">
          Source note: {state.sourceNote}{" "}
          <a
            href={state.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Reference
          </a>
          . Figures are estimates for planning, not tax advice. Local
          (city/county) income taxes are not included in this estimate.
        </p>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
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
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-600 hover:text-blue-700"
                >
                  {s.state}
                </Link>
              );
            })}
            <Link
              href="/#states"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-600 hover:text-blue-700"
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
