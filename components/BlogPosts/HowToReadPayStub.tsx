import Link from "next/link";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";
import { formatUSD, formatUSD0 } from "@/lib/paycheckCalc";
import {
  examplePaycheck,
  formatAmountOrUnavailable,
} from "@/components/StateGuides/shared";

const faqs: FaqItem[] = [
  {
    q: "What is the most important line on a pay stub?",
    a: "Net pay — the amount that should match your bank deposit, or your combined deposits if you split direct deposit. If it does not match, work upward: check gross pay first (rate times hours), then the two wage bases, then each tax line. Most errors are in hours, the W-4 withholding, or a deduction that started or stopped.",
  },
  {
    q: "What does YTD mean on a pay stub?",
    a: "Year to date — the running total of that line since January 1. Every line usually has two numbers: this pay period and YTD. This period's YTD should equal last stub's YTD plus this period's amount. Lenders and landlords read the YTD column first because it shows your earnings so far this year.",
  },
  {
    q: "What is OASDI on my pay stub?",
    a: "OASDI is Old-Age, Survivors, and Disability Insurance — the official name for Social Security tax. It is 6.2% of your wages up to the 2026 wage base of $184,500. It may also appear as SS, FICA-SS, or Social Security.",
  },
  {
    q: "Why is Social Security 6.2% but Medicare only 1.45%?",
    a: "They are two different programs with different rates. Social Security (OASDI) is 6.2% up to the $184,500 wage base for 2026, and stops above it. Medicare is 1.45% of all wages with no cap, plus 0.9% additional withholding on wages over $200,000. Together they are 7.65% of your pay, usually shown as FICA.",
  },
  {
    q: "Does my employer have to give me a pay stub?",
    a: "Federal law does not require it — the Fair Labor Standards Act requires employers to keep payroll records, but whether you receive a pay stub depends on your state. Most states require one; a few do not. If you are paid by direct deposit and never see a stub, ask payroll where to view it online.",
  },
  {
    q: "Why is my first paycheck smaller than expected?",
    a: "The usual reasons: you started mid-pay-period and are paid only for days worked, a full benefits deduction was taken from the first check, or a bonus in that period was withheld at the flat 22% supplemental rate. If the gap persists past the first full pay period, check the stub line by line against the five-minute check in this guide.",
  },
  {
    q: "How can I check my pay stub for errors?",
    a: "Five checks, in order: hours times rate equals gross pay; Social Security is 6.2% and Medicare is 1.45% of your FICA wages — after confirming you have not crossed the $184,500 Social Security wage base or the $200,000 Additional Medicare threshold, which legitimately change those lines; this period's YTD equals last stub's YTD plus this period, allowing for separately identified corrections; gross minus every deduction equals net pay; and your W-4 withholding matches the IRS Tax Withholding Estimator. Any line that fails one of these is worth a question to payroll.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-slate-50">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-bold text-slate-900">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`border-t border-slate-200 px-4 py-3 leading-relaxed text-slate-600 ${
                    j === 0 ? "font-semibold text-slate-900" : ""
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function HowToReadPayStub() {
  const ex = examplePaycheck("texas-paycheck-calculator", 75000);
  // Sample stub: the 10th biweekly paycheck of the year.
  // Payroll rounds each check to the cent, so YTD is the sum of the
  // rounded checks — ten times the rounded per-period figure.
  const ytd = (perPeriod: number) =>
    (Math.round(perPeriod * 100) / 100) * 10;
  // Two-wage-base example: 6% 401(k) ($4,500/yr) + $150/check health premium.
  const k401PerCheck = 4500 / 26;
  const healthPerCheck = 150;
  const incomeTaxWages = ex.perPeriodGross - k401PerCheck - healthPerCheck;
  const ficaWages = ex.perPeriodGross - healthPerCheck;
  const ssExample = ficaWages * 0.062;
  const medExample = ficaWages * 0.0145;
  return (
    <>
      <p className="mt-6 leading-relaxed text-slate-600">
        Your pay stub is supposed to explain why your deposit is smaller
        than your salary — but it reads like code: FIT, OASDI, MED, YTD.
        Skip those lines and a payroll mistake can ride along for months
        before anyone catches it. This guide reads one stub line by line
        until every number on yours makes sense, using the verified 2026
        figures.
      </p>

      <div className="mt-6 rounded-2xl border border-blue-600/30 bg-blue-50 p-5">
        <p className="text-sm font-extrabold uppercase tracking-wide text-blue-700">
          Short answer
        </p>
        <p className="mt-2 leading-relaxed text-slate-700">
          Most pay stubs have the same six parts: a{" "}
          <strong>header</strong> (who paid you, for which dates),{" "}
          <strong>earnings</strong> (what you earned, ending in gross
          pay), <strong>taxes</strong>,{" "}
          <strong>pre-tax deductions</strong>,{" "}
          <strong>post-tax deductions</strong>, and{" "}
          <strong>net pay</strong> (what lands in your bank account) —
          plus a <strong>YTD column</strong> adding up every check since
          January 1. Read it top to bottom, and the flow is always{" "}
          <strong>gross pay − taxes − deductions = net pay</strong>.
        </p>
      </div>

      <h2 className="mt-10 text-2xl font-bold text-slate-900">
        A sample stub, line by line
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        Here is a made-up stub for a made-up worker: a single filer
        earning $75,000 a year, paid biweekly (26 pay periods), living
        in Texas (no state income tax), with a standard W-4 (Step 2
        unchecked, no Step 3 credits or Step 4 adjustments) and no
        benefit deductions — so every line is pure tax math. This is the 10th paycheck of the year, which is why
        the YTD column is 10 times the current column. Every figure is
        generated by the same calculation the PaycheckBeam calculator
        runs.
      </p>
      <Table
        headers={["Line", "This period", "Year to date (10 checks)"]}
        rows={[
          ["Gross pay", formatUSD(ex.perPeriodGross), formatUSD(ytd(ex.perPeriodGross))],
          ["Federal income tax (FIT)", formatUSD(ex.perPeriodFederal), formatUSD(ytd(ex.perPeriodFederal))],
          ["Social Security — OASDI (6.2%)", formatUSD(ex.perPeriodSocialSecurity), formatUSD(ytd(ex.perPeriodSocialSecurity))],
          ["Medicare (1.45%)", formatUSD(ex.perPeriodMedicare), formatUSD(ytd(ex.perPeriodMedicare))],
          ["Texas income tax", formatAmountOrUnavailable(ex.perPeriodState), formatAmountOrUnavailable(ex.perPeriodState === null ? null : ytd(ex.perPeriodState))],
          ["Net pay", formatUSD(ex.perPeriodNet), formatUSD(ytd(ex.perPeriodNet))],
        ]}
      />
      <p className="mt-3 leading-relaxed text-slate-600">
        Check the math yourself: gross pay {formatUSD(ex.perPeriodGross)}{" "}
        minus federal {formatUSD(ex.perPeriodFederal)}, Social Security{" "}
        {formatUSD(ex.perPeriodSocialSecurity)}, and Medicare{" "}
        {formatUSD(ex.perPeriodMedicare)} equals net pay{" "}
        {formatUSD(ex.perPeriodNet)} — to the penny. That is the first
        thing to verify on your own stub: gross minus every deduction
        must equal net pay.
      </p>

      <h2 className="mt-10 text-2xl font-bold text-slate-900">
        Block 1: Header — who, when, how much
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        The top of the stub names your employer and you, and gives two
        dates that are easy to confuse. The <strong>pay period</strong>{" "}
        is the stretch of days the check covers (for example, June 1
        through 14). The <strong>pay date</strong> is the day the money
        moves (June 19, say). If your first paycheck of a job looks
        small, this is usually why: you started mid-period and are paid
        only for the days you worked.
      </p>

      <h2 className="mt-10 text-2xl font-bold text-slate-900">
        Block 2: Earnings — your gross pay
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        Gross pay is everything you earned before anything comes out:
        your hourly rate times your hours, or your salary divided by
        the number of paychecks in a year. On a $75,000 salary paid
        biweekly, that is $75,000 ÷ 26 = {formatUSD(ex.perPeriodGross)}{" "}
        per check. Overtime hours are paid at least 1.5 times your
        regular rate of pay for hours over 40 in a workweek, for covered
        nonexempt employees under the Fair Labor Standards Act — your
        employer may pay more, and the regular rate is not always your
        base hourly rate (it can include other earnings, such as certain
        bonuses). Bonuses and commissions
        appear here too — but they are withheld differently (see the
        surprises section below).
      </p>
      <p className="mt-3 leading-relaxed text-slate-600">
        <strong>What to check:</strong> your pay rate and your hours.
        Do they match what you were promised and what you worked? If
        not, tell payroll now — an hours error repeats every check
        until someone flags it.
      </p>

      <h2 className="mt-10 text-2xl font-bold text-slate-900">
        Block 3: Taxes — usually the biggest lines
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        <strong>Federal income tax (FIT or FWT).</strong> The W-4 you
        filled out at hire sets this amount, which makes it the one tax
        line you control. Payroll annualizes your pay, subtracts
        pre-tax deductions and the standard deduction ($16,100 for a
        single filer in 2026), runs the remainder through the IRS
        Publication 15-T brackets, and divides the annual tax back
        down to one paycheck. On our sample stub that is{" "}
        {formatUSD(ex.perPeriodFederal)} per check, or{" "}
        {formatUSD(ex.annualFederal)} a year. If this line looks wrong,
        your W-4 is the first suspect — the IRS Tax Withholding
        Estimator shows what to put on a new one.
      </p>
      <p className="mt-3 leading-relaxed text-slate-600">
        <strong>Social Security (SS, OASDI, or FICA-SS).</strong> A
        flat 6.2% of wages up to the 2026 wage base of $184,500. On the
        sample stub that is {formatUSD(ex.perPeriodSocialSecurity)} per
        check. Wages above $184,500 are not taxed for Social Security
        at all — so if you earn more than that, watch your paycheck
        jump late in the year when you pass the base.
      </p>
      <p className="mt-3 leading-relaxed text-slate-600">
        <strong>Medicare (MED or FICA-MED).</strong> A flat 1.45% of
        all wages, with no cap, plus 0.9% additional withholding on
        wages over $200,000. On the sample stub that is{" "}
        {formatUSD(ex.perPeriodMedicare)} per check. Together, Social
        Security and Medicare are 7.65% of your pay and are often shown
        as a single line: <strong>FICA</strong>.
      </p>
      <p className="mt-3 leading-relaxed text-slate-600">
        <strong>State and local income tax (SIT or SWT).</strong> Nine
        states impose no individual income tax on wages in 2026 —
        Alaska, Florida, Nevada, New Hampshire, South Dakota,
        Tennessee, Texas, Washington, and Wyoming — which is why the
        sample stub shows $0.00 on the state tax line. Payroll-program
        deductions can still apply in those states: Washington, for
        example, still deducts for Paid Family and Medical Leave and WA
        Cares, so a $0 state tax line does not always mean $0 in state
        deductions. Every
        other state has its own tables. New York City residents also
        see a city tax line (3.078%–3.876%), and Yonkers residents a
        surcharge. If you moved states this year, check that the state
        line changed with you.
      </p>

      <h2 className="mt-10 text-2xl font-bold text-slate-900">
        Block 4: Pre-tax deductions — the lines that shrink your taxes
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        These come out before income tax is calculated, so they shrink
        the wages the tax is figured on. The usual ones are a
        traditional 401(k), health, dental, and vision premiums, and
        HSA or FSA contributions. Our sample worker has none, so these
        lines are empty — but on a real stub they are often the
        largest non-tax lines.
      </p>
      <p className="mt-3 leading-relaxed text-slate-600">
        The detail that matters: a 401(k) contribution lowers the wages
        used for federal income tax, but <strong>not</strong> the wages
        used for Social Security and Medicare. Health premiums and HSA
        contributions made through a qualifying cafeteria-plan payroll
        deduction lower both. That is why your stub has two different
        wage bases hiding in it — income-tax wages (gross minus all
        pre-tax deductions) and FICA wages (gross minus only the
        Section 125 items). The 2026 base employee elective-deferral
        limit is $24,500 (IRS Notice 2025-67), before the $8,000
        catch-up at 50+. For eligible participants ages 60–63, the
        catch-up is $11,250 instead of the regular $8,000 — not in
        addition — where the plan permits it. Traditional and Roth
        401(k) deferrals share that one combined limit, not one each. The HSA limits are $4,400 self-only and
        $8,750 family under Revenue Procedure 2025-19, and the health
        FSA limit is $3,400 under Revenue Procedure 2025-32.
      </p>
      <p className="mt-3 leading-relaxed text-slate-600">
        A small example shows why the two bases matter. Take the same
        $75,000 worker, paid biweekly, who puts 6% into a 401(k){" "}
        ({formatUSD0(4500)} a year, or {formatUSD(k401PerCheck)} per
        check) and pays {formatUSD(healthPerCheck)} per check in health
        premiums ({formatUSD0(healthPerCheck * 26)} a year).
        Income-tax wages for the check are{" "}
        {formatUSD(incomeTaxWages)} — gross pay minus both. FICA wages
        are {formatUSD(ficaWages)} — gross pay minus only the health
        premium, because the 401(k) does not cut FICA. Social Security
        is 6.2% of {formatUSD(ficaWages)} ({formatUSD(ssExample)}), and
        Medicare is 1.45% ({formatUSD(medExample)}). The 401(k) saved
        federal tax; it saved nothing on FICA. Figures are rounded to
        the cent; your payroll may differ by a cent.
      </p>

      <h2 className="mt-10 text-2xl font-bold text-slate-900">
        Block 5: Post-tax deductions — after the tax is figured
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        These come out after taxes: Roth 401(k) contributions (taxed
        now, with qualified withdrawals tax-free in retirement — the
        opposite of a traditional 401(k)), wage garnishments, child-support withholding, and
        union dues. They do not reduce any tax, so a dollar here costs
        a full dollar of take-home pay.
      </p>

      <h2 className="mt-10 text-2xl font-bold text-slate-900">
        Block 6: Net pay and the YTD column
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        Net pay is what remains after everything —{" "}
        {formatUSD(ex.perPeriodNet)} per check on our sample stub, or{" "}
        {formatUSD(ex.annualNet)} a year. It should match what lands in
        your bank account — across your combined deposits if you split
        your direct deposit. If it does not, the difference is a
        separate deposit, a split deposit, or an error — ask payroll.
      </p>
      <p className="mt-3 leading-relaxed text-slate-600">
        Nearly every line has a second number next to it: the YTD
        column, the running total since January 1. Lenders and
        landlords read this column first. The check that matters: this
        period&apos;s YTD must equal last stub&apos;s YTD plus this
        period&apos;s amount. On our sample stub, YTD gross after 10
        checks is {formatUSD(ytd(ex.perPeriodGross))} — ten times the{" "}
        {formatUSD(ex.perPeriodGross)} on each check, because payroll
        rounds each check to the cent and YTD is the sum of the rounded
        checks. YTD should reconcile with the previous stub&apos;s total
        plus this period&apos;s activity, allowing for separately
        identified corrections. A raise or a bonus is already included
        in the current-period amount, so it cannot explain a
        reconciliation gap — if the numbers do not add up, ask payroll.
      </p>

      <h2 className="mt-10 text-2xl font-bold text-slate-900">
        Abbreviation decoder
      </h2>
      <Table
        headers={["Abbreviation", "What it means", "2026 rule"]}
        rows={[
          ["FIT / FWT", "Federal income tax withholding", "IRS Publication 15-T; set by your W-4"],
          ["OASDI / SS / FICA-SS", "Social Security tax", "6.2% up to the $184,500 wage base"],
          ["MED / FICA-MED", "Medicare tax", "1.45% of all wages; +0.9% over $200,000"],
          ["FICA", "Social Security + Medicare combined", "7.65% of wages (up to the wage base)"],
          ["SIT / SWT", "State income tax withholding", "Varies by state; $0 in the 9 no-tax states"],
          ["YTD", "Year to date", "Running total since January 1"],
          ["401(k)", "Traditional retirement contribution", "Pre-tax for income tax; not for FICA; $24,500 limit"],
          ["Roth 401(k)", "After-tax retirement contribution", "Taxed now; no tax reduction"],
          ["HSA / FSA", "Health savings / flexible spending account", "Pre-tax for income tax and FICA (qualifying payroll contributions)"],
          ["FUTA", "Federal unemployment tax", "Employer-paid (6.0% for 2026); never your deduction"],
        ]}
      />
      <p className="mt-3 leading-relaxed text-slate-600">
        FUTA deserves a callout: it appears on some stubs in the
        employer section, but it is your employer&apos;s tax, not
        yours. It never reduces your net pay. The same goes for the
        employer&apos;s share of Social Security and Medicare — your
        stub may list it for transparency, but only the employee share
        comes out of your check.
      </p>

      <h2 className="mt-10 text-2xl font-bold text-slate-900">
        Check your pay stub in five minutes
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        Run these five checks every payday, or at least once a month.
        Any line that fails one of them is worth a question to payroll.
      </p>
      <p className="mt-3 leading-relaxed text-slate-600">
        <strong>1. Hours times rate equals gross pay.</strong> For
        hourly work, each earnings line should be hours times rate —
        80 × $28.50 = $2,280.00, and overtime at least 1.5 times the
        regular rate. For salary, gross should be annual salary divided
        by pay periods.
      </p>
      <p className="mt-3 leading-relaxed text-slate-600">
        <strong>2. Find your two wage bases.</strong> Income-tax wages
        equal gross pay minus all pre-tax deductions. FICA wages equal
        gross pay minus only the Section 125 items (health, dental,
        vision, HSA through payroll, FSA). If your 401(k) is the only
        pre-tax item, the two bases differ by exactly the 401(k)
        amount.
      </p>
      <p className="mt-3 leading-relaxed text-slate-600">
        <strong>3. Check the flat-rate taxes — after the two exceptions
        below.</strong> Social Security should be 6.2% of FICA wages
        and Medicare 1.45%, each within a cent or two of rounding.
        Before concluding a wage base is wrong, confirm you have not
        crossed the Social Security wage base ($184,500 in YTD wages —
        the 6.2% line stops or shrinks on the crossing paycheck) and
        that your YTD wages from this employer have not passed $200,000
        (the 0.9% Additional Medicare withholding starts there). If
        neither exception applies and a line is still off by more than
        a cent or two, a wage base may be wrong.
      </p>
      <p className="mt-3 leading-relaxed text-slate-600">
        <strong>4. Check the YTD column.</strong> This period&apos;s YTD
        should equal last stub&apos;s YTD plus this period&apos;s
        amount, line by line. If it does not, the difference should be
        a separately identified correction — anything else is worth a
        question to payroll.
      </p>
      <p className="mt-3 leading-relaxed text-slate-600">
        <strong>5. Gross minus everything equals net.</strong> Add up
        every deduction line and subtract from gross pay. The answer
        must equal net pay to the penny, and net pay must equal what
        lands in your bank account (across your combined deposits if
        you split direct deposit).
      </p>

      <h2 className="mt-10 text-2xl font-bold text-slate-900">
        Four surprises that are not errors
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        <strong>Your first paycheck is small.</strong> You started
        mid-period, or a full benefits deduction came out of the first
        check. Check your first full paycheck carefully — a mid-period
        start or a first-check benefits deduction explains most small
        first checks, but review the stub rather than assuming it fixed
        itself.
      </p>
      <p className="mt-3 leading-relaxed text-slate-600">
        <strong>Your bonus may have more tax withheld.</strong> Bonuses
        and commissions are supplemental wages. Employers commonly
        withhold federal tax on them at a flat 22% (up to $1 million
        of supplemental wages in the year) — that is one permitted
        method; where the conditions allow, an employer may instead use
        the aggregate method, adding the bonus to your regular wages
        for that period. Either way, that is withholding, not your
        final tax — the true amount is settled on your return.
      </p>
      <p className="mt-3 leading-relaxed text-slate-600">
        <strong>Your paycheck jumps late in the year.</strong> Once
        your year-to-date wages pass the $184,500 Social Security wage
        base, the 6.2% line stops. Your take-home pay rises by that
        amount for the rest of the year — and resets to the full
        deduction in January.
      </p>
      <p className="mt-3 leading-relaxed text-slate-600">
        <strong>Your employer&apos;s taxes are listed but not deducted.</strong>{" "}
        FUTA and the employer&apos;s share of FICA may appear on your
        stub for transparency. They are your employer&apos;s cost, not
        yours, and they never reduce your net pay.
      </p>

      <h2 className="mt-10 text-2xl font-bold text-slate-900">
        What to do if something is wrong
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        Start with payroll or HR, with the stub and the failed check in
        hand — &ldquo;my Social Security line is 6.2% of the wrong wage
        base&rdquo; gets fixed faster than &ldquo;my check looks
        low.&rdquo; If the federal line is the problem, run the IRS Tax
        Withholding Estimator and file a new W-4 with the result. Keep
        every stub: the YTD column is what lenders ask for, and it is
        your record if a correction is ever needed. And if your state
        changed, your filing status changed, or you started a second
        job this year, say so — all three change the withholding math.
      </p>

      <h2 className="mt-10 text-2xl font-bold text-slate-900">
        Frequently asked questions
      </h2>
      <div className="mt-6">
        <FaqAccordion faqs={faqs} />
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <h2 className="mt-10 text-2xl font-bold text-slate-900">
        Sources &amp; methodology
      </h2>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm leading-relaxed text-slate-600">
          Federal withholding follows IRS Publication 15-T (2026) and
          the 2026 inflation adjustments in Revenue Procedure 2025-32
          (standard deduction $16,100 single). The Social Security wage
          base of $184,500 is the SSA figure for 2026. The 401(k) base
          limit of $24,500 is IRS Notice 2025-67; the HSA limits of
          $4,400 self-only and $8,750 family are Revenue Procedure
          2025-19; the health FSA limit of $3,400 is Revenue Procedure
          2025-32. Supplemental-wage withholding at a flat 22% is IRS
          Publication 15. The note that federal law does not require
          employers to provide pay stubs is the U.S. Department of
          Labor&apos;s position. The sample stub is a made-up example —
          a single filer earning $75,000 in Texas, paid biweekly (26
          pay periods), with a standard W-4 (Step 2 unchecked, no Step
          3 credits or Step 4 adjustments) — and every figure in it is
          generated by the same calculation the PaycheckBeam calculator
          runs, so the figures match the tool.
        </p>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed">
          <li>
            <a href="https://www.irs.gov/publications/p15t" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">
              IRS Publication 15-T (2026)
            </a>{" "}
            — federal income tax withholding method
          </li>
          <li>
            <a href="https://www.irs.gov/pub/irs-drop/rp-25-32.pdf" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">
              IRS Revenue Procedure 2025-32
            </a>{" "}
            — 2026 inflation adjustments (standard deduction, brackets, health FSA)
          </li>
          <li>
            <a href="https://www.irs.gov/pub/irs-drop/n-25-67.pdf" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">
              IRS Notice 2025-67
            </a>{" "}
            — 2026 retirement plan limits (401(k) $24,500)
          </li>
          <li>
            <a href="https://www.irs.gov/pub/irs-drop/rp-25-19.pdf" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">
              IRS Revenue Procedure 2025-19
            </a>{" "}
            — 2026 HSA limits ($4,400 self-only / $8,750 family)
          </li>
          <li>
            <a href="https://www.ssa.gov/oact/cola/cbb.html" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">
              Social Security Administration — Contribution and Benefit Base
            </a>{" "}
            — 2026 wage base $184,500
          </li>
          <li>
            <a href="https://www.irs.gov/publications/p15" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">
              IRS Publication 15
            </a>{" "}
            — supplemental-wage withholding (flat 22%)
          </li>
          <li>
            <a href="https://webapps.dol.gov/elaws/faq/esa/flsa/018.htm" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">
              U.S. Department of Labor — elaws FLSA Advisor
            </a>{" "}
            — &ldquo;Are pay stubs required?&rdquo;
          </li>
          <li>
            <a href="https://www.irs.gov/individuals/tax-withholding-estimator" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">
              IRS Tax Withholding Estimator
            </a>{" "}
            — check what to put on a new W-4
          </li>
        </ul>
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          Last reviewed: November 15, 2026. All figures are estimates
          for informational purposes only and are not tax, legal, or
          financial advice. See the{" "}
          <Link href="/disclaimer" className="font-semibold text-blue-600 hover:underline">
            Disclaimer
          </Link>
          .
        </p>
      </div>

      <div className="mt-10 rounded-2xl bg-navy-950 p-6 text-white">
        <p className="text-xl font-extrabold tracking-tight">
          Check your own stub against the calculator
        </p>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">
          Enter your pay, state, and deductions and compare the
          calculator&apos;s breakdown with your stub, line by line.
        </p>
        <Link
          href="/#calculator"
          className="mt-4 inline-block rounded-full bg-white px-5 py-3 text-sm font-extrabold text-navy-900 shadow-lg transition hover:bg-beam-100"
        >
          Calculate my paycheck →
        </Link>
      </div>
    </>
  );
}
