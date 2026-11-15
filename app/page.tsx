import Link from "next/link";
import PaycheckCalculator from "@/components/PaycheckCalculator";
import { STATE_TAX_DATA, VERIFIED_STATE_COUNT, TODO_STATE_COUNT, topRatePct } from "@/lib/stateTaxData";
import {
  FEDERAL_BRACKETS_2026,
  STANDARD_DEDUCTION_2026,
} from "@/lib/paycheckCalc";

function BracketTable({
  status,
  title,
}: {
  status: "single" | "marriedFilingJointly";
  title: string;
}) {
  const brackets = FEDERAL_BRACKETS_2026[status];
  let prev = 0;
  return (
    <div>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <caption className="sr-only">
            2026 federal income tax brackets, {title}
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
                <tr key={b.ratePct} className="border-b border-slate-100 last:border-b-0">
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

const FAQS = [
  {
    q: "How accurate is this paycheck calculator?",
    a: "Federal withholding follows the IRS Publication 15-T (2026) percentage method with a standard W-4, and reproduces the IRS examples exactly. State withholding uses verified 2026 state rates where available. Your real paycheck can still differ by a few dollars because of your full W-4 elections, employer payroll timing, and local taxes — treat the result as a planning estimate, not a pay stub.",
  },
  {
    q: "Does 401(k) lower my Social Security and Medicare tax?",
    a: "No. Traditional 401(k) contributions lower your federal (and usually state) income tax, but they are still subject to Social Security and Medicare taxes. Health-insurance premiums paid through a cafeteria (Section 125) plan lower both income tax and FICA — and this calculator models that difference.",
  },
  {
    q: "Why is my state estimate missing for some states?",
    a: "It isn't — every state and DC now has a verified 2026 estimate, built from the Tax Foundation's 2026 tables and cross-checked against a second source. The estimate is based on annual-liability brackets rather than your employer's exact withholding table, and it excludes local (city/county) taxes, so your real paycheck can still differ by a few dollars.",
  },
  {
    q: "Which states have no income tax?",
    a: "Nine states tax no wage income in 2026: Alaska, Florida, Nevada, New Hampshire, South Dakota, Tennessee, Texas, Washington, and Wyoming. If you work in one of them, your state withholding line is $0.",
  },
  {
    q: "Is my salary data stored anywhere?",
    a: "No. The calculator runs entirely in your browser. Nothing you type is sent to a server, stored, or shared. See the privacy policy for details.",
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pt-14">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
            2026 · IRS Pub 15-T tables
          </p>
          <h1 className="mt-2 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Paycheck Calculator: see your real take-home pay
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
            Enter your pay and state. We apply the official 2026 federal
            withholding tables, Social Security, Medicare, and your state&apos;s
            income tax — and show exactly what lands in your bank account, per
            paycheck and per year.
          </p>
          <div className="mt-8">
            <PaycheckCalculator />
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Free · No sign-up · Nothing you type leaves your browser ·{" "}
            {TODO_STATE_COUNT > 0
              ? `${VERIFIED_STATE_COUNT} states with verified 2026 rates, ${TODO_STATE_COUNT} more being verified against official sources.`
              : `All ${VERIFIED_STATE_COUNT} states + DC with verified 2026 rates.`}
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
          How your paycheck is calculated
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              n: "1",
              t: "Annualize your pay",
              d: "Your per-period wage is multiplied out to a full year — weekly × 52, biweekly × 26, twice a month × 24, monthly × 12.",
            },
            {
              n: "2",
              t: "Subtract what isn't taxed",
              d: "Pre-tax 401(k) and health-insurance premiums come off first, then the 2026 standard deduction ($16,100 single, $32,200 married filing jointly, $24,150 head of household).",
            },
            {
              n: "3",
              t: "Apply the 2026 brackets",
              d: "The remainder runs through the graduated federal brackets (10%–37%), Social Security at 6.2% up to $184,500, Medicare at 1.45% plus 0.9% over $200,000, and your state tax — then back down to one paycheck.",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {s.n}
              </span>
              <h3 className="mt-3 text-base font-bold text-slate-900">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Federal brackets */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            2026 federal tax brackets
          </h2>
          <p className="mt-2 max-w-3xl text-slate-600">
            These are the official 2026 brackets from IRS Revenue Procedure
            2025-32. They apply to <em>taxable</em> income — what is left after
            the standard deduction — not to your gross salary. Only the dollars
            inside each bracket are taxed at that bracket&apos;s rate.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <BracketTable status="single" title="Single" />
            <BracketTable status="marriedFilingJointly" title="Married filing jointly" />
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Standard deduction 2026: single ${STANDARD_DEDUCTION_2026.single.toLocaleString()} ·{" "}
            married filing jointly $
            {STANDARD_DEDUCTION_2026.marriedFilingJointly.toLocaleString()} · head of
            household ${STANDARD_DEDUCTION_2026.headOfHousehold.toLocaleString()}.
            Source: IRS Rev. Proc. 2025-32.
          </p>
        </div>
      </section>

      {/* State directory */}
      <section id="states" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Paycheck calculator by state
        </h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          State income tax is the biggest reason two identical salaries take home
          different pay. Pick your state for its 2026 rate, withholding notes,
          and a calculator set to that state.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {STATE_TAX_DATA.map((s) => (
            <Link
              key={s.slug}
              href={`/${s.slug}`}
              className="group rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-blue-600 hover:shadow"
            >
              <span className="block text-sm font-bold text-slate-900 group-hover:text-blue-700">
                {s.state}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {s.structure === "none"
                  ? "No income tax"
                  : s.structure === "flat" && s.flatRatePct !== null
                    ? `Flat ${s.flatRatePct}%`
                    : s.structure === "flat"
                      ? "Flat rate — verifying"
                      : `Graduated · top ${topRatePct(s)}%`}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Frequently asked questions
          </h2>
          <div className="mt-6 space-y-4">
            {FAQS.map((f) => (
              <div
                key={f.q}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-base font-bold text-slate-900">{f.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
