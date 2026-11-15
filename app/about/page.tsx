import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About PaycheckBeam — Methodology & Sources",
  description:
    "How PaycheckBeam calculates take-home pay: the 2026 IRS Publication 15-T percentage method, verified state rates, and what we refuse to guess.",
};

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        About PaycheckBeam
      </h1>
      <p className="mt-4 leading-relaxed text-slate-600">
        PaycheckBeam is a free paycheck calculator. Type in your pay, pick your
        state, and see your take-home pay — per paycheck and per year — after
        federal income tax, Social Security, Medicare, and state income tax.
      </p>

      <h2 className="mt-10 text-2xl font-bold text-slate-900">Methodology</h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        Federal withholding follows the IRS Publication 15-T (2026) percentage
        method with a standard Form W-4:
      </p>
      <ol className="mt-3 list-decimal space-y-2 pl-6 leading-relaxed text-slate-600">
        <li>Your pay is annualized (daily × 260 working days, weekly × 52, biweekly × 26, twice a month × 24, monthly × 12, quarterly × 4, twice a year × 2, annually × 1). Overtime hours are added at your multiplier — 1.5× by default.</li>
        <li>Pre-tax deductions come off: traditional 401(k), Section 125 health-insurance premiums, and the other pre-tax items in the deductions panel (dental, vision, FSA, HSA, commuter, disability, life). Each state applies its own rule for which of these count against state tax — Pennsylvania taxes 401(k) contributions, New Jersey taxes Section 125 items and HSAs (but not 401(k)), California taxes HSAs; most states follow the federal treatment.</li>
        <li>The 2026 standard deduction is subtracted — $16,100 single, $32,200 married filing jointly, $24,150 head of household (IRS Rev. Proc. 2025-32).</li>
        <li>The remainder runs through the 2026 graduated brackets (10% to 37%), then the annual tax is divided back by the number of pay periods.</li>
      </ol>
      <p className="mt-3 leading-relaxed text-slate-600">
        Social Security is 6.2% of wages up to the 2026 wage base of $184,500.
        Medicare is 1.45% of all wages plus 0.9% additional withholding on wages
        over $200,000 — the withholding threshold is $200,000 for every filing
        status. (The $250,000 married-filing-jointly figure you may see elsewhere
        is the threshold for the additional tax itself on your tax return, not
        for withholding.) One detail most calculators get wrong: 401(k)
        contributions lower income tax but <strong>not</strong>{" "}
        Social Security or Medicare, while cafeteria-plan health premiums lower
        both — and this calculator models that difference.
      </p>
      <p className="mt-3 leading-relaxed text-slate-600">
        State payroll-insurance programs — California SDI (1.3% in 2026, no wage
        ceiling), New York Paid Family Leave and Disability Benefits, New Jersey
        TDI and Family Leave Insurance, Washington PFML and WA Cares, and the
        paid-leave programs in Massachusetts, Connecticut, Oregon, Colorado,
        Rhode Island, Hawaii and Minnesota — are deducted as their own lines,
        each at its verified 2026 rate and cap. New York City residents can add
        city tax (3.078%–3.876%) and Yonkers residents a 16.75% surcharge on
        state tax, from the picker in the calculator.
      </p>

      <h2 className="mt-10 text-2xl font-bold text-slate-900">
        Verification status — read this before trusting a number
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        Federal figures are verified against IRS publications (Rev. Proc.
        2025-32, Pub 15-T, SSA wage-base table). State income-tax rates are
        verified against the Tax Foundation&apos;s published 2026 tables,
        cross-checked against a second source, on 15 November 2026. State
        payroll-insurance rates are verified against each program&apos;s official
        state source (linked from every state page). What is{" "}
        <strong>still in progress</strong>: direct confirmation of each
        state&apos;s figures with that state&apos;s Department of Revenue,
        starting with the highest-traffic states (Texas, California, Florida,
        New York, Pennsylvania, Illinois, Ohio, Georgia, New Jersey, North
        Carolina). Until that check is done for a state, its figures rest on
        the published tables above — not on a DOR confirmation — and every
        state page says so with its source and date.
      </p>

      <h2 className="mt-10 text-2xl font-bold text-slate-900">
        What we refuse to guess
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        State tax tables are only published here after verification against a
        published 2026 source — the Tax Foundation&apos;s 2026 tables,
        cross-checked against a second source. All 50 states plus DC are live
        with 2026 rates. Two honest caveats: California&apos;s bracket widths
        are the 2025 inflation-adjusted amounts (the 2026 FTB adjustment was
        not yet published), and direct verification against each state&apos;s
        Department of Revenue is still in progress for the highest-traffic
        states. A wrong state estimate is worse than no state estimate, so
        every figure on this site is labeled with its source.
      </p>

      <h2 className="mt-10 text-2xl font-bold text-slate-900">Sources</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed text-slate-600">
        <li>IRS Publication 15-T (2026), Federal Income Tax Withholding Methods.</li>
        <li>IRS Revenue Procedure 2025-32 — 2026 tax brackets and standard deductions (IR-2025-103).</li>
        <li>Social Security Administration — 2026 wage base ($184,500), Contribution and Benefit Base table.</li>
        <li>IRS Topic No. 560 / Publication 15 — additional Medicare tax withholding at $200,000 for all filing statuses.</li>
        <li>Tax Foundation — 2026 state individual income tax rates and brackets.</li>
        <li>California EDD — 2026 SDI rate (1.3%, no wage ceiling).</li>
        <li>NY State Tax Department, Form IT-2105-I (2026) — NYC tax rates and the Yonkers 16.75% surcharge.</li>
        <li>State paid-leave and disability program agencies (NY, NJ, WA, MA, CT, OR, CO, RI, HI, MN) — linked from each state page.</li>
        <li>Each state&apos;s Department of Revenue (linked from every state page; direct per-state verification in progress for the highest-traffic states).</li>
      </ul>

      <h2 className="mt-10 text-2xl font-bold text-slate-900">Not tax advice</h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        PaycheckBeam gives planning estimates. Your actual paycheck depends on
        your full W-4, state withholding certificate, employer payroll setup,
        and local taxes. For decisions that matter, check with a qualified tax
        professional or your payroll department.
      </p>

      <p className="mt-10">
        <Link href="/" className="font-semibold text-blue-600 hover:underline">
          ← Back to the calculator
        </Link>
      </p>
    </div>
  );
}
