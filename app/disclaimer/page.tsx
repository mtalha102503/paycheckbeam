import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Disclaimer — PaycheckBeam",
  description:
    "PaycheckBeam disclaimer: all figures are estimates for informational purposes only, not tax, legal, or financial advice.",
};

export default function Disclaimer() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        Disclaimer
      </h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: November 15, 2026</p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        Estimates, not your actual paycheck
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        Every number on PaycheckBeam is an estimate. Your actual paycheck
        depends on things this calculator cannot see: your Form W-4
        elections, your employer&apos;s payroll setup and pay calendar,
        employer-specific deductions and benefits, garnishments, and
        local taxes. A calculated figure can differ from the amount your
        employer actually pays you, even when every input is correct.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        Not tax, legal, or financial advice
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        PaycheckBeam provides general information only. It is not tax,
        legal, or financial advice, and it does not create any
        professional relationship between you and PaycheckBeam. For
        decisions about withholding, estimated payments, retirement
        contributions, or any tax filing, consult a qualified tax
        professional or your employer&apos;s payroll department.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        How the figures are produced
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        Federal withholding follows the IRS Publication 15-T (2026)
        percentage method with a standard Form W-4, using the 2026
        standard deduction ($16,100 single, $32,200 married filing
        jointly, $24,150 head of household — IRS Revenue Procedure
        2025-32), the 2026 graduated brackets, Social Security at 6.2%
        up to the $184,500 wage base, and Medicare at 1.45% plus 0.9%
        additional withholding over $200,000. State figures follow each
        state&apos;s Department of Revenue or equivalent authority, with
        state-specific rules for pre-tax deductions and state payroll
        insurance programs where they apply. The full method is on the{" "}
        <Link href="/about" className="font-semibold text-blue-600 hover:underline">
          About page
        </Link>
        .
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        What is not modelled
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        The calculator does not model every local tax. City and county
        income taxes are included only where stated — currently New York
        City and Yonkers, selectable in the calculator. It does not model
        garnishments, child-support withholding, employer-specific
        deductions, or taxes of a state other than the one you select.
        Some state tables are still being verified against their official
        source; where that is the case, the state page says so.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        No guarantee of accuracy
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        Tax law changes, and official sources publish corrections. We
        update the tables as new official figures appear, but we make no
        guarantee that any figure is current, complete, or free of
        error. If a number matters — for a job offer, a budget, or a tax
        filing — confirm it against the official source (the IRS, your
        state Department of Revenue, or your pay stub) before acting on
        it.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        No liability
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        PaycheckBeam is not liable for any loss or damage arising from
        reliance on its estimates, including tax, payroll, or financial
        decisions made on the basis of a calculated figure. See the{" "}
        <Link href="/terms" className="font-semibold text-blue-600 hover:underline">
          Terms of Service
        </Link>{" "}
        for the full limitation of liability.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        External links
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        Links to official sources (the IRS, state Departments of
        Revenue, and similar authorities) are provided for verification.
        PaycheckBeam does not control those sites and does not endorse
        their content beyond the cited figures.
      </p>
    </div>
  );
}
