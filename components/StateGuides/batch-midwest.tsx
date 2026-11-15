/**
 * PaycheckBeam — MIDWEST batch state-guide content: Ohio, Indiana,
 * Michigan, Illinois, Wisconsin, Minnesota, Iowa, Kansas.
 *
 * Researched 2026-11-15 from opened official pages — see
 * ~/workspace/paycheckbeam-research/state-guides-midwest.md for sources,
 * left-out items and data corrections found. Nothing unverified from
 * that file's "left out" sections is included.
 *
 * Worked-example numbers are generated at render time from the same
 * shared calculation the calculator above the fold runs
 * (calculatePaycheck / estimateStateWithholding / estimateStateInsurance),
 * so the tables match the tool. Standard-deduction and exemption dollar
 * amounts in prose are also generated from lib/stateTaxData.ts
 * (getStateBySlug) so they track the data file.
 *
 * Rows labelled "Partial calculation" in place by design:
 * - Ohio $150,000 only: the $332 step in ORC 5747.02 is now modelled
 *   (StateBracket.base in lib/paycheckCalc.ts), so the $30,000 and
 *   $60,000 rows match the statute. The $150,000 row is understated
 *   by about $13.75 because the personal exemption steps down to
 *   $1,900 at that income.
 * - Wisconsin rows are clean now: the standard-deduction phaseout
 *   (12% of income over $20,120 single) is modelled by the engine
 *   (round-4), so every row matches the tool. The phased deduction
 *   at each pay level is shown in the note.
 * - Iowa and Kansas rows are clean: the $40 personal exemption credit
 *   (IA) and the $9,160 single personal exemption (KS) are now in
 *   lib/stateTaxData.ts, so the tables match the calculator.
 * No incomplete example is presented as exact.
 *
 * Wisconsin uses the shared engineTaxableIncome() helper: the shared
 * stateTaxableIncome() subtracts only the standard deduction, but the
 * estimator also subtracts Wisconsin's $700 personal exemption and
 * phases the deduction down, so the shared helper would misstate
 * Wisconsin taxable income. (Same pattern as Hawaii in the west batch,
 * which uses its own hiTaxable() helper.) Kansas uses the same
 * ksTaxable() pattern now that its $9,160 exemption is in the data
 * file.
 */
import type { FaqItem } from "@/components/FaqAccordion";
import {
  applyBrackets,
  formatUSD,
  formatUSD0,
} from "@/lib/paycheckCalc";
import { getStateBySlug } from "@/lib/stateTaxData";
import {
  bracketDetailEngine,
  bracketDetailText,
  effectiveRatePct,
  engineTaxableIncome,
  examplePaycheck,
  ExpandableSection,
  Eyebrow,
  formatAmountOrUnavailable,
  NoteBox,
  Para,
  SectionTitle,
  stateTaxableIncome,
  WorkedTable,
} from "@/components/StateGuides/shared";

export const BATCH_SLUGS: string[] = [
  "ohio-paycheck-calculator",
  "indiana-paycheck-calculator",
  "michigan-paycheck-calculator",
  "illinois-paycheck-calculator",
  "wisconsin-paycheck-calculator",
  "minnesota-paycheck-calculator",
  "iowa-paycheck-calculator",
  "kansas-paycheck-calculator",
];

/* Shared example results reused by prose and FAQs — no engine-derived
 * figure is ever a literal string in an answer. Computed once at module
 * load from the same calculation the calculator runs. */
const EX_OH_60 = examplePaycheck("ohio-paycheck-calculator", 60000);
const EX_IN_60 = examplePaycheck("indiana-paycheck-calculator", 60000);
const EX_MI_60 = examplePaycheck("michigan-paycheck-calculator", 60000);
const EX_IL_60 = examplePaycheck("illinois-paycheck-calculator", 60000);
const EX_WI_30 = examplePaycheck("wisconsin-paycheck-calculator", 30000);
const EX_WI_60 = examplePaycheck("wisconsin-paycheck-calculator", 60000);
const EX_WI_150 = examplePaycheck("wisconsin-paycheck-calculator", 150000);
const EX_MN_60 = examplePaycheck("minnesota-paycheck-calculator", 60000);
const EX_IA_60 = examplePaycheck("iowa-paycheck-calculator", 60000);
const EX_KS_60 = examplePaycheck("kansas-paycheck-calculator", 60000);
const EX_CA_60 = examplePaycheck("california-paycheck-calculator", 60000);

/* Standard-deduction / exemption amounts from the data file, so prose
 * tracks lib/stateTaxData.ts. */
const OH_SD_SINGLE = getStateBySlug("ohio-paycheck-calculator")?.standardDeductionSingle ?? 0;
const IN_SD_SINGLE = getStateBySlug("indiana-paycheck-calculator")?.standardDeductionSingle ?? 0;
const MI_SD_SINGLE = getStateBySlug("michigan-paycheck-calculator")?.standardDeductionSingle ?? 0;
const IL_SD_SINGLE = getStateBySlug("illinois-paycheck-calculator")?.standardDeductionSingle ?? 0;
const WI_SD_SINGLE = getStateBySlug("wisconsin-paycheck-calculator")?.standardDeductionSingle ?? 0;
const WI_EXEMPTION_SINGLE = getStateBySlug("wisconsin-paycheck-calculator")?.exemptionSingle ?? 0;
const MN_SD_SINGLE = getStateBySlug("minnesota-paycheck-calculator")?.standardDeductionSingle ?? 0;
const IA_SD_SINGLE = getStateBySlug("iowa-paycheck-calculator")?.standardDeductionSingle ?? 0;
const KS_SD_SINGLE = getStateBySlug("kansas-paycheck-calculator")?.standardDeductionSingle ?? 0;
const KS_EXEMPTION_SINGLE = getStateBySlug("kansas-paycheck-calculator")?.exemptionSingle ?? 0;

/** Kansas taxable income the way the estimator computes it: gross
 * minus the standard deduction AND the $9,160 personal exemption. */
const ksTaxable = (gross: number) => gross - KS_SD_SINGLE - KS_EXEMPTION_SINGLE;

/* ------------------------------------------------------------------ */
/* OHIO                                                                */
/* ------------------------------------------------------------------ */

function OhioContent() {
  const slug = "ohio-paycheck-calculator";
  const st = getStateBySlug(slug);
  const sd = st?.standardDeductionSingle ?? 0;
  const brackets = st?.brackets ?? [];
  const rows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(slug, gross);
    return [
      formatUSD0(gross),
      formatUSD0(stateTaxableIncome(slug, gross)),
      formatAmountOrUnavailable(r.annualState),
    ];
  });
  const ohTaxable60 = stateTaxableIncome(slug, 60000);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          Ohio tax at real salaries — nearly flat, with a $332 step at the
          threshold
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the 2026 personal
          exemption of {formatUSD0(sd)}, and applies 2.75% to taxable
          income over $26,050. Ohio has no tax at all on the first
          $26,050 of taxable income, so the tax on a modest paycheck is
          small — but the $332 step in the statute means the bill jumps
          the moment you cross that line.
        </Para>
        <NoteBox tone="amber">
          <strong>Partial calculation — the $150,000 row.</strong> The
          personal exemption steps down to $1,900 at that income instead
          of the {formatUSD0(sd)} the calculator subtracts, so the
          $150,000 row understates the real liability by about{" "}
          {formatUSD(500 * 0.0275)}. The $30,000 and $60,000 rows include
          the $332 step in the statute (Ohio Revised Code 5747.02:
          &ldquo;$332.00 plus 2.75% of the amount in excess of
          $26,050&rdquo;) and match it exactly.
        </NoteBox>
        <WorkedTable
          caption="Ohio income tax, single filer, 2026"
          headers={["Gross wages", "OH taxable income", "OH income tax"]}
          rows={rows}
          partialRowIndexes={[2]}
          footnote={`At $60,000 the effective Ohio income-tax rate in the table is ${effectiveRatePct(EX_OH_60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(examplePaycheck(slug, 150000).annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, so the figures match the tool. Only the $150,000 row is partial — the personal exemption steps down to $1,900 at that income, so the real liability is about $13.75 higher.`}
        />
        <Para>
          The $60,000 row in detail: {bracketDetailText(slug, 60000, brackets)}; total{" "}
          {formatAmountOrUnavailable(EX_OH_60.annualState)}. The $332 step is
          already in that total — it is the lump sum Ohio charges the moment
          taxable income crosses $26,050. The same $60,000
          single filer owes {formatAmountOrUnavailable(EX_CA_60.annualState)}{" "}
          in California — Ohio&apos;s state tax is lower, before the local
          taxes below, which can erase the gap entirely in a city like
          Columbus.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department&apos;s own terms</Eyebrow>
        <SectionTitle>
          A flat 2.75% above $26,050 — and a $332 step at the threshold
        </SectionTitle>
        <Para>
          Ohio moved to its current structure on January 1, 2026, under
          House Bill 96: the tax is $332 plus 2.75% of the amount over
          $26,050, and there is no tax on a balance of $26,050 or less.
          The tax is measured by Ohio adjusted gross income, less taxable
          business income and less the personal exemption. The exemption
          is {formatUSD0(sd)} for a single filer at lower incomes and
          steps down — to $2,150, then $1,900 — as modified adjusted gross
          income rises, reaching $0 once it hits $500,000.
        </Para>
        <Para>
          Ohio is a two-layer tax state, and the state rate is the smaller
          layer for most workers. Hundreds of Ohio municipalities levy
          their own income tax on top of the state rate, and more than
          200 school districts levy a separate school district income tax
          — both are covered in the local-taxes section below, because
          they change what a paycheck actually costs far more than the
          state rate does.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form IT-4"
        title="IT-4: one combined form, and the school district code that trips people up"
        summary="Ohio's withholding certificate covers state tax, school district tax, and reciprocity in a single form. What each section does, and what happens if you never file one."
      >
        <Para>
          Ohio&apos;s withholding certificate is the combined Form IT-4
          (revised January 2024), which replaced the old IT 4, IT 4NR, IT
          4 MIL, and IT 4 MIL SP. Section I is your personal information
          plus your school district of residence — name and four-digit
          code, which you can find with the Department of Taxation&apos;s
          &ldquo;The Finder&rdquo; lookup. Section II counts your
          exemptions: yourself, your spouse if you file jointly, and each
          dependent you claim federally. Section III is the complete
          exemption from withholding, including the reciprocity claim for
          residents of Indiana, Kentucky, Michigan, Pennsylvania, and
          West Virginia. Section IV is the signature.
        </Para>
        <Para>
          Each exemption you claim cuts $25.00 of taxable wages per
          biweekly paycheck — it is a reduction in the wage base, not
          $650 of tax. The Department&apos;s percentage method states
          it as &ldquo;Gross Wage Minus $25.00 for Each Exemption
          Claimed Equals Taxable Wage.&rdquo; The real saving is that
          $25.00 times your withholding band: $0.40 per paycheck
          ($10.40 a year) at 1.60%, $0.75 per paycheck ($19.44 a year)
          at 2.99%, and $0.85 per paycheck ($22.10 a year) at 3.40%.
          Line 5 of Section II lets you add a whole-dollar amount of
          extra withholding per pay period. If you never give your
          employer an IT-4, the employer withholds as if you claimed
          zero exemptions — the maximum — and withholds nothing for
          school district tax, which leaves a balance due on your
          return. Update the form within 10 days of any change in
          exemptions or address.
        </Para>
        <Para>
          Withholding itself does not use the return rate directly. The
          Department&apos;s percentage method applies bands of 1.60%,
          2.99%, and 3.40% from August 1, 2026 (the January–July 2026
          tables used the October 2025 rates), because the bands blend in
          the exemption credits and the phase-down of the old graduated
          rates. Supplemental pay such as a bonus can be withheld at an
          optional flat 2.75%. A withholding band is not your tax rate —
          the return settles the difference.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Credits · 2026 amounts · return-only"
        title="The Ohio credits claimed on your return"
        summary="A nonrefundable EITC worth 30% of the federal credit, a retirement income credit, and several small credits. All claimed on your IT 1040, not on your paycheck."
      >
        <Para>
          <strong className="text-slate-900">Earned Income Tax Credit
          (nonrefundable):</strong> Ohio matches 30% of your federal
          Earned Income Tax Credit. A filer may reduce annual Ohio income
          tax by up to 30% of their federal EITC amount, subject to
          eligibility and available tax liability — and because the credit
          is nonrefundable, it can reduce your Ohio tax to $0 but never
          pays out as a refund.
        </Para>
        <Para>
          <strong className="text-slate-900">Retirement income credit
          (nonrefundable):</strong> up to $200 for retirees whose
          modified adjusted gross income less exemptions is under
          $100,000, tiered by the amount of retirement income — $25 at
          $501–$1,500 of retirement income, rising to the full $200 at
          $8,001 or more. A filer may reduce annual Ohio income tax by up
          to $200, subject to eligibility and available tax liability.
        </Para>
        <Para>
          <strong className="text-slate-900">Other credits:</strong> a
          $50 senior citizen credit at age 65 or older; a $20 exemption
          credit when income less exemptions is under $30,000; a joint
          filing credit of up to $650 for married couples filing jointly;
          a dependent care credit worth 100% of the federal credit below
          $20,000 of modified AGI and 25% between $20,000 and $40,000; a
          displaced worker training credit of the lesser of $500 or 50% of
          the cost; a home-school expenses credit of the lesser of $250;
          a scholarship-granting-organization credit of the lesser of
          $750 ($1,500 joint); and a nonchartered nonpublic school
          tuition credit of $1,000 (AGI under $50,000) or $1,500 (AGI
          $50,000 or more), one per return. None of these is modelled in
          the calculator&apos;s withholding estimate — they settle on the
          return.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Local taxes · the big Ohio layer"
        title="City tax and school district tax: the layers that dwarf the state rate"
        summary="More than 600 municipalities and 214 school districts levy their own income taxes. Rates, who collects them, and the 401(k) trap are inside."
      >
        <Para>
          <strong className="text-slate-900">Municipal income
          tax:</strong> more than 600 Ohio municipalities levy a local
          income tax, typically 1% to 3%. Columbus and Cleveland charge
          2.5%, Cincinnati 1.8%, and Akron, Toledo, and Dayton 2.5%. A
          Columbus resident earning $60,000 pays{" "}
          {formatUSD(0.025 * 60000)} a year in city tax alone — more than
          the state tax in the table above. The tax is collected by the
          Regional Income Tax Agency (about 400 cities), the Central
          Collection Agency (about 300, including Cleveland), or directly
          by the city (Columbus and Cincinnati). City tax is charged on
          Medicare wages, so 401(k) deferrals do <strong>not</strong>{" "}
          reduce it — a pre-tax contribution that lowers your state and
          federal tax leaves your city tax untouched. Many cities give a
          credit for taxes paid to the city where you work, but the credit
          varies by city, so commuters should check both cities&apos;
          rules.
        </Para>
        <Para>
          <strong className="text-slate-900">School district income
          tax:</strong> 214 school districts levied one as of January
          2026, at rates from 0.25% to 2.00% — most commonly 1% to 1.5%.
          Unlike city tax, school district tax is residence-based: you pay
          it to the district where you live, not where you work, and it is
          filed on Form SD 100. Districts use one of two bases — the
          traditional base (Ohio AGI less exemptions) or the earned-income
          base (wages and self-employment income only) — so the same
          salary can produce a different bill in neighbouring districts.
          If you owe $500 or more in school district tax, you must also
          make estimated payments on Form SD 100ES. The Columbus,
          Cleveland, and Cincinnati school districts levy no school
          district income tax.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Reciprocity · Form IT-4, Section III"
        title="Live in Indiana, Kentucky, Michigan, Pennsylvania, or West Virginia? File Section III, not a new form"
        summary="Ohio has reciprocity with all five bordering states. Wages are taxed by the home state only — but local taxes are not covered."
      >
        <Para>
          Ohio maintains reciprocal income-tax agreements with all five
          bordering states: Indiana, Kentucky, Michigan, Pennsylvania,
          and West Virginia. Under reciprocity, wage and salary income is
          taxed by the worker&apos;s state of residence, not the state
          where the work is performed. A resident of one of those states
          who works in Ohio claims the exemption in Section III of the
          combined IT-4 given to the Ohio employer — the old standalone
          IT 4NR is now that section. An Ohio resident working in one of
          those states files that state&apos;s form instead (Indiana
          WH-47, Kentucky 42A809, Michigan MI-W4, West Virginia WV
          IT-104NR).
        </Para>
        <Para>
          Reciprocity covers wages and salaries only, and it does{" "}
          <strong>not</strong> cover local taxes: Ohio municipal tax is
          still withheld regardless of where you live, and Indiana may
          still charge its county tax. Without the form on file, Ohio
          withholding applies and the worker files two returns to sort it
          out.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="What Ohio does not tax"
        title="Social Security and military retirement stay out"
        summary="Ohio subtracts Social Security benefits and military retirement pay in full. Neither changes your paycheck withholding."
      >
        <Para>
          Ohio does not tax Social Security benefits at all: the full
          amount is subtracted from Ohio adjusted gross income on the
          Schedule of Adjustments, whatever your income level. Military
          retirement pay is likewise exempt, as are certain railroad
          retirement benefits. None of these subtractions changes what
          your employer withholds from a working paycheck — they settle
          on the return — but they are the reason an Ohio retiree&apos;s
          state bill can be far lower than a worker&apos;s at the same
          income.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form IT 1040, and quarterly estimates on Form IT 1040ES"
        summary="The April 15 deadline, the $500 estimated-tax threshold, and the safe harbor. The Ohio Universal Payment Coupon carries your payments."
      >
        <Para>
          Full-year residents file Form IT 1040, due April 15, 2027 for
          tax year 2026, and can file free through OH|TAX eServices. A
          zero-liability return exists as Form IT 10. If you have income
          with no Ohio withholding — self-employment, rental, or
          investment income — you must make estimated payments on Form IT
          1040ES when your expected Ohio tax after withholding and
          credits exceeds $500, in four equal installments due April 15,
          June 15, and September 15, 2026, and January 15, 2027.
        </Para>
        <Para>
          The usual safe harbor is paying at least 90% of the current
          year&apos;s Ohio tax or 100% of last year&apos;s Ohio tax;
          underpayment interest for 2026 is 7%, figured on Form IT/SD
          2210. Estimated payments are made with the Ohio Universal
          Payment Coupon, and the IT 1040ES and SD 100ES forms themselves
          are worksheets you keep for your records.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* INDIANA                                                             */
