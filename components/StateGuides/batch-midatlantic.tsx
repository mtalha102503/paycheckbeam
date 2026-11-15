/**
 * PaycheckBeam — Mid-Atlantic / Southeast state guides: Delaware,
 * Maryland, Virginia, West Virginia, North Carolina, South Carolina,
 * Georgia, Florida.
 *
 * Researched 2026-11-15 from opened official pages — see
 * ~/workspace/paycheckbeam-research/state-guides-midatlantic.md for the
 * per-state source list and what was left out as unverified. Two data
 * corrections found during research (West Virginia SB 392 rates; South
 * Carolina H. 4216) were applied to lib/stateTaxData.ts, so the engine
 * now carries the 2026 law for both states and the tables below are
 * generated from the shared engine. South Carolina rows are clean now:
 * the SCIAD phaseout (SCDOR Information Letter #26-20, Aug 31, 2026)
 * is modelled by the engine (round-4), so no row is flagged.
 *
 * Structure matches the approved CA/TX/NY exemplars: worked examples
 * first, then how the tax works in the state's own terms, withholding
 * form how-to and filing detail in expandable sections, exclusions, and
 * 10-14 FAQs per state. Worked-example figures are generated from the
 * shared engine via examplePaycheck() — never hardcoded strings.
 *
 * Two states need a corrected taxable base the shared helper cannot
 * express: Maryland and Virginia subtract a personal exemption after
 * the standard deduction, and the shared stateTaxableIncome() subtracts
 * the standard deduction only. taxableWithExemption() below delegates
 * to the shared engineTaxableIncome() — the engine's own base (gross
 * minus the effective standard deduction, minus the effective
 * exemption after any MD-style phaseout, minus any federal-tax
 * deduction) — and bracketWalk() is bracketDetailText() run on that
 * base.
 */
import type { FaqItem } from "@/components/FaqAccordion";
import {
  applyBrackets,
  formatUSD,
  formatUSD0,
} from "@/lib/paycheckCalc";
import { getStateBySlug, type StateBracket } from "@/lib/stateTaxData";
import {
  bracketDetailText,
  effectiveRatePct,
  engineTaxableIncome,
  examplePaycheck,
  Eyebrow,
  ExpandableSection,
  formatAmountOrUnavailable,
  NoteBox,
  Para,
  SectionTitle,
  stateTaxableIncome,
  WorkedTable,
} from "@/components/StateGuides/shared";

export const BATCH_SLUGS: string[] = [
  "delaware-paycheck-calculator",
  "maryland-paycheck-calculator",
  "virginia-paycheck-calculator",
  "west-virginia-paycheck-calculator",
  "north-carolina-paycheck-calculator",
  "south-carolina-paycheck-calculator",
  "georgia-paycheck-calculator",
  "florida-paycheck-calculator",
];

/** Engine taxable base: gross minus the effective standard deduction
 *  AND the effective personal exemption (phased for Maryland at higher
 *  incomes), minus any federal-tax deduction. Delegates to the shared
 *  engineTaxableIncome() so the base can never drift from the
 *  calculator's state figure. For Virginia the exemption is static,
 *  so the result is the same as gross - SD - exemption. */
function taxableWithExemption(slug: string, gross: number): number {
  return engineTaxableIncome(slug, gross);
}

/** bracketDetailText() run on an explicit taxable base (for MD / VA). */
function bracketWalk(taxable: number, brackets: StateBracket[]): string {
  const parts: string[] = [];
  let prevTop = 0;
  for (const b of brackets) {
    const top = b.upTo ?? Infinity;
    const base = Math.min(taxable, top) - prevTop;
    if (base > 0) {
      parts.push(
        `${b.ratePct}% × ${formatUSD0(base)} = ${formatUSD((base * b.ratePct) / 100)}`,
      );
    }
    if (taxable <= top) break;
    prevTop = top;
  }
  return parts.join("; ");
}

/** Maryland county tax: county rate applied to Maryland taxable net income. */
function mdCountyTax(taxable: number, ratePct: number): number {
  return (taxable * ratePct) / 100;
}

/** Wilmington city wage tax: 1.25% of gross earned income. */
function deWilmingtonTax(gross: number): number {
  return (gross * 1.25) / 100;
}

/** South Carolina 2026 law under H. 4216 lives in lib/stateTaxData.ts
 * (SCIAD $15,000 single / $30,000 joint; 1.99% under $30,000, 5.21%
 * minus $966 at and above). The SCIAD phaseout is modelled by the
 * engine (round-4) per SCDOR Information Letter #26-20 (Aug 31,
 * 2026): the single-filer SCIAD phases out from $40,000 to $95,000
 * of AGI, with the reduction rounded down to the next $10.
 */
/* Shared example results reused by prose and FAQs — no engine-derived
 * figure is ever a literal string in an answer. */
const EX_DE_60 = examplePaycheck("delaware-paycheck-calculator", 60000);
const EX_DE_75 = examplePaycheck("delaware-paycheck-calculator", 75000);
const EX_MD_60 = examplePaycheck("maryland-paycheck-calculator", 60000);
const EX_MD_75 = examplePaycheck("maryland-paycheck-calculator", 75000);
const EX_VA_60 = examplePaycheck("virginia-paycheck-calculator", 60000);
const EX_VA_75 = examplePaycheck("virginia-paycheck-calculator", 75000);
const EX_WV_60 = examplePaycheck("west-virginia-paycheck-calculator", 60000);
const EX_WV_75 = examplePaycheck("west-virginia-paycheck-calculator", 75000);
const EX_NC_60 = examplePaycheck("north-carolina-paycheck-calculator", 60000);
const EX_NC_75 = examplePaycheck("north-carolina-paycheck-calculator", 75000);
const EX_SC_30 = examplePaycheck("south-carolina-paycheck-calculator", 30000);
const EX_SC_60 = examplePaycheck("south-carolina-paycheck-calculator", 60000);
const EX_SC_75 = examplePaycheck("south-carolina-paycheck-calculator", 75000);
const EX_GA_60 = examplePaycheck("georgia-paycheck-calculator", 60000);
const EX_GA_75 = examplePaycheck("georgia-paycheck-calculator", 75000);
const EX_FL_60 = examplePaycheck("florida-paycheck-calculator", 60000);
const EX_FL_75 = examplePaycheck("florida-paycheck-calculator", 75000);
const EX_CA_60 = examplePaycheck("california-paycheck-calculator", 60000);
const EX_CA_75 = examplePaycheck("california-paycheck-calculator", 75000);
const EX_NY_60_STATE = examplePaycheck("new-york-paycheck-calculator", 60000, "none");
const EX_NY_75_STATE = examplePaycheck("new-york-paycheck-calculator", 75000, "none");

/* ------------------------------------------------------------------ */
/* DELAWARE                                                            */
/* ------------------------------------------------------------------ */

