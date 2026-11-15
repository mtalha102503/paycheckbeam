/**
 * PaycheckBeam — South Central batch: Kentucky, Tennessee, Alabama,
 * Mississippi, Louisiana, Arkansas, Oklahoma, Missouri.
 *
 * Researched 2026-11-15 from opened official pages (see
 * ~/workspace/paycheckbeam-research/state-guides-southcentral.md).
 * Every worked-example figure is generated at render time from the
 * shared engine via examplePaycheck() — never a hardcoded string.
 *
 * No state in this batch carries "Partial calculation" rows: the
 * engine now models every rule this batch used to flag —
 * - Alabama: the deduction for federal income tax paid and the
 *   standard-deduction phase-down are both modelled (round-4 engine
 *   work). The federal-tax deduction uses the engine's own estimated
 *   federal liability, and the content labels it an estimate.
 * - Arkansas: the DFA 2026 withholding formula's 3.7% phase-in band
 *   ($94,701–$97,600) is modelled, so the $150,000 row now matches
 *   the DFA formula. The DFA $50 midrange table below $100,001 can
 *   still move the $30,000 and $60,000 rows by a few dollars.
 * - Missouri: the deduction for part of federal income tax (section
 *   143.171) is modelled, again from the engine's estimated federal
 *   liability, labelled as an estimate.
 * Louisiana rows are clean, but Louisiana withholds at 3.09% while
 * the liability rate is 3% — the difference is shown, not flagged.
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
  "kentucky-paycheck-calculator",
  "tennessee-paycheck-calculator",
  "alabama-paycheck-calculator",
  "mississippi-paycheck-calculator",
  "louisiana-paycheck-calculator",
  "arkansas-paycheck-calculator",
  "oklahoma-paycheck-calculator",
  "missouri-paycheck-calculator",
];

/**
 * Full taxable income for a wages-only single filer in states that have
 * a personal exemption on top of the standard deduction (Alabama,
 * Mississippi, Oklahoma): gross minus standard deduction minus
 * exemption. The shared stateTaxableIncome() subtracts the standard
 * deduction only, so it would overstate the taxable base for these
 * three states.
 */
function taxableIncomeFull(slug: string, gross: number): number {
  const state = getStateBySlug(slug);
  const sd = state?.standardDeductionSingle ?? 0;
  const ex = state?.exemptionSingle ?? 0;
  return Math.max(0, gross - sd - ex);
}