/* ------------------------------------------------------------------ */

function IndianaContent() {
  const slug = "indiana-paycheck-calculator";
  const st = getStateBySlug(slug);
  const sd = st?.standardDeductionSingle ?? 0;
  const rows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(slug, gross);
    return [
      formatUSD0(gross),
      formatUSD0(stateTaxableIncome(slug, gross)),
      formatAmountOrUnavailable(r.annualState),
    ];
  });
  const inTaxable60 = stateTaxableIncome(slug, 60000);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          Indiana tax at real salaries — one flat rate, then every county
          adds its own
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the 2026 personal
          exemption of {formatUSD0(sd)}, and applies the single flat rate
          of 2.95% to what is left. The table is the state tax only: every
          Indiana county adds a county income tax on the same base, so
          the real bill depends on where you live and work.
        </Para>
        <NoteBox tone="blue">
          <strong>County tax is not in this table.</strong> The county
          tax uses the same exemption-reduced base as the state tax. A
          Marion County (Indianapolis) resident pays 2.02% on top of the
          state rate — at $60,000 that is another{" "}
          {formatUSD(0.0202 * inTaxable60)} a year, for a combined state
          plus county bill of{" "}
          {formatUSD((EX_IN_60.annualState ?? 0) + 0.0202 * inTaxable60)}.
          County rates run from 0.5% in Porter County to 3.00% in
          Randolph County, so check your own counties in the local-taxes
          section below.
        </NoteBox>
        <WorkedTable
          caption="Indiana income tax, single filer, 2026 — state tax only"
          headers={["Gross wages", "IN taxable income", "IN income tax"]}
          rows={rows}
          footnote={`At $60,000 the effective Indiana income-tax rate is ${effectiveRatePct(EX_IN_60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(examplePaycheck(slug, 150000).annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, so the figures match the tool. County tax is additional and varies by county.`}
        />
        <Para>
          The $60,000 row in detail: 2.95% × {formatUSD0(inTaxable60)} ={" "}
          {formatAmountOrUnavailable(EX_IN_60.annualState)}. The same
          $60,000 single filer owes{" "}
          {formatAmountOrUnavailable(EX_CA_60.annualState)} in California
          — Indiana&apos;s state tax alone is already higher at this pay,
          and the county tax pushes it further above California.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department&apos;s own terms</Eyebrow>
        <SectionTitle>
          A flat 2.95% that fell on January 1, 2026 — and falls again in
          2027
        </SectionTitle>
        <Para>
          Indiana taxes every dollar of taxable income at one flat rate of
          2.95% for 2026, cut from 3.00% on January 1, 2026, and scheduled
          to fall to 2.90% on January 1, 2027. The personal exemption is
          $1,000 a year per exemption, plus $1,500 a year per dependent
          and $3,000 a year for an adopted child. County tax is charged on
          the same exemption-reduced base as the state tax, so the
          exemption shelters income from both layers at once.
        </Para>
        <Para>
          Indiana is the only state in this batch where the local layer is
          universal: every county levies one. Your county of residence
          and your county of principal employment are both fixed as of
          January 1 of the tax year, and an out-of-state resident working
          in an Indiana county pays that county&apos;s rate.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form WH-4"
        title="WH-4: exemptions, two counties, and a 30-day rule for short stays"
        summary="Indiana's withholding certificate sets your exemptions and both of your counties. The lines, the update rule, and the short-assignment exception are inside."
      >
        <Para>
          Indiana&apos;s withholding certificate is Form WH-4 (State Form
          48845), the Employee&apos;s Withholding Exemption and County
          Status Certificate. The top block records your county of
          residence and your county of principal employment as of January
          1 — check the box if either changes, effective the next calendar
          year. Lines 1–4 claim personal exemptions at $1,000 a year each
          (yourself, your spouse, and extra for age 65 or blindness);
          lines 6–7 claim dependents at $1,500 a year each; line 8 claims
          an adopted child at $3,000 a year; lines 9–10 add a flat dollar
          amount of extra state or county withholding per pay period. The
          form stays with your employer — it is not sent to the Department
          of Revenue — and you must update it within 10 days of a change.
        </Para>
        <Para>
          Short assignments get a break: no Indiana withholding is
          required if you work in Indiana for 30 days or fewer in the year
          and your employer keeps a contemporaneous time and attendance
          record allocating your days. Form WH-4AFF relieves withholding
          until the 30 days are exceeded. The rule does not apply to
          professional athletes, entertainers, or public figures, or to
          anyone who is or was an Indiana resident.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Credits &amp; deductions · return-only"
        title="The Indiana EITC, renter's and homeowner's deductions, and the elderly credit"
        summary="A refundable EITC worth 10% of the federal credit, plus deductions for rent and property tax. All claimed on your return, not on your paycheck."
      >
        <Para>
          <strong className="text-slate-900">Earned Income Tax Credit
          (refundable):</strong> Indiana matches 10% of your federal
          Earned Income Tax Credit, claimed on Schedule IN-EIC. A filer
          may reduce annual Indiana income tax by up to 10% of their
          federal EITC amount, subject to eligibility — and because the
          credit is refundable, it can pay out even if you owe no Indiana
          tax.
        </Para>
        <Para>
          <strong className="text-slate-900">Renter&apos;s deduction:</strong>{" "}
          up to $3,000 a year ($1,500 if married filing separately) for
          rent paid on your main home, where the home is subject to
          Indiana property tax. <strong className="text-slate-900">Homeowner&apos;s
          residential property tax deduction:</strong> up to $2,500 a year
          ($1,250 if married filing separately) for property tax paid on
          your principal residence.
        </Para>
        <Para>
          <strong className="text-slate-900">Other credits:</strong> the
          Unified Tax Credit for the Elderly pays $40 to $140 for filers
          age 65 or older with federal adjusted gross income under
          $10,000; the CollegeChoice 529 credit rewards contributions to
          Indiana&apos;s 529 plan; and the adoption credit is worth up to
          20% of the federal adoption credit. None of these is modelled in
          the calculator&apos;s withholding estimate — they settle on the
          return.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Local taxes · every county"
        title="County tax: 0.5% to 3.00%, on the same base as the state tax"
        summary="Every Indiana county adds its own rate. Marion is 2.02%, Hamilton 1.10%, Allen 1.59% — and the rate that applies to you is fixed on January 1."
      >
        <Para>
          Every Indiana county levies a local income tax on top of the
          state rate, charged on the same exemption-reduced base. Rates
          effective October 1, 2026 run from 0.5% in Porter County — the
          lowest — to 3.00% in Randolph County — the highest. The large
          counties sit in between: Marion County (Indianapolis) 2.02%,
          Hamilton County 1.10%, Allen County 1.59%, Cass County 2.95%,
          and Boone County 1.71% (changed October 1, 2026). At $60,000 of
          wages, the county layer alone is{" "}
          {formatUSD(0.0202 * inTaxable60)} in Marion County but only{" "}
          {formatUSD(0.005 * inTaxable60)} in Porter County.
        </Para>
        <Para>
          Two counties matter, not one: the county where you live and the
          county where you principally work, both fixed as of January 1
          of the tax year. An out-of-state resident working in an Indiana
          county pays that county&apos;s rate. County tax is{" "}
          <strong>not</strong> covered by Indiana&apos;s reciprocity
          agreements — a resident of a reciprocal state who works in
          Indiana can stop the state withholding with Form WH-47 but may
          still owe the county tax.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Reciprocity · Form WH-47"
        title="Live in Kentucky, Michigan, Ohio, Pennsylvania, or Wisconsin? File a WH-47"
        summary="Indiana has reciprocity with five states, plus a one-way offer to Arizona residents. Wages are taxed by the home state only — county tax is not covered."
      >
        <Para>
          Indiana maintains reciprocal income-tax agreements with
          Kentucky, Michigan, Ohio, Pennsylvania, and Wisconsin, and
          extends a unilateral offer to Arizona residents working in
          Indiana. Under reciprocity, wage, salary, tip, and commission
          income is taxed by the worker&apos;s state of residence, not the
          state where the work is performed. A resident of one of those
          states who works in Indiana files Form WH-47, the Certificate of
          Residence, with the Indiana employer to stop Indiana
          withholding. Full-year residents of those states whose only
          Indiana income was wages file Form IT-40RNR.
        </Para>
        <Para>
          Three states work the other way round — Arizona, Oregon, and
          the District of Columbia. Indiana grants no credit for tax paid
          to them; instead, you claim the credit on the other state&apos;s
          return. And reciprocity never covers the county tax: even with a
          WH-47 on file, the county layer can still apply.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="What Indiana does not tax"
        title="Social Security, military retirement, and a civil service annuity deduction"
        summary="Indiana subtracts Social Security benefits in full, and military retirement is fully exempt. Neither changes your paycheck withholding."
      >
        <Para>
          Indiana does not tax Social Security benefits: the full amount
          is subtracted from Indiana adjusted gross income, and Railroad
          Retirement Tier 1 benefits get the same treatment. Military
          retirement pay and military survivor&apos;s benefits are fully
          exempt. Federal civil service annuities get a deduction of up to
          $16,000 for filers age 62 or older, reduced dollar-for-dollar by
          any Social Security or railroad retirement benefits received.
          None of these changes what your employer withholds — they
          settle on the return.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form IT-40, and quarterly estimates on Form ES-40"
        summary="The April 15 deadline, the $1,000 estimated-tax threshold, and a 10% underpayment penalty. Pay through INTIME."
      >
        <Para>
          Full-year residents file Form IT-40 with Schedule CT-40 for the
          county tax; part-year residents and nonresidents file Form
          IT-40PNR. Returns are due April 15, 2027. A federal extension
          extends the Indiana filing deadline too — no separate Indiana
          form is needed, though Form IT-9 covers the case where you have
          no federal extension — and you must still pay at least 90% of
          the tax by April 15.
        </Para>
        <Para>
          If you have income with no Indiana withholding and expect to owe
          $1,000 or more in state plus county tax after withholding and
          credits, make estimated payments on Form ES-40, due April 15,
          June 15, and September 15, 2026, and January 15, 2027. The usual
          safe harbor is paying at least 90% of the current year&apos;s
          tax or 100% of last year&apos;s tax (110% if last year&apos;s
          federal AGI exceeded $150,000 single or joint, or $75,000
          married filing separately). The underpayment penalty is 10% of
          the underpayment per installment period, figured on Schedule
          IT-2210. Pay online through INTIME at intime.dor.in.gov.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* MICHIGAN                                                            */
/* ------------------------------------------------------------------ */

