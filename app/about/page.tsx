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
        <li>Your pay is annualized (weekly × 52, biweekly × 26, twice a month × 24, monthly × 12).</li>
        <li>Pre-tax deductions come off: traditional 401(k) contributions and Section 125 health-insurance premiums.</li>
        <li>The 2026 standard deduction is subtracted — $16,100 single, $32,200 married filing jointly, $24,150 head of household (IRS Rev. Proc. 2025-32).</li>
        <li>The remainder runs through the 2026 graduated brackets (10% to 37%), then the annual tax is divided back by the number of pay periods.</li>
      </ol>
      <p className="mt-3 leading-relaxed text-slate-600">
        Social Security is 6.2% of wages up to the 2026 wage base of $184,500.
        Medicare is 1.45% of all wages plus 0.9% on wages over $200,000 (single)
        or $250,000 (married filing jointly). One detail most calculators get
        wrong: 401(k) contributions lower income tax but <strong>not</strong>{" "}
        Social Security or Medicare, while cafeteria-plan health premiums lower
        both — and this calculator models that difference.
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
        <li>Tax Foundation — 2026 state individual income tax rates and brackets.</li>
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
