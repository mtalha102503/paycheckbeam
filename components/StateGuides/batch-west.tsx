/**
 * PaycheckBeam — WEST batch state-guide content: Arizona, New Mexico,
 * Nevada, Oregon, Washington, Alaska, Hawaii, District of Columbia.
 *
 * Researched 2026-11-15 from opened official pages — see
 * ~/workspace/paycheckbeam-research/state-guides-west.md for sources,
 * left-out items and data corrections found. Nothing unverified from
 * that file's "left out" sections is included.
 *
 * Worked-example numbers are generated at render time from the same
 * shared calculation the calculator above the fold runs
 * (calculatePaycheck / estimateStateWithholding / estimateStateInsurance),
 * so the tables match the tool. Standard-deduction and credit dollar
 * amounts in prose are also generated from lib/stateTaxData.ts
 * (getStateBySlug) so they track the data file.
 *
 * Two rows are labelled "Partial calculation" in place by design:
 * - New Mexico $30,000: the low-and-middle-income exemption (up to
 *   $2,500 per qualified exemption, AGI up to $36,667 single) is not
 *   modelled, so a filer who qualifies would owe less.
 * - Oregon $150,000: the $263 personal exemption credit is only
 *   available up to $100,000 AGI (single), so above that income the
 *   real liability is higher by the credit amount.
 * No incomplete example is presented as exact.
 *
 * Hawaii uses its own taxable-income helper: the shared
 * stateTaxableIncome() subtracts only the standard deduction, but the
 * estimator also subtracts Hawaii's $1,144 personal exemption, so the
 * shared helper would overstate Hawaii taxable income.
 */
import type { FaqItem } from "@/components/FaqAccordion";
import {
  applyBrackets,
  formatUSD,
  formatUSD0,
} from "@/lib/paycheckCalc";
import { getStateBySlug } from "@/lib/stateTaxData";
import {
  bracketDetailText,
  effectiveRatePct,
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
  "arizona-paycheck-calculator",
  "new-mexico-paycheck-calculator",
  "nevada-paycheck-calculator",
  "oregon-paycheck-calculator",
  "washington-paycheck-calculator",
  "alaska-paycheck-calculator",
  "hawaii-paycheck-calculator",
  "district-of-columbia-paycheck-calculator",
];

/* Shared example results reused by prose and FAQs — no engine-derived
 * figure is ever a literal string in an answer. Computed once at module
 * load from the same calculation the calculator runs. */
const EX_AZ_60 = examplePaycheck("arizona-paycheck-calculator", 60000);
const EX_AZ_75 = examplePaycheck("arizona-paycheck-calculator", 75000);
const EX_NM_60 = examplePaycheck("new-mexico-paycheck-calculator", 60000);
const EX_NM_75 = examplePaycheck("new-mexico-paycheck-calculator", 75000);
const EX_NV_60 = examplePaycheck("nevada-paycheck-calculator", 60000);
const EX_NV_75 = examplePaycheck("nevada-paycheck-calculator", 75000);
const EX_OR_60 = examplePaycheck("oregon-paycheck-calculator", 60000);
const EX_OR_75 = examplePaycheck("oregon-paycheck-calculator", 75000);
const EX_WA_60 = examplePaycheck("washington-paycheck-calculator", 60000);
const EX_WA_75 = examplePaycheck("washington-paycheck-calculator", 75000);
const EX_AK_60 = examplePaycheck("alaska-paycheck-calculator", 60000);
const EX_AK_75 = examplePaycheck("alaska-paycheck-calculator", 75000);
const EX_HI_60 = examplePaycheck("hawaii-paycheck-calculator", 60000);
const EX_HI_75 = examplePaycheck("hawaii-paycheck-calculator", 75000);
const EX_DC_60 = examplePaycheck("district-of-columbia-paycheck-calculator", 60000);
const EX_DC_75 = examplePaycheck("district-of-columbia-paycheck-calculator", 75000);
const EX_CA_60 = examplePaycheck("california-paycheck-calculator", 60000);
const EX_NY_60 = examplePaycheck("new-york-paycheck-calculator", 60000, "none");

/* Standard-deduction and credit amounts from the data file, so prose and
 * FAQs track lib/stateTaxData.ts if the coordinator applies a correction. */
const AZ_SD_SINGLE = getStateBySlug("arizona-paycheck-calculator")?.standardDeductionSingle ?? 0;
const AZ_SD_JOINT = getStateBySlug("arizona-paycheck-calculator")?.standardDeductionMfj ?? 0;
const NM_SD_SINGLE = getStateBySlug("new-mexico-paycheck-calculator")?.standardDeductionSingle ?? 0;
const OR_SD_SINGLE = getStateBySlug("oregon-paycheck-calculator")?.standardDeductionSingle ?? 0;
const OR_CREDIT_SINGLE = getStateBySlug("oregon-paycheck-calculator")?.creditSingle ?? 0;
const DC_SD_SINGLE = getStateBySlug("district-of-columbia-paycheck-calculator")?.standardDeductionSingle ?? 0;

/* ------------------------------------------------------------------ */
/* ARIZONA                                                             */
/* ------------------------------------------------------------------ */