function MichiganContent() {
  const slug = "michigan-paycheck-calculator";
  const st = getStateBySlug(slug);
  const sd = st?.standardDeductionSingle ?? 0;
  const rows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(slug, gross);
    return [
      formatUSD0(gross),
      formatUSD0(stateTaxableIncome(slug, gross)),
      formatAmountOrUnavailable(r.annualState),
    ];
  });
  const miTaxable60 = stateTaxableIncome(slug, 60000);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          Michigan tax at real salaries — one flat rate, no standard
          deduction
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the 2026 personal
          exemption of {formatUSD0(sd)}, and applies the single flat rate
          of 4.25% to what is left. Michigan has no standard deduction:
          the {formatUSD0(sd)} is the personal exemption allowance, worth
          the same amount for every exemption you claim on your MI-W4.
          City income tax, where it applies, is on top of the state tax.
        </Para>
        <NoteBox tone="blue">
          <strong>City tax is not in this table.</strong> About two dozen
          Michigan cities levy their own income tax — Detroit charges
          2.4% to residents and 1.2% to nonresidents. A Detroit resident
          earning $60,000 pays city tax on top of the{" "}
          {formatAmountOrUnavailable(EX_MI_60.annualState)} state tax in
          this table. See the local-taxes section below.
        </NoteBox>
        <WorkedTable
          caption="Michigan income tax, single filer, 2026 — state tax only"
          headers={["Gross wages", "MI taxable income", "MI income tax"]}
          rows={rows}
          footnote={`At $60,000 the effective Michigan income-tax rate is ${effectiveRatePct(EX_MI_60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(examplePaycheck(slug, 150000).annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, so the figures match the tool. City income tax is additional where it applies.`}
        />
        <Para>
          The $60,000 row in detail: 4.25% × {formatUSD0(miTaxable60)} ={" "}
          {formatAmountOrUnavailable(EX_MI_60.annualState)}. The same
          $60,000 single filer owes{" "}
          {formatAmountOrUnavailable(EX_CA_60.annualState)} in California
          — Michigan&apos;s flat rate costs more at this pay, before any
          city tax.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department&apos;s own terms</Eyebrow>
        <SectionTitle>
          A flat 4.25% — the 2023 dip to 4.05% lasted one year only
        </SectionTitle>
        <Para>
          Michigan taxes every dollar of taxable income at one flat rate of
          4.25% for 2026. The rate dipped to 4.05% for tax year 2023 only,
          under a revenue trigger in state law, then returned to 4.25% for
          2024 and has held there since. The Department of Treasury
          confirmed in April 2026 that no further cut was triggered for
          2026, because general-fund revenue fell 1.56% in fiscal year
          2025 against inflation of 2.70%.
        </Para>
        <Para>
          There is no Michigan standard deduction. Instead, each personal
          and dependency exemption is worth {formatUSD0(sd)} for 2026, up
          from $5,800 in 2025. The worked examples above are a single
          filer with one exemption; a filer with a spouse and dependents
          claims more exemptions and has lower taxable income than the
          table shows.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form MI-W4"
        title="MI-W4: each exemption is worth $5,900 a year — and no form means zero"
        summary="Michigan's withholding certificate counts exemptions, not allowances. Line 6, the reciprocity line, and the no-form default are inside."
      >
        <Para>
          Michigan&apos;s withholding certificate is Form MI-W4, the
          Employee&apos;s Michigan Withholding Exemption Certificate. Line
          6 is the number of personal and dependency exemptions you claim
          — yourself, a spouse with no income, and each dependent — and
          you may not claim more than you can claim on your Michigan
          return. Each exemption is worth {formatUSD0(sd)} a year of
          income shielded from withholding. Line 8b is the reciprocity
          claim for residents of Illinois, Indiana, Kentucky, Minnesota,
          Ohio, and Wisconsin. Give the completed form to your employer;
          it is not sent to the Department of Treasury.
        </Para>
        <Para>
          If you never file an MI-W4, your employer must withhold as if
          you claimed zero exemptions — the maximum. Supplemental pay is
          withheld at the same 4.25% rate as regular wages. File a new
          MI-W4 whenever your exemptions change.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Credits · return-only"
        title="The Michigan EITC, homestead credit, and home heating credit"
        summary="A refundable EITC worth 30% of the federal credit, plus the property-tax and heating credits. All claimed on your MI-1040, not on your paycheck."
      >
        <Para>
          <strong className="text-slate-900">Earned Income Tax Credit
          (refundable):</strong> Michigan matches 30% of your federal
          Earned Income Tax Credit — raised from 6% to 30% retroactive to
          tax year 2022 under Public Act 4 of 2023. A filer may reduce
          annual Michigan income tax by up to 30% of their federal EITC
          amount, subject to eligibility — and because the credit is
          refundable, it can pay out even if you owe no Michigan tax. The
          maximum Michigan EITC was $2,414 for tax year 2025; the 2026
          maximum had not been published when this page was researched.
        </Para>
        <Para>
          <strong className="text-slate-900">Homestead Property Tax
          Credit (refundable):</strong> a credit for homeowners and
          renters alike, claimed on Form MI-1040CR. Renters qualify using
          20% of annual rent as the property-tax equivalent, and the
          credit is limited by household resources. The 2026 maximum had
          not been published when this page was researched, so no figure
          is given here.
        </Para>
        <Para>
          <strong className="text-slate-900">Home Heating Credit
          (refundable):</strong> an income-based credit for low-income
          households to offset home heating costs, claimed on Form
          MI-1040CR-7. None of these credits is modelled in the
          calculator&apos;s withholding estimate — they settle on the
          return.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Local taxes · about two dozen cities"
        title="City income tax: Detroit 2.4%, most other cities 1%"
        summary="Detroit, Grand Rapids, Flint and about twenty other cities levy their own tax. Residents pay roughly double the nonresident rate."
      >
        <Para>
          About two dozen Michigan cities levy a local income tax under the
          Uniform City Income Tax Act, and the rate roughly doubles for
          residents. Detroit charges 2.4% to residents and 1.2% to
          nonresidents, with a $600 city exemption claimed on Form 5123;
          Detroit and Flint are administered directly by the Department of
          Treasury. Grand Rapids and Saginaw charge 1.5% to residents and
          0.75% to nonresidents. Most other cities — including Flint,
          Pontiac, Jackson, Battle Creek, and East Lansing — charge 1% to
          residents and 0.5% to nonresidents.
        </Para>
        <Para>
          Nonresidents pay only on income earned for work physically done
          inside the city limits. City tax is <strong>not</strong> covered
          by Michigan&apos;s reciprocity agreements, and your employer
          withholds it from your pay alongside the state tax.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Reciprocity · Form MI-W4, line 8b"
        title="Live in Illinois, Indiana, Kentucky, Minnesota, Ohio, or Wisconsin? Tick line 8b"
        summary="Michigan has reciprocity with six states. Claim it on the MI-W4 itself — there is no separate form."
      >
        <Para>
          Michigan maintains reciprocal income-tax agreements with six
          states: Illinois, Indiana, Kentucky, Minnesota, Ohio, and
          Wisconsin. Under reciprocity, wage income is taxed by the
          worker&apos;s state of residence, not the state where the work
          is performed. A resident of one of those states who works in
          Michigan claims the exemption on line 8b of Form MI-W4, given to
          the Michigan employer — there is no separate reciprocity form.
          Reciprocity covers the state income tax only: it does not cover
          city income tax, and it does not cover any other kind of income.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="What Michigan does not tax"
        title="Social Security, military retirement, and the 2026 pension subtraction"
        summary="Social Security is fully exempt, and 2026 is the year the four-year pension phase-in reaches 100%. The caps and the forms are inside."
      >
        <Para>
          Michigan does not tax Social Security benefits at all: the entire
          amount is subtracted from Michigan taxable income. Military
          retirement pay and Michigan National Guard pensions are likewise
          fully exempt.
        </Para>
        <Para>
          For other retirement income, the four-year phase-in under Public
          Act 4 of 2023 reaches 100% in tax year 2026. Every retiree,
          regardless of birth year, may now subtract combined public and
          private retirement income up to $67,610 on a single return or
          $135,220 on a joint return (Revenue Administrative Bulletin
          2026-1). Retirees born before 1946 keep the older, more generous
          rule: their public pension is fully deductible with no cap, and
          only their private retirement income counts against the
          $67,610 / $135,220 ceiling. The subtraction is figured on Form
          4884, the Michigan Pension Schedule, and carried to Schedule 1,
          line 27 of the MI-1040.
        </Para>
        <Para>
          Two alternatives sit alongside the subtraction. Filers age 67 or
          older may instead take a $20,000 standard deduction ($40,000
          joint) against all income, reduced by the personal exemption —
          use whichever gives the lower bill, not both. And for tax years
          2026 through 2028, a fix in Public Act 24 of 2025 lets some
          retirees subtract both their Social Security income and a full
          standard deduction. A $500 deduction is also available for
          qualified disabled veterans.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form MI-1040, and quarterly estimates on Form MI-1040ES"
        summary="The April 15 deadline, the $500 estimated-tax threshold, and a penalty that can reach 25% of an unpaid installment."
      >
        <Para>
          Full-year residents file Form MI-1040, due April 15, 2027 for tax
          year 2026. A federal extension extends the Michigan filing
          deadline, but not the payment deadline — interest still runs from
          April 15.
        </Para>
        <Para>
          If you have income with no Michigan withholding and expect to owe
          more than $500 in Michigan tax after withholding and credits,
          make estimated payments on Form MI-1040ES, due April 15, June
          15, and September 15, 2026, and January 15, 2027 — you may also
          pay the full year on April 15. The safe harbor is the lesser of
          90% of your 2026 tax or 100% of your 2025 tax (110% if your 2025
          adjusted gross income exceeded $150,000, or $75,000 married
          filing separately). The penalty is 25% of an installment that is
          never paid (minimum $25), or 10% if it is paid short or late
          (minimum $10), plus interest — 8.48% for January through June
          2026 and 7.85% for July through December 2026. Filing your
          return by January 31, 2027 and paying in full replaces the
          January 15 payment, and no penalty applies if you were not
          required to pay estimates in the prior year. Pay through Michigan
          Treasury Online or eServices.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* ILLINOIS                                                            */
/* ------------------------------------------------------------------ */

