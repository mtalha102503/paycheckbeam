import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — PaycheckBeam",
  description:
    "PaycheckBeam terms of service: the calculator provides estimates for informational purposes only, acceptable use, and limits of liability.",
};

export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: November 15, 2026</p>

      <p className="mt-4 leading-relaxed text-slate-600">
        By using PaycheckBeam, you agree to these terms. If you do not agree,
        please do not use the site.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        1. What PaycheckBeam is
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        PaycheckBeam is a free paycheck calculator. You enter your pay,
        filing status, state, and deductions, and the calculator estimates
        your take-home pay after federal income tax, Social Security,
        Medicare, and state income tax. The calculation runs entirely in
        your browser — nothing you type is sent to a server.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        2. Estimates, not advice
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        Every figure on this site is an estimate for informational purposes
        only. PaycheckBeam is not tax, legal, or financial advice, and it
        does not replace a qualified tax professional or your employer&apos;s
        payroll department. Your actual paycheck depends on your Form W-4,
        your employer&apos;s payroll setup, and local taxes that this
        calculator may not model. See the{" "}
        <Link href="/disclaimer" className="font-semibold text-blue-600 hover:underline">
          Disclaimer
        </Link>{" "}
        for the full statement.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        3. Acceptable use
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        You agree to use PaycheckBeam lawfully and not to abuse it. That
        means: do not attempt to disrupt the site, do not scrape it at a
        volume that degrades it for other visitors, do not present its
        results as your own work or as an official tax document, and do
        not use it for any unlawful purpose.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        4. Accuracy and updates
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        Federal figures follow IRS Publication 15-T (2026) and Revenue
        Procedure 2025-32; state figures follow each state&apos;s
        Department of Revenue or equivalent authority. Tax law changes,
        and we update the tables as new official figures are published —
        but we cannot guarantee that every figure is current or complete
        at the moment you use it. Where a state table has not yet been
        verified against the official source, the state page says so.
        Always confirm a number that matters against the official source
        before acting on it.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        5. Intellectual property
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        The site&apos;s text, design, and code are the property of
        PaycheckBeam and are protected by applicable intellectual property
        laws. You may link to any page and share results for personal,
        non-commercial use. You may not copy, republish, or redistribute
        substantial portions of the site&apos;s content without permission.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        6. No warranties
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        PaycheckBeam is provided &ldquo;as is&rdquo; and &ldquo;as
        available&rdquo;, without warranties of any kind, express or
        implied, including warranties of accuracy, fitness for a
        particular purpose, and non-infringement.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        7. Limitation of liability
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        To the maximum extent permitted by law, PaycheckBeam is not liable
        for any direct, indirect, incidental, consequential, or punitive
        damages arising from your use of the site or reliance on its
        estimates — including tax, payroll, or financial decisions made
        on the basis of a calculated figure. The service is free, and
        your sole remedy for dissatisfaction is to stop using it.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        8. Third-party links
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        The site links to official sources such as the IRS and state
        Departments of Revenue. Those sites are not operated by
        PaycheckBeam, and we are not responsible for their content,
        accuracy, or availability.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        9. Changes to these terms
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        We may update these terms from time to time. When we do, the
        &ldquo;last updated&rdquo; date above will change. Continued use
        of the site after a change means you accept the updated terms.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        10. Governing law
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        These terms are governed by the laws of the jurisdiction in which
        PaycheckBeam operates, without regard to conflict-of-law
        principles.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">11. Contact</h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        Questions about these terms:{" "}
        <a
          href="mailto:contact@paycheckbeam.com"
          className="font-semibold text-blue-600 hover:underline"
        >
          contact@paycheckbeam.com
        </a>
        .
      </p>
    </div>
  );
}