function DelawareContent() {
  const deSlug = "delaware-paycheck-calculator";
  const deRows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(deSlug, gross);
    return [
      formatUSD0(gross),
      formatUSD0(stateTaxableIncome(deSlug, gross)),
      formatAmountOrUnavailable(r.annualState),
      formatUSD(deWilmingtonTax(gross)),
    ];
  });
  const deState = getStateBySlug(deSlug);
  const deBrackets = deState?.brackets ?? [];
  const de60 = examplePaycheck(deSlug, 60000);
  const de150 = examplePaycheck(deSlug, 150000);
  const deTaxable60 = stateTaxableIncome(deSlug, 60000);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          What Delaware tax looks like at real salaries
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the 2026 standard
          deduction of $3,250, applies the seven graduated rates, then
          subtracts the $110 personal credit. The Wilmington column is
          separate: the city wage tax is 1.25% of gross earned income, so
          it is charged on the full paycheck, not on taxable income — and
          it applies only if you live or work inside Wilmington city
          limits.
        </Para>
        <NoteBox tone="blue">
          <strong>How to read this table:</strong> the income-tax column
          is your <strong>annual state liability estimate</strong> — what
          you owe for the year, settled on your tax return. The Wilmington
          column is different: the city wage tax is{" "}
          <strong>withheld from every paycheck</strong> by your employer,
          so that column is what actually comes out of your pay on top of
          the state tax.
        </NoteBox>
        <WorkedTable
          caption="Delaware income tax + Wilmington wage tax, single filer, 2026"
          headers={["Gross wages", "DE taxable income", "DE income tax", "Wilmington wage tax (1.25%)"]}
          rows={deRows}
          footnote={`At $60,000 the effective DE income-tax rate is ${effectiveRatePct(de60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(de150.annualState, 150000)}%. The Wilmington column applies only inside city limits — outside Wilmington it is $0. Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          The $60,000 row in detail: {bracketDetailText(deSlug, 60000, deBrackets)}; total{" "}
          {formatUSD(applyBrackets(deTaxable60, deBrackets))}, minus the{" "}
          {formatUSD0(deState?.creditSingle ?? 0)} personal credit = {formatAmountOrUnavailable(de60.annualState)}.
          The first $2,000 of taxable income is taxed at 0%, which is why
          a $30,000 salary owes so little — most of it sits in the 2.2%
          and 3.9% brackets.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Division of Revenue&apos;s own terms</Eyebrow>
        <SectionTitle>
          Seven brackets, one schedule for every filer, and a credit instead of an exemption
        </SectionTitle>
        <Para>
          Delaware taxes personal income on a graduated scale: 0% on the
          first $2,000 of taxable income, then 2.2%, 3.9%, 4.8%, 5.2% and
          5.55%, up to a top rate of 6.6% on taxable income over $60,000.
          The same bracket schedule applies to every filing status — there
          is no separate joint schedule, only a larger standard deduction
          for joint filers. The Division of Revenue&apos;s 2026 estimated-tax
          instructions use exactly this schedule, so a top rate of 6.6%
          is the 2026 figure: proposals to add higher brackets above
          $125,000 did not become law.
        </Para>
        <Para>
          Delaware starts from federal adjusted gross income, then applies
          its own subtractions and the standard deduction: $3,250 for
          single, divorced, widowed or head-of-household filers, $6,500
          for married filing jointly, $3,250 for married filing
          separately. Taxpayers who are 65 or older or blind get an
          additional $2,500 standard deduction each. Instead of a personal
          exemption that reduces taxable income, Delaware gives a personal
          credit of $110 for each exemption claimed on the federal return —
          $110 for a single filer, $220 for a joint return — plus another
          $110 for each person age 60 or older. A credit comes straight
          off the tax you owe, but it cannot exceed your liability, so it
          can bring the bill to zero but never generates a refund on its
          own.
        </Para>
        <Para>
          Residents are taxed on all income wherever it is earned;
          nonresidents are taxed only on Delaware-source income, computed
          as though all of their income were Delaware income and then
          prorated by the Delaware share. Delaware has no reciprocal
          agreement with any state, so a Pennsylvania, New Jersey or
          Maryland commuter who works in Delaware has Delaware tax
          withheld on those wages and claims a credit for it on the home
          state&apos;s return.
        </Para>
        <Para>
          Delaware has no sales tax — the state funds itself partly through
          a gross receipts tax on businesses instead — which is why the
          income tax and the Wilmington wage tax carry the weight for
          workers. There is no county income tax anywhere in Delaware.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form DE-W4"
        title="Form DE-W4: Delaware's own withholding certificate"
        summary="Delaware has its own W-4. A federal W-4 completed in 2020 or later cannot be used for Delaware withholding — new hires file Form DE-W4 instead."
      >
        <Para>
          Delaware created its own withholding certificate, Form DE-W4,
          after the IRS redesigned the federal Form W-4 for 2020 and
          dropped withholding allowances. Delaware still allows a
          deduction or a personal credit for exemptions — $110 per
          allowance in the withholding formula — so the state needed its
          own count. The two forms do different jobs: the federal W-4
          sets your federal withholding, and the DE-W4 tells your
          employer how many Delaware allowances to use and whether to
          take an extra dollar amount from each paycheck. Give your
          employer a signed DE-W4 at the time of employment; if you hand
          in no certificate at all, you are withheld on as a single
          person with no allowances.
        </Para>
        <Para>
          One date decides whether a federal form still counts. An
          employer may not accept a federal Form W-4 completed in 2020
          or later for Delaware withholding — the Division of
          Revenue&apos;s answer to that exact question is &quot;No.&quot;
          But if your employer already holds a federal W-4 you completed
          before 2020, they may continue to rely on it if you do not
          want to change anything, though withholding is more accurate
          on the DE-W4. So if you started a job in 2020 or later, or you
          want to change your Delaware withholding — a new job, a
          marriage, a child — file a DE-W4; the federal form alone will
          not change the Delaware number.
        </Para>
        <Para>
          Your employer must give you a W-2 showing total wages and the
          Delaware tax withheld by January 31, and must file an annual
          reconciliation (Form W-3 with copies of the W-2s) by February
          28. Delaware also requires every employer to report new hires
          to the Division of Child Support Services within 20 days of
          hiring.
        </Para>
      </ExpandableSection>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Local tax · Wilmington only</Eyebrow>
        <SectionTitle>
          The Wilmington wage tax: 1.25% that follows the job, not just the address
        </SectionTitle>
        <Para>
          Wilmington is the only Delaware municipality with a local wage
          tax. Under Delaware law only a municipality of more than 50,000
          residents may levy one, and the rate cannot exceed 1.25% — and
          Wilmington charges the full 1.25% on all earned income of city
          residents, wherever they work, and on income that nonresidents
          earn inside city limits. Your employer withholds it and remits
          it to the city, separately from state withholding. So a Newark
          or Bear resident who reports to a Wilmington office owes the
          1.25%, and a Wilmington resident who works entirely from a Dover
          office owes it on every dollar too. The only household that
          avoids it entirely lives outside the city and works outside it.
        </Para>
        <Para>
          Two details catch people out. First, the wage tax is charged on
          gross earned income, so it does not exclude 401(k) deferrals —
          your 401(k) contribution is taxed by the city when it is
          deferred, even though it reduces your state and federal taxable
          wages. Section 125 cafeteria-plan benefits are excluded. Second,
          a Wilmington mailing address does not by itself mean you are
          inside the city: addresses in the 19803, 19809 and 19810 ZIP
          codes often sit in unincorporated New Castle County, outside the
          city line, where no wage tax applies. Check the city boundary,
          not the ZIP code.
        </Para>
        <NoteBox tone="amber">
          <strong>Not in the calculator:</strong> the Wilmington wage tax
          is not included in the state-tax estimate above the fold. If you
          live or work in Wilmington, add 1.25% of your gross wages —{" "}
          {formatUSD(deWilmingtonTax(60000))} a year on a $60,000 salary — to
          the state figure to see the full Delaware bite.
        </NoteBox>
      </section>

      <ExpandableSection
        eyebrow="Credits & exclusions · return-only"
        title="The Delaware breaks claimed on your return"
        summary="Personal credits, the earned income credit choice, and the pension and Social Security exclusions. Claimed on the annual return; this calculator does not automatically adjust withholding for them."
      >
        <Para>
          <strong className="text-slate-900">Personal credits:</strong>{" "}
          $110 for each exemption claimed on your federal return, plus an
          additional $110 for each person age 60 or older. The calculator
          subtracts the $110 single credit; the extra $110 for a filer age
          60 or older is not modelled, so a filer 60 or older may reduce
          annual Delaware income tax by up to $110, subject to eligibility
          and available tax liability — that credit is claimed on the
          annual return, not on your paycheck.
        </Para>
        <Para>
          <strong className="text-slate-900">Earned income tax credit:</strong>{" "}
          Delaware lets you choose between 20% of your federal earned
          income credit as a nonrefundable credit, or 4.5% of the federal
          credit with the excess above your tax liability refunded to you.
          The refundable 4.5% option is the better deal when your Delaware
          liability is small; the 20% option wins when you owe enough tax
          to use it. Either way it is claimed on the return, and the
          calculator does not model it.
        </Para>
        <Para>
          <strong className="text-slate-900">What Delaware does not
          tax:</strong> Social Security benefits and railroad retirement
          payments are fully exempt from Delaware income tax. Pension and
          other eligible retirement income is excluded up to $2,000 per
          person under age 60, and up to $12,500 per person at age 60 or
          older — including up to $12,500 from a qualified military
          pension. Interest from U.S. obligations (savings bonds,
          Treasury bills) is also excluded. These are subtractions on the
          return, not withholding adjustments, so none of them shows up in
          the worked examples above, which are wages only.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing & estimated payments · return-only"
        title="Delaware returns are due April 30 — not April 15"
        summary="The resident return, the $800 estimated-tax threshold, and the four installment dates. The detail is inside."
      >
        <Para>
          Delaware&apos;s individual income tax return (Form 200-01 for
          residents) is due April 30 — two weeks after the federal
          deadline — and nonresidents file Form PIT-NON. That April 30
          date is also the first estimated-tax date. You must file a
          Declaration of Estimated Income Tax (Form PIT-EST) if the tax
          due in excess of withholding can reasonably be expected to
          exceed $800 for the year, and pay it in equal installments on or
          before April 30, June 15, September 15 and January 15 of the
          following year — or pay in full with the first declaration.
          Filing the return and paying in full on or before March 1 of the
          succeeding year replaces the declaration entirely.
        </Para>
        <Para>
          The underpayment penalty is 1.5% per month on the shortfall, and
          it does not apply if each installment is paid on time and is at
          least 90% of the tax on the current-year return (66⅔% for
          farmers and fishermen) or 100% of the tax on the prior-year
          return — 110% if the prior year&apos;s federal adjusted gross
          income was over $150,000 ($75,000 if married filing separately).
          There is no estimated-tax requirement at all if you had no tax
          liability for the preceding twelve-month year.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* MARYLAND                                                            */
/* ------------------------------------------------------------------ */

function MarylandContent() {
  const mdSlug = "maryland-paycheck-calculator";
  const mdRows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(mdSlug, gross);
    const taxable = taxableWithExemption(mdSlug, gross);
    const county = mdCountyTax(taxable, 3.2);
    const state = r.annualState ?? 0;
    return [
      formatUSD0(gross),
      formatUSD0(taxable),
      formatAmountOrUnavailable(r.annualState),
      formatUSD(county),
      formatUSD(state + county),
    ];
  });
  const mdState = getStateBySlug(mdSlug);
  const mdBrackets = mdState?.brackets ?? [];
  const md60 = examplePaycheck(mdSlug, 60000);
  const md150 = examplePaycheck(mdSlug, 150000);
  const mdTaxable60 = taxableWithExemption(mdSlug, 60000);
  const mdTaxable150 = taxableWithExemption(mdSlug, 150000);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          Maryland tax at real salaries — state plus county, because the county is half the story
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the 2026 standard
          deduction of $3,350 and the $3,200 personal exemption, then
          applies the ten graduated state rates. The exemption phases
          down once federal adjusted gross income exceeds $100,000 — at
          $150,000 it is only{" "}
          {formatUSD(
            150000 - taxableWithExemption(mdSlug, 150000) - 3350,
          )}
          , and the calculator models that phaseout. The county column uses
          Montgomery County&apos;s 3.20% rate on the same taxable income —
          the rate most Marylanders pay — because the county tax is
          withheld from the same paycheck, and at $60,000 it is nearly as
          large as the state tax itself.
        </Para>
        <NoteBox tone="blue">
          <strong>How to read this table:</strong> the state and county
          columns are <strong>annual liability estimates</strong> — what
          you owe for the year, settled on your return. Your real county
          rate depends on where you live, not where you work: Worcester
          County is 2.25%, Dorchester and Kent are 3.30%, and most of the
          state sits at 3.20%. The calculator above the fold shows the
          state tax only — the county tax is not in its estimate.
        </NoteBox>
        <WorkedTable
          caption="Maryland state + Montgomery County tax, single filer, 2026"
          headers={["Gross wages", "MD taxable income", "MD state tax", "County tax (3.20%)", "State + county"]}
          rows={mdRows}
          footnote={`At $60,000 the effective MD state-tax rate is ${effectiveRatePct(md60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(md150.annualState, 150000)}%. The $150,000 row models the personal-exemption phaseout: the $3,200 exemption is ${formatUSD(150000 - taxableWithExemption(mdSlug, 150000) - 3350)} at that income, so the state and county figures are higher than full-exemption arithmetic would give. Every row is generated from the same calculation the calculator above runs, so the state figures match the tool.`}
        />
        <Para>
          The $60,000 row in detail: {bracketWalk(mdTaxable60, mdBrackets)}; total{" "}
          {formatUSD(applyBrackets(mdTaxable60, mdBrackets))}. The first
          three brackets — 2%, 3% and 4% on the first $3,000 of taxable
          income — apply on the annual return only: Maryland law does not
          allow withholding below 4.75%, so your employer withholds at
          4.75% on that slice and the difference comes back on the return.
          The county column is {formatUSD(mdCountyTax(mdTaxable60, 3.2))} at $60,000 and{" "}
          {formatUSD(mdCountyTax(mdTaxable150, 3.2))} at $150,000, both at the 3.20% rate.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Comptroller&apos;s own terms</Eyebrow>
        <SectionTitle>
          Ten brackets on top, a county tax underneath, and a new standard deduction
        </SectionTitle>
        <Para>
          Maryland taxes income on a graduated scale of ten brackets, from
          2% to a top rate of 6.5%. The two top brackets — 6.25% over
          $500,000 and 6.5% over $1,000,000 for single filers — apply for
          tax years beginning after December 31, 2024, so they are not new
          for 2026. A separate 2% surtax on net capital gains applies when
          federal adjusted gross income exceeds $350,000; it does not
          affect wages.
        </Para>
        <Para>
          The standard deduction changed with tax year 2025: the old
          formula — 15% of Maryland adjusted gross income between a
          minimum and a maximum — was repealed and replaced with flat
          amounts of $3,350 for single filers and married filing
          separately, and $6,700 for joint filers, heads of household and
          surviving spouses. Those amounts are indexed for inflation
          starting after 2025, and the final indexed 2026 figure had not
          been published when this page was written: the Comptroller&apos;s
          2026 estimated-tax worksheet still uses $3,350 and $6,700, while
          the 2026 withholding guide uses $3,400 in its withholding
          formula. The calculator uses $3,350. On top of the standard
          deduction, each taxpayer claims a $3,200 personal exemption for
          themselves and each dependent — but the exemption phases down
          once federal adjusted gross income exceeds $100,000, and the
          calculator models that phaseout: at $150,000 the exemption is{" "}
          {formatUSD(150000 - taxableWithExemption(mdSlug, 150000) - 3350)}{" "}
          instead of $3,200.
        </Para>
        <Para>
          Maryland starts from federal adjusted gross income, not federal
          taxable income, so the federal standard deduction never reduces
          Maryland income. And unlike the federal return, Maryland lets you
          take the state standard deduction even if you itemize federally.
          If you do itemize on the Maryland return, your federal itemized
          deductions (minus state and local income taxes) are reduced by
          7.5% of the amount by which federal adjusted gross income exceeds
          $200,000 ($100,000 if married filing separately).
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Local tax · the county layer</Eyebrow>
        <SectionTitle>
          The county tax is not optional, and your employer withholds it with the state tax
        </SectionTitle>
        <Para>
          Every Maryland resident pays a local income tax to the county —
          or Baltimore City — where they live, on the same taxable income
          as the state tax, and the employer withholds it alongside the
          state tax. The 2026 rates run from 2.25% in Worcester County to
          3.30% in Dorchester and Kent counties. Most of the state is at
          3.20%, including Montgomery, Prince George&apos;s, Baltimore City,
          Baltimore County, Howard, Calvert, Caroline, Queen Anne&apos;s, St.
          Mary&apos;s, Somerset and Wicomico counties. Carroll and Charles are
          3.03%, Harford 3.06%, Washington 2.95%, Cecil 2.74%, Garrett
          2.65% and Talbot 2.40%.
        </Para>
        <Para>
          Two counties use graduated local rates. Anne Arundel charges
          2.70% on the first $50,000 of taxable net income, 2.94% to
          $400,000 and 3.20% above that for single filers (joint thresholds
          $75,000 and $480,000). Frederick charges 2.25% to $25,000, 2.75%
          to $50,000, 2.96% to $150,000 and 3.20% above that for single
          filers (joint thresholds $25,000, $100,000 and $250,000).
        </Para>
        <Para>
          The county of residence — the county you write on Form MW507 —
          is what sets the rate, not the county where you work. If you do
          not give your employer an MW507, you are defaulted to the
          highest local rate, 3.30% for 2026. Nonresidents pay no local
          tax at all; instead an additional state tax is withheld at the
          lowest local rate, 2.25% — the Comptroller&apos;s nonresident rate
          works out to 7.0% in total.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form MW507"
        title="MW507: the form that sets your state tax, your exemptions, and your county"
        summary="One form carries your exemptions and your county of residence — get the county wrong and the wrong local rate comes out of every paycheck."
      >
        <Para>
          Maryland withholding is set by Form MW507, the Employee&apos;s
          Maryland Withholding Exemption Certificate — the federal W-4
          sets federal withholding only. The form collects three things
          that matter: your filing status for withholding (Single, Head of
          Household, or Married — with an option to withhold at the single
          rate), the number of personal exemptions you claim, and your
          county of residence. Each exemption is worth $3,200 for
          withholding purposes, and the exemption count is where the
          phaseout bites: if your federal adjusted gross income exceeds
          $100,000 you must reduce the number of exemptions you claim on
          the MW507. The county you enter is the county whose local rate
          your employer withholds — move across a county line and file a
          new MW507, or the wrong rate keeps coming out.
        </Para>
        <Para>
          Two related forms exist for special cases: Form MW507M for a
          military spouse claiming exemption under the Military Spouses
          Residency Relief Act, and Form MW507P for pension and annuity
          withholding elections. And if you live in Pennsylvania, Virginia,
          West Virginia or the District of Columbia and work in Maryland,
          you claim the reciprocal exemption on the MW507 itself — see the
          reciprocity section below.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Reciprocity · PA / VA / WV / DC"
        title="Four neighbours, one form, and a 183-day catch"
        summary="Maryland has reciprocal agreements with Pennsylvania, Virginia, West Virginia and the District of Columbia — wages are taxed only by your home state."
      >
        <Para>
          Maryland maintains reciprocal agreements with Pennsylvania,
          Virginia, West Virginia and the District of Columbia. If you live
          in one of those jurisdictions and work in Maryland, your wages
          are exempt from Maryland tax and withholding — you pay tax on
          them only to your home state, and you claim the exemption on
          Form MW507. The exemption covers wages only: Maryland-source
          business income, rental income or gambling winnings are still
          taxable in Maryland and still require a Maryland return.
        </Para>
        <Para>
          There is one catch, and it does not apply to West Virginia.
          Residents of the District of Columbia, Pennsylvania and Virginia
          are exempt only if they did not maintain a place of abode in
          Maryland for more than six months — 183 days or more — during
          the year. West Virginia residents are exempt on Maryland wages
          regardless of time spent in Maryland. The mirror image holds too:
          a Maryland resident working in one of the four jurisdictions
          pays tax on those wages to Maryland, not to the work state.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing & estimated payments · return-only"
        title="Form 502, Form PV, and the $500 rule"
        summary="The resident return is due April 15, and estimated payments kick in when the tax beyond withholding passes $500. The detail is inside."
      >
        <Para>
          Full-year residents file Form 502, the Maryland Resident Income
          Tax Return, due April 15. Part-year residents file Form 502 as
          well and report only the income earned while a Maryland resident;
          nonresidents file Form 505. Form 502E buys a six-month extension
          to file — to October 15 — but it is an extension to file, not to
          pay: any tax due must still be paid by April 15.
        </Para>
        <Para>
          You must file a declaration of estimated tax (Form PV) if you
          are required to file a Maryland return and your Maryland income
          tax is expected to exceed your Maryland withholding by more than
          $500. The estimate must cover both state and county tax, because
          the Comptroller collects them on the same payment. Four equal
          installments are due April 15, June 15 and September 15, 2026,
          and January 15, 2027; filing the 2026 return and paying in full
          by January 31, 2027 replaces the fourth installment. To avoid
          interest, pay the smaller of 90% of your 2026 Maryland and local
          tax or 110% of your 2025 tax — Maryland applies the 110% figure
          at every income level, unlike the IRS. One special case: if you
          receive $500 or more from awards, prizes, lotteries or raffles
          without Maryland withholding, you must file Form PV with full
          payment within 60 days of receiving it.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* VIRGINIA                                                            */
/* ------------------------------------------------------------------ */

function VirginiaContent() {
  const vaSlug = "virginia-paycheck-calculator";
  const vaRows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(vaSlug, gross);
    return [
      formatUSD0(gross),
      formatUSD0(taxableWithExemption(vaSlug, gross)),
      formatAmountOrUnavailable(r.annualState),
    ];
  });
  const vaState = getStateBySlug(vaSlug);
  const vaBrackets = vaState?.brackets ?? [];
  const va60 = examplePaycheck(vaSlug, 60000);
  const va150 = examplePaycheck(vaSlug, 150000);
  const vaTaxable60 = taxableWithExemption(vaSlug, 60000);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          What Virginia tax looks like at real salaries
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the 2026 standard
          deduction of $8,750 and the $930 personal exemption, then applies
          the four graduated rates. Virginia&apos;s brackets are narrow — the
          top rate of 5.75% starts at just $17,000 of taxable income — so
          most earners pay the top rate on their last dollar, and the
          effective rate climbs slowly from there.
        </Para>
        <NoteBox tone="blue">
          <strong>How to read this table:</strong> the income-tax column
          is your <strong>annual state liability estimate</strong> — what
          you owe for the year, settled on your return. Virginia has no
          local income tax and no employee-paid state disability or paid
          leave deduction, so there is no second state layer to add: this
          column is the whole Virginia bite.
        </NoteBox>
        <WorkedTable
          caption="Virginia income tax, single filer, 2026"
          headers={["Gross wages", "VA taxable income", "VA income tax"]}
          rows={vaRows}
          footnote={`At $60,000 the effective VA income-tax rate is ${effectiveRatePct(va60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(va150.annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          The $60,000 row in detail: {bracketWalk(vaTaxable60, vaBrackets)}; total{" "}
          {formatUSD(applyBrackets(vaTaxable60, vaBrackets))}. Only{" "}
          {formatUSD0(3000)} of that taxable income sits in the 2% bracket and{" "}
          {formatUSD0(2000)} in the 3% bracket — everything above $17,000 of
          taxable income is taxed at 5.75%, which is why Virginia feels
          like a flat tax once you are past entry-level pay.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in Virginia Tax&apos;s own terms</Eyebrow>
        <SectionTitle>
          Four brackets, a doubled standard deduction — and a sunset
        </SectionTitle>
        <Para>
          Virginia taxes income at four graduated rates: 2% to $3,000,
          3% to $5,000, 5% to $17,000 and 5.75% above $17,000 of taxable
          income. The rates and thresholds are not indexed for inflation
          and have not moved in years. What did move is the standard
          deduction: for tax years 2025 and 2026 it is $8,750 for single
          filers and $17,500 for married couples filing jointly, up from
          $8,500 and $17,000. A married person filing separately uses
          $8,750.
        </Para>
        <Para>
          That higher deduction is temporary. Under current law it sunsets
          after tax year 2026 and reverts to $3,000 single and $6,000
          joint unless the General Assembly extends it — roughly a
          third of today&apos;s amount, and about a $330-a-year swing at the
          top rate for a single filer. If you are planning 2027 pay, do
          not assume the $8,750 survives.
        </Para>
        <Para>
          On top of the standard deduction, Virginia gives a $930 personal
          exemption for yourself, your spouse and each dependent, plus
          $800 for each person age 65 or older or blind. Virginia starts
          from federal adjusted gross income with state adjustments, and
          the deduction choice is linked to the federal return: if you
          claimed the standard deduction federally, you must use it on the
          Virginia return too, and if you itemized federally, you itemize
          for Virginia. Virginia has no local income tax — no city or
          county adds an income-tax line to your paycheck — though local
          governments still levy property, meals and business-license
          taxes that have nothing to do with your wages.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form VA-4"
        title="VA-4: count your $930 exemptions — and claim yourself"
        summary="Virginia's own certificate works nothing like the federal W-4. The step-by-step for filling it in is inside."
      >
        <Para>
          Every Virginia employee completes Form VA-4, the Employee&apos;s
          Virginia Income Tax Withholding Exemption Certificate. It has
          three filing-status choices — Single, Married, or Married filing
          a separate return — and the real work is on line 1, the total
          number of exemptions: each personal or dependent exemption is
          worth $930 against your taxable wages, and each age-65-or-older
          or blindness exemption is worth $800. A Personal Exemption
          Worksheet on the form walks you through the count: line 1 is
          yourself — write &quot;1&quot; — then your spouse and dependents,
          then the age and blindness lines. Most Virginia employees should
          claim themselves; skipping your own exemption means voluntarily
          over-withholding state tax from every paycheck. Line 2 lets you
          ask for an additional flat dollar amount withheld each pay
          period, which is useful if you have freelance or other income
          with no withholding.
        </Para>
        <Para>
          If you never file a VA-4, your employer must withhold as if you
          claimed single status with zero exemptions — the maximum
          withholding. Line 3 is the exemption from withholding: you can
          claim it only if you owed no Virginia tax last year and expect
          to owe none this year, and the form sets income thresholds of
          $11,950 for single filers and $23,900 for married couples filing
          jointly for that claim. The same line 3 is where residents of
          reciprocity states certify their exemption — see below. If you
          itemize and your itemized deductions exceed the standard
          deduction, convert the excess into additional exemptions by
          dividing it by $930.
        </Para>
        <Para>
          The withholding math itself is published in the Department of
          Taxation&apos;s Employer Withholding Instructions: annualize the
          wages, subtract the $8,750 standard deduction, $930 per personal
          or dependent exemption and $800 per age-65 or blindness
          exemption, apply the 2% / 3% / 5% / 5.75% brackets, round the
          annual tax to the whole dollar and divide by the number of pay
          periods. Supplemental wages — bonuses and commissions — are
          withheld at a flat 5.75%.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Reciprocity · DC / KY / MD / PA / WV"
        title="Five neighbours, two different tests — and the VA-4 is the switch"
        summary="Virginia has reciprocity with the District of Columbia, Kentucky, Maryland, Pennsylvania and West Virginia. Wages are taxed only by your home state."
      >
        <Para>
          Virginia has income tax reciprocity agreements with the District
          of Columbia, Kentucky, Maryland, Pennsylvania and West Virginia.
          If you live in one of those places and work in Virginia, you owe
          Virginia income tax only on non-wage income — your wages are
          taxed by your home state alone, and you are exempt from Virginia
          filing requirements for those wages. The conditions differ by
          home state. District of Columbia and Kentucky residents qualify
          if they commute to Virginia daily and their only Virginia income
          is wages or salary. Maryland, Pennsylvania and West Virginia
          residents qualify only if they are present in Virginia for 183
          days or fewer during the year, do not maintain a home or
          apartment in Virginia, and their only Virginia income is wages
          or salary.
        </Para>
        <Para>
          The exemption is claimed on Form VA-4, line 3, given to your
          Virginia employer — and it must be re-certified every calendar
          year. If Virginia tax was withheld when you were actually exempt,
          correct the withholding going forward with an updated VA-4 and
          file Form 763-S to claim a refund. The mirror image matters too:
          a Virginia resident working in one of the five jurisdictions
          should ask the out-of-state employer to withhold Virginia tax
          instead; if the employer will not, ask for no withholding and
          make Virginia estimated payments yourself. And one asymmetry to
          know: Virginia gives its residents no credit for income taxes
          paid to Arizona, California, the District of Columbia, Maryland,
          New Mexico or West Virginia — reciprocity, not a credit, is the
          mechanism for those states. Virginia has no reciprocity with
          North Carolina or Tennessee.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing & estimated payments · return-only"
        title="Form 760 is due May 1 — not April 15"
        summary="The resident return, the $150 estimated-tax threshold, and Virginia's unusual first installment date. The detail is inside."
      >
        <Para>
          Virginia individual income tax returns — Form 760 for residents,
          Form 763 for nonresidents, Form 760PY for part-year residents —
          are due May 1, not April 15. For the 2026 tax year the deadline
          is May 3, 2027, because May 1 falls on a Saturday. Virginia
          grants an automatic six-month extension to all filers, but it is
          an extension to file, not to pay: you must pay at least 90% of
          the tax you owe by the original May 1 deadline.
        </Para>
        <Para>
          If your expected Virginia tax liability after withholding and
          credits exceeds $150, you must make quarterly estimated payments
          on Form 760ES. The due dates are May 1, June 15 and September 15,
          2026, and January 15, 2027 — note the first installment is due
          May 1, not April 15, which is Virginia&apos;s other break from the
          federal calendar. Payments must be made electronically if any
          single payment exceeds $1,500 or the sum of all payments is
          expected to exceed $6,000.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* WEST VIRGINIA                                                       */
/* ------------------------------------------------------------------ */

function WestVirginiaContent() {
  const wvSlug = "west-virginia-paycheck-calculator";
  const wvBrackets = getStateBySlug(wvSlug)?.brackets ?? [];
  const wvRows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(wvSlug, gross);
    return [
      formatUSD0(gross),
      formatUSD0(stateTaxableIncome(wvSlug, gross)),
      formatAmountOrUnavailable(r.annualState),
    ];
  });
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          What West Virginia tax looks like at real salaries — after the 2026 rate cut
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the $2,000 personal
          exemption, then applies the five graduated rates. The rates in
          this table are the 2026 rates after Senate Bill 392: 2.11% to
          4.58%, a 5% cut to every bracket, signed March 31, 2026 and
          retroactive to January 1, 2026.
        </Para>
        <WorkedTable
          caption="West Virginia income tax (SB 392 rates), single filer, 2026"
          headers={["Gross wages", "WV taxable income", "WV income tax"]}
          rows={wvRows}
          footnote={`West Virginia has no standard deduction as such: the $2,000 subtracted here is the personal exemption claimed on Form IT-104. Rates are 2.11% to $10,000, 2.81% to $25,000, 3.16% to $40,000, 4.22% to $60,000 and 4.58% above. Figures are computed from the SB 392 schedule with the same bracket arithmetic the calculator uses.`}
        />
        <Para>
          The $60,000 row in detail: {bracketDetailText(wvSlug, 60000, wvBrackets)}; total{" "}
          {formatAmountOrUnavailable(EX_WV_60.annualState)}.
          Paychecks from the first half of 2026 were withheld at the old
          rates — the Tax Division issued new withholding tables when SB
          392 took effect on June 12, 2026 — so a full-year 2026 return
          at the new rates will usually show a somewhat larger refund than
          the withholding alone suggests.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Tax Division&apos;s own terms</Eyebrow>
        <SectionTitle>
          Five brackets, a $2,000 exemption, and a rate cut that keeps coming back
        </SectionTitle>
        <Para>
          West Virginia taxes income on a graduated scale of five brackets,
          with breaks at $10,000, $25,000, $40,000 and $60,000 of taxable
          income. The 2026 rates are 2.11%, 2.81%, 3.16%, 4.22% and 4.58%
          — every rate 5% lower than the 2025 schedule under Senate Bill
          392. This is part of an ongoing series of reductions: the top
          rate was 5.12% before the 2025 cut and 4.82% after it. Further
          cuts depend on a revenue trigger the state assesses each August
          for the following January, so the schedule is not guaranteed to
          stay put.
        </Para>
        <Para>
          West Virginia does not give you a standard deduction. What it
          gives you is a $2,000 personal exemption for yourself and each
          dependent, claimed on Form IT-104 — that is the $2,000 subtracted
          in the worked examples. Married couples filing separately use a
          compressed version of the same schedule, with each bracket
          threshold roughly halved ($5,000, $12,500, $20,000 and $30,000);
          the rates themselves stay the same. West Virginia starts from
          federal adjusted gross income and applies state-specific
          adjustments to reach West Virginia taxable income.
        </Para>
        <Para>
          What West Virginia does not tax: starting with the 2026 tax year,
          Social Security benefits are fully exempt from West Virginia
          income tax for all recipients, regardless of income. That
          completes a multi-year phase-in — taxpayers with federal adjusted
          gross income at or below $50,000 (single) or $100,000 (joint)
          have had a 100% subtraction since 2022, while those above those
          thresholds got 35% in 2024 and 65% in 2025 before reaching 100%
          in 2026.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form IT-104"
        title="IT-104: exemptions, two table sets, and a line that expires every New Year's Eve"
        summary="West Virginia still uses numbered exemptions, and your employer defaults to the faster two-earner tables unless you tell them otherwise."
      >
        <Para>
          Form WV/IT-104, the Employee&apos;s Withholding Exemption
          Certificate, tells your West Virginia employer how much state
          income tax to withhold. Unlike the federal W-4, which dropped
          the allowance system in 2020, West Virginia still uses numbered
          exemptions: each exemption you claim reduces your taxable wages
          by $2,000 a year for withholding purposes ($76.92 per biweekly
          paycheck), so the count directly affects your take-home pay.
        </Para>
        <Para>
          The Tax Division publishes two withholding table sets, and the
          default is the expensive one. Every employee is withheld on the
          two-earner / two-or-more-jobs tables — built for married couples
          who both work and people with two jobs — unless you check line 5
          of the IT-104 to use the lower one-earner tables. If you are
          single, head of household, or married with a spouse who does
          not work, and you have only one job, check line 5. The
          two-earner tables step up from 2.11% to 2.81% once taxable pay
          passes a much lower threshold, so the same salary is withheld
          differently depending on which set your employer uses.
        </Para>
        <Para>
          At the bottom of the form is a claim of complete exemption from
          withholding. To qualify you must certify two things: you had no
          West Virginia tax liability last year, and you expect none this
          year. That claim expires at the end of each calendar year — you
          must submit a fresh IT-104 by February 15 of the following year
          to keep the exemption in place, or your employer will begin
          withholding at the default rate.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Reciprocity · KY / MD / OH / PA / VA"
        title="Five neighbours, one certificate — and a 30-day rule for everyone else"
        summary="West Virginia has reciprocal agreements with Kentucky, Maryland, Ohio, Pennsylvania and Virginia. File the certificate and only your home state taxes your wages."
      >
        <Para>
          West Virginia has reciprocal tax agreements with Kentucky,
          Maryland, Ohio, Pennsylvania and Virginia. If you live in one of
          those states and work in West Virginia, your employer does not
          need to withhold West Virginia tax from your wages — but Form
          WV/IT-104 must still be on file with the employer claiming the
          exemption. The agreement covers wages and salaries only: other
          West Virginia-source income, such as rental income from property
          in the state, is still taxable in West Virginia. If you move to
          West Virginia or otherwise lose your nonresident status, you
          must notify your employer within 10 days so withholding can
          begin.
        </Para>
        <Para>
          There is a separate rule for nonresidents from states without an
          agreement: West Virginia does not require withholding for a
          nonresident employee who works in the state for 30 days or fewer
          during the year, provided the work was performed in more than one
          state and the employee is not a professional athlete,
          entertainer or public figure.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing & local taxes"
        title="Form IT-140, and the local taxes the state tables do not cover"
        summary="The resident return, and what to do about a city line on your pay stub."
      >
        <Para>
          West Virginia&apos;s resident individual income tax return is Form
          IT-140, due April 15. Some West Virginia localities levy their
          own payroll or wage taxes, separate from state withholding — the
          calculator does not model them, and the Tax Division&apos;s
          withholding tables do not include them. If a city line appears
          on your pay stub, it comes from the city, not the state, and the
          rate and rules are the city&apos;s own: no verified statewide list
          of localities and rates was published on a Tax Division page we
          could open, so none is stated here.
        </Para>
        <Para>
          On estimated payments, the same honesty applies: the Tax
          Division&apos;s estimated-tax threshold for 2026 was not published
          on a page we could open, so no threshold is stated here. If you
          have income with no West Virginia withholding — self-employment,
          rental, investment income — check Form IT-140ES before assuming
          you owe nothing until April.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* NORTH CAROLINA                                                      */
/* ------------------------------------------------------------------ */

function NorthCarolinaContent() {
  const ncSlug = "north-carolina-paycheck-calculator";
  const ncRows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(ncSlug, gross);
    return [
      formatUSD0(gross),
      formatUSD0(stateTaxableIncome(ncSlug, gross)),
      formatAmountOrUnavailable(r.annualState),
    ];
  });
  const nc60 = examplePaycheck(ncSlug, 60000);
  const nc150 = examplePaycheck(ncSlug, 150000);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          What North Carolina tax looks like at real salaries
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the 2026 standard
          deduction of $12,750, and applies the single flat rate of 3.99%
          to everything that remains. There are no brackets to climb and no
          marginal-rate surprises: a household earning $40,000 and one
          earning $400,000 pay the same percentage, though the standard
          deduction shields a larger share of the smaller paycheck.
        </Para>
        <NoteBox tone="blue">
          <strong>How to read this table:</strong> the income-tax column
          is your <strong>annual state liability estimate</strong> — what
          you owe for the year, settled on your return. Your employer
          withholds at a slightly higher rate — 4.09%, the 3.99% rate plus
          a 0.1% cushion required by state law — so withholding usually
          runs a little ahead of liability and a small refund at filing
          time is normal. North Carolina has no local income tax, so there
          is no second layer to add.
        </NoteBox>
        <WorkedTable
          caption="North Carolina income tax, single filer, 2026"
          headers={["Gross wages", "NC taxable income", "NC income tax"]}
          rows={ncRows}
          footnote={`At $60,000 the effective NC income-tax rate is ${effectiveRatePct(nc60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(nc150.annualState, 150000)}%. The $12,750 standard deduction is fixed by statute, not indexed for inflation, and has been unchanged since the 2022 tax year. Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          The $60,000 row in detail: taxable income of{" "}
          {formatUSD0(stateTaxableIncome(ncSlug, 60000))} × 3.99% ={" "}
          {formatAmountOrUnavailable(nc60.annualState)}. The first $12,750 of
          pay carries no North Carolina tax at all — which is why the
          effective rate at $30,000 is barely above 2% while the statutory
          rate is 3.99%.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department of Revenue&apos;s own terms</Eyebrow>
        <SectionTitle>
          One rate, falling every year — and a deduction that never moves
        </SectionTitle>
        <Para>
          North Carolina taxes every dollar of state taxable income at a
          single flat rate of 3.99% for tax years beginning after 2025,
          under Session Law 2023-134. The rate has fallen every year since
          2022: 4.99% in 2022, 4.75% in 2023, 4.50% in 2024, 4.25% in 2025
          and 3.99% in 2026. Additional reductions may take effect
          beginning in 2027 if revenue triggers set by the General
          Assembly are met — the rate could fall by half a percentage
          point a year toward a 2.49% floor — but those are triggers, not
          promises, so plan with 3.99%.
        </Para>
        <Para>
          Before the rate applies you subtract either the North Carolina
          standard deduction or North Carolina itemized deductions from
          federal adjusted gross income. The standard deduction is $12,750
          for single filers, $25,500 for married filing jointly or a
          surviving spouse, $19,125 for head of household, and $12,750 for
          married filing separately (or $0 if your spouse itemizes). Unlike
          the federal return, North Carolina gives no additional standard
          deduction for taxpayers age 65 or older or blind. You may itemize
          on the state return only if you also itemize on your federal
          return. North Carolina has no local income tax: no county, city
          or municipality levies its own income tax on residents or
          workers.
        </Para>
        <Para>
          What North Carolina does not tax: Social Security benefits are
          fully exempt, and certain government pensions are exempt under
          the Bailey settlement — for federal, state and local government
          retirees who had five years of service by August 12, 1989. Those
          are subtractions on the return, not withholding adjustments, so
          they do not appear in the wages-only examples above.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form NC-4"
        title="NC-4: allowances, a worksheet, and a 50% penalty for making them up"
        summary="North Carolina still uses allowances — and the worksheet, not a guess, decides how many you get."
      >
        <Para>
          Your employer withholds North Carolina tax based on the Form
          NC-4 you fill out. The withholding formula subtracts the
          standard deduction and $2,500 for each allowance you claim, then
          applies the 4.09% withholding rate. The number of allowances
          comes from the NC-4 Allowance Worksheet, which works through
          your federal and North Carolina adjustments to income, the North
          Carolina child deduction amount, North Carolina itemized
          deductions and North Carolina tax credits — do not guess the
          number. If you do not submit an NC-4 at all, your employer must
          withhold as if your filing status is Single with no allowances.
        </Para>
        <Para>
          There is a short form for simple cases: you may use Form NC-4 EZ
          if you plan to claim the North Carolina standard deduction, plan
          to claim the child deduction amount (but no other North Carolina
          deductions), do not plan to claim North Carolina tax credits, or
          qualify to claim exempt status. Nonresident aliens must use Form
          NC-4 NRA instead. All NC-4 forms are subject to review by the
          Department of Revenue, and your employer may be required to send
          yours in: if you furnish a certificate with information that has
          no reasonable basis and it results in less tax being withheld
          than should have been, you are subject to a penalty of 50% of
          the amount not properly withheld. Give your employer a new NC-4
          when your allowances change — a child, a marriage, a second job —
          rather than waiting for the refund or the bill to sort it out.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Credits & deductions · return-only"
        title="The North Carolina child deduction — a deduction, not a credit"
        summary="Parents subtract up to $3,000 per qualifying child on top of the standard deduction. The amount depends on income and filing status."
      >
        <Para>
          A taxpayer who is allowed the federal child tax credit is
          allowed a North Carolina child deduction for each qualifying
          child under 17 on the last day of the year. It is a deduction
          from income, not a credit against tax — so the saving is the
          deduction times the 3.99% flat rate, at most $3,000 × 3.99% =
          $119.70 per child per year, not $3,000. The deduction per child
          falls in $500 steps as adjusted gross income rises. For a
          single filer (G.S. § 105-153.5(a1)): AGI up to $20,000 →
          $3,000; $20,001–$30,000 → $2,500; $30,001–$40,000 → $2,000;
          $40,001–$50,000 → $1,500; $50,001–$60,000 → $1,000;
          $60,001–$70,000 → $500; above $70,000 → $0. Married filing
          jointly gets the full $3,000 up to $40,000 of AGI and nothing
          above $140,000; head of household, the full $3,000 up to
          $30,000 and nothing above $105,000. The calculator&apos;s
          worked examples are wages-only with no children, so the
          deduction is not in them; it is claimed on the annual return,
          and it also feeds into the NC-4 worksheet, so claiming it
          usually means more allowances and less withholding during the
          year.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing & estimated payments · return-only"
        title="Form D-400, due April 15 — and the $1,000 estimated-tax rule"
        summary="You must file if your gross income exceeds the standard deduction for your filing status. Estimated payments use Form NC-40."
      >
        <Para>
          The North Carolina individual income tax return is Form D-400,
          due April 15 for calendar-year filers. You must file if your
          gross income exceeds the standard deduction for your filing
          status — for a single filer, any gross income above $12,750
          triggers a filing requirement.
        </Para>
        <Para>
          If you are self-employed or have income with no withholding, you
          pay the state directly in four installments using Form NC-40.
          Estimated payments are required when you expect to owe $1,000 or
          more for the year, and for 2026 income they are due April 15,
          June 15 and September 15, 2026, and January 15, 2027. If you
          receive nonwage income such as interest or dividends, the NC-4
          instructions themselves point you to Form NC-40 to avoid owing
          interest on the underpayment.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* SOUTH CAROLINA                                                      */
/* ------------------------------------------------------------------ */

function SouthCarolinaContent() {
  const scSlug = "south-carolina-paycheck-calculator";
  const scRows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(scSlug, gross);
    return [
      formatUSD0(gross),
      formatUSD0(engineTaxableIncome(scSlug, gross)),
      formatAmountOrUnavailable(r.annualState),
    ];
  });
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          What South Carolina tax looks like at real salaries — under the new 2026 law
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the new South
          Carolina Income Adjusted Deduction — $15,000 for a single
          filer, phased down as income rises under SCDOR Information
          Letter #26-20 — then applies the H. 4216 rates: 1.99% on income
          under $30,000, and 5.21% minus $966 on income of $30,000 and
          above. The $966 keeps the two halves continuous — at exactly
          $30,000 of income both formulas give the same $597.
        </Para>
        <WorkedTable
          caption="South Carolina income tax under H. 4216, single filer, 2026"
          headers={["Gross wages", "SC income after SCIAD", "SC income tax"]}
          rows={scRows}
          footnote={`All three rows are generated from the same calculation the calculator above runs, which models the SCIAD phaseout: the deduction is ${formatUSD0(30000 - engineTaxableIncome(scSlug, 30000))} at $30,000, ${formatUSD0(60000 - engineTaxableIncome(scSlug, 60000))} at $60,000, and ${formatUSD0(150000 - engineTaxableIncome(scSlug, 150000))} at $150,000 — not the full $15,000 at every income.`}
        />
        <Para>
          The $60,000 row in detail: income after the SCIAD is{" "}
          {formatUSD0(engineTaxableIncome(scSlug, 60000))} — the $15,000
          deduction phases down to{" "}
          {formatUSD0(60000 - engineTaxableIncome(scSlug, 60000))} at this
          pay — 5.21% of that is{" "}
          {formatUSD((engineTaxableIncome(scSlug, 60000) * 5.21) / 100)}, minus $966 ={" "}
          {formatAmountOrUnavailable(EX_SC_60.annualState)}. At $30,000 the whole story is
          different: income after the SCIAD is {formatUSD0(engineTaxableIncome(scSlug, 30000))},
          taxed at 1.99% = {formatAmountOrUnavailable(EX_SC_30.annualState)} — the new law is
          worth far more to a lower earner than the old 3% middle bracket
          was.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · H. 4216, in the SCDOR&apos;s own terms</Eyebrow>
        <SectionTitle>
          South Carolina rebuilt its income tax for 2026 — two rates, a new deduction, no federal link
        </SectionTitle>
        <Para>
          On March 30, 2026, Governor Henry McMaster signed H. 4216 into
          law, effective beginning with the 2026 tax year, with returns due
          April 15, 2027. The bill replaces the old three-bracket schedule
          (0%, 3% and a top rate that had been falling from 7% since 2021)
          with two rates: 1.99% on income less than $30,000, and 5.21% on
          income from $30,000 and above, minus $966. The old top rate was
          6% through June 30, 2026 under a temporary budget reduction and
          had been scheduled to revert to 6.2% on July 1 — H. 4216
          supersedes that for the 2026 return.
        </Para>
        <Para>
          The bill also decouples South Carolina from the federal standard
          and itemized deductions. Federal adjusted gross income is now the
          starting point for the South Carolina return, and a new South
          Carolina Income Adjusted Deduction (SCIAD) replaces the federal
          standard deduction: $15,000 for single or married-filing-separately
          filers, $22,500 for head of household, and $30,000 for married
          filing jointly or a surviving spouse. Those amounts are reduced
          based on income: under SCDOR Information Letter #26-20 (August
          31, 2026), the single-filer SCIAD phases out between $40,000 and
          $95,000 of adjusted gross income, reaching $0 at $95,000, with
          the reduction rounded down to the next $10 — and the calculator
          models that phaseout. The bill further limits South Carolina&apos;s
          earned income tax credit to $200, and mandates that the top rate
          will be reduced further if the Board of Economic Advisors
          projects revenue collections will increase by 5% or more
          from the previous fiscal year — the reduction cannot decrease
          revenue by more than $200 million, and the Board decides the new
          rate no later than February 15 of each year.
        </Para>
        <Para>
          What South Carolina does not tax: Social Security benefits are
          completely exempt. No South Carolina county or municipality levies
          an income tax, so the state rate is the only income tax a resident
          faces.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form SC W-4"
        title="SC W-4: allowances worth $5,000 each — and guidance still coming"
        summary="The 2026 withholding formula predates H. 4216. What it says, and what is still unsettled, is inside."
      >
        <Para>
          South Carolina withholding is set by Form SC W-4, the
          Employee&apos;s Withholding Allowance Certificate. The 2026
          withholding formula published by the Department of Revenue works
          off allowances, not the return&apos;s brackets: your employer
          subtracts a personal allowance of $5,000 for each allowance you
          claim on the SC W-4, and — if you claim any allowance at all — a
          standard deduction of 10% of gross wages, capped at $7,500. The
          remainder is taxed at 0% to $3,639, 3% to $18,229 and 6% above
          that, under the withholding tables published before H. 4216 was
          signed.
        </Para>
        <Para>
          That is the tension in this page. The withholding formula and
          tables were published in late 2025, months before H. 4216 was
          signed on March 30, 2026, and the Department said it would
          &quot;provide guidance as needed later this year through our website
          and social media channels.&quot; Until that guidance lands, your
          paycheck withholding follows the old formula while your 2026
          return follows H. 4216 — so a gap between what was withheld and
          what the return says you owe is expected this year, in either
          direction, and it is not an error on your employer&apos;s part.
          Check the SCDOR site before filing rather than assuming the
          withholding tables match the return.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing & estimated payments"
        title="Form SC-1040, due April 15, 2027"
        summary="The 2026 return, and the estimated-payment question we could not close from an official page."
      >
        <Para>
          The South Carolina individual income tax return is Form SC-1040.
          The 2026 return — the first under H. 4216 — is due April 15,
          2027. H. 4216 does not touch 2025 returns. Estimated payments use
          Form SC-1040ES, in the usual four quarterly installments.
        </Para>
        <Para>
          On the estimated-payment threshold, the same honesty as the
          worked examples: the Department&apos;s 2026 threshold was not
          published on an SCDOR page we could open, so no threshold is
          stated here. If you have income with no South Carolina
          withholding — self-employment, rental, investment income — check
          Form SC-1040ES before assuming you owe nothing until April. The
          same applies to the old retirement-income deductions ($10,000
          under 65, $15,000 at 65 and over): whether they survive under
          H. 4216 was not confirmed on an SCDOR page we could open, so
          they are not claimed in this guide.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* GEORGIA                                                             */
/* ------------------------------------------------------------------ */

function GeorgiaContent() {
  const gaSlug = "georgia-paycheck-calculator";
  const gaRows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(gaSlug, gross);
    return [
      formatUSD0(gross),
      formatUSD0(stateTaxableIncome(gaSlug, gross)),
      formatAmountOrUnavailable(r.annualState),
    ];
  });
  const ga60 = examplePaycheck(gaSlug, 60000);
  const ga150 = examplePaycheck(gaSlug, 150000);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          What Georgia tax looks like at real salaries
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the 2026 standard
          deduction of $15,000, and applies the single flat rate of 4.99%
          to everything that remains. Georgia&apos;s standard deduction is
          now one of the largest of any flat-tax state — it wipes the state
          tax off the first $15,000 of a single filer&apos;s pay entirely.
        </Para>
        <NoteBox tone="blue">
          <strong>How to read this table:</strong> the income-tax column
          is your <strong>annual state liability estimate</strong> — what
          you owe for the year, settled on your return. Your early-2026
          pay stubs will not match it exactly: employers had to keep
          withholding at the old 5.19% rate until House Bill 463 was signed
          on May 11, 2026, and could switch to the new 4.99% tables only
          from that date. A full-year 2026 return is taxed at 4.99%
          throughout, so the over-withholding from the first months comes
          back on the return. Georgia has no local income tax.
        </NoteBox>
        <WorkedTable
          caption="Georgia income tax, single filer, 2026"
          headers={["Gross wages", "GA taxable income", "GA income tax"]}
          rows={gaRows}
          footnote={`At $60,000 the effective GA income-tax rate is ${effectiveRatePct(ga60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(ga150.annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          The $60,000 row in detail: taxable income of{" "}
          {formatUSD0(stateTaxableIncome(gaSlug, 60000))} × 4.99% ={" "}
          {formatAmountOrUnavailable(ga60.annualState)}. At $150,000 the same
          arithmetic gives {formatAmountOrUnavailable(ga150.annualState)} — the flat
          rate means the tax is a fixed share of taxable income at every
          level, and only the $15,000 standard deduction makes the
          effective rate lower than the statutory one.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · House Bill 463, in the Department of Revenue&apos;s own terms</Eyebrow>
        <SectionTitle>
          A flat 4.99%, a $15,000 standard deduction, and a cut that arrived mid-year
        </SectionTitle>
        <Para>
          Georgia taxes income at a single flat rate of 4.99% for 2026.
          House Bill 463, signed May 11, 2026 and retroactive to January 1,
          cut the rate from 5.19% and raised the standard deduction to
          $15,000 for single, head-of-household and married-filing-separately
          filers and $30,000 for married filing jointly — reaching the
          4.99% target three years ahead of the original schedule. The same
          law schedules further cuts of 0.125 percentage points a year from
          2027 until the rate reaches 3.99%, but each cut happens only if
          state revenue tests are met, so plan with 4.99% and treat later
          cuts as possible, not certain.
        </Para>
        <Para>
          Georgia starts from federal adjusted gross income with state
          adjustments, then subtracts the standard deduction. There are no
          personal exemptions for yourself or your spouse — those ended
          after December 31, 2023 — but there is a dependent exemption of
          $5,000 per dependent for 2026, up from $4,000. Georgia has no
          reciprocity agreement with any state, so a Georgia resident who
          works across a state line files a nonresident return there and
          claims a resident credit in Georgia, and a nonresident who works
          in Georgia files a Georgia nonresident return.
        </Para>
        <Para>
          What Georgia does not tax: Social Security benefits and railroad
          retirement income are completely exempt from Georgia income tax,
          subtracted on Schedule 1 of Form 500. Georgia also has no local
          income tax.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form G-4"
        title="G-4: four letters, two standard deductions, and $5,000 per allowance"
        summary="Georgia's certificate is a status letter plus a count of allowances. Which letter you are decides whether the deduction is $15,000 or $30,000."
      >
        <Para>
          Georgia employees set state withholding on Form G-4, the
          Employee&apos;s Withholding Allowance Certificate. The form has four
          statuses. Single is letter A, married with both spouses working
          or filing separately is B, married filing jointly with one spouse
          working is C, and head of household is D. The standard deduction
          in the withholding formula is $15,000 a year for A, B and D — and
          for a married worker whose spouse also works — but $30,000 for C,
          the married worker whose spouse does not work. On a biweekly
          paycheck the $15,000 deduction is $576.92 a period. On top of
          the deduction, each allowance on the G-4 subtracts a $5,000
          dependent allowance a year before the 4.99% rate applies.
        </Para>
        <Para>
          The current form is dated June 3, 2026 and already uses the
          $15,000 and $30,000 deductions. Because the law changed mid-year,
          the Department of Revenue told employers to keep withholding at
          5.19% with the old deductions before May 11, 2026 and allowed
          them to use the new 4.99% tables, with the larger standard
          deduction and $5,000 dependent allowance, starting May 11. So
          year-to-date withholding on a 2026 pay stub is a blend of the two
          regimes, and the annual-liability figure in the table above is
          the one the return will use.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Exclusions · return-only"
        title="Georgia's retirement income exclusion: up to $65,000 per person"
        summary="At 62 the exclusion is $35,000; at 65 it is $65,000 — per taxpayer, not per return. Claimed on Schedule 1 of Form 500."
      >
        <Para>
          Georgia&apos;s retirement income exclusion is the single most
          important tax break Georgia offers retirees, and it works as a
          straight subtraction from federal adjusted gross income before
          the 4.99% rate applies. The maximum exclusion depends on your age
          on December 31 of the tax year: up to $35,000 per taxpayer at age
          62 to 64 (or under 62 and permanently and totally disabled), and
          up to $65,000 per taxpayer at age 65 or older. It applies per
          taxpayer, not per return — a married couple both 65 or older
          could keep up to $130,000 of retirement income free of Georgia
          tax. Qualifying income includes pensions, annuities, IRA
          distributions, interest, dividends, capital gains, net rental
          income and royalties; earned income such as wages counts toward
          the exclusion only up to $4,000.
        </Para>
        <Para>
          The exclusion is not automatic. You claim it by completing the
          retirement income worksheet on Schedule 1 of Georgia Form 500,
          the state individual income tax return — the worksheet lists your
          earned income (capped at $4,000), then your unearned retirement
          income, compares the total against the $35,000 or $65,000 limit
          for your age, and enters the lesser amount. There is also a
          separate military retirement exclusion of up to $17,500 under age
          62, or $35,000 under 62 with earned income over $17,500. None of
          this affects a wages-only paycheck: the worked examples above are
          wages with no retiree claiming the exclusion, so the exclusion is
          not in them.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing & estimated payments · return-only"
        title="Form 500, due April 15 — and the $1,000 estimated-tax test"
        summary="Georgia's estimated-tax rule is written as a test on your income, not on the tax you owe. The detail is inside."
      >
        <Para>
          Georgia&apos;s individual income tax return is Form 500, due April
          15. Estimated tax uses Form 500-ES, and the Department&apos;s test
          for who must file it is written on the form itself: each
          individual subject to Georgia income tax who reasonably expects
          gross income during the year that exceeds applicable exemptions,
          plus estimated deductions, plus $1,000 of income not subject to
          withholding. Pay in full with the first required installment or
          in equal installments on or before April 15, June 15 and
          September 15, 2026, and January 15, 2027. Farmers and fishermen
          whose gross income from farming or fishing is at least two-thirds
          of the total may instead file their return by March 1 and pay
          the full amount due by that date.
        </Para>
        <Para>
          You can generally avoid the underpayment penalty by paying at
          least 100% of your prior year&apos;s Georgia tax liability through
          withholding and estimated payments, or 90% of the current
          year&apos;s. Willful failure to pay estimated tax is a misdemeanor
          under Georgia law. One administrative note: the 500-ES form
          itself still prints the 2025 exemption amounts ($12,000 single /
          $24,000 joint standard deduction, $4,000 dependent exemption) in
          its amounts box — the 2026 figures in this guide ($15,000 /
          $30,000 and $5,000) come from the Department&apos;s 2026
          Employer&apos;s Withholding Tax Guide, revised June 2026.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* FLORIDA                                                             */
/* ------------------------------------------------------------------ */

function FloridaContent() {
  const flSlug = "florida-paycheck-calculator";
  const flRows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(flSlug, gross);
    return [
      formatUSD0(gross),
      formatUSD(r.annualFederal),
      formatUSD(r.annualSocialSecurity),
      formatUSD(r.annualMedicare),
      formatAmountOrUnavailable(r.annualState),
      formatUSD(r.annualNet),
    ];
  });
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · every income level</Eyebrow>
        <SectionTitle>
          Florida state income tax is $0 — and here is the whole paycheck
        </SectionTitle>
        <Para>
          There is no Florida rate to apply, no Florida standard deduction
          to subtract, and no Florida bracket to climb. The state income-tax
          line is $0 at every wage, so the only taxes on a Florida paycheck
          are the federal ones.
        </Para>
        <NoteBox tone="blue">
          <strong>Annual figures:</strong> federal income tax, Social
          Security, and Medicare are the same in every state for the same
          pay — only the state column changes, and Florida keeps it at $0.
          Take-home pay is what is left after all of them.
        </NoteBox>
        <WorkedTable
          caption="Florida take-home pay, single filer, 2026 — annual"
          headers={["Gross wages", "Federal income tax", "Social Security", "Medicare", "Florida state tax", "Take-home pay"]}
          rows={flRows}
          footnote={`The comparison is the point: the same $60,000 single filer owes ${formatAmountOrUnavailable(EX_CA_60.annualState)} a year in California and ${formatAmountOrUnavailable(EX_NY_60_STATE.annualState)} in New York State (before New York City tax) — $0 in Florida. Federal tax is identical in all three states for the same W-4.`}
        />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>What $0 means in practice</Eyebrow>
        <SectionTitle>
          No Florida form, return, or pay-stub line — because the constitution forbids it
        </SectionTitle>
        <Para>
          Florida&apos;s zero is not a legislative choice that could flip with
          the next election. Article VII, Section 5 of the Florida
          Constitution prohibits a tax on the income of natural persons who
          are residents or citizens of the state, and imposing one would
          require a constitutional amendment approved by 60% of voters. The
          Department of Revenue puts it plainly in its own guidance for new
          residents: Florida does not impose personal income tax,
          inheritance tax, gift taxes, or tax on intangible personal
          property.
        </Para>
        <Para>
          That has three practical consequences. First, there is no Florida
          equivalent of Maryland&apos;s MW507 or Virginia&apos;s VA-4: a Florida
          worker fills in only the federal Form W-4, and there is no state
          withholding form to get wrong. Second, there is no Florida
          income-tax return to file and no state estimated payments to
          make, because there is no tax for a return or an estimate to
          cover. Third, your pay stub simply has no state income-tax line —
          nothing is withheld, so nothing appears. All of that applies
          when you live and work in Florida: if you are a Florida resident
          who works in another state, that state can withhold its own
          income tax, and a state line can appear on your pay stub.
        </Para>
        <Para>
          What still comes out is everything federal: federal income tax,
          Social Security at 6.2% up to $184,500 in 2026, and Medicare at
          1.45% plus 0.9% over $200,000. Those apply exactly as in every
          other state, and the calculator above shows them in full. Florida
          has no state disability or paid-leave program either, so there is
          no second state deduction line of any kind — and the
          reemployment (unemployment) tax is paid by employers, not
          withheld from wages.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How Florida pays for things instead</Eyebrow>
        <SectionTitle>
          Sales tax in, property tax up — the honest trade-off
        </SectionTitle>
        <Para>
          Florida funds itself instead through consumption and property
          taxes. The general state sales tax rate is 6%, and most counties
          add a discretionary sales surtax — a local-option tax — of 0.5%
          to 2.5%, levied on the first $5,000 of the purchase price, so the
          combined rate at the register is usually 6.5% to 7.5% depending
          on the county. Unprepared groceries and prescription medications
          are exempt. Use tax at the same 6% applies when you buy a taxable
          item out of state and bring it into Florida for use.
        </Para>
        <Para>
          Property tax is local: the county property appraiser assesses
          your property annually, and counties, cities, school districts
          and special districts set the millage rates. If the property is
          your primary residence, you may qualify for a homestead exemption
          of up to $50,000 from the assessed value — the first $25,000
          applies to all property taxes including school district taxes,
          and an additional exemption of up to $25,000 applies to the
          assessed value between $50,000 and $75,000 but does not reduce
          school district taxes. You must apply with your county property
          appraiser by March 1 of the tax year (Form DR-501), and it does
          not apply automatically. The Save Our Homes amendment separately
          caps the annual increase in a homesteaded property&apos;s assessed
          value at 3% a year, even if market value rises faster. Florida
          also levies a 5.5% corporate income tax — on C-corporation
          profits, not on your wages.
        </Para>
        <Para>
          The counterfactuals make the trade-off concrete. A single filer
          on $75,000 keeps {formatAmountOrUnavailable(EX_CA_75.annualState)} a year
          more than the same filer in California, and{" "}
          {formatAmountOrUnavailable(EX_NY_75_STATE.annualState)} more than in New
          York State (before New York City tax) — but a Florida homeowner
          pays the property tax and the sales tax on nearly everything they
          buy, and there is no state return on which to deduct any of it.
          The $0 state-tax line is real; it is not the whole tax bill.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Moving to Florida"
        title="When does the old state's tax stop?"
        summary="There is nothing to stop in Florida — Florida never charges you. What changes is your old state."
      >
        <Para>
          There is nothing to stop in Florida — Florida never charges you.
          What changes is your old state: it taxes only the income you
          earned while you were its resident, plus its-source income after
          you leave, so you file its part-year or nonresident return for
          that period and nothing for Florida. Moving mid-year does not
          retroactively untax the months you lived elsewhere, and a
          Florida address alone does not make you a Florida resident for
          the old state&apos;s purposes — filing a declaration of domicile,
          qualifying for the homestead exemption, or registering to vote in
          Florida are the steps the Department of Revenue&apos;s new-resident
          guidance lists as establishing residency.
        </Para>
        <Para>
          And the reverse move has the same logic in the other direction:
          leaving Florida for a state with an income tax means that
          state&apos;s withholding starts on your first paycheck there, and
          there is no Florida credit or refund to soften it, because there
          was never any Florida tax to credit. The $0 line is a feature of
          where you live and work, not something you carry with you.
        </Para>
      </ExpandableSection>
    </>
  );
}

export function BatchContent({ slug }: { slug: string }) {
  if (slug === "delaware-paycheck-calculator") return <DelawareContent />;
  if (slug === "maryland-paycheck-calculator") return <MarylandContent />;
  if (slug === "virginia-paycheck-calculator") return <VirginiaContent />;
  if (slug === "west-virginia-paycheck-calculator") return <WestVirginiaContent />;
  if (slug === "north-carolina-paycheck-calculator") return <NorthCarolinaContent />;
  if (slug === "south-carolina-paycheck-calculator") return <SouthCarolinaContent />;
  if (slug === "georgia-paycheck-calculator") return <GeorgiaContent />;
  if (slug === "florida-paycheck-calculator") return <FloridaContent />;
  return null;
}

/* ------------------------------------------------------------------ */
/* FAQs                                                                */
/* ------------------------------------------------------------------ */

export const BATCH_FAQS: Record<string, FaqItem[]> = {
  "delaware-paycheck-calculator": [
    {
      q: "Does Delaware have a state income tax?",
      a: "Yes. Delaware taxes income on a graduated scale in 2026, from 0% on the first $2,000 of taxable income up to a top rate of 6.6% on taxable income over $60,000. Only the dollars inside each bracket are taxed at that bracket's rate, and the same schedule applies to every filing status.",
    },
    {
      q: "What is the standard deduction in Delaware in 2026?",
      a: "The Delaware standard deduction in 2026 is $3,250 for single filers and $6,500 for married filing jointly. Taxpayers who are 65 or older or blind get an additional $2,500 standard deduction each.",
    },
    {
      q: "Does Delaware have its own W-4?",
      a: "Yes. Delaware created its own withholding certificate, Form DE-W4, after the IRS redesigned the federal Form W-4 for 2020 and dropped withholding allowances — Delaware still allows a deduction or personal credit for exemptions, so it needed its own count. An employer may not accept a federal Form W-4 completed in 2020 or later for Delaware withholding; new hires file a DE-W4 instead. A federal W-4 completed before 2020 that is already on file may still be relied on if you do not want to change anything, though withholding is more accurate on the DE-W4.",
    },
    {
      q: "What is the Wilmington wage tax, and do I owe it?",
      a: `Wilmington is the only Delaware municipality with a wage tax: a flat 1.25% on all earned income of city residents, wherever they work, and on income nonresidents earn inside city limits. On a $60,000 salary that is ${formatUSD(deWilmingtonTax(60000))} a year. If you neither live nor work inside Wilmington city limits, you owe $0 — but a Wilmington mailing address alone does not prove you are inside the city.`,
    },
    {
      q: "I'm a single filer earning $60,000 — how much Delaware tax will I owe?",
      a: `About ${formatAmountOrUnavailable(EX_DE_60.annualState)} a year in Delaware income tax, after the $3,250 standard deduction and the $110 personal credit — an effective rate of ${effectiveRatePct(EX_DE_60.annualState, 60000)}% of gross. If you live or work in Wilmington, add the 1.25% city wage tax on top.`,
    },
    {
      q: "How much Delaware tax would I pay on a $75,000 salary?",
      a: `About ${formatAmountOrUnavailable(EX_DE_75.annualState)} a year in Delaware income tax, as a single filer with no pre-tax deductions at 2026 rates — before any Wilmington wage tax, which is 1.25% of gross earned income inside city limits.`,
    },
    {
      q: "Does Delaware tax Social Security or retirement income?",
      a: "Social Security benefits and railroad retirement payments are fully exempt from Delaware income tax. Pension and other eligible retirement income is excluded up to $2,000 per person under age 60, and up to $12,500 per person at age 60 or older, including up to $12,500 from a qualified military pension. Interest from U.S. obligations is also excluded.",
    },
    {
      q: "What is the $110 personal credit?",
      a: "Delaware gives a personal credit of $110 for each exemption claimed on your federal return — $110 for a single filer, $220 for a joint return — plus another $110 for each person age 60 or older. It comes straight off the tax you owe, but it cannot exceed your liability, so it can bring the bill to zero but never generates a refund on its own.",
    },
    {
      q: "Do I qualify for Delaware's earned income credit?",
      a: "Delaware lets you choose between 20% of your federal earned income credit as a nonrefundable credit, or 4.5% of the federal credit with the excess above your tax liability refunded to you. The refundable 4.5% option is usually better when your Delaware liability is small; the 20% option wins when you owe enough tax to use it. Either way it is claimed on your annual return.",
    },
    {
      q: "Does Delaware have a sales tax?",
      a: "No. Delaware has no sales tax. The state funds itself partly through a gross receipts tax on businesses instead — which is why the income tax and the Wilmington wage tax carry the weight for workers.",
    },
    {
      q: "When is the Delaware return due, and when do I need estimated payments?",
      a: "Delaware's resident return (Form 200-01) is due April 30, not April 15. You must file a Declaration of Estimated Income Tax (Form PIT-EST) if the tax due in excess of withholding can reasonably be expected to exceed $800 for the year, in installments due April 30, June 15, September 15 and January 15. The underpayment penalty is 1.5% per month.",
    },
    {
      q: "I commute into Delaware from Pennsylvania — do I owe Delaware tax?",
      a: "Yes. Delaware has no reciprocal agreement with any state, so a commuter who works in Delaware has Delaware tax withheld on those wages. Your home state gives you a credit for the tax paid to Delaware, so you are not taxed twice on the same wages — but you do file in both states.",
    },
  ],
  "maryland-paycheck-calculator": [
    {
      q: "Does Maryland have a state income tax?",
      a: "Yes. Maryland taxes income on a graduated scale in 2026, from 2% up to a top rate of 6.5% across ten brackets. Only the dollars inside each bracket are taxed at that bracket's rate. Every resident also pays a county income tax on top — see below.",
    },
    {
      q: "What is the standard deduction in Maryland in 2026?",
      a: "The Maryland standard deduction is a flat $3,350 for single filers and $6,700 for joint filers, heads of household and surviving spouses, in place since tax year 2025 when the old 15%-of-AGI formula was repealed. The amounts are indexed for inflation after 2025 and the final indexed 2026 figure had not been published when this page was written — the Comptroller's 2026 estimated-tax worksheet still uses $3,350 and $6,700, while the 2026 withholding guide uses $3,400.",
    },
    {
      q: "Why is there a county tax on my paycheck?",
      a: `Because every Maryland resident owes a local income tax to the county — or Baltimore City — where they live, on the same taxable income as the state tax, and the employer withholds it with the state tax. Rates run from 2.25% in Worcester County to 3.30% in Dorchester and Kent, and most of the state is at 3.20%. At $60,000 in Montgomery County the county tax is ${formatUSD(mdCountyTax(taxableWithExemption("maryland-paycheck-calculator", 60000), 3.2))} a year — nearly as large as the state tax itself.`,
    },
    {
      q: "Which county's rate applies — where I live or where I work?",
      a: "Where you live. The county of residence you write on Form MW507 sets the rate, not the county where you work. Move across a county line and file a new MW507, or the wrong rate keeps coming out. If you do not give your employer an MW507 at all, you are defaulted to the highest local rate, 3.30% for 2026.",
    },
    {
      q: "What is Form MW507 and what goes on it?",
      a: "Form MW507 is the Employee's Maryland Withholding Exemption Certificate — the federal W-4 sets federal withholding only. It collects your withholding filing status, the number of personal exemptions you claim (each worth $3,200 for withholding), and your county of residence. If your federal adjusted gross income exceeds $100,000 you must reduce the number of exemptions you claim.",
    },
    {
      q: "I live in Virginia and work in Maryland — do I owe Maryland tax?",
      a: "No, on your wages. Maryland has reciprocal agreements with Pennsylvania, Virginia, West Virginia and the District of Columbia, so your wages are taxed only by your home state — claim the exemption on Form MW507. There is a catch for DC, Pennsylvania and Virginia residents: the exemption applies only if you did not maintain a place of abode in Maryland for more than six months (183 days or more) during the year. West Virginia residents are exempt regardless of time spent in Maryland.",
    },
    {
      q: "I'm a single filer earning $75,000 — how much Maryland tax will I owe?",
      a: `About ${formatAmountOrUnavailable(EX_MD_75.annualState)} a year in Maryland state tax, plus ${formatUSD(mdCountyTax(taxableWithExemption("maryland-paycheck-calculator", 75000), 3.2))} in county tax at a 3.20% rate — ${formatUSD((EX_MD_75.annualState ?? 0) + mdCountyTax(taxableWithExemption("maryland-paycheck-calculator", 75000), 3.2))} combined. Your county rate may be lower or higher: 2.25% in Worcester, 3.30% in Dorchester and Kent.`,
    },
    {
      q: "Why does my employer withhold at 4.75% when the lowest bracket is 2%?",
      a: "Maryland law does not allow withholding below 4.75%. The 2%, 3% and 4% brackets on the first $3,000 of taxable income apply on the annual return only — your employer withholds at 4.75% on that slice and the difference comes back when you file.",
    },
    {
      q: "Does the $3,200 personal exemption phase out?",
      a: `Yes. The personal exemption phases down once federal adjusted gross income exceeds $100,000 — and the calculator models it: at $150,000 the exemption is ${formatUSD(150000 - taxableWithExemption("maryland-paycheck-calculator", 150000) - 3350)}, not the full $3,200, so the $150,000 worked example above already reflects the phaseout.`,
    },
    {
      q: "When do I need to make estimated payments in Maryland?",
      a: "You must file a declaration of estimated tax (Form PV) if your Maryland income tax is expected to exceed your Maryland withholding by more than $500. The estimate must cover both state and county tax. Four installments are due April 15, June 15 and September 15, 2026, and January 15, 2027. To avoid interest, pay the smaller of 90% of your 2026 tax or 110% of your 2025 tax.",
    },
    {
      q: "When is the Maryland return due?",
      a: "Full-year residents file Form 502, due April 15. Form 502E buys a six-month extension to file, to October 15, but it is an extension to file, not to pay — any tax due must still be paid by April 15.",
    },
    {
      q: "Do 401(k) contributions reduce my Maryland tax?",
      a: "Yes. In Maryland, 401(k), Section 125 and HSA contributions are all excluded from state taxable wages — the same treatment as federal — so they lower your state tax as well as your federal income tax. They lower your county tax too: the local income tax is a percentage of the same Maryland taxable net income, so anything that shrinks that base shrinks the county tax as well as the state tax.",
    },
    {
      q: "What is the 2% capital-gains surtax?",
      a: "A 2% surtax on net capital gains applies when federal adjusted gross income exceeds $350,000. It does not affect wages — it only matters if you sell investments at a gain.",
    },
  ],
  "virginia-paycheck-calculator": [
    {
      q: "Does Virginia have a state income tax?",
      a: "Yes. Virginia taxes income on a graduated scale in 2026, from 2% up to a top rate of 5.75%. Only the dollars inside each bracket are taxed at that bracket's rate — but the top bracket starts at just $17,000 of taxable income, so most earners pay 5.75% on their last dollar.",
    },
    {
      q: "What is the standard deduction in Virginia in 2026?",
      a: "The Virginia standard deduction in 2026 is $8,750 for single filers and $17,500 for married filing jointly. But it is temporary: under current law it sunsets after tax year 2026 and reverts to $3,000 single and $6,000 joint unless the General Assembly extends it.",
    },
    {
      q: "What is Form VA-4 and how do I fill it in?",
      a: "Form VA-4 is the Employee's Virginia Income Tax Withholding Exemption Certificate. Line 1 is the total number of exemptions: each personal or dependent exemption is worth $930, and each age-65-or-older or blindness exemption is worth $800. Claim yourself on line 1 — most Virginia employees should write \"1\" there. Line 2 is an additional flat amount per pay period, and line 3 is the exemption from withholding.",
    },
    {
      q: "I didn't file a VA-4 — why is so much Virginia tax withheld?",
      a: "That is the required default. Without a VA-4 your employer must withhold as if you claimed single status with zero exemptions, which produces the maximum withholding. File a VA-4 to set your real status and exemptions.",
    },
    {
      q: "Do I pay local income tax in Virginia?",
      a: "No. Virginia has no local income tax — no city or county adds an income-tax line to your paycheck. Local governments still levy property, meals and business-license taxes, but none of those touch your wages.",
    },
    {
      q: "I live in Maryland and work in Virginia — do I owe Virginia tax?",
      a: "No, on your wages. Virginia has reciprocity with the District of Columbia, Kentucky, Maryland, Pennsylvania and West Virginia. Maryland residents qualify if they are present in Virginia for 183 days or fewer during the year, do not maintain a home or apartment in Virginia, and their only Virginia income is wages or salary. Claim it on Form VA-4, line 3, and re-certify every calendar year.",
    },
    {
      q: "I'm a single filer earning $75,000 — how much Virginia tax will I owe?",
      a: `About ${formatAmountOrUnavailable(EX_VA_75.annualState)} a year in Virginia income tax, as a single filer with no pre-tax deductions at 2026 rates — an effective rate of ${effectiveRatePct(EX_VA_75.annualState, 75000)}% of gross. There is no local income tax to add.`,
    },
    {
      q: "How much Virginia tax would I pay on a $60,000 salary?",
      a: `About ${formatAmountOrUnavailable(EX_VA_60.annualState)} a year, after the $8,750 standard deduction and the $930 personal exemption — an effective rate of ${effectiveRatePct(EX_VA_60.annualState, 60000)}% of gross.`,
    },
    {
      q: "When is the Virginia return due?",
      a: "Virginia individual returns (Form 760 for residents) are due May 1, not April 15 — for the 2026 tax year, May 3, 2027, because May 1 falls on a Saturday. Virginia grants an automatic six-month extension to all filers, but you must pay at least 90% of the tax you owe by the original May 1 deadline.",
    },
    {
      q: "When do I need to make estimated payments in Virginia?",
      a: "If your expected Virginia tax after withholding and credits exceeds $150, you must make quarterly estimated payments on Form 760ES, due May 1, June 15 and September 15, 2026, and January 15, 2027. Note the first installment is due May 1, not April 15.",
    },
    {
      q: "Do 401(k) contributions reduce my Virginia tax?",
      a: "Yes. In Virginia, 401(k), Section 125 and HSA contributions are all excluded from state taxable wages — the same treatment as federal — so they lower your state tax as well as your federal income tax.",
    },
    {
      q: "Why does Virginia feel like a flat tax?",
      a: "Because the top bracket starts so low. Only $3,000 of taxable income sits in the 2% bracket and $2,000 in the 3% bracket — everything above $17,000 of taxable income is taxed at 5.75%. Once you are past entry-level pay, nearly every additional dollar is taxed at the top rate.",
    },
  ],
  "west-virginia-paycheck-calculator": [
    {
      q: "Does West Virginia have a state income tax?",
      a: "Yes. West Virginia taxes income on a graduated scale of five brackets. The 2026 rates are 2.11% to $10,000, 2.81% to $25,000, 3.16% to $40,000, 4.22% to $60,000 and 4.58% above — every rate 5% lower than 2025 under Senate Bill 392.",
    },
    {
      q: "Does the calculator use the SB 392 rate cut?",
      a: `Yes — the calculator uses the SB 392 rates: 2.11%, 2.81%, 3.16%, 4.22% and 4.58%, a 5% cut to every bracket, signed March 31, 2026 and retroactive to January 1, 2026. On a $75,000 salary the calculator shows ${formatAmountOrUnavailable(EX_WV_75.annualState)} a year in state tax. Paychecks from the first half of 2026 were withheld at the old rates, so a full-year 2026 return will usually show a somewhat larger refund.`,
    },
    {
      q: "What is Form IT-104?",
      a: "Form WV/IT-104 is the Employee's Withholding Exemption Certificate. West Virginia still uses numbered exemptions: each exemption you claim reduces your taxable wages by $2,000 a year for withholding. Line 5 lets single filers, heads of household, and married filers with a non-working spouse elect the lower one-earner withholding tables.",
    },
    {
      q: "What is the one-earner vs two-earner table choice?",
      a: "The Tax Division publishes two withholding table sets, and the default is the two-earner / two-or-more-jobs set, built for couples who both work and people with two jobs. If you are single, head of household, or married with a spouse who does not work, and you have only one job, check line 5 of the IT-104 to use the lower one-earner tables — otherwise the same salary is withheld at a faster rate.",
    },
    {
      q: "Does West Virginia have a standard deduction?",
      a: "No, not as such. What West Virginia gives you is a $2,000 personal exemption for yourself and each dependent, claimed on Form IT-104. That is the $2,000 subtracted in the worked examples on this page.",
    },
    {
      q: "I live in Ohio and work in West Virginia — do I owe West Virginia tax?",
      a: "No, on your wages. West Virginia has reciprocal agreements with Kentucky, Maryland, Ohio, Pennsylvania and Virginia. Your employer does not need to withhold West Virginia tax from your wages, but Form WV/IT-104 must still be on file with the employer claiming the exemption. The agreement covers wages and salaries only.",
    },
    {
      q: "Does West Virginia tax Social Security?",
      a: "No, not from 2026. Starting with the 2026 tax year, Social Security benefits are fully exempt from West Virginia income tax for all recipients, regardless of income. That completes a multi-year phase-in: taxpayers above the income thresholds got a 35% subtraction in 2024 and 65% in 2025 before reaching 100% in 2026.",
    },
    {
      q: "I'm a single filer earning $75,000 — how much West Virginia tax will I owe?",
      a: `About ${formatAmountOrUnavailable(EX_WV_75.annualState)} a year in West Virginia income tax under the SB 392 rates, as a single filer with no pre-tax deductions — after the $2,000 personal exemption. Paychecks from the first half of 2026 were withheld at the old rates, so the 2026 return will usually show a somewhat larger refund.`,
    },
    {
      q: "Do I pay local income tax in West Virginia?",
      a: "Some West Virginia localities levy their own payroll or wage taxes, separate from state withholding — the calculator does not model them, and the Tax Division's withholding tables do not include them. No verified statewide list of localities and rates was published on a Tax Division page we could open, so none is stated here. If a city line appears on your pay stub, it comes from the city, not the state.",
    },
    {
      q: "When is the West Virginia return due?",
      a: "West Virginia's resident individual income tax return is Form IT-140, due April 15.",
    },
    {
      q: "My exemption claim expired — what happened?",
      a: "A claim of complete exemption from withholding on Form IT-104 expires at the end of each calendar year. You must submit a fresh IT-104 by February 15 of the following year to keep the exemption in place, or your employer will begin withholding at the default rate.",
    },
    {
      q: "Will West Virginia cut income tax rates again?",
      a: "Possibly. Further cuts depend on a revenue trigger the state assesses each August for the following January, so the schedule is not guaranteed to stay put — the 2026 cut was the latest in a series that took the top rate from 5.12% to 4.58% in two steps.",
    },
  ],
  "north-carolina-paycheck-calculator": [
    {
      q: "Does North Carolina have a state income tax?",
      a: "Yes. North Carolina taxes income at a single flat rate of 3.99% in 2026 — every dollar of taxable income is taxed at that rate, after the standard deduction. The rate was 4.25% in 2025 and 4.50% in 2024.",
    },
    {
      q: "What is the standard deduction in North Carolina in 2026?",
      a: "The North Carolina standard deduction in 2026 is $12,750 for single filers, $25,500 for married filing jointly or a surviving spouse, and $19,125 for head of household. It is fixed by statute, not indexed for inflation, and has been unchanged since the 2022 tax year. Unlike the federal return, North Carolina gives no additional standard deduction for taxpayers age 65 or older or blind.",
    },
    {
      q: "Why is my employer withholding 4.09% when the tax rate is 3.99%?",
      a: "The Department of Revenue's withholding tables use 4.09% — the 3.99% rate plus a 0.1% cushion required by state law. Withholding usually runs a little ahead of liability, so a small refund at filing time is normal, not a mistake.",
    },
    {
      q: "What is Form NC-4?",
      a: "Form NC-4 is the Employee's Withholding Allowance Certificate. Your allowances come from the NC-4 Allowance Worksheet, which works through your adjustments, the child deduction, itemized deductions and tax credits — the withholding formula then subtracts the standard deduction and $2,500 for each allowance. If you do not submit an NC-4, your employer must withhold as if your filing status is Single with no allowances. A simple-case short form, NC-4 EZ, exists for standard-deduction-only filers.",
    },
    {
      q: "What is the North Carolina child deduction?",
      a: "A taxpayer allowed the federal child tax credit gets a North Carolina child deduction for each qualifying child under 17 on the last day of the year. It is a deduction from income, not a credit against tax: at the 2026 flat rate of 3.99%, the most it can save is $3,000 × 3.99% = $119.70 per child per year. The deduction per child falls in $500 steps as adjusted gross income rises — a single filer gets the full $3,000 at AGI up to $20,000 and nothing above $70,000 (G.S. § 105-153.5(a1)). It is claimed on the annual return and also feeds into the NC-4 worksheet.",
    },
    {
      q: "Do I pay local income tax in North Carolina?",
      a: "No. North Carolina has no local income tax — no county, city or municipality levies its own income tax on residents or workers. The 3.99% state rate is the only income tax.",
    },
    {
      q: "I'm a single filer earning $75,000 — how much North Carolina tax will I owe?",
      a: `About ${formatAmountOrUnavailable(EX_NC_75.annualState)} a year in North Carolina income tax, as a single filer with no pre-tax deductions at 2026 rates — an effective rate of ${effectiveRatePct(EX_NC_75.annualState, 75000)}% of gross, after the $12,750 standard deduction.`,
    },
    {
      q: "How much North Carolina tax would I pay on a $60,000 salary?",
      a: `About ${formatAmountOrUnavailable(EX_NC_60.annualState)} a year, after the $12,750 standard deduction — an effective rate of ${effectiveRatePct(EX_NC_60.annualState, 60000)}% of gross.`,
    },
    {
      q: "Does North Carolina tax Social Security?",
      a: "No. Social Security benefits are fully exempt. Certain government pensions are also exempt under the Bailey settlement — for federal, state and local government retirees who had five years of service by August 12, 1989.",
    },
    {
      q: "When is the North Carolina return due?",
      a: "Form D-400, the North Carolina individual income tax return, is due April 15 for calendar-year filers. You must file if your gross income exceeds the standard deduction for your filing status — for a single filer, any gross income above $12,750.",
    },
    {
      q: "When do I need to make estimated payments in North Carolina?",
      a: "If you are self-employed or have income with no withholding, you pay the state directly in four installments using Form NC-40. Estimated payments are required when you expect to owe $1,000 or more for the year, due April 15, June 15 and September 15, 2026, and January 15, 2027.",
    },
    {
      q: "Will the North Carolina rate fall again?",
      a: "Possibly. Session Law 2023-134 created rate-reduction triggers that could cut the rate by half a percentage point a year from 2027, toward a 2.49% floor, if revenue targets are met. Those are triggers, not promises — plan with 3.99%.",
    },
  ],
  "south-carolina-paycheck-calculator": [
    {
      q: "Does South Carolina have a state income tax?",
      a: "Yes. Under H. 4216, signed March 30, 2026 and effective for the 2026 tax year, South Carolina taxes income at 1.99% on income under $30,000, and at 5.21% minus $966 on income of $30,000 and above. The $966 keeps the two halves continuous — at exactly $30,000 of income both formulas give the same $597.",
    },
    {
      q: "Does the calculator use the new H. 4216 law?",
      a: `Yes — the calculator uses H. 4216: 1.99% on income under $30,000 and 5.21% minus $966 at and above, after the SCIAD for a single filer. On a $75,000 salary the calculator shows ${formatAmountOrUnavailable(EX_SC_75.annualState)} a year in state tax. The SCIAD phaseout is modelled too: at $75,000 the deduction is ${formatUSD0(75000 - engineTaxableIncome("south-carolina-paycheck-calculator", 75000))}, phased down from the full $15,000.`,
    },
    {
      q: "What is the SCIAD?",
      a: "The South Carolina Income Adjusted Deduction (SCIAD) is the new deduction H. 4216 created in place of the federal standard deduction: $15,000 for single or married-filing-separately filers, $22,500 for head of household, and $30,000 for married filing jointly or a surviving spouse. The amounts are reduced based on income — under SCDOR Information Letter #26-20 (August 31, 2026) the single-filer SCIAD phases out between $40,000 and $95,000 of adjusted gross income, reaching $0 at $95,000 — and the calculator models that phaseout, so the worked examples on this page are no longer flagged as partial calculations.",
    },
    {
      q: "What is the SC W-4 and how does withholding work now?",
      a: "South Carolina withholding is set by Form SC W-4. The 2026 withholding formula subtracts $5,000 for each allowance you claim, plus — if you claim any allowance — a standard deduction of 10% of gross wages capped at $7,500, then taxes the rest at 0% to $3,639, 3% to $18,229 and 6% above. That formula predates H. 4216, and the Department said further guidance was coming — so withholding follows the old formula while the 2026 return follows the new law, and a gap between the two is expected this year.",
    },
    {
      q: "What happened to the old 6% top rate?",
      a: "The old top rate was 6% through June 30, 2026 under a temporary budget reduction, and had been scheduled to revert to 6.2% on July 1. H. 4216 supersedes that for the 2026 return: the top rate is now 5.21%, with the $966 subtraction.",
    },
    {
      q: "I'm a single filer earning $75,000 — how much South Carolina tax will I owe?",
      a: `About ${formatAmountOrUnavailable(EX_SC_75.annualState)} a year in South Carolina income tax under H. 4216, as a single filer with no pre-tax deductions — with the SCIAD phased down to ${formatUSD0(75000 - engineTaxableIncome("south-carolina-paycheck-calculator", 75000))} at this income, not the full $15,000. Treat it as an estimate, not an exact figure.`,
    },
    {
      q: "How much South Carolina tax would I pay on a $60,000 salary?",
      a: `About ${formatAmountOrUnavailable(EX_SC_60.annualState)} a year under H. 4216, after the SCIAD — which phases down to ${formatUSD0(60000 - engineTaxableIncome("south-carolina-paycheck-calculator", 60000))} at this pay — 5.21% of ${formatUSD0(engineTaxableIncome("south-carolina-paycheck-calculator", 60000))} minus $966. At $30,000 the tax is only ${formatAmountOrUnavailable(EX_SC_30.annualState)}, because income under $30,000 is taxed at 1.99%.`,
    },
    {
      q: "Is there a South Carolina earned income credit?",
      a: "Yes, but H. 4216 limits South Carolina's earned income tax credit to $200. It is claimed on the annual return, and the calculator does not model it.",
    },
    {
      q: "Does South Carolina tax Social Security?",
      a: "No. Social Security benefits are completely exempt from South Carolina income tax.",
    },
    {
      q: "Do I pay local income tax in South Carolina?",
      a: "No. No South Carolina county or municipality levies an income tax, so the state rate is the only income tax a resident faces.",
    },
    {
      q: "When is the South Carolina return due?",
      a: "Form SC-1040, the South Carolina individual income tax return, is due April 15, 2027 for the 2026 tax year — the first return under H. 4216. H. 4216 does not affect 2025 returns.",
    },
    {
      q: "Will the South Carolina top rate fall further?",
      a: "Possibly. H. 4216 mandates that the top rate will be reduced further if the Board of Economic Advisors projects revenue collections will increase by 5% or more from the previous fiscal year. The reduction cannot decrease revenue by more than $200 million in a year, and the Board decides the new rate no later than February 15 of each year.",
    },
  ],
  "georgia-paycheck-calculator": [
    {
      q: "Does Georgia have a state income tax?",
      a: "Yes. Georgia taxes income at a single flat rate of 4.99% in 2026 — every dollar of taxable income is taxed at that rate, after the standard deduction. The rate was 5.19% in 2025 and 5.39% in 2024.",
    },
    {
      q: "What is the standard deduction in Georgia in 2026?",
      a: "The Georgia standard deduction in 2026 is $15,000 for single, head-of-household and married-filing-separately filers, and $30,000 for married filing jointly. House Bill 463 raised it from $12,000 and $24,000 and made the change retroactive to January 1, 2026.",
    },
    {
      q: "Why was my early-2026 paycheck withheld at 5.19%?",
      a: "Because House Bill 463 was signed on May 11, 2026. Employers had to keep withholding at the old 5.19% rate with the old deductions until that date, and could switch to the new 4.99% tables only from May 11. A full-year 2026 return is taxed at 4.99% throughout, so the over-withholding from the first months comes back on the return.",
    },
    {
      q: "What is Form G-4?",
      a: "Form G-4 is Georgia's Employee's Withholding Allowance Certificate. It has four statuses: A for single, B for married with both spouses working or filing separately, C for married filing jointly with one spouse working, and D for head of household. The withholding standard deduction is $15,000 for A, B and D but $30,000 for C — and each allowance subtracts a further $5,000 dependent allowance a year before the 4.99% rate applies.",
    },
    {
      q: "I'm a single filer earning $75,000 — how much Georgia tax will I owe?",
      a: `About ${formatAmountOrUnavailable(EX_GA_75.annualState)} a year in Georgia income tax, as a single filer with no pre-tax deductions at 2026 rates — an effective rate of ${effectiveRatePct(EX_GA_75.annualState, 75000)}% of gross, after the $15,000 standard deduction.`,
    },
    {
      q: "How much Georgia tax would I pay on a $60,000 salary?",
      a: `About ${formatAmountOrUnavailable(EX_GA_60.annualState)} a year, after the $15,000 standard deduction — an effective rate of ${effectiveRatePct(EX_GA_60.annualState, 60000)}% of gross.`,
    },
    {
      q: "Does Georgia tax Social Security?",
      a: "No. Social Security benefits and railroad retirement income are completely exempt from Georgia income tax, subtracted on Schedule 1 of Form 500. Georgia also offers a retirement income exclusion of up to $35,000 at age 62 to 64 and up to $65,000 at age 65 or older, per taxpayer.",
    },
    {
      q: "What is Georgia's retirement income exclusion?",
      a: "It is a subtraction from federal adjusted gross income before the 4.99% rate applies: up to $35,000 per taxpayer at age 62 to 64 (or under 62 and permanently and totally disabled), and up to $65,000 per taxpayer at age 65 or older. It covers pensions, annuities, IRA distributions, interest, dividends, capital gains, net rental income and royalties; earned income such as wages counts toward the exclusion only up to $4,000. You claim it on the retirement income worksheet on Schedule 1 of Form 500.",
    },
    {
      q: "Do I pay local income tax in Georgia?",
      a: "No. Georgia has no local income tax.",
    },
    {
      q: "Does Georgia have reciprocity with any state?",
      a: "No. Georgia has no reciprocity agreement with any state. A Georgia resident who works across a state line files a nonresident return there and claims a resident credit in Georgia, and a nonresident who works in Georgia files a Georgia nonresident return.",
    },
    {
      q: "When is the Georgia return due?",
      a: "Georgia's individual income tax return is Form 500, due April 15.",
    },
    {
      q: "When do I need to make estimated payments in Georgia?",
      a: "Estimated tax uses Form 500-ES. You must file it if you reasonably expect gross income during the year that exceeds your exemptions, plus estimated deductions, plus $1,000 of income not subject to withholding. Pay in full with the first installment or in equal installments due April 15, June 15 and September 15, 2026, and January 15, 2027.",
    },
  ],
  "florida-paycheck-calculator": [
    {
      q: "Does Florida really have no state income tax — at any income level?",
      a: "Yes. Florida has no state income tax on wages in 2026 — the state income-tax line is $0 at $30,000 and at $1,000,000 alike. Article VII, Section 5 of the Florida Constitution prohibits a tax on the income of natural persons, and imposing one would require a constitutional amendment approved by 60% of voters.",
    },
    {
      q: "Why is there no Florida line on my paystub?",
      a: "Because there is no state income tax to withhold. Your pay stub shows federal income tax, Social Security, and Medicare — all federal — and nothing for the state. There is no Florida withholding form to file, either: you fill in only the federal Form W-4. That is for Florida-source work: if you work in another state, that state's withholding can still appear as a state line on your pay stub.",
    },
    {
      q: "Do I need to file a Florida state tax return?",
      a: "No. There is no Florida individual income-tax return to file and no state estimated payments to make, because there is no tax for a return or an estimate to cover.",
    },
    {
      q: "I moved from California or New York to Florida — when does the state tax stop?",
      a: "There is nothing to stop in Florida — Florida never charges you. What changes is your old state: it taxes only the income you earned while you were its resident, plus its-source income after you leave, so you file its part-year or nonresident return for that period and nothing for Florida.",
    },
    {
      q: "How much Florida tax would I pay on a $75,000 salary?",
      a: `$0 — Florida has no state income tax. The same $75,000 single filer would pay ${formatAmountOrUnavailable(EX_CA_75.annualState)} in California and ${formatAmountOrUnavailable(EX_NY_75_STATE.annualState)} in New York State (before New York City tax).`,
    },
    {
      q: "If there's no income tax, how does Florida pay for things?",
      a: "Primarily through sales tax and local property tax. The general state sales tax rate is 6%, and most counties add a discretionary sales surtax of 0.5% to 2.5%, levied on the first $5,000 of the purchase price — so the combined rate at the register is usually 6.5% to 7.5%. Florida also levies a 5.5% corporate income tax on C-corporation profits, not on your wages.",
    },
    {
      q: "Are Florida property taxes higher because there's no income tax?",
      a: "They are local, not state — the county property appraiser assesses your property annually, and counties, cities, school districts and special districts set the millage rates. Homeowners get relief through the homestead exemption (up to $50,000 off assessed value) and the Save Our Homes cap, which limits annual assessment increases on a homesteaded property to 3% a year.",
    },
    {
      q: "What is the homestead exemption?",
      a: "If you own a home in Florida and make it your permanent residence, you can claim a homestead exemption worth up to $50,000 off your property's assessed value. The first $25,000 applies to all property taxes, including school district taxes, and an additional $25,000 applies to the assessed value between $50,000 and $75,000 but does not reduce school district taxes. You must apply with your county property appraiser by March 1 (Form DR-501) — it does not apply automatically.",
    },
    {
      q: "Do I still pay federal income tax, Social Security and Medicare in Florida?",
      a: "Yes. Federal income tax, Social Security (6.2% up to $184,500 in 2026), and Medicare (1.45% plus 0.9% over $200,000) apply exactly as in every other state. Only the state layer is $0.",
    },
    {
      q: "I'm self-employed in Florida — what state taxes do I owe?",
      a: "No personal income tax. Florida has no state disability or paid-leave program either, so there is no second state deduction line of any kind, and the reemployment (unemployment) tax is paid by employers, not withheld from wages.",
    },
    {
      q: "Does Florida tax retirement income, Social Security, or investment income?",
      a: "No. Florida levies no personal income tax at all, so there is no state tax on wages, retirement income, Social Security, or investment income. The Department of Revenue also notes Florida imposes no inheritance tax, gift tax, or tax on intangible personal property.",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* SOURCES                                                             */
/* ------------------------------------------------------------------ */

export const BATCH_SOURCES: Record<string, { label: string; url: string }[]> = {
  "delaware-paycheck-calculator": [
    {
      label: "Delaware Division of Revenue — 2026 Declaration of Estimated Income Tax instructions (PIT-EST)",
      url: "https://revenuefiles.delaware.gov/2025/PITForms_Instructions/Instructions/PIT-EST_Instructions_2026-01.pdf",
    },
    {
      label: "Delaware Division of Revenue — Employer's Guide: Withholding Regulations",
      url: "https://revenue.delaware.gov/employers-guide-withholding-regulations-employers-duties/",
    },
    {
      label: "Tax Foundation — 2026 state income tax rates",
      url: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    },
  ],
  "maryland-paycheck-calculator": [
    {
      label: "Comptroller of Maryland — Withholding Tax Facts, January–December 2026",
      url: "https://www.marylandcomptroller.gov/content/dam/mdcomp/tax/legal-publications/facts/withholding-tax-facts-2026.pdf",
    },
    {
      label: "Comptroller of Maryland — 2026 Maryland State and Local Income Tax Withholding Information",
      url: "http://marylandtaxes.com/content/dam/mdcomp/md/state-payroll/memos/2026/2026-maryland-state-and-local-withholding-information.pdf",
    },
    {
      label: "Tax Foundation — 2026 state income tax rates",
      url: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    },
  ],
  "virginia-paycheck-calculator": [
    {
      label: "Virginia Department of Taxation — Employer Withholding Instructions (Rev. 05/25)",
      url: "https://www.tax.virginia.gov/sites/default/files/vatax-pdf/employer-withholding-instructions.pdf",
    },
    {
      label: "Virginia Department of Taxation — Reciprocity",
      url: "https://www.tax.virginia.gov/reciprocity",
    },
    {
      label: "Virginia Department of Taxation — 2026 Form 760ES estimated tax vouchers",
      url: "https://tax.ar.virginia.gov/sites/default/files/taxforms/individual-income-tax/2026/760es-2026.pdf",
    },
    {
      label: "Tax Foundation — 2026 state income tax rates",
      url: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    },
  ],
  "west-virginia-paycheck-calculator": [
    {
      label: "West Virginia Tax Division — 2026 Income Tax Rate Cut (SB 392)",
      url: "https://tax.wv.gov/Individuals/Pages/PersonalIncomeTaxReductionBill.aspx",
    },
    {
      label: "West Virginia Tax Division — TSD 381, Withholding Information for Employers",
      url: "https://tax.wv.gov/Documents/TSD/tsd381.pdf",
    },
    {
      label: "West Virginia Tax Division — IT-100.2A withholding tables (March 2026)",
      url: "https://tax.wv.gov/Documents/Withholding/it100.2a.pdf",
    },
    {
      label: "Tax Foundation — 2026 state income tax rates",
      url: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    },
  ],
  "north-carolina-paycheck-calculator": [
    {
      label: "North Carolina Department of Revenue — Tax Rate Schedules",
      url: "https://www.ncdor.gov/taxes-forms/individual-income-tax/tax-rate-schedules",
    },
    {
      label: "North Carolina Department of Revenue — Income Tax Withholding Tables and Instructions for Employers",
      url: "https://www.ncdor.gov/income-tax-withholding-tables-and-instructions-employers/open",
    },
    {
      label: "Tax Foundation — 2026 state income tax rates",
      url: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    },
  ],
  "south-carolina-paycheck-calculator": [
    {
      label: "South Carolina Department of Revenue — Information about H. 4216",
      url: "https://dor.sc.gov/news/information-about-h-4216",
    },
    {
      label: "Tax Foundation — 2026 state income tax rates",
      url: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    },
  ],
  "georgia-paycheck-calculator": [
    {
      label: "Georgia Department of Revenue — 2026 Employer's Withholding Tax Guide",
      url: "https://dor.georgia.gov/document/document/2026-employers-tax-guide-updated-june-2026/download",
    },
    {
      label: "Georgia Department of Revenue — Form 500-ES, estimated tax (2026)",
      url: "https://dor.georgia.gov/document/document/2026-500-es-estimated-tax-individuals-and-fiduciaries/download",
    },
    {
      label: "Tax Foundation — 2026 state income tax rates",
      url: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    },
  ],
  "florida-paycheck-calculator": [
    {
      label: "Florida Department of Revenue — Sales and Use Tax",
      url: "https://floridarevenue.com/taxes/taxesfees/Pages/sales_tax.aspx",
    },
    {
      label: "Florida Department of Revenue — Property Tax: Taxpayers",
      url: "https://floridarevenue.com/property/Pages/Taxpayers.aspx",
    },
    {
      label: "Tax Foundation — 2026 state income tax rates",
      url: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    },
  ],
};