function IllinoisContent() {
  const slug = "illinois-paycheck-calculator";
  const st = getStateBySlug(slug);
  const sd = st?.standardDeductionSingle ?? 0;
  const rows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(slug, gross);
    return [
      formatUSD0(gross),
      formatUSD0(stateTaxableIncome(slug, gross)),
      formatAmountOrUnavailable(r.annualState),
    ];
  });
  const ilTaxable60 = stateTaxableIncome(slug, 60000);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          Illinois tax at real salaries — one flat rate, no standard
          deduction, no local tax
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the 2026 personal
          exemption allowance of {formatUSD0(sd)}, and applies the single
          flat rate of 4.95% to what is left. Illinois has no standard
          deduction and no itemized deductions: the {formatUSD0(sd)} is
          the whole shelter. No city or county adds a local income tax, so
          the state rate is the only income tax on an Illinois pay stub.
        </Para>
        <NoteBox tone="blue">
          <strong>The exemption is not for everyone.</strong> The{" "}
          {formatUSD0(sd)} allowance is disallowed entirely once federal
          adjusted gross income passes $250,000 for single filers or
          $500,000 for joint filers — so a very high earner pays 4.95% on
          every dollar. Filers age 65 or older, or who are legally blind,
          get an additional $1,000 allowance. None of the worked examples
          here is near the disallowance line.
        </NoteBox>
        <WorkedTable
          caption="Illinois income tax, single filer, 2026"
          headers={["Gross wages", "IL taxable income", "IL income tax"]}
          rows={rows}
          footnote={`At $60,000 the effective Illinois income-tax rate is ${effectiveRatePct(EX_IL_60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(examplePaycheck(slug, 150000).annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          The $60,000 row in detail: 4.95% × {formatUSD0(ilTaxable60)} ={" "}
          {formatAmountOrUnavailable(EX_IL_60.annualState)}. The same
          $60,000 single filer owes{" "}
          {formatAmountOrUnavailable(EX_CA_60.annualState)} in California
          — Illinois&apos;s flat rate costs substantially more at this
          pay, and the gap widens as pay rises because California&apos;s
          low brackets shelter the first dollars.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department&apos;s own terms</Eyebrow>
        <SectionTitle>
          A flat 4.95% since July 1, 2017 — flat by constitution
        </SectionTitle>
        <Para>
          Illinois taxes income at a single flat rate of 4.95%, in effect
          since July 1, 2017 under 35 ILCS 5/201. The Illinois
          constitution requires a flat rate, so there are no brackets to
          climb and no marginal-rate surprise: the rate on your last dollar
          is the same as the rate on your first taxable dollar. The
          personal exemption allowance is {formatUSD0(sd)} per person for
          2026 ($5,850 for a joint return with two exemptions), calculated
          as a $2,050 base plus a cost-of-living adjustment.
        </Para>
        <Para>
          Illinois has no standard deduction, no itemized deductions, and
          no local income tax anywhere in the state. That makes the
          arithmetic simple — one rate, one allowance — but it also means
          there is no deduction to shelter the first dollars the way
          other states&apos; standard deductions do.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form IL-W-4"
        title="IL-W-4: Illinois still counts allowances — the federal W-4 does not"
        summary="Illinois kept its allowance system after the federal W-4 dropped allowances in 2020. Line 1, line 2, line 3, and the no-form default are inside."
      >
        <Para>
          Illinois&apos;s withholding certificate is Form IL-W-4, the
          Employee&apos;s and Other Payee&apos;s Illinois Withholding
          Allowance Certificate. Unlike the federal W-4, which dropped
          allowances in 2020, Illinois still uses them: the basic allowance
          worksheet counts your personal exemptions plus extra for a
          spouse, dependents, age 65 or older, blindness, and certain
          credits such as property taxes on your primary residence. Line 1
          is your number of allowances, each worth {formatUSD0(sd)} a
          year; line 2 is additional allowances worth $1,000 each; line 3
          is any extra flat amount you want withheld each pay period. The
          withholding formula is 4.95% of wages minus the allowance
          amounts spread across your pay periods.
        </Para>
        <Para>
          Complete the form on or before the day you start work. If you do
          not file a completed and signed IL-W-4, your employer must
          withhold 4.95% on your entire pay, with no allowances at all.
          You may claim &ldquo;Exempt&rdquo; if you had no Illinois
          liability last year and expect none this year, and you should
          review the form before December 1 of each year — if your
          allowances change, file a new one. Even if you are exempt from
          federal withholding, Illinois may still withhold if your pay is
          greater than the Illinois allowance amount.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Credits · return-only"
        title="The Illinois EITC, property tax credit, and K-12 credit"
        summary="A refundable EITC worth 20% of the federal credit, a 5% property tax credit, and a K-12 expense credit. All claimed on your IL-1040, not on your paycheck."
      >
        <Para>
          <strong className="text-slate-900">Earned Income Tax Credit
          (refundable):</strong> Illinois matches 20% of your federal
          Earned Income Tax Credit. A filer may reduce annual Illinois
          income tax by up to 20% of their federal EITC amount, subject to
          eligibility — you must be 18 or older by year-end, with earned
          income below $68,675 (the limit varies by filing status and
          number of children) and investment income under $11,950. Because
          the credit is refundable, it can pay out even if you owe no
          Illinois tax.
        </Para>
        <Para>
          <strong className="text-slate-900">Property Tax Credit
          (nonrefundable):</strong> 5% of the Illinois property tax you
          paid on your principal residence, claimed on your IL-1040. The
          credit is capped by income — federal AGI of $250,000 for single
          filers and $500,000 for joint filers — and nonresidents are not
          eligible.
        </Para>
        <Para>
          <strong className="text-slate-900">K-12 education expense
          credit (nonrefundable):</strong> a credit of up to $750 for
          qualifying K-12 education expenses. None of these credits is
          modelled in the calculator&apos;s withholding estimate — they
          settle on the return. One credit is deliberately left out here:
          Illinois also offered a Child Tax Credit worth 40% of the
          Illinois EITC for recipients with a qualifying child under 12,
          but it was enacted for tax years 2024 and 2025 only, and its
          continuation for 2026 could not be verified — so it is not
          claimed on this page.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Reciprocity · Form IL-W-5-NR"
        title="Live in Iowa, Kentucky, Michigan, or Wisconsin? File an IL-W-5-NR, not an IL-W-4"
        summary="Illinois has reciprocity with four states. Residents of those states working in Illinois can stop Illinois withholding entirely — with a different form."
      >
        <Para>
          Illinois maintains reciprocal income-tax agreements with four
          states: Iowa, Kentucky, Michigan, and Wisconsin. Under
          reciprocity, wage income is taxed by the worker&apos;s state of
          residence, not the state where the work is performed. A resident
          of one of those states who works in Illinois files Form IL-W-5-NR,
          the Employee&apos;s Statement of Nonresidence in Illinois, with
          the Illinois employer — not the IL-W-4 — so Illinois tax is not
          withheld and the home state&apos;s tax is withheld instead.
          Military spouses use the same form. The Illinois–Iowa agreement
          was confirmed in force for 2026.
        </Para>
        <Para>
          Reciprocity covers wages and salaries only. Without the form on
          file, Illinois withholding applies and the worker files two
          returns to sort it out.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="What Illinois does not tax"
        title="No retirement income is taxed in Illinois — none of it, at any age"
        summary="Social Security, pensions, 401(k) and IRA withdrawals, Roth conversions, and military retirement are all subtracted in full on IL-1040 line 5."
      >
        <Para>
          Illinois is the most generous state in this batch for retirees:
          it does not tax any retirement income. Social Security benefits,
          private and public pensions, 401(k), 403(b), and 457 plan
          distributions, traditional IRA withdrawals, Roth conversions,
          military retirement pay, railroad retirement benefits, and most
          annuity income are all subtracted in full on IL-1040 line 5 —
          at any age, with no income limit. The Department of Revenue says
          plainly that most retirement income is exempt from Illinois
          income tax and no withholding is required on it, even if federal
          income tax is withheld.
        </Para>
        <Para>
          That exemption is also why the worked examples above are for
          workers, not retirees: a retiree living entirely on the income
          above would owe $0 in Illinois income tax at any of these pay
          levels, while still owing federal tax on the same money.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form IL-1040, and quarterly estimates on Form IL-1040-ES"
        summary="The April 15 deadline, the $1,000 estimated-tax threshold, and the safe harbor. File free through MyTax Illinois."
      >
        <Para>
          Full-year residents file Form IL-1040, due April 15, 2027 for tax
          year 2026. You must file if you are required to file a federal
          return, or if your Illinois base income exceeds your exemption
          allowance. Nonresidents and part-year residents file Schedule NR,
          and the exemption allowance is prorated by the share of your
          income that is Illinois income. File free electronically through
          MyTax Illinois.
        </Para>
        <Para>
          If you have income with no Illinois withholding and reasonably
          expect your 2026 liability to exceed $1,000 after subtracting
          Illinois withholding, pass-through withholding, and credits, make
          estimated payments on Form IL-1040-ES, due April 15, June 15,
          and September 15, 2026, and January 15, 2027. The usual safe
          harbor is paying at least 90% of the current year&apos;s tax or
          100% of last year&apos;s tax in four equal, timely installments.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* WISCONSIN                                                           */
/* ------------------------------------------------------------------ */

function WisconsinContent() {
  const slug = "wisconsin-paycheck-calculator";
  const st = getStateBySlug(slug);
  const sd = st?.standardDeductionSingle ?? 0;
  const exemption = st?.exemptionSingle ?? 0;
  const brackets = st?.brackets ?? [];
  const rows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(slug, gross);
    return [
      formatUSD0(gross),
      formatUSD0(engineTaxableIncome(slug, gross)),
      formatAmountOrUnavailable(r.annualState),
    ];
  });
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          Wisconsin tax at real salaries — four brackets, and a standard
          deduction that shrinks as pay rises
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the 2026 standard
          deduction of {formatUSD0(sd)} and the personal exemption of{" "}
          {formatUSD0(exemption)}, and applies the four graduated rates
          from 3.5% to 7.65%. Only the dollars inside each bracket are
          taxed at that bracket&apos;s rate. The table shows the
          calculator&apos;s figures — and the standard deduction phases
          out with income, so the deduction actually subtracted is{" "}
          {formatUSD(30000 - engineTaxableIncome(slug, 30000) - exemption)}{" "}
          at $30,000,{" "}
          {formatUSD(60000 - engineTaxableIncome(slug, 60000) - exemption)}{" "}
          at $60,000, and{" "}
          {formatUSD(150000 - engineTaxableIncome(slug, 150000) - exemption)}{" "}
          at $150,000, not the full {formatUSD0(sd)}.
        </Para>
        <WorkedTable
          caption="Wisconsin income tax, single filer, 2026"
          headers={["Gross wages", "WI taxable income", "WI income tax"]}
          rows={rows}
          footnote={`At $60,000 the effective Wisconsin income-tax rate in the table is ${effectiveRatePct(EX_WI_60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(examplePaycheck(slug, 150000).annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, so the figures match the tool — including the standard-deduction phaseout.`}
        />
        <Para>
          The $60,000 row in detail:{" "}
          {bracketDetailEngine(slug, 60000, brackets)}; total{" "}
          {formatAmountOrUnavailable(EX_WI_60.annualState)}. The same
          $60,000 single filer owes{" "}
          {formatAmountOrUnavailable(EX_CA_60.annualState)} in
          California — Wisconsin&apos;s bill is higher at this pay.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department&apos;s own terms</Eyebrow>
        <SectionTitle>
          Four brackets — and a deduction that disappears at $136,453
        </SectionTitle>
        <Para>
          Wisconsin taxes wages on four graduated rates — 3.5% to $15,110
          of taxable income, 4.4% to $51,950, 5.3% to $332,720, and 7.65%
          above — for a single filer in 2026. The standard deduction is{" "}
          {formatUSD0(sd)} for a single filer and $25,840 for a joint
          return, but it phases out: single filers lose 12% of income over
          $20,119, and the deduction reaches $0 at $136,453 (joint filers
          lose 19.778% over $29,039, reaching $0 at $159,690). On top of
          the deduction, each personal exemption is worth{" "}
          {formatUSD0(exemption)} — plus $250 more if you are 65 or older —
          and no exemption is allowed if someone else can claim you as a
          dependent.
        </Para>
        <Para>
          Nonresidents and part-year residents prorate the standard
          deduction and the exemptions by the ratio of Wisconsin income to
          federal adjusted gross income. No Wisconsin city or county levies
          an income tax — the state reserves that power to itself — so the
          state rate in the table above is the only income tax on a
          Wisconsin pay stub.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form WT-4"
        title="WT-4: file it only if your Wisconsin exemptions differ from your federal ones"
        summary="Wisconsin's certificate doubles as new-hire reporting. When you must file it, the exemption lines, and the withholding formula that differs from the return."
      >
        <Para>
          Wisconsin&apos;s withholding certificate is Form WT-4 (form
          W-204), the Employee&apos;s Wisconsin Withholding Exemption
          Certificate and New Hire Reporting form. Every employee must file
          one with each employer — unless you claim the same number of
          exemptions as for federal W-4 purposes, in which case the
          federal form carries over. Complete lines 1–3 only if your
          Wisconsin exemptions differ from your federal ones: line 1(a)
          yourself, 1(b) your spouse, 1(c) your dependents, 1(d) the total.
          Line 2 adds a flat dollar amount of extra withholding per pay
          period. Line 3 is the &ldquo;Exempt&rdquo; claim — available only
          if you had no Wisconsin liability last year and expect none this
          year — which expires on April 30 of the following year and must
          be revoked within 10 days if you expect to owe tax. Update the
          form within 10 days if your exemptions decrease. The form also
          doubles as new-hire reporting to the Department of Workforce
          Development, recording your date of birth and date of hire.
        </Para>
        <Para>
          Your withholding will not match the table above, and that is by
          design. The Department&apos;s withholding guide (Publication
          W-166) uses its own deduction formula — $6,702 for a single
          filer and $9,461 for a married filer, phasing out at 12% and 20%
          — a $400 allowance per exemption, and a withholding rate schedule
          of 3.54%, 4.65%, 5.30%, and 7.65%. Supplemental wages are
          withheld at flat percentages by annual gross: 3.54% below
          $12,760, 4.65% to $25,520, 5.30% to $280,950, and 7.65% above.
          Withholding is an instalment plan; the return settles the
          difference.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Credits · return-only"
        title="The Wisconsin EIC, homestead credit, and married couple credit"
        summary="A refundable EIC that pays nothing to childless workers, a homestead credit for low-income households, and 3% of the lower-earning spouse's pay. All claimed on your return."
      >
        <Para>
          <strong className="text-slate-900">Earned Income Credit
          (refundable):</strong> Wisconsin matches a percentage of your
          federal Earned Income Credit — 4% with one qualifying child, 11%
          with two, and 34% with three or more. A filer may reduce annual
          Wisconsin income tax by up to those percentages of their federal
          EIC amount, subject to eligibility — but only full-year residents
          qualify, only filers with at least one qualifying child get
          anything at all (childless workers receive no state credit), and
          married couples generally must file jointly. The federal amount
          is recomputed under Wisconsin law on Schedule I.
        </Para>
        <Para>
          <strong className="text-slate-900">Homestead Credit
          (refundable):</strong> a credit for low-income homeowners and
          renters — renters qualify using a property-tax equivalent —
          claimed on Schedule H or H-EZ. You must be a full-year resident
          and 18 or older by year-end, and the credit shrinks as household
          income rises, reaching $0 once household income passes $24,680,
          the threshold for the most recently published claim year.
        </Para>
        <Para>
          <strong className="text-slate-900">Married couple credit
          (nonrefundable):</strong> 3% of the lower-earning spouse&apos;s
          income, up to $480, for joint filers where both spouses have
          earned income. Wisconsin also offers an itemized deduction credit
          worth 5% of certain federal itemized deductions above the
          standard deduction. None of these credits is modelled in the
          calculator&apos;s withholding estimate — they settle on the
          return.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Reciprocity · Form W-220"
        title="Live in Illinois, Indiana, Kentucky, or Michigan? File a W-220 — but not if you live in Minnesota"
        summary="Wisconsin has reciprocity with four states. The Minnesota agreement ended on January 1, 2010 and has not returned — that gap is the trap."
      >
        <Para>
          Wisconsin currently has reciprocity agreements with four states:
          Illinois, Indiana, Kentucky, and Michigan. A resident of one of
          those states who works in Wisconsin files Form W-220, the
          Nonresident Employee&apos;s Withholding Reciprocity Declaration,
          with the Wisconsin employer, so Wisconsin tax is not withheld and
          the home state&apos;s tax is withheld instead. Reciprocity covers
          wages, salaries, and commissions only — not self-employment,
          rental, investment, lottery, or pass-through income.
        </Para>
        <Para>
          What is missing from that list is the trap: Minnesota. The
          Wisconsin–Minnesota agreement ended on January 1, 2010 and has
          not returned, even though the Department of Revenue studied
          reinstating it and released the study results in December 2024.
          A Minnesota resident working in Wisconsin — or a Wisconsin
          resident working in Minnesota — files in both states and claims a
          credit for the tax paid to the other state. Without a W-220 on
          file for a reciprocal state, Wisconsin withholding applies and
          the worker files two returns to sort it out.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="What Wisconsin does not tax"
        title="Social Security, military retirement, and two retirement subtractions"
        summary="Social Security is fully exempt. Retirees 65 and older get a $5,000 subtraction; those 67 and older get up to $24,000 — but the bigger one bars all credits."
      >
        <Para>
          Wisconsin does not tax Social Security benefits at all. You first
          report the same taxable Social Security amount that appears on
          your federal return, then take a corresponding subtraction on
          Schedule SB to remove it entirely from Wisconsin taxable income —
          and the exemption applies to retirement, disability, and survivor
          benefits alike, with no income cap or phaseout. Military
          retirement pay is likewise fully exempt, including Survivor
          Benefit Plan payments.
        </Para>
        <Para>
          Two further subtractions apply to other retirement income. If
          you are at least 65 by the end of the tax year, you may subtract
          up to $5,000 of qualified retirement plan or IRA distributions,
          provided your federal adjusted gross income is under $15,000 as
          a single filer or $30,000 on a joint return. If you are at least
          67, you may subtract up to $24,000 — $48,000 on a joint return
          where both spouses qualify — with no income limit, a subtraction
          first available for tax year 2025. But there is a catch: if you
          claim the $24,000 subtraction, you may not claim any Wisconsin
          income tax credit on that return.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form 1, and quarterly estimates on Form 1-ES"
        summary="The April 15 deadline, the $500 estimated-tax threshold with a three-way test, and the January 31 filing option."
      >
        <Para>
          Full-year residents file Form 1, due April 15, 2027 for tax year
          2026. You must make estimated payments on Form 1-ES if you
          expect to owe $500 or more after withholding and credits{" "}
          <strong>and</strong> your withholding is less than the smallest
          of three figures: 90% of your 2026 tax, 100% of your 2025 tax on
          a 12-month return, or 90% of your 2026 tax computed by
          annualizing your income. Four installments are due April 15,
          June 15, and September 15, 2026, and January 15, 2027.
        </Para>
        <Para>
          Filing your return by January 31, 2027 and paying in full
          replaces the January 15 payment, and no estimates are required at
          all if you were a full-year Wisconsin resident in 2025 with no
          2025 liability. Farmers and fishers who earn at least two-thirds
          of their income from those activities may pay in full by January
          15, 2027 or file by March 1, 2027 instead. Underpayment interest
          is figured on Schedule U, and payments go through
          tap.revenue.wi.gov/pay.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* MINNESOTA                                                           */
/* ------------------------------------------------------------------ */

function MinnesotaContent() {
  const slug = "minnesota-paycheck-calculator";
  const st = getStateBySlug(slug);
  const sd = st?.standardDeductionSingle ?? 0;
  const brackets = st?.brackets ?? [];
  const rows = [30000, 60000, 150000, 200000].map((gross) => {
    const r = examplePaycheck(slug, gross);
    return [
      formatUSD0(gross),
      formatUSD0(stateTaxableIncome(slug, gross)),
      formatAmountOrUnavailable(r.annualState),
      formatUSD(r.annualStateInsurance),
    ];
  });
  const mnTaxable60 = stateTaxableIncome(slug, 60000);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          Minnesota tax at real salaries — the highest top rate in this
          batch, plus Paid Leave
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the 2026 standard
          deduction of {formatUSD0(sd)}, and applies the four graduated
          rates from 5.35% to 9.85%. Only the dollars inside each bracket
          are taxed at that bracket&apos;s rate. The fourth column is
          Minnesota Paid Leave — a payroll program, not an income tax —
          at the maximum employee share of 0.44% of wages.
        </Para>
        <NoteBox tone="blue">
          <strong>Two things the table does not include.</strong> First,
          the $5,300 dependent exemption: a filer with qualifying
          dependents subtracts up to $5,300 per dependent from taxable
          income, so the table — which assumes no dependents — overstates
          the bill for a parent. Second, the standard deduction phases
          down at high incomes, but only once federal adjusted gross income
          passes $244,400, so it does not touch any row here — not even
          the $200,000 row.
        </NoteBox>
        <WorkedTable
          caption="Minnesota income tax + MN Paid Leave, single filer, 2026"
          headers={["Gross wages", "MN taxable income", "MN income tax", "MN Paid Leave (0.44%)"]}
          rows={rows}
          footnote={`At $60,000 the effective Minnesota income-tax rate is ${effectiveRatePct(EX_MN_60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(examplePaycheck(slug, 150000).annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, so the figures match the tool. MN Paid Leave is the maximum employee share — your employer may cover part of it.`}
        />
        <Para>
          The $60,000 row in detail: {bracketDetailText(slug, 60000, brackets)}; total{" "}
          {formatUSD(applyBrackets(mnTaxable60, brackets))}, plus{" "}
          {formatUSD(EX_MN_60.annualStateInsurance)} of MN Paid Leave. The
          same $60,000 single filer owes{" "}
          {formatAmountOrUnavailable(EX_CA_60.annualState)} in California
          — Minnesota&apos;s higher rates and smaller deduction keep it
          well above California at the same pay, before Paid Leave.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department&apos;s own terms</Eyebrow>
        <SectionTitle>
          Four rates up to 9.85% — the 7th-highest top rate in the country
        </SectionTitle>
        <Para>
          Minnesota taxes wages on four graduated rates — 5.35% to $33,310
          of taxable income, 6.80% to $109,430, 7.85% to $203,150, and
          9.85% above — for a single filer in 2026. The top rate of 9.85%
          is the highest in this batch and the 7th-highest in the country.
          The brackets are recalculated every year for inflation and
          rounded to the nearest $10 under Minnesota Statute 290.06. The
          standard deduction is {formatUSD0(sd)} for a single filer,
          $30,600 for a joint return, and $23,000 for a head of household,
          plus $5,300 per qualifying dependent — and the deduction phases
          down only above $244,400 of federal AGI, by up to 80%.
        </Para>
        <Para>
          No Minnesota city or county levies an income tax, so the state
          rate in the table above is the only income tax on a Minnesota pay
          stub. The other line on the stub is MN Paid Leave, covered in
          the next section.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Payroll programs · on the stub, separate from income tax</Eyebrow>
        <SectionTitle>
          MN Paid Leave: 0.88% in total, at most 0.44% from your pay
        </SectionTitle>
        <Para>
          Minnesota Paid Leave started on January 1, 2026, under Minnesota
          Statutes chapter 268B, and it pays for family and medical leave:
          12 to 20 weeks of benefits in a 52-week period. The total premium
          for 2026 and 2027 is 0.88% of wages, and your employer may deduct
          up to half of it — 0.44% — from your pay, so the table above shows
          the maximum employee share. At $60,000 that is{" "}
          {formatUSD(EX_MN_60.annualStateInsurance)} a year; at $200,000 the
          line stops growing at{" "}
          {formatUSD(examplePaycheck(slug, 200000).annualStateInsurance)}{" "}
          a year, because the premium applies only up to the Social
          Security wage base. Small employers with 30 or fewer employees
          whose average wage is no more than 150% of the state average pay
          a reduced total rate of 0.66%, with a minimum employer share of
          0.22%.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form W-4MN"
        title="W-4MN: allowances are worth $5,300 each — and no form means single with zero"
        summary="Minnesota kept its own allowance system. Section 1 or Section 2, never both — and the federal W-4 does not control Minnesota withholding."
      >
        <Para>
          Minnesota&apos;s withholding certificate is Form W-4MN, the
          Minnesota Employee Withholding Certificate. Your federal W-4 does
          not control Minnesota withholding: if you completed a 2026 federal
          W-4, you must complete a W-4MN too. You complete either Section 1
          (allowances) or Section 2 (an exemption from withholding), never
          both. Section 1 counts allowances in steps A–F — filing status,
          dependents, and a worksheet for itemizers — and each allowance is
          worth $5,300 of annual income shielded from withholding, the same
          as the dependent exemption. Line 1 is your total allowances;
          line 2 is any additional Minnesota tax you want withheld each pay
          period, as a flat dollar amount.
        </Para>
        <Para>
          Your filing-status choices are Single, Married, or Married but
          withhold at the higher Single rate — the last one is the lever to
          use if you want more withheld without adding a dollar amount. If
          no W-4MN is in effect, your employer withholds as if you were
          single with zero allowances, whatever your federal form says —
          the maximum. Section 2 exemption claims must be renewed by
          February 15 of each year. Supplemental wages are withheld at a
          flat 6.25%, regardless of your allowances.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Credits · 2026 amounts · return-only"
        title="The Child Tax Credit, Working Family Credit, and Renter's Credit"
        summary="Three refundable credits that can be worth more than the tax itself. All claimed on your Form M1, not on your paycheck."
      >
        <Para>
          <strong className="text-slate-900">Child Tax Credit
          (refundable):</strong> $1,800 per qualifying child under 18, with
          no limit on the number of children. A filer may reduce annual
          Minnesota income tax by up to $1,800 per qualifying child,
          subject to eligibility. The credit phases out once adjusted gross
          income passes $32,680 for single filers or $38,770 for joint
          filers — with one child, the full phaseout lands at $50,905
          single or $56,065 joint when the full Working Family Credit is
          also claimed, and each additional child raises the threshold by
          about $15,000. You can also choose to receive part of next
          year&apos;s credit early, in three advance payments. A separate
          credit for qualifying older children pays $1,020 for one, $2,330
          for two, and $2,770 for three or more.
        </Para>
        <Para>
          <strong className="text-slate-900">Working Family Credit
          (refundable):</strong> Minnesota&apos;s version of the EITC,
          worth 4% of the first $9,690 of earned income — a maximum of
          $388 with no qualifying children, and higher with children. A
          filer may reduce annual Minnesota income tax by up to that
          amount, subject to eligibility. The credit phases out once income
          passes $31,950 for single filers or $37,910 for joint filers, and
          full-year nonresidents do not qualify.
        </Para>
        <Para>
          <strong className="text-slate-900">Renter&apos;s Credit
          (refundable):</strong> the old separate property-tax refund for
          renters is now a credit on the income tax return itself, claimed
          on Form M1 — there is no separate summer refund any more. A
          filer may reduce annual Minnesota income tax by up to $2,780,
          subject to eligibility, where household income is below $79,330.
          You need a Certificate of Rent Paid from your landlord, due to
          you by January 31. Homeowners and mobile-home owners still file
          the property tax refund on Form M1PR.
        </Para>
        <Para>
          <strong className="text-slate-900">K-12 Education Credit and
          Subtraction:</strong> the subtraction covers up to $1,625 per
          child in grades K–6 and $2,500 per child in grades 7–12 for
          qualifying education expenses, and the credit covers 75% of
          qualifying expenses, income-restricted, phasing out above
          $77,550. Minnesota also offers a 529 plan credit and a child and
          dependent care credit. None of these credits is modelled in the
          calculator&apos;s withholding estimate — they settle on the
          return.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Reciprocity · Form MWR"
        title="Live in Michigan or North Dakota? File an MWR every year — but not if you live in Wisconsin"
        summary="Minnesota has reciprocity with two states only. The Wisconsin agreement ended in 2010, and the MWR must be renewed annually."
      >
        <Para>
          Minnesota has income tax reciprocity agreements with two states:
          Michigan and North Dakota. A resident of one of them who works in
          Minnesota files Form MWR, the Reciprocity Exemption and Affidavit
          of Residency, with the Minnesota employer — renewed every year by
          February 28, or within 30 days of starting work or changing
          residence — and Minnesota tax is not withheld. The arrangement
          runs both ways: a Moorhead resident working in Fargo avoids North
          Dakota withholding the same way, provided they return to their
          Minnesota home at least once a month. The exemption covers
          personal service income only — wages, salaries, tips, commissions,
          fees, and bonuses.
        </Para>
        <Para>
          Wisconsin and Iowa commuters get no such break. Minnesota–Wisconsin
          reciprocity ended on January 1, 2010 and has not returned, so a
          Wisconsin resident working in Minnesota has Minnesota tax withheld
          and claims a credit on the Wisconsin return, and vice versa. The
          same applies to Iowa commuters: Minnesota tax is withheld and the
          credit is claimed at home.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="What Minnesota does not tax"
        title="Social Security: taxed like the federal government, then subtracted back"
        summary="Minnesota is one of eight states that tax Social Security — but the subtraction wipes it out for most retirees. The thresholds and the two methods are inside."
      >
        <Para>
          Minnesota starts from federal adjusted gross income, so federally
          taxable Social Security benefits enter Minnesota income the same
          way they enter federal income. Then the Social Security subtraction
          takes them back out — under the simplified method, the full
          subtraction applies when adjusted gross income is below $86,410
          for single or head-of-household filers, $110,780 for joint
          filers, or $55,390 for married filing separately. Above those
          thresholds the subtraction shrinks by 10% for each $4,000 of
          income above the limit ($2,000 for married filing separately),
          disappearing entirely after ten steps — at $126,410 single or
          $150,780 joint.
        </Para>
        <Para>
          An alternative method caps the subtraction instead — at $5,840 for
          joint filers, $4,560 for single or head-of-household filers, and
          $2,920 for married filing separately — and you use whichever
          method gives the larger benefit. The subtraction is claimed on
          Schedule M1M, line 12, filed with Form M1. Minnesota also offers
          a public pension subtraction of up to $13,850 for single filers
          and $27,690 for joint filers, phasing out above the same
          $86,410 / $110,780 thresholds. None of this changes your paycheck
          withholding while you work — it settles on the return.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form M1, and quarterly estimates on Form M1-ES"
        summary="The April 15 deadline, the $500 estimated-tax threshold in the statute, and the safe harbor."
      >
        <Para>
          Full-year residents file Form M1, due April 15, 2027 for tax year
          2026. Minnesota law requires estimated tax payments when your
          estimated tax, less the credits allowed against it, is $500 or
          more — no payments are required below that line, and no addition
          to tax applies when the tax shown on the return, less credits, is
          under $500.
        </Para>
        <Para>
          Pay in four equal installments of 25% each, due April 15, June
          15, and September 15, 2026, and January 15, 2027. The usual safe
          harbor is paying at least 90% of the current year&apos;s tax or
          100% of last year&apos;s tax, and no addition to tax applies if
          you had no liability for the preceding tax year.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* IOWA                                                                */
/* ------------------------------------------------------------------ */

function IowaContent() {
  const slug = "iowa-paycheck-calculator";
  const st = getStateBySlug(slug);
  const sd = st?.standardDeductionSingle ?? 0;
  const rows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(slug, gross);
    return [
      formatUSD0(gross),
      formatUSD0(stateTaxableIncome(slug, gross)),
      formatAmountOrUnavailable(r.annualState),
    ];
  });
  const iaTaxable60 = stateTaxableIncome(slug, 60000);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          Iowa tax at real salaries — one flat rate on your federal
          taxable income
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the 2026 standard
          deduction of {formatUSD0(sd)}, applies the single flat rate
          of 3.8% to what is left, then subtracts the $40 personal
          exemption credit off the tax ($80 for a joint return). Iowa starts from your federal taxable
          income — the number on line 15 of your federal 1040 — so the
          federal standard deduction shelters your first dollars from
          state tax too. The table is the state tax only: a school district
          surtax can add to the bill on your return.
        </Para>
        <WorkedTable
          caption="Iowa income tax, single filer, 2026 — state tax only"
          headers={["Gross wages", "IA taxable income", "IA income tax"]}
          rows={rows}
          footnote={`At $60,000 the effective Iowa income-tax rate in the table is ${effectiveRatePct(EX_IA_60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(examplePaycheck(slug, 150000).annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, so the figures match the tool. School district surtax is additional.`}
        />
        <Para>
          The $60,000 row in detail: 3.8% × {formatUSD0(iaTaxable60)} ={" "}
          {formatUSD(0.038 * iaTaxable60)}, minus the $40 personal exemption
          credit = {formatAmountOrUnavailable(EX_IA_60.annualState)}. The same $60,000
          single filer owes {formatAmountOrUnavailable(EX_CA_60.annualState)}{" "}
          in California — Iowa costs only slightly more at this pay, and
          its return is far simpler.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department&apos;s own terms</Eyebrow>
        <SectionTitle>
          A flat 3.8% since 2025 — the end of a nine-bracket ladder
        </SectionTitle>
        <Para>
          Iowa taxes all individual income at a single flat rate of 3.8%
          for 2026, under Iowa Code section 422.5 and Senate File 2442,
          signed May 1, 2024. As recently as 2022 the state ran nine
          brackets topping out at 8.53%; a 2022 law collapsed them to four
          in 2023 and three in 2024, and the 2024 follow-up law jumped
          straight to the endpoint — a single 3.8% rate on all taxable
          income from tax year 2025. The rate carries into 2026 unchanged,
          confirmed by the Department of Revenue in October 2025.
        </Para>
        <Para>
          The base is what makes Iowa unusual. Since tax year 2023 the
          starting point is federal taxable income, so the federal standard
          deduction — {formatUSD0(sd)} for a single filer, $32,200 for a
          joint return in 2026 — flows straight through, and the old
          deduction for federal income taxes paid is gone. Iowa generally
          follows federal law changes automatically. There is no Iowa city
          or county income tax, and no employee-paid state payroll program
          on an Iowa pay stub.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form IA W-4"
        title="IA W-4: allowances are dollar amounts, and no form means zero"
        summary="Iowa's 2026 withholding form (44-019) still counts allowances — in dollars, not people. The lines, the deadlines, and the exempt box are inside."
      >
        <Para>
          Iowa&apos;s withholding certificate is Form IA W-4 (form 44-019),
          the Employee Withholding Allowance Certificate. You pick a filing
          status — Other (including Single), Head of Household, Married
          filing jointly, or Qualifying Surviving Spouse — then work
          through lines 1 to 6 to calculate your total allowance amount:
          a personal allowance of $40 on line 1 ($80 for head of
          household), plus allowances for dependents, itemized deductions,
          adjustments to income, and certain credits. Several lines ask you
          to multiply a dollar figure by 0.038 to convert it into an
          allowance amount. The withholding formula is the wages for the
          pay period, minus the filing-status deduction for that period,
          times 3.8%, minus your line 7 allowance amount divided by the
          number of pay periods, plus any line 8 amount.
        </Para>
        <Para>
          New hires and rehires must complete and sign the form within 15
          days of starting work. If you do not turn one in, your employer
          must withhold as though you claimed zero allowances — the
          maximum. If the allowances you are eligible to claim increase,
          you may file a new W-4 at any time; if they decrease, you must
          file a new one within 10 days. If you had no Iowa tax liability
          last year and expect none this year, write &ldquo;EXEMPT&rdquo;
          on the form — and file a new one by February 15 of each year to
          keep it in effect. Nonresidents may not claim the exemption.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Credits · return-only"
        title="The Iowa EITC and tuition credit"
        summary="A refundable EITC worth 15% of the federal credit and a K-12 tuition credit, both claimed on your IA 1040. The $40 personal credit is already modelled in the worked examples above."
      >
        <Para>
          <strong className="text-slate-900">Earned Income Tax Credit
          (refundable):</strong> Iowa matches 15% of your federal Earned
          Income Tax Credit. A filer may reduce annual Iowa income tax by
          up to 15% of their federal EITC amount, subject to eligibility —
          and because the credit is refundable, it can pay out even if you
          owe no Iowa tax. Part-year residents and nonresidents must
          prorate the credit by their Iowa income percentage.
        </Para>
        <Para>
          <strong className="text-slate-900">Tuition and textbook credit
          (nonrefundable):</strong> 25% of the first $2,000 of qualifying
          tuition and textbook expenses per K-12 student — up to $500 per
          student. Iowa also offers a child and dependent care credit and a
          deduction for College Savings Iowa 529 contributions.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Local taxes · school district surtax"
        title="No city or county tax — but your school district may add up to 20% of your state tax"
        summary="Many Iowa school districts levy an income surtax, figured on your return and never withheld. The cap, the line, and the workaround are inside."
      >
        <Para>
          No Iowa city or county levies an income tax — Des Moines, Cedar
          Rapids, and Davenport add nothing to a paycheck. What many school
          districts do levy is an income surtax to fund instructional
          support and other educational programs, plus a county emergency
          medical services surtax in some counties. The surtax is a
          percentage of your state income tax liability, not your gross
          income: if you owe $2,000 in state tax and your district charges
          a 10% surtax, you pay an extra $200. Iowa law caps the combined
          total of all school district surtaxes at 20% of your state tax.
        </Para>
        <Para>
          The surtax is figured on your return — IA 1040 line 54 — and is{" "}
          <strong>not</strong> withheld from your pay: Iowa&apos;s
          withholding formula has no step for it. The Department of Revenue
          publishes the surtax rate for every school district and county
          each year, and you identify your district on the return with a
          four-digit school district code. If your district charges one, a
          small amount on line 8 of your IA W-4 can cover it during the
          year instead of leaving a balance due in April.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Reciprocity · Form 44-016"
        title="Live in Illinois? File Form 44-016 — Iowa's only reciprocity agreement"
        summary="Iowa has exactly one reciprocal partner. Everyone else who works in Iowa pays Iowa tax on Iowa wages."
      >
        <Para>
          Iowa&apos;s only wage reciprocity agreement is with Illinois.
          Under it, an Illinois resident who earns wages in Iowa does not
          owe Iowa income tax or file an Iowa return on that compensation,
          and an Iowa resident working in Illinois does not owe Illinois tax
          on those wages. Instead of filing an IA W-4, an Illinois resident
          completes Form 44-016, the Employee&apos;s Statement of
          Nonresidence in Iowa, and gives it to the Iowa employer, so
          Illinois tax is withheld instead. An Iowa resident working in
          Illinois files the Illinois equivalent, Form IL-W-5-NR.
        </Para>
        <Para>
          The agreement covers compensation for personal services only.
          Commuters from Nebraska, Minnesota, Missouri, Wisconsin, and
          South Dakota have no agreement: they pay Iowa tax on Iowa wages
          and claim a credit on their home-state return.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="What Iowa does not tax"
        title="Social Security, and all retirement income at 55 and older"
        summary="Iowa exempts Social Security benefits entirely, and retirement income in full once you are 55. Federal tax still applies."
      >
        <Para>
          Iowa does not tax Social Security benefits: they are subtracted
          from Iowa taxable income in full. Retirement income goes further
          still — since tax year 2023, Iowa fully exempts pensions, IRA
          distributions, 401(k) withdrawals, and military retirement pay
          for filers age 55 or older or disabled. A retiree over 55 living
          on those sources owes no Iowa income tax on them at all, while
          still owing federal tax on the same money. Working Iowans under
          55 pay the flat 3.8% on wages.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form IA 1040, due April 30 — two weeks after the federal deadline"
        summary="Iowa's deadline is April 30, not April 15. The $1,000 estimated-tax threshold is new for 2026."
      >
        <Para>
          Iowa individual income tax returns are due April 30, 2027 for tax
          year 2026 — about two weeks after the federal deadline — on Form
          IA 1040, filed electronically through GovConnectIowa or by mail.
          All tax owed must be paid by that date whether or not you have
          filed yet, and interest runs from the day after at 10% a year for
          2026, with a 5% penalty on any tax not paid by the due date. If
          you pay at least 90% of the tax due by April 30, Iowa
          automatically extends your filing deadline to October 31.
        </Para>
        <Para>
          If you earn income that has no Iowa tax withheld — self-employment,
          rental, or investment income — you must make estimated payments
          on Form IA 1040ES when you expect to owe $1,000 or more in tax on
          that income. That threshold is new for 2026; in prior years it
          was $200, so some filers who previously had to pay quarterly no
          longer need to. Four installments are due April 30, June 30, and
          September 30, 2026, and January 31, 2027. Farmers and fishers who
          earn at least two-thirds of their income from those activities may
          pay the entire estimate by January 15 and file by April 30, or
          file and pay everything by March 1 without quarterly payments.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* KANSAS                                                              */
/* ------------------------------------------------------------------ */

function KansasContent() {
  const slug = "kansas-paycheck-calculator";
  const st = getStateBySlug(slug);
  const sd = st?.standardDeductionSingle ?? 0;
  const exemption = st?.exemptionSingle ?? 0;
  const brackets = st?.brackets ?? [];
  const rows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(slug, gross);
    return [
      formatUSD0(gross),
      formatUSD0(ksTaxable(gross)),
      formatAmountOrUnavailable(r.annualState),
    ];
  });
  const ksTaxable60 = ksTaxable(60000);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          Kansas tax at real salaries — two brackets, and an exemption the
          calculator misses
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the 2026 standard
          deduction of {formatUSD0(sd)} and the personal exemption of{" "}
          {formatUSD0(exemption)} ($18,320 joint, plus $2,320 per
          dependent), and applies the two graduated rates: 5.2% on the
          first $23,000 of taxable income, then 5.58% above. Only the
          dollars inside each bracket are taxed at that bracket&apos;s rate.
        </Para>
        <WorkedTable
          caption="Kansas income tax, single filer, 2026"
          headers={["Gross wages", "KS taxable income", "KS income tax"]}
          rows={rows}
          footnote={`At $60,000 the effective Kansas income-tax rate in the table is ${effectiveRatePct(EX_KS_60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(examplePaycheck(slug, 150000).annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          The $60,000 row in detail: {bracketDetailText(slug, ksTaxable(60000) + sd, brackets)}; total{" "}
          {formatAmountOrUnavailable(EX_KS_60.annualState)}. The same $60,000 single filer owes{" "}
          {formatAmountOrUnavailable(EX_CA_60.annualState)} in California
          — even the corrected Kansas bill is higher at this pay.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department&apos;s own terms</Eyebrow>
        <SectionTitle>
          Two brackets since 2024 — and no rate cut for 2026
        </SectionTitle>
        <Para>
          Kansas taxes income in two brackets: 5.2% on the first $23,000 of
          taxable income for a single filer ($46,000 joint), then 5.58% on
          everything above. The 2024 reform in Special Session Senate Bill
          1 collapsed the old three-bracket ladder — 3.1%, 5.25%, and 5.7%
          — into these two rates, and the 2026 schedule is unchanged. The
          law built in a contingent rate reduction, but the Department of
          Revenue confirmed in Notice 25-06 that revenue did not clear the
          threshold, so no further cut applies for 2026.
        </Para>
        <Para>
          Kansas taxable income starts from federal adjusted gross income,
          minus the state standard deduction — {formatUSD0(sd)} for a
          single filer, $8,240 joint, $6,180 head of household — minus the
          personal exemption of $9,160 single ($18,320 joint) and $2,320
          per dependent. Kansas lets you itemize on the state return even
          if you took the federal standard deduction. There is no Kansas
          city, county, or school district income tax, and no employee-paid
          state payroll program — no state disability, paid-leave, or
          unemployment deduction comes out of a Kansas paycheck. Kansas
          also has no reciprocal tax agreement with any other state: a
          Missouri resident working in Kansas has Kansas tax withheld and
          claims a credit on the home-state return instead.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form K-4"
        title="K-4: your allowances do not have to match your federal W-4"
        summary="Kansas's withholding certificate uses its own exemption amounts. File it when you start, and use the K-4C if you split time between states."
      >
        <Para>
          Kansas&apos;s withholding certificate is Form K-4, the Kansas
          Employee&apos;s Withholding Allowance Certificate. Every employee
          earning wages from Kansas sources must submit one when starting a
          job. The number of allowances you claim on the K-4 does not need
          to match what you claim federally, and in many cases it
          shouldn&apos;t: Kansas uses its own personal exemption amounts,
          its own standard deduction, and its own tax brackets, so a carbon
          copy of your federal elections could easily over- or
          under-withhold at the state level. Your employer uses the
          Department&apos;s KW-100 withholding guide to turn the form into
          a per-paycheck amount.
        </Para>
        <Para>
          If you live outside Kansas but perform work physically within the
          state, you still need to complete a K-4 — only income earned from
          Kansas sources is subject to Kansas tax. Employees who split time
          between Kansas and another state use Form K-4C to allocate
          withholding based on the percentage of work performed in Kansas.
          If you do not file a K-4, your employer withholds as if you
          claimed no allowances — the maximum.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Credits · return-only"
        title="The Kansas EITC and the dependent care credit"
        summary="A refundable EITC worth 17% of the federal credit, plus a child and dependent care credit. Both claimed on your K-40, not on your paycheck."
      >
        <Para>
          <strong className="text-slate-900">Earned Income Tax Credit
          (refundable):</strong> Kansas matches 17% of your federal Earned
          Income Tax Credit. A filer may reduce annual Kansas income tax by
          up to 17% of their federal EITC amount, subject to eligibility —
          and because the credit is refundable, it can pay out even if you
          owe no Kansas tax.
        </Para>
        <Para>
          <strong className="text-slate-900">Child and Dependent Care
          Credit (nonrefundable):</strong> Kansas offers a credit based on
          your federal child and dependent care credit. Published sources
          disagree about the current percentage, so no figure is given
          here — check the current K-40 instructions before claiming it.
          Neither credit is modelled in the calculator&apos;s withholding
          estimate; they settle on the return.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="What Kansas does not tax"
        title="Social Security is fully exempt — since 2024"
        summary="All Social Security benefits included in federal adjusted gross income are exempt from Kansas income tax. The exemption is not age-restricted."
      >
        <Para>
          Starting with tax year 2024, all Social Security benefits
          included in your federal adjusted gross income are fully exempt
          from Kansas income tax — at any age, with no income limit. The
          exemption is a subtraction on the Kansas return, so it does not
          change what your employer withholds from a working paycheck, but
          it is the single largest break in the Kansas code for retirees.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form K-40, and quarterly estimates on Form K-40ES"
        summary="The April 15 deadline, the $500 estimated-tax threshold with a 90% / 100% test, and the January 31 filing option."
      >
        <Para>
          Full-year residents file Form K-40, due April 15, 2027 for tax
          year 2026. You must make estimated tax payments on Form K-40ES
          if your estimated Kansas income tax after withholding and credits
          is $500 or more <strong>and</strong> your withholding and credits
          may be less than the smaller of 90% of the tax on your 2026
          return or 100% of the tax shown on your 2025 return. Four
          installments are due April 15, June 15, and September 15, 2026,
          and January 15, 2027.
        </Para>
        <Para>
          Filing your return and paying in full by January 31, 2027
          replaces the January 15 payment. Farmers and fishers pay at
          two-thirds of the normal safe harbor instead of 90%, and may pay
          in full by January 15, 2027 or file and pay everything by March 1,
          2027. Use Schedule K-210 to figure any underpayment and whether
          an exception to the penalty applies. Pay electronically through
          the Kansas payment portal at kansas.gov/payment-portal, or mail
          the voucher with a check to Estimated Tax, Kansas Department of
          Revenue, PO Box 3506, Topeka, KS 66625-3506.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* FAQS                                                                */
/* ------------------------------------------------------------------ */

export const BATCH_FAQS: Record<string, FaqItem[]> = {
  "ohio-paycheck-calculator": [
    {
      q: "How much Ohio income tax will I pay on a $60,000 salary?",
      a: `The calculator's table shows ${formatAmountOrUnavailable(EX_OH_60.annualState)} a year for a single filer earning $60,000. Ohio law charges $332 plus 2.75% of the amount over $26,050, and the calculator models the $332 step. The effective rate is ${(((EX_OH_60.annualState ?? 0) / 60000) * 100).toFixed(1)}% of gross pay.`,
    },
    {
      q: "What is Ohio's income tax rate in 2026?",
      a: "Ohio charges $332 plus 2.75% of taxable income over $26,050, and no tax at all on a balance of $26,050 or less. The structure took effect January 1, 2026 under House Bill 96, replacing the old graduated ladder.",
    },
    {
      q: "Why is the $150,000 Ohio row flagged as a partial calculation?",
      a: `Because the personal exemption steps down to $1,900 at that income instead of the $2,400 the calculator subtracts, so the $150,000 row understates the real liability by about ${formatUSD(500 * 0.0275)}. The $332 step in Ohio Revised Code 5747.02 is modelled — the $30,000 and $60,000 rows match the statute exactly.`,
    },
    {
      q: "How do I fill out the Ohio IT-4?",
      a: "Complete the combined Form IT-4: Section I is your personal information plus your school district of residence (name and four-digit code, found with the Department's \"The Finder\" lookup); Section II counts your exemptions — yourself, your spouse if filing jointly, and each dependent; Section III is the complete exemption from withholding, including reciprocity; Section IV is the signature. Each exemption cuts $25.00 of taxable wages per biweekly paycheck — a reduction in the wage base, not $650 of tax. The real saving is $0.40 per paycheck ($10.40 a year) at the 1.60% band, $0.75 ($19.44 a year) at 2.99%, and $0.85 ($22.10 a year) at 3.40%. If you never file an IT-4, your employer withholds as if you claimed zero exemptions and withholds nothing for school district tax.",
    },
    {
      q: "What is the Ohio school district income tax?",
      a: "214 school districts levied one as of January 2026, at rates from 0.25% to 2.00% — most commonly 1% to 1.5%. It is residence-based, filed on Form SD 100, and uses either a traditional base (Ohio AGI less exemptions) or an earned-income base (wages and self-employment income only). If you owe $500 or more, make estimated payments on Form SD 100ES. The Columbus, Cleveland, and Cincinnati school districts levy none.",
    },
    {
      q: "Do I pay city income tax in Ohio?",
      a: `Probably. More than 600 Ohio municipalities levy a local income tax, typically 1% to 3%: Columbus and Cleveland charge 2.5%, Cincinnati 1.8%, and Akron, Toledo, and Dayton 2.5%. A Columbus resident earning $60,000 pays ${formatUSD(0.025 * 60000)} a year in city tax alone. The tax is charged on Medicare wages, so 401(k) deferrals do not reduce it, and it is collected by RITA, the Central Collection Agency, or the city itself.`,
    },
    {
      q: "I live in Kentucky but work in Ohio. Do I pay Ohio tax?",
      a: "No, on your wages — Ohio has reciprocity with Kentucky, Indiana, Michigan, Pennsylvania, and West Virginia. Claim the exemption in Section III of the combined IT-4 given to your Ohio employer, and only your home state taxes those wages. But reciprocity does not cover local taxes: Ohio municipal tax is still withheld regardless of where you live.",
    },
    {
      q: "Is there an Ohio Earned Income Tax Credit?",
      a: "Yes. Ohio matches 30% of your federal Earned Income Tax Credit. A filer may reduce annual Ohio income tax by up to 30% of their federal EITC amount, subject to eligibility and available tax liability. The credit is nonrefundable, so it can reduce your Ohio tax to $0 but never pays out as a refund.",
    },
    {
      q: "Does Ohio tax Social Security benefits?",
      a: "No. Ohio fully exempts Social Security benefits — the entire amount is subtracted from Ohio adjusted gross income, whatever your income level. Military retirement pay and certain railroad retirement benefits are likewise exempt.",
    },
    {
      q: "What is Ohio's personal exemption for 2026?",
      a: `The personal exemption is ${formatUSD0(OH_SD_SINGLE)} for a single filer at lower incomes, stepping down to $2,150 and then $1,900 as modified adjusted gross income rises, and reaching $0 once it hits $500,000.`,
    },
    {
      q: "When is my Ohio return due, and do I need to make estimated payments?",
      a: "Ohio returns are due April 15, 2027, on Form IT 1040, filed free through OH|TAX eServices. If your expected Ohio tax after withholding and credits exceeds $500, make estimated payments on Form IT 1040ES, due April 15, June 15, and September 15, 2026, and January 15, 2027. The safe harbor is 90% of the current year's tax or 100% of last year's tax, and underpayment interest for 2026 is 7%.",
    },
    {
      q: "How does Ohio compare with California at the same salary?",
      a: `A single filer earning $60,000 owes ${formatAmountOrUnavailable(EX_OH_60.annualState)} a year in Ohio income tax, versus ${formatAmountOrUnavailable(EX_CA_60.annualState)} in California — Ohio's state tax is lower. But local taxes can erase the gap: a Columbus resident adds ${formatUSD(0.025 * 60000)} a year in city tax, and a school district tax can add more.`,
    },
  ],
  "indiana-paycheck-calculator": [
    {
      q: "How much Indiana income tax will I pay on a $60,000 salary?",
      a: `A single filer earning $60,000 owes ${formatAmountOrUnavailable(EX_IN_60.annualState)} a year in Indiana state income tax after the ${formatUSD0(IN_SD_SINGLE)} personal exemption. The effective rate is ${effectiveRatePct(EX_IN_60.annualState, 60000)}% of gross pay. County tax is additional: a Marion County resident pays another ${formatUSD(0.0202 * 59000)} a year.`,
    },
    {
      q: "What is Indiana's income tax rate in 2026?",
      a: "Indiana has a single flat rate of 2.95% on all taxable income, cut from 3.00% on January 1, 2026, and scheduled to fall to 2.90% on January 1, 2027. Every county adds its own county tax on top of that rate.",
    },
    {
      q: "How do I fill out the Indiana WH-4?",
      a: "Complete Form WH-4: the top block records your county of residence and your county of principal employment as of January 1; lines 1–4 claim personal exemptions at $1,000 a year each; lines 6–7 claim dependents at $1,500 a year each; line 8 claims an adopted child at $3,000 a year; lines 9–10 add extra state or county withholding per pay period. The form stays with your employer, and you must update it within 10 days of a change.",
    },
    {
      q: "What is the Indiana county tax?",
      a: "Every Indiana county levies a local income tax on the same exemption-reduced base as the state tax. Rates effective October 1, 2026 run from 0.5% in Porter County to 3.00% in Randolph County. Marion County (Indianapolis) is 2.02%, Hamilton County 1.10%, Allen County 1.59%, Cass County 2.95%, and Boone County 1.71%. County tax is not covered by Indiana's reciprocity agreements.",
    },
    {
      q: "I live in Ohio but work in Indiana. Do I pay Indiana tax?",
      a: "No, on your wages — Indiana has reciprocity with Ohio, Kentucky, Michigan, Pennsylvania, and Wisconsin. File Form WH-47, the Certificate of Residence, with your Indiana employer, and only Ohio taxes those wages. County tax is not covered by reciprocity, so it may still apply. Full-year residents of those states whose only Indiana income was wages file Form IT-40RNR.",
    },
    {
      q: "Is there an Indiana Earned Income Tax Credit?",
      a: "Yes. Indiana matches 10% of your federal Earned Income Tax Credit, claimed on Schedule IN-EIC. A filer may reduce annual Indiana income tax by up to 10% of their federal EITC amount, subject to eligibility — and because the credit is refundable, it can pay out even if you owe no Indiana tax.",
    },
    {
      q: "Does Indiana tax Social Security benefits?",
      a: "No. Indiana subtracts Social Security benefits in full from Indiana adjusted gross income, and Railroad Retirement Tier 1 benefits get the same treatment. Military retirement pay and military survivor's benefits are fully exempt, and federal civil service annuities get a deduction of up to $16,000 for filers age 62 or older.",
    },
    {
      q: "What deductions can I claim as an Indiana renter or homeowner?",
      a: "Renters can deduct up to $3,000 a year ($1,500 if married filing separately) for rent paid on a main home subject to Indiana property tax. Homeowners can deduct up to $2,500 a year ($1,250 if married filing separately) for property tax paid on a principal residence.",
    },
    {
      q: "What is Indiana's personal exemption for 2026?",
      a: `The personal exemption is ${formatUSD0(IN_SD_SINGLE)} a year per exemption for a single filer ($2,000 for a joint return), plus $1,500 a year per dependent and $3,000 a year for an adopted child.`,
    },
    {
      q: "Do I need to make estimated payments in Indiana?",
      a: "If you expect to owe $1,000 or more in state plus county tax after withholding and credits, make estimated payments on Form ES-40, due April 15, June 15, and September 15, 2026, and January 15, 2027. The safe harbor is 90% of the current year's tax or 100% of last year's tax (110% if last year's federal AGI exceeded $150,000 single or joint, or $75,000 married filing separately), and the underpayment penalty is 10% per installment period.",
    },
    {
      q: "When is my Indiana return due, and which form do I file?",
      a: "Indiana returns are due April 15, 2027. Full-year residents file Form IT-40 with Schedule CT-40 for the county tax; part-year residents and nonresidents file Form IT-40PNR. A federal extension extends the Indiana filing deadline too, but you must still pay at least 90% of the tax by April 15.",
    },
    {
      q: "How does Indiana compare with California at the same salary?",
      a: `A single filer earning $60,000 owes ${formatAmountOrUnavailable(EX_IN_60.annualState)} a year in Indiana state income tax, versus ${formatAmountOrUnavailable(EX_CA_60.annualState)} in California — Indiana's state tax is already higher at this pay, and a Marion County resident adds another ${formatUSD(0.0202 * 59000)} in county tax on top.`,
    },
  ],
  "michigan-paycheck-calculator": [
    {
      q: "How much Michigan income tax will I pay on a $60,000 salary?",
      a: `A single filer earning $60,000 owes ${formatAmountOrUnavailable(EX_MI_60.annualState)} a year in Michigan income tax after the ${formatUSD0(MI_SD_SINGLE)} personal exemption. The effective rate is ${effectiveRatePct(EX_MI_60.annualState, 60000)}% of gross pay. City income tax is additional where it applies.`,
    },
    {
      q: "What is Michigan's income tax rate in 2026?",
      a: "Michigan has a single flat rate of 4.25% on all taxable income. The rate dipped to 4.05% for tax year 2023 only, under a revenue trigger, then returned to 4.25% for 2024. The Department of Treasury confirmed in April 2026 that no further cut was triggered for 2026.",
    },
    {
      q: "How do I fill out the Michigan MI-W4?",
      a: "Count your exemptions on line 6 of Form MI-W4 — yourself, a spouse with no income, and each dependent — and each exemption is worth $5,900 a year of income shielded from withholding. Line 8b is the reciprocity claim for residents of Illinois, Indiana, Kentucky, Minnesota, Ohio, and Wisconsin. If you never file an MI-W4, your employer withholds as if you claimed zero exemptions.",
    },
    {
      q: "What is Detroit's city income tax?",
      a: "Detroit charges 2.4% to residents and 1.2% to nonresidents, with a $600 city exemption claimed on Form 5123. Grand Rapids and Saginaw charge 1.5% to residents and 0.75% to nonresidents, and most other cities — including Flint, Pontiac, Jackson, Battle Creek, and East Lansing — charge 1% to residents and 0.5% to nonresidents. City tax is not covered by Michigan's reciprocity agreements.",
    },
    {
      q: "I live in Ohio but work in Michigan. Do I pay Michigan tax?",
      a: "No, on your wages — Michigan has reciprocity with Ohio, Illinois, Indiana, Kentucky, Minnesota, and Wisconsin. Claim the exemption on line 8b of Form MI-W4 given to your Michigan employer, and only Ohio taxes those wages. Reciprocity covers the state income tax only, not city income tax.",
    },
    {
      q: "Is there a Michigan Earned Income Tax Credit?",
      a: "Yes. Michigan matches 30% of your federal Earned Income Tax Credit, raised from 6% to 30% retroactive to tax year 2022. A filer may reduce annual Michigan income tax by up to 30% of their federal EITC amount, subject to eligibility — and because the credit is refundable, it can pay out even if you owe no Michigan tax. The maximum Michigan EITC was $2,414 for tax year 2025.",
    },
    {
      q: "Does Michigan tax Social Security or pension income?",
      a: "No, on Social Security: Michigan subtracts Social Security benefits in full, and military retirement pay is fully exempt. For other retirement income, the four-year phase-in under Public Act 4 of 2023 reaches 100% in 2026, so every retiree may subtract combined public and private retirement income up to $67,610 on a single return or $135,220 on a joint return. Retirees born before 1946 keep the older rule: their public pension is fully deductible with no cap.",
    },
    {
      q: "What is the Michigan Homestead Property Tax Credit?",
      a: "It is a refundable credit for homeowners and renters, claimed on Form MI-1040CR. Renters qualify using 20% of annual rent as the property-tax equivalent, and the credit is limited by household resources. The 2026 maximum had not been published when this page was researched.",
    },
    {
      q: "Does Michigan have a standard deduction?",
      a: `No. Michigan has no standard deduction. Instead, each personal and dependency exemption is worth ${formatUSD0(MI_SD_SINGLE)} for 2026, up from $5,800 in 2025. The worked examples above are a single filer with one exemption.`,
    },
    {
      q: "Do I need to make estimated payments in Michigan?",
      a: "If you expect to owe more than $500 in Michigan tax after withholding and credits, make estimated payments on Form MI-1040ES, due April 15, June 15, and September 15, 2026, and January 15, 2027. The safe harbor is the lesser of 90% of your 2026 tax or 100% of your 2025 tax (110% if your 2025 AGI exceeded $150,000). The penalty is 25% of an unpaid installment or 10% if paid short or late, plus interest.",
    },
    {
      q: "When is my Michigan return due, and which form do I file?",
      a: "Michigan returns are due April 15, 2027, on Form MI-1040. A federal extension extends the Michigan filing deadline, but not the payment deadline — interest still runs from April 15.",
    },
    {
      q: "How does Michigan compare with California at the same salary?",
      a: `A single filer earning $60,000 owes ${formatAmountOrUnavailable(EX_MI_60.annualState)} a year in Michigan income tax, versus ${formatAmountOrUnavailable(EX_CA_60.annualState)} in California — Michigan costs more at this pay, before any city tax.`,
    },
  ],
  "illinois-paycheck-calculator": [
    {
      q: "How much Illinois income tax will I pay on a $60,000 salary?",
      a: `A single filer earning $60,000 owes ${formatAmountOrUnavailable(EX_IL_60.annualState)} a year in Illinois income tax after the ${formatUSD0(IL_SD_SINGLE)} personal exemption allowance. The effective rate is ${effectiveRatePct(EX_IL_60.annualState, 60000)}% of gross pay.`,
    },
    {
      q: "What is Illinois' income tax rate in 2026?",
      a: "Illinois has a single flat rate of 4.95% on all taxable income, in effect since July 1, 2017. The Illinois constitution requires a flat rate, so there are no brackets: every dollar of taxable income above the exemption allowance is taxed at 4.95%.",
    },
    {
      q: "How do I fill out the Illinois IL-W-4?",
      a: "Count your allowances on Form IL-W-4: line 1 allowances are worth $2,925 a year each, line 2 allowances are worth $1,000 each, and line 3 is any extra flat amount you want withheld each pay period. Complete the form on or before the day you start work. If you do not file a completed and signed IL-W-4, your employer withholds 4.95% on your entire pay, with no allowances at all.",
    },
    {
      q: "Does Illinois have a local income tax?",
      a: "No. No Illinois city or county levies an income tax on wages, so the 4.95% state rate is the only income tax on an Illinois pay stub.",
    },
    {
      q: "I live in Iowa but work in Illinois. Do I pay Illinois tax?",
      a: "No, on your wages — Illinois has reciprocity with Iowa, Kentucky, Michigan, and Wisconsin. File Form IL-W-5-NR, the Employee's Statement of Nonresidence in Illinois, with your Illinois employer — not the IL-W-4 — so Illinois tax is not withheld and Iowa tax is withheld instead. The Illinois–Iowa agreement was confirmed in force for 2026.",
    },
    {
      q: "Is there an Illinois Earned Income Tax Credit?",
      a: "Yes. Illinois matches 20% of your federal Earned Income Tax Credit. A filer may reduce annual Illinois income tax by up to 20% of their federal EITC amount, subject to eligibility — you must be 18 or older by year-end, with earned income below $68,675 and investment income under $11,950. Because the credit is refundable, it can pay out even if you owe no Illinois tax.",
    },
    {
      q: "Does Illinois tax retirement income?",
      a: "No — none of it, at any age. Social Security benefits, private and public pensions, 401(k), 403(b), and 457 plan distributions, traditional IRA withdrawals, Roth conversions, military retirement pay, railroad retirement benefits, and most annuity income are all subtracted in full on IL-1040 line 5. No withholding is required on retirement income, even if federal income tax is withheld.",
    },
    {
      q: "What is the Illinois property tax credit?",
      a: "Illinois gives a credit of 5% of the Illinois property tax you paid on your principal residence, claimed on your IL-1040. The credit is capped by income — federal AGI of $250,000 for single filers and $500,000 for joint filers — and nonresidents are not eligible.",
    },
    {
      q: "Is there a K-12 education expense credit in Illinois?",
      a: "Yes. Illinois offers a credit of up to $750 for qualifying K-12 education expenses, claimed on your IL-1040. Illinois also offered a Child Tax Credit worth 40% of the Illinois EITC for recipients with a qualifying child under 12, but it was enacted for tax years 2024 and 2025 only, and its continuation for 2026 could not be verified.",
    },
    {
      q: "What is Illinois' personal exemption allowance for 2026?",
      a: `The personal exemption allowance is ${formatUSD0(IL_SD_SINGLE)} per person for 2026 ($5,850 for a joint return with two exemptions). Filers age 65 or older, or who are legally blind, get an additional $1,000. The allowance is disallowed entirely once federal AGI passes $250,000 for single filers or $500,000 for joint filers.`,
    },
    {
      q: "Do I need to make estimated payments in Illinois?",
      a: "If you reasonably expect your 2026 liability to exceed $1,000 after subtracting Illinois withholding, pass-through withholding, and credits, make estimated payments on Form IL-1040-ES, due April 15, June 15, and September 15, 2026, and January 15, 2027. The safe harbor is 90% of the current year's tax or 100% of last year's tax in four equal, timely installments.",
    },
    {
      q: "How does Illinois compare with California at the same salary?",
      a: `A single filer earning $60,000 owes ${formatAmountOrUnavailable(EX_IL_60.annualState)} a year in Illinois income tax, versus ${formatAmountOrUnavailable(EX_CA_60.annualState)} in California — Illinois costs substantially more at this pay, because its flat rate applies from the first taxable dollar.`,
    },
  ],
  "wisconsin-paycheck-calculator": [
    {
      q: "How much Wisconsin income tax will I pay on a $60,000 salary?",
      a: `The calculator shows ${formatAmountOrUnavailable(EX_WI_60.annualState)} a year for a single filer earning $60,000 — and that figure already includes the standard-deduction phaseout: at $60,000 the deduction is ${formatUSD(60000 - engineTaxableIncome("wisconsin-paycheck-calculator", 60000) - WI_EXEMPTION_SINGLE)}, not the full $13,960. The effective rate is ${((EX_WI_60.annualState ?? 0) / 60000 * 100).toFixed(1)}% of gross pay.`,
    },
    {
      q: "What are Wisconsin's income tax rates in 2026?",
      a: "Wisconsin has four graduated rates for single filers: 3.5% to $15,110 of taxable income, 4.4% to $51,950, 5.3% to $332,720, and 7.65% above. Only the dollars inside each bracket are taxed at that bracket's rate.",
    },
    {
      q: "Does the calculator model Wisconsin's standard-deduction phaseout?",
      a: `Yes. The deduction phases down once income passes $20,119 for a single filer, losing 12% of every dollar above that line until it reaches $0 at $136,453 — and the calculator subtracts the phased amount, not the full $13,960. The deduction actually subtracted is ${formatUSD(30000 - engineTaxableIncome("wisconsin-paycheck-calculator", 30000) - WI_EXEMPTION_SINGLE)} at $30,000, ${formatUSD(60000 - engineTaxableIncome("wisconsin-paycheck-calculator", 60000) - WI_EXEMPTION_SINGLE)} at $60,000, and ${formatUSD(150000 - engineTaxableIncome("wisconsin-paycheck-calculator", 150000) - WI_EXEMPTION_SINGLE)} at $150,000, so the liabilities are ${formatAmountOrUnavailable(EX_WI_30.annualState)}, ${formatAmountOrUnavailable(EX_WI_60.annualState)}, and ${formatAmountOrUnavailable(EX_WI_150.annualState)}.`,
    },
    {
      q: "How do I fill out the Wisconsin WT-4?",
      a: "File Form WT-4 with each employer unless you claim the same number of exemptions as for federal W-4 purposes. Complete lines 1–3 only if your Wisconsin exemptions differ from your federal ones: line 1(a) yourself, 1(b) your spouse, 1(c) your dependents, 1(d) the total. Line 2 adds extra withholding per pay period, and line 3 is the \"Exempt\" claim, which expires April 30 of the following year. Update the form within 10 days if your exemptions decrease.",
    },
    {
      q: "Why is my Wisconsin withholding different from the tax in the table?",
      a: "Because withholding uses its own formula. Publication W-166 uses a $6,702 deduction for a single filer ($9,461 married), a $400 allowance per exemption, and a withholding rate schedule of 3.54%, 4.65%, 5.30%, and 7.65%. Supplemental wages are withheld at flat percentages by annual gross. Withholding is an instalment plan; the return settles the difference.",
    },
    {
      q: "Is there a Wisconsin Earned Income Credit?",
      a: "Yes. Wisconsin matches a percentage of your federal Earned Income Credit — 4% with one qualifying child, 11% with two, and 34% with three or more. A filer may reduce annual Wisconsin income tax by up to those percentages of their federal EIC amount, subject to eligibility. Only full-year residents qualify, and filers with no qualifying child receive no state credit at all.",
    },
    {
      q: "Does Wisconsin tax Social Security benefits?",
      a: "No. Wisconsin does not tax Social Security benefits at all — you report the federally taxable amount, then subtract it entirely on Schedule SB. Military retirement pay is likewise fully exempt. Retirees 65 or older may also subtract up to $5,000 of other retirement income if federal AGI is under $15,000 single or $30,000 joint, and those 67 or older may subtract up to $24,000 ($48,000 joint) — but claiming the $24,000 subtraction bars all Wisconsin credits on that return.",
    },
    {
      q: "What is the Wisconsin Homestead Credit?",
      a: "It is a refundable credit for low-income homeowners and renters, claimed on Schedule H or H-EZ. You must be a full-year resident and 18 or older by year-end, and the credit shrinks as household income rises, reaching $0 once household income passes $24,680, the threshold for the most recently published claim year.",
    },
    {
      q: "What is the Wisconsin married couple credit?",
      a: "It is 3% of the lower-earning spouse's income, up to $480, for joint filers where both spouses have earned income. Wisconsin also offers an itemized deduction credit worth 5% of certain federal itemized deductions above the standard deduction.",
    },
    {
      q: "I live in Minnesota but work in Wisconsin. Do I pay Wisconsin tax?",
      a: "Yes. Wisconsin–Minnesota reciprocity ended on January 1, 2010 and has not returned, even though the Department of Revenue studied reinstating it in 2024. You file in both states and claim a credit for the tax paid to the other state. Wisconsin does have reciprocity with Illinois, Indiana, Kentucky, and Michigan — residents of those states file Form W-220 with the Wisconsin employer.",
    },
    {
      q: "Do I need to make estimated payments in Wisconsin?",
      a: "You must make estimated payments on Form 1-ES if you expect to owe $500 or more after withholding and credits and your withholding is less than the smallest of 90% of your 2026 tax, 100% of your 2025 tax, or 90% of your 2026 tax computed by annualizing your income. Four installments are due April 15, June 15, and September 15, 2026, and January 15, 2027 — or file by January 31, 2027 and pay in full instead.",
    },
    {
      q: "How does Wisconsin compare with California at the same salary?",
      a: `A single filer earning $60,000 owes ${formatAmountOrUnavailable(EX_WI_60.annualState)} a year in Wisconsin income tax, versus ${formatAmountOrUnavailable(EX_CA_60.annualState)} in California — Wisconsin's bill is higher at this pay.`,
    },
  ],
  "minnesota-paycheck-calculator": [
    {
      q: "How much Minnesota income tax will I pay on a $60,000 salary?",
      a: `A single filer earning $60,000 owes ${formatAmountOrUnavailable(EX_MN_60.annualState)} a year in Minnesota income tax after the ${formatUSD0(MN_SD_SINGLE)} standard deduction, plus ${formatUSD(EX_MN_60.annualStateInsurance)} of MN Paid Leave at the maximum employee share. The effective income-tax rate is ${effectiveRatePct(EX_MN_60.annualState, 60000)}% of gross pay.`,
    },
    {
      q: "What are Minnesota's income tax rates in 2026?",
      a: "Minnesota has four graduated rates for single filers: 5.35% to $33,310 of taxable income, 6.80% to $109,430, 7.85% to $203,150, and 9.85% above. The top rate of 9.85% is the highest in this batch and the 7th-highest in the country. Brackets are recalculated every year for inflation.",
    },
    {
      q: "What is MN Paid Leave, and how much does it cost me?",
      a: `MN Paid Leave started January 1, 2026 and pays for family and medical leave — 12 to 20 weeks of benefits in a 52-week period. The total premium is 0.88% of wages, and your employer may deduct up to half — 0.44% — from your pay. At $60,000 that is ${formatUSD(EX_MN_60.annualStateInsurance)} a year at most, and the line stops growing once wages pass the Social Security wage base.`,
    },
    {
      q: "How do I fill out the Minnesota W-4MN?",
      a: "Complete either Section 1 (allowances) or Section 2 (an exemption from withholding), never both. Each allowance is worth $5,300 of annual income shielded from withholding. Line 1 is your total allowances and line 2 is any additional tax per pay period as a flat dollar amount. If no W-4MN is in effect, your employer withholds as if you were single with zero allowances — the maximum — whatever your federal form says. Exemption claims must be renewed by February 15 each year.",
    },
    {
      q: "What is the Minnesota Child Tax Credit?",
      a: "It is a refundable credit of $1,800 per qualifying child under 18, with no limit on the number of children. A filer may reduce annual Minnesota income tax by up to $1,800 per qualifying child, subject to eligibility. The credit phases out once adjusted gross income passes $32,680 for single filers or $38,770 for joint filers, and you can choose to receive part of next year's credit early in three advance payments.",
    },
    {
      q: "What is the Minnesota Working Family Credit?",
      a: "It is Minnesota's version of the EITC, worth 4% of the first $9,690 of earned income — a maximum of $388 with no qualifying children, and higher with children. A filer may reduce annual Minnesota income tax by up to that amount, subject to eligibility. The credit phases out once income passes $31,950 for single filers or $37,910 for joint filers, and full-year nonresidents do not qualify.",
    },
    {
      q: "What is the Minnesota Renter's Credit?",
      a: "It is a refundable credit on the income tax return itself, claimed on Form M1 — the old separate summer refund no longer exists. A filer may reduce annual Minnesota income tax by up to $2,780, subject to eligibility, where household income is below $79,330. You need a Certificate of Rent Paid from your landlord, due to you by January 31.",
    },
    {
      q: "Does Minnesota tax Social Security benefits?",
      a: "Yes, like the federal government — but the subtraction wipes it out for most retirees. Under the simplified method, the full subtraction applies when adjusted gross income is below $86,410 for single or head-of-household filers, $110,780 for joint filers, or $55,390 for married filing separately, shrinking by 10% for each $4,000 above the limit. An alternative method caps the subtraction at $5,840 joint or $4,560 single, and you use whichever gives the larger benefit. Claim it on Schedule M1M, line 12.",
    },
    {
      q: "I live in Wisconsin but work in Minnesota. Do I pay Minnesota tax?",
      a: "Yes. Minnesota–Wisconsin reciprocity ended on January 1, 2010 and has not returned, so Minnesota tax is withheld and you claim a credit on your Wisconsin return. Minnesota has reciprocity only with Michigan and North Dakota: residents of those states file Form MWR with the Minnesota employer, renewed every year, and Minnesota tax is not withheld.",
    },
    {
      q: "What is Minnesota's dependent exemption?",
      a: `Minnesota gives a dependent exemption of $5,300 per qualifying dependent for 2026, on top of the ${formatUSD0(MN_SD_SINGLE)} standard deduction. The calculator does not model it, so the worked examples — which assume no dependents — overstate the bill for a parent. A filer with dependents may reduce taxable income by up to $5,300 per qualifying dependent, subject to eligibility.`,
    },
    {
      q: "Do I need to make estimated payments in Minnesota?",
      a: "Minnesota law requires estimated payments when your estimated tax, less the credits allowed against it, is $500 or more. Pay in four equal installments of 25% each, due April 15, June 15, and September 15, 2026, and January 15, 2027. The safe harbor is 90% of the current year's tax or 100% of last year's tax, and no addition to tax applies if you had no liability for the preceding tax year.",
    },
    {
      q: "How does Minnesota compare with California at the same salary?",
      a: `A single filer earning $60,000 owes ${formatAmountOrUnavailable(EX_MN_60.annualState)} a year in Minnesota income tax, versus ${formatAmountOrUnavailable(EX_CA_60.annualState)} in California — Minnesota is well above California at this pay, before the ${formatUSD(EX_MN_60.annualStateInsurance)} of MN Paid Leave.`,
    },
  ],
  "iowa-paycheck-calculator": [
    {
      q: "How much Iowa income tax will I pay on a $60,000 salary?",
      a: `The calculator's table shows ${formatAmountOrUnavailable(EX_IA_60.annualState)} a year for a single filer earning $60,000. Iowa gives every filer a $40 personal exemption credit off the tax itself ($80 for a joint return, $40 more per dependent), and the calculator models it. The effective rate is ${(((EX_IA_60.annualState ?? 0) / 60000) * 100).toFixed(1)}% of gross pay.`,
    },
    {
      q: "What is Iowa's income tax rate in 2026?",
      a: "Iowa has a single flat rate of 3.8% on all taxable income, in effect since tax year 2025 under Senate File 2442 and unchanged for 2026. As recently as 2022 the state ran nine brackets topping out at 8.53%. Iowa starts from your federal taxable income, so the federal standard deduction shelters your first dollars from state tax too.",
    },
    {
      q: "How do I fill out the Iowa IA W-4?",
      a: "Complete Form IA W-4 (form 44-019) within 15 days of starting work. Pick a filing status — Other (including Single), Head of Household, Married filing jointly, or Qualifying Surviving Spouse — then work through lines 1 to 6: a personal allowance of $40 ($80 for head of household), plus allowances for dependents, itemized deductions, adjustments to income, and certain credits. If you do not turn one in, your employer withholds as though you claimed zero allowances. If your allowances decrease, file a new W-4 within 10 days.",
    },
    {
      q: "What is the Iowa school district surtax?",
      a: "Many Iowa school districts levy an income surtax to fund instructional support, charged as a percentage of your state income tax — not your gross income — and capped at 20% of your state tax when all district surtaxes are combined. It is figured on your return (IA 1040 line 54) and is not withheld from your pay. There is no Iowa city or county income tax.",
    },
    {
      q: "I live in Illinois but work in Iowa. Do I pay Iowa tax?",
      a: "No, on your wages — Iowa's only reciprocity agreement is with Illinois. Instead of an IA W-4, complete Form 44-016, the Employee's Statement of Nonresidence in Iowa, and give it to your Iowa employer, so Illinois tax is withheld instead. Commuters from Nebraska, Minnesota, Missouri, Wisconsin, and South Dakota have no agreement and pay Iowa tax on Iowa wages.",
    },
    {
      q: "Is there an Iowa Earned Income Tax Credit?",
      a: "Yes. Iowa matches 15% of your federal Earned Income Tax Credit. A filer may reduce annual Iowa income tax by up to 15% of their federal EITC amount, subject to eligibility — and because the credit is refundable, it can pay out even if you owe no Iowa tax. Part-year residents and nonresidents must prorate it by their Iowa income percentage.",
    },
    {
      q: "Does Iowa tax Social Security or retirement income?",
      a: "No. Iowa does not tax Social Security benefits at all, and since tax year 2023 it fully exempts pensions, IRA distributions, 401(k) withdrawals, and military retirement pay for filers age 55 or older or disabled. Working Iowans under 55 pay the flat 3.8% on wages.",
    },
    {
      q: "What is the Iowa tuition and textbook credit?",
      a: "Iowa gives a credit of 25% of the first $2,000 of qualifying tuition and textbook expenses per K-12 student — up to $500 per student — claimed on your IA 1040. Iowa also offers a child and dependent care credit and a deduction for College Savings Iowa 529 contributions.",
    },
    {
      q: "What is Iowa's standard deduction for 2026?",
      a: `Iowa's standard deduction is the federal amount: ${formatUSD0(IA_SD_SINGLE)} for single filers and $32,200 for married couples filing jointly in 2026. Because Iowa starts from federal taxable income, the federal deduction — or your itemized deductions — flows straight through to the Iowa return.`,
    },
    {
      q: "When is my Iowa return due, and do I need to make estimated payments?",
      a: "Iowa returns are due April 30, 2027 on Form IA 1040 — two weeks after the federal deadline. If you pay at least 90% of the tax due by April 30, your filing deadline extends automatically to October 31. If you expect to owe $1,000 or more in tax on income with no withholding, make estimated payments on Form IA 1040ES, due April 30, June 30, and September 30, 2026, and January 31, 2027. That $1,000 threshold is new for 2026; it was $200 in prior years.",
    },
    {
      q: "How does Iowa compare with California at the same salary?",
      a: `A single filer earning $60,000 owes ${formatAmountOrUnavailable(EX_IA_60.annualState)} a year in Iowa income tax, versus ${formatAmountOrUnavailable(EX_CA_60.annualState)} in California — Iowa costs only slightly more at this pay, before any school district surtax.`,
    },
  ],
  "kansas-paycheck-calculator": [
    {
      q: "How much Kansas income tax will I pay on a $60,000 salary?",
      a: `The calculator's table shows ${formatAmountOrUnavailable(EX_KS_60.annualState)} a year for a single filer earning $60,000. Kansas subtracts a $9,160 personal exemption on top of the standard deduction, and the calculator models it. The effective rate is ${(((EX_KS_60.annualState ?? 0) / 60000) * 100).toFixed(1)}% of gross pay.`,
    },
    {
      q: "What are Kansas' income tax rates in 2026?",
      a: "Kansas has two graduated rates: 5.2% on the first $23,000 of taxable income for a single filer ($46,000 joint), then 5.58% on everything above. The two-bracket structure dates from the 2024 reform in Special Session Senate Bill 1, and the Department of Revenue confirmed in Notice 25-06 that no further rate cut applies for 2026.",
    },
    {
      q: "How do I fill out the Kansas K-4?",
      a: "Complete Form K-4, the Kansas Employee's Withholding Allowance Certificate, when you start a job. The number of allowances you claim does not need to match your federal W-4 — Kansas uses its own exemption amounts, standard deduction, and brackets. If you split time between Kansas and another state, use Form K-4C to allocate withholding by the percentage of work performed in Kansas. If you do not file a K-4, your employer withholds as if you claimed no allowances.",
    },
    {
      q: "Does Kansas have a local income tax?",
      a: "No. No Kansas city, county, or school district levies an income tax on wages, so the state rate is the only income tax on a Kansas pay stub. Kansas also has no employee-paid state payroll program — no state disability, paid-leave, or unemployment deduction comes out of your pay.",
    },
    {
      q: "I live in Missouri but work in Kansas. Do I pay Kansas tax?",
      a: "Yes. Kansas has no reciprocal tax agreement with any other state, so a Missouri resident working in Kansas has Kansas tax withheld. You claim a credit on your home-state return for the tax paid to Kansas, which prevents true double taxation.",
    },
    {
      q: "Is there a Kansas Earned Income Tax Credit?",
      a: "Yes. Kansas matches 17% of your federal Earned Income Tax Credit. A filer may reduce annual Kansas income tax by up to 17% of their federal EITC amount, subject to eligibility — and because the credit is refundable, it can pay out even if you owe no Kansas tax.",
    },
    {
      q: "Does Kansas tax Social Security benefits?",
      a: "No. Starting with tax year 2024, all Social Security benefits included in your federal adjusted gross income are fully exempt from Kansas income tax — at any age, with no income limit.",
    },
    {
      q: "What is Kansas' standard deduction and personal exemption for 2026?",
      a: `The standard deduction is ${formatUSD0(KS_SD_SINGLE)} for a single filer ($8,240 joint, $6,180 head of household), and the personal exemption is $9,160 single ($18,320 joint), plus $2,320 per dependent. The calculator subtracts both before the rates are applied.`,
    },
    {
      q: "Do I need to make estimated payments in Kansas?",
      a: "You must make estimated payments on Form K-40ES if your estimated Kansas tax after withholding and credits is $500 or more and your withholding and credits may be less than the smaller of 90% of your 2026 tax or 100% of your 2025 tax. Four installments are due April 15, June 15, and September 15, 2026, and January 15, 2027 — or file and pay in full by January 31, 2027 instead. Use Schedule K-210 to figure any underpayment.",
    },
    {
      q: "When is my Kansas return due, and which form do I file?",
      a: "Kansas returns are due April 15, 2027, on Form K-40. Pay electronically through the Kansas payment portal at kansas.gov/payment-portal, or mail the K-40ES voucher with a check to Estimated Tax, Kansas Department of Revenue, PO Box 3506, Topeka, KS 66625-3506.",
    },
    {
      q: "How does Kansas compare with California at the same salary?",
      a: `A single filer earning $60,000 owes ${formatAmountOrUnavailable(EX_KS_60.annualState)} a year in Kansas income tax, versus ${formatAmountOrUnavailable(EX_CA_60.annualState)} in California — even the corrected Kansas bill is higher at this pay.`,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* SOURCES                                                             */
/* ------------------------------------------------------------------ */

export const BATCH_SOURCES: Record<string, { label: string; url: string }[]> = {
  "ohio-paycheck-calculator": [
    { label: "Ohio Department of Taxation — Annual Tax Rates", url: "https://tax.ohio.gov/individual/resources/annual-tax-rates" },
    { label: "Ohio Revised Code 5747.02 — Tax Levied", url: "https://codes.ohio.gov/ohio-revised-code/section-5747.02" },
    { label: "Ohio Department of Taxation — Form IT-4, Combined (PDF)", url: "https://dam.assets.ohio.gov/image/upload/tax.ohio.gov/forms/employer_withholding/generic/wth-it4-combined.pdf" },
    { label: "Ohio Department of Taxation — School District Data", url: "https://tax.ohio.gov/government/school-district-data" },
    { label: "IRS — States and Local Governments with Earned Income Tax Credit", url: "https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit/states-and-local-governments-with-earned-income-tax-credit" },
  ],
  "indiana-paycheck-calculator": [
    { label: "Indiana Department of Revenue — Departmental Notice #1 (PDF)", url: "https://in.gov/dor/files/dn01.pdf?lv=true" },
    { label: "Indiana Department of Revenue — Estimated Payments", url: "https://secure.in.gov/dor/i-need-to/make-a-payment/estimated-payments/" },
    { label: "IRS — States and Local Governments with Earned Income Tax Credit", url: "https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit/states-and-local-governments-with-earned-income-tax-credit" },
    { label: "National Conference of State Legislatures — Earned Income Tax Credit Overview", url: "https://www.ncsl.org/human-services/earned-income-tax-credit-overview" },
  ],
  "michigan-paycheck-calculator": [
    { label: "Michigan Department of Treasury — Calendar Year Tax Information (Withholding)", url: "https://www.michigan.gov/taxes/business-taxes/withholding/calendar-year-tax-information" },
    { label: "Michigan Department of Treasury — 2026 Michigan Income Tax Withholding Guide, Form 446 (PDF)", url: "https://www.michigan.gov/taxes/-/media/Project/Websites/taxes/Forms/SUW/TY2026/446_Withholding-Guide_2026.pdf" },
    { label: "Michigan Department of Treasury — Form MI-1040ES, 2026 (PDF)", url: "https://www.michigan.gov/taxes/-/media/Project/Websites/taxes/Forms/IIT/TY2025/MI-1040ES-(2026).pdf" },
    { label: "Michigan Department of Treasury — Revenue Administrative Bulletin 2026-1", url: "https://www.michigan.gov/taxes/rep-legal/rab/2026-revenue-administrative-bulletins/revenue-administrative-bulletin-2026-1" },
    { label: "IRS — States and Local Governments with Earned Income Tax Credit", url: "https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit/states-and-local-governments-with-earned-income-tax-credit" },
  ],
  "illinois-paycheck-calculator": [
    { label: "Illinois Department of Revenue — 2026 IL-700-T Illinois Withholding Tax Tables", url: "https://tax.illinois.gov/forms/withholding/currentyear/il-700-t-withholding-guide-tables.html" },
    { label: "Illinois Department of Revenue — Booklet IL-700-T, 2026 (PDF)", url: "https://tax.illinois.gov/content/dam/soi/en/web/tax/forms/withholding/documents/currentyear/il-700-t.pdf" },
    { label: "Illinois Department of Revenue — Publication 130, Who is Required to Withhold Illinois Income Tax (PDF)", url: "https://tax.illinois.gov/content/dam/soi/en/web/tax/research/publications/pubs/documents/pub-130.pdf" },
    { label: "Illinois Department of Revenue — What is the Illinois Personal Exemption Allowance?", url: "https://tax.illinois.gov/questionsandanswers/answer.851.html" },
    { label: "Illinois Department of Revenue — Publication 105, Illinois Estimated Payments Requirements", url: "https://tax.illinois.gov/research/publications/pubs/illinois-estimated-payments-requirements-for-individuals-and-businesses.html" },
  ],
  "wisconsin-paycheck-calculator": [
    { label: "Wisconsin Department of Revenue — 2026 Form 1-ES Instructions (PDF)", url: "https://www.revenue.wi.gov/TaxForms2026/2026-Form1-ES-Inst.pdf" },
    { label: "Wisconsin Department of Revenue — Earned Income Credit FAQ", url: "https://www.revenue.wi.gov/Pages/FAQS/ise-eic.aspx" },
    { label: "Wisconsin Department of Revenue — Individual Income Tax, Retired Persons", url: "https://www.revenue.wi.gov/Pages/FAQS/pcs-retired.aspx" },
    { label: "Wisconsin Department of Revenue — Withholding Tax Forms", url: "https://www.revenue.wi.gov/Pages/Form/with-home.aspx" },
  ],
  "minnesota-paycheck-calculator": [
    { label: "Minnesota Department of Revenue — Income Tax Rates and Brackets", url: "https://www.revenue.state.mn.us/minnesota-income-tax-rates-and-brackets" },
    { label: "Minnesota Department of Revenue — Tax Year 2026 Inflation-Adjusted Amounts (PDF)", url: "https://www.revenue.state.mn.us/sites/default/files/2025-12/inflation-adjusted-amounts-2026.pdf" },
    { label: "Minnesota Department of Revenue — Child Tax Credit Promotional Materials", url: "https://www.revenue.state.mn.us/child-tax-credit-promotional-materials" },
    { label: "Minnesota Paid Leave — How Paid Leave Works", url: "https://pl.mn.gov/individuals/how-paid-leave-works" },
    { label: "Minnesota Department of Revenue — Tax Year 2026 Tax Professional Desk Reference Chart (PDF)", url: "https://www.revenue.state.mn.us/sites/default/files/2026-10/tax-year-2026-tax-professional-desk-reference-chart-final.pdf" },
  ],
  "iowa-paycheck-calculator": [
    { label: "Iowa Department of Revenue — 2026 IA W-4, Employee Withholding Allowance Certificate (PDF)", url: "https://revenue.iowa.gov/media/4324/download" },
    { label: "Iowa Department of Revenue", url: "https://revenue.iowa.gov/" },
    { label: "IRS — States and Local Governments with Earned Income Tax Credit", url: "https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit/states-and-local-governments-with-earned-income-tax-credit" },
  ],
  "kansas-paycheck-calculator": [
    { label: "Kansas Department of Revenue — Form K-40ES, 2026 Kansas Individual Estimated Tax (PDF)", url: "https://www.ksrevenue.gov/pdf/k-40es26.pdf" },
    { label: "Kansas Department of Revenue", url: "https://www.ksrevenue.gov/" },
    { label: "IRS — States and Local Governments with Earned Income Tax Credit", url: "https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit/states-and-local-governments-with-earned-income-tax-credit" },
  ],
};

/* ------------------------------------------------------------------ */
/* DISPATCHER                                                          */
/* ------------------------------------------------------------------ */

export function BatchContent({ slug }: { slug: string }) {
  switch (slug) {
    case "ohio-paycheck-calculator":
      return <OhioContent />;
    case "indiana-paycheck-calculator":
      return <IndianaContent />;
    case "michigan-paycheck-calculator":
      return <MichiganContent />;
    case "illinois-paycheck-calculator":
      return <IllinoisContent />;
    case "wisconsin-paycheck-calculator":
      return <WisconsinContent />;
    case "minnesota-paycheck-calculator":
      return <MinnesotaContent />;
    case "iowa-paycheck-calculator":
      return <IowaContent />;
    case "kansas-paycheck-calculator":
      return <KansasContent />;
    default:
      return null;
  }
}
