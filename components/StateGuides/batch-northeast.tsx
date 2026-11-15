/**
 * PaycheckBeam — Northeast batch: Maine, Vermont, New Hampshire,
 * Massachusetts, Rhode Island, Connecticut, New Jersey, Pennsylvania.
 *
 * Researched 2026-11-15 from opened official pages (see
 * ~/workspace/paycheckbeam-research/state-guides-northeast.md).
 * Every worked-example figure is generated at render time from the
 * shared engine via examplePaycheck() — never a hardcoded string.
 * No state in this batch carries "Partial calculation" rows:
 * Connecticut's full Tax Calculation Schedule (Table A exemption
 * phaseout + Table E personal credit + Table C add-back + Table D
 * recapture) is modelled in the calculator, so every Connecticut row
 * is the complete schedule result and matches the tool.
 * Maine's standard deduction was corrected to the MRS 2026 figure
 * ($15,700 single / $31,400 joint) in lib/stateTaxData.ts, so the
 * Maine rows now match the calculator with no flags.
 */
import type { FaqItem } from "@/components/FaqAccordion";
import { applyBrackets, formatUSD, formatUSD0 } from "@/lib/paycheckCalc";
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
} from "./shared";

export const BATCH_SLUGS: string[] = [
  "maine-paycheck-calculator",
  "vermont-paycheck-calculator",
  "new-hampshire-paycheck-calculator",
  "massachusetts-paycheck-calculator",
  "rhode-island-paycheck-calculator",
  "connecticut-paycheck-calculator",
  "new-jersey-paycheck-calculator",
  "pennsylvania-paycheck-calculator",
];

/**
 * Full taxable income for a wages-only single filer in states that have
 * a personal exemption on top of the standard deduction (Maine, Vermont,
 * Rhode Island): gross minus standard deduction minus exemption. The
 * shared stateTaxableIncome() subtracts the standard deduction only,
 * so it would overstate the taxable base for these three states.
 */
function taxableIncomeFull(slug: string, gross: number): number {
  const state = getStateBySlug(slug);
  const sd = state?.standardDeductionSingle ?? 0;
  const ex = state?.exemptionSingle ?? 0;
  return Math.max(0, gross - sd - ex);
}