function ArizonaContent() {
  const slug = "arizona-paycheck-calculator";
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
  const azTaxable60 = stateTaxableIncome(slug, 60000);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          Arizona tax at real salaries — one rate, every dollar
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the 2026 standard
          deduction of {formatUSD0(sd)}, and applies the single flat rate
          of 2.5% to what is left. There are no brackets to climb and no
          marginal-rate surprise as pay rises: the rate on your last
          dollar is the same as the rate on your first taxable dollar.
        </Para>
        <NoteBox tone="blue">
          <strong>Withholding is not the tax.</strong> Your employer
          withholds the percentage you elect on Form A-4, applied to your{" "}
          <strong>gross</strong> wages — while the 2.5% tax applies to
          taxable income after the standard deduction. At $60,000 the 2.0%
          default withholds {formatUSD(0.02 * 60000)} a year against a
          liability of {formatAmountOrUnavailable(EX_AZ_60.annualState)}.
          Electing 2.5% on the A-4 does not mean you pay 2.5% of gross in
          tax — the deduction sits in between.
        </NoteBox>
        <WorkedTable
          caption="Arizona income tax, single filer, 2026"
          headers={["Gross wages", "AZ taxable income", "AZ income tax"]}
          rows={rows}
          footnote={`At $60,000 the effective Arizona income-tax rate is ${effectiveRatePct(EX_AZ_60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(examplePaycheck(slug, 150000).annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          The $60,000 row in detail: 2.5% × {formatUSD0(azTaxable60)} ={" "}
          {formatAmountOrUnavailable(EX_AZ_60.annualState)}. The same
          $60,000 single filer owes{" "}
          {formatAmountOrUnavailable(EX_CA_60.annualState)} in California
          and {formatAmountOrUnavailable(EX_NY_60.annualState)} in New York
          State — Arizona&apos;s flat rate keeps it the lowest of the
          three by a wide margin.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department&apos;s own terms</Eyebrow>
        <SectionTitle>
          A flat 2.5% since 2023 — and what it replaced
        </SectionTitle>
        <Para>
          Arizona taxes every dollar of taxable income at one flat rate
          of 2.5%, in effect since tax year 2023, when the state replaced
          its old graduated ladder under SB 1828. Arizona sets its
          standard deduction in statute and indexes it in the same manner
          as the federal standard deduction, so the amount moves with
          inflation each year rather than staying fixed. Arizona has no
          general personal exemption: instead of an exemption, dependents
          get a credit against the tax itself (see the credits section
          below).
        </Para>
        <Para>
          Arizona starts from your federal adjusted gross income, then
          applies Arizona additions and subtractions to reach Arizona
          taxable income. The subtractions are where Arizona is generous:
          Social Security benefits included in your federal AGI are
          subtracted in full, so Arizona does not tax Social Security at
          any income level, and military retirement pay is subtracted
          too. Up to $2,500 per person of a U.S., Arizona, or Arizona
          local government pension is also subtracted.
        </Para>
        <Para>
          There is no Arizona city or county wage income tax anywhere in
          the state, so an Arizona pay stub has federal taxes and one
          state income-tax line and nothing more. Arizona also has no
          mandatory state payroll-insurance deduction — no state
          disability, paid-leave, or unemployment contribution comes out
          of an employee&apos;s pay.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form A-4"
        title="Form A-4: you pick a percentage, not allowances"
        summary="Arizona's withholding form has no allowances and no worksheet — you check one of seven percentages. The default, the zero election, and the catch are inside."
      >
        <Para>
          Arizona&apos;s withholding certificate is Form A-4, the
          Employee&apos;s Arizona Withholding Election. It works nothing
          like the federal W-4: there are no allowances to count and no
          worksheet to complete. Box 1 offers seven percentages — 0.5%,
          1.0%, 1.5%, 2.0%, 2.5%, 3.0%, or 3.5% — and your employer
          withholds that share of your gross taxable wages (generally the
          amount in box 1 of your federal W-2, after pre-tax deductions
          such as health-insurance premiums) from every paycheck. You may
          also have your employer withhold an extra flat dollar amount
          from each paycheck. Give the completed form to your employer —
          it is not sent to the Department of Revenue.
        </Para>
        <Para>
          Complete the form within the first five days of employment. If
          you do not give your employer an A-4, the Department requires
          your employer to withhold at the 2.0% default rate. Because
          2.0% of gross is less than 2.5% of taxable income at higher pay,
          the default under-withholds once wages pass roughly $80,000 for
          a single filer — the shortfall shows up as a balance due on
          your Form 140. You can change your election at any time by
          filing a new A-4.
        </Para>
        <Para>
          Box 2 is the zero election: you may elect a withholding
          percentage of zero if you expect to have no Arizona tax
          liability for the current year. To keep a zero election for the
          next calendar year you must give your employer an updated Form
          A-4 — otherwise your employer may resume withholding. Zero
          withholding does not relieve you from paying Arizona income tax
          that turns out to be due when you file.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Credits · 2026 amounts · return-only"
        title="The Arizona credits claimed on your return"
        summary="Dependent credit, family income credit, and Arizona's dollar-for-dollar charitable and school credits. Claimed on your annual return; this calculator does not automatically adjust withholding for them."
      >
        <Para>
          <strong className="text-slate-900">Dependent tax
          credit (nonrefundable):</strong> a filer with dependents may
          reduce annual Arizona income tax by up to $125 per qualifying
          dependent under age 17 — raised from $100 for tax years
          beginning January 1, 2026 — and up to $25 per qualifying
          dependent age 17 or older, subject to eligibility, available
          tax liability, and phaseout. The credit phases down once
          federal adjusted gross income passes $200,000 for single,
          married filing separately, or head of household filers, and
          $400,000 for married couples filing jointly.
        </Para>
        <Para>
          <strong className="text-slate-900">Family Income Tax
          Credit (nonrefundable):</strong> a small credit for low-income
          households, computed from household income and the number of
          people in the household. It is claimed on the return and is not
          modelled in the calculator.
        </Para>
        <Para>
          <strong className="text-slate-900">Dollar-for-dollar
          credits:</strong> Arizona lets you direct part of your tax to
          qualifying charitable organizations, qualifying foster-care
          organizations, public schools, and private-school tuition
          organizations, with each credit capped per filer. These are
          credits against the tax itself, not deductions — but they are
          return-only, claimed on Form 140, and they do not change what
          is withheld from your paycheck.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Reciprocity · Form WEC"
        title="Live in California, Indiana, Oregon, or Virginia? File a WEC, not an A-4"
        summary="Arizona has reciprocity with four states. Residents of those states working in Arizona can stop Arizona withholding entirely — with a different form."
      >
        <Para>
          Arizona maintains reciprocal income-tax agreements with four
          states: California, Indiana, Oregon, and Virginia. Under
          reciprocity, wage income is taxed by the worker&apos;s state of
          residence, not the state where the work is performed. A
          resident of one of those four states who works in Arizona files
          Form WEC, the Employee Withholding Exemption Certificate, with
          the Arizona employer to claim exemption from Arizona
          withholding, so the home state&apos;s tax is withheld instead.
          The certificate must be renewed at the start of each calendar
          year. Reciprocity covers wages and salaries only — not business
          or investment income — and without the form on file, Arizona
          withholding applies and the worker files two returns to sort
          it out.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form 140, and quarterly estimates on Form 140ES"
        summary="Which return to file, the April 15 deadline, and when estimated payments are due."
      >
        <Para>
          Full-year residents file Form 140, part-year residents file
          Form 140PY, and nonresidents with Arizona-source income file
          Form 140NR. Returns are due April 15, with an extension to
          October 15 to file (not to pay). A single filer must generally
          file once gross income passes the standard-deduction amount for
          the year.
        </Para>
        <Para>
          If you have income with no Arizona withholding — freelance,
          1099, rental, or investment income — you owe quarterly
          estimated payments on Form 140ES, generally due April 15, June
          15, and September 15, 2026, and January 15, 2027. The usual
          safe harbor is paying at least 90% of the current year&apos;s
          Arizona tax or 100% of last year&apos;s Arizona tax across the
          four installments; underpayment can draw a penalty.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* NEW MEXICO                                                          */
/* ------------------------------------------------------------------ */

function NewMexicoContent() {
  const slug = "new-mexico-paycheck-calculator";
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
  const nmTaxable60 = stateTaxableIncome(slug, 60000);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          New Mexico tax at real salaries — six brackets, low at the
          bottom
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the 2026 standard
          deduction of {formatUSD0(sd)}, and applies the six graduated
          rates from 1.5% to 5.9%. Only the dollars inside each bracket
          are taxed at that bracket&apos;s rate. The first bracket is
          unusually low — 1.5% — so the tax on a modest paycheck is
          small, and the top rate of 5.9% only touches taxable income
          over $210,000.
        </Para>
        <NoteBox tone="amber">
          <strong>Partial calculation — the $30,000 row.</strong> New
          Mexico&apos;s low-and-middle-income exemption (up to $2,500 per
          qualified exemption) is not modelled in the calculator. A single
          filer with federal adjusted gross income of $36,667 or less
          qualifies, so at $30,000 of wages the real liability may be
          lower than the table shows. Do not treat the $30,000 row as
          exact if you qualify for that exemption.
        </NoteBox>
        <WorkedTable
          caption="New Mexico income tax, single filer, 2026"
          headers={["Gross wages", "NM taxable income", "NM income tax"]}
          rows={rows}
          partialRowIndexes={[0]}
          footnote={`At $60,000 the effective New Mexico income-tax rate is ${effectiveRatePct(EX_NM_60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(examplePaycheck(slug, 150000).annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          The $60,000 row in detail: {bracketDetailText(slug, 60000, brackets)}; total{" "}
          {formatUSD(applyBrackets(nmTaxable60, brackets))}. The same
          $60,000 single filer owes{" "}
          {formatAmountOrUnavailable(EX_CA_60.annualState)} in California
          — New Mexico&apos;s lower rates and larger standard deduction
          keep it well below California at the same pay.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department&apos;s own terms</Eyebrow>
        <SectionTitle>
          Starts from federal AGI — then New Mexico makes its own
          adjustments
        </SectionTitle>
        <Para>
          New Mexico&apos;s personal income tax starts with your federal
          adjusted gross income from your federal return. Form PIT-1 then
          applies New Mexico-specific adjustments, exemptions, and
          deductions to reach New Mexico net income, and the six-bracket
          table applies to that figure. You must use the same filing
          status for New Mexico as on your federal return.
        </Para>
        <Para>
          A person is a New Mexico resident if present in the state for
          185 days or more during the year. Residents are taxed on all
          income; nonresidents — including people who live in states with
          no income tax — must file when they have a federal filing
          requirement and any income from a New Mexico source. There is
          no reciprocity agreement that exempts a nonresident&apos;s
          wages: if you earn wages in New Mexico, New Mexico taxes them.
          Residents who pay tax to another state on the same income can
          claim a credit for taxes paid to the other state, capped at the
          smaller of the New Mexico liability on that income and the tax
          actually paid to the other state.
        </Para>
        <Para>
          New Mexico has no local income tax: no city or county adds its
          own income tax on top of the state rate, and there is no
          mandatory state payroll-insurance deduction on a New Mexico pay
          stub.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · no state W-4"
        title="New Mexico has no state W-4 — use your federal one, marked for New Mexico"
        summary="The one thing the Department says plainly: there is no state equivalent of the federal W-4. The workaround is a single handwritten line."
      >
        <Para>
          New Mexico does not have a state form equivalent to the federal
          Form W-4. For New Mexico withholding tax, you use a federal
          W-4 and write across the top of that form: &ldquo;For New Mexico
          Withholding Tax Only.&rdquo; Keep a copy in your files. Your
          employer withholds New Mexico tax from your wages on that
          basis, and the amount withheld is credited against your actual
          liability on Form PIT-1.
        </Para>
        <Para>
          Do not confuse the withholding paperwork with Form RPD-41072:
          that is the employer&apos;s annual summary reconciling the
          withholding shown on W-2s with the tax paid to the state. It is
          an employer form, kept in the employer&apos;s records — not
          something an employee fills in. If New Mexico tax was withheld
          from your pay in error, you file Form PIT-1 (with PIT-B if
          needed) and a letter from your employer explaining the error to
          get it back.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Credits &amp; exemptions · return-only"
        title="Working Families, child credit, and the low-income exemption"
        summary="Three refundable credits and one exemption that can be worth more than the tax itself at low incomes. All claimed on your return, not on your paycheck."
      >
        <Para>
          <strong className="text-slate-900">Working Families Tax
          Credit (refundable):</strong> equal to 25% of the federal
          Earned Income Credit you qualify for. A filer may reduce annual
          New Mexico income tax by up to 25% of their federal EIC amount,
          subject to eligibility — and New Mexico allows the credit even
          if you could not claim the federal EIC because you file with an
          ITIN or are age 18–25 without a qualifying child. It is
          claimed on Form PIT-1.
        </Para>
        <Para>
          <strong className="text-slate-900">Child Income Tax Credit
          (refundable):</strong> a filer may reduce annual New Mexico
          income tax by up to $622 per qualifying child, with the amount
          scaled down at higher incomes, subject to eligibility. It is
          claimed on Form PIT-1 with Schedule PIT-RC as the instructions
          direct.
        </Para>
        <Para>
          <strong className="text-slate-900">Low-Income Comprehensive
          Tax Rebate (refundable):</strong> a rebate for lower-income
          filers that offsets part of the overall tax burden, claimed on
          Form PIT-1. The Department&apos;s own overview also lists a
          low-and-middle-income exemption of up to $2,500 per qualified
          exemption — available to residents, part-year residents, and
          nonresidents alike — for federal AGI of $36,667 or less
          (single), $27,500 (married filing separately), or $55,000
          (joint, head of household, or surviving spouse). The calculator
          does not model that exemption, which is why the $30,000 worked
          example above is flagged.
        </Para>
        <Para>
          New Mexico also gives a $4,000 deduction for all but one
          dependent, and a credit for taxes paid to another state for
          residents (see the &ldquo;how it works&rdquo; section above).
          None of these is modelled in the calculator&apos;s withholding
          estimate — they settle on the return.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="What New Mexico does not tax"
        title="Social Security, and the 65-and-over exemption"
        summary="Social Security is fully exempt within income limits, and filers 65 and older get an additional exemption. Neither changes your paycheck withholding."
      >
        <Para>
          New Mexico fully exempts Social Security benefits from state
          income tax as long as adjusted gross income stays within the
          limits: $100,000 or less for single filers, $150,000 or less
          for married filing jointly, head of household, or surviving
          spouse, and $75,000 or less for married filing separately.
          Above those limits the exemption does not apply under current
          law.
        </Para>
        <Para>
          Residents who are 65 or older, or certified as blind for
          federal purposes, can subtract up to $8,000 from taxable
          income. The full $8,000 is available at adjusted gross income
          of $18,000 or less for single filers, phasing down to nothing
          once AGI exceeds $28,500; for joint, head of household, and
          surviving-spouse filers the full amount applies up to $30,000
          of AGI and phases out completely above $51,000.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form PIT-1, and quarterly estimates on Form PIT-ES"
        summary="Who must file, the April 15 deadline, and the $1,000 estimated-tax threshold."
      >
        <Para>
          You must file Form PIT-1 if you are a New Mexico resident or
          have income from New Mexico sources and you are required to
          file a federal return. Even if you are not required to file,
          you should file if you want a refund of New Mexico tax withheld
          from your pay or want to claim any New Mexico credits or
          rebates. Returns are due April 15. The fastest way to file is
          electronically through the Taxpayer Access Point (TAP) at
          tax.newmexico.gov, which is free.
        </Para>
        <Para>
          You must generally make estimated payments on Form PIT-ES if
          you expect to owe $1,000 or more after subtracting withholding
          and credits. Four installments are due April 15, June 15, and
          September 15, 2026, and January 15, 2027. You can avoid the
          underpayment penalty if the difference between your total tax
          and the amount withheld is less than $1,000, or if you paid at
          least 100% of last year&apos;s New Mexico tax liability through
          withholding and estimated payments combined.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* NEVADA                                                              */
/* ------------------------------------------------------------------ */

function NevadaContent() {
  const slug = "nevada-paycheck-calculator";
  const rows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(slug, gross);
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
          Nevada state income tax is $0 — and here is the whole paycheck
        </SectionTitle>
        <Para>
          There is no Nevada rate to apply, no Nevada standard deduction
          to subtract, and no Nevada bracket to climb. The state
          income-tax line is $0 at every wage, so the only taxes on a
          Nevada paycheck are the federal ones.
        </Para>
        <NoteBox tone="blue">
          <strong>Annual figures:</strong> federal income tax, Social
          Security, and Medicare are the same in every state for the same
          pay — only the state column changes, and Nevada keeps it at $0.
          Take-home pay is what is left after all of them.
        </NoteBox>
        <WorkedTable
          caption="Nevada take-home pay, single filer, 2026 — annual"
          headers={["Gross wages", "Federal income tax", "Social Security", "Medicare", "Nevada state tax", "Take-home pay"]}
          rows={rows}
          footnote={`The comparison is the point: the same $60,000 single filer owes ${formatAmountOrUnavailable(EX_CA_60.annualState)} a year in California and ${formatAmountOrUnavailable(EX_NY_60.annualState)} in New York State (before New York City tax) — $0 in Nevada. Federal tax is identical in all three states for the same W-4.`}
        />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>What $0 means in practice</Eyebrow>
        <SectionTitle>
          No Nevada form, return, or pay-stub line — when you live and
          work in Nevada
        </SectionTitle>
        <Para>
          Nevada levies no personal income tax — the state constitution
          (Article 10, Section 1) prohibits any tax on the wages or
          personal income of natural persons, and the Department of
          Taxation states plainly that the state does not impose an
          individual income tax and does not participate in administering
          the federal income tax. That has three practical consequences.
          First, there is no Nevada equivalent of Arizona&apos;s A-4 or
          Oregon&apos;s OR-W-4: a Nevada worker fills in only the federal
          Form W-4, and there is no state withholding form to get wrong.
          Second, if you live and work in Nevada you do not need to file
          a state income-tax return based on your earned income, and the
          Department does not require informational copies of your
          federal W-2 or 1099 forms. Third, your pay stub simply has no
          state income-tax line — nothing is withheld, so nothing
          appears. All of that applies when you live and work in Nevada:
          if you are a Nevada resident who works in another state, that
          state can withhold its own income tax, and a state line can
          appear on your pay stub.
        </Para>
        <Para>
          What still comes out is everything federal: federal income tax,
          Social Security at 6.2% up to $184,500 in 2026, and Medicare at
          1.45% plus 0.9% over $200,000. Those apply exactly as in every
          other state, and the calculator above shows them in full.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How Nevada pays for things instead</Eyebrow>
        <SectionTitle>
          Gaming, sales tax, and business taxes — not your wages
        </SectionTitle>
        <Para>
          Nevada funds state government without touching personal income.
          The Department of Taxation points to sales tax and property tax
          as the other main revenue sources, and Nevada is famous for the
          third leg: gaming taxes paid by casinos on gross gaming
          revenue. Businesses pay their own share instead: the Commerce
          Tax applies to businesses whose Nevada gross revenue exceeds $4
          million in a fiscal year, and employers pay the Modified
          Business Tax, a payroll tax on the employer side — neither is a
          deduction from an employee&apos;s pay stub, and neither is
          modelled in this calculator.
        </Para>
        <Para>
          The trade-off is the same one Texas makes in reverse: no income
          tax means the state leans harder on consumption. Nevada&apos;s
          statewide sales-tax base rate is higher than most states&apos;,
          and local additions push the combined rate higher still in
          Clark County. A Nevada paycheck keeps more, but everyday
          purchases cost more in tax — that is the real trade-off behind
          the $0 state tax line.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Moving to Nevada"
        title="Moving in, moving out, and the tax that follows you"
        summary="Nevada never charges you — but your old state taxes the income you earned while you lived there. The detail is inside."
      >
        <Para>
          There is nothing to stop in Nevada — Nevada never charges you.
          What changes is your old state: it taxes only the income you
          earned while you were its resident, plus its-source income
          after you leave, so you file its part-year or nonresident
          return for that period and nothing for Nevada. The reverse is
          also true: if you leave Nevada for a state with an income tax,
          that state starts taxing your wages from the day you become
          its resident, even though your Nevada years were $0.
        </Para>
        <Para>
          Nevada also has no state tax on retirement income, Social
          Security, or investment income — there is no personal income
          tax for any of it to fall under. Federal tax still applies to
          all of those income types, so a Nevada retiree&apos;s only
          income-tax filing obligation is with the IRS.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* OREGON                                                              */
/* ------------------------------------------------------------------ */

function OregonContent() {
  const slug = "oregon-paycheck-calculator";
  const st = getStateBySlug(slug);
  const sd = st?.standardDeductionSingle ?? 0;
  const credit = st?.creditSingle ?? 0;
  const brackets = st?.brackets ?? [];
  const rows = [30000, 60000, 90000, 150000].map((gross) => {
    const r = examplePaycheck(slug, gross);
    return [
      formatUSD0(gross),
      formatUSD0(stateTaxableIncome(slug, gross)),
      formatAmountOrUnavailable(r.annualState),
      formatUSD(r.annualStateInsurance),
    ];
  });
  const orTaxable60 = stateTaxableIncome(slug, 60000);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          Oregon tax at real salaries — a 9.9% top rate that arrives fast
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the 2026 standard
          deduction of {formatUSD0(sd)}, applies the four graduated rates
          from 4.75% to 9.9%, then subtracts the {formatUSD0(credit)}{" "}
          personal exemption credit. Oregon&apos;s brackets are narrow:
          the 8.75% rate starts at just $11,400 of taxable income, so
          most full-time workers are already in the second-highest
          bracket, and the 9.9% top rate starts at $125,000.
        </Para>
        <NoteBox tone="amber">
          <strong>What the table leaves out — and the federal-tax
          subtraction it does model.</strong> The statewide transit tax
          (0.1% of wages, no cap) is withheld from every Oregon paycheck
          but is <strong>not</strong> in this calculator — at $60,000 it
          is another {formatUSD(0.001 * 60000)} a year, at $150,000 it
          is {formatUSD(0.001 * 150000)}. The federal-tax subtraction,
          by contrast, <strong>is</strong> modelled in the table: the
          annual liability subtracts your federal tax liability, capped
          at $8,750 in 2026 (2026 Publication OR-ESTIMATE, worksheet
          line 9), and the subtraction phases out above certain federal
          AGI levels. Withholding works the other way round: it subtracts
          the federal income tax actually withheld from your pay, under
          the same $8,750 cap. Because the amount withheld during the
          year usually differs from your final federal liability, your
          withholding can come out higher or lower than the table — the
          gap is a timing difference settled on your OR-40, not a
          missing subtraction. The table shows the annual liability,
          settled on your OR-40.
        </NoteBox>
        <WorkedTable
          caption="Oregon income tax + Paid Leave Oregon, single filer, 2026"
          headers={["Gross wages", "OR taxable income", "OR income tax", "Paid Leave Oregon (0.6%)"]}
          rows={rows}
          footnote={`At $60,000 the effective Oregon income-tax rate is ${effectiveRatePct(EX_OR_60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(examplePaycheck(slug, 150000).annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, so the figures match the tool. Paid Leave Oregon is the employee share (60% of the 1% total premium), capped at $184,500 of wages.`}
        />
        <Para>
          The $60,000 row in detail: {bracketDetailText(slug, 60000, brackets)}; total{" "}
          {formatUSD(applyBrackets(orTaxable60, brackets))}, minus the{" "}
          {formatUSD0(credit)} credit ={" "}
          {formatAmountOrUnavailable(EX_OR_60.annualState)}. The same
          $60,000 single filer owes{" "}
          {formatAmountOrUnavailable(EX_CA_60.annualState)} in California
          — and in Washington, across the river, the state income-tax
          line is $0, though Washington&apos;s payroll programs still
          come out (see the Washington page).
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department&apos;s own terms</Eyebrow>
        <SectionTitle>
          Four rates, a federal-tax subtraction, and no sales tax
        </SectionTitle>
        <Para>
          Oregon taxes wages on four graduated rates — 4.75%, 6.75%,
          8.75%, and 9.9% — applied to taxable income after the standard
          deduction. The 9.9% top rate is one of the highest in the
          country, and it starts at $125,000 of taxable income for a
          single filer ($250,000 joint), far lower than California&apos;s
          top bracket. Oregon is also one of the few states with no sales
          tax at all, which is the other side of the bargain: the state
          raises its revenue from income tax instead.
        </Para>
        <Para>
          The quirk that makes Oregon withholding different from every
          other state is the federal-tax subtraction. Oregon&apos;s
          withholding formula starts from your wages, subtracts the
          federal income tax withheld from your pay — up to $8,750 in
          2026, phased down at higher wages — then subtracts the standard
          deduction, and only then applies the rates. A change to your
          federal W-4 therefore changes your Oregon withholding too. The
          annual liability in the table above subtracts federal tax as
          well — the 2026 Publication OR-ESTIMATE worksheet subtracts
          your federal tax liability, not the amount withheld (worksheet
          line 9, &ldquo;Federal tax liability ($0 to $8,750)&rdquo;,
          folded into line 11 and then into Oregon taxable income on
          line 13). So the two subtractions use the same $8,750 cap but
          different federal figures — liability for the annual return,
          withheld for each paycheck — and the subtraction phases out
          above certain federal AGI levels. When the amount withheld
          during the year differs from your final federal liability, your
          withholding differs from the annual liability by that gap.
        </Para>
        <Para>
          Oregon has no reciprocity agreement with Washington: a
          Washington resident working in Oregon owes Oregon tax on those
          wages, and an Oregon resident working in Washington still owes
          Oregon tax on all income as a resident, because Oregon taxes
          its residents on income from every source.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form OR-W-4"
        title="OR-W-4: allowances are worth $263 each — and no form means a flat 8%"
        summary="Oregon kept its own allowance system after the federal W-4 changed. What each allowance is worth, the no-form default, and the exemption rule are inside."
      >
        <Para>
          Oregon publishes its own withholding certificate, Form OR-W-4,
          the Oregon Withholding Statement and Exemption Certificate,
          because federal W-4 allowances stopped mapping onto Oregon
          withholding after the 2017 federal tax act. On the form you
          pick a filing status and count allowances — yourself, a spouse
          filing jointly, and each dependent — and each allowance is a{" "}
          {formatUSD0(263)} credit subtracted from your annual Oregon tax
          after the rates are applied. Allowances are ignored entirely
          once wages pass $100,000 for single filers or $200,000 for
          married filers.
        </Para>
        <Para>
          If you never file an OR-W-4 and no older Oregon-only or
          pre-2020 federal W-4 is on file, your employer must withhold a
          flat 8% of your wages — the federal W-4 redesigned for 2020
          cannot be used for Oregon withholding. File the OR-W-4 when you
          start a job and again whenever your situation changes.
        </Para>
        <Para>
          You can claim exemption from Oregon income-tax withholding only
          if you had no Oregon tax liability last year and expect none
          this year. Claim it on line 4 of the OR-W-4, and renew it by
          February 15 of the following year — it expires automatically.
          Even if you are exempt from income-tax withholding, your
          employer still withholds the statewide transit tax from every
          paycheck.
        </Para>
      </ExpandableSection>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Payroll programs · on the stub, separate from income tax</Eyebrow>
        <SectionTitle>
          Paid Leave Oregon and the statewide transit tax
        </SectionTitle>
        <Para>
          Paid Leave Oregon is a 1% premium on subject wages up to
          $184,500 in 2026, split 60% employee / 40% employer — so the
          employee share is 0.6%, at most{" "}
          {formatUSD(examplePaycheck(slug, 250000).annualStateInsurance)}{" "}
          a year. Your employer may cover part of the employee share, so
          your stub can show less. It is a separate line from income tax,
          and the calculator shows it as its own deduction.
        </Para>
        <Para>
          The statewide transit tax is 0.1% — one-tenth of 1 percent, or
          $1 per $1,000 — of wages, withheld from the employee, with no
          wage cap and no minimum threshold. It applies to Oregon
          residents no matter where the work is performed, and to
          nonresidents performing services in Oregon — including employees
          who are exempt from regular income-tax withholding. Revenue
          goes to the Statewide Transportation Improvement Fund. A 2025
          law would have doubled the rate to 0.2%, but voters rejected
          the increase (Measure 120, May 19, 2026 primary), so
          withholding stays at 0.1%. The transit tax is <strong>not
          </strong> modelled in this calculator. Do not confuse it with
          the TriMet and Lane County transit payroll taxes: those are
          imposed on the employer based on payroll, not withheld from
          your pay.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Credits · return-only"
        title="Oregon EIC, the Kids Credit, and the kicker that skips 2026"
        summary="Refundable credits for working families, and the famous surplus refund — which pays out only in odd-numbered years. None of these change your paycheck withholding."
      >
        <Para>
          <strong className="text-slate-900">Oregon Earned Income
          Credit (refundable):</strong> Oregon piggybacks on the federal
          EITC. A filer may reduce annual Oregon income tax by up to 14%
          of their federal EITC amount — 17% with a dependent child under
          age three — for tax years beginning in 2026, subject to
          eligibility. It is fully refundable, so it can pay out even if
          you owe no Oregon tax.
        </Para>
        <Para>
          <strong className="text-slate-900">Oregon Kids Credit
          (refundable):</strong> a filer may reduce annual Oregon income
          tax by up to $1,050 per qualifying dependent child age five or
          younger, for up to five children, subject to eligibility. The
          full credit is available at modified adjusted gross income of
          $26,550 or less and phases out entirely at $31,550 — the most
          recently published figures; the 2026 amounts may be slightly
          higher.
        </Para>
        <Para>
          <strong className="text-slate-900">The kicker:</strong>{" "}
          Oregon&apos;s constitution requires the state to return a
          surplus to taxpayers as a refundable credit when General Fund
          collections for a two-year budget cycle exceed the forecast by
          more than 2%. The most recent kicker, claimed on the 2025
          return, was 9.863% of each taxpayer&apos;s 2024 Oregon
          liability. The kicker only applies to odd-numbered tax years,
          so no kicker credit is available on the 2026 return.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Local taxes · Portland metro"
        title="Portland adds three local taxes the state calculator never sees"
        summary="Two percentage taxes on high incomes and a flat $35 arts tax — the two percentage taxes are withheld once pay passes $200,000; only the arts tax is never withheld."
      >
        <Para>
          <strong className="text-slate-900">Multnomah County Preschool
          for All — what you owe:</strong> 1.5% on Oregon taxable income
          above $125,000 for single filers ($200,000 joint), rising to 3%
          on income above $250,000 single ($400,000 joint). Both rates
          rise by 0.8 percentage points from January 1, 2028 — to 2.3%
          and 3.8% — under Multnomah County Board action 2026-053,
          adopted August 27, 2026, by a 5–0 vote. It is the second delay:
          the increase was originally set for January 1, 2026, moved to
          2027, and now to 2028. Note that some official pages still show
          the stale 2027 date, including the City of Portland Revenue
          Division&apos;s withholding page and Multnomah County&apos;s own
          Preschool for All page (last updated August 26, 2026). It applies
          to Multnomah County residents on full Oregon taxable income, and
          to nonresidents on income sourced within the county.{" "}
          <strong className="text-slate-900">What your employer
          withholds:</strong> an employer with a Multnomah County
          location must withhold from employees earning $200,000 or more
          in the calendar year — 1.5% on income above $200,000 and 3% on
          income above $400,000. If you earn below $200,000 you can opt
          in to withholding instead of paying it all on your return.
        </Para>
        <Para>
          <strong className="text-slate-900">Metro Supportive Housing
          Services — what you owe:</strong> 1% on Metro taxable income
          above $128,000 for single filers ($205,000 joint) in 2026 — the
          thresholds index annually from 2026. The Metro district covers
          the urbanized parts of Multnomah, Washington, and Clackamas
          counties and does not follow county lines.{" "}
          <strong className="text-slate-900">What your employer
          withholds:</strong> an employer with a Metro location must
          withhold from employees working within Metro who earn $200,000
          or more in the calendar year — 1% on income above $200,000. If
          you earn below $200,000 you can opt in to withholding.
        </Para>
        <Para>
          <strong className="text-slate-900">Portland Arts Tax:</strong>{" "}
          a flat $35 per year for every Portland resident age 18 or older
          who earns at least $1,000 in annual income and lives in a
          household above the federal poverty level. There is no employer
          withholding for the arts tax — it is the only one of the three
          that is never withheld. A single Portland filer above $250,000
          of taxable income therefore faces a combined top marginal rate
          of about 13.9% on the liability side — 9.9% state, 3% Preschool
          for All, 1% Metro — before the flat arts tax.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form OR-40, and quarterly estimates"
        summary="Full-year, part-year, and nonresident returns, the April 15 deadline, and estimated payments."
      >
        <Para>
          Full-year residents file Form OR-40, part-year residents file
          Form OR-40-P, and nonresidents with Oregon-source income file
          Form OR-40-N. Returns are due April 15. If you have income
          with no Oregon withholding — self-employment, rental, or
          investment income — make quarterly estimated payments on Form
          OR-40-V, generally due April 15, June 15, and September 15,
          2026, and January 15, 2027.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* WASHINGTON                                                          */
/* ------------------------------------------------------------------ */

function WashingtonContent() {
  const slug = "washington-paycheck-calculator";
  const rows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(slug, gross);
    return [
      formatUSD0(gross),
      formatUSD(r.annualFederal),
      formatUSD(r.annualSocialSecurity),
      formatUSD(r.annualMedicare),
      formatAmountOrUnavailable(r.annualState),
      formatUSD(r.annualStateInsurance),
      formatUSD(r.annualNet),
    ];
  });
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · every income level</Eyebrow>
        <SectionTitle>
          Washington state income tax is $0 — but two payroll programs
          still come out
        </SectionTitle>
        <Para>
          Washington levies no personal income tax on wages, so the state
          income-tax line is $0 at every wage. But unlike Texas or
          Nevada, Washington still withholds two state payroll programs
          from every paycheck: Paid Family &amp; Medical Leave and WA
          Cares long-term care. The table shows the whole paycheck, with
          both programs on their own line.
        </Para>
        <NoteBox tone="blue">
          <strong>Annual figures:</strong> federal income tax, Social
          Security, and Medicare are the same in every state for the same
          pay. The PFML + WA Cares column is the combined employee share
          of Washington&apos;s two payroll programs — the maximum
          employee share, since your employer may cover part of the PFML
          premium. Take-home pay is what is left after all of them.
        </NoteBox>
        <WorkedTable
          caption="Washington take-home pay, single filer, 2026 — annual"
          headers={["Gross wages", "Federal income tax", "Social Security", "Medicare", "WA state tax", "PFML + WA Cares", "Take-home pay"]}
          rows={rows}
          footnote={`The comparison is the point: the same $60,000 single filer owes ${formatAmountOrUnavailable(EX_OR_60.annualState)} a year in Oregon income tax and ${formatAmountOrUnavailable(EX_CA_60.annualState)} in California — $0 in Washington. Federal tax is identical in all three states for the same W-4.`}
        />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>What $0 means in practice</Eyebrow>
        <SectionTitle>
          No Washington form, return, or pay-stub state-tax line
        </SectionTitle>
        <Para>
          Washington does not currently have an individual income tax.
          There is no Washington equivalent of Oregon&apos;s OR-W-4: a
          Washington worker fills in only the federal Form W-4, and there
          is no state income-tax return to file on wages. Your pay stub
          has no state income-tax line — the only state lines are the two
          payroll programs below. All of that applies when you live and
          work in Washington: if you are a Washington resident who works
          in Oregon, Oregon taxes those wages, and an Oregon line can
          appear on your pay stub.
        </Para>
        <Para>
          What still comes out is everything federal: federal income tax,
          Social Security at 6.2% up to $184,500 in 2026, and Medicare at
          1.45% plus 0.9% over $200,000. Those apply exactly as in every
          other state, and the calculator above shows them in full.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Payroll programs · on the stub, separate from income tax</Eyebrow>
        <SectionTitle>
          PFML and WA Cares: the two lines that replace the state tax
        </SectionTitle>
        <Para>
          <strong className="text-slate-900">Paid Family &amp; Medical
          Leave (PFML):</strong> the 2026 total premium is 1.13% of
          wages up to the $184,500 Social Security wage base, split
          71.43% employee / 28.57% employer — so the maximum employee
          share is 0.8072%, at most{" "}
          {formatUSD(0.008072 * 184500)} a year. Your employer may cover
          part of the employee share, so your stub can show less. PFML
          pays for family and medical leave benefits; it is not an income
          tax.
        </Para>
        <Para>
          <strong className="text-slate-900">WA Cares (long-term
          care):</strong> 0.58% of gross wages, with no wage ceiling, and
          100% employee-paid. Unlike PFML it never stops: at $150,000 it
          is {formatUSD(0.0058 * 150000)} a year, and it keeps growing
          with pay. Together the two programs are the price of
          Washington&apos;s $0 income tax on a pay stub — at $60,000 they
          total {formatUSD(EX_WA_60.annualStateInsurance)} a year, far
          less than Oregon&apos;s income tax at the same pay.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Capital gains · not a paycheck item"
        title="Washington's 7% capital-gains tax never touches your salary"
        summary="The only income-style tax Washington levies — on long-term investment gains above a high threshold, filed separately, never withheld."
      >
        <Para>
          Washington levies a 7% excise tax on the sale or exchange of
          long-term capital assets — stocks, bonds, business interests —
          allocated to Washington, created by the 2021 Legislature. It
          applies only to individuals, only to gains above a standard
          deduction that the Department adjusts annually for inflation
          ($278,000 for tax year 2025; the 2026 figure had not been
          published when this page was researched), and from tax year
          2025 a second tier of 9.9% applies to taxable gains above $1
          million. Real estate and assets held in retirement accounts are
          exempt, and revenue funds the education legacy trust and common
          school construction accounts.
        </Para>
        <Para>
          None of it appears on a paycheck. Salary, bonuses, and hourly
          pay are outside the tax entirely, no employer withholds it, and
          only individuals who owe the tax file a capital-gains return —
          due the same day as the federal return, with payment typically
          due April 15. If you only earn wages, the capital-gains tax
          does not apply to you at all.
        </Para>
        <Para>
          One change to watch, not in effect for 2026 paychecks:
          Washington enacted a 9.9% tax on individual income above $1
          million (ESSB 6346, signed March 30, 2026), effective January
          1, 2028. It does not touch a 2026 paycheck, and it does not
          change the $0 state-tax line on this page.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Working Families Tax Credit · refund, not a return"
        title="Washington's refund for low-income workers — applied for separately"
        summary="A refundable credit of up to $1,330 for tax year 2025, claimed through the Department of Revenue — not on a tax return, because Washington has none."
      >
        <Para>
          The Washington Working Families Tax Credit is a refund of
          retail sales or use tax for low-to-moderate-income residents,
          modelled on the federal Earned Income Tax Credit. For tax year
          2025 the credit pays up to $1,330, with a minimum refund of $50.
          You must have lived in Washington for at least 183 days of the
          tax year, filed a federal return, and qualified for the federal
          EITC — or qualified except for filing with an ITIN. From
          calendar year 2026, renters who leased their primary residence
          in Washington for at least 183 days may receive an additional
          $300.
        </Para>
        <Para>
          Because Washington has no income-tax return, the credit is
          claimed through a separate application to the Department of
          Revenue — online through My DOR or on paper — not on any tax
          return. Applications for tax year 2025 opened February 1, 2026.
          It is a refund, not a paycheck item: nothing about it changes
          your withholding.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="How Washington pays for things instead"
        title="Sales tax in, no local income tax"
        summary="Washington funds itself largely through retail sales tax. No city or county adds an income tax on wages."
      >
        <Para>
          Washington funds state government largely through retail sales
          and use tax, business-and-occupation tax, and property tax —
          not through a tax on wages. No Washington city or county levies
          an income tax on wages, so there is no local line to add to the
          table above. The trade-off is the same as Nevada&apos;s: a
          paycheck with no state income tax, and everyday purchases taxed
          at the register instead.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* ALASKA                                                              */
/* ------------------------------------------------------------------ */

function AlaskaContent() {
  const slug = "alaska-paycheck-calculator";
  const rows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(slug, gross);
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
          Alaska state income tax is $0 — and here is the whole paycheck
        </SectionTitle>
        <Para>
          There is no Alaska rate to apply, no Alaska standard deduction
          to subtract, and no Alaska bracket to climb. The state
          income-tax line is $0 at every wage. That does not mean your
          stub shows federal deductions only: Alaska employees also pay
          an unemployment-insurance contribution — 0.50% of wages up to
          the $54,200 taxable wage base in 2026, at most $271 a year —
          which appears as its own line on the pay stub.
        </Para>
        <NoteBox tone="blue">
          <strong>Annual figures:</strong> federal income tax, Social
          Security, and Medicare are the same in every state for the same
          pay — only the state column changes, and Alaska keeps it at $0.
          Take-home pay is what is left after all of them.
        </NoteBox>
        <WorkedTable
          caption="Alaska take-home pay, single filer, 2026 — annual"
          headers={["Gross wages", "Federal income tax", "Social Security", "Medicare", "Alaska state tax", "Take-home pay"]}
          rows={rows}
          footnote={`The comparison is the point: the same $60,000 single filer owes ${formatAmountOrUnavailable(EX_CA_60.annualState)} a year in California and ${formatAmountOrUnavailable(EX_NY_60.annualState)} in New York State (before New York City tax) — $0 in Alaska. Federal tax is identical in all three states for the same W-4.`}
        />
        <NoteBox tone="amber">
          <strong>One state line still appears on the stub.</strong> The
          table above is the income-tax picture. On top of it, every
          Alaska paycheck carries the employee unemployment-insurance
          contribution: 0.50% of wages up to the $54,200 taxable wage
          base in 2026 — $150 a year at $30,000, $271 a year once wages
          reach the $54,200 base — and it stops once the base is reached.
          It is a real payroll deduction, not $0, even though the state
          income-tax line is.
        </NoteBox>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>What $0 means in practice</Eyebrow>
        <SectionTitle>
          No Alaska income-tax form or return — but one small stub line
          remains
        </SectionTitle>
        <Para>
          Alaska levies no personal income tax on wages, and no Alaska
          state income-tax return exists for an employee to file. There is
          no Alaska equivalent of Arizona&apos;s A-4 or Oregon&apos;s
          OR-W-4: an Alaska worker fills in only the federal Form W-4,
          and there is no state withholding form to get wrong. Your pay
          stub simply has no state income-tax line — no state income tax
          is withheld, so no income-tax line appears. One state line does
          appear, though: the employee unemployment-insurance
          contribution, 0.50% of wages up to the $54,200 taxable wage
          base in 2026 (at most $271 a year). All of that applies when
          you live and work in Alaska: if you are an Alaska resident who
          works in another state, that state can withhold its own income
          tax, and a state line can appear on your pay stub.
        </Para>
        <Para>
          What still comes out is everything federal: federal income tax,
          Social Security at 6.2% up to $184,500 in 2026, and Medicare at
          1.45% plus 0.9% over $200,000. Those apply exactly as in every
          other state, and the calculator above shows them in full.
          Alongside them, the Alaska unemployment-insurance contribution
          comes out at 0.50% of wages up to $54,200 a year — $150 a year
          at $30,000, $271 a year once wages reach the $54,200 base — and
          it stops once the base is reached.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="The Permanent Fund Dividend · not wages"
        title="The PFD is a payment to residents — not a paycheck, and not a wage"
        summary="Every Alaska resident can claim the annual dividend, but it never appears on a pay stub and it is never subject to Social Security or Medicare."
      >
        <Para>
          Alaska is the only state that pays its residents an annual
          dividend from oil wealth. The Permanent Fund Dividend — usually
          called the PFD — is paid to every qualifying resident once a
          year, including children. The 2025 dividend was $1,000 per
          person. The amount changes from year to year with the fund&apos;s
          performance and the Legislature&apos;s appropriation, and the
          2026 amount had not been announced when this page was
          researched, so the figure above is the most recent published
          amount, not a forecast of this year&apos;s payment.
        </Para>
        <Para>
          The PFD is not wages and never appears on your pay stub. It is
          not subject to Social Security or Medicare, and your employer
          has nothing to do with it. It is federally taxable as ordinary
          income — report it on Schedule 1 (Form 1040) line 8g, and the
          state sends a Form 1099-MISC (Box 3) for it. Apply every year
          from January 1 through March 31 at pfd.alaska.gov, using a
          myAlaska account; there is no grace period for a late
          application. Payments begin in early October.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="How Alaska pays for things instead"
        title="Oil revenue and no statewide sales tax — but local sales taxes exist"
        summary="Alaska funds state government from natural-resource revenue rather than personal income, but cities and boroughs may tax purchases."
      >
        <Para>
          Alaska funds state government largely from oil and natural
          resource revenue, which is what makes the $0 state income tax
          possible — and the PFD possible too. Alaska has no statewide
          sales tax either, the only state besides the handful of
          no-income-tax states that also skips it. But local governments
          can, and many do, levy their own sales taxes: cities and
          boroughs set their own rates, so the tax on a purchase depends
          on where you buy. Anchorage, the largest city, has no local
          sales tax; many smaller communities do. There is no local
          income tax on wages anywhere in the state.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* HAWAII                                                              */
/* ------------------------------------------------------------------ */

function HawaiiContent() {
  const slug = "hawaii-paycheck-calculator";
  const st = getStateBySlug(slug);
  const sd = st?.standardDeductionSingle ?? 0;
  const exemption = st?.exemptionSingle ?? 0;
  const brackets = st?.brackets ?? [];
  const hiTaxable = (gross: number) => gross - sd - exemption;
  const rows = [30000, 60000, 150000, 350000].map((gross) => {
    const r = examplePaycheck(slug, gross);
    return [
      formatUSD0(gross),
      formatUSD0(hiTaxable(gross)),
      formatAmountOrUnavailable(r.annualState),
      formatUSD(r.annualStateInsurance),
    ];
  });
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          Hawaii tax at real salaries — twelve brackets up to 11%
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the 2026 standard
          deduction of {formatUSD0(sd)} and the personal exemption of{" "}
          {formatUSD0(exemption)}, and applies the twelve graduated rates
          from 1.4% to 11%. Hawaii has the most brackets of any state on
          this page — twelve — and the top rate of 11% is the highest in
          the country. The 2026 standard deduction is $8,000 for single
          filers and $16,000 for joint filers under Act 46, up sharply
          from the 2025 amounts.
        </Para>
        <NoteBox tone="amber">
          <strong>Withholding runs below liability at high pay.</strong>{" "}
          Hawaii&apos;s withholding tables cap at 7.9% for high wages and
          do not include the 8.25%–11% brackets, so a high earner&apos;s
          paycheck withholding can fall short of the annual liability in
          this table. If you earn into the top brackets, expect a balance
          due on your N-11 — and consider extra withholding on the HW-4
          or estimated payments. The table shows the annual liability,
          settled on your return.
        </NoteBox>
        <WorkedTable
          caption="Hawaii income tax + TDI, single filer, 2026"
          headers={["Gross wages", "HI taxable income", "HI income tax", "TDI (0.5%, $7.50/wk cap)"]}
          rows={rows}
          footnote={`At $60,000 the effective Hawaii income-tax rate is ${effectiveRatePct(EX_HI_60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(examplePaycheck(slug, 150000).annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, so the figures match the tool. TDI is the Temporary Disability Insurance employee share.`}
        />
        <Para>
          The $60,000 row in detail:{" "}
          {(() => {
            // Local bracket walk on the exemption-adjusted taxable income:
            // the shared bracketDetailText() subtracts only the standard
            // deduction, which would overstate Hawaii taxable income.
            const t = hiTaxable(60000);
            const parts: string[] = [];
            let prevTop = 0;
            for (const b of brackets) {
              const top = b.upTo ?? Infinity;
              const base = Math.min(t, top) - prevTop;
              if (base > 0) {
                parts.push(
                  `${b.ratePct}% × ${formatUSD0(base)} = ${formatUSD((base * b.ratePct) / 100)}`,
                );
              }
              if (t <= top) break;
              prevTop = top;
            }
            return `${parts.join("; ")}; total ${formatUSD(applyBrackets(t, brackets))}.`;
          })()}{" "}
          The same $60,000 single filer owes{" "}
          {formatAmountOrUnavailable(EX_CA_60.annualState)} in California
          — Hawaii&apos;s top-heavy structure makes it the most expensive
          state on this page at the same pay.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department&apos;s own terms</Eyebrow>
        <SectionTitle>
          Twelve brackets, and a standard deduction that jumped in 2026
        </SectionTitle>
        <Para>
          Hawaii&apos;s individual income tax has twelve brackets from
          1.4% to 11%, applied to taxable income after the standard
          deduction and personal exemption. Act 46 (signed June 3, 2024)
          raised the standard deduction in steps: for 2026 it is $8,000
          for single filers, $16,000 for joint filers, and $12,000 for
          head of household. The 2026 brackets are unchanged from 2025 —
          the top rate of 11% still starts at $325,000 of taxable income
          for a single filer — but the larger deduction moves the
          threshold where tax starts upward for everyone.
        </Para>
        <Para>
          Hawaii is a worldwide-income state for residents: if you are a
          Hawaii resident, Hawaii taxes your income from every source,
          wherever earned. Nonresidents and part-year residents file
          Form N-15 and pay tax only on Hawaii-source income. There is no
          reciprocity agreement that exempts a nonresident&apos;s wages:
          if you earn wages in Hawaii, Hawaii taxes them. There is no
          local income tax anywhere in the state — no county adds its own
          tax on top of the state rate.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form HW-4"
        title="HW-4: one allowance per $1,144 — and Hawaii does not allow 'exempt'"
        summary="Allowances work differently here, and the one box every other state lets you tick is missing entirely."
      >
        <Para>
          Hawaii&apos;s withholding certificate is Form HW-4 (Rev.
          2022), the Employee&apos;s Withholding Allowance Certificate.
          On the form you count allowances — yourself, a spouse filing
          jointly, and each dependent — and each allowance reduces your
          annualized taxable wages by $1,144, the same as the personal
          exemption. Hawaii&apos;s withholding formula then uses the
          number of allowances and your pay frequency to compute the
          amount withheld each period.
        </Para>
        <Para>
          One thing Hawaii does not allow: &ldquo;exempt&rdquo; status.
          Hawaii law does not permit an employee to claim exemption from
          Hawaii withholding, even if you expect to owe no tax for the
          year. The HW-4 has no exemption box — unlike the federal W-4
          and most other states&apos; forms. If you want more withheld
          than the formula produces, write an additional flat amount on
          the form; if you want less, the only lever is the number of
          allowances.
        </Para>
      </ExpandableSection>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Payroll programs · on the stub, separate from income tax</Eyebrow>
        <SectionTitle>
          Temporary Disability Insurance: 0.5% with a $7.50 weekly cap
        </SectionTitle>
        <Para>
          Hawaii requires Temporary Disability Insurance (TDI), which
          pays a wage-replacement benefit when a worker is temporarily
          unable to work because of illness or injury. The employee share
          is 0.5% of wages, capped at $7.50 per week — at most{" "}
          {formatUSD(7.5 * 52)} a year — so at $60,000 it is{" "}
          {formatUSD(EX_HI_60.annualStateInsurance)} and at $150,000 it
          is {formatUSD(examplePaycheck(slug, 150000).annualStateInsurance)}.
          The employer may pay part of the employee share, so your stub
          can show less. TDI is a separate line from income tax, and the
          calculator shows it as its own deduction.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Credits · return-only"
        title="Food and excise, renters, and the state EITC"
        summary="Refundable credits aimed at the cost of living in the most expensive state in the country. All claimed on your return, not on your paycheck."
      >
        <Para>
          <strong className="text-slate-900">Food and Excise Tax
          Credit (refundable):</strong> a credit for the general excise
          tax paid on food, claimed on Form N-311. A filer may reduce
          annual Hawaii income tax by up to $220 per exemption, with the
          amount scaled down at higher incomes, subject to eligibility.
          Federal adjusted gross income must be under $40,000 for single
          filers and under $60,000 for other filing statuses, and the
          credit must be claimed within 12 months of the close of the tax
          year.
        </Para>
        <Para>
          <strong className="text-slate-900">Low-Income Household
          Renters Credit (refundable):</strong> for renters with federal
          adjusted gross income under $30,000 who paid more than $1,000
          in rent during the year. A filer may reduce annual Hawaii
          income tax by up to $50 per exemption, subject to eligibility.
        </Para>
        <Para>
          <strong className="text-slate-900">Hawaii Earned Income Tax
          Credit (refundable):</strong> Hawaii has a state EITC set as a
          percentage of the federal EITC, but the published sources
          disagree about the current percentage, so no figure is given
          here. Check the Department of Taxation&apos;s current
          instructions for Form N-11 before claiming it.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form N-11, and quarterly estimates on Form N-200V"
        summary="Residents, part-year residents, and nonresidents — the April 20 deadline, and estimated payments."
      >
        <Para>
          Full-year residents file Form N-11; part-year residents and
          nonresidents with Hawaii-source income file Form N-15. Hawaii
          returns are due April 20 — five days later than the federal
          deadline — and a six-month extension runs to October 20. File
          electronically through Hawaii Tax Online at hitax.hawaii.gov.
        </Para>
        <Para>
          If you have income with no Hawaii withholding — self-employment,
          rental, or investment income — make quarterly estimated
          payments on Form N-200V, generally due April 20, June 20, and
          September 20, 2026, and January 20, 2027.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="What Hawaii does not tax"
        title="No local tax, and Social Security stays out"
        summary="Hawaii has no county income tax, and Social Security benefits are not taxed in Hawaii."
      >
        <Para>
          No Hawaii county levies an income tax on wages, so the state
          rate in the table above is the only income tax on a Hawaii pay
          stub. Social Security benefits are not taxed in Hawaii, and the
          state&apos;s general excise tax — often mistaken for a sales
          tax — is a tax on businesses, not on wages, and never appears
          on a pay stub.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* DISTRICT OF COLUMBIA                                                */
/* ------------------------------------------------------------------ */

function DistrictOfColumbiaContent() {
  const slug = "district-of-columbia-paycheck-calculator";
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
  const dcTaxable60 = stateTaxableIncome(slug, 60000);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          DC tax at real salaries — seven brackets up to 10.75%
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the 2026 standard
          deduction of {formatUSD0(sd)}, and applies the seven graduated
          rates from 4% to 10.75%. The rates are the same for every filing
          status — only the standard deduction changes. The top rate of
          10.75% starts at $1,000,000 of taxable income, but the 8.5%
          rate already applies above $60,000.
        </Para>
        <WorkedTable
          caption="District of Columbia income tax, single filer, 2026"
          headers={["Gross wages", "DC taxable income", "DC income tax"]}
          rows={rows}
          footnote={`At $60,000 the effective DC income-tax rate is ${effectiveRatePct(EX_DC_60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(examplePaycheck(slug, 150000).annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          The $60,000 row in detail: {bracketDetailText(slug, 60000, brackets)}; total{" "}
          {formatUSD(applyBrackets(dcTaxable60, brackets))}. The same
          $60,000 single filer owes{" "}
          {formatAmountOrUnavailable(EX_CA_60.annualState)} in California
          and {formatAmountOrUnavailable(EX_NY_60.annualState)} in New
          York State (before New York City tax) — DC is the most
          expensive of the three at this pay.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Office&apos;s own terms</Eyebrow>
        <SectionTitle>
          The District taxes its residents — and no nonresident&apos;s
          wages at all
        </SectionTitle>
        <Para>
          The District of Columbia is not a state, but its individual
          income tax works like one. DC taxes the income of its residents
          — a person domiciled in the District at any time during the tax
          year, or maintaining a place of abode in the District for 183
          days or more — at seven graduated rates from 4% to 10.75%. The
          rates have been the same since tax years beginning after
          December 31, 2021.
        </Para>
        <Para>
          What makes DC different from every state on this page is the
          other side of the rule. The Home Rule Act bars the District
          from taxing the personal income of nonresidents, so DC taxes no
          nonresident&apos;s wages — not just Maryland and Virginia
          residents, but the residents of any state who commute into the
          District. If you live in Maryland or Virginia and work in DC,
          DC does not withhold its income tax from your pay at all: your
          home state taxes those wages instead. That is also why DC has
          reciprocity agreements with Maryland and Virginia — they
          confirm the arrangement in both directions, so a DC resident
          working in Maryland or Virginia is not taxed by that state on
          the same wages.
        </Para>
        <Para>
          There are no counties in the District, so there is no local
          income tax on top of the District rate. The DC rate in the
          table above is the only income tax on a DC pay stub.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form D-4 and Form D-4A"
        title="Two forms: one for residents, one to stop DC withholding entirely"
        summary="Residents file a D-4; commuters from any state file a D-4A and pay no DC tax. The detail is inside."
      >
        <Para>
          <strong className="text-slate-900">Form D-4 (residents):</strong>{" "}
          the DC Withholding Allowance Certificate. The Office of Tax and
          Revenue no longer publishes withholding tables — employers
          apply the DC rate schedule and use the federal allowance amount
          ($4,300 per allowance in 2026, from IRS Publication 15-T) to
          compute withholding. If you file no D-4, your employer must
          withhold as if you claimed zero allowances as a single filer.
        </Para>
        <Para>
          <strong className="text-slate-900">Form D-4A
          (nonresidents):</strong> the Certificate of Nonresidence in the
          District of Columbia. File it with your employer to certify
          that you maintain your permanent residence outside the District
          and do not reside in the District for 183 days or more. Once it
          is on file, your employer stops withholding DC income tax from
          your pay. A DC resident working in Maryland files the Virginia
          or Maryland equivalent — Form VA-4 or the Maryland exemption
          certificate — to stop that state from withholding on the same
          wages.
        </Para>
        <Para>
          If DC tax was withheld from your pay in error — because no
          D-4A was on file — you do not file a DC return to get it back.
          You file Form D-40B, a request for a refund of DC income tax
          withheld in error, with the Office of Tax and Revenue.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Credits · return-only"
        title="DC EITC, Schedule H, and Keep Child Care Affordable"
        summary="Three credits that can be worth more than the tax itself at low incomes. All claimed on your D-40, not on your paycheck."
      >
        <Para>
          <strong className="text-slate-900">District Earned Income Tax
          Credit (refundable):</strong> the District matches a
          percentage of the federal Earned Income Tax Credit — the Office
          of Tax and Revenue announced 85% for tax years 2025 through
          2028, with a planned increase to 100% postponed to after
          December 31, 2028. Because a 2025 D-40 form line showed a
          different figure, no percentage is stated here: check the
          current D-40 instructions before claiming it. DC also offers
          monthly payments of the credit for refunds of $1,200 or more.
        </Para>
        <Para>
          <strong className="text-slate-900">Schedule H — Homeowner and
          Renter Property Tax Credit (refundable):</strong> a credit of
          up to $1,425 for DC residents who own or rent a home in the
          District and meet the income limits, claimed on Schedule H with
          Form D-40. It offsets property tax, not income tax, and it is
          refundable.
        </Para>
        <Para>
          <strong className="text-slate-900">Keep Child Care Affordable
          Tax Credit (refundable):</strong> a filer may reduce annual DC
          income tax by up to $1,200 per eligible child for licensed child
          care costs, subject to eligibility.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form D-40, Form D-40B, and Form D-30 — which one depends on the income"
        summary="Residents file the D-40. For a nonresident, the right form depends on the kind of DC income — wages, rent, or a business. The April 15 deadline, and estimated payments."
      >
        <Para>
          DC residents file Form D-40, the DC Individual Income Tax
          Return, due April 15. File electronically through MyTax.DC.gov.
          For a nonresident, the form depends on the income. If your only
          DC income is wages — or DC tax was withheld from your pay in
          error — you do not file a D-40 at all: you file Form D-40B, a
          Nonresident Request for Refund, to get the withheld tax back.
          If your only DC income is rent from DC property and the gross
          is $12,000 or less, you file neither a D-40 nor a D-30: the
          business files the D-30N affidavit instead and owes no franchise
          tax. If the gross is over $12,000, the business files Form D-30,
          the Unincorporated Business Franchise Return, at the 8.25%
          franchise-tax rate. Whether the individual landlord also files
          a D-40 on the rental income is a narrow, statutorily arguable
          question — DC Code §47-1805.02(1) is headed &ldquo;Residents and
          nonresidents&rdquo; and was amended in December 2025 — so check
          the current D-40 instructions rather than assuming either
          answer. A personal capital gain on DC real estate is not DC
          individual-income-taxable: the Home Rule Act bars the District
          from taxing a nonresident&apos;s personal income.
        </Para>
        <Para>
          Rental activity is what turns on the $12,000 line. The Office of
          Tax and Revenue&apos;s FAQ answers &ldquo;Do I have to file a
          form D-30 for a rental property?&rdquo; with: &ldquo;Yes. You
          must file form D-30 if the gross receipt on the rental property
          from District sources is greater than $12,000.&rdquo; The same
          $12,000 DC-gross-income threshold applies to partnerships, sole
          proprietorships, and other unincorporated businesses, which file
          the Unincorporated Business Franchise Return, Form D-30; at or
          below $12,000 the business files the D-30N affidavit instead
          and owes no franchise tax.
        </Para>
        <Para>
          If you have income with no DC withholding, make quarterly
          estimated payments on Form D-40ES, generally due April 15, June
          15, and September 15, 2026, and January 15, 2027.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* FAQS                                                                */
/* ------------------------------------------------------------------ */

export const BATCH_FAQS: Record<string, FaqItem[]> = {
  "arizona-paycheck-calculator": [
    {
      q: "How much Arizona income tax will I pay on a $60,000 salary?",
      a: `A single filer earning $60,000 in wages owes ${formatAmountOrUnavailable(EX_AZ_60.annualState)} a year in Arizona income tax after the ${formatUSD0(AZ_SD_SINGLE)} standard deduction. Arizona's flat 2.5% rate applies to all taxable income, so the effective rate is ${effectiveRatePct(EX_AZ_60.annualState, 60000)}% of gross pay.`,
    },
    {
      q: "What is Arizona's income tax rate in 2026?",
      a: "Arizona has a single flat rate of 2.5% on all taxable income, in effect since tax year 2023. There are no brackets: every dollar of taxable income above the standard deduction is taxed at 2.5%.",
    },
    {
      q: "How do I fill out the Arizona A-4 withholding form?",
      a: "Choose a withholding percentage from the seven options on Form A-4 (0.5% to 3.5% of gross taxable wages) or enter 0% in Box 2 if you expect no Arizona tax liability. Give the form to your employer, not to the Department of Revenue. If you file no A-4 within five days of hire, your employer withholds at the default 2.0%.",
    },
    {
      q: "What happens if I pick 0% on my A-4 but owe tax at year end?",
      a: "You will owe the balance when you file Form 140, and you may owe an underpayment penalty if the shortfall is large enough. The 0% election is meant for people who genuinely expect no Arizona liability — for example, because credits cover it. If your situation changes during the year, file a new A-4 with your employer.",
    },
    {
      q: "Does Arizona tax Social Security benefits?",
      a: "No. Arizona fully subtracts Social Security benefits from taxable income, so they are not taxed by the state. Military retirement pay is also exempt, and up to $2,500 per person of U.S., Arizona, or local government pension income can be subtracted.",
    },
    {
      q: "Is there a dependent credit in Arizona?",
      a: "Yes. Arizona gives a credit of $125 per dependent under age 17 and $25 per dependent age 17 or older, claimed on your return. It may reduce your annual Arizona income tax by up to those amounts per qualifying dependent, subject to eligibility, available tax liability, and phaseout — the credit phases down once federal adjusted gross income exceeds $200,000 for single filers or $400,000 for joint filers.",
    },
    {
      q: "Does Arizona have a local income tax?",
      a: "No. No Arizona city or county levies an income tax on wages, so the 2.5% state rate is the only income tax on an Arizona pay stub.",
    },
    {
      q: "I live in California but work in Arizona. Do I pay Arizona tax?",
      a: "Yes, on the wages you earn in Arizona. Arizona has reciprocity agreements with California, Indiana, Oregon, and Virginia: if you are a resident of one of those states and work in Arizona, you file Form WEC with your Arizona employer so Arizona does not withhold, and you pay tax to your home state instead. The agreement covers wages only and must be renewed each year.",
    },
    {
      q: "What is Arizona's standard deduction for 2026?",
      a: `The calculator uses ${formatUSD0(AZ_SD_SINGLE)} for single filers and ${formatUSD0(AZ_SD_JOINT)} for married filing jointly. Arizona law (A.R.S. § 43-1041, as amended by HB 4168) indexes its standard deduction like the federal one, so the 2026 figure is the federal amount — $16,100 single / $32,200 joint.`,
    },
    {
      q: "When is my Arizona return due, and which form do I file?",
      a: "Arizona returns are due April 15. Full-year residents file Form 140, part-year residents file Form 140PY, and nonresidents with Arizona-source income file Form 140NR. A six-month extension runs to October 15, but it extends the filing deadline, not the payment deadline.",
    },
    {
      q: "Do I need to make estimated payments in Arizona?",
      a: "If you have income with no Arizona withholding — self-employment, rental, or investment income — make quarterly estimated payments on Form 140ES, due April 15, June 15, and September 15, 2026, and January 15, 2027. You can generally avoid the underpayment penalty if you pay at least 90% of the current year's tax or 100% of last year's tax through withholding and estimates combined.",
    },
    {
      q: "How does Arizona compare with California at the same salary?",
      a: `A single filer earning $60,000 owes ${formatAmountOrUnavailable(EX_AZ_60.annualState)} a year in Arizona income tax, versus ${formatAmountOrUnavailable(EX_CA_60.annualState)} in California. Arizona's flat 2.5% rate and larger standard deduction keep it well below California at the same pay.`,
    },
  ],
  "new-mexico-paycheck-calculator": [
    {
      q: "How much New Mexico income tax will I pay on a $60,000 salary?",
      a: `A single filer earning $60,000 in wages owes ${formatAmountOrUnavailable(EX_NM_60.annualState)} a year in New Mexico income tax after the ${formatUSD0(NM_SD_SINGLE)} standard deduction. The effective rate is ${effectiveRatePct(EX_NM_60.annualState, 60000)}% of gross pay.`,
    },
    {
      q: "What are New Mexico's income tax rates in 2026?",
      a: "New Mexico has six graduated rates from 1.5% to 5.9%. The 1.5% rate applies to the first $5,500 of taxable income, and the top rate of 5.9% applies only to taxable income over $210,000. Only the dollars inside each bracket are taxed at that bracket's rate.",
    },
    {
      q: "Does New Mexico have a state W-4 form?",
      a: "No. New Mexico does not have a state equivalent of the federal Form W-4. For New Mexico withholding tax, use a federal W-4 and write across the top: \u201cFor New Mexico Withholding Tax Only.\u201d Form RPD-41072 is the employer's annual reconciliation, not an employee form.",
    },
    {
      q: "What is the Working Families Tax Credit?",
      a: "New Mexico's Working Families Tax Credit is a refundable credit equal to 25% of the federal Earned Income Credit you qualify for. A filer may reduce annual New Mexico income tax by up to 25% of their federal EIC amount, subject to eligibility — and New Mexico allows it even if you could not claim the federal EIC because you file with an ITIN or are age 18\u201325 without a qualifying child. It is claimed on Form PIT-1.",
    },
    {
      q: "Is there a child tax credit in New Mexico?",
      a: "Yes. The Child Income Tax Credit is refundable, and a filer may reduce annual New Mexico income tax by up to $622 per qualifying child, with the amount scaled down at higher incomes, subject to eligibility. It is claimed on Form PIT-1.",
    },
    {
      q: "Does New Mexico tax Social Security benefits?",
      a: "No, within income limits. New Mexico fully exempts Social Security benefits when adjusted gross income is $100,000 or less for single filers, $150,000 or less for married filing jointly, head of household, or surviving spouse, and $75,000 or less for married filing separately.",
    },
    {
      q: "Does New Mexico have a local income tax?",
      a: "No. No New Mexico city or county levies an income tax on wages, so the state rate is the only income tax on a New Mexico pay stub.",
    },
    {
      q: "I live in Texas but work in New Mexico. Do I pay New Mexico tax?",
      a: "Yes. New Mexico has no reciprocity agreement that exempts a nonresident's wages: if you earn wages in New Mexico, New Mexico taxes them, even if you live in a state with no income tax. Nonresidents with any New Mexico-source income must file when they have a federal filing requirement.",
    },
    {
      q: "What is the low-and-middle-income exemption?",
      a: "It is an exemption of up to $2,500 per qualified exemption for federal adjusted gross income of $36,667 or less (single), $27,500 (married filing separately), or $55,000 (joint, head of household, or surviving spouse). It is not modelled in this calculator, which is why the $30,000 worked example is flagged as a partial calculation.",
    },
    {
      q: "When is my New Mexico return due, and which form do I file?",
      a: "New Mexico returns are due April 15. Residents and nonresidents with New Mexico-source income file Form PIT-1. The fastest way to file is electronically through the Taxpayer Access Point (TAP) at tax.newmexico.gov, which is free.",
    },
    {
      q: "Do I need to make estimated payments in New Mexico?",
      a: "You must generally make estimated payments on Form PIT-ES if you expect to owe $1,000 or more after subtracting withholding and credits. Four installments are due April 15, June 15, and September 15, 2026, and January 15, 2027. You can avoid the underpayment penalty if the difference between your total tax and the amount withheld is less than $1,000, or if you paid at least 100% of last year's New Mexico tax liability.",
    },
    {
      q: "How does New Mexico compare with California at the same salary?",
      a: `A single filer earning $60,000 owes ${formatAmountOrUnavailable(EX_NM_60.annualState)} a year in New Mexico income tax, versus ${formatAmountOrUnavailable(EX_CA_60.annualState)} in California. New Mexico's lower rates and larger standard deduction keep it well below California at the same pay.`,
    },
  ],
  "nevada-paycheck-calculator": [
    {
      q: "Does Nevada have a state income tax?",
      a: "No. Nevada levies no personal income tax on wages, and the state constitution (Article 10, Section 1) prohibits any tax on the wages or personal income of natural persons. The Nevada Department of Taxation states this plainly on its own website.",
    },
    {
      q: "What does a Nevada paycheck look like at $60,000?",
      a: `A single filer earning $60,000 in Nevada takes home ${formatUSD(EX_NV_60.annualNet)} a year. The only taxes withheld are federal: ${formatUSD(EX_NV_60.annualFederal)} federal income tax, ${formatUSD(EX_NV_60.annualSocialSecurity)} Social Security, and ${formatUSD(EX_NV_60.annualMedicare)} Medicare. The Nevada state income-tax line is $0.`,
    },
    {
      q: "Is there a Nevada withholding form to fill out?",
      a: "No. There is no Nevada equivalent of Arizona's A-4 or Oregon's OR-W-4. A Nevada worker fills in only the federal Form W-4, and there is no state withholding form to get wrong.",
    },
    {
      q: "Do I need to file a Nevada state tax return?",
      a: "No, not on your wages. If you live and work in Nevada you do not need to file a state income-tax return based on your earned income, and the Department does not require informational copies of your federal W-2 or 1099 forms. You still file a federal return with the IRS.",
    },
    {
      q: "Why is there no state income-tax line on my Nevada pay stub?",
      a: "Because nothing is withheld. Nevada has no state income tax to withhold, so there is no line for it. Your stub shows only the federal deductions: federal income tax, Social Security, and Medicare.",
    },
    {
      q: "How does Nevada pay for state government without an income tax?",
      a: "Nevada funds state government largely from sales tax, property tax, and gaming taxes paid by casinos on gross gaming revenue. Businesses pay their own share too: the Commerce Tax applies to businesses with Nevada gross revenue over $4 million a year, and employers pay the Modified Business Tax, a payroll tax on the employer side. Neither is deducted from an employee's pay stub.",
    },
    {
      q: "I live in Nevada but work in California. Do I pay California tax?",
      a: "Yes, on the wages you earn in California. Nevada's $0 rate only covers Nevada: the state where you earn the wages can tax them. California will withhold its own income tax from your pay, and a California line will appear on your pay stub.",
    },
    {
      q: "Does Nevada tax retirement income or Social Security?",
      a: "No. Nevada has no personal income tax for any of it to fall under — not wages, not retirement income, not Social Security, not investment income. Federal tax still applies to all of those income types.",
    },
    {
      q: "What is Nevada's sales tax rate?",
      a: "Nevada's statewide sales-tax base rate is 6.85%, and local additions push the combined rate higher — 8.375% in Clark County. That is the trade-off behind the $0 income tax: a Nevada paycheck keeps more, but everyday purchases cost more in tax.",
    },
    {
      q: "How much do I save by living in Nevada instead of California?",
      a: `At $60,000 a single filer owes ${formatAmountOrUnavailable(EX_CA_60.annualState)} a year in California income tax and $0 in Nevada — a difference of ${formatAmountOrUnavailable(EX_CA_60.annualState)} a year before any other tax is considered. Federal tax is identical in both states for the same W-4.`,
    },
    {
      q: "Does moving to Nevada stop my old state's tax immediately?",
      a: "Your old state taxes only the income you earned while you were its resident, plus its-source income after you leave, so you file its part-year or nonresident return for that period and nothing for Nevada. If you leave Nevada for a state with an income tax, that state starts taxing your wages from the day you become its resident.",
    },
  ],
  "oregon-paycheck-calculator": [
    {
      q: "How much Oregon income tax will I pay on a $60,000 salary?",
      a: `A single filer earning $60,000 in wages owes ${formatAmountOrUnavailable(EX_OR_60.annualState)} a year in Oregon income tax after the ${formatUSD0(OR_SD_SINGLE)} standard deduction and the ${formatUSD0(OR_CREDIT_SINGLE)} personal exemption credit. The effective rate is ${effectiveRatePct(EX_OR_60.annualState, 60000)}% of gross pay.`,
    },
    {
      q: "What are Oregon's income tax rates in 2026?",
      a: "Oregon has four graduated rates: 4.75%, 6.75%, 8.75%, and 9.9%. The 8.75% rate starts at just $11,400 of taxable income, so most full-time workers are already in the second-highest bracket, and the 9.9% top rate starts at $125,000 of taxable income for a single filer.",
    },
    {
      q: "How do I fill out the Oregon OR-W-4?",
      a: "Pick a filing status and count allowances — yourself, a spouse filing jointly, and each dependent. Each allowance is a $263 credit subtracted from your annual Oregon tax after the rates are applied. Allowances are ignored entirely once wages pass $100,000 for single filers or $200,000 for married filers. File the form when you start a job and again whenever your situation changes.",
    },
    {
      q: "What happens if I never file an OR-W-4?",
      a: "Your employer must withhold a flat 8% of your wages. The federal W-4 redesigned for 2020 cannot be used for Oregon withholding, so an Oregon form — or an older Oregon-only or pre-2020 federal W-4 already on file — is required to avoid the flat 8% default.",
    },
    {
      q: "Why is my Oregon withholding different from the tax in this table?",
      a: "Because the two calculations subtract different federal figures. Oregon's withholding formula subtracts the federal income tax withheld from your pay — up to $8,750 in 2026 — before applying the rates. The annual liability subtracts your federal tax liability instead (2026 Publication OR-ESTIMATE, worksheet line 9, capped at $8,750), and the subtraction phases out above certain federal AGI levels. So the table already reflects a federal-tax subtraction; when the amount withheld during the year differs from your final federal liability, your withholding comes out higher or lower than the table by that gap. The table shows what you owe for the year, settled on your OR-40.",
    },
    {
      q: "What is the Oregon statewide transit tax, and is it in the calculator?",
      a: `No, it is not in the calculator. The statewide transit tax is 0.1% of wages — $1 per $1,000 — withheld from every Oregon paycheck, with no wage cap and no minimum. At $60,000 it is another ${formatUSD(0.001 * 60000)} a year; at $150,000 it is ${formatUSD(0.001 * 150000)}. A 2025 law would have doubled it to 0.2%, but voters rejected the increase (Measure 120, May 19, 2026 primary), so it stays at 0.1%.`,
    },
    {
      q: "What is Paid Leave Oregon, and how much does it cost me?",
      a: `Paid Leave Oregon is a 1% premium on subject wages up to $184,500 in 2026, split 60% employee and 40% employer — so the employee share is 0.6%. At $60,000 that is ${formatUSD(EX_OR_60.annualStateInsurance)} a year. Your employer may cover part of the employee share, so your stub can show less. It is a separate line from income tax.`,
    },
    {
      q: "Is there an Oregon Earned Income Credit?",
      a: "Yes. Oregon's Earned Income Credit is refundable, and a filer may reduce annual Oregon income tax by up to 14% of their federal EITC amount — 17% with a dependent child under age three — for tax years beginning in 2026, subject to eligibility. It can pay out even if you owe no Oregon tax.",
    },
    {
      q: "What is the Oregon Kids Credit?",
      a: "The Oregon Kids Credit is refundable, and a filer may reduce annual Oregon income tax by up to $1,050 per qualifying dependent child age five or younger, for up to five children, subject to eligibility. The full credit is available at modified adjusted gross income of $26,550 or less and phases out entirely at $31,550 — the most recently published figures.",
    },
    {
      q: "What is the Oregon kicker, and will I get one for 2026?",
      a: "The kicker is a refundable credit returning a General Fund surplus to taxpayers when collections exceed the forecast by more than 2% over a two-year budget cycle. The most recent kicker, claimed on the 2025 return, was 9.863% of each taxpayer's 2024 Oregon liability. The kicker only applies to odd-numbered tax years, so no kicker credit is available on the 2026 return.",
    },
    {
      q: "I live in Portland. What local taxes do I pay?",
      a: "Three. Multnomah County's Preschool for All tax is 1.5% on Oregon taxable income above $125,000 for single filers, rising to 3% above $250,000 — but your employer only has to withhold it once you earn $200,000 or more in the calendar year (1.5% above $200,000, 3% above $400,000); below $200,000 you can opt in to withholding. Metro's Supportive Housing Services tax is 1% above $128,000 for single filers in 2026, and employers with a Metro location must withhold 1% above $200,000 from employees working within Metro who earn $200,000 or more; below that you can opt in. The Portland Arts Tax is a flat $35 per year for residents age 18 or older earning at least $1,000, and it is the only one of the three that is never withheld.",
    },
    {
      q: "I live in Washington but work in Oregon. Do I pay Oregon tax?",
      a: "Yes. Oregon has no reciprocity agreement with Washington: a Washington resident working in Oregon owes Oregon tax on those wages, and an Oregon resident working in Washington still owes Oregon tax on all income as a resident.",
    },
    {
      q: "When is my Oregon return due, and which form do I file?",
      a: "Oregon returns are due April 15. Full-year residents file Form OR-40, part-year residents file Form OR-40-P, and nonresidents with Oregon-source income file Form OR-40-N. If you have income with no Oregon withholding, make quarterly estimated payments on Form OR-40-V.",
    },
  ],
  "washington-paycheck-calculator": [
    {
      q: "Does Washington have a state income tax?",
      a: "No. Washington does not currently have an individual income tax on wages. There is no Washington equivalent of Oregon's OR-W-4, and there is no state income-tax return to file on wages.",
    },
    {
      q: "What does a Washington paycheck look like at $60,000?",
      a: `A single filer earning $60,000 in Washington takes home ${formatUSD(EX_WA_60.annualNet)} a year. The Washington state income-tax line is $0. The state deductions are the two payroll programs: ${formatUSD(EX_WA_60.annualStateInsurance)} a year combined for Paid Family & Medical Leave and WA Cares.`,
    },
    {
      q: "What is PFML, and how much does it cost me?",
      a: `Paid Family & Medical Leave is a 1.13% premium on wages up to $184,500 in 2026, split 71.43% employee and 28.57% employer — so the maximum employee share is 0.8072%, at most ${formatUSD(0.008072 * 184500)} a year. Your employer may cover part of the employee share, so your stub can show less.`,
    },
    {
      q: "What is WA Cares, and how much does it cost me?",
      a: `WA Cares is Washington's long-term care program: 0.58% of gross wages, with no wage ceiling, and 100% employee-paid. At $60,000 it is ${formatUSD(0.0058 * 60000)} a year, and unlike PFML it never stops — it keeps growing with pay.`,
    },
    {
      q: "Is there a Washington withholding form to fill out?",
      a: "No. There is no Washington income-tax withholding form. A Washington worker fills in only the federal Form W-4.",
    },
    {
      q: "Does Washington's 7% capital-gains tax affect my paycheck?",
      a: "No. The capital-gains tax applies only to long-term capital gains above a standard deduction that the Department adjusts annually for inflation ($278,000 for tax year 2025), with a second tier of 9.9% on taxable gains above $1 million from tax year 2025. Salary, bonuses, and hourly pay are outside the tax entirely, no employer withholds it, and only individuals who owe the tax file a capital-gains return.",
    },
    {
      q: "What is the Working Families Tax Credit?",
      a: "The Washington Working Families Tax Credit is a refund of retail sales or use tax for low-to-moderate-income residents, modelled on the federal Earned Income Tax Credit. For tax year 2025 it pays up to $1,330, with a minimum refund of $50. You must have lived in Washington for at least 183 days of the tax year, filed a federal return, and qualified for the federal EITC — or qualified except for filing with an ITIN. From calendar year 2026, renters may receive an additional $300.",
    },
    {
      q: "How do I claim the Working Families Tax Credit if Washington has no tax return?",
      a: "Through a separate application to the Department of Revenue — online through My DOR or on paper — not on any tax return. Applications for tax year 2025 opened February 1, 2026. It is a refund, not a paycheck item: nothing about it changes your withholding.",
    },
    {
      q: "I live in Washington but work in Oregon. Do I pay Oregon tax?",
      a: "Yes. Oregon has no reciprocity agreement with Washington, so a Washington resident working in Oregon owes Oregon tax on those wages. An Oregon line can appear on your pay stub even though your Washington state income-tax line is $0.",
    },
    {
      q: "Does Washington have a local income tax?",
      a: "No. No Washington city or county levies an income tax on wages, so there is no local line to add to the table above.",
    },
    {
      q: "How much do I save by living in Washington instead of Oregon?",
      a: `At $60,000 a single filer owes ${formatAmountOrUnavailable(EX_OR_60.annualState)} a year in Oregon income tax and $0 in Washington — though Washington's PFML and WA Cares programs still cost ${formatUSD(EX_WA_60.annualStateInsurance)} a year at that pay, far less than Oregon's income tax. Federal tax is identical in both states for the same W-4.`,
    },
    {
      q: "Will Washington start taxing income in 2028?",
      a: "Washington enacted a 9.9% tax on individual income above $1 million (ESSB 6346, signed March 30, 2026), effective January 1, 2028. It does not touch a 2026 paycheck, and it does not change the $0 state-tax line on this page.",
    },
  ],
  "alaska-paycheck-calculator": [
    {
      q: "Does Alaska have a state income tax?",
      a: "No. Alaska levies no personal income tax on wages, and no Alaska state income-tax return exists for an employee to file.",
    },
    {
      q: "What does an Alaska paycheck look like at $60,000?",
      a: `A single filer earning $60,000 in Alaska takes home ${formatUSD(EX_AK_60.annualNet)} a year. The federal deductions are ${formatUSD(EX_AK_60.annualFederal)} federal income tax, ${formatUSD(EX_AK_60.annualSocialSecurity)} Social Security, and ${formatUSD(EX_AK_60.annualMedicare)} Medicare. The Alaska state income-tax line is $0 — but your stub also carries the Alaska unemployment-insurance contribution: 0.50% of wages up to the $54,200 wage base, which is $271 a year at $60,000.`,
    },
    {
      q: "Is there an Alaska withholding form to fill out?",
      a: "No. There is no Alaska equivalent of Arizona's A-4 or Oregon's OR-W-4. An Alaska worker fills in only the federal Form W-4, and there is no state withholding form to get wrong.",
    },
    {
      q: "Do I need to file an Alaska state tax return?",
      a: "No, not on your wages. Alaska has no personal income tax, so there is no state return for an employee to file. You still file a federal return with the IRS.",
    },
    {
      q: "Why is there no state income-tax line on my Alaska pay stub?",
      a: "Because no state income tax is withheld. Alaska has no state income tax to withhold, so there is no income-tax line for it. Your stub shows the federal deductions — federal income tax, Social Security, and Medicare — plus one state line: the Alaska unemployment-insurance contribution, 0.50% of wages up to the $54,200 taxable wage base in 2026, at most $271 a year.",
    },
    {
      q: "What is the Permanent Fund Dividend, and is it wages?",
      a: "The Permanent Fund Dividend — the PFD — is an annual payment to every qualifying Alaska resident from oil wealth, including children. The 2025 dividend was $1,000 per person. It is not wages and never appears on your pay stub: it is not subject to Social Security or Medicare, and your employer has nothing to do with it. It is federally taxable as ordinary income, reported on Schedule 1 (Form 1040) line 8g.",
    },
    {
      q: "How do I apply for the Permanent Fund Dividend?",
      a: "Apply every year from January 1 through March 31 at pfd.alaska.gov, using a myAlaska account. There is no grace period for a late application. Payments begin in early October.",
    },
    {
      q: "Does Alaska have a sales tax?",
      a: "Alaska has no statewide sales tax — the only state that also skips it. But local governments can, and many do, levy their own sales taxes: cities and boroughs set their own rates, so the tax on a purchase depends on where you buy. Anchorage has no local sales tax; many smaller communities do. There is no local income tax on wages anywhere in the state.",
    },
    {
      q: "How does Alaska pay for state government without an income tax?",
      a: "Alaska funds state government largely from oil and natural resource revenue, which is what makes the $0 state income tax possible — and the PFD possible too.",
    },
    {
      q: "I live in Alaska but work in another state. Do I pay that state's tax?",
      a: "Yes, on the wages you earn there. Alaska's $0 rate only covers Alaska: the state where you earn the wages can tax them, and a state line can appear on your pay stub.",
    },
    {
      q: "How much do I save by living in Alaska instead of California?",
      a: `At $60,000 a single filer owes ${formatAmountOrUnavailable(EX_CA_60.annualState)} a year in California income tax and $0 in Alaska — a difference of ${formatAmountOrUnavailable(EX_CA_60.annualState)} a year before any other tax is considered. Federal tax is identical in both states for the same W-4.`,
    },
  ],
  "hawaii-paycheck-calculator": [
    {
      q: "How much Hawaii income tax will I pay on a $60,000 salary?",
      a: `A single filer earning $60,000 in wages owes ${formatAmountOrUnavailable(EX_HI_60.annualState)} a year in Hawaii income tax after the ${formatUSD0(8000)} standard deduction and the ${formatUSD0(1144)} personal exemption. The effective rate is ${effectiveRatePct(EX_HI_60.annualState, 60000)}% of gross pay.`,
    },
    {
      q: "What are Hawaii's income tax rates in 2026?",
      a: "Hawaii has twelve graduated rates from 1.4% to 11% — the most brackets of any state on this page, and the top rate of 11% is the highest in the country. The 2026 brackets are unchanged from 2025: the top rate still starts at $325,000 of taxable income for a single filer.",
    },
    {
      q: "How do I fill out the Hawaii HW-4?",
      a: "Count allowances — yourself, a spouse filing jointly, and each dependent — and each allowance reduces your annualized taxable wages by $1,144, the same as the personal exemption. Hawaii's withholding formula then uses the number of allowances and your pay frequency to compute the amount withheld each period. If you want more withheld than the formula produces, write an additional flat amount on the form.",
    },
    {
      q: "Can I claim exempt from Hawaii withholding?",
      a: "No. Hawaii law does not permit an employee to claim exemption from Hawaii withholding, even if you expect to owe no tax for the year. The HW-4 has no exemption box — unlike the federal W-4 and most other states' forms.",
    },
    {
      q: "Why might I owe Hawaii tax at year end even though tax was withheld?",
      a: "Hawaii's withholding tables cap at 7.9% for high wages and do not include the 8.25%\u201311% brackets, so a high earner's paycheck withholding can fall short of the annual liability. If you earn into the top brackets, expect a balance due on your N-11 — and consider extra withholding on the HW-4 or estimated payments.",
    },
    {
      q: "What is Hawaii's standard deduction for 2026?",
      a: `Under Act 46, the 2026 standard deduction is ${formatUSD0(8000)} for single filers, ${formatUSD0(16000)} for joint filers, and ${formatUSD0(12000)} for head of household — up sharply from the 2025 amounts of ${formatUSD0(4400)}, ${formatUSD0(8800)}, and ${formatUSD0(6424)}. The 2026 brackets are unchanged from 2025, but the larger deduction moves the threshold where tax starts upward for everyone.`,
    },
    {
      q: "What is Temporary Disability Insurance, and how much does it cost me?",
      a: `Hawaii requires Temporary Disability Insurance (TDI), which pays a wage-replacement benefit when a worker is temporarily unable to work because of illness or injury. The employee share is 0.5% of wages, capped at $7.50 per week — at most ${formatUSD(7.5 * 52)} a year. At $60,000 it is ${formatUSD(EX_HI_60.annualStateInsurance)}. The employer may pay part of the employee share, so your stub can show less.`,
    },
    {
      q: "Is there a food and excise tax credit in Hawaii?",
      a: "Yes. The Food and Excise Tax Credit is refundable, claimed on Form N-311. A filer may reduce annual Hawaii income tax by up to $220 per exemption, with the amount scaled down at higher incomes, subject to eligibility. Federal adjusted gross income must be under $40,000 for single filers and under $60,000 for other filing statuses, and the credit must be claimed within 12 months of the close of the tax year.",
    },
    {
      q: "Is there a renters credit in Hawaii?",
      a: "Yes. The Low-Income Household Renters Credit is refundable, for renters with federal adjusted gross income under $30,000 who paid more than $1,000 in rent during the year. A filer may reduce annual Hawaii income tax by up to $50 per exemption, subject to eligibility.",
    },
    {
      q: "Does Hawaii tax Social Security benefits?",
      a: "No. Social Security benefits are not taxed in Hawaii.",
    },
    {
      q: "Does Hawaii have a local income tax?",
      a: "No. No Hawaii county levies an income tax on wages, so the state rate is the only income tax on a Hawaii pay stub. Hawaii's general excise tax — often mistaken for a sales tax — is a tax on businesses, not on wages, and never appears on a pay stub.",
    },
    {
      q: "When is my Hawaii return due, and which form do I file?",
      a: "Hawaii returns are due April 20 — five days later than the federal deadline — and a six-month extension runs to October 20. Full-year residents file Form N-11; part-year residents and nonresidents with Hawaii-source income file Form N-15. File electronically through Hawaii Tax Online at hitax.hawaii.gov. If you have income with no Hawaii withholding, make quarterly estimated payments on Form N-200V.",
    },
  ],
  "district-of-columbia-paycheck-calculator": [
    {
      q: "How much DC income tax will I pay on a $60,000 salary?",
      a: `A single filer earning $60,000 in wages owes ${formatAmountOrUnavailable(EX_DC_60.annualState)} a year in District income tax after the ${formatUSD0(DC_SD_SINGLE)} standard deduction. The effective rate is ${effectiveRatePct(EX_DC_60.annualState, 60000)}% of gross pay.`,
    },
    {
      q: "What are DC's income tax rates in 2026?",
      a: "The District has seven graduated rates from 4% to 10.75%. The rates are the same for every filing status — only the standard deduction changes. The 8.5% rate already applies above $60,000 of taxable income, and the top rate of 10.75% starts at $1,000,000.",
    },
    {
      q: "I live in Maryland or Virginia and work in DC. Do I pay DC tax?",
      a: "No. The Home Rule Act bars the District from taxing the personal income of nonresidents, so DC taxes no nonresident's wages — not just Maryland and Virginia residents, but the residents of any state who commute into the District. File Form D-4A with your employer to certify your nonresidence, and your employer stops withholding DC income tax. Your home state taxes those wages instead.",
    },
    {
      q: "How do I fill out the DC D-4 withholding form?",
      a: "The D-4 is the DC Withholding Allowance Certificate for residents. The Office of Tax and Revenue no longer publishes withholding tables — employers apply the DC rate schedule and use the federal allowance amount ($4,300 per allowance in 2026, from IRS Publication 15-T) to compute withholding. If you file no D-4, your employer must withhold as if you claimed zero allowances as a single filer.",
    },
    {
      q: "What is Form D-4A, and who files it?",
      a: "Form D-4A is the Certificate of Nonresidence in the District of Columbia. File it with your employer to certify that you maintain your permanent residence outside the District and do not reside in the District for 183 days or more. Once it is on file, your employer stops withholding DC income tax from your pay. A DC resident working in Maryland files the Virginia or Maryland equivalent to stop that state from withholding on the same wages.",
    },
    {
      q: "DC tax was withheld from my pay by mistake. How do I get it back?",
      a: "You do not file a DC return to get it back. File Form D-40B, a request for a refund of DC income tax withheld in error, with the Office of Tax and Revenue.",
    },
    {
      q: "Is there a DC Earned Income Tax Credit?",
      a: "Yes. The District Earned Income Tax Credit is refundable, matching a percentage of the federal Earned Income Tax Credit. The Office of Tax and Revenue announced 85% for tax years 2025 through 2028, with a planned increase to 100% postponed to after December 31, 2028 — but because a 2025 D-40 form line showed a different figure, no percentage is stated here. Check the current D-40 instructions before claiming it. DC also offers monthly payments of the credit for refunds of $1,200 or more.",
    },
    {
      q: "What is Schedule H, and who can claim it?",
      a: "Schedule H is the Homeowner and Renter Property Tax Credit: a refundable credit of up to $1,425 for DC residents who own or rent a home in the District and meet the income limits, claimed on Schedule H with Form D-40. It offsets property tax, not income tax, and it is refundable.",
    },
    {
      q: "Is there a child care credit in DC?",
      a: "Yes. The Keep Child Care Affordable Tax Credit is refundable, and a filer may reduce annual DC income tax by up to $1,200 per eligible child for licensed child care costs, subject to eligibility.",
    },
    {
      q: "Does DC have a local or county income tax?",
      a: "No. There are no counties in the District, so there is no local income tax on top of the District rate. The DC rate in the table above is the only income tax on a DC pay stub.",
    },
    {
      q: "When is my DC return due, and which form do I file?",
      a: "DC residents file Form D-40, due April 15, electronically through MyTax.DC.gov. A nonresident's form depends on the income: DC wages only, or DC tax withheld in error, means Form D-40B, a Nonresident Request for Refund — not a D-40. DC rental only with gross of $12,000 or less means no D-40 and no D-30 tax — the business files the D-30N affidavit instead. Gross over $12,000 means the business files Form D-30, the Unincorporated Business Franchise Return, at 8.25%. Whether the individual also files a D-40 on rental income is a narrow question under DC Code §47-1805.02(1) (headed 'Residents and nonresidents', as amended December 2025) — check the current D-40 instructions. A personal capital gain on DC real estate is not DC individual-income-taxable. If you have income with no DC withholding, make quarterly estimated payments on Form D-40ES.",
    },
    {
      q: "How does DC compare with California at the same salary?",
      a: `A single filer earning $60,000 owes ${formatAmountOrUnavailable(EX_DC_60.annualState)} a year in DC income tax, versus ${formatAmountOrUnavailable(EX_CA_60.annualState)} in California and ${formatAmountOrUnavailable(EX_NY_60.annualState)} in New York State (before New York City tax). DC is the most expensive of the three at this pay.`,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* SOURCES                                                             */
/* ------------------------------------------------------------------ */

export const BATCH_SOURCES: Record<string, { label: string; url: string }[]> = {
  "arizona-paycheck-calculator": [
    { label: "Arizona Department of Revenue — Arizona Withholding Percentage Election (Form A-4)", url: "https://azdor.gov/forms/withholding-forms/arizona-withholding-percentage-election" },
    { label: "Arizona Department of Revenue — Form A-4 (2026) PDF", url: "https://azdor.gov/sites/default/files/document/FORMS_WITHHOLDING_2026_A-4_f.pdf" },
    { label: "Arizona Department of Revenue", url: "https://azdor.gov/" },
  ],
  "new-mexico-paycheck-calculator": [
    { label: "New Mexico Taxation and Revenue Department — Personal Income Tax Information Overview", url: "https://www.tax.newmexico.gov/individuals/personal-income-tax-information-overview/" },
    { label: "New Mexico Taxpayer Access Point (TAP)", url: "https://tap.state.nm.us/TAP/_/" },
    { label: "New Mexico Taxation and Revenue Department", url: "https://www.tax.newmexico.gov/" },
  ],
  "nevada-paycheck-calculator": [
    { label: "Nevada Department of Taxation — Income Tax in Nevada", url: "https://tax.nv.gov/about-nevada-department-of-taxation/income-tax-in-nevada/" },
    { label: "Nevada Department of Taxation — Modified Business Tax", url: "https://tax.nv.gov/tax-types/modified-business-tax/" },
    { label: "Nevada Department of Taxation", url: "https://tax.nv.gov/" },
  ],
  "oregon-paycheck-calculator": [
    { label: "Oregon Department of Revenue — Statewide Transit Tax", url: "https://www.oregon.gov/dor/programs/businesses/pages/statewide-transit-tax.aspx" },
    { label: "City of Portland Revenue Division — Withholding (SHS / Preschool for All)", url: "https://www.portland.gov/revenue/withholding" },
    { label: "Oregon Department of Revenue", url: "https://www.oregon.gov/dor/" },
    { label: "Paid Leave Oregon — Employee Overview", url: "https://paidleave.oregon.gov/employees/overview.html" },
  ],
  "washington-paycheck-calculator": [
    { label: "Washington Department of Revenue — Capital Gains Tax", url: "https://dor.wa.gov/taxes-rates/other-taxes/capital-gains-tax" },
    { label: "Washington Working Families Tax Credit — Apply", url: "https://workingfamiliescredit.wa.gov/apply" },
    { label: "Washington Paid Family & Medical Leave — Employer Roles and Responsibilities", url: "https://paidleave.wa.gov/employer-roles-responsibilities/" },
    { label: "Washington Department of Revenue", url: "https://dor.wa.gov/" },
  ],
  "alaska-paycheck-calculator": [
    { label: "Alaska DOL&WD — 2026 Unemployment Insurance Tax Rates (employee rate 0.50%, taxable wage base $54,200)", url: "https://labor.alaska.gov/estax/2026-experience-rates.html" },
    { label: "Alaska Permanent Fund Dividend Division", url: "https://pfd.alaska.gov/" },
    { label: "Alaska Department of Revenue — Tax Division", url: "https://tax.alaska.gov/" },
  ],
  "hawaii-paycheck-calculator": [
    { label: "Hawaii Department of Taxation", url: "https://tax.hawaii.gov/" },
    { label: "Hawaii Tax Online", url: "https://hitax.hawaii.gov/" },
    { label: "Hawaii Department of Labor and Industrial Relations — Disability Compensation Division", url: "https://labor.hawaii.gov/dcd/" },
  ],
  "district-of-columbia-paycheck-calculator": [
    { label: "DC Office of Tax and Revenue — DC Individual and Fiduciary Income Tax Rates", url: "https://otr.cfo.dc.gov/page/dc-individual-and-fiduciary-income-tax-rates" },
    { label: "DC Office of Tax and Revenue — Collections & Audit FAQs (Form D-30 rental filing, $12,000 threshold)", url: "https://otr.cfo.dc.gov/page/collections-audit-faqs" },
    { label: "MyTax.DC.gov — DC Online Tax Portal", url: "https://mytax.dc.gov/" },
    { label: "DC Office of Tax and Revenue", url: "https://otr.cfo.dc.gov/" },
  ],
};

/* ------------------------------------------------------------------ */
/* DISPATCHER                                                          */
/* ------------------------------------------------------------------ */

export function BatchContent({ slug }: { slug: string }) {
  switch (slug) {
    case "arizona-paycheck-calculator":
      return <ArizonaContent />;
    case "new-mexico-paycheck-calculator":
      return <NewMexicoContent />;
    case "nevada-paycheck-calculator":
      return <NevadaContent />;
    case "oregon-paycheck-calculator":
      return <OregonContent />;
    case "washington-paycheck-calculator":
      return <WashingtonContent />;
    case "alaska-paycheck-calculator":
      return <AlaskaContent />;
    case "hawaii-paycheck-calculator":
      return <HawaiiContent />;
    case "district-of-columbia-paycheck-calculator":
      return <DistrictOfColumbiaContent />;
    default:
      return null;
  }
}