/** Bracket walk on the full taxable base (states with an exemption). */
function bracketDetailFull(slug: string, gross: number): string {
  const state = getStateBySlug(slug);
  const brackets = state?.brackets ?? [];
  const taxable = taxableIncomeFull(slug, gross);
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

/** Flat-rate detail line: "3.5% × $26,640 = $932.40". */
function flatDetail(slug: string, gross: number, ratePct: number): string {
  const taxable = stateTaxableIncome(slug, gross);
  return `${ratePct}% × ${formatUSD0(taxable)} = ${formatUSD((taxable * ratePct) / 100)}`;
}

/* ------------------------------------------------------------------ */
/* Shared example results reused by prose and FAQs — no engine-derived */
/* figure is ever a literal string. Computed once at module load.      */
/* ------------------------------------------------------------------ */

const EX_KY_30 = examplePaycheck("kentucky-paycheck-calculator", 30000);
const EX_KY_60 = examplePaycheck("kentucky-paycheck-calculator", 60000);
const EX_KY_150 = examplePaycheck("kentucky-paycheck-calculator", 150000);
const EX_TN_30 = examplePaycheck("tennessee-paycheck-calculator", 30000);
const EX_TN_60 = examplePaycheck("tennessee-paycheck-calculator", 60000);
const EX_TN_150 = examplePaycheck("tennessee-paycheck-calculator", 150000);
const EX_CA_60 = examplePaycheck("california-paycheck-calculator", 60000);
const EX_CA_75 = examplePaycheck("california-paycheck-calculator", 75000);
const EX_NY_60 = examplePaycheck("new-york-paycheck-calculator", 60000, "none");
const EX_NY_75 = examplePaycheck("new-york-paycheck-calculator", 75000, "none");
const EX_AL_30 = examplePaycheck("alabama-paycheck-calculator", 30000);
const EX_AL_60 = examplePaycheck("alabama-paycheck-calculator", 60000);
const EX_AL_150 = examplePaycheck("alabama-paycheck-calculator", 150000);
const EX_MS_30 = examplePaycheck("mississippi-paycheck-calculator", 30000);
const EX_MS_60 = examplePaycheck("mississippi-paycheck-calculator", 60000);
const EX_MS_150 = examplePaycheck("mississippi-paycheck-calculator", 150000);
const EX_LA_30 = examplePaycheck("louisiana-paycheck-calculator", 30000);
const EX_LA_60 = examplePaycheck("louisiana-paycheck-calculator", 60000);
const EX_LA_150 = examplePaycheck("louisiana-paycheck-calculator", 150000);
/** Louisiana withholds at 3.09% against a 3% liability rate — the
 *  withheld amount is the liability times 3.09 / 3. */
const LA_WITHHELD_60 = (EX_LA_60.annualState ?? 0) * 1.03;
const EX_AR_30 = examplePaycheck("arkansas-paycheck-calculator", 30000);
const EX_AR_60 = examplePaycheck("arkansas-paycheck-calculator", 60000);
const EX_AR_150 = examplePaycheck("arkansas-paycheck-calculator", 150000);
const EX_OK_30 = examplePaycheck("oklahoma-paycheck-calculator", 30000);
const EX_OK_60 = examplePaycheck("oklahoma-paycheck-calculator", 60000);
const EX_OK_150 = examplePaycheck("oklahoma-paycheck-calculator", 150000);
const EX_MO_30 = examplePaycheck("missouri-paycheck-calculator", 30000);
const EX_MO_60 = examplePaycheck("missouri-paycheck-calculator", 60000);
const EX_MO_150 = examplePaycheck("missouri-paycheck-calculator", 150000);

/* ------------------------------------------------------------------ */
/* KENTUCKY                                                            */
/* ------------------------------------------------------------------ */

function KentuckyContent() {
  const slug = "kentucky-paycheck-calculator";
  const state = getStateBySlug(slug);
  const rows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(slug, gross);
    return [
      formatUSD0(gross),
      formatUSD0(stateTaxableIncome(slug, gross)),
      formatAmountOrUnavailable(r.annualState),
      formatUSD(r.annualNet),
    ];
  });
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          What Kentucky tax looks like at real salaries
        </SectionTitle>
        <Para>
          Kentucky taxes wages at one flat rate — 3.5% for 2026 — after a
          $3,360 standard deduction that is the same for every filing
          status. There are no brackets to climb and no personal
          exemption on top: the whole calculation is one subtraction and
          one multiplication.
        </Para>
        <NoteBox tone="blue">
          <strong>How to read this table:</strong> the income-tax column
          is your <strong>annual state liability estimate</strong> — what
          you owe for the year, settled on your tax return. It is the
          amount withheld from your paychecks across the year, not a
          separate bill.
        </NoteBox>
        <WorkedTable
          caption="Kentucky income tax, single filer, 2026"
          headers={["Gross wages", "KY taxable income", "KY income tax", "Take-home pay"]}
          rows={rows}
          footnote={`At $60,000 the effective KY income-tax rate is ${effectiveRatePct(EX_KY_60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(EX_KY_150.annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          The $60,000 row in detail: {flatDetail(slug, 60000, 3.5)}; total{" "}
          {formatAmountOrUnavailable(EX_KY_60.annualState)}. The $30,000
          row is the same shape: {flatDetail(slug, 30000, 3.5)}. Because
          the rate is flat, the effective rate rises only a little as pay
          rises — the $3,360 deduction is a smaller share of a bigger
          salary.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department of Revenue&apos;s own terms</Eyebrow>
        <SectionTitle>
          One rate, one deduction, and a credit for small families
        </SectionTitle>
        <Para>
          Kentucky&apos;s rate has fallen in steps: 4.5% in 2023, 4% in
          2024 and 2025, and 3.5% for tax year 2026. The Department of
          Revenue states it plainly on its withholding page: &ldquo;The
          Kentucky Withholding Tax rate will be 3.5% for tax year
          2026.&rdquo; Every Kentucky wage earner is taxed at that flat
          rate with the same $3,360 standard deduction allowance —
          single, joint, and head of household alike.
        </Para>
        <Para>
          The Family Size Tax Credit is the main relief for low-income
          households. It wipes out the entire Kentucky liability for a
          family at or below 100% of the filing threshold for its family
          size, and gives a partial credit between 100% and 133% of the
          threshold. The 2025 thresholds printed on the K-4, based on the
          federal poverty level, are $15,650 for a family of one, $21,150
          for two, $26,650 for three, and $32,150 for a family of four or
          more. The credit is claimed on the annual return, not on your
          paycheck — so a low-wage worker may still see withholding
          during the year and get it back when filing.
        </Para>
        <Para>
          Kentucky does not tax Social Security benefits. Full-year
          residents file Form 740; nonresidents and part-year residents
          file Form 740-NP. The due date for 2026 returns is April 15,
          2027.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form K-4"
        title="Most Kentucky workers never fill in a K-4"
        summary="The K-4 exists only to claim an exemption from withholding or ask for extra withholding. The four exemptions and the reciprocity rules are inside."
      >
        <Para>
          Kentucky&apos;s withholding certificate is Form K-4 (42A804).
          Unlike most states, an ordinary employee does not need to give
          the employer one at all: if you do not claim an exemption or
          extra withholding, your employer is not required to keep a K-4
          on file and simply runs the flat-rate formula — 3.5% of wages
          after the $3,360 standard deduction. The form matters only when
          you want withholding to stop or change.
        </Para>
        <Para>
          There are four exemptions. First, no Kentucky liability
          expected this year — you had a full refund of Kentucky tax
          withheld last year and expect a full refund this year; the
          exemption expires February 15, 2027. Second, the Fort Campbell
          exemption for a nonresident who works only at Fort Campbell —
          revoke it within 10 days of moving or becoming a Kentucky
          resident. Third, the nonresident military spouse exemption,
          claimed on a worksheet with six yes-or-no conditions plus the
          spouse&apos;s military ID. Fourth, the reciprocal-state
          exemption. The form has no allowances, no dependents, and no
          filing-status box — it is a flat-rate state, so there is nothing
          to count.
        </Para>
        <Para>
          Kentucky has reciprocity agreements with Illinois, Indiana,
          Michigan, West Virginia, and Wisconsin: if you live in one of
          those states and work in Kentucky, complete a K-4 and file it
          with your employer, and Kentucky withholding stops — you pay
          tax only to your home state. Two states have conditions:
          Virginia only if you commute to Kentucky daily, and Ohio only
          if you are not a shareholder-employee who is a 20% or greater
          direct or indirect equity investor in an S corporation.
        </Para>
      </ExpandableSection>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Local taxes · occupational license tax</Eyebrow>
        <SectionTitle>
          Your city and county may tax the same paycheck again
        </SectionTitle>
        <Para>
          Kentucky has no county or city income tax in the usual sense,
          but most of the state levies an occupational license tax on
          gross wages — 87 of 120 counties and roughly 170 cities, as of
          January 2026. It is charged on gross wages with no deductions,
          and there is no credit against your state tax for it, so it
          stacks on top of the 3.5%.
        </Para>
        <Para>
          The big ones are in the two metro areas. Louisville Metro and
          Jefferson County together charge residents 2.2% — 1.25%
          Louisville Metro, 0.2% for the TARC transit authority, and
          0.75% for the school board. Nonresidents who work in Louisville
          pay 1.45%, because the school-board portion does not apply to
          them. Lexington-Fayette charges 2.25%, the same for residents
          and nonresidents. On the $60,000 example above, a Louisville
          resident&apos;s occupational tax would be about $1,320 a year —
          on top of the {formatAmountOrUnavailable(EX_KY_60.annualState)}{" "}
          of state tax. This calculator does not include local
          occupational tax, so check your own city and county before
          treating the table above as your full Kentucky bill.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form 740, the $500 estimated-payment line, and safe harbor"
        summary="Who must file, the April 15, 2027 deadline, and when quarterly estimates are required."
      >
        <Para>
          Full-year residents file Form 740; nonresidents and part-year
          residents file Form 740-NP. The due date for 2026 returns is
          April 15, 2027. Kentucky uses modified gross income for its
          filing thresholds — federal adjusted gross income plus interest
          from other states&apos; municipal bonds and qualifying lump-sum
          pension income.
        </Para>
        <Para>
          Estimated payments go on Form 740-ES. You must pay them if you
          expect to owe more than $500 after withholding and refundable
          credits. The four installments are due April 15, June 15, and
          September 15, 2026, and January 15, 2027. The safe harbor is
          the smaller of 90% of your 2026 tax or 100% of your 2025 tax —
          110% of the 2025 tax if your 2025 Kentucky adjusted gross
          income was over $150,000 ($75,000 if married filing
          separately). If your employer withholds enough, you never need
          Form 740-ES at all.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* TENNESSEE                                                           */
/* ------------------------------------------------------------------ */

function TennesseeContent() {
  const slug = "tennessee-paycheck-calculator";
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
          Tennessee state income tax is $0 — and here is the whole paycheck
        </SectionTitle>
        <Para>
          There is no Tennessee rate to apply, no Tennessee standard
          deduction to subtract, and no Tennessee bracket to climb. The
          state income-tax line is $0 at every wage, so the only taxes on
          a Tennessee paycheck are the federal ones.
        </Para>
        <NoteBox tone="blue">
          <strong>Annual figures:</strong> federal income tax, Social
          Security, and Medicare are the same in every state for the same
          pay — only the state column changes, and Tennessee keeps it at
          $0. Take-home pay is what is left after all of them.
        </NoteBox>
        <WorkedTable
          caption="Tennessee take-home pay, single filer, 2026 — annual"
          headers={["Gross wages", "Federal income tax", "Social Security", "Medicare", "Tennessee state tax", "Take-home pay"]}
          rows={rows}
          footnote={`The comparison is the point: the same $60,000 single filer owes ${formatAmountOrUnavailable(EX_CA_60.annualState)} a year in California (plus ${formatUSD(EX_CA_60.annualStateInsurance ?? 0)} of CA SDI) and ${formatAmountOrUnavailable(EX_NY_60.annualState)} in New York State (before New York City tax) — $0 in Tennessee. Federal tax is identical in all three states for the same W-4.`}
        />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>What $0 means in practice</Eyebrow>
        <SectionTitle>
          No Tennessee form, return, or pay-stub line — when you live and
          work in Tennessee
        </SectionTitle>
        <Para>
          Tennessee has no state income tax on wages or on any personal
          income, and a 2014 amendment to the Tennessee Constitution
          (Article II, Section 28) bars the legislature from levying any
          state or local tax on payroll or earned personal income. That
          has three practical consequences. First, there is no Tennessee
          equivalent of Kentucky&apos;s K-4 or Alabama&apos;s A-4: a
          Tennessee worker fills in only the federal Form W-4, and there
          is no state withholding form to get wrong. Second, there is no
          Tennessee income-tax return to file and no state estimated
          payments to make, because there is no tax for a return or an
          estimate to cover. Third, your pay stub simply has no state
          income-tax line — nothing is withheld, so nothing appears. The
          Department of Revenue confirms there is no local income or wage
          tax anywhere in Tennessee either.
        </Para>
        <Para>
          What still comes out is everything federal: federal income tax,
          Social Security at 6.2% up to $184,500 in 2026, and Medicare at
          1.45% plus 0.9% over $200,000. Those apply exactly as in every
          other state, and the calculator above shows them in full. All
          of that applies when you live and work in Tennessee: if you are
          a Tennessee resident who works in another state, that state can
          withhold its own income tax, and a state line can appear on
          your pay stub.
        </Para>
        <Para>
          The $0 also covers retirement: Tennessee taxes no retirement
          income, no Social Security, no dividends, no interest, and no
          capital gains. A retiree living on those sources owes Tennessee
          nothing on any of them.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How Tennessee pays for things instead</Eyebrow>
        <SectionTitle>
          Sales tax in — the honest trade-off
        </SectionTitle>
        <Para>
          Tennessee does not levy an income tax, so it must generate
          revenue from other sources, primarily sales tax. The state rate
          is 7% — tied for the second-highest state rate in the country,
          behind only California at 7.25% — and local option taxes add up
          to 2.75%, for a combined rate up to 9.75% in places like
          Nashville-Davidson and Memphis-Shelby. The statewide average
          combined rate is about 9.55%, the highest in the nation. One
          break: groceries are taxed at a reduced 4% state rate, plus the
          local rate.
        </Para>
        <Para>
          The trade-off is the mirror image of the income-tax states. A
          Tennessee paycheck keeps more — the same $75,000 single filer
          owes {formatAmountOrUnavailable(EX_CA_75.annualState)} in
          California income tax plus {formatUSD(EX_CA_75.annualStateInsurance ?? 0)}{" "}
          of CA SDI, and {formatAmountOrUnavailable(EX_NY_75.annualState)}{" "}
          in New York State, against $0 in Tennessee — but a Tennessee
          shopper pays close to a tenth of every purchase in sales tax.
          Whether the $0 wins for you depends on how much you earn
          against how much you spend.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="History · the Hall tax"
        title="Tennessee used to tax interest and dividends — the Hall tax is gone"
        summary="The Hall tax never touched wages, and it was repealed for tax periods beginning January 1, 2021. The detail is inside."
      >
        <Para>
          For decades Tennessee taxed interest and dividend income even
          though it never taxed wages. The Hall Income Tax, enacted in
          1929, peaked at 6% and was phased down one point a year from
          2016. It was fully repealed for tax periods beginning January 1,
          2021, and the Department of Revenue is explicit: do not file a
          return for any tax year that begins on or after January 1,
          2021. For 2026 and later, Tennessee taxes no personal income of
          any kind — wages, interest, dividends, or capital gains.
        </Para>
        <Para>
          If you find an old article or a tax-prep page that still
          mentions the Hall tax, it is out of date. There is no Hall tax
          return to file, no Hall tax to withhold, and no Hall tax line on
          any pay stub.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Cross-border trap · work in another state"
        title="A Tennessee resident who works across the line still pays that state's tax"
        summary="Tennessee has no credit to give you for another state's tax, because there is no Tennessee tax to credit it against."
      >
        <Para>
          Tennessee&apos;s $0 does not follow you across the state line.
          A Tennessee resident who commutes to Kentucky, Alabama,
          Georgia, or any other income-tax state owes that state&apos;s
          income tax on those wages, and that state&apos;s withholding
          shows on the stub. There is no Tennessee credit to claim for
          that tax, because there is no Tennessee tax to credit it
          against — the other state&apos;s return is where the liability
          lives.
        </Para>
        <Para>
          The same applies in reverse: a Kentucky or Alabama resident who
          works in Tennessee owes no Tennessee tax on those wages, but
          still owes tax to the home state. If you move to Tennessee
          mid-year, the wages you earned before the move were taxed by
          the state you lived in then; only the Tennessee wages after the
          move are tax-free at the state level.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* ALABAMA                                                             */
/* ------------------------------------------------------------------ */

function AlabamaContent() {
  const slug = "alabama-paycheck-calculator";
  const state = getStateBySlug(slug);
  const brackets = state?.brackets ?? [];
  const rows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(slug, gross);
    return [
      formatUSD0(gross),
      formatUSD0(engineTaxableIncome(slug, gross)),
      formatAmountOrUnavailable(r.annualState),
      formatUSD(r.annualNet),
    ];
  });
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          What Alabama tax looks like at real salaries
        </SectionTitle>
        <Para>
          Alabama taxes wages in three brackets — 2%, 4%, then 5% — after
          the standard deduction and a $1,500 personal exemption. The top
          rate arrives fast: a single filer hits 5% on every dollar of
          taxable income over $3,000, so most of a working salary is taxed
          at the top rate.
        </Para>
        <NoteBox tone="blue">
          <strong>Two Alabama-only steps are already in these rows.</strong>{" "}
          Alabama lets you subtract your federal income tax before
          applying state rates, and its standard deduction phases down
          as income rises (to a $2,500 floor for single filers). The
          calculator models both: the federal-tax deduction is the
          federal income tax it estimates for the same pay — based on the
          calculator&apos;s estimated federal liability, not your actual
          federal tax paid or withheld, which is why the figures are
          estimates. At $60,000 that deduction is{" "}
          {formatUSD(EX_AL_60.annualFederal)} and the standard deduction
          is{" "}
          {formatUSD(
            60000 -
              engineTaxableIncome(slug, 60000) -
              EX_AL_60.annualFederal -
              1500,
          )}
          .
        </NoteBox>
        <WorkedTable
          caption="Alabama income tax, single filer, 2026 (calculator figures)"
          headers={["Gross wages", "AL taxable income", "AL income tax", "Take-home pay"]}
          rows={rows}
          footnote={`At $60,000 the calculator's effective AL income-tax rate is ${effectiveRatePct(EX_AL_60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(EX_AL_150.annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs — including the federal-tax deduction and the standard-deduction phase-down.`}
        />
        <Para>
          The $30,000 row in detail, on the calculator&apos;s base:{" "}
          {bracketDetailEngine(slug, 30000, brackets)}; total{" "}
          {formatAmountOrUnavailable(EX_AL_30.annualState)}. The bracket
          tops for single filers are {formatUSD0(brackets[0]?.upTo ?? 0)}{" "}
          and {formatUSD0(brackets[1]?.upTo ?? 0)}; joint filers get
          double those tops — {formatUSD0(1000)} and{" "}
          {formatUSD0(6000)} — with the same 2% / 4% / 5% rates.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department of Revenue&apos;s own terms</Eyebrow>
        <SectionTitle>
          Three rates, a shrinking standard deduction, and a federal-tax
          deduction no other nearby state offers
        </SectionTitle>
        <Para>
          Alabama starts from federal adjusted gross income, then
          subtracts the standard deduction and the personal exemption
          before the rates apply. The maximum standard deduction is
          $3,000 for single filers, $8,500 for joint filers, $4,250 for
          married filing separately, and $5,200 for heads of family — but
          it phases down as income rises: a single filer gets the full
          $3,000 only up to about $26,000 of income, and it falls to a
          $2,500 floor at higher incomes. The personal exemption is
          $1,500 for single and married filing separately, $3,000 for
          joint and head of family.
        </Para>
        <Para>
          The unusual part is the federal income tax deduction. Alabama
          is one of the few states that lets you subtract the federal
          income tax you paid — or had withheld — before applying state
          rates. The withholding formula does the same thing on a
          paycheck: it annualizes your wages, subtracts the
          income-phased standard deduction, subtracts your annualized
          federal withholding, subtracts the personal exemption and your
          dependent allowances, and only then applies the 2% / 4% / 5%
          rates. The calculator models that step: it subtracts the
          federal income tax it estimates for the same pay — based on the
          calculator&apos;s estimated federal liability, not your actual
          federal withholding — so the table above already reflects it.
        </Para>
        <Para>
          Alabama does not tax Social Security benefits, military
          retirement pay, or defined benefit pensions — including private
          employer pensions and the Teachers&apos;, Employees&apos;, and
          Judicial retirement systems — and railroad retirement is exempt
          too. Distributions from a 401(k) or IRA are taxable, but a
          taxpayer age 65 or older may exclude the first $6,000 of them
          ($12,000 joint, if both spouses qualify). Alabama has no state
          earned income tax credit.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form A-4"
        title="Alabama's A-4 is not the federal W-4 — and the federal form is not a substitute"
        summary="Five status letters, dependent allowances that shrink with income, and a $500 penalty for inflated exemptions. The full how-to is inside."
      >
        <Para>
          Give your employer a completed Form A-4, Employee&apos;s
          Withholding Exemption Certificate (revised April 2025), on or
          before your first day of work. Alabama law specifically
          prohibits substituting the federal W-4 (Alabama Code section
          40-18-73) — the exemption values differ, so the federal form
          cannot set Alabama withholding.
        </Para>
        <Para>
          The form&apos;s status letters set your personal exemption:
          0 means no exemption and the highest withholding — it is the
          automatic default if you never file an A-4. S is single at
          $1,500, MS is married filing separately at $1,500, M is married
          filing jointly at $3,000, and H is head of family at $3,000.
          Then you add dependents: $1,000 each if your gross income is
          $50,000 or less, $500 each from $50,001 to $100,000, and $300
          each above $100,000. Line 5 takes an additional amount per pay
          period if you want extra withheld.
        </Para>
        <Para>
          Take the form seriously: inflating the number of exemptions
          carries a $500 penalty. If you claim eight or more exemptions,
          your employer must send a copy of your A-4 to the Department of
          Revenue within 60 days ($50 per certificate). A separate variant,
          Form A4-MS, covers nonresident military spouses. And from
          January 1, 2026, Act 2025-334 gives nonresident employees a
          30-day safe harbor before Alabama withholding applies.
        </Para>
      </ExpandableSection>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Local taxes · occupational license tax</Eyebrow>
        <SectionTitle>
          About two dozen Alabama cities tax your wages on top of the state
        </SectionTitle>
        <Para>
          Around 24 Alabama cities levy an occupational license tax on
          gross wages, and it follows your worksite, not your home
          address — you pay where you work. It is charged on gross
          earnings with no deductions and no credit against state tax.
        </Para>
        <Para>
          Birmingham charges 1% on gross earnings, including bonuses and
          severance, for residents and commuters alike; the only
          exemption is domestic servants in private households. Gadsden
          charges 2%. Bessemer, Auburn, and Opelika each charge 1%, and
          Macon County charges 1% in areas without their own city tax.
          Huntsville, Montgomery, Mobile, and Tuscaloosa have no
          occupational tax. A new city tax needs a local law, so the list
          changes only when the legislature acts. This calculator does
          not include local occupational tax — a Birmingham worker on the
          $60,000 example above owes another $600 a year to the city on
          top of the state bill.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form 40, an automatic six-month extension, and the $500 estimated line"
        summary="Who must file, the April 15 deadline, and when quarterly estimates are required."
      >
        <Para>
          Residents file Form 40; nonresidents and part-year residents
          file Form 40NR. You must file if your gross income exceeds
          $4,000 single, $10,500 joint, $7,700 head of family, or $5,250
          married filing separately — and exempt income like Social
          Security and defined benefit pensions does not count toward
          those thresholds. The due date for 2026 returns is April 15,
          2027, and Alabama gives an automatic six-month extension to
          October 15 with no form required — but that is an extension to
          file, not to pay; any tax due must still be paid by April 15,
          with Form 40V.
        </Para>
        <Para>
          Estimated payments go on Form 40ES. You must pay them if you
          expect to owe $500 or more after withholding and credits. The
          four installments are due April 15, June 15, and September 15,
          2026, and January 15, 2027. The safe harbor is the smaller of
          90% of your current-year tax or 100% of your prior-year tax —
          110% of the prior-year tax if your prior-year Alabama adjusted
          gross income was over $150,000 ($75,000 if married filing
          separately).
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* MISSISSIPPI                                                         */
/* ------------------------------------------------------------------ */

function MississippiContent() {
  const slug = "mississippi-paycheck-calculator";
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
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          What Mississippi tax looks like at real salaries
        </SectionTitle>
        <Para>
          Mississippi taxes wages at a flat 4% — but only on taxable
          income above $10,000. The first $10,000 is taxed at 0%, and a
          $6,000 personal exemption plus a $2,300 standard deduction come
          off first, so the first dollars of a paycheck are a long way
          from the 4% rate.
        </Para>
        <NoteBox tone="blue">
          <strong>How to read this table:</strong> the income-tax column
          is your <strong>annual state liability estimate</strong> — what
          you owe for the year, settled on your tax return. The 4% rate
          is falling: it is scheduled to drop to 3.75% in 2027, 3.5% in
          2028, 3.25% in 2029, and 3% in 2030, with further
          trigger-based reductions toward eventual repeal.
        </NoteBox>
        <WorkedTable
          caption="Mississippi income tax, single filer, 2026"
          headers={["Gross wages", "MS taxable income", "MS income tax", "Take-home pay"]}
          rows={rows}
          footnote={`At $60,000 the effective MS income-tax rate is ${effectiveRatePct(EX_MS_60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(EX_MS_150.annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          The $60,000 row in detail, on the calculator&apos;s base:{" "}
          {bracketDetailFull(slug, 60000)}; total{" "}
          {formatAmountOrUnavailable(EX_MS_60.annualState)}. The $30,000
          row is smaller but the same shape:{" "}
          {bracketDetailFull(slug, 30000)}. The 0% bracket tops out at{" "}
          {formatUSD0(brackets[0]?.upTo ?? 0)} for single and joint
          filers alike.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department of Revenue&apos;s own terms</Eyebrow>
        <SectionTitle>
          A flat 4% that is being phased down to nothing
        </SectionTitle>
        <Para>
          Mississippi&apos;s 4% rate for 2026 is the second step down
          from 4.4% in 2025, under the phase-down in House Bill 531 of
          2022 and the Build-Up Mississippi Act (House Bill 1, signed
          March 27, 2025). The schedule is 3.75% in 2027, 3.5% in 2028,
          3.25% in 2029, and 3% in 2030, with further reductions tied to
          revenue triggers toward an eventual repeal. A Mississippi
          paycheck in 2026 is taxed less than the same paycheck in 2025,
          and the gap widens every year the schedule holds.
        </Para>
        <Para>
          The exemptions are generous for a flat-tax state. The personal
          exemption is $6,000 for a single filer, $12,000 for a joint
          return, and $9,500 for a head of family — plus $1,500 for each
          dependent, $1,500 for being age 65 or older, and $1,500 for
          blindness. Working spouses split the $12,000 joint exemption in
          multiples of $500. The standard deduction is $2,300 single and
          $4,600 joint. There is no local income tax anywhere in
          Mississippi — no city or county adds a wage tax on top of the
          state rate.
        </Para>
        <Para>
          Mississippi does not tax Social Security benefits, railroad
          retirement, veterans&apos; payments, workers&apos;
          compensation, or public welfare payments. The Department of
          Revenue&apos;s online system for filing and paying is the
          Taxpayer Access Point, or TAP.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form 89-350"
        title="Mississippi's 89-350: claim your exemption in dollars, not allowances"
        summary="No certificate means withholding on your total wages with no exemption at all. The full how-to is inside."
      >
        <Para>
          Give your employer a completed Form 89-350, Employee&apos;s
          Withholding Exemption Certificate (revised October 2025). Unlike
          the allowance systems in other states, you claim your exemption
          in dollars on line 6 — your personal exemption plus $1,500 for
          each dependent, for age 65 or older, and for blindness. Line 7
          takes an extra withholding amount per pay period, and line 8
          covers the military-spouse exemption (attach federal Form
          DD-2058 and a military spouse ID card).
        </Para>
        <Para>
          The default is the expensive one: if you give your employer no
          certificate, the employer must withhold on your total wages
          without any exemption. And if your exemption status changes —
          a dependent arrives or leaves, you turn 65 — you must give your
          employer a new certificate within 30 days. False information on
          the form draws penalties.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form 80-105, the $200 estimated line, and the automatic extension"
        summary="Who must file, the April 15 deadline, and when quarterly estimates are required."
      >
        <Para>
          Residents file Form 80-105; part-year residents and
          nonresidents file Form 80-205. The due date for 2026 returns is
          April 15, 2027. A federal extension gives you an automatic
          Mississippi extension — attach a copy of federal Form 4868 to
          your return. That is an extension to file, not to pay: any tax
          due must still be paid by April 15.
        </Para>
        <Para>
          Estimated payments go on Form 80-106. You must pay them if your
          expected liability is more than $200 and less than 80% of it
          will be covered by withholding. The four installments are due
          April 15, June 15, and September 15, 2026, and January 15,
          2027.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* LOUISIANA                                                           */
/* ------------------------------------------------------------------ */

function LouisianaContent() {
  const slug = "louisiana-paycheck-calculator";
  const state = getStateBySlug(slug);
  const rows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(slug, gross);
    return [
      formatUSD0(gross),
      formatUSD0(stateTaxableIncome(slug, gross)),
      formatAmountOrUnavailable(r.annualState),
      formatUSD(r.annualNet),
    ];
  });
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          What Louisiana tax looks like at real salaries
        </SectionTitle>
        <Para>
          Louisiana taxes wages at one flat rate — 3% — after a $12,875
          standard deduction for single filers. The deduction is the big
          one in this batch: it is more than four times Alabama&apos;s and
          nearly four times Kentucky&apos;s, so a large slice of a
          Louisiana paycheck is never taxed at all.
        </Para>
        <NoteBox tone="blue">
          <strong>How to read this table:</strong> the income-tax column
          is your <strong>annual state liability estimate</strong> — what
          you owe for the year, settled on your tax return. It is not
          quite what comes out of your paychecks: Louisiana withholds at
          3.09%, not 3%, so a little extra is held back during the year
          and refunded when you file. On the $60,000 row below, the
          liability is {formatAmountOrUnavailable(EX_LA_60.annualState)}{" "}
          but withholding at 3.09% comes to about{" "}
          {formatUSD(LA_WITHHELD_60)} — about{" "}
          {formatUSD(LA_WITHHELD_60 - (EX_LA_60.annualState ?? 0))} more
          across the year.
        </NoteBox>
        <WorkedTable
          caption="Louisiana income tax, single filer, 2026"
          headers={["Gross wages", "LA taxable income", "LA income tax", "Take-home pay"]}
          rows={rows}
          footnote={`At $60,000 the effective LA income-tax rate is ${effectiveRatePct(EX_LA_60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(EX_LA_150.annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          The $60,000 row in detail: {flatDetail(slug, 60000, 3)}; total{" "}
          {formatAmountOrUnavailable(EX_LA_60.annualState)}. The
          $150,000 row is the same shape:{" "}
          {flatDetail(slug, 150000, 3)}. Joint filers, heads of household,
          and qualifying surviving spouses get a $25,750 standard
          deduction — exactly double the single amount.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department of Revenue&apos;s own terms</Eyebrow>
        <SectionTitle>
          One flat rate since the 2025 reform — and a bigger standard deduction
        </SectionTitle>
        <Para>
          For taxable periods beginning on or after January 1, 2025, the
          individual income tax rate is a flat 3%. The graduated brackets
          and rates that came before it have been repealed — the
          Department of Revenue says so in its own FAQ. The reform was
          Act 11 of the 2024 Third Extraordinary Session. The old
          personal exemptions and dependent deductions were eliminated
          with the brackets and replaced by the single large standard
          deduction: $12,875 for single and married filing separately,
          $25,750 for joint, head of household, and qualifying surviving
          spouse filers, inflation-indexed from 2026.
        </Para>
        <Para>
          Louisiana does not tax Social Security benefits, or federal and
          railroad retirement income. And no parish, city, or school
          district in Louisiana can tax your wages: the Louisiana
          Constitution (Article VII, Section 4(C)) prohibits local wage
          taxes in all 64 parishes. The state line on your pay stub is
          the only Louisiana income-tax line there is.
        </Para>
        <Para>
          One more detail worth knowing: Louisiana residents who pay
          income tax to another state on the same income can claim a
          credit for it on the return (Revised Statute 47:33, Schedule H
          of Form IT-540B for nonresidents). If you split your year
          between Louisiana and another state, that credit is where the
          double tax gets fixed.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form L-4"
        title="Louisiana's L-4 is one number: 0, 1, or 2"
        summary="No L-4 means withholding with no standard deduction at all. The full how-to, including the 3.09% cushion, is inside."
      >
        <Para>
          Give your employer a completed Form L-4, Employee&apos;s
          Withholding Certificate (R-1300, January 2026). Block A is the
          whole decision: enter 0 if you claim no standard deduction, 1
          if you are single or married filing separately ($12,875), or 2
          if you are joint, head of household, or a qualifying surviving
          spouse ($25,750). Line 7 takes adjustments — an additional
          amount per pay period, or a reduction — but a decrease cannot
          take your withholding below $0.
        </Para>
        <Para>
          The default is the expensive one: if you give your employer no
          L-4, the employer must withhold with no standard deduction,
          which means 3.09% of your full wages. If your deductions
          decrease — you marry, or your filing status changes — you must
          give your employer a new certificate within 10 days; if they
          increase, you may file a new one at any time. Willfully false
          information on the form draws penalties.
        </Para>
        <Para>
          Two quirks to know. First, the withholding tables use a rate of
          3.09% rather than the 3% income tax rate, deliberately, to
          provide a cushion — the Department of Revenue says so in its
          2026 withholding tables (R-1306). The extra 0.09% is refunded
          when you file. Second, the mobile-workforce rule: no Louisiana
          withholding applies to a nonresident present in the state for
          30 days or fewer (Revised Statute 47:112.2).
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Credits · 2026 amounts · return-only"
        title="The Louisiana credits claimed on your return"
        summary="A refundable earned income credit and childcare credits. Claimed on your annual return; this calculator does not automatically adjust withholding for them."
      >
        <Para>
          <strong className="text-slate-900">Louisiana Earned Income
          Credit (refundable):</strong> 5% of your federal earned income
          tax credit, through 2030 (Revised Statute 47:297.8). If you
          qualify for the federal EITC, you may reduce your Louisiana tax
          by up to 5% of that federal credit, subject to eligibility and
          the credit being refundable — attach the Louisiana EIC worksheet
          to your return.
        </Para>
        <Para>
          <strong className="text-slate-900">School Readiness and Child
          Care Expense Tax Credits:</strong> for childcare at a
          quality-rated provider. The staff and director credits are
          refundable and run from $2,192 to $4,381 for 2025 by credential
          level, adjusted for inflation. These are claimed on the annual
          return, not on your paycheck.
        </Para>
        <Para>
          Louisiana has no general state child tax credit. If you are
          counting on a credit to lower your withholding, do not — these
          credits settle on the return, and your paycheck withholding is
          set by the L-4 alone.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form IT-540, a May 15 deadline, and the $1,000 estimated line"
        summary="Louisiana gives you an extra month to file. The forms, the deadline, and when quarterly estimates are required."
      >
        <Para>
          Residents file Form IT-540; nonresidents and part-year
          residents file Form IT-540B. Louisiana&apos;s due date is May
          15 — one month after the federal deadline — for 2026 returns.
        </Para>
        <Para>
          Estimated payments go on Form IT-540ES. You must pay them if
          you expect your Louisiana liability after credits and
          withholding to be more than $1,000 as a single filer, or more
          than $2,000 filing jointly. The four installments are due April
          15, June 15, and September 15, 2026, and January 15, 2027.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* ARKANSAS                                                            */
/* ------------------------------------------------------------------ */

function ArkansasContent() {
  const slug = "arkansas-paycheck-calculator";
  const state = getStateBySlug(slug);
  const rows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(slug, gross);
    return [
      formatUSD0(gross),
      formatUSD0(stateTaxableIncome(slug, gross)),
      formatAmountOrUnavailable(r.annualState),
      formatUSD(r.annualNet),
    ];
  });
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          What Arkansas tax looks like at real salaries
        </SectionTitle>
        <Para>
          Arkansas taxes wages in five brackets under the 2026 law — 0%,
          2%, 3%, 3.4%, then 3.7% — after a $2,470 standard deduction and
          a $29 credit for each exemption on your withholding certificate.
          The top rate of 3.7% applies to taxable income over $26,400.
        </Para>
        <NoteBox tone="blue">
          <strong>The $150,000 row uses the DFA phase-in band.</strong>{" "}
          The Department of Finance and Administration&apos;s withholding
          formula uses a phase-in band between $94,701 and $97,600 of
          taxable income that steps the bracket adjustment down, so
          above $97,601 the formula charges 3.7% minus $79.90, not
          minus $367.16 — and the calculator models that band, so the
          $150,000 row matches the 2026 formula. The DFA $50 midrange
          table below $100,001 can still move the $30,000 and $60,000
          rows by a few dollars.
        </NoteBox>
        <WorkedTable
          caption="Arkansas income tax, single filer, 2026"
          headers={["Gross wages", "AR taxable income", "AR income tax", "Take-home pay"]}
          rows={rows}
          footnote={`At $60,000 the effective AR income-tax rate is ${effectiveRatePct(EX_AR_60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(EX_AR_150.annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, which now models the DFA phase-in band above $94,700.`}
        />
        <Para>
          The $60,000 row in detail:{" "}
          {bracketDetailText(slug, 60000, state?.brackets ?? [])}; total{" "}
          {formatAmountOrUnavailable(EX_AR_60.annualState)}, after the
          $29 credit. The walk is the 2026 schedule: 2% on the first
          $5,600 of taxable income over $5,599, 3% to $15,999, 3.4% to
          $26,399, and 3.7% above.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department of Finance and Administration&apos;s own terms</Eyebrow>
        <SectionTitle>
          Five brackets, a $29 credit per exemption, and a low-income table
        </SectionTitle>
        <Para>
          Arkansas starts from federal adjusted gross income, then
          subtracts the $2,470 standard deduction (the same for all
          filing statuses) before the rates apply. The 2026 brackets are
          0% to $5,599, 2% to $11,199, 3% to $15,999, 3.4% to $26,399,
          and 3.7% over $26,400. Above $94,700 a second table applies —
          2% on the first $4,700 and 3.7% on the balance — with a
          phase-in adjustment between $94,701 and $97,600. On top of the
          brackets, you get a $29 credit for each exemption on your
          withholding certificate.
        </Para>
        <Para>
          Arkansas also has a low-income tax table: if your income is
          below the thresholds printed on the withholding form, a lower
          rate schedule applies instead of the standard brackets. The
          thresholds are printed on the form itself, so check the current
          AR4EC for your filing status rather than guessing.
        </Para>
        <Para>
          Arkansas does not tax Social Security benefits, railroad
          retirement, veterans&apos; benefits, or workers&apos;
          compensation — they are outside gross income entirely. The
          first $6,000 per taxpayer of employer-plan or traditional IRA
          retirement income is exempt (one $6,000 across all sources;
          for IRAs only at age 59½, on death, or on disability), and
          military retirement and survivor benefits are fully exempt.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form AR4EC"
        title="Arkansas's AR4EC: count your exemptions, then check the low-income box"
        summary="No certificate means withholding with no exemptions or dependents at all. The full how-to is inside."
      >
        <Para>
          Give your employer a completed Form AR4EC, Employee&apos;s
          Withholding Exemption Certificate (current edition revised
          December 2025). Line 1 counts yourself: 1a is yourself alone
          (1 exemption), 1b is yourself plus your spouse (2), 1c is head
          of household plus yourself (2). Line 2 adds one exemption per
          child or dependent. Line 3 is the total, and each exemption is
          worth a $29 credit against the tax. Line 4 takes an extra amount
          per paycheck if you want more withheld. Line 5 is the
          low-income tax rates question — check yes or no and mark your
          filing status.
        </Para>
        <Para>
          The default is the expensive one: if you give your employer no
          AR4EC, the employer withholds without any exemptions or
          dependents. If your exemptions or dependents decrease, you must
          give your employer a new certificate within 10 days; if they
          increase, you may file a new one at any time. With two jobs,
          claim your exemptions on one certificate only — never on both.
        </Para>
        <Para>
          One special case: Arkansas residents of Texarkana are exempt
          from Arkansas income tax entirely, claimed on Form AR4EC(TX)
          instead of the regular AR4EC.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form AR1000F, the $1,000 estimated line, and the $29 credits"
        summary="Who must file, the April 15 deadline, and when quarterly estimates are required."
      >
        <Para>
          Residents file Form AR1000F; nonresidents and part-year
          residents file Form AR1000NR. The due date for 2026 returns is
          April 15, 2027.
        </Para>
        <Para>
          Estimated payments go on Form AR1000ES. You must file a
          declaration if you expect your tax after withholding and credits
          to be more than $1,000. The four installments are due April 15,
          June 15, and September 15, 2026, and January 15, 2027. The safe
          harbor is 90% of the tax actually due; the penalty for a
          shortfall is 10% a year, assessed quarterly — but there is no
          penalty if your return tax is under $1,000, or if your estimate
          equals your prior-year tax. The personal tax credits on the
          AR1000ES worksheet are $29 for a single filer or married
          filing separately on separate returns, $58 for joint filers,
          heads of household, married filing separately on the same
          return, and qualifying widow(er)s, plus $29 per dependent and
          $29 each for blindness, deafness, and age 65 or older.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* OKLAHOMA                                                            */
/* ------------------------------------------------------------------ */

function OklahomaContent() {
  const slug = "oklahoma-paycheck-calculator";
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
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          What Oklahoma tax looks like at real salaries
        </SectionTitle>
        <Para>
          Oklahoma taxes wages in three brackets — 2.5%, 3.5%, then 4.5%
          — after a $6,350 standard deduction and a $1,000 personal
          exemption. The first $3,750 of taxable income is taxed at 0%,
          and the top rate of 4.5% applies to taxable income over $7,200,
          so most of a working salary is taxed at the top rate.
        </Para>
        <NoteBox tone="blue">
          <strong>How to read this table:</strong> the income-tax column
          is your <strong>annual state liability estimate</strong> — what
          you owe for the year, settled on your tax return. Oklahoma
          collapsed six brackets into three and cut the top rate from
          4.75% to 4.5% effective January 1, 2026, so a 2026 paycheck is
          taxed less than the same paycheck in 2025.
        </NoteBox>
        <WorkedTable
          caption="Oklahoma income tax, single filer, 2026"
          headers={["Gross wages", "OK taxable income", "OK income tax", "Take-home pay"]}
          rows={rows}
          footnote={`At $60,000 the effective OK income-tax rate is ${effectiveRatePct(EX_OK_60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(EX_OK_150.annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          The $60,000 row in detail, on the calculator&apos;s base:{" "}
          {bracketDetailFull(slug, 60000)}; total{" "}
          {formatAmountOrUnavailable(EX_OK_60.annualState)}. The bracket
          tops for single filers are {formatUSD0(brackets[0]?.upTo ?? 0)},{" "}
          {formatUSD0(brackets[1]?.upTo ?? 0)}, and{" "}
          {formatUSD0(brackets[2]?.upTo ?? 0)}; joint filers and heads of
          household get double those tops.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Oklahoma Tax Commission&apos;s own terms</Eyebrow>
        <SectionTitle>
          Three brackets, a $1,000 exemption, and no local income tax
        </SectionTitle>
        <Para>
          Oklahoma starts from federal adjusted gross income, then
          subtracts the standard deduction and the personal exemption
          before the rates apply. The standard deduction is $6,350 for
          single and married filing separately, $12,700 for joint, and
          $9,350 for head of household. The personal exemption is $1,000
          each for yourself, your spouse, each dependent, and blindness —
          plus an extra $1,000 at age 65 or older, but only if your
          federal adjusted gross income is $15,000 or less single,
          $25,000 or less joint, $12,500 or less separate, or $19,000 or
          less head of household. If you itemize instead, Oklahoma caps
          itemized deductions at $17,000.
        </Para>
        <Para>
          The 2026 brackets come from House Bill 2764, signed May 28,
          2025: six brackets collapsed to three, and the top rate cut
          from 4.75% to 4.5% effective January 1, 2026. The brackets are
          not indexed for inflation, so the tops stay fixed year to year
          unless the legislature moves them.
        </Para>
        <Para>
          Oklahoma does not tax Social Security benefits — they are
          subtracted in full, with no cap and no age test — and military
          pay and military retirement are excluded in full for residents.
          There is no city or county income tax anywhere in Oklahoma: the
          state line on your pay stub is the only Oklahoma income-tax
          line there is.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form OK-W-4"
        title="Oklahoma's OK-W-4: count your allowances, and do not mail it to the Tax Commission"
        summary="The form stays with your employer. The allowance math and the exempt line are inside."
      >
        <Para>
          Give your employer a completed Form OK-W-4, Employee&apos;s
          State Withholding Allowance Certificate (revised March 2021).
          Count one allowance for yourself, one for a non-working spouse,
          and one for each dependent, then add extra allowances for
          itemized deductions and other Oklahoma deductions and credits.
          You can also ask for an optional extra amount per pay period.
          Do not mail the form to the Oklahoma Tax Commission — it stays
          with your employer.
        </Para>
        <Para>
          If your income is below your personal exemption plus your
          standard deduction, you can mark &ldquo;Exempt&rdquo; on line 7
          and have no Oklahoma tax withheld: that total is $7,350 for a
          single filer and $14,700 joint, plus $1,000 per dependent. A
          military spouse claims exemption by writing &ldquo;Exempt&rdquo;
          on line 8 and filing Form OW-9-MSE.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Credits · 2026 amounts · return-only"
        title="The Oklahoma credits claimed on your return"
        summary="A state earned income credit, a childcare credit, a sales-tax relief credit, and a private-school credit. Claimed on your annual return; this calculator does not automatically adjust withholding for them."
      >
        <Para>
          <strong className="text-slate-900">Oklahoma Earned Income Tax
          Credit:</strong> 5% of your federal earned income tax credit,
          prorated by the ratio of your Oklahoma adjusted gross income to
          your federal adjusted gross income. You may reduce your
          Oklahoma tax by up to 5% of your federal EITC, subject to
          eligibility, available tax liability, and the proration.
        </Para>
        <Para>
          <strong className="text-slate-900">Child care / child tax
          credit:</strong> the greater of 20% of your federal child-care
          credit or 5% of your federal child tax credit — but none at all
          if your federal adjusted gross income is over $100,000.
        </Para>
        <Para>
          <strong className="text-slate-900">Sales Tax Relief Credit
          (Form 538-S):</strong> $40 per qualifying household member,
          subject to income caps. And the <strong className="text-slate-900">Parental
          Choice Tax Credit</strong> is $5,000 to $7,500, refundable, for
          private-school tuition. Oklahoma also lets you exclude up to
          $10,000 of retirement income, and residents who pay tax to
          another state on the same income can claim a credit for it on
          Form 511-TX.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form 511, an April 20 e-file deadline, and the $500 estimated line"
        summary="Who must file, the two due dates, and when quarterly estimates are required."
      >
        <Para>
          Residents file Form 511; part-year residents and nonresidents
          file Form 511-NR. You must file if your gross income exceeds
          your standard deduction plus your exemptions — for 2025 that
          was $7,350 single, $14,700 joint, $7,350 married filing
          separately, $10,350 head of household, and $13,700 for a
          qualifying surviving spouse with a dependent child. A
          nonresident must file if Oklahoma-source gross income is
          $1,000 or more. The due date is April 15 for paper returns and
          April 20 for e-filed returns.
        </Para>
        <Para>
          Estimated payments go on Form OW-8-ES. You must pay them if
          you expect your tax to exceed withholding by $500 or more and
          your withholding covers less than 70% of your current-year
          liability (or less than your prior-year total tax). The four
          installments are due April 15, June 15, and September 15, 2026,
          and January 15, 2027, and there is no underpayment interest if
          your total liability is under $1,000. Filing and payment run
          through the OkTAP portal.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* MISSOURI                                                            */
/* ------------------------------------------------------------------ */

function MissouriContent() {
  const slug = "missouri-paycheck-calculator";
  const state = getStateBySlug(slug);
  const rows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(slug, gross);
    return [
      formatUSD0(gross),
      formatUSD0(engineTaxableIncome(slug, gross)),
      formatAmountOrUnavailable(r.annualState),
      formatUSD(r.annualNet),
    ];
  });
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          What Missouri tax looks like at real salaries
        </SectionTitle>
        <Para>
          Missouri taxes wages in eight brackets — 0%, then 2% to 4.5% in
          $1,348 steps, then 4.7% — after a $16,100 standard deduction,
          the same as the federal one. There are no personal exemptions
          anymore: Missouri has had none since 2019. The top rate of 4.7%
          applies to taxable income over $9,436, so most of a working
          salary is taxed at the top rate.
        </Para>
        <NoteBox tone="blue">
          <strong>The federal-tax deduction is already in these rows.</strong>{" "}
          Missouri lets you deduct part of the federal income tax you
          paid (section 143.171), and the calculator models it. The
          percentage depends on your Missouri gross income: 35% at
          $25,000 or less, 25% from $25,001 to $50,000, 15% from
          $50,001 to $100,000, 5% from $100,001 to $125,000, and 0%
          above $125,000 — capped at $5,000 single or $10,000 joint.
          The deduction is computed from the federal income tax the
          calculator estimates for the same pay — based on the
          calculator&apos;s estimated federal liability, not your actual
          federal tax. On the rows below it is{" "}
          {formatUSD(30000 - engineTaxableIncome(slug, 30000) - 16100)}{" "}
          at $30,000 (25% of the estimated federal tax in that row),
          worth about{" "}
          {formatUSD((30000 - engineTaxableIncome(slug, 30000) - 16100) * 0.047)}{" "}
          at the 4.7% top rate, and{" "}
          {formatUSD(60000 - engineTaxableIncome(slug, 60000) - 16100)}{" "}
          at $60,000 (15%), worth about{" "}
          {formatUSD((60000 - engineTaxableIncome(slug, 60000) - 16100) * 0.047)}
          . At $150,000 the percentage is 0%, so that row is not
          affected by this deduction.
        </NoteBox>
        <WorkedTable
          caption="Missouri income tax, single filer, 2026 (calculator figures)"
          headers={["Gross wages", "MO taxable income", "MO income tax", "Take-home pay"]}
          rows={rows}
          footnote={`At $60,000 the calculator's effective MO income-tax rate is ${effectiveRatePct(EX_MO_60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(EX_MO_150.annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs — including the section 143.171 federal-tax deduction. The $150,000 row is not affected by that deduction, because the percentage is 0% above $125,000.`}
        />
        <Para>
          The $30,000 row in detail, on the calculator&apos;s base:{" "}
          {bracketDetailEngine(slug, 30000, state?.brackets ?? [])}; total{" "}
          {formatAmountOrUnavailable(EX_MO_30.annualState)}. The top rate
          has fallen a long way: it was 6% in 2017 and has been cut in
          steps by revenue triggers to 4.7% for 2026. Figures of 4.95%
          still floating around on some sites are out of date.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department of Revenue&apos;s own terms</Eyebrow>
        <SectionTitle>
          Eight brackets, a federal-sized standard deduction, and no reciprocity
        </SectionTitle>
        <Para>
          Missouri starts from federal adjusted gross income, then
          subtracts the standard deduction before the rates apply. The
          2026 standard deduction is the federal amount: $16,100 for
          single filers, married filing separately, and married couples
          where both spouses work; $32,200 for a married couple where one
          spouse does not work; and $24,150 for heads of household. There
          are no personal exemptions to add on top — Missouri eliminated
          them in 2019. On top of the standard deduction, section 143.171
          lets you subtract part of your federal income tax — 35% at the
          lowest incomes, phasing to 0% above $125,000 — and the
          calculator models that deduction from its own estimated federal
          liability (an estimate, not your actual federal tax).
        </Para>
        <Para>
          Missouri has no reciprocity agreement with any state — not
          Kansas, Illinois, Iowa, Nebraska, Arkansas, Oklahoma,
          Tennessee, or Kentucky. A nonresident working in Missouri is
          withheld like a resident on Missouri-source wages. A Missouri
          resident working out of state files Form MO-1040 on all income
          and claims Form MO-CR, a credit for taxes paid to other states
          — the lesser of the tax paid to the other state or the Missouri
          tax on that income.
        </Para>
        <Para>
          Missouri does not tax Social Security benefits for taxpayers
          age 62 or older, with no income limit (since tax year 2024),
          and Social Security disability benefits are fully exempt at any
          age. Public pensions — for example the Public School Retirement
          System and the Public Education Employee Retirement System —
          can be deducted up to 100%. Supplemental wages, like bonuses,
          are withheld at a flat 4.7% unless the employer uses the
          aggregate method.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form MO W-4"
        title="Missouri's MO W-4 has no allowances — just your filing status and an extra amount"
        summary="One status box sets your whole standard deduction, and the spouse-not-working box doubles it. The full how-to is inside."
      >
        <Para>
          Give your employer a completed Form MO W-4, Employee&apos;s
          Withholding Certificate (revised December 2024). There are no
          allowances to count — line 1 is your filing status, which sets
          your standard deduction, with a checkbox for a spouse who does
          not work. Line 2 takes an optional extra withholding amount per
          pay period. There is also an exempt box for workers who expect
          no Missouri liability. Two related forms exist for special
          cases: MO W-4A for nonresidence and allocation, and MO W-4P for
          pension and annuity withholding.
        </Para>
        <Para>
          Because the form has no allowances, the only lever you have on
          a Missouri paycheck is the extra amount on line 2. If you have
          two jobs, or a spouse with income, or income that is not
          withheld on, raise line 2 or pay estimates instead of waiting
          for April.
        </Para>
      </ExpandableSection>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Local taxes · city earnings tax</Eyebrow>
        <SectionTitle>
          Kansas City and St. Louis each add a 1% earnings tax
        </SectionTitle>
        <Para>
          Two Missouri cities levy an earnings tax, and no other Missouri
          city taxes wages. Kansas City and St. Louis each charge 1% of
          earnings: residents pay on all earnings wherever they are
          earned, and nonresidents pay only on wages earned inside the
          city limits. Employers withhold it. Both taxes were renewed by
          voters on April 7, 2026, through 2031 — Kansas City with about
          75% approval, St. Louis (Proposition E) with about 85%.
        </Para>
        <Para>
          St. Louis also charges employers — not employees — a 0.5%
          payroll expense tax, which never appears on a pay stub. Note
          that St. Louis County is not the City of St. Louis: the county
          does not levy the earnings tax. Kansas City residents file Form
          RD-109 and nonresidents file Form RD-109NR (on a 260-day year),
          due April 15. The earnings tax is not deductible from Missouri
          or federal taxable income, and this calculator does not include
          it — a Kansas City worker on the $60,000 example above owes
          another $600 a year to the city on top of the state bill.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Credits · 2026 amounts · return-only"
        title="The Missouri credits claimed on your return"
        summary="A property-tax credit for seniors and disabled homeowners and renters, and a working-family credit. Claimed on your annual return; this calculator does not automatically adjust withholding for them."
      >
        <Para>
          <strong className="text-slate-900">Property Tax Credit
          (MO-PTC, the &ldquo;circuit breaker&rdquo;):</strong> up to
          $1,100 for homeowners and $750 for renters, for seniors age 65
          or older and people who are 100% disabled, subject to income
          limits. It is claimed on a separate Form MO-PTC, and you can
          file that form even if you have no other filing requirement.
        </Para>
        <Para>
          <strong className="text-slate-900">Missouri Working Family Tax
          Credit:</strong> 20% of your federal earned income tax credit,
          nonrefundable. You may reduce your Missouri tax by up to 20% of
          your federal EITC, subject to eligibility, available tax
          liability, and the credit being nonrefundable — it can take
          your Missouri tax to $0 but never below it.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form MO-1040, the April 15 deadline, and raising your withholding instead of estimates"
        summary="Who must file, the due date, and the two ways to cover a shortfall."
      >
        <Para>
          Residents file Form MO-1040. The due date for 2026 returns is
          April 15, 2027. You may skip the return if your Missouri
          adjusted gross income is below your standard deduction plus
          your personal exemption, under the Department of Revenue&apos;s
          practice (section 143.481).
        </Para>
        <Para>
          If you expect to owe Missouri tax after withholding, you can
          pay estimates on Form MO-1040ES — the four installments are due
          April 15, June 15, and September 15, 2026, and January 15,
          2027 — or you can simply raise the extra withholding on line 2
          of your MO W-4 instead. For most wage earners the W-4 route is
          simpler: it spreads the extra tax across every paycheck with
          no extra forms.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* BATCH DISPATCHER                                                    */
/* ------------------------------------------------------------------ */

export function BatchContent({ slug }: { slug: string }) {
  switch (slug) {
    case "kentucky-paycheck-calculator":
      return <KentuckyContent />;
    case "tennessee-paycheck-calculator":
      return <TennesseeContent />;
    case "alabama-paycheck-calculator":
      return <AlabamaContent />;
    case "mississippi-paycheck-calculator":
      return <MississippiContent />;
    case "louisiana-paycheck-calculator":
      return <LouisianaContent />;
    case "arkansas-paycheck-calculator":
      return <ArkansasContent />;
    case "oklahoma-paycheck-calculator":
      return <OklahomaContent />;
    case "missouri-paycheck-calculator":
      return <MissouriContent />;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* BATCH FAQS                                                          */
/* ------------------------------------------------------------------ */

export const BATCH_FAQS: Record<string, FaqItem[]> = {
  "kentucky-paycheck-calculator": [
    {
      q: "What is Kentucky's income tax rate in 2026?",
      a: "Kentucky taxes wages at a flat 3.5% for 2026. The rate fell from 4.5% in 2023 to 4% in 2024-2025 and 3.5% in 2026. There are no brackets — every dollar of taxable income is taxed at 3.5%.",
    },
    {
      q: "How much Kentucky tax will I pay on $60,000 a year?",
      a: `A single filer with $60,000 of wages and no deductions owes about ${formatAmountOrUnavailable(EX_KY_60.annualState)} a year in Kentucky income tax — an effective rate of ${effectiveRatePct(EX_KY_60.annualState, 60000)}% of gross. That is 3.5% of the ${formatUSD0(stateTaxableIncome("kentucky-paycheck-calculator", 60000))} left after the $3,360 standard deduction.`,
    },
    {
      q: "What is the Kentucky standard deduction?",
      a: "$3,360 for 2026, and it is the same for every filing status — single, joint, and head of household alike. Kentucky has no personal exemption on top of it.",
    },
    {
      q: "Do I need to file a Kentucky K-4 with my employer?",
      a: "Usually not. An ordinary employee does not need to give the employer a K-4 at all — the employer simply runs the flat-rate formula. The form matters only if you claim an exemption from withholding or want extra withholding.",
    },
    {
      q: "I live in Indiana and work in Kentucky. Do I pay Kentucky tax?",
      a: "No — Kentucky has reciprocity with Indiana (and with Illinois, Michigan, West Virginia, and Wisconsin). Complete a K-4 and file it with your employer, and Kentucky withholding stops; you pay tax only to your home state.",
    },
    {
      q: "What is the Louisville occupational tax?",
      a: "Louisville Metro and Jefferson County together charge residents 2.2% of gross wages (1.25% Louisville Metro, 0.2% TARC transit, 0.75% school board) and nonresidents who work in Louisville 1.45% — the school-board portion does not apply to nonresidents. It stacks on top of the 3.5% state tax and is not included in this calculator.",
    },
    {
      q: "What is the Lexington occupational tax?",
      a: "Lexington-Fayette charges 2.25% of gross wages, the same for residents and nonresidents. Like Louisville's, it is charged on gross wages with no deductions and no credit against state tax.",
    },
    {
      q: "What is the Family Size Tax Credit?",
      a: "It wipes out the entire Kentucky liability for a family at or below 100% of the filing threshold for its family size, and gives a partial credit between 100% and 133% of the threshold. The 2025 thresholds are $15,650 for a family of one, $21,150 for two, $26,650 for three, and $32,150 for four or more. It is claimed on the annual return, not on your paycheck.",
    },
    {
      q: "Is Social Security taxed in Kentucky?",
      a: "No. Kentucky does not tax Social Security benefits.",
    },
    {
      q: "When is the Kentucky tax return due?",
      a: "April 15, 2027, for 2026 returns. Full-year residents file Form 740; nonresidents and part-year residents file Form 740-NP.",
    },
    {
      q: "Do I need to make Kentucky estimated payments?",
      a: "Only if you expect to owe more than $500 after withholding and refundable credits. Estimates go on Form 740-ES, due April 15, June 15, and September 15, 2026, and January 15, 2027. The safe harbor is the smaller of 90% of your 2026 tax or 100% of your 2025 tax (110% if your 2025 Kentucky AGI was over $150,000).",
    },
    {
      q: "How much Kentucky tax on $150,000 a year?",
      a: `A single filer with $150,000 of wages and no deductions owes about ${formatAmountOrUnavailable(EX_KY_150.annualState)} a year — an effective rate of ${effectiveRatePct(EX_KY_150.annualState, 150000)}% of gross, because the flat rate means the effective rate barely rises with pay.`,
    },
  ],
  "tennessee-paycheck-calculator": [
    {
      q: "Does Tennessee have a state income tax?",
      a: "No. Tennessee taxes no personal income of any kind — no tax on wages, interest, dividends, or capital gains. A 2014 constitutional amendment bars the legislature from levying any state or local tax on payroll or earned personal income.",
    },
    {
      q: "What was the Hall tax?",
      a: "The Hall Income Tax taxed interest and dividend income only — it never touched wages. It peaked at 6%, was phased down from 2016, and was fully repealed for tax periods beginning January 1, 2021. The Department of Revenue says not to file a return for any tax year beginning on or after that date.",
    },
    {
      q: "Why is my Tennessee state tax $0 but my paycheck still has deductions?",
      a: "The $0 is only the state line. Federal income tax, Social Security at 6.2% up to $184,500, and Medicare at 1.45% (plus 0.9% over $200,000) still come out of every Tennessee paycheck, exactly as in every other state.",
    },
    {
      q: "How much do I take home on $60,000 a year in Tennessee?",
      a: `A single filer with $60,000 of wages takes home about ${formatUSD(EX_TN_60.annualNet)} a year. The same filer owes ${formatAmountOrUnavailable(EX_CA_60.annualState)} a year in California income tax (plus ${formatUSD(EX_CA_60.annualStateInsurance ?? 0)} of CA SDI) and ${formatAmountOrUnavailable(EX_NY_60.annualState)} in New York State — $0 in Tennessee.`,
    },
    {
      q: "Is there a Tennessee withholding form?",
      a: "No. A Tennessee worker fills in only the federal Form W-4. There is no state withholding form, no state return, and no state line on the pay stub.",
    },
    {
      q: "Do I file a Tennessee income tax return?",
      a: "No. There is no Tennessee income-tax return to file and no state estimated payments to make, because there is no tax for a return or an estimate to cover.",
    },
    {
      q: "Is there a local income tax in Tennessee?",
      a: "No. The Department of Revenue confirms there is no local income or wage tax anywhere in Tennessee — no city or county adds one.",
    },
    {
      q: "What is Tennessee's sales tax rate?",
      a: "The state rate is 7%, tied for the second-highest in the country behind California at 7.25%. Local option taxes add up to 2.75%, for a combined rate up to 9.75% in places like Nashville-Davidson and Memphis-Shelby. Groceries are taxed at a reduced 4% state rate plus the local rate.",
    },
    {
      q: "I live in Tennessee but work in Kentucky. Do I owe Kentucky tax?",
      a: "Yes. Tennessee's $0 does not follow you across the state line — Kentucky can withhold its own income tax on those wages, and there is no Tennessee credit to claim for it, because there is no Tennessee tax to credit it against.",
    },
    {
      q: "Is retirement income taxed in Tennessee?",
      a: "No. Tennessee taxes no retirement income, no Social Security, no dividends, no interest, and no capital gains.",
    },
    {
      q: "How much do I take home on $150,000 a year in Tennessee?",
      a: `A single filer with $150,000 of wages takes home about ${formatUSD(EX_TN_150.annualNet)} a year, with $0 of Tennessee state income tax. Only the federal taxes — ${formatUSD(EX_TN_150.annualFederal)} of federal income tax, plus Social Security and Medicare — come out.`,
    },
  ],
  "alabama-paycheck-calculator": [
    {
      q: "What are Alabama's income tax rates?",
      a: "Alabama taxes wages in three brackets: 2% on the first $500 of taxable income, 4% on the next $2,500, and 5% above $3,000 for single filers. Joint filers get double the bracket tops — $1,000 and $6,000 — at the same rates. A single filer hits the 5% top rate on every dollar of taxable income over $3,000.",
    },
    {
      q: "How much Alabama tax will I pay on $60,000 a year?",
      a: `About ${formatAmountOrUnavailable(EX_AL_60.annualState)} a year for a single filer with $60,000 of wages. Alabama lets you subtract your federal income tax paid before applying state rates, and the calculator models that deduction — it subtracts the federal income tax it estimates for the same pay (${formatUSD(EX_AL_60.annualFederal)}), based on the calculator's estimated federal liability, not your actual federal tax. The income-phased standard deduction is modelled too: at $60,000 it is ${formatUSD(60000 - engineTaxableIncome("alabama-paycheck-calculator", 60000) - EX_AL_60.annualFederal - 1500)}, down from the $3,000 maximum.`,
    },
    {
      q: "What is Alabama's federal income tax deduction?",
      a: "Alabama is one of the few states that lets you subtract the federal income tax you paid — or had withheld — before applying state rates. The withholding formula does the same on a paycheck: annualize wages, subtract the income-phased standard deduction, subtract annualized federal withholding, subtract the personal exemption and dependent allowances, then apply the rates. The calculator models it from its own estimated federal liability — an estimate, not your actual federal tax.",
    },
    {
      q: "What is the Alabama standard deduction?",
      a: "The maximum is $3,000 for single filers, $8,500 for joint filers, $4,250 for married filing separately, and $5,200 for heads of family — but it phases down as income rises. A single filer gets the full $3,000 only up to about $26,000 of income, and it falls to a $2,500 floor at higher incomes.",
    },
    {
      q: "What is Form A-4 and do I have to file one?",
      a: "Form A-4 is Alabama's Employee's Withholding Exemption Certificate (revised April 2025). You must give it to your employer on or before your first day of work. The federal W-4 is not a substitute — Alabama law specifically prohibits it. If you never file an A-4, your employer withholds at zero exemptions, the highest rate.",
    },
    {
      q: "What do the A-4 status letters mean?",
      a: "0 means no personal exemption and the highest withholding. S is single at $1,500, MS is married filing separately at $1,500, M is married filing jointly at $3,000, and H is head of family at $3,000.",
    },
    {
      q: "How much is each dependent worth on the A-4?",
      a: "$1,000 each if your gross income is $50,000 or less, $500 each from $50,001 to $100,000, and $300 each above $100,000.",
    },
    {
      q: "Does Birmingham charge a local income tax?",
      a: "Birmingham charges a 1% occupational license tax on gross earnings, including bonuses and severance, for residents and commuters alike. The only exemption is domestic servants in private households. It is not included in this calculator — a Birmingham worker on $60,000 a year owes another $600 to the city on top of the state bill.",
    },
    {
      q: "Which Alabama cities have no occupational tax?",
      a: "Huntsville, Montgomery, Mobile, and Tuscaloosa have none. Around 24 Alabama cities do levy one — Gadsden charges 2%, and Bessemer, Auburn, and Opelika each charge 1%.",
    },
    {
      q: "Is Social Security taxed in Alabama?",
      a: "No. Alabama does not tax Social Security benefits, military retirement pay, or defined benefit pensions — including private employer pensions. Distributions from a 401(k) or IRA are taxable, but a taxpayer age 65 or older may exclude the first $6,000 of them ($12,000 joint, if both spouses qualify).",
    },
    {
      q: "When is the Alabama tax return due?",
      a: "April 15, 2027, for 2026 returns. Residents file Form 40; nonresidents and part-year residents file Form 40NR. Alabama gives an automatic six-month extension to October 15 with no form required — but that is an extension to file, not to pay; any tax due must still be paid by April 15, with Form 40V.",
    },
    {
      q: "Do I need to make Alabama estimated payments?",
      a: "Only if you expect to owe $500 or more after withholding and credits. Estimates go on Form 40ES, due April 15, June 15, and September 15, 2026, and January 15, 2027. The safe harbor is the smaller of 90% of your current-year tax or 100% of your prior-year tax (110% if your prior-year Alabama AGI was over $150,000).",
    },
  ],
  "mississippi-paycheck-calculator": [
    {
      q: "What is Mississippi's income tax rate in 2026?",
      a: "A flat 4% on taxable income above $10,000. The first $10,000 of taxable income is taxed at 0%. The 2026 rate is down from 4.4% in 2025.",
    },
    {
      q: "How much Mississippi tax will I pay on $60,000 a year?",
      a: `A single filer with $60,000 of wages and no deductions owes about ${formatAmountOrUnavailable(EX_MS_60.annualState)} a year in Mississippi income tax — an effective rate of ${effectiveRatePct(EX_MS_60.annualState, 60000)}% of gross. The $6,000 personal exemption and $2,300 standard deduction come off first, then 4% applies only above $10,000 of taxable income.`,
    },
    {
      q: "Is Mississippi getting rid of its income tax?",
      a: "It is being phased down, not repealed overnight. The schedule is 3.75% in 2027, 3.5% in 2028, 3.25% in 2029, and 3% in 2030, with further reductions tied to revenue triggers toward an eventual repeal.",
    },
    {
      q: "What is the Mississippi standard deduction and personal exemption?",
      a: "The standard deduction is $2,300 for single filers and $4,600 for joint filers. The personal exemption is $6,000 single, $12,000 joint, and $9,500 head of family — plus $1,500 for each dependent, $1,500 for being age 65 or older, and $1,500 for blindness.",
    },
    {
      q: "What is Form 89-350?",
      a: "Mississippi's Employee's Withholding Exemption Certificate (revised October 2025). You claim your exemption in dollars on line 6, add extra withholding per pay period on line 7, and claim the military-spouse exemption on line 8. If you give your employer no certificate, the employer must withhold on your total wages without any exemption. File a new one within 30 days of any change in your exemption status.",
    },
    {
      q: "Is there a local income tax in Mississippi?",
      a: "No. There is no city or county income tax anywhere in Mississippi — the state line on your pay stub is the only income-tax line.",
    },
    {
      q: "Is Social Security taxed in Mississippi?",
      a: "No. Mississippi does not tax Social Security benefits, railroad retirement, veterans' payments, workers' compensation, or public welfare payments.",
    },
    {
      q: "When is the Mississippi tax return due?",
      a: "April 15, 2027, for 2026 returns. Residents file Form 80-105; part-year residents and nonresidents file Form 80-205. A federal extension gives you an automatic Mississippi extension — attach a copy of federal Form 4868. That is an extension to file, not to pay.",
    },
    {
      q: "Do I need to make Mississippi estimated payments?",
      a: "Only if your expected liability is more than $200 and less than 80% of it will be covered by withholding. Estimates go on Form 80-106, due April 15, June 15, and September 15, 2026, and January 15, 2027.",
    },
    {
      q: "What is TAP?",
      a: "The Taxpayer Access Point — the Mississippi Department of Revenue's online system for filing returns and paying tax.",
    },
    {
      q: "How much Mississippi tax on $150,000 a year?",
      a: `A single filer with $150,000 of wages and no deductions owes about ${formatAmountOrUnavailable(EX_MS_150.annualState)} a year — an effective rate of ${effectiveRatePct(EX_MS_150.annualState, 150000)}% of gross. At that income the $10,000 zero bracket is a small share of pay, so the effective rate is close to the 4% flat rate.`,
    },
  ],
  "louisiana-paycheck-calculator": [
    {
      q: "What is Louisiana's income tax rate?",
      a: "A flat 3% for taxable periods beginning on or after January 1, 2025. The graduated brackets that came before it were repealed by Act 11 of the 2024 Third Extraordinary Session, along with the old personal exemptions and dependent deductions.",
    },
    {
      q: "How much Louisiana tax will I pay on $60,000 a year?",
      a: `A single filer with $60,000 of wages and no deductions owes about ${formatAmountOrUnavailable(EX_LA_60.annualState)} a year in Louisiana income tax — an effective rate of ${effectiveRatePct(EX_LA_60.annualState, 60000)}% of gross. That is 3% of the ${formatUSD0(stateTaxableIncome("louisiana-paycheck-calculator", 60000))} left after the $12,875 standard deduction.`,
    },
    {
      q: "Why is my Louisiana withholding higher than my tax?",
      a: `Louisiana withholds at 3.09%, not 3% — the Department of Revenue's 2026 withholding tables use the higher rate deliberately, to provide a cushion. On the $60,000 example, the liability is ${formatAmountOrUnavailable(EX_LA_60.annualState)} but withholding comes to about ${formatUSD(LA_WITHHELD_60)} across the year. The extra ${formatUSD(LA_WITHHELD_60 - (EX_LA_60.annualState ?? 0))} is refunded when you file.`,
    },
    {
      q: "What is the Louisiana standard deduction?",
      a: "$12,875 for single filers and married filing separately, and $25,750 for joint filers, heads of household, and qualifying surviving spouses. It is inflation-indexed from 2026.",
    },
    {
      q: "What is Form L-4?",
      a: "Louisiana's Employee's Withholding Certificate (R-1300, January 2026). Block A is the whole decision: enter 0 if you claim no standard deduction, 1 if you are single or married filing separately ($12,875), or 2 if you are joint, head of household, or a qualifying surviving spouse ($25,750). Line 7 takes adjustments up or down per pay period.",
    },
    {
      q: "What happens if I don't file an L-4?",
      a: "Your employer must withhold with no standard deduction — 3.09% of your full wages. That is the most expensive default in this batch, so file the L-4 on your first day.",
    },
    {
      q: "Is there a local wage tax in Louisiana?",
      a: "No. The Louisiana Constitution (Article VII, Section 4(C)) prohibits local wage taxes in all 64 parishes — no parish, city, or school district can tax your wages.",
    },
    {
      q: "Is Social Security taxed in Louisiana?",
      a: "No. Louisiana does not tax Social Security benefits, or federal and railroad retirement income.",
    },
    {
      q: "Does Louisiana have an earned income credit?",
      a: "Yes — the Louisiana Earned Income Credit is 5% of your federal earned income tax credit, and it is refundable, through 2030. If you qualify for the federal EITC, you may reduce your Louisiana tax by up to 5% of that federal credit, subject to eligibility. Attach the Louisiana EIC worksheet to your return.",
    },
    {
      q: "When is the Louisiana tax return due?",
      a: "May 15 — one month after the federal deadline — for 2026 returns. Residents file Form IT-540; nonresidents and part-year residents file Form IT-540B.",
    },
    {
      q: "Do I need to make Louisiana estimated payments?",
      a: "Only if you expect your Louisiana liability after credits and withholding to be more than $1,000 as a single filer, or more than $2,000 filing jointly. Estimates go on Form IT-540ES, due April 15, June 15, and September 15, 2026, and January 15, 2027.",
    },
    {
      q: "I paid income tax to another state. Can I get a credit?",
      a: "Yes. Louisiana residents who pay income tax to another state on the same income can claim a credit for it on the return (Revised Statute 47:33; Schedule H of Form IT-540B for nonresidents).",
    },
  ],
  "arkansas-paycheck-calculator": [
    {
      q: "What is Arkansas's income tax rate in 2026?",
      a: "The 2026 brackets are 0% to $5,599, 2% to $11,199, 3% to $15,999, 3.4% to $26,399, and 3.7% over $26,400, after a $2,470 standard deduction. The top rate was cut from 3.9% to 3.7% by Act 1 of the 2026 First Extraordinary Session, retroactive to January 1, 2026.",
    },
    {
      q: "How much Arkansas tax will I pay on $60,000 a year?",
      a: `About ${formatAmountOrUnavailable(EX_AR_60.annualState)} a year. The calculator uses the 2026 schedule — 0% to $5,599, 2% to $11,199, 3% to $15,999, 3.4% to $26,399, and 3.7% above, after the $2,470 standard deduction and minus the $29 credit per exemption.`,
    },
    {
      q: "How does the $150,000 Arkansas row handle the phase-in band?",
      a: "Above $94,700 of taxable income the DFA withholding formula uses a phase-in band ($94,701–$97,600) that steps the bracket adjustment down, so above $97,601 the formula charges 3.7% minus $79.90 instead of minus $367.16 — and the calculator models that band, so the $150,000 row matches the 2026 formula. The $30,000 and $60,000 rows use the same 2026 schedule; the DFA $50 midrange table below $100,001 can move them by a few dollars.",
    },
    {
      q: "What is the $29 credit?",
      a: "Arkansas gives a $29 credit against your tax for each exemption on your withholding certificate — one for yourself, one for your spouse, one per child or dependent. It is a credit against the tax, not a deduction from income.",
    },
    {
      q: "What is Form AR4EC?",
      a: "Arkansas's Employee's Withholding Exemption Certificate (current edition revised December 2025). Line 1 counts yourself (and your spouse, or head-of-household status), line 2 adds one exemption per child or dependent, line 3 is the total, line 4 takes an extra amount per paycheck, and line 5 is the low-income tax rates question. If you give your employer no AR4EC, the employer withholds without any exemptions or dependents.",
    },
    {
      q: "What is the low-income tax table?",
      a: "If your income is below the thresholds printed on the AR4EC, a lower rate schedule applies instead of the standard brackets. The thresholds are printed on the form itself for your filing status — check the current AR4EC rather than guessing.",
    },
    {
      q: "Do Texarkana residents pay Arkansas income tax?",
      a: "No. Arkansas residents of Texarkana are exempt from Arkansas income tax entirely, claimed on Form AR4EC(TX) instead of the regular AR4EC.",
    },
    {
      q: "Is Social Security taxed in Arkansas?",
      a: "No. Arkansas does not tax Social Security benefits, railroad retirement, veterans' benefits, or workers' compensation — they are outside gross income entirely. The first $6,000 per taxpayer of employer-plan or traditional IRA retirement income is exempt, and military retirement and survivor benefits are fully exempt.",
    },
    {
      q: "When is the Arkansas tax return due?",
      a: "April 15, 2027, for 2026 returns. Residents file Form AR1000F; nonresidents and part-year residents file Form AR1000NR.",
    },
    {
      q: "Do I need to make Arkansas estimated payments?",
      a: "Only if you expect your tax after withholding and credits to be more than $1,000. Estimates go on Form AR1000ES, due April 15, June 15, and September 15, 2026, and January 15, 2027. The safe harbor is 90% of the tax actually due, and there is no penalty if your return tax is under $1,000 or your estimate equals your prior-year tax.",
    },
    {
      q: "What is the Arkansas standard deduction?",
      a: "$2,470 for 2026, the same for all filing statuses.",
    },
    {
      q: "How much Arkansas tax on $150,000 a year?",
      a: `About ${formatAmountOrUnavailable(EX_AR_150.annualState)} under the 2026 law — the calculator models the phase-in band above $94,700 of taxable income, so that is the DFA-formula figure. The $29 credit per exemption is already in it.`,
    },
  ],
  "oklahoma-paycheck-calculator": [
    {
      q: "What are Oklahoma's income tax rates in 2026?",
      a: "Three brackets: 0% to $3,750, 2.5% to $4,900, 3.5% to $7,200, and 4.5% above, for single filers. Joint filers and heads of household get double the bracket tops. House Bill 2764 collapsed six brackets into three and cut the top rate from 4.75% to 4.5% effective January 1, 2026.",
    },
    {
      q: "How much Oklahoma tax will I pay on $60,000 a year?",
      a: `A single filer with $60,000 of wages and no deductions owes about ${formatAmountOrUnavailable(EX_OK_60.annualState)} a year in Oklahoma income tax — an effective rate of ${effectiveRatePct(EX_OK_60.annualState, 60000)}% of gross. The $6,350 standard deduction and $1,000 personal exemption come off first, then the top rate applies to most of the rest.`,
    },
    {
      q: "What is the Oklahoma standard deduction and personal exemption?",
      a: "The standard deduction is $6,350 for single and married filing separately, $12,700 for joint, and $9,350 for head of household. The personal exemption is $1,000 each for yourself, your spouse, each dependent, and blindness — plus an extra $1,000 at age 65 or older, but only if your federal AGI is under the income limits ($15,000 single, $25,000 joint).",
    },
    {
      q: "What is Form OK-W-4?",
      a: "Oklahoma's Employee's State Withholding Allowance Certificate (revised March 2021). Count one allowance for yourself, one for a non-working spouse, and one for each dependent, then add extra allowances for itemized deductions and other Oklahoma deductions and credits. Do not mail it to the Oklahoma Tax Commission — it stays with your employer.",
    },
    {
      q: "When can I mark Exempt on the OK-W-4?",
      a: "If your income is below your personal exemption plus your standard deduction — $7,350 for a single filer and $14,700 joint, plus $1,000 per dependent. Mark Exempt on line 7 and no Oklahoma tax is withheld. A military spouse writes Exempt on line 8 and files Form OW-9-MSE.",
    },
    {
      q: "Does Oklahoma have a state earned income credit?",
      a: "Yes — the Oklahoma Earned Income Tax Credit is 5% of your federal earned income tax credit, prorated by the ratio of your Oklahoma adjusted gross income to your federal adjusted gross income. You may reduce your Oklahoma tax by up to 5% of your federal EITC, subject to eligibility, available tax liability, and the proration.",
    },
    {
      q: "What is the Sales Tax Relief Credit?",
      a: "$40 per qualifying household member, claimed on Form 538-S and subject to income caps. It is a separate credit from the earned income credit and the childcare credit.",
    },
    {
      q: "Is Social Security taxed in Oklahoma?",
      a: "No. Oklahoma subtracts Social Security benefits in full, with no cap and no age test. Military pay and military retirement are also excluded in full for residents.",
    },
    {
      q: "Is there a local income tax in Oklahoma?",
      a: "No. There is no city or county income tax anywhere in Oklahoma — the state line on your pay stub is the only Oklahoma income-tax line.",
    },
    {
      q: "When is the Oklahoma tax return due?",
      a: "April 15 for paper returns and April 20 for e-filed returns. Residents file Form 511; part-year residents and nonresidents file Form 511-NR. A nonresident must file if Oklahoma-source gross income is $1,000 or more.",
    },
    {
      q: "Do I need to make Oklahoma estimated payments?",
      a: "Only if you expect your tax to exceed withholding by $500 or more and your withholding covers less than 70% of your current-year liability (or less than your prior-year total tax). Estimates go on Form OW-8-ES, due April 15, June 15, and September 15, 2026, and January 15, 2027. There is no underpayment interest if your total liability is under $1,000.",
    },
    {
      q: "How much Oklahoma tax on $30,000 a year?",
      a: `A single filer with $30,000 of wages and no deductions owes about ${formatAmountOrUnavailable(EX_OK_30.annualState)} a year — an effective rate of ${effectiveRatePct(EX_OK_30.annualState, 30000)}% of gross. The $6,350 standard deduction and $1,000 exemption shelter a bigger share of a smaller salary, so the effective rate is lower than at $60,000.`,
    },
  ],
  "missouri-paycheck-calculator": [
    {
      q: "What are Missouri's income tax rates in 2026?",
      a: "Eight brackets: 0% to $1,348, then 2%, 2.5%, 3%, 3.5%, 4%, and 4.5% in $1,348 steps, then 4.7% above $9,436. The top rate was 6% in 2017 and has been cut in steps by revenue triggers to 4.7% for 2026. Figures of 4.95% still floating around on some sites are out of date.",
    },
    {
      q: "How much Missouri tax will I pay on $60,000 a year?",
      a: `About ${formatAmountOrUnavailable(EX_MO_60.annualState)} a year for a single filer with $60,000 of wages. Missouri lets you deduct 15% of your federal income tax at that income level (section 143.171), and the calculator models it: the deduction is ${formatUSD(60000 - engineTaxableIncome("missouri-paycheck-calculator", 60000) - 16100)}, computed from the federal income tax it estimates for the same pay — based on the calculator's estimated federal liability, not your actual federal tax — and worth about ${formatUSD((60000 - engineTaxableIncome("missouri-paycheck-calculator", 60000) - 16100) * 0.047)} at the 4.7% top rate.`,
    },
    {
      q: "What is Missouri's federal income tax deduction?",
      a: "Section 143.171 lets you deduct part of the federal income tax you paid: 35% if your Missouri gross income is $25,000 or less, 25% from $25,001 to $50,000, 15% from $50,001 to $100,000, 5% from $100,001 to $125,000, and 0% above $125,000 — capped at $5,000 single or $10,000 joint. The calculator models it from its own estimated federal liability — an estimate, not your actual federal tax.",
    },
    {
      q: "What is the Missouri standard deduction?",
      a: "The federal amount: $16,100 for single filers, married filing separately, and married couples where both spouses work; $32,200 for a married couple where one spouse does not work; and $24,150 for heads of household.",
    },
    {
      q: "Does Missouri have personal exemptions?",
      a: "No. Missouri has had no personal exemptions since 2019. The standard deduction is the main subtraction before the rates apply — on top of it, section 143.171 lets you subtract part of your federal income tax, which the calculator models from its own estimated federal liability.",
    },
    {
      q: "What is Form MO W-4?",
      a: "Missouri's Employee's Withholding Certificate (revised December 2024). There are no allowances to count — line 1 is your filing status, which sets your standard deduction, with a checkbox for a spouse who does not work, and line 2 takes an optional extra withholding amount per pay period. MO W-4A covers nonresidence and allocation; MO W-4P covers pension and annuity withholding.",
    },
    {
      q: "Does Missouri have reciprocity with Illinois or Kansas?",
      a: "No — Missouri has no reciprocity agreement with any state. A nonresident working in Missouri is withheld like a resident on Missouri-source wages. A Missouri resident working out of state files Form MO-1040 on all income and claims Form MO-CR, a credit for taxes paid to other states.",
    },
    {
      q: "Does Kansas City charge an earnings tax?",
      a: "Yes — 1% of earnings. Residents pay on all earnings wherever they are earned; nonresidents pay only on wages earned inside the city limits. Employers withhold it. The tax was renewed by voters on April 7, 2026, through 2031, with about 75% approval. It is not included in this calculator — a Kansas City worker on $60,000 a year owes another $600 to the city on top of the state bill.",
    },
    {
      q: "Does St. Louis charge an earnings tax?",
      a: "Yes — 1% of earnings, the same resident/nonresident rules as Kansas City, renewed by voters on April 7, 2026 (Proposition E, about 85% approval) through 2031. St. Louis also charges employers — not employees — a 0.5% payroll expense tax. St. Louis County is not the City of St. Louis: the county does not levy the earnings tax.",
    },
    {
      q: "Is Social Security taxed in Missouri?",
      a: "No, for taxpayers age 62 or older — Social Security benefits are fully exempt with no income limit since tax year 2024. Social Security disability benefits are fully exempt at any age. Public pensions, for example PSRS and PEERS, can be deducted up to 100%.",
    },
    {
      q: "What is the Missouri Property Tax Credit?",
      a: "The MO-PTC, or circuit breaker, is worth up to $1,100 for homeowners and $750 for renters, for seniors age 65 or older and people who are 100% disabled, subject to income limits. It is claimed on a separate Form MO-PTC, and you can file that form even if you have no other filing requirement.",
    },
    {
      q: "When is the Missouri tax return due?",
      a: "April 15, 2027, for 2026 returns. Residents file Form MO-1040. If you expect to owe Missouri tax after withholding, you can pay estimates on Form MO-1040ES — due April 15, June 15, and September 15, 2026, and January 15, 2027 — or simply raise the extra withholding on line 2 of your MO W-4 instead.",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* BATCH SOURCES — DOR / agency link first per state, then verified   */
/* official links. Every URL below returned HTTP 200 on curl, except  */
/* the two tn.gov pages, which return 403 to curl but were verified   */
/* live by text fetch on 2026-11-15.                                  */
/* ------------------------------------------------------------------ */

export const BATCH_SOURCES: Record<string, { label: string; url: string }[]> = {
  "kentucky-paycheck-calculator": [
    {
      label: "Kentucky Department of Revenue — Employer Payroll Withholding",
      url: "https://revenue.ky.gov/Business/Pages/Employer-Payroll-Withholding.aspx",
    },
    {
      label: "Kentucky Form K-4, Employee's Withholding Certificate (2026)",
      url: "https://revenue.ky.gov/Software-Developer/Software%20Development%20Documents/2026%20Kentucky%27s%20Withholding%20Certificate%2042A804%20%28K-4%29%2812-2025%29%20%282026%29.pdf",
    },
    {
      label: "Kentucky Form 740-NP Packet Instructions (2025)",
      url: "https://revenue.ky.gov/Forms/740-NP%20Packet%20Instructions%20%282025%29.pdf",
    },
    {
      label: "Tax Foundation — State Individual Income Tax Rates and Brackets, 2026",
      url: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    },
  ],
  "tennessee-paycheck-calculator": [
    {
      label: "Tennessee Department of Revenue",
      url: "https://www.tn.gov/revenue/",
    },
    {
      label: "Tennessee Department of Revenue — Hall Income Tax (repealed 2021)",
      url: "https://www.tn.gov/content/tn/revenue/taxes/hall-income-tax.html",
    },
    {
      label: "Tax Foundation — State Individual Income Tax Rates and Brackets, 2026",
      url: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    },
  ],
  "alabama-paycheck-calculator": [
    {
      label: "Alabama Department of Revenue — Withholding Tax",
      url: "https://www.revenue.alabama.gov/withholding-tax/",
    },
    {
      label: "Alabama Form A-4, Employee's Withholding Exemption Certificate (Rev. 4/2025)",
      url: "https://www.revenue.alabama.gov/wp-content/uploads/2025/04/A4_0425.pdf",
    },
    {
      label: "Alabama Department of Revenue",
      url: "https://www.revenue.alabama.gov/",
    },
    {
      label: "Tax Foundation — State Individual Income Tax Rates and Brackets, 2026",
      url: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    },
  ],
  "mississippi-paycheck-calculator": [
    {
      label: "Mississippi Department of Revenue — Individual Income Tax Forms",
      url: "https://www.dor.ms.gov/individual/individual-income-tax-forms",
    },
    {
      label: "Mississippi Form 89-350, Employee's Withholding Exemption Certificate (Rev. 10/25)",
      url: "https://www.dor.ms.gov/sites/default/files/tax-forms/business/89350258.pdf",
    },
    {
      label: "Tax Foundation — State Individual Income Tax Rates and Brackets, 2026",
      url: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    },
  ],
  "louisiana-paycheck-calculator": [
    {
      label: "Louisiana Department of Revenue — Individual Income Tax Rates and Brackets",
      url: "https://revenue.louisiana.gov/tax-education-and-faqs/faqs/income-tax-reform/what-are-the-individual-income-tax-rates-and-brackets/",
    },
    {
      label: "Louisiana Form L-4, Employee's Withholding Certificate (R-1300, 1/26)",
      url: "https://dam.ldr.la.gov/taxforms/1300-1-26-F.pdf",
    },
    {
      label: "Louisiana R-1306 — 2026 Withholding Tables and Formulas",
      url: "https://dam.ldr.la.gov/taxforms/1306-1-26.pdf",
    },
    {
      label: "Louisiana Department of Revenue — Tax Forms",
      url: "https://revenue.louisiana.gov/tax-forms/",
    },
  ],
  "arkansas-paycheck-calculator": [
    {
      label: "Arkansas Department of Finance and Administration — Withholding Tax Formula (effective 01/01/2026)",
      url: "https://www.dfa.arkansas.gov/wp-content/uploads/Withholding-Tax-Formula.pdf",
    },
    {
      label: "Arkansas Form AR4EC, Employee's Withholding Exemption Certificate (2026)",
      url: "https://www.dfa.arkansas.gov/wp-content/uploads/AR4EC2026.pdf",
    },
    {
      label: "Arkansas DFA — 2026 Employer Withholding Instructions",
      url: "https://www.dfa.arkansas.gov/wp-content/uploads/withholdInstructions_2026.pdf",
    },
  ],
  "oklahoma-paycheck-calculator": [
    {
      label: "Oklahoma Tax Commission — Withholding",
      url: "https://oklahoma.gov/tax/businesses/withholding.html",
    },
    {
      label: "Oklahoma Form OK-W-4, Employee's State Withholding Allowance Certificate (Rev. 3-2021)",
      url: "https://oklahoma.gov/content/dam/ok/en/tax/documents/forms/businesses/general/OK-W-4.pdf",
    },
    {
      label: "Oklahoma Tax Commission — Individuals",
      url: "https://oklahoma.gov/tax/individuals.html",
    },
    {
      label: "Tax Foundation — State Individual Income Tax Rates and Brackets, 2026",
      url: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    },
  ],
  "missouri-paycheck-calculator": [
    {
      label: "Missouri Department of Revenue — Employer's Tax Guide 2026 (Form 4282)",
      url: "https://dor.mo.gov/forms/4282_2026.pdf",
    },
    {
      label: "Missouri Department of Revenue — 2026 Withholding Formula",
      url: "https://dor.mo.gov/forms/Withholding%20Formula_2026.pdf",
    },
    {
      label: "Missouri Department of Revenue — Forms Search",
      url: "https://dor.mo.gov/forms/?formName=mo-",
    },
  ],
};