/** Bracket walk on the full taxable base (states with an exemption). */
function bracketDetailFull(
  slug: string,
  gross: number,
  taxableOverride?: number,
): string {
  const state = getStateBySlug(slug);
  const brackets = state?.brackets ?? [];
  const taxable = taxableOverride ?? taxableIncomeFull(slug, gross);
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

/* ------------------------------------------------------------------ */
/* Shared example results reused by prose and FAQs — no engine-derived */
/* figure is ever a literal string. Computed once at module load.      */
/* ------------------------------------------------------------------ */

const EX_ME_60 = examplePaycheck("maine-paycheck-calculator", 60000);
const EX_ME_150 = examplePaycheck("maine-paycheck-calculator", 150000);
const EX_VT_60 = examplePaycheck("vermont-paycheck-calculator", 60000);
const EX_VT_150 = examplePaycheck("vermont-paycheck-calculator", 150000);
const EX_NH_60 = examplePaycheck("new-hampshire-paycheck-calculator", 60000);
const EX_NH_75 = examplePaycheck("new-hampshire-paycheck-calculator", 75000);
const EX_CA_60 = examplePaycheck("california-paycheck-calculator", 60000);
const EX_NY_60 = examplePaycheck("new-york-paycheck-calculator", 60000, "none");
const EX_MA_60 = examplePaycheck("massachusetts-paycheck-calculator", 60000);
const EX_MA_150 = examplePaycheck("massachusetts-paycheck-calculator", 150000);
const EX_RI_60 = examplePaycheck("rhode-island-paycheck-calculator", 60000);
const EX_RI_150 = examplePaycheck("rhode-island-paycheck-calculator", 150000);
const EX_CT_60 = examplePaycheck("connecticut-paycheck-calculator", 60000);
const EX_CT_150 = examplePaycheck("connecticut-paycheck-calculator", 150000);
const EX_NJ_60 = examplePaycheck("new-jersey-paycheck-calculator", 60000);
const EX_NJ_150 = examplePaycheck("new-jersey-paycheck-calculator", 150000);
const EX_PA_60 = examplePaycheck("pennsylvania-paycheck-calculator", 60000);
const EX_PA_150 = examplePaycheck("pennsylvania-paycheck-calculator", 150000);

/** Connecticut credit-corrected liability: bracket tax plus the Table C
 *  2% phase-out add-back, reduced by the Table E personal-tax-credit
 *  decimal for a single filer at that AGI (2026 CT Tax Calculation
 *  Schedule: Table A exemption phaseout + Table E personal credit +
 *  Table C add-back + Table D recapture). Table C adds $25 per $5,000
 *  (or part) of Connecticut AGI above $56,500 for a single filer, up
 *  to $250 — so $25 at $60,000 and $0 at $30,000. The $15,000 personal
 *  exemption phases out above $30,000 of Connecticut AGI — reduced by
 *  $1,000 for each $1,000 (or part) over that line, reaching $0 only
 *  above $44,000 ($1,000 remains at exactly $44,000) — so the bracket
 *  tax is computed on the phased-out taxable income, not on gross
 *  minus the full $15,000. This helper covers Tables A, C, and E only:
 *  it omits the Table D recapture, so use it only below the $105,000
 *  recapture threshold (the $30,000 and $60,000 rows); for $150,000
 *  use the engine figure (examplePaycheck), which includes recapture. */
function ctTableCAddBack(gross: number): number {
  if (gross <= 56500) return 0;
  return Math.min(250, Math.ceil((gross - 56500) / 5000) * 25);
}

function ctCorrectedTax(gross: number, creditDecimal: number): number {
  const state = getStateBySlug("connecticut-paycheck-calculator");
  const over = Math.max(0, gross - 30000);
  const exemption = Math.max(0, 15000 - Math.ceil(over / 1000) * 1000);
  const taxable = Math.max(0, gross - exemption);
  const bracketTax = state?.brackets
    ? applyBrackets(taxable, state.brackets)
    : 0;
  return (bracketTax + ctTableCAddBack(gross)) * (1 - creditDecimal);
}

/* ------------------------------------------------------------------ */
/* MAINE                                                               */
/* ------------------------------------------------------------------ */

function MaineContent() {
  const slug = "maine-paycheck-calculator";
  const state = getStateBySlug(slug);
  const brackets = state?.brackets ?? [];
  const rows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(slug, gross);
    return [
      formatUSD0(gross),
      formatUSD0(taxableIncomeFull(slug, gross)),
      formatAmountOrUnavailable(r.annualState),
      formatUSD(r.annualNet),
    ];
  });
  const me60 = examplePaycheck(slug, 60000);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          What Maine tax looks like at real salaries
        </SectionTitle>
        <Para>
          Maine taxes wages in three brackets — 5.8%, 6.75%, then 7.15% —
          after the standard deduction and the $5,300 personal exemption.
          The rows below are what the calculator on this page produces,
          using the 2026 standard deduction of $15,700 for single filers
          ($31,400 joint) from Maine Revenue Services&apos; revised
          August 2026 withholding tables.
        </Para>
        <WorkedTable
          caption="Maine income tax, single filer, 2026"
          headers={["Gross wages", "ME taxable income", "ME income tax", "Take-home pay"]}
          rows={rows}
          footnote={`At $60,000 the effective ME income-tax rate is ${effectiveRatePct(me60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(EX_ME_150.annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          The $60,000 row in detail: taxable income is{" "}
          {formatUSD0(60000 - 15700 - 5300)};{" "}
          {bracketDetailFull(slug, 60000, 60000 - 15700 - 5300)}; total{" "}
          {formatAmountOrUnavailable(me60.annualState)}. That walk uses
          the $15,700 standard deduction and the $5,300 exemption — the
          same base as the table row above. The bracket tops are{" "}
          {formatUSD0(brackets[0]?.upTo ?? 0)} and{" "}
          {formatUSD0(brackets[1]?.upTo ?? 0)} for single filers.
        </Para>
        <NoteBox tone="blue">
          <strong>Maine&apos;s 2% surcharge is not in these rows.</strong>{" "}
          For tax years beginning on or after January 1, 2026, Maine adds
          a 2% surcharge on the portion of Maine taxable income over
          $1,000,000 for single filers ($1,500,000 joint). It does not
          touch any salary in the table above.
        </NoteBox>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in Maine Revenue Services&apos; own terms</Eyebrow>
        <SectionTitle>
          Three rates, a big standard deduction, and an exemption on top
        </SectionTitle>
        <Para>
          Maine starts from federal adjusted gross income, then subtracts
          the Maine standard deduction and the Maine personal exemption
          before the rates apply. For 2026 the basic standard deduction is
          $15,700 for single filers and married persons filing separately,
          $23,550 for heads of household, and $31,400 for married couples
          filing jointly — plus an additional amount for age and blindness
          equal to the federal additional standard deduction. The personal
          exemption is $5,300 per person ($10,600 joint). Both the standard
          deduction and the exemption phase out at higher incomes: the
          standard deduction phases out for single filers with Maine income
          over $102,250 ($204,550 joint).
        </Para>
        <Para>
          The rates themselves are 5.8% on the first dollars of taxable
          income, 6.75% in the middle, and 7.15% above that. Maine has no
          local income tax — no town or county adds a wage tax on top of
          the state rate — so the state line is the only income-tax line
          on a Maine pay stub besides the federal one.
        </Para>
        <Para>
          Maine does not conform to the federal itemized-deduction rules
          in full, and it does not let you reduce Maine withholding with
          federal Form W-4 Step 4(b) deduction amounts: Maine does not
          conform to the federal deductions that may be used to reduce
          federal withholding. If you itemize federally, check the Maine
          rules separately before assuming the same deductions work on
          your 1040ME.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form W-4ME"
        title="Maine has its own withholding certificate — the W-4ME"
        summary="One allowance is worth $5,300 a year, and the withholding standard deduction is smaller than the return one. The full how-to is inside."
      >
        <Para>
          Give your employer a completed Form W-4ME, Employee&apos;s Maine
          Withholding Allowance Certificate, so Maine tax is withheld
          correctly. Maine no longer takes allowances from the federal
          Form W-4 — you file both forms on the same day, and the W-4ME
          is the one that sets your Maine withholding. Claim one allowance
          for yourself, one for a spouse who is not claiming their own,
          and one for each dependent. Each allowance is worth $5,300 of
          annualized wages for withholding purposes.
        </Para>
        <Para>
          The withholding calculation uses its own standard deduction,
          smaller than the one on your return: $12,850 for a single
          employee or $28,550 for a married employee, phasing out to $0
          once annualized wages reach $177,250 single ($354,550 married).
          That is why the tax withheld from a paycheck can look different
          from the tax on your return even when both are right — the
          withholding tables and the return use different deduction
          amounts, and the return settles the difference. If you do not
          give your employer a W-4ME, Maine law requires withholding at
          the highest rate — single with zero allowances. You can also ask
          for an extra dollar amount withheld on the form to cover side
          income, and a married employee whose spouse works can ask to be
          withheld at the higher single rate.
        </Para>
      </ExpandableSection>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Payroll programs · what else is on the stub</Eyebrow>
        <SectionTitle>
          Maine Paid Family and Medical Leave is not in this calculator
        </SectionTitle>
        <Para>
          Maine runs a Paid Family and Medical Leave program, funded by a
          payroll contribution on wages. The calculator on this page does
          not model that contribution, so if your employer withholds a
          PFML share it appears as a separate line on your pay stub and
          your take-home pay here will read slightly high. Check your stub
          for a PFML or paid-leave line and subtract it from the
          take-home figure above.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Credits · return-only"
        title="The Maine credits claimed on your return"
        summary="Refundable EITC and the Property Tax Fairness Credit. Claimed on Form 1040ME; this calculator does not automatically adjust withholding for them."
      >
        <Para>
          <strong className="text-slate-900">Earned Income Tax Credit
          (refundable):</strong> Maine&apos;s credit is a percentage of
          your federal earned income credit — 25% if you have at least one
          qualifying child, and 50% if you have none. It is refundable,
          so it can come back as a refund even if it exceeds your Maine
          tax. A filer who qualifies may reduce annual Maine income tax by
          up to 25% of their federal EITC with a qualifying child, or up to
          50% without one, subject to eligibility, available tax liability,
          and phaseout.
        </Para>
        <Para>
          <strong className="text-slate-900">Property Tax Fairness Credit
          (refundable):</strong> for Maine residents whose property tax or
          rent on a Maine principal residence is high relative to income.
          For taxpayers age 65 or older the maximum credit is $2,000. It
          is claimed on Schedule PTFC/STFC with Form 1040ME. The Sales Tax
          Fairness Credit is claimed on the same schedule.
        </Para>
        <Para>
          <strong className="text-slate-900">Dependent exemption tax
          credit (refundable):</strong> Maine allows a refundable credit
          for each dependent for whom you can claim the federal personal
          exemption, adjusted for inflation and subject to phaseout. Like
          the credits above it is claimed on the annual return, not on
          your paycheck — none of these credits lower the withholding on
          your stub.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form 1040ME, estimated payments, and nonresidents"
        summary="Which return to file, the April 15, 2027 deadline, and when estimates are due — the detail is inside."
      >
        <Para>
          Full-year residents file Form 1040ME, due April 15, 2027 for the
          2026 tax year. Nonresidents with a Maine income tax liability
          file Form 1040ME with Schedule NR, and are taxed at the same
          graduated rates but only on Maine-source income. If you want a
          refund of Maine tax withheld from your pay, you file even if you
          would not otherwise have to.
        </Para>
        <Para>
          If your Maine tax will not be covered by withholding — freelance
          work, rental income, or investment income, for example — make
          estimated payments on Form 1040ES-ME in four quarterly
          installments, due April 15, June 15, and September 15, 2026, and
          January 15, 2027. You can pay through the Maine Tax Portal. If
          you sell Maine real property as a nonresident, the buyer must
          generally withhold 2.5% of the sale price at closing when the
          price is $100,000 or more — that withholding is an estimated
          payment toward the tax on the gain, not a separate tax.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* VERMONT                                                             */
/* ------------------------------------------------------------------ */

function VermontContent() {
  const slug = "vermont-paycheck-calculator";
  const state = getStateBySlug(slug);
  const brackets = state?.brackets ?? [];
  const rows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(slug, gross);
    return [
      formatUSD0(gross),
      formatUSD0(taxableIncomeFull(slug, gross)),
      formatAmountOrUnavailable(r.annualState),
      formatUSD(r.annualNet),
    ];
  });
  const vt60 = examplePaycheck(slug, 60000);
  const vt150 = examplePaycheck(slug, 150000);
  const vtTaxable60 = taxableIncomeFull(slug, 60000);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          What Vermont tax looks like at real salaries
        </SectionTitle>
        <Para>
          Vermont taxes wages in four brackets — 3.35%, 6.6%, 7.6%, then
          8.75% — after the $7,650 standard deduction and the $5,300
          personal exemption. The lowest bracket is one of the lowest
          starting rates in the country, but the second bracket starts
          early, so most full-time earners pay 6.6% on the marginal dollar.
        </Para>
        <NoteBox tone="blue">
          <strong>How to read this table:</strong> the income-tax column
          is your <strong>annual state liability estimate</strong> — what
          you owe for the year, settled on your tax return. It does not
          include the Child Care Contribution, which is a separate payroll
          item described below.
        </NoteBox>
        <WorkedTable
          caption="Vermont income tax, single filer, 2026"
          headers={["Gross wages", "VT taxable income", "VT income tax", "Take-home pay"]}
          rows={rows}
          footnote={`At $60,000 the effective VT income-tax rate is ${effectiveRatePct(vt60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(vt150.annualState, 150000)}% — the rate rises with pay because the brackets are graduated. Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          The $60,000 row in detail: taxable income is{" "}
          {formatUSD0(vtTaxable60)}; {bracketDetailFull(slug, 60000)};
          total {formatUSD(applyBrackets(vtTaxable60, brackets))}. At
          $150,000 of gross wages the same walk reaches the 7.6% bracket.
          The bracket tops are {formatUSD0(brackets[0]?.upTo ?? 0)},{" "}
          {formatUSD0(brackets[1]?.upTo ?? 0)} and{" "}
          {formatUSD0(brackets[2]?.upTo ?? 0)} for single filers; married
          filing jointly uses wider thresholds.
        </Para>
        <NoteBox tone="amber">
          <strong>One rule these rows do not model:</strong> if your
          federal AGI exceeds $150,000, Vermont charges the greater of
          your state income tax or 3% of federal AGI. At the salaries in
          this table that floor does not bite — the $150,000 row has
          federal AGI of $150,000, not over it — but above that income the
          real liability can be higher than the bracket walk alone.
        </NoteBox>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department of Taxes&apos; own terms</Eyebrow>
        <SectionTitle>
          Vermont starts from your federal return — then adds its own layers
        </SectionTitle>
        <Para>
          To file a Vermont return you start with adjusted gross income and
          taxable income from your federal return, then apply Vermont&apos;s
          own standard deduction, exemptions, and credits on Form IN-111.
          Vermont has no local income tax — no town adds a wage tax — so
          the state line is the only income-tax line on a Vermont pay stub
          besides the federal one.
        </Para>
        <Para>
          Vermont withholds tax on wages paid to a Vermont resident, and
          on wages paid to a nonresident for services performed in Vermont.
          That means a New Hampshire resident who works in Vermont still
          has Vermont tax withheld — there is no exemption for living
          across the river. A Vermont resident who works in another state
          takes a credit on the Vermont return for tax paid to the other
          state instead of being taxed twice on the same wages.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form W-4VT"
        title="Vermont still uses allowances — file a W-4VT"
        summary="The federal W-4 dropped allowances in 2020; Vermont's withholding method kept them. Each allowance is worth $5,400 a year."
      >
        <Para>
          Give your employer a completed Form W-4VT, Vermont
          Employee&apos;s Withholding Allowance Certificate. The
          Department of Taxes asks employers to collect one from every
          employee, because the federal W-4 alone does not give payroll
          the facts Vermont needs: Vermont withholding is calculated from
          your filing status, your number of withholding allowances, and
          any extra withholding per pay period on the W-4VT. Each allowance
          removes $5,400 a year from the wages the withholding tables are
          applied to ($207.69 per biweekly paycheck).
        </Para>
        <Para>
          Employees who adjusted their federal withholding in anticipation
          of a credit, and employees in civil unions, will not have the
          correct Vermont tax withheld unless they complete a W-4VT — the
          federal figures do not translate. If your federal W-4 shows an
          additional amount of federal withholding per pay period, Vermont
          withholding should be increased by 30% of that extra federal
          amount. With two jobs or a working spouse, do not claim the same
          allowances with more than one employer. You can also ask for an
          additional dollar amount withheld per pay period on the W-4VT.
        </Para>
      </ExpandableSection>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Child Care Contribution · a payroll item, not income tax</Eyebrow>
        <SectionTitle>
          The 0.44% Child Care Contribution may appear on your stub
        </SectionTitle>
        <Para>
          Since July 1, 2024, Vermont employers pay a 0.44% payroll tax —
          the Child Care Contribution — on wages subject to Vermont income
          tax withholding. An employer may pass up to one quarter of it to
          the employee, which works out to no more than 0.11% of wages.
          The calculator on this page does not model that employee share:
          if your employer withholds it, it appears as a separate stub line
          of at most {formatUSD(60000 * 0.0011)} a year on a $60,000 salary
          at the maximum pass-through. The employer always pays at least
          the other three quarters.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Credits · return-only"
        title="The Vermont credits claimed on Schedule IN-112"
        summary="EITC at 38% of the federal credit, a $1,000-per-child Child Tax Credit, and child-care credit at 72% of federal. All return-only."
      >
        <Para>
          <strong className="text-slate-900">Vermont Earned Income Tax
          Credit (refundable):</strong> 38% of your federal earned income
          tax credit, claimed on Schedule IN-112 with Form IN-111. A
          filer who qualifies may reduce annual Vermont income tax by up to
          38% of their federal EITC, subject to eligibility, available tax
          liability, and phaseout.
        </Para>
        <Para>
          <strong className="text-slate-900">Vermont Child Tax Credit
          (refundable):</strong> up to $1,000 per qualifying child under
          age six. The credit phases down once adjusted gross income
          exceeds $125,000. A filer who qualifies may reduce annual Vermont
          income tax by up to $1,000 per qualifying child, subject to
          eligibility, available tax liability, and phaseout.
        </Para>
        <Para>
          <strong className="text-slate-900">Child and Dependent Care
          Credit:</strong> 72% of the federal child and dependent care
          credit. And if you own a Vermont home, the homestead declaration
          and property tax credit claim on Form HS-122 is a separate
          filing — it is not part of the income-tax withholding on your
          paycheck.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form IN-111 and estimated tax on Form IN-114"
        summary="Full-year residents file IN-111; part-year residents add Schedule IN-113. Estimates go on Form IN-114."
      >
        <Para>
          Full-year residents file Form IN-111, Vermont Income Tax Return.
          Part-year residents complete Schedule IN-113 first, then IN-111.
          If you are not required to file a federal return, you are not
          required to file a Vermont return — but you may still want to
          file, because the refundable credits above can only be claimed by
          filing. The return is due April 15, 2027 for the 2026 tax year.
        </Para>
        <Para>
          If your Vermont tax will not be covered by withholding, make
          estimated payments on Form IN-114 in quarterly installments.
          Self-employed Vermonters also owe the Child Care Contribution on
          self-employment income from Vermont sources — it goes on Form
          IN-111, not on a pay stub.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* NEW HAMPSHIRE                                                       */
/* ------------------------------------------------------------------ */

function NewHampshireContent() {
  const slug = "new-hampshire-paycheck-calculator";
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
          New Hampshire state income tax is $0 — and here is the whole paycheck
        </SectionTitle>
        <Para>
          There is no New Hampshire rate to apply, no New Hampshire
          standard deduction to subtract, and no New Hampshire bracket to
          climb. The state income-tax line is $0 at every wage, so the only
          taxes on a New Hampshire paycheck are the federal ones.
        </Para>
        <NoteBox tone="blue">
          <strong>Annual figures:</strong> federal income tax, Social
          Security, and Medicare are the same in every state for the same
          pay — only the state column changes, and New Hampshire keeps it
          at $0. Take-home pay is what is left after all of them.
        </NoteBox>
        <WorkedTable
          caption="New Hampshire take-home pay, single filer, 2026 — annual"
          headers={["Gross wages", "Federal income tax", "Social Security", "Medicare", "NH state tax", "Take-home pay"]}
          rows={rows}
          footnote={`The comparison is the point: the same $60,000 single filer owes ${formatAmountOrUnavailable(EX_CA_60.annualState)} a year in California and ${formatAmountOrUnavailable(EX_NY_60.annualState)} in New York State (before New York City tax) — $0 in New Hampshire. Federal tax is identical in all three states for the same W-4.`}
        />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>What $0 means in practice</Eyebrow>
        <SectionTitle>
          No New Hampshire form, return, or pay-stub line — when you live and work in New Hampshire
        </SectionTitle>
        <Para>
          New Hampshire has never taxed wages, salaries, or other
          compensation earned through work. That has three practical
          consequences. First, there is no New Hampshire equivalent of
          Maine&apos;s W-4ME or Massachusetts&apos; M-4: a New Hampshire
          worker fills in only the federal Form W-4, and there is no state
          withholding form to get wrong. Second, there is no New Hampshire
          individual income-tax return to file and no state estimated
          payments to make, because there is no tax for a return or an
          estimate to cover. Third, your pay stub simply has no state
          income-tax line — nothing is withheld, so nothing appears. All of
          that applies when you live and work in New Hampshire: if you are
          a New Hampshire resident who works in another state, that state
          can withhold its own income tax, and a state line can appear on
          your pay stub.
        </Para>
        <Para>
          What still comes out is everything federal: federal income tax,
          Social Security at 6.2% up to $184,500 in 2026, and Medicare at
          1.45% plus 0.9% over $200,000. Those apply exactly as in every
          other state, and the calculator above shows them in full.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>The repeal · the last income tax is gone</Eyebrow>
        <SectionTitle>
          The Interest and Dividends Tax was repealed effective January 1, 2025
        </SectionTitle>
        <Para>
          For decades New Hampshire taxed interest and dividend income even
          though it never taxed wages. That tax was phased down — 5% for
          periods ending before December 31, 2023, then 4%, then 3% for
          periods ending on or after December 31, 2024 — and then repealed
          outright. House Bill 2, passed by the General Court and signed
          in 2023, repealed the tax effective January 1, 2025; the repeal
          had originally been set for 2026 and was accelerated. For tax
          periods beginning on or after January 1, 2025, New Hampshire
          taxpayers are no longer required to pay it, and no 2025 Interest
          and Dividends Tax return is required.
        </Para>
        <Para>
          The repeal is not retroactive and not amnesty: taxable periods
          beginning on or before December 31, 2024 remain subject to audit
          and collection, and a 2024 return (or an earlier one) still has
          to be filed by its statutory due date with any payment due. Under
          the old law the tax applied at 3% to residents receiving more than
          $2,400 of interest and dividend income as an individual, or more
          than $4,800 on a joint return. For 2026 and later, New Hampshire
          taxes no personal income of any kind — wages, interest, dividends,
          or capital gains.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="How New Hampshire pays for things instead"
        title="Property tax up, business and rooms taxes in — the honest trade-off"
        summary="No income tax does not mean no taxes. The detail — what the state collects instead — is inside."
      >
        <Para>
          The Department of Revenue Administration collects about 80% of
          New Hampshire&apos;s general taxes, and the taxes it administers
          at the state level include the Business Profits Tax, the Business
          Enterprise Tax, the Communications Services Tax, the Meals and
          Rooms Tax, the tobacco tax, and the Real Estate Transfer Tax —
          plus property tax, excavation tax, and timber tax at the local
          level. Property tax is levied locally, by municipalities, and it
          is the tax a New Hampshire resident feels most directly: there is
          no state income tax to offset it, and no broad-based sales tax
          either. A New Hampshire paycheck keeps more, but a New Hampshire
          homeowner&apos;s property-tax bill is usually larger than in most
          states — that is the real trade-off behind the $0 state tax line.
        </Para>
        <Para>
          The cross-border trap is the other side of the same coin. A New
          Hampshire resident who commutes to Massachusetts owes
          Massachusetts income tax on those wages, and a New Hampshire
          resident who works in Vermont has Vermont tax withheld. There is
          no New Hampshire credit to claim for that tax, because there is
          no New Hampshire tax to credit it against — the other state&apos;s
          return is where the liability lives, and the other state&apos;s
          withholding is what shows on the stub.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* MASSACHUSETTS                                                       */
/* ------------------------------------------------------------------ */

function MassachusettsContent() {
  const slug = "massachusetts-paycheck-calculator";
  const state = getStateBySlug(slug);
  const rows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(slug, gross);
    const ins = r.stateInsuranceLines[0];
    return [
      formatUSD0(gross),
      formatUSD0(stateTaxableIncome(slug, gross)),
      formatAmountOrUnavailable(r.annualState),
      ins ? formatUSD(ins.annual) : "Unavailable",
      formatUSD(r.annualNet),
    ];
  });
  const ma60 = examplePaycheck(slug, 60000);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          What Massachusetts tax looks like at real salaries
        </SectionTitle>
        <Para>
          Massachusetts taxes wages at a flat 5% — one rate on every dollar
          of taxable income, after the $4,400 personal exemption. There are
          no brackets to climb, so the effective rate barely moves as pay
          rises. The second deduction line is PFML, the paid-leave
          contribution, which is capped at the Social Security wage base.
        </Para>
        <NoteBox tone="blue">
          <strong>How to read this table:</strong> the income-tax column
          is your <strong>annual state liability estimate</strong>. The
          PFML column is different: PFML is{" "}
          <strong>withheld from every paycheck</strong>, so that column is
          what actually comes out of your pay.
        </NoteBox>
        <WorkedTable
          caption="Massachusetts income tax + PFML, single filer, 2026"
          headers={["Gross wages", "MA taxable income", "MA income tax", "MA PFML (0.46%)", "Take-home pay"]}
          rows={rows}
          footnote={`At $60,000 the effective MA income-tax rate is ${effectiveRatePct(ma60.annualState, 60000)}% of gross. Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          The $60,000 row in detail: {bracketDetailText(slug, 60000, state?.brackets ?? [])};
          total {formatUSD(applyBrackets(stateTaxableIncome(slug, 60000), state?.brackets ?? []))}.
          PFML at $60,000 is {formatUSD(ma60.annualStateInsurance)} — 0.46%
          of gross wages, and it stops growing once wages pass the $184,500
          Social Security cap, while the 5% income tax never stops.
        </Para>
        <NoteBox tone="amber">
          <strong>The 4% surtax does not touch these rows.</strong> On top
          of the 5% rate, Massachusetts charges an additional 4% on taxable
          income over $1,000,000, increased annually for inflation — which
          is why the top rate is quoted as 9%. It applies only to the
          dollars over the threshold, not to your whole income, and no
          salary in the table above reaches it.
        </NoteBox>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department of Revenue&apos;s own terms</Eyebrow>
        <SectionTitle>
          One rate, one exemption, and a surtax for millionaires
        </SectionTitle>
        <Para>
          Massachusetts is a flat-rate state: 5% on Massachusetts taxable
          income, with the 4% surtax on taxable income over $1,000,000
          (indexed annually for inflation) on top. The personal exemption
          is $4,400 for a single filer ($8,800 joint), with $1,000 for each
          additional exemption. There is no separate standard deduction —
          the exemption is the deduction. Massachusetts generally conforms
          to the Internal Revenue Code as amended and in effect on January
          1, 2024, so most federal adjustments carry over, with
          Massachusetts-specific modifications.
        </Para>
        <Para>
          Massachusetts has no city or county income tax. Boston,
          Cambridge, Worcester, and Springfield all withhold identically —
          the state line is the only income-tax line on a Massachusetts pay
          stub besides the federal one.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form M-4"
        title="Your W-4 does not cover Massachusetts — you need an M-4 too"
        summary="Massachusetts uses its own exemption certificate, Form M-4. Without one, your employer withholds as if you claimed no exemptions."
      >
        <Para>
          File Form M-4, Massachusetts Employee&apos;s Withholding
          Exemption Certificate, when you are hired. The federal W-4 sets
          federal withholding; the M-4 sets Massachusetts withholding, and
          the two are not derived from each other. The more exemptions you
          claim on the M-4, the less tax is withheld from each paycheck:
          one exemption is worth $4,400 a year, and each additional
          exemption is worth $1,000. If you never submit an M-4, your
          employer must withhold as though you claimed zero exemptions —
          the heaviest default.
        </Para>
        <Para>
          The withholding itself follows Circular M, the Department of
          Revenue&apos;s withholding tables, effective January 1, 2026 at
          5.0%, with 9% withheld on wages above the surtax threshold. You
          can also ask for an additional dollar amount withheld per pay
          period. Re-file the M-4 when your situation changes — marriage,
          a child, a second job, or a move into or out of Massachusetts —
          and if you claim exemption from withholding, that claim is good
          for one year only and must be renewed.
        </Para>
      </ExpandableSection>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>PFML · 0.46% maximum employee share in 2026</Eyebrow>
        <SectionTitle>
          MA PFML: the line on your pay stub that is not income tax
        </SectionTitle>
        <Para>
          Paid Family and Medical Leave is funded by a payroll contribution
          of 0.88% of eligible wages in 2026 for employers with 25 or more
          covered individuals. Your employer may withhold at most the
          employee share from your pay: the full family-leave portion
          (0.18%) plus up to 40% of the medical-leave portion (0.28%) — a
          maximum of 0.46% of your wages. Employers with fewer than 25
          covered individuals send 0.46% in total and may withhold up to
          the same 0.46% from employees. Contributions stop at the $184,500
          Social Security wage base. Your employer may choose to cover some
          or all of the employee share, so the PFML line on your stub can
          be smaller than the maximum — but never larger.
        </Para>
        <Para>
          From January 1, 2027 the split changes: the family-leave share
          your employer may withhold becomes 0.28% (up to 40% of a larger
          family portion) and the medical-leave share becomes 0.18% (up to
          100%), under Chapter 101 of the Acts of 2026. The 0.46% maximum
          employee share is unchanged — only which half it comes from
          moves.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Credits · return-only"
        title="The Massachusetts credits claimed on Form 1"
        summary="EITC at 40% of the federal credit, the $440 Child and Family Tax Credit, and the Circuit Breaker. All claimed on your annual return."
      >
        <Para>
          <strong className="text-slate-900">Earned Income Tax Credit
          (refundable):</strong> Massachusetts allows a refundable credit
          equal to 40% of your federal earned income credit. You must file
          a Massachusetts return and have been a Massachusetts resident for
          at least part of the taxable year; nonresidents for the entire
          year are not eligible, and part-year residents get 40% of the
          federal credit multiplied by the share of the year they resided
          in Massachusetts. A filer who qualifies may reduce annual
          Massachusetts income tax by up to 40% of their federal EITC,
          subject to eligibility, available tax liability, and phaseout.
        </Para>
        <Para>
          <strong className="text-slate-900">Child and Family Tax Credit:</strong>{" "}
          $440 for each eligible individual — a dependent child under age
          13, a disabled dependent or spouse, or a dependent age 65 or
          over — with no limit on the number of individuals. Single, head
          of household, and joint filers qualify; married taxpayers filing
          separate returns do not. A filer who qualifies may reduce annual
          Massachusetts income tax by up to $440 per eligible individual,
          subject to eligibility, available tax liability, and phaseout.
          It is claimed on Form 1, line 46.
        </Para>
        <Para>
          <strong className="text-slate-900">Circuit Breaker Tax
          Credit:</strong> a credit for homeowners and renters age 65 or
          older whose property tax (or 25% of rent) is high relative to
          income. It is claimed on the annual return, not on your paycheck
          — none of these credits lower the withholding on your stub.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form 1, Form 1-NR/PY, and estimated tax"
        summary="Residents file Form 1; nonresidents and part-year residents file Form 1-NR/PY. Estimates go on Form 1-ES."
      >
        <Para>
          Full-year residents file Form 1, Massachusetts Resident Income
          Tax Return, due April 15, 2027 for the 2026 tax year.
          Nonresidents and part-year residents file Form 1-NR/PY instead.
          If you expect to owe Massachusetts tax that withholding will not
          cover — freelance work, rental income, or investment income, for
          example — make estimated payments on Form 1-ES in four quarterly
          installments, due April 15, June 15, and September 15, 2026, and
          January 15, 2027. Filing the return by January 31, 2027 and paying
          in full replaces the fourth installment.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* RHODE ISLAND                                                        */
/* ------------------------------------------------------------------ */

function RhodeIslandContent() {
  const slug = "rhode-island-paycheck-calculator";
  const state = getStateBySlug(slug);
  const brackets = state?.brackets ?? [];
  const rows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(slug, gross);
    const ins = r.stateInsuranceLines[0];
    return [
      formatUSD0(gross),
      formatUSD0(taxableIncomeFull(slug, gross)),
      formatAmountOrUnavailable(r.annualState),
      ins ? formatUSD(ins.annual) : "Unavailable",
      formatUSD(r.annualNet),
    ];
  });
  const ri60 = examplePaycheck(slug, 60000);
  const riTaxable60 = taxableIncomeFull(slug, 60000);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          What Rhode Island tax looks like at real salaries
        </SectionTitle>
        <Para>
          Rhode Island taxes wages in three brackets — 3.75%, 4.75%, then
          5.99% — after the $11,200 standard deduction and the $5,250
          personal exemption. One schedule covers every filing status: the
          same thresholds apply whether you file single or joint. The TDI
          column is the mandatory disability contribution, capped at
          $100,000 of wages.
        </Para>
        <NoteBox tone="blue">
          <strong>How to read this table:</strong> the income-tax column
          is your <strong>annual state liability estimate</strong>. The TDI
          column is different: TDI is{" "}
          <strong>withheld from every paycheck</strong>, so that column is
          what actually comes out of your pay — and it stops at $1,100 a
          year, so later paychecks get slightly bigger once you pass
          $100,000 of wages.
        </NoteBox>
        <WorkedTable
          caption="Rhode Island income tax + TDI, single filer, 2026"
          headers={["Gross wages", "RI taxable income", "RI income tax", "RI TDI (1.1%)", "Take-home pay"]}
          rows={rows}
          footnote={`At $60,000 the effective RI income-tax rate is ${effectiveRatePct(ri60.annualState, 60000)}% of gross. Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          The $60,000 row in detail: taxable income is{" "}
          {formatUSD0(riTaxable60)}; {bracketDetailFull(slug, 60000)};
          total {formatUSD(applyBrackets(riTaxable60, brackets))}. The
          bracket tops are {formatUSD0(brackets[0]?.upTo ?? 0)} and{" "}
          {formatUSD0(brackets[1]?.upTo ?? 0)} for every filing status.
          TDI at $60,000 is {formatUSD(ri60.annualStateInsurance)} — 1.1%
          of gross wages.
        </Para>
        <NoteBox tone="amber">
          <strong>Phaseout these rows do not model:</strong> the standard
          deduction and the exemptions phase out between $261,000 and
          $290,800 of modified federal adjusted gross income, in four
          steps. No salary in this table reaches that band, but above it
          the real liability is higher than the bracket walk alone.
        </NoteBox>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Division of Taxation&apos;s own terms</Eyebrow>
        <SectionTitle>
          One schedule for everyone, and Rhode Island starts from federal AGI
        </SectionTitle>
        <Para>
          Rhode Island income tax is based on your federal adjusted gross
          income. Every resident individual who is required to file a
          federal return must file a Rhode Island return (RI-1040), and a
          resident who is not required to file federally may still have to
          file in Rhode Island if income exceeds the sum of exemptions and
          the standard deduction. A resident is someone domiciled in Rhode
          Island, or someone who maintains a permanent place of abode there
          and spends more than 183 days of the year in the state.
          Nonresidents and part-year residents file Form RI-1040NR instead.
        </Para>
        <Para>
          Rhode Island does not allow federal itemized deductions — the
          standard deduction is the only deduction. There is no local
          income tax in Rhode Island: no city or town adds a wage tax, so
          the state line is the only income-tax line on a Rhode Island pay
          stub besides the federal one. And TDI payments cannot be claimed
          as income tax withheld on the return — they are non-refundable
          and stay separate.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form RI W-4"
        title="Rhode Island does not accept the federal W-4"
        summary="Your employer needs Form RI W-4, the state's own withholding allowance certificate. The detail is inside."
      >
        <Para>
          Give your employer a completed Form RI W-4, Employee&apos;s
          Withholding Allowance Certificate, alongside your federal W-4.
          Rhode Island does not accept the federal form for state
          withholding. The RI W-4 has no filing-status box on it at all —
          the state uses one withholding schedule for every filing status —
          and you claim your allowances on it. An employee who claims no
          allowances has withholding figured on the full annualized wage,
          which is the heaviest outcome. Withholding follows the
          Division&apos;s 2026 employer withholding tables, effective
          January 1, 2026, using the percentage method at the same 3.75% /
          4.75% / 5.99% rates as the return.
        </Para>
        <Para>
          Supplemental wages are withheld at 5.99%. If you work for more
          than one employer, remember the TDI wage base is per employee
          across employers: if combined wages pass $100,000, the extra TDI
          withheld can be reclaimed on Form TX-16.
        </Para>
      </ExpandableSection>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>TDI · 1.1% in 2026, down from 1.3%</Eyebrow>
        <SectionTitle>
          RI TDI: the deduction every Rhode Island worker pays
        </SectionTitle>
        <Para>
          Temporary Disability Insurance is paid by employees, not
          employers, through a mandatory payroll deduction — 1.1% of wages
          up to a $100,000 wage base in 2026, for a maximum of $1,100.00 a
          year. The rate fell from 1.3% in 2025 while the wage base rose
          from $89,200, so the annual maximum fell from $1,159.60. TDI
          protects against wage loss from a non-work-related illness or
          injury, and Temporary Caregiver Insurance — up to seven weeks to
          bond with a new child or care for a seriously ill family member —
          is part of the same program, funded by the same contribution.
          There is no separate caregiver line on your stub. Workers aged 14
          and 15 are exempt from TDI deductions and coverage. Unemployment
          insurance, by contrast, is an employer tax and does not belong
          among employee deductions.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Credits · return-only"
        title="The Rhode Island credits claimed on Form RI-1040"
        summary="EITC at 16% of the federal credit, a 25% child-care credit, and the Property Tax Relief Credit on Form RI-1040H. All return-only."
      >
        <Para>
          <strong className="text-slate-900">Rhode Island Earned Income
          Credit (refundable in part):</strong> 16% of your federal earned
          income credit, claimed on RI Schedule EIC with Form RI-1040. A
          filer who qualifies may reduce annual Rhode Island income tax by
          up to 16% of their federal EITC, subject to eligibility,
          available tax liability, and phaseout. The credit cannot exceed
          the Rhode Island income tax except for the refundable portion the
          statute provides.
        </Para>
        <Para>
          <strong className="text-slate-900">Credit for Child and
          Dependent Care Expenses:</strong> 25% of the federal credit, from
          RI Schedule I. A filer who qualifies may reduce annual Rhode
          Island income tax by up to 25% of their federal child and
          dependent care credit, subject to eligibility, available tax
          liability, and phaseout.
        </Para>
        <Para>
          <strong className="text-slate-900">Property Tax Relief Credit
          (Form RI-1040H):</strong> a credit for lower-income homeowners
          and renters, claimed on Form RI-1040H — which must be filed by
          April 15, 2027, and can be filed separately if you are not
          required to file a RI-1040. Filing an extension for the RI-1040
          does not extend the time to file the RI-1040H. Rhode Island also
          gives a credit for income taxes paid to another state (RI
          Schedule II), so a Rhode Island resident who works in
          Massachusetts or Connecticut is not taxed twice on the same wages.
        </Para>
        <Para>
          Two modifications worth knowing for retirees: Rhode Island lets
          you subtract Social Security benefits and pension and annuity
          income below federal-AGI limits, on worksheets in the RI-1040
          instructions. The limits are income-tested, so check the current
          year&apos;s worksheet rather than assuming the exclusion applies.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form RI-1040, the April 15, 2027 deadline, and estimates"
        summary="Residents file RI-1040; part-year and nonresidents file RI-1040NR. Estimates go on Form RI-1040ES."
      >
        <Para>
          File Form RI-1040 by April 15, 2027 for the 2026 tax year. An
          extension of time to file (Form RI-4868) gives an automatic six
          months to file, but it does not extend the time to pay — any tax
          due must still be paid by the original deadline, and an amount due
          of less than $5 need not be paid. If no payment is required with
          your Rhode Island extension and you filed a federal extension for
          the same period, you do not need to submit the Rhode Island form.
        </Para>
        <Para>
          If your Rhode Island tax will not be covered by withholding, make
          estimated payments on Form RI-1040ES. Any overpayment can be
          applied to the following year&apos;s estimated tax. And if your
          federal taxable income or federal tax liability changes — for
          example after an amended federal return — report it to the
          Division of Taxation within 90 days on an amended RI-1040.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* CONNECTICUT                                                         */
/* ------------------------------------------------------------------ */

function ConnecticutContent() {
  const slug = "connecticut-paycheck-calculator";
  const state = getStateBySlug(slug);
  const brackets = state?.brackets ?? [];
  const rows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(slug, gross);
    const ins = r.stateInsuranceLines[0];
    return [
      formatUSD0(gross),
      formatUSD0(engineTaxableIncome(slug, gross)),
      formatAmountOrUnavailable(r.annualState),
      ins ? formatUSD(ins.annual) : "Unavailable",
      formatUSD(r.annualNet),
    ];
  });
  const ct60 = examplePaycheck(slug, 60000);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          What Connecticut tax looks like at real salaries
        </SectionTitle>
        <Para>
          Connecticut taxes wages in seven brackets — 2% to 6.99% — after
          the $15,000 personal exemption. But the bracket walk is only the
          first step: Connecticut then applies a personal tax credit that
          cuts the tax for low- and middle-income filers, phases the
          $15,000 exemption out above $30,000 of Connecticut AGI, adds a
          Table C phase-out add-back on the 2% bracket at higher incomes,
          and adds a benefit recapture at high incomes. All four steps of
          the Connecticut Tax Calculation Schedule are modelled in the
          calculator on this page, so every row below is the full
          schedule result — not a bracket-only figure — and the figures
          match the tool.
        </Para>
        <NoteBox tone="blue">
          <strong>How the schedule works in these rows:</strong> the
          calculator runs the full Connecticut Tax Calculation Schedule
          (2026 CT-1040ES, Tables A–E). Table A phases the $15,000
          personal exemption out by $1,000 for each $1,000 (or part) of
          Connecticut AGI above $30,000 for a single filer; Table E then
          cuts the tax by a personal credit — 15% at $30,000 of AGI, 10%
          at $60,000, 0% once AGI passes $64,500; Table C adds $25 per
          $5,000 (or part) of Connecticut AGI above $56,500, up to $250;
          and Table D adds the benefit recapture above $105,000 of AGI.
          At $30,000 of Connecticut AGI the exemption is still whole and
          the add-back is $0, so the 15% credit alone applies and the tax
          is {formatUSD(ctCorrectedTax(30000, 0.15))} — the figure in the
          table. At $60,000 the exemption is already gone, so the bracket
          tax is computed on the full $60,000 —{" "}
          {formatUSD(applyBrackets(60000, brackets))} — plus the{" "}
          {formatUSD(ctTableCAddBack(60000))} Table C add-back, and the
          10% credit leaves {formatUSD(ctCorrectedTax(60000, 0.1))},
          which is the {formatAmountOrUnavailable(ct60.annualState)} in
          the table. At $150,000 the credit is $0, but the benefit
          recapture — which phases in above $105,000 of Connecticut AGI
          for single filers — is already included, so the{" "}
          {formatAmountOrUnavailable(examplePaycheck(slug, 150000).annualState)}{" "}
          in the table is the complete liability, not a bracket-only
          figure.
        </NoteBox>
        <WorkedTable
          caption="Connecticut income tax + CT Paid Leave, single filer, 2026"
          headers={["Gross wages", "CT taxable income", "CT income tax", "CT Paid Leave (0.5%)", "Take-home pay"]}
          rows={rows}
          footnote={`The CT Paid Leave column is exact as shown (0.5% of wages up to the $184,500 cap). The income-tax column is the full Connecticut Tax Calculation Schedule result — Table A exemption phaseout, Table B brackets, Table C add-back, Table D recapture, and the Table E personal credit — not a bracket-only figure. Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          The $60,000 row in detail: the $15,000 personal exemption is
          already gone at $60,000 of Connecticut AGI — it phases out by
          $1,000 for each $1,000 (or part) over $30,000, leaving $1,000
          at exactly $44,000 and $0 above that — so the taxable income is
          the full $60,000 and the bracket walk is{" "}
          {bracketDetailEngine(slug, 60000, brackets)}; total{" "}
          {formatUSD(applyBrackets(engineTaxableIncome(slug, 60000), brackets))}.
          The Table C 2% phase-out add-back then adds{" "}
          {formatUSD(ctTableCAddBack(60000))} at $60,000 of Connecticut
          AGI (Table C adds $25 per $5,000 of AGI above $56,500 for a
          single filer, up to $250), and the 10% personal tax credit
          leaves {formatUSD(ctCorrectedTax(60000, 0.1))} — in other words
          ({formatUSD(applyBrackets(60000, brackets))} bracket tax +{" "}
          {formatUSD(ctTableCAddBack(60000))} add-back) × 90%, which is
          the figure in the table. The $30,000 row is simpler: at exactly
          $30,000 of AGI the exemption is still whole and the add-back is
          $0, so the credit alone applies and the tax is{" "}
          {formatUSD(ctCorrectedTax(30000, 0.15))} — again the figure in
          the table.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department of Revenue Services&apos; own terms</Eyebrow>
        <SectionTitle>
          Seven brackets, no standard deduction, and a credit that does the real work
        </SectionTitle>
        <Para>
          Connecticut has no standard deduction. Instead it gives a
          personal exemption — $15,000 for single filers, $24,000 for
          married filing jointly, $19,000 for head of household, $12,000
          for married filing separately — deducted from Connecticut AGI,
          which starts from federal AGI. If your Connecticut AGI is $15,000
          or less as a single filer ($24,000 or less joint), you owe no
          income tax at all. Above that, the seven rates run from 2% to
          6.99%, and the tax is then reduced by the personal tax credit:
          75% at the lowest incomes, sliding down to 0% once Connecticut
          AGI passes $64,500 for single filers.
        </Para>
        <Para>
          Connecticut has no local income tax anywhere in the state — all
          169 municipalities levy 0% — so the state line is the only
          income-tax line on a Connecticut pay stub besides the federal
          one. Connecticut has no reciprocity with any state: a nonresident
          who works in Connecticut has Connecticut tax withheld and takes a
          credit for it on the home-state return.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form CT-W4"
        title="Connecticut uses withholding codes, not allowances"
        summary="Form CT-W4 assigns a letter code — A through F — that drives the whole calculation. No form means withholding at the highest rate."
      >
        <Para>
          File Form CT-W4 with your employer. Connecticut does not use an
          allowance count: you select a withholding code (A through F)
          based on your filing status and expected income, and the
          Department of Revenue Services&apos; TPG-211 calculation rules
          turn that code plus your annualized salary into the exemption,
          the tax schedule, the phase-out add-back, the recapture, and the
          personal tax credit. The 2026 rules and tables are unchanged from
          2025. If no CT-W4 is filed, Connecticut requires withholding at
          the highest rate.
        </Para>
        <Para>
          Unlike federal withholding, Connecticut state income tax
          withholding is required from the first paycheck — there is no
          de minimis amount below which nothing is withheld. You can ask
          for additional withholding per pay period on the form. Your final
          Connecticut liability is settled on Form CT-1040, where the
          credit and recapture that payroll only approximates are computed
          exactly.
        </Para>
      </ExpandableSection>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>CT Paid Leave · 0.5% in 2026</Eyebrow>
        <SectionTitle>
          CT Paid Leave: half a percent, entirely employee-paid
        </SectionTitle>
        <Para>
          Connecticut Paid Leave applies to every Connecticut employer with
          one or more employees. Employees contribute 0.5% of wages up to
          the $184,500 Social Security wage base — a maximum of{" "}
          {formatUSD(184500 * 0.005)} a year — entirely employee-paid, on FICA wages (Section 125 items
          excluded). The calculator shows it as its own line: at $60,000 it is{" "}
          {formatUSD(ct60.annualStateInsurance)} a year. Unemployment
          insurance, by contrast, is employer-paid, on the first $27,000 of
          each worker&apos;s wages for 2026, and never appears on your stub.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Credits · return-only"
        title="The Connecticut credits claimed on Form CT-1040"
        summary="EITC at 40% of the federal credit plus $250, and a property tax credit of up to $300. Both return-only."
      >
        <Para>
          <strong className="text-slate-900">Connecticut Earned Income
          Tax Credit (refundable):</strong> 40% of your federal earned
          income credit, claimed on Schedule CT-EITC. If you have at least
          one qualifying child for federal purposes, you get an additional
          $250 on top of the 40% amount. A filer who qualifies may reduce
          annual Connecticut income tax by up to 40% of their federal EITC
          plus $250 with a qualifying child, subject to eligibility,
          available tax liability, and phaseout. Nonresidents and part-year
          residents do not qualify — the credit is for Connecticut
          residents only.
        </Para>
        <Para>
          <strong className="text-slate-900">Property Tax Credit:</strong>{" "}
          up to $300 per return for Connecticut residents who paid
          qualifying property tax on their primary residence and/or motor
          vehicle. It can offset only your income tax — it is not
          refundable and cannot be carried forward — and the amount depends
          on your Connecticut AGI: single filers with AGI of $49,500 or
          less get the full credit before the phase-down table applies.
        </Para>
        <Para>
          <strong className="text-slate-900">Social Security and pension
          exclusions:</strong> Connecticut lets you subtract Social
          Security benefits and pension and annuity income below
          income limits — the Social Security adjustment worksheet applies
          when federal AGI is $75,000 or more for single filers ($100,000
          joint), and the pension exclusion phases out over its own table.
          Check the current year&apos;s worksheets rather than assuming the
          exclusion applies at your income.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form CT-1040, the April 15, 2027 deadline, and estimates"
        summary="Residents file CT-1040; nonresidents and part-year residents file CT-1040NR/PY. Estimates go on Form CT-1040ES."
      >
        <Para>
          File Form CT-1040, Connecticut Resident Income Tax Return, by
          April 15, 2027 for the 2026 tax year. Nonresidents and part-year
          residents file Form CT-1040NR/PY. If your Connecticut tax will
          not be covered by withholding, make estimated payments on Form
          CT-1040ES in four quarterly installments, due April 15, June 15,
          and September 15, 2026, and January 15, 2027. File and pay
          electronically through myconneCT.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* NEW JERSEY                                                          */
/* ------------------------------------------------------------------ */

function NewJerseyContent() {
  const slug = "new-jersey-paycheck-calculator";
  const state = getStateBySlug(slug);
  const brackets = state?.brackets ?? [];
  const rows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(slug, gross);
    const insTotal = r.stateInsuranceLines.reduce((s, l) => s + l.annual, 0);
    return [
      formatUSD0(gross),
      formatUSD0(stateTaxableIncome(slug, gross)),
      formatAmountOrUnavailable(r.annualState),
      formatUSD(insTotal),
      formatUSD(r.annualNet),
    ];
  });
  const nj60 = examplePaycheck(slug, 60000);
  const nj60Ins = nj60.stateInsuranceLines.reduce((s, l) => s + l.annual, 0);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          What New Jersey tax looks like at real salaries
        </SectionTitle>
        <Para>
          New Jersey taxes wages in seven brackets — 1.4% to 10.75% — after
          a $1,000 personal exemption. There is no standard deduction, so
          the rates start biting almost immediately. The fourth column is
          the part most calculators miss: three small payroll programs
          (disability, family leave, unemployment) that come out of every
          New Jersey paycheck on top of the income tax.
        </Para>
        <NoteBox tone="blue">
          <strong>How to read this table:</strong> the income-tax column
          is your <strong>annual state liability estimate</strong>. The
          payroll-programs column is different: TDI, FLI, and UI/WF are{" "}
          <strong>withheld from every paycheck</strong>, so that column is
          what actually comes out of your pay — and the UI/WF part stops
          once wages pass $44,800.
        </NoteBox>
        <WorkedTable
          caption="New Jersey income tax + payroll programs, single filer, 2026"
          headers={["Gross wages", "NJ taxable income", "NJ income tax", "NJ payroll programs", "Take-home pay"]}
          rows={rows}
          footnote={`At $60,000 the effective NJ income-tax rate is ${effectiveRatePct(nj60.annualState, 60000)}% of gross, plus ${formatUSD(nj60Ins)} a year in payroll programs. Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          The $60,000 row in detail: {bracketDetailText(slug, 60000, brackets)};
          total {formatUSD(applyBrackets(stateTaxableIncome(slug, 60000), brackets))}.
          The payroll programs at $60,000 are TDI{" "}
          {formatUSD(nj60.stateInsuranceLines[0]?.annual ?? 0)}, FLI{" "}
          {formatUSD(nj60.stateInsuranceLines[1]?.annual ?? 0)}, and UI/WF{" "}
          {formatUSD(nj60.stateInsuranceLines[2]?.annual ?? 0)} — the UI/WF
          line is already at its annual maximum of{" "}
          {formatUSD(44800 * 0.00425)}. New Jersey
          also allows an exemption for each dependent, which the calculator
          does not model, so a filer with dependents owes less than the
          table shows.
        </Para>
        <NoteBox tone="amber">
          <strong>New Jersey&apos;s top rate is the highest on the East
          Coast.</strong> The 10.75% bracket starts at $1,000,000 of taxable
          income for single filers. No salary in this table reaches it — at
          $150,000 the marginal rate is 6.37%.
        </NoteBox>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Division of Taxation&apos;s own terms</Eyebrow>
        <SectionTitle>
          New Jersey taxes income in categories — and taxes your health premiums
        </SectionTitle>
        <Para>
          New Jersey&apos;s Gross Income Tax sorts income into categories,
          and wages are the category most workers live in. The state does
          not have a standard deduction: taxable income is gross income
          minus the $1,000 personal exemption ($2,000 joint), minus
          exemptions for dependents. Joint filers use a structurally
          different bracket table from single filers in the middle bands —
          the only state where the joint schedule is not just the single
          schedule widened.
        </Para>
        <Para>
          The quirk that surprises newcomers is what New Jersey counts as
          wages. New Jersey does not adopt Internal Revenue Code Section
          125: Section 125 health premiums, flexible spending accounts, and
          HSAs are taxed in New Jersey and do not reduce your New Jersey
          taxable wages. 401(k) contributions are the exception — they are
          excluded, following the federal treatment. Other retirement
          contributions (403(b), 457, SEP, TSP, IRA) are taxed instead.
          That is why raising your health-premium or HSA contribution
          lowers your federal tax but leaves your New Jersey tax untouched.
        </Para>
        <Para>
          No New Jersey city or county levies an income tax on wages, so
          there is no local line to add — the state tax and the payroll
          programs are the whole New Jersey layer on your stub.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form NJ-W4"
        title="NJ-W4 picks your rate table — A or B, plus a wage chart"
        summary="Single filers withhold at Rate A; joint filers and heads of household at Rate B. Line 3's wage chart and line 6's exemption are the parts people get wrong."
      >
        <Para>
          File Form NJ-W4, Employee&apos;s Withholding Allowance
          Certificate, with your employer. Line 2 is your filing status:
          box 1 (Single) or box 3 (Married/Civil Union Partner Separate)
          puts you on Rate A; box 2 (Joint), box 4 (Head of Household), or
          box 5 (Qualifying Widow(er)) puts you on Rate B unless you
          complete line 3. Line 3 is the wage chart: if you are a joint,
          head-of-household, or widow(er) filer with taxable income over
          $50,000, you should strongly consider using it — it picks a
          letter (A–E) that raises withholding to match the higher rate
          your combined income will actually be taxed at. Single filers do
          not use the chart.
        </Para>
        <Para>
          Line 4 is the number of allowances you claim; each allowance
          reduces withholding, and claiming too many can leave you
          underpaid at filing time. Line 5 is an additional fixed amount
          per paycheck. Line 6 is the exemption: enter “EXEMPT” only if
          your wages plus taxable nonwage income will be $10,000 or less
          for the year as a single filer ($20,000 joint, head of household,
          or widow(er)). The exemption is good for one year only — you must
          complete and submit a new form each year to keep it.
        </Para>
      </ExpandableSection>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Payroll programs · TDI, FLI, UI/WF</Eyebrow>
        <SectionTitle>
          Three small programs, three wage bases, one stub
        </SectionTitle>
        <Para>
          Temporary Disability Insurance is 0.19% of wages up to $171,100
          (maximum {formatUSD(171100 * 0.0019)} a year); Family Leave Insurance is 0.23% on the
          same $171,100 base (maximum {formatUSD(171100 * 0.0023)} a year); and Unemployment
          Insurance plus the Workforce Development/Supplemental Workforce
          Fund is 0.425% on the first $44,800 (maximum {formatUSD(44800 * 0.00425)} a year).
          Together they are {formatUSD(nj60Ins)} a year at $60,000 — small
          next to the income tax, but they are the reason a New Jersey pay
          stub has four state lines instead of one. All three are
          employee-paid and withheld from every paycheck until their wage
          bases are reached.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Credits &amp; property tax relief · return-only"
        title="EITC, Child Tax Credit, and ANCHOR"
        summary="A refundable EITC at 40% of federal, a Child Tax Credit of up to $1,250 per young child, and ANCHOR property-tax relief. All claimed off the paycheck."
      >
        <Para>
          <strong className="text-slate-900">New Jersey Earned Income Tax
          Credit (refundable):</strong> generally 40% of your federal
          earned income tax credit, claimed on Form NJ-1040. A filer who
          qualifies may reduce annual New Jersey income tax by up to 40% of
          their federal EITC, subject to eligibility, available tax
          liability, and phaseout. New Jersey also expanded age eligibility
          for workers without qualifying children.
        </Para>
        <Para>
          <strong className="text-slate-900">New Jersey Child Tax Credit
          (refundable):</strong> up to $1,250 per child aged 5 or younger
          for tax years 2026 through 2028 — a 25% increase over the $1,000
          credit, enacted by P.L.2026, c.22. It phases down as taxable
          income rises toward $80,000. A filer who qualifies may reduce
          annual New Jersey income tax by up to $1,250 per qualifying young
          child, subject to eligibility, available tax liability, and
          phaseout. Households with low or no income who are not required
          to file can claim it through the Division&apos;s free SimpleFile
          tool.
        </Para>
        <Para>
          <strong className="text-slate-900">ANCHOR (property tax
          relief):</strong> a direct payment for homeowners and renters,
          not a credit on the return — up to $1,500 for homeowners with
          gross income of $150,000 or less ($1,000 between $150,001 and
          $250,000), up to $450 for renters, with an additional $250 for
          applicants age 65 or older. It is filed on the PAS-1
          application, which also covers the Senior Freeze and Stay NJ
          programs for homeowners 65 and older. ANCHOR does not reduce
          your income tax; it is a separate payment for property taxes you
          already paid, directly or through rent.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing, estimates &amp; commuters · return-only"
        title="Form NJ-1040, the $400 estimated-tax rule, and working across the river"
        summary="Residents file NJ-1040; nonresidents file NJ-1040NR. Estimates are required above $400 owed. The commuter detail is inside."
      >
        <Para>
          File Form NJ-1040 by April 15, 2027 for the 2026 tax year.
          Nonresidents file Form NJ-1040NR. If you expect to owe more than
          $400 in New Jersey income tax after withholding and credits, you
          must make estimated payments — four equal installments on Form
          NJ-1040-ES, due April 15, June 15, and September 15, 2026, and
          January 15, 2027, or pay in full by April 15, 2026. You can avoid
          estimates by asking your employer to withhold more, on a new
          NJ-W4.
        </Para>
        <Para>
          Commuters: a New Jersey resident who works in New York owes New
          York tax on those wages and claims a credit on the New Jersey
          return for tax paid to New York. A New Jersey resident who works
          in Pennsylvania is covered by the two states&apos; reciprocity
          agreement — Pennsylvania does not tax the compensation, and the
          worker files Form REV-419 with the Pennsylvania employer so
          Pennsylvania withholding stops. Since tax year 2023, New Jersey
          applies New York&apos;s convenience rule to New York residents
          who work remotely for a New Jersey employer, and New Jersey
          employers should withhold New Jersey tax on those employees.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* PENNSYLVANIA                                                        */
/* ------------------------------------------------------------------ */

function PennsylvaniaContent() {
  const slug = "pennsylvania-paycheck-calculator";
  const rows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(slug, gross);
    return [
      formatUSD0(gross),
      formatAmountOrUnavailable(r.annualState),
      formatUSD(gross * 0.01),
      formatUSD(r.annualNet),
    ];
  });
  const pa60 = examplePaycheck(slug, 60000);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          What Pennsylvania tax looks like at real salaries
        </SectionTitle>
        <Para>
          Pennsylvania taxes wages at a flat 3.07% — one rate, no brackets,
          no standard deduction, no personal exemption. The third column is
          the part the state calculator does not include: the local earned
          income tax, commonly 1% of gross wages, which almost every
          Pennsylvania worker pays on top of the state rate. Philadelphia
          is the exception, and it is covered below.
        </Para>
        <NoteBox tone="blue">
          <strong>How to read this table:</strong> the state-tax column is
          your <strong>annual state liability estimate</strong>. The local
          EIT column is a typical 1% — your actual rate depends on your
          municipality and school district, and the calculator does not
          model it, so the take-home column here is before local tax. A
          Philadelphia resident pays the city Wage Tax instead of the EIT.
        </NoteBox>
        <WorkedTable
          caption="Pennsylvania state tax + typical local EIT, single filer, 2026"
          headers={["Gross wages", "PA state tax (3.07%)", "Local EIT at 1% (typical)", "Take-home pay (before local tax)"]}
          rows={rows}
          footnote={`At $60,000 the state tax is ${formatAmountOrUnavailable(pa60.annualState)} a year — 3.07% of every dollar, with nothing subtracted first. Every row is generated from the same calculation the calculator above runs, so the state-tax figures match the tool; the local column is simple arithmetic at the typical 1% rate.`}
        />
        <Para>
          The $60,000 row in detail: there is no bracket walk, because
          there are no brackets — 3.07% × {formatUSD0(60000)} ={" "}
          {formatAmountOrUnavailable(pa60.annualState)}. Add the typical 1%
          local EIT ({formatUSD(60000 * 0.01)}) and the combined
          state-plus-local rate is 4.07% of gross wages. At $150,000 the
          state tax is {formatAmountOrUnavailable(EX_PA_150.annualState)}{" "}
          and the typical local EIT is {formatUSD(150000 * 0.01)}.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department of Revenue&apos;s own terms</Eyebrow>
        <SectionTitle>
          Flat 3.07%, eight classes of income, and no deductions to claim
        </SectionTitle>
        <Para>
          Pennsylvania taxes personal income at a flat 3.07%, the same
          whether you earn $30,000 or $300,000. There is no standard
          deduction, no personal exemption, and almost none of the itemized
          deductions available on a federal return. Pennsylvania sorts
          taxable income into eight classes — compensation, interest,
          dividends, net business profits, net gains from selling property,
          rents and royalties, estate and trust income, and gambling and
          lottery winnings — and losses in one class generally cannot
          offset income in another.
        </Para>
        <Para>
          The rule that catches newcomers is the 401(k) rule, already shown
          in the deductions section above: Pennsylvania taxes 401(k), 403(b),
          and 457(b) employee contributions. They do not reduce your
          Pennsylvania taxable wages, so raising your 401(k) lowers your
          federal tax but leaves your Pennsylvania tax untouched. Section
          125 health premiums are excluded, and an HSA contributed through
          a payroll Section 125 plan is excluded; dependent-care FSAs are
          taxed.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · there is no Pennsylvania form"
        title="Pennsylvania has no state withholding form — and that is the point"
        summary="Your employer withholds 3.07% on compensation. The form you do sign is the local Residency Certification Form."
      >
        <Para>
          Pennsylvania has no state withholding certificate. There is no
          Pennsylvania equivalent of the federal W-4, New Jersey&apos;s
          NJ-W4, or Massachusetts&apos; M-4: your employer simply withholds
          3.07% of your Pennsylvania-taxable compensation. There are no
          allowances to claim and no exemption to elect on the state side —
          the only choice is an additional dollar amount per paycheck if
          you want more withheld.
        </Para>
        <Para>
          The form you do sign is the local one: the Residency
          Certification Form (DCED CLGS-32-6). Every Pennsylvania employee
          signs it so payroll withholds the correct local earned income tax
          — it carries your six-digit PSD code, which identifies your
          municipality, school district, and Tax Collection District, and
          your total resident EIT rate. Look your PSD code up by street
          address on the Pennsylvania Department of Community and Economic
          Development&apos;s local income tax register.
        </Para>
        <Para>
          Reciprocity is the other form that matters. A resident of
          Indiana, Maryland, New Jersey, Ohio, Virginia, or West Virginia
          who works in Pennsylvania files Form REV-419, Employee&apos;s
          Nonwithholding Application Certificate, with the Pennsylvania
          employer so Pennsylvania tax is not withheld — the worker pays
          tax to the home state instead. And a Pennsylvania resident who
          works in one of those states tells that employer to withhold
          Pennsylvania tax, not the other state&apos;s tax. Reciprocity
          covers employee compensation only: 1099 income for services
          performed in Pennsylvania is still Pennsylvania-source income.
        </Para>
      </ExpandableSection>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Local taxes · EIT, LST, and Philadelphia</Eyebrow>
        <SectionTitle>
          The local layer is where Pennsylvania paychecks get complicated
        </SectionTitle>
        <Para>
          Outside Philadelphia, every municipality and school district
          levies a local earned income tax under Act 32 of 2008. The
          combined rate is your municipality&apos;s rate plus your school
          district&apos;s rate — commonly 1% in total, and generally capped
          at 1% each. Under Act 32 your employer withholds the higher of
          your resident rate or the rate where you work, and remits through
          a single Tax Collection District, so you are not taxed twice if
          you live in one town and work in another: a resident credit
          covers tax withheld at the work location, up to the home rate.
          You still have to file an annual local EIT return with your Tax
          Collection District&apos;s appointed collector, even if
          withholding was perfect.
        </Para>
        <Para>
          On top of the EIT, most municipalities levy a Local Services Tax
          of up to $52 a year, divided across your pay periods. Anyone
          expecting to earn under $12,000 in that municipality can file for
          an exemption where the tax is over $10.
        </Para>
        <Para>
          Philadelphia sits entirely outside Act 32 and charges its own
          Wage Tax instead of an EIT: 3.735% for residents and 3.425% for
          nonresidents on pay dates from July 1, 2026 (down from 3.74% and
          3.43% through June 30, 2026), in steps of a five-year phased cut
          approved in June 2025. Philadelphia residents pay the resident
          rate on all earned income regardless of where the work is
          performed; nonresidents pay only on wages earned inside the city.
          At $60,000 that is {formatUSD(60000 * 0.03735)} a year for a
          resident and {formatUSD(60000 * 0.03425)} for a commuter — on top
          of the {formatAmountOrUnavailable(pa60.annualState)} in state tax,
          for a combined Pennsylvania-level rate of 6.805% on earned income.
          There is no LST in Philadelphia. Pennsylvania residents who work
          in Philadelphia get a credit on their home EIT for the Wage Tax
          paid, up to the home rate — that credit is local, under Act 32.
          There is no matching credit on the state return: the resident
          credit on the PA-40 (Schedule G-L) covers only income or wage
          tax paid to another state, and the Department of Revenue grants
          no resident credit for taxes paid to a political subdivision.
          In Somma v. Commonwealth, 45 Pa. Commw. 332 (1979), the
          Commonwealth Court denied the state credit for Philadelphia
          Wage Tax.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Relief · return-only"
        title="Tax Forgiveness and the Property Tax/Rent Rebate"
        summary="Pennsylvania eases the flat rate with Tax Forgiveness on Schedule SP, not with brackets. The rebate program is separate."
      >
        <Para>
          <strong className="text-slate-900">Tax Forgiveness (Schedule
          SP):</strong> Pennsylvania does not use graduated brackets to
          ease the burden on lower-income households. Instead, Tax
          Forgiveness can reduce or eliminate your state income tax
          entirely. You claim it by filing Schedule SP with your PA-40.
          Eligibility depends on filing status, number of dependents, and
          total eligibility income, and the forgiveness scales from 10% to
          100%. A single filer with no dependents can receive 100%
          forgiveness at eligibility income of $6,500 or less; a married
          couple with two dependent children can receive 100% forgiveness
          at $32,000 or less, with partial forgiveness on a sliding scale
          up to $34,250. Schedule SP counts all income, including amounts
          that are normally nontaxable like Social Security, because the
          eligibility calculation uses a broader income measure than the
          PA-40 itself.
        </Para>
        <Para>
          <strong className="text-slate-900">Property Tax/Rent Rebate
          Program:</strong> Pennsylvanians aged 65 and older, widows and
          widowers 50 and older, and people with disabilities 18 and older
          may qualify for a rebate of property tax or rent paid. For the
          2025 tax year the income limit is $48,110, and rebates range from
          $380 to $1,000 depending on income, with the highest rebates
          going to those earning $8,550 or less. Renters qualify too, not
          just homeowners. It is a separate application, not part of the
          PA-40.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form PA-40, the $33 filing threshold, and estimates"
        summary="Almost everyone who earns Pennsylvania income files a PA-40. Estimates are required above $14,000 of non-withheld income for 2026."
      >
        <Para>
          Every resident, part-year resident, and nonresident who earns
          enough Pennsylvania-source income to owe at least $1 in state tax
          — roughly $33 or more of gross taxable income — must file a PA-40
          return, due April 15, 2027 for the 2026 tax year. File for free
          through the Department of Revenue&apos;s myPATH portal, or mail a
          paper return to Harrisburg. If you worked in a non-reciprocal
          state, claim the resident credit on Schedule G-L, with a copy of
          the other state&apos;s return and the W-2 showing its withholding
          — but you may not claim that credit for tax paid to a reciprocal
          state.
        </Para>
        <Para>
          If you have income that is not subject to employer withholding —
          freelance earnings, rental income, investment gains — you must
          make quarterly estimated payments for 2026 if you expect to owe
          at least $430 in tax after withholding and credits, which
          corresponds to roughly $14,000 of income not subject to
          withholding at the 3.07% rate. The threshold rises to $17,000 in
          2027 and $20,000 in 2028. The four due dates are April 15, June
          15, and September 15, 2026, and January 15, 2027, paid on Form
          PA-40 ES or through myPATH.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* WIRING                                                              */
/* ------------------------------------------------------------------ */

export function BatchContent({ slug }: { slug: string }) {
  switch (slug) {
    case "maine-paycheck-calculator":
      return <MaineContent />;
    case "vermont-paycheck-calculator":
      return <VermontContent />;
    case "new-hampshire-paycheck-calculator":
      return <NewHampshireContent />;
    case "massachusetts-paycheck-calculator":
      return <MassachusettsContent />;
    case "rhode-island-paycheck-calculator":
      return <RhodeIslandContent />;
    case "connecticut-paycheck-calculator":
      return <ConnecticutContent />;
    case "new-jersey-paycheck-calculator":
      return <NewJerseyContent />;
    case "pennsylvania-paycheck-calculator":
      return <PennsylvaniaContent />;
    default:
      return null;
  }
}

export const BATCH_FAQS: Record<string, FaqItem[]> = {
  "maine-paycheck-calculator": [
    {
      q: "How much Maine state tax will I pay on $60,000 a year?",
      a: `On $60,000 of wages, the calculator estimates ${formatAmountOrUnavailable(EX_ME_60.annualState)} a year in Maine income tax. That figure uses the 2026 standard deduction of $15,700 for single filers ($31,400 joint) from Maine Revenue Services' revised August 2026 withholding tables, plus the $5,300 personal exemption.`,
    },
    {
      q: "What is Maine's standard deduction for 2026?",
      a: "For tax year 2026, Maine's basic standard deduction is $15,700 for single filers, $31,400 for married filing jointly, and $23,550 for heads of household, plus an extra amount if you are 65 or older or blind. It phases out above $102,250 of Maine adjusted gross income for single filers ($204,550 joint).",
    },
    {
      q: "Does Maine have a local income tax?",
      a: "No. No Maine city or town levies an income tax on wages, so the state line is the only income-tax line on a Maine pay stub besides the federal one.",
    },
    {
      q: "What is the W-4ME and how do I fill it in?",
      a: "The W-4ME is Maine's own withholding certificate — your federal W-4 does not set Maine withholding. Claim one allowance for yourself, one for your spouse, and one for each dependent; each allowance is worth $5,300 a year. If you do not submit a W-4ME, your employer must withhold at the highest rate, as if you were single with zero allowances.",
    },
    {
      q: "Does Maine tax my 401(k) contributions?",
      a: "No. Maine follows the federal treatment: your 401(k) contributions reduce your Maine taxable wages. Social Security benefits are also partially excluded from Maine taxable income, and up to $10,000 of pension income can be excluded ($6,000 for nonresidents).",
    },
    {
      q: "What is Maine's EITC worth?",
      a: "Maine's Earned Income Tax Credit is 25% of your federal EITC if you have a qualifying child, and 50% if you do not. It is refundable, so it can produce a refund even if you owe no Maine tax — but it is claimed on your annual Form 1040ME, not on your paycheck. A filer who qualifies may reduce annual Maine income tax by up to 25% (or 50% without a qualifying child) of their federal EITC, subject to eligibility, available tax liability, and phaseout.",
    },
    {
      q: "What is the Property Tax Fairness Credit?",
      a: "A refundable credit for property taxes (or 25% of rent) paid on your Maine home, claimed on Schedule PTFC/STFC with Form 1040ME. The maximum is $2,000 for residents age 65 and older. There is also a Sales Tax Fairness Credit for lower-income filers. Both are claimed on the return, not on the paycheck.",
    },
    {
      q: "What is the 2% Maine surcharge I heard about?",
      a: "From tax year 2026, Maine adds a 2% surcharge on Maine taxable income over $1,000,000 for single filers ($1,500,000 joint, $750,000 married filing separately, $1,500,000 head of household). It is separate from the 7.15% top bracket rate. It does not affect any salary in the worked examples.",
    },
    {
      q: "When is my Maine return due and how do I pay estimates?",
      a: "Form 1040ME is due April 15, 2027 for the 2026 tax year. If your Maine tax will not be covered by withholding, make quarterly estimated payments on Form 1040ES-ME, due April 15, June 15, and September 15, 2026, and January 15, 2027.",
    },
    {
      q: "I work in Maine but live in New Hampshire. What happens?",
      a: "Maine taxes the income you earn for work performed in Maine, and you file Form 1040ME as a nonresident (or Schedule NR). New Hampshire has no income tax, so there is no credit to claim — you simply pay Maine on the Maine-source wages. The reverse is also true: a Maine resident working in New Hampshire pays Maine tax on all of it, because New Hampshire withholds nothing.",
    },
    {
      q: "What shows on my Maine pay stub for PFML?",
      a: "Maine's Paid Family and Medical Leave program exists, and contributions may appear as a separate line on your stub. The calculator does not model it — the rate and employee share were not verified from an official source at the time of writing — so your stub may show a small additional deduction beyond the income tax in the table above.",
    },
    {
      q: "Does Maine tax Social Security benefits?",
      a: "Partially. Maine lets you exclude a portion of Social Security benefits from taxable income, and up to $10,000 of pension income ($6,000 for nonresidents). The exclusion is claimed on the return, so it does not change the withholding on your paycheck.",
    },
  ],
  "vermont-paycheck-calculator": [
    {
      q: "How much Vermont state tax will I pay on $60,000 a year?",
      a: `On $60,000 of wages, the calculator estimates ${formatAmountOrUnavailable(EX_VT_60.annualState)} a year in Vermont income tax, for take-home pay of ${formatUSD(EX_VT_60.annualNet)}. At $150,000 the estimate is ${formatAmountOrUnavailable(EX_VT_150.annualState)} a year.`,
    },
    {
      q: "How does Vermont's graduated tax work?",
      a: "Vermont taxes income in four brackets — 3.35%, 6.6%, 7.6%, and 8.75% — applied to Vermont taxable income, which is federal AGI minus the $7,650 standard deduction and $5,300 in exemptions. Each rate applies only to the dollars inside its band, so your marginal rate is always higher than your effective rate.",
    },
    {
      q: "What is the 3% federal AGI floor in Vermont?",
      a: "If your federal AGI is over $150,000, you must pay the greater of your regular Vermont tax or 3% of your federal AGI. At $150,000 of wages that floor is not yet in play, but it can raise the bill of higher earners beyond what the bracket walk alone suggests.",
    },
    {
      q: "What is the W-4VT and how do I fill it in?",
      a: "The W-4VT is Vermont's own withholding certificate. Claim one allowance for yourself, one for your spouse, and one for each dependent; each allowance is worth $5,400 a year ($207.69 per biweekly paycheck). If you put extra withholding on your federal W-4, Vermont automatically adds 30% of that amount to your Vermont withholding.",
    },
    {
      q: "Does Vermont have a local income tax?",
      a: "No. No Vermont city or town levies an income tax on wages, so the state line is the only income-tax line on a Vermont pay stub besides the federal one.",
    },
    {
      q: "What is the Child Care Contribution on my pay stub?",
      a: "Vermont funds its Child Care Financial Assistance Program with a 0.44% payroll tax on employers, and employers may withhold up to one-quarter of it — 0.11% of your wages — from your pay. At $60,000 that is $66 a year. It funds child-care subsidies, not income tax, and it is separate from the state tax line.",
    },
    {
      q: "What is Vermont's Child Tax Credit worth?",
      a: "Up to $1,000 per qualifying child under age 6, claimed on Form IN-111. It phases out above $125,000 of adjusted gross income. A filer who qualifies may reduce annual Vermont income tax by up to $1,000 per qualifying child under 6, subject to eligibility, available tax liability, and phaseout.",
    },
    {
      q: "What is Vermont's EITC worth?",
      a: "Vermont's Earned Income Tax Credit is 38% of your federal EITC, refundable. A filer who qualifies may reduce annual Vermont income tax by up to 38% of their federal EITC, subject to eligibility, available tax liability, and phaseout. Vermont also gives a Child and Dependent Care Credit of 72% of the federal credit.",
    },
    {
      q: "I work in Vermont but live in New Hampshire. What happens?",
      a: "Vermont withholds tax on wages earned for work performed in Vermont, even if you live across the border. You file a Vermont nonresident return (Form IN-111 with Schedule IN-113) and pay Vermont on the Vermont-source wages. New Hampshire withholds nothing, so there is no credit to claim on the New Hampshire side.",
    },
    {
      q: "When is my Vermont return due and how do I pay estimates?",
      a: "Form IN-111 is due April 15, 2027 for the 2026 tax year. If your Vermont tax will not be covered by withholding, make quarterly estimated payments on Form IN-114, due April 15, June 15, and September 15, 2026, and January 15, 2027.",
    },
    {
      q: "Does Vermont tax my retirement income?",
      a: "Vermont starts from federal AGI, so Social Security benefits are included to the extent they are federally taxable, and pension income is generally taxable. Vermont offers a limited exclusion for some retirees, but it is income-tested — check the current year's Form IN-111 instructions rather than assuming it applies.",
    },
    {
      q: "What is Form HS-122?",
      a: "The Homestead Declaration and Property Tax Credit Claim. Vermont homeowners file it to claim the property tax credit against their property tax bill. It is separate from the income tax return, though it is often filed at the same time.",
    },
  ],
  "new-hampshire-paycheck-calculator": [
    {
      q: "Does New Hampshire have an income tax?",
      a: "No. New Hampshire has no tax on wages, salaries, or other compensation, and no tax on interest and dividends since January 1, 2025. Your pay stub shows federal tax, Social Security, and Medicare — and no state income-tax line at all.",
    },
    {
      q: "How much do I take home on $60,000 in New Hampshire?",
      a: `On $60,000 of wages, the calculator estimates take-home pay of ${formatUSD(EX_NH_60.annualNet)} a year — ${formatUSD(EX_NH_60.annualStateInsurance)} more than the same salary would leave in California, where the state tax alone is ${formatAmountOrUnavailable(EX_CA_60.annualState)}. The only deductions are federal tax and FICA.`,
    },
    {
      q: "What happened to the Interest and Dividends tax?",
      a: "It was repealed by HB2 in the 2023 legislative session, effective January 1, 2025 — a year earlier than the original schedule. It used to tax interest and dividends over $2,400 ($4,800 joint) at 3% in its final year. No 2025 return is required, and any estimated I&D payments for 2025 should not have been filed.",
    },
    {
      q: "Is there a New Hampshire withholding form?",
      a: "No. There is no state withholding form, no state withholding at all, and no New Hampshire income tax return to file. Your employer only withholds federal tax, Social Security, and Medicare.",
    },
    {
      q: "If New Hampshire has no income tax, how does the state raise revenue?",
      a: "Mostly from property tax, which is levied locally and is among the highest in the country, plus business taxes (the Business Profits Tax and Business Enterprise Tax), the Meals and Rooms Tax, the Communications Services Tax, tobacco taxes, and the Real Estate Transfer Tax. The Department of Revenue Administration collects about 80% of the state's general taxes.",
    },
    {
      q: "I live in New Hampshire but work in Massachusetts. What happens?",
      a: "Massachusetts taxes the wages you earn there, and your Massachusetts employer withholds Massachusetts tax. New Hampshire offers no credit for it — there is no New Hampshire income tax to credit against. The same applies if you work in Vermont. This is the one place where living in a no-tax state does not save you tax.",
    },
    {
      q: "Does New Hampshire have a sales tax?",
      a: "No. New Hampshire has no general sales tax and no local sales tax. Combined with no income tax, that is why the state is often called the most tax-friendly in the Northeast — but the property tax on a home is usually much higher than in neighboring states.",
    },
    {
      q: "What does my New Hampshire pay stub show?",
      a: "Federal income tax withholding, Social Security (6.2% up to the wage base), and Medicare (1.45%, plus 0.9% additional Medicare tax above $200,000). No state income-tax line, no state disability line, no state paid-leave line. If you see a state line, it is almost certainly another state's tax — for example Massachusetts withholding if you commute.",
    },
    {
      q: "Do I need to file anything with New Hampshire for my wages?",
      a: "No. There is no individual income tax return in New Hampshire. The only state-level filing that touches most residents is the property tax side: your town's property tax bill, and any exemption or credit applications your town offers.",
    },
    {
      q: "Is New Hampshire really cheaper than Massachusetts or New York?",
      a: `On a $60,000 salary, yes on the income-tax line alone: New Hampshire takes ${formatAmountOrUnavailable(EX_NH_60.annualState)} in state tax, while Massachusetts takes ${formatAmountOrUnavailable(EX_MA_60.annualState)} plus PFML, and New York takes ${formatAmountOrUnavailable(EX_NY_60.annualState)}. Whether the state is cheaper overall depends on property tax — New Hampshire's rates are far higher, so a homeowner may pay more in total than a renter would.`,
    },
    {
      q: "Can New Hampshire audit my old Interest and Dividends returns?",
      a: "Yes. Repeal is not retroactive: the Department of Revenue Administration can still audit, assess, and collect tax for periods before January 1, 2025. If you owed I&D tax for 2024 or earlier, those years are still open.",
    },
  ],
  "massachusetts-paycheck-calculator": [
    {
      q: "How much Massachusetts state tax will I pay on $60,000 a year?",
      a: `On $60,000 of wages, the calculator estimates ${formatAmountOrUnavailable(EX_MA_60.annualState)} a year in Massachusetts income tax, plus ${formatUSD(EX_MA_60.annualStateInsurance)} in PFML, for take-home pay of ${formatUSD(EX_MA_60.annualNet)}. At $150,000 the tax is ${formatAmountOrUnavailable(EX_MA_150.annualState)} a year plus ${formatUSD(EX_MA_150.annualStateInsurance)} in PFML.`,
    },
    {
      q: "Is Massachusetts tax really a flat 5%?",
      a: "Yes, on taxable income. Every dollar of Massachusetts taxable income is taxed at 5%, after the $4,400 personal exemption. There are no brackets. The only wrinkle is the 4% surtax on taxable income over $1,000,000 (indexed annually), which makes the top rate 9% — and only on the dollars above the threshold.",
    },
    {
      q: "What is the M-4 and how do I fill it in?",
      a: "Form M-4 is Massachusetts' own withholding exemption certificate. File it when you are hired — your federal W-4 does not set Massachusetts withholding. One exemption is worth $4,400 a year, and each additional exemption is worth $1,000. If you never submit an M-4, your employer must withhold as though you claimed zero exemptions.",
    },
    {
      q: "What is MA PFML and how much is withheld?",
      a: `MA PFML is Paid Family and Medical Leave, funded by a payroll contribution. In 2026 the most your employer may withhold from your pay is 0.46% of wages — ${formatUSD(EX_MA_60.annualStateInsurance)} a year at $60,000 — up to the $184,500 Social Security wage base. Your employer may cover some or all of the employee share, so your stub can show less than the maximum.`,
    },
    {
      q: "Does Massachusetts have a local income tax?",
      a: "No. No Massachusetts city or county levies an income tax on wages, so the state line and the PFML line are the only Massachusetts lines on your pay stub besides the federal one.",
    },
    {
      q: "What is Massachusetts' EITC worth?",
      a: "Massachusetts' Earned Income Tax Credit is 40% of your federal EITC, refundable, claimed on Form 1. A filer who qualifies may reduce annual Massachusetts income tax by up to 40% of their federal EITC, subject to eligibility, available tax liability, and phaseout. You must have been a Massachusetts resident for at least part of the year; full-year nonresidents are not eligible.",
    },
    {
      q: "What is the Child and Family Tax Credit?",
      a: "$440 for each eligible individual — a dependent child under age 13, a disabled dependent or spouse, or a dependent age 65 or over — with no limit on the number of individuals. Single, head-of-household, and joint filers qualify; married filing separately does not. A filer who qualifies may reduce annual Massachusetts income tax by up to $440 per eligible individual, subject to eligibility, available tax liability, and phaseout.",
    },
    {
      q: "Does Massachusetts tax my 401(k) contributions?",
      a: "No. Massachusetts follows the federal treatment: 401(k) contributions reduce your Massachusetts taxable wages. The same is true of Section 125 health premiums, flexible spending accounts, and HSAs — Massachusetts conforms to the Internal Revenue Code on these, unlike New Jersey.",
    },
    {
      q: "When is my Massachusetts return due and how do I pay estimates?",
      a: "Form 1 is due April 15, 2027 for the 2026 tax year; nonresidents and part-year residents file Form 1-NR/PY. If your Massachusetts tax will not be covered by withholding, make estimated payments on Form 1-ES in four quarterly installments, due April 15, June 15, and September 15, 2026, and January 15, 2027.",
    },
    {
      q: "What is the Circuit Breaker credit?",
      a: "A credit for homeowners and renters age 65 or older whose property tax (or 25% of rent) is high relative to income. It is claimed on the annual return, not on your paycheck — like the EITC and the Child and Family Tax Credit, it does not lower the withholding on your stub.",
    },
    {
      q: "I live in New Hampshire but work in Massachusetts. What happens?",
      a: "Massachusetts taxes the wages you earn there and withholds it, even though you live in a no-tax state. New Hampshire offers no credit for it, so the Massachusetts tax is a real cost of commuting. File Form 1-NR/PY as a nonresident.",
    },
    {
      q: "Does the PFML split change in 2027?",
      a: "Yes, but only in which half the employee share comes from. From January 1, 2027 the family-leave share your employer may withhold becomes 0.28% (up to 40% of a larger family portion) and the medical-leave share becomes 0.18% (up to 100%), under Chapter 101 of the Acts of 2026. The 0.46% maximum employee share is unchanged.",
    },
  ],
  "rhode-island-paycheck-calculator": [
    {
      q: "How much Rhode Island state tax will I pay on $60,000 a year?",
      a: `On $60,000 of wages, the calculator estimates ${formatAmountOrUnavailable(EX_RI_60.annualState)} a year in Rhode Island income tax, plus ${formatUSD(EX_RI_60.annualStateInsurance)} in TDI, for take-home pay of ${formatUSD(EX_RI_60.annualNet)}. At $150,000 the tax is ${formatAmountOrUnavailable(EX_RI_150.annualState)} a year plus ${formatUSD(EX_RI_150.annualStateInsurance)} in TDI.`,
    },
    {
      q: "How does Rhode Island's tax work?",
      a: "Rhode Island taxes income in three brackets — 3.75%, 4.75%, then 5.99% — after the $11,200 standard deduction and a $5,250 personal exemption per person. One schedule covers every filing status: the same thresholds apply whether you file single or joint.",
    },
    {
      q: "What is RI TDI and how much is withheld?",
      a: `Temporary Disability Insurance is a mandatory employee payroll deduction of 1.1% of wages up to a $100,000 wage base in 2026, for a maximum of $1,100 a year. At $60,000 that is ${formatUSD(EX_RI_60.annualStateInsurance)} a year. The rate fell from 1.3% in 2025, so the annual maximum fell from $1,159.60.`,
    },
    {
      q: "What is the RI W-4 and how do I fill it in?",
      a: "Form RI W-4 is Rhode Island's own withholding allowance certificate — Rhode Island does not accept the federal W-4 for state withholding. It has no filing-status box at all, because the state uses one withholding schedule for every filing status. Claim your allowances on it; claiming none means withholding is figured on the full annualized wage, the heaviest outcome.",
    },
    {
      q: "Does Rhode Island have a local income tax?",
      a: "No. No Rhode Island city or town levies an income tax on wages, so the state line and the TDI line are the only Rhode Island lines on your pay stub besides the federal one.",
    },
    {
      q: "What is Rhode Island's EITC worth?",
      a: "16% of your federal earned income credit, claimed on RI Schedule EIC with Form RI-1040. A filer who qualifies may reduce annual Rhode Island income tax by up to 16% of their federal EITC, subject to eligibility, available tax liability, and phaseout. The credit cannot exceed the Rhode Island income tax except for the refundable portion the statute provides.",
    },
    {
      q: "What is the child and dependent care credit in Rhode Island?",
      a: "25% of the federal credit, claimed on RI Schedule I. A filer who qualifies may reduce annual Rhode Island income tax by up to 25% of their federal child and dependent care credit, subject to eligibility, available tax liability, and phaseout.",
    },
    {
      q: "Does Rhode Island tax my Social Security or pension?",
      a: "Rhode Island starts from federal AGI, so Social Security benefits are included to the extent they are federally taxable, but the state lets you subtract Social Security benefits and pension and annuity income below federal-AGI limits, on worksheets in the RI-1040 instructions. The limits are income-tested, so check the current year's worksheet rather than assuming the exclusion applies.",
    },
    {
      q: "When is my Rhode Island return due and how do I pay estimates?",
      a: "Form RI-1040 is due April 15, 2027 for the 2026 tax year. An extension (Form RI-4868) gives an automatic six months to file, but not to pay — any tax due must still be paid by the original deadline. If your Rhode Island tax will not be covered by withholding, make estimated payments on Form RI-1040ES.",
    },
    {
      q: "I live in Rhode Island but work in Massachusetts. Do I pay tax twice?",
      a: "No. Massachusetts withholds tax on the wages you earn there, and Rhode Island gives you a credit for income taxes paid to another state (RI Schedule II), so the same wages are not taxed twice. You still file a Rhode Island return on all of your income, then claim the credit.",
    },
    {
      q: "What is Temporary Caregiver Insurance?",
      a: "Up to seven weeks of paid leave to bond with a new child or care for a seriously ill family member. It is part of the TDI program, funded by the same 1.1% contribution — there is no separate caregiver line on your stub.",
    },
    {
      q: "Can I claim TDI as income tax withheld on my return?",
      a: "No. TDI payments cannot be claimed as income tax withheld — they are non-refundable and stay separate from your income tax. If you work for more than one employer and combined wages pass $100,000, the extra TDI withheld can be reclaimed on Form TX-16.",
    },
  ],
  "connecticut-paycheck-calculator": [
    {
      q: "How much Connecticut state tax will I pay on $60,000 a year?",
      a: `About ${formatAmountOrUnavailable(EX_CT_60.annualState)} a year — and that figure already includes the whole Tax Calculation Schedule, not just the brackets. At $60,000 the $15,000 personal exemption is already gone, so the tax is computed on the full $60,000; the Table C 2% phase-out add-back adds ${formatUSD(ctTableCAddBack(60000))} (Table C: $25 per $5,000 of Connecticut AGI above $56,500 for a single filer), and the 10% personal tax credit then leaves ${formatUSD(ctCorrectedTax(60000, 0.1))} — the same figure the worked-examples table shows. At $30,000 the exemption is still whole and the add-back is $0, so the 15% credit alone applies, leaving about ${formatUSD(ctCorrectedTax(30000, 0.15))}, again matching the table.`,
    },
    {
      q: "Why is my Connecticut tax lower than the bracket math suggests?",
      a: `Because of the personal tax credit (Table E of the CT-1040 instructions) — and, at middle incomes, the exemption phaseout and the Table C add-back pushing the other way. The credit cuts the tax by up to 75% at the lowest incomes and slides to 0% once Connecticut AGI passes $64,500 for single filers. The $15,000 personal exemption phases out above $30,000 of AGI, so at $60,000 the tax is computed on the full $60,000 before the 10% credit applies — and the Table C 2% phase-out add-back adds ${formatUSD(ctTableCAddBack(60000))} at $60,000 ($25 per $5,000 of AGI above $56,500 for a single filer), so the tax is ${formatUSD(ctCorrectedTax(60000, 0.1))}. The calculator models the full schedule — Table A phaseout, Table E credit, Table C add-back, and Table D recapture — so the worked-examples table shows that figure directly, with no partial-calculation flag.`,
    },
    {
      q: "What is the benefit recapture in Connecticut?",
      a: `At higher incomes, Connecticut adds tax back. The recapture phases in above $105,000 of Connecticut AGI for single filers, and the calculator models it (Table D of the Tax Calculation Schedule), so at $150,000 the ${formatAmountOrUnavailable(EX_CT_150.annualState)} in the worked-examples table already includes the recapture on top of the bracket tax and the Table C add-back — it is the complete liability, not the bracket figure alone.`,
    },
    {
      q: "What is Form CT-W4 and how do I fill it in?",
      a: "Form CT-W4 is Connecticut's withholding certificate. It does not use an allowance count — you select a withholding code (A through F) based on your filing status and expected income, and the Department of Revenue Services' calculation rules turn that code plus your annualized salary into the withholding. If no CT-W4 is filed, Connecticut requires withholding at the highest rate.",
    },
    {
      q: "Does Connecticut have a local income tax?",
      a: "No. All 169 municipalities in Connecticut levy 0% local income tax, so the state line and the CT Paid Leave line are the only Connecticut lines on your pay stub besides the federal one.",
    },
    {
      q: "What is CT Paid Leave and how much is withheld?",
      a: `CT Paid Leave is an employee-paid contribution of 0.5% of wages up to the $184,500 Social Security wage base — a maximum of $922.50 a year. At $60,000 that is ${formatUSD(EX_CT_60.annualStateInsurance)} a year. It applies to every Connecticut employer with one or more employees.`,
    },
    {
      q: "What is Connecticut's EITC worth?",
      a: "40% of your federal earned income credit, claimed on Schedule CT-EITC — plus an additional $250 if you have at least one qualifying child for federal purposes. A filer who qualifies may reduce annual Connecticut income tax by up to 40% of their federal EITC plus $250 with a qualifying child, subject to eligibility, available tax liability, and phaseout. Nonresidents and part-year residents do not qualify.",
    },
    {
      q: "What is the Connecticut property tax credit?",
      a: "Up to $300 per return for Connecticut residents who paid qualifying property tax on their primary residence and/or motor vehicle. It can offset only your income tax — it is not refundable and cannot be carried forward — and the amount depends on your Connecticut AGI: single filers with AGI of $49,500 or less get the full credit before the phase-down table applies.",
    },
    {
      q: "Does Connecticut have reciprocity with any state?",
      a: "No. Connecticut has no reciprocity with any state. A nonresident who works in Connecticut has Connecticut tax withheld and takes a credit for it on the home-state return.",
    },
    {
      q: "When is my Connecticut return due and how do I pay estimates?",
      a: "Form CT-1040 is due April 15, 2027 for the 2026 tax year; nonresidents and part-year residents file Form CT-1040NR/PY. If your Connecticut tax will not be covered by withholding, make estimated payments on Form CT-1040ES in four quarterly installments, due April 15, June 15, and September 15, 2026, and January 15, 2027.",
    },
    {
      q: "Does Connecticut tax my Social Security or pension?",
      a: "Connecticut lets you subtract Social Security benefits and pension and annuity income below income limits. The Social Security adjustment worksheet applies when federal AGI is $75,000 or more for single filers ($100,000 joint), and the pension exclusion phases out over its own table. Check the current year's worksheets rather than assuming the exclusion applies at your income.",
    },
    {
      q: "Do I owe Connecticut tax if my income is very low?",
      a: "If your Connecticut AGI is $15,000 or less as a single filer ($24,000 or less joint), you owe no income tax at all. Above that, the seven rates run from 2% to 6.99%, reduced by the personal tax credit.",
    },
  ],
  "new-jersey-paycheck-calculator": [
    {
      q: "How much New Jersey state tax will I pay on $60,000 a year?",
      a: `On $60,000 of wages, the calculator estimates ${formatAmountOrUnavailable(EX_NJ_60.annualState)} a year in New Jersey income tax, plus ${formatUSD(EX_NJ_60.annualStateInsurance)} a year in payroll programs (TDI, FLI, and UI/WF), for take-home pay of ${formatUSD(EX_NJ_60.annualNet)}. At $150,000 the tax is ${formatAmountOrUnavailable(EX_NJ_150.annualState)} a year plus ${formatUSD(EX_NJ_150.annualStateInsurance)} in payroll programs.`,
    },
    {
      q: "Why does my New Jersey pay stub have four state lines?",
      a: "Because New Jersey charges income tax plus three payroll programs: Temporary Disability Insurance (0.19%), Family Leave Insurance (0.23%), and Unemployment Insurance plus the Workforce Development Fund (0.425% on the first $44,800). Each is withheld from every paycheck until its wage base is reached.",
    },
    {
      q: "What is the NJ-W4 and how do I fill it in?",
      a: "Form NJ-W4 is New Jersey's withholding allowance certificate. Line 2 sets your rate table: Single or Married Filing Separately puts you on Rate A; Joint, Head of Household, or Qualifying Widow(er) puts you on Rate B. Line 3's wage chart (letters A–E) matters for joint and head-of-household filers with taxable income over $50,000. Line 6's exemption applies only if your wages plus taxable nonwage income will be $10,000 or less ($20,000 joint), and it must be renewed every year.",
    },
    {
      q: "Does New Jersey have a local income tax?",
      a: "No. No New Jersey city or county levies an income tax on wages, so the state tax and the three payroll programs are the whole New Jersey layer on your stub.",
    },
    {
      q: "Why didn't my HSA or health premiums lower my New Jersey tax?",
      a: "New Jersey does not adopt Internal Revenue Code Section 125. Section 125 health premiums, flexible spending accounts, and HSAs are taxed in New Jersey and do not reduce your New Jersey taxable wages. 401(k) contributions are the exception — they are excluded. Raising your health-premium or HSA contribution lowers your federal tax but leaves your New Jersey tax untouched.",
    },
    {
      q: "What is New Jersey's EITC worth?",
      a: "Generally 40% of your federal earned income tax credit, claimed on Form NJ-1040, and refundable. A filer who qualifies may reduce annual New Jersey income tax by up to 40% of their federal EITC, subject to eligibility, available tax liability, and phaseout. New Jersey also expanded age eligibility for workers without qualifying children.",
    },
    {
      q: "What is the New Jersey Child Tax Credit worth in 2026?",
      a: "Up to $1,250 per child aged 5 or younger for tax years 2026 through 2028 — a 25% increase over the $1,000 credit, enacted by P.L.2026, c.22. It phases down as taxable income rises toward $80,000. A filer who qualifies may reduce annual New Jersey income tax by up to $1,250 per qualifying young child, subject to eligibility, available tax liability, and phaseout.",
    },
    {
      q: "What is ANCHOR and do I qualify?",
      a: "ANCHOR is a direct payment for homeowners and renters, not a credit on the return — up to $1,500 for homeowners with gross income of $150,000 or less ($1,000 between $150,001 and $250,000), up to $450 for renters, with an additional $250 for applicants age 65 or older. It is filed on the PAS-1 application, which also covers the Senior Freeze and Stay NJ programs for homeowners 65 and older.",
    },
    {
      q: "When is my New Jersey return due and how do I pay estimates?",
      a: "Form NJ-1040 is due April 15, 2027 for the 2026 tax year; nonresidents file Form NJ-1040NR. If you expect to owe more than $400 in New Jersey income tax after withholding and credits, you must make estimated payments on Form NJ-1040-ES in four equal installments, due April 15, June 15, and September 15, 2026, and January 15, 2027 — or ask your employer to withhold more on a new NJ-W4.",
    },
    {
      q: "I live in New Jersey but work in New York. Do I pay tax twice?",
      a: "No. New York withholds tax on the wages you earn there, and you claim a credit on your New Jersey return for tax paid to New York. If you work in Pennsylvania instead, the two states' reciprocity agreement means Pennsylvania does not tax the compensation at all — file Form REV-419 with your Pennsylvania employer so Pennsylvania withholding stops.",
    },
    {
      q: "What is New Jersey's top tax rate?",
      a: "10.75% — the highest on the East Coast — starting at $1,000,000 of taxable income for single filers. At $150,000 the marginal rate is 6.37%, and at $60,000 it is 5.53%.",
    },
    {
      q: "Can I claim the Child Tax Credit if I don't have to file?",
      a: "Yes. Households with low or no income who are not required to file can claim the Child Tax Credit through the Division of Taxation's free SimpleFile tool.",
    },
  ],
  "pennsylvania-paycheck-calculator": [
    {
      q: "How much Pennsylvania state tax will I pay on $60,000 a year?",
      a: `On $60,000 of wages, the calculator estimates ${formatAmountOrUnavailable(EX_PA_60.annualState)} a year in Pennsylvania state tax — 3.07% of every dollar, with nothing subtracted first. Add the typical 1% local earned income tax (${formatUSD(60000 * 0.01)}) and the combined state-plus-local rate is 4.07% of gross wages.`,
    },
    {
      q: "Is Pennsylvania tax really a flat 3.07%?",
      a: "Yes. One rate, no brackets, no standard deduction, no personal exemption. The rate is the same whether you earn $30,000 or $300,000. Pennsylvania sorts taxable income into eight classes — compensation, interest, dividends, business profits, gains, rents, estate and trust income, and gambling winnings — and losses in one class generally cannot offset income in another.",
    },
    {
      q: "Is there a Pennsylvania withholding form?",
      a: "No. Pennsylvania has no state withholding certificate — there is no Pennsylvania equivalent of the federal W-4. Your employer simply withholds 3.07% of your Pennsylvania-taxable compensation. The form you do sign is the local Residency Certification Form (DCED CLGS-32-6), which carries your six-digit PSD code so payroll withholds the correct local earned income tax.",
    },
    {
      q: "What is the local earned income tax and how much is it?",
      a: `Under Act 32 of 2008, every municipality and school district levies a local earned income tax — commonly 1% in total. At $60,000 that is ${formatUSD(60000 * 0.01)} a year. Your employer withholds the higher of your resident rate or the rate where you work, and a resident credit covers tax withheld at the work location, up to the home rate. You still have to file an annual local EIT return with your Tax Collection District's appointed collector.`,
    },
    {
      q: "What is the Philadelphia Wage Tax?",
      a: `Philadelphia charges its own Wage Tax instead of the EIT: 3.735% for residents and 3.425% for nonresidents on pay dates from July 1, 2026. At $60,000 that is ${formatUSD(60000 * 0.03735)} a year for a resident and ${formatUSD(60000 * 0.03425)} for a commuter — on top of the ${formatAmountOrUnavailable(EX_PA_60.annualState)} in state tax. Philadelphia residents pay the resident rate on all earned income regardless of where the work is performed; nonresidents pay only on wages earned inside the city.`,
    },
    {
      q: "Does Pennsylvania tax my 401(k) contributions?",
      a: "Yes. Pennsylvania taxes 401(k), 403(b), and 457(b) employee contributions — they do not reduce your Pennsylvania taxable wages, so raising your 401(k) lowers your federal tax but leaves your Pennsylvania tax untouched. Section 125 health premiums are excluded, and an HSA contributed through a payroll Section 125 plan is excluded; dependent-care FSAs are taxed.",
    },
    {
      q: "What is Tax Forgiveness and do I qualify?",
      a: "Tax Forgiveness can reduce or eliminate your state income tax entirely. You claim it by filing Schedule SP with your PA-40. A single filer with no dependents can receive 100% forgiveness at eligibility income of $6,500 or less; a married couple with two dependent children can receive 100% forgiveness at $32,000 or less, with partial forgiveness on a sliding scale up to $34,250. Schedule SP counts all income, including amounts that are normally nontaxable like Social Security.",
    },
    {
      q: "What is the Property Tax/Rent Rebate Program?",
      a: "Pennsylvanians aged 65 and older, widows and widowers 50 and older, and people with disabilities 18 and older may qualify for a rebate of property tax or rent paid. For the 2025 tax year the income limit is $48,110, and rebates range from $380 to $1,000 depending on income. Renters qualify too, not just homeowners. It is a separate application, not part of the PA-40.",
    },
    {
      q: "I live in Pennsylvania but work in New Jersey. What happens?",
      a: "Pennsylvania and New Jersey have a reciprocity agreement covering employee compensation: New Jersey does not tax it, and you file Form REV-419 with your New Jersey employer so New Jersey withholding stops. You pay Pennsylvania tax instead. The same agreement covers Indiana, Maryland, Ohio, Virginia, and West Virginia.",
    },
    {
      q: "When is my Pennsylvania return due and how do I pay estimates?",
      a: "Form PA-40 is due April 15, 2027 for the 2026 tax year. Almost everyone who earns Pennsylvania income files — you must file if you owe at least $1 in state tax, roughly $33 or more of gross taxable income. If you have income that is not subject to employer withholding, you must make quarterly estimated payments for 2026 if you expect to owe at least $430 in tax after withholding and credits, which corresponds to roughly $14,000 of non-withheld income. The four due dates are April 15, June 15, and September 15, 2026, and January 15, 2027.",
    },
    {
      q: "What is the Local Services Tax?",
      a: "Most Pennsylvania municipalities levy a Local Services Tax of up to $52 a year, divided across your pay periods. Anyone expecting to earn under $12,000 in that municipality can file for an exemption where the tax is over $10. Philadelphia does not levy an LST.",
    },
    {
      q: "Do I have to file a local return even if withholding was perfect?",
      a: "Yes. You still have to file an annual local EIT return with your Tax Collection District's appointed collector, even if withholding was perfect. The local return is separate from your PA-40.",
    },
  ],
};

export const BATCH_SOURCES: Record<string, { label: string; url: string }[]> = {
  "maine-paycheck-calculator": [
    { label: "Maine Revenue Services — 2026 Withholding Tables & Instructions", url: "https://www.maine.gov/revenue/sites/maine.gov.revenue/files/inline-files/26_wh_tab_instr_August2026.pdf" },
    { label: "Maine Legislature — EITC, Property Tax Fairness Credit & dependent exemption credit", url: "https://legislature.maine.gov/doc/12343" },
  ],
  "vermont-paycheck-calculator": [
    { label: "Vermont Department of Taxes — Personal Income Tax", url: "https://tax.vermont.gov/personal-income-tax" },
    { label: "Vermont Department of Taxes — 2025 IN-112 Instructions (credits & filing)", url: "https://tax.vermont.gov/sites/tax/files/documents/IN-112-Instr-2025.pdf" },
    { label: "Vermont Department of Taxes — How to File checklist", url: "https://tax.vermont.gov/individuals/how-to-file/checklist" },
    { label: "Vermont Department of Taxes — 2026 Withholding Instructions, Tables & Charts (GB-1210)", url: "https://tax.vermont.gov/sites/tax/files/documents/GB-1210-2026.pdf" },
  ],
  "new-hampshire-paycheck-calculator": [
    { label: "NH Department of Revenue Administration — Repeal of the Interest and Dividends Tax now in effect", url: "https://www.revenue.nh.gov/news-and-media/repeal-nh-interest-and-dividends-tax-now-effect" },
  ],
  "massachusetts-paycheck-calculator": [
    { label: "Massachusetts Department of Revenue — Earned Income Tax Credit", url: "https://www.mass.gov/info-details/earned-income-tax-credit-eitc" },
    { label: "Massachusetts Department of Revenue — Child and Family Tax Credit", url: "https://www.mass.gov/info-details/massachusetts-child-and-family-tax-credit" },
    { label: "Massachusetts Department of Revenue — PFML employer contribution rates", url: "https://www.mass.gov/info-details/paid-family-and-medical-leave-employer-contribution-rates-and-calculator" },
  ],
  "rhode-island-paycheck-calculator": [
    { label: "RI Division of Taxation — 2026 RI-1040 Instructions", url: "https://tax.ri.gov/sites/g/files/xkgbur541/files/2026-11/2026%201040R%20Instructions_112026_b.pdf" },
    { label: "RI Department of Labor and Training — 2026 tax rates: UI and TDI", url: "https://dlt.ri.gov/press-releases/2026-tax-rates-unemployment-insurance-and-temporary-disability-insurance" },
    { label: "RI Division of Taxation — home (individual income tax, forms & guidance)", url: "https://tax.ri.gov/" },
  ],
  "connecticut-paycheck-calculator": [
    { label: "CT Department of Revenue Services — Resident income tax information", url: "https://portal.ct.gov/drs/individuals/resident-income-tax/tax-information" },
    { label: "CT Department of Revenue Services — 2025 CT-1040 Instructions (Table E & credits)", url: "https://portal.ct.gov/-/media/drs/forms/2025/income/2025-ct-1040-instructions_1225.pdf?rev=d898db2e610641b9b3e6efe6f89c6fc2&hash=06D5D5DF44FBF63ABF90A972C507F9FE" },
    { label: "CT Paid Leave Authority — Remit contributions", url: "https://www.ctpaidleave.org/remit-contributions" },
  ],
  "new-jersey-paycheck-calculator": [
    { label: "NJ Division of Taxation — Form NJ-W4", url: "https://nj.gov/treasury/unclaimed-property/treasury/taxation/pdf/current/njw4.pdf" },
    { label: "NJ Division of Taxation — 2026 NJ-1040-ES instructions", url: "https://nj.gov/treasury/taxation/taxamnesty/treasury/taxation/pdf/current/1040esi.pdf" },
    { label: "NJ Department of Labor — Employer rate information (TDI/FLI/UI)", url: "https://www.nj.gov/labor/ea/employer-services/rate-info/" },
    { label: "NJ Division of Taxation — Property tax relief (ANCHOR)", url: "https://www.nj.gov/treasury/taxation/relief.shtml" },
  ],
  "pennsylvania-paycheck-calculator": [
    { label: "PA Department of Revenue — Reciprocity with other states", url: "https://revenue-pa.custhelp.com/app/answers/detail/a_id/268" },
    { label: "PA Personal Income Tax Guide — Deductions and Credits (resident credit)", url: "https://www.pa.gov/agencies/revenue/forms-and-publications/pa-personal-income-tax-guide/deductions-and-credits" },
    { label: "PA Department of Revenue — REV-413(I), estimated payments", url: "https://www.pa.gov/content/dam/copapwp-pagov/en/revenue/documents/formsandpublications/formsforindividuals/pit/documents/2026/2026_rev-413i.pdf" },
    { label: "City of Philadelphia — Wage Tax rate history", url: "https://www.phila.gov/departments/department-of-revenue/forms-documents/regulations-rulings/tax-rate-history/" },
    { label: "City of Philadelphia — Wage Tax changes from July 1, 2026", url: "https://www.phila.gov/2026-06-11-what-you-need-to-know-about-changes-to-phillys-use-and-occupancy-tax/" },
  ],
};
