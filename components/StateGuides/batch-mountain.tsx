/**
 * PaycheckBeam — Mountain / Plains batch: Nebraska, South Dakota,
 * North Dakota, Montana, Wyoming, Colorado, Utah, Idaho.
 *
 * Researched 2026-11-15 from opened official pages (see
 * ~/workspace/paycheckbeam-research/state-guides-mountain.md).
 * Every worked-example figure is generated at render time from the
 * shared engine via examplePaycheck() — never a literal string.
 *
 * One data correction found during research was applied to
 * lib/stateTaxData.ts: North Dakota's official 2026 ND-1ES schedule
 * (0% to $49,575 single / $82,800 joint, 1.95% to $250,400 /
 * $304,850, then 2.5%), so the North Dakota rows now match the
 * calculator with no flags. Utah's enacted 2026 rate is 4.45%
 * (S.B. 60, signed Mar 23, 2026, retroactive Jan 1, 2026) and was
 * also applied — but the $966 taxpayer tax credit still phases out
 * at higher incomes and the calculator applies it in full, so every
 * Utah row below is still flagged "Partial calculation".
 * Idaho's 0% band ($4,811 single) is the latest published threshold
 * (2025); the 2026 threshold had not been published when researched.
 */
import type { ReactNode } from "react";
import type { FaqItem } from "@/components/FaqAccordion";
import { applyBrackets, formatUSD, formatUSD0 } from "@/lib/paycheckCalc";
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
  "nebraska-paycheck-calculator",
  "south-dakota-paycheck-calculator",
  "north-dakota-paycheck-calculator",
  "montana-paycheck-calculator",
  "wyoming-paycheck-calculator",
  "colorado-paycheck-calculator",
  "utah-paycheck-calculator",
  "idaho-paycheck-calculator",
];

const NE_SLUG = "nebraska-paycheck-calculator";
const SD_SLUG = "south-dakota-paycheck-calculator";
const ND_SLUG = "north-dakota-paycheck-calculator";
const MT_SLUG = "montana-paycheck-calculator";
const WY_SLUG = "wyoming-paycheck-calculator";
const CO_SLUG = "colorado-paycheck-calculator";
const UT_SLUG = "utah-paycheck-calculator";
const ID_SLUG = "idaho-paycheck-calculator";

/** Shared example results reused by prose and FAQs — computed once at module load. */
const EX_NE_60 = examplePaycheck(NE_SLUG, 60000);
const EX_NE_150 = examplePaycheck(NE_SLUG, 150000);
const EX_ND_60 = examplePaycheck(ND_SLUG, 60000);
const EX_ND_150 = examplePaycheck(ND_SLUG, 150000);
const EX_MT_60 = examplePaycheck(MT_SLUG, 60000);
const EX_MT_150 = examplePaycheck(MT_SLUG, 150000);
const EX_CO_60 = examplePaycheck(CO_SLUG, 60000);
const EX_CO_150 = examplePaycheck(CO_SLUG, 150000);
const EX_UT_60 = examplePaycheck(UT_SLUG, 60000);
const EX_UT_150 = examplePaycheck(UT_SLUG, 150000);
const EX_ID_60 = examplePaycheck(ID_SLUG, 60000);
const EX_ID_150 = examplePaycheck(ID_SLUG, 150000);
const EX_SD_60 = examplePaycheck(SD_SLUG, 60000);
const EX_WY_60 = examplePaycheck(WY_SLUG, 60000);
const EX_CA_60 = examplePaycheck("california-paycheck-calculator", 60000);
const EX_NY_60 = examplePaycheck("new-york-paycheck-calculator", 60000, "none");

/* ------------------------------------------------------------------ */
/* NEBRASKA                                                            */
/* ------------------------------------------------------------------ */

function NebraskaContent() {
  const neRows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(NE_SLUG, gross);
    return [
      formatUSD0(gross),
      formatUSD0(stateTaxableIncome(NE_SLUG, gross)),
      formatAmountOrUnavailable(r.annualState),
    ];
  });
  const neState = getStateBySlug(NE_SLUG);
  const neBrackets = neState?.brackets ?? [];
  const neTaxable60 = stateTaxableIncome(NE_SLUG, 60000);
  const neCreditSingle = neState?.creditSingle ?? 0;
  const neTaxBeforeCredit60 = applyBrackets(neTaxable60, neBrackets);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          Nebraska tax at real salaries — three rates, one credit
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the 2026 standard
          deduction of $8,850, applies the three graduated rates, then
          subtracts the $176 personal exemption credit. The credit comes
          off the tax itself, not off your income — and it is $176 per
          person, so a married couple filing jointly gets $352.
        </Para>
        <NoteBox tone="blue">
          <strong>How to read this table:</strong> the income-tax column
          is your <strong>annual state liability estimate</strong> — what
          you owe for the year, settled on your tax return. It is not
          what comes out of a single paycheck: Nebraska employers
          withhold from the Circular EN tables, which use a slightly
          different method (see the W-4N section below), so a real pay
          stub can differ by a few dollars.
        </NoteBox>
        <WorkedTable
          caption="Nebraska income tax, single filer, 2026"
          headers={["Gross wages", "NE taxable income", "NE income tax"]}
          rows={neRows}
          footnote={`At $60,000 the effective Nebraska income-tax rate is ${effectiveRatePct(EX_NE_60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(EX_NE_150.annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          The $60,000 row in detail: {bracketDetailText(NE_SLUG, 60000, neBrackets)}; total{" "}
          {formatUSD(neTaxBeforeCredit60)}, minus the{" "}
          {formatUSD0(neCreditSingle)} personal exemption credit ={" "}
          {formatAmountOrUnavailable(EX_NE_60.annualState)}.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department of Revenue&apos;s own terms</Eyebrow>
        <SectionTitle>
          A shrinking top rate on a federal starting point
        </SectionTitle>
        <Para>
          Nebraska starts from your federal adjusted gross income, then
          subtracts the Nebraska standard deduction — $8,850 for single
          filers, $17,700 for married filing jointly, $12,950 for head of
          household in 2026 — or your Nebraska itemized deductions if
          those are larger. The tax is then figured in three effective
          rates: 2.46% on the first slice of taxable income, 3.51% on the
          middle slice, and 4.55% on the rest. The statute still lists
          four bracket rows, but the third and fourth both carry the 4.55%
          rate for 2026, so they work as one.
        </Para>
        <Para>
          The 4.55% top rate is the latest step in a legislated phasedown
          under LB 754: the top rate was 5.20% in 2025 and falls to 4.55%
          for 2026, then to 3.99% for 2027 and after. A raise that pushes
          you into the top bracket only taxes the dollars above the
          threshold at 4.55% — everything below keeps its lower rate.
        </Para>
        <Para>
          Nebraska taxes residents on all income and nonresidents on
          Nebraska-source income. If another state taxes the same wages,
          Nebraska gives residents a credit for tax paid to another state,
          so the same dollars are not taxed twice in full. Interest on
          federal bonds is subtracted from Nebraska income — it is one of
          the adjustments on Schedule I.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form W-4N"
        title="Nebraska still uses allowances — your W-4N decides them"
        summary="Unlike the federal W-4, Nebraska's W-4N still counts allowances, and each one is worth $2,440 a year in 2026. The how-to is inside."
      >
        <Para>
          Nebraska has its own withholding certificate, Form W-4N, the
          Nebraska Withholding Allowance Certificate. If you completed a
          federal Form W-4 on or after January 1, 2020, you must also
          complete a W-4N; an older federal W-4 on file keeps working
          without one. If you give your employer no W-4N, your employer
          must withhold as if you are single with no allowances — the
          heaviest default.
        </Para>
        <Para>
          The form works on allowances, not on the federal post-2020
          system: the Personal Allowances Worksheet gives one allowance
          for yourself, one for a spouse who is not working, and one per
          dependent, and each allowance is worth $2,440 a year in 2026 —
          your employer subtracts that value per allowance from the wages
          subject to withholding, then runs the Circular EN tables. Line 2
          is an additional flat dollar amount of Nebraska withholding per
          pay period, and line 3 is the exemption from withholding, which
          you can claim only if you meet the form&apos;s conditions. If
          your wages are not enough to cover the tax you will owe, ask
          for extra withholding on line 2 instead of making estimated
          payments.
        </Para>
        <Para>
          One thing to expect on a real pay stub: the Circular EN
          withholding tables top out at 4.60% for 2026, a touch above the
          4.55% top rate on the annual return, because withholding is
          computed per pay period rather than from the annual brackets.
          That is why the calculator&apos;s annual-liability figure and
          your withheld total can differ by a few dollars over the year,
          and why the return — not the stub — settles the difference.
          Bonuses and other supplemental wages paid separately can be
          withheld at a flat 3.5% for 2026 if your employer elects that
          method.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Credits · 2026 amounts · return-only"
        title="The Nebraska credits claimed on your return"
        summary="Earned income credit, property-tax credits, and the child-care credit. Claimed on Form 1040N; the calculator does not adjust withholding for them."
      >
        <Para>
          <strong className="text-slate-900">Nebraska earned income
          credit (refundable):</strong> 10% of your federal earned income
          credit, claimed on line 44 of Form 1040N. Residents and
          part-year residents who have a federal credit may claim it;
          nonresidents may not, and it is not available on a married
          filing separately return. Because it is refundable, it can
          produce a refund even if it is larger than the Nebraska tax you
          owe — a filer whose federal credit is $4,000 may reduce Nebraska
          tax by up to $400, subject to eligibility and the federal
          credit actually claimed.
        </Para>
        <Para>
          <strong className="text-slate-900">Property tax credits
          (refundable):</strong> Nebraska gives refundable credits for
          school district and community college property taxes paid,
          claimed with Form PTC. The credit is based on the property taxes
          you actually paid, so the amount varies by homeowner — it may
          reduce Nebraska tax by up to the credit computed on Form PTC,
          subject to eligibility and the taxes paid.
        </Para>
        <Para>
          <strong className="text-slate-900">Child and dependent care
          credit:</strong> a separate refundable Nebraska credit based on
          qualifying child-care expenses, claimed on Form 2441N, for
          residents and part-year residents with federal AGI of $29,000 or
          less. The personal exemption credit above ($176 per person) is
          different from all of these: it is built into the tax
          computation itself and the calculator already subtracts it.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form 1040N, and the $500 estimated-tax line"
        summary="The return is due April 15, 2027, and estimated payments start when the shortfall reaches $500. The detail is inside."
      >
        <Para>
          Full-year residents file Form 1040N, the Nebraska Individual
          Income Tax Return, due April 15, 2027 for the 2026 tax year.
          Part-year residents and nonresidents file the same form with
          Schedule III apportioning their income. There is no Nebraska
          local income tax — no city or county adds a wage tax on top of
          the state rate — and Nebraska has no reciprocity agreement with
          any state, so a Nebraska resident who works across a state line
          is taxed by the work state and claims the credit for tax paid to
          another state on the Nebraska return.
        </Para>
        <Para>
          You must make estimated payments on Form 1040N-ES if your
          Nebraska income tax, after personal exemption credits, is
          expected to exceed your withholding and other credits by $500 or
          more. Four equal installments are due April 15, June 15, and
          September 15, 2026, and January 15, 2027 — or pay the whole
          estimate with the first installment. To avoid an underpayment
          penalty, withholding plus payments must reach the smaller of 90%
          of the 2026 tax (66⅔% for farming, ranching, and fishing) or
          100% of the 2025 Nebraska tax — 110% if 2025 federal AGI was
          over $150,000 ($75,000 if married filing separately). No penalty
          applies if you had no 2025 liability and a full 12-month 2025
          return, if you are a first-time Nebraska filer, or if your 2026
          tax minus withholding is under $500.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* NORTH DAKOTA                                                        */
/* ------------------------------------------------------------------ */

function NorthDakotaContent() {
  const ndRows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(ND_SLUG, gross);
    return [
      formatUSD0(gross),
      formatUSD0(stateTaxableIncome(ND_SLUG, gross)),
      formatAmountOrUnavailable(r.annualState),
    ];
  });
  const ndState = getStateBySlug(ND_SLUG);
  const ndBrackets = ndState?.brackets ?? [];
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          North Dakota: the gentlest income tax of any state that has one
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the $16,100 federal
          standard deduction — North Dakota starts from federal taxable
          income, so the federal deduction flows straight in — and then
          applies the state schedule. The first slice of taxable income is
          taxed at 0%, so most North Dakota earners owe little or nothing.
        </Para>
        <NoteBox tone="blue">
          <strong>How to read this table:</strong> the income-tax column
          is your <strong>annual state liability estimate</strong> — what
          you owe for the year, settled on your tax return. At $30,000 and
          $60,000 the tax is $0.00 because the whole taxable income sits
          inside the 0% band.
        </NoteBox>
        <WorkedTable
          caption="North Dakota income tax, single filer, 2026"
          headers={["Gross wages", "ND taxable income", "ND income tax"]}
          rows={ndRows}
          footnote={`At $150,000 the effective North Dakota income-tax rate is ${effectiveRatePct(EX_ND_150.annualState, 150000)}% of gross. Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          The $150,000 row in detail:{" "}
          {bracketDetailText(ND_SLUG, 150000, ndBrackets)}; total{" "}
          {formatAmountOrUnavailable(EX_ND_150.annualState)}. The 0% band
          runs to $49,575 on the official 2026 schedule (Form ND-1ES), so
          most of the $133,900 of taxable income sits in the 1.95% slice.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Tax Commissioner&apos;s own terms</Eyebrow>
        <SectionTitle>
          Three rates, a wide 0% band, and the lowest top rate anywhere
        </SectionTitle>
        <Para>
          North Dakota&apos;s current schedule dates from House Bill 1158
          (2023), which replaced five brackets with three: 0% on the first
          slice of taxable income, 1.95% on the middle slice, and 2.5% at
          the top. The thresholds rise each year with inflation — the
          2026 single-filer bands are $0 to $49,575 at 0%, $49,575 to
          $250,400 at 1.95%, and over $250,400 at 2.5% ($82,800 and
          $304,850 for married filing jointly). At 2.5%, North Dakota has
          the lowest top rate of any state that taxes income.
        </Para>
        <Para>
          Because the state starts from federal taxable income, the
          federal standard deduction — $16,100 single, $32,200 joint in
          2026 — is already subtracted before the state schedule begins.
          A single filer earning $60,000 therefore has{" "}
          {formatUSD0(stateTaxableIncome(ND_SLUG, 60000))} of North
          Dakota taxable income, all of it inside the 0% band, and owes{" "}
          {formatAmountOrUnavailable(EX_ND_60.annualState)} in North
          Dakota income tax.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · federal W-4 + NDW-R"
        title="No North Dakota form — unless you live across the border"
        summary="North Dakota employers use your federal W-4. Minnesota and Montana residents use Form NDW-R instead. The detail is inside."
      >
        <Para>
          North Dakota has no state withholding certificate of its own:
          employers use the federal Form W-4 for North Dakota withholding.
          There is nothing extra to fill in when you start a North Dakota
          job — your federal W-4 drives both.
        </Para>
        <Para>
          The exception is reciprocity. North Dakota has income-tax
          reciprocity agreements with Minnesota and Montana: a resident of
          one state who works in the other pays tax only to the home
          state on those wages. A Minnesota or Montana resident working in
          North Dakota gives the employer Form NDW-R, Reciprocity
          Exemption from Withholding, and no North Dakota tax is withheld.
          A North Dakota resident working in Minnesota or Montana uses
          that state&apos;s corresponding form instead. Reciprocity covers
          wages and other personal-services income only — rent, business
          income, and other North Dakota-source income are still taxed by
          North Dakota. For Minnesota reciprocity, the worker must keep a
          permanent home in the resident state and return to it at least
          once each month.
        </Para>
        <Para>
          There is no local income tax anywhere in North Dakota — no city,
          county, or school district adds a wage tax — so the state rate
          is the only state-level tax on your paycheck.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Credits · property tax, not income tax"
        title="North Dakota's big credit is on your property tax bill"
        summary="The Primary Residence Credit is up to $1,600 against property tax — claimed separately from your income tax return. The detail is inside."
      >
        <Para>
          <strong className="text-slate-900">Primary Residence Credit
          (up to $1,600):</strong> a flat credit against the property tax
          on an owner-occupied primary residence, with no age or income
          limit and one credit per household. Homeowners apply online at
          tax.nd.gov/prc during the annual window, January 1 to April 1,
          for the credit against that year&apos;s property tax. It is a
          property-tax credit, not an income-tax credit: it never appears
          on your pay stub or your ND-1, and renters get nothing from it.
          The $1,600 amount comes from HB 1176 (2025), which raised it
          from $500 — and the program is paid for from earnings on the
          state Legacy Fund, so local governments do not lose the revenue.
        </Para>
        <Para>
          <strong className="text-slate-900">Homestead credit:</strong>{" "}
          homeowners age 65 or older, or permanently and totally disabled,
          may qualify for a reduction of up to $9,000 in the taxable value
          of their home, subject to income limits, applied for through the
          county by April 1. It stacks with the Primary Residence Credit —
          together they can wipe out a qualifying bill.
        </Para>
        <Para>
          North Dakota does not add a state earned income credit on top of
          the federal one, so there is no state EITC to claim on the ND-1.
          The income-tax credits on the return itself are narrow — the
          return&apos;s main job for most wage earners is the 0% band.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form ND-1, and the $1,000 estimated-tax line"
        summary="The return is due April 15, 2027. Estimated payments start at $1,000, with a 12% underpayment interest rate. The detail is inside."
      >
        <Para>
          Full-year residents file Form ND-1 (or the shorter ND-EZ),
          generally due April 15, 2027 for the 2026 tax year. Part-year
          residents and nonresidents file Form ND-1 with the
          apportionment schedule for North Dakota-source income.
        </Para>
        <Para>
          You must pay estimated North Dakota tax for 2026 on Form ND-1ES
          if all four conditions apply: you were required to pay estimated
          federal tax; your 2025 net North Dakota liability was $1,000 or
          more; you expect to owe $1,000 or more for 2026 after
          withholding; and your 2026 withholding will be less than the
          smaller of 90% of your 2026 liability or 100% of your 2025
          liability (66⅔% for qualified farmers). Four equal installments
          are due April 15, June 15, and September 15, 2026, and January
          15, 2027. Interest on an underpayment runs at 12% a year from
          the installment due date — and it applies even if your 2026
          return ends in a refund.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* MONTANA                                                             */
/* ------------------------------------------------------------------ */

function MontanaContent() {
  const mtRows = [30000, 60000, 150000, 250000].map((gross) => {
    const r = examplePaycheck(MT_SLUG, gross);
    return [
      formatUSD0(gross),
      formatUSD0(stateTaxableIncome(MT_SLUG, gross)),
      formatAmountOrUnavailable(r.annualState),
    ];
  });
  const mtState = getStateBySlug(MT_SLUG);
  const mtBrackets = mtState?.brackets ?? [];
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          Montana tax at real salaries — two rates since HB 337
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the $16,100 federal
          standard deduction — Montana starts from federal taxable income,
          so the federal deduction flows straight in — and then applies
          the two 2026 rates: 4.7% up to $47,500 of taxable income for a
          single filer, 5.65% above that.
        </Para>
        <NoteBox tone="blue">
          <strong>How to read this table:</strong> the income-tax column
          is your <strong>annual state liability estimate</strong> — what
          you owe for the year, settled on your Form 2. Montana employers
          withhold from the Department of Revenue&apos;s tables using the
          filing status on your MW-4, so a real pay stub can differ by a
          few dollars.
        </NoteBox>
        <WorkedTable
          caption="Montana income tax, single filer, 2026"
          headers={["Gross wages", "MT taxable income", "MT income tax"]}
          rows={mtRows}
          footnote={`At $60,000 the effective Montana income-tax rate is ${effectiveRatePct(EX_MT_60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(EX_MT_150.annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          The $60,000 row in detail: {bracketDetailText(MT_SLUG, 60000, mtBrackets)}; total{" "}
          {formatAmountOrUnavailable(EX_MT_60.annualState)} — all of it at
          4.7%, because the taxable income sits below the $47,500 line.
          At $150,000 the walk is 4.7% on the first $47,500 of taxable
          income and 5.65% on the rest.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department of Revenue&apos;s own terms</Eyebrow>
        <SectionTitle>
          Two rates, a wider lower bracket, and no sales tax
        </SectionTitle>
        <Para>
          House Bill 337, from the 2025 legislative session, rewrote
          Montana&apos;s rates for 2026 and 2027. For 2026 the lower 4.7%
          rate applies to taxable income up to $47,500 for single and
          married filing separately, $71,250 for head of household, and
          $95,000 for married filing jointly — and the top rate falls from
          5.9% to 5.65% above those lines. For 2027 the lower bracket
          widens again (to $65,000 single / $130,000 joint) and the top
          rate falls to 5.4%.
        </Para>
        <Para>
          Long-term capital gains are taxed separately, at 3.0% and 4.1%,
          on brackets that match the new ordinary-income ranges — so a
          Montana paycheck with only wages never sees those rates, but a
          gain on a sale does. Montana has no general sales tax, so income
          and property taxes carry more of the load than in states with a
          sales tax: the price on the shelf is the price you pay at the
          register, and the income-tax line on your pay stub does more of
          the work.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form MW-4"
        title="Montana dropped allowances — your MW-4 is now filing status only"
        summary="Since the 2026 method, there are no Montana allowances to count. The Department recommends a fresh MW-4 every year. The how-to is inside."
      >
        <Para>
          Montana does not accept the federal W-4 for state withholding:
          Form MW-4, the Montana Employee&apos;s Withholding and Exemption
          Certificate, is the form that counts. The method changed with
          the 2026 tables: employees no longer use Montana allowances —
          personal and dependent exemptions, or the Montana standard or
          itemized deductions — to set withholding. Instead the
          calculation closely resembles the federal method and relies on
          the federal standard deduction amount for your federal filing
          status. The MW-4 now asks for your filing status, any additional
          amount to withhold, and any exemption that applies — and nothing
          else.
        </Para>
        <Para>
          The Department of Revenue recommends completing a revised MW-4
          annually, and whenever your income or household changes — a
          marriage or divorce, for example. An MW-4 from before 2024 may
          be taking too little, because the formula changed in 2024 and
          again for 2026. Line 5 of the form is where you claim an
          exemption from Montana withholding, including the North Dakota
          reciprocity exemption below.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Reciprocity · North Dakota only"
        title="Montana's one reciprocity deal: North Dakota"
        summary="Wages across the Montana–North Dakota line are taxed only by the home state. The form is the MW-4 itself. The detail is inside."
      >
        <Para>
          Montana has a reciprocity agreement with North Dakota — its only
          one. Montana residents earning income in North Dakota pay
          Montana income tax instead of North Dakota income tax, and North
          Dakota residents earning wages in Montana may be exempt from
          Montana withholding by completing Form MW-4 and giving it to
          their employer. The agreement covers personal-services income
          only: salaries, wages, commissions, and fees earned as an
          employee. Other North Dakota or Montana income — rent, business
          income — can still be taxed by the source state.
        </Para>
        <Para>
          The paperwork matters: an employer must send the MW-4 used for
          a North Dakota reciprocity exemption to the Department of
          Revenue by the last day of the payroll period in which the form
          was received. If your employer withheld Montana tax on wages
          covered by the agreement, you get it back by filing a Montana
          individual income tax return — not by asking payroll to fix it
          after the fact.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Credits &amp; subtractions · 2026 amounts · return-only"
        title="The Montana EITC doubled for 2026 — and the other return-only breaks"
        summary="EITC at 20% of the federal credit, the elderly homeowner/renter credit, and the 529 and volunteer subtractions. The detail is inside."
      >
        <Para>
          <strong className="text-slate-900">Montana earned income tax
          credit (refundable):</strong> HB 337 raises it to 20% of the
          federal earned income tax credit, beginning in tax year 2026 —
          double the 10% it was before. It is refundable, so it can
          produce a refund larger than the Montana tax you owe. A filer
          whose federal credit is $4,000 may reduce Montana tax by up to
          $800, subject to eligibility and the federal credit actually
          claimed. Nonresidents cannot claim it.
        </Para>
        <Para>
          <strong className="text-slate-900">Elderly homeowner/renter
          credit (Schedule 2EC):</strong> a credit for homeowners and
          renters age 62 or older (the schedule is in the Form 2
          instructions), claimed with a copy of the property tax bill or
          signed rent receipts. Separately, the Property Tax Assistance
          Program (PTAP) and the Montana Disabled Veteran (MDV) program
          cut property taxes for qualifying homeowners — apply by April 15
          through the Department of Revenue.
        </Para>
        <Para>
          <strong className="text-slate-900">Subtractions from federal
          taxable income:</strong> contributions to a 529 or 529A plan are
          subtractable up to $4,500 per filer ($9,000 joint) for tax year
          2025, with annual inflation adjustments after that; and HB 129
          created a $3,000 subtraction for qualified volunteer
          firefighters and volunteer emergency care providers, also
          adjusted annually for inflation. These are return-only items —
          they do not change what is withheld from a paycheck.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form 2, and paying tax through the year"
        summary="The return is due April 15, 2027. Estimated payments use Worksheet ESA, with a 90% / 100% safe harbor. The detail is inside."
      >
        <Para>
          Full-year residents file Form 2, the Montana Individual Income
          Tax Return, due April 15, 2027 for the 2026 tax year.
          Part-year residents and nonresidents file the same form with the
          Montana-source apportionment. There is no local income tax in
          Montana — no city or county adds a wage tax — so the state rate
          is the only income-tax layer on a Montana paycheck (some resort
          communities levy a local resort tax on lodging and meals, which
          is a sales-style tax, not a wage tax).
        </Para>
        <Para>
          You must pay your Montana tax liability throughout the year —
          through employer withholding, installment payments of estimated
          tax, or both. Estimated payments use Worksheet ESA in Publication
          1. If you do not pay at least 90% of your current-year liability
          after credits, or 100% of your prior-year liability after
          credits, you may owe interest on the underpayment. You do not
          have to make estimated payments if at least two-thirds of your
          gross income comes from farming or ranching.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* COLORADO                                                            */
/* ------------------------------------------------------------------ */

function ColoradoContent() {
  const coRows = [30000, 60000, 150000, 250000].map((gross) => {
    const r = examplePaycheck(CO_SLUG, gross);
    return [
      formatUSD0(gross),
      formatUSD0(stateTaxableIncome(CO_SLUG, gross)),
      formatAmountOrUnavailable(r.annualState),
      formatUSD(r.annualStateInsurance),
    ];
  });
  const coState = getStateBySlug(CO_SLUG);
  const coTaxable60 = stateTaxableIncome(CO_SLUG, 60000);
  const coTaxable250 = stateTaxableIncome(CO_SLUG, 250000);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          Colorado tax at real salaries — one rate, plus FAMLI
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the $16,100 federal
          standard deduction — Colorado starts from federal taxable income,
          so the federal deduction flows straight in — and applies the
          single flat rate of 4.4%. The FAMLI column is separate: the
          state paid-family-and-medical-leave premium, 0.44% of wages as
          the employee share, up to the $184,500 wage cap.
        </Para>
        <NoteBox tone="blue">
          <strong>How to read this table:</strong> the income-tax column
          is your <strong>annual state liability estimate</strong> — what
          you owe for the year, settled on your DR 0104. The FAMLI column
          is different: FAMLI is <strong>withheld from every
          paycheck</strong>, so that column is what actually comes out of
          your pay. At $250,000 the FAMLI column stops growing — the
          $184,500 cap is reached.
        </NoteBox>
        <WorkedTable
          caption="Colorado income tax + FAMLI, single filer, 2026"
          headers={["Gross wages", "CO taxable income", "CO income tax", "CO FAMLI (0.44%)"]}
          rows={coRows}
          footnote={`At $60,000 the effective Colorado income-tax rate is ${effectiveRatePct(EX_CO_60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(EX_CO_150.annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          The $60,000 row in detail: 4.4% ×{" "}
          {formatUSD0(coTaxable60)} ={" "}
          {formatAmountOrUnavailable(EX_CO_60.annualState)}. Because the
          rate never changes, the effective rate barely moves as pay rises
          — the only thing that changes it is the $16,100 deduction
          getting smaller relative to income. At $250,000 the tax is 4.4%
          of {formatUSD0(coTaxable250)}, and FAMLI is capped at 0.44% of
          the $184,500 wage base.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department of Revenue&apos;s own terms</Eyebrow>
        <SectionTitle>
          A flat 4.4% on federal taxable income
        </SectionTitle>
        <Para>
          Colorado taxes income at a single flat rate of 4.4% in 2026.
          There are no brackets to climb and no separate Colorado standard
          deduction: line 1 of Form DR 0104 is your federal taxable
          income, after the federal standard or itemized deduction. A
          raise does not push any dollar into a higher rate — every
          taxable dollar costs the same 4.4 cents.
        </Para>
        <Para>
          The rate got here by voter-approved cuts: from 4.63% to 4.55%
          beginning in 2020, then to 4.4% beginning in 2022 under
          Proposition 121. Colorado&apos;s TABOR rules can also trigger a
          temporary rate reduction in a year when state revenue exceeds
          the constitutional limit — the 2026 estimated-tax worksheet
          (DR 0104EP) uses the 4.4% statutory rate, and any temporary
          reduction for 2026 would be published by the Department before
          the 2027 filing season.
        </Para>
        <Para>
          Colorado has no reciprocity agreement with any state, so a
          Colorado resident who works across a state line is taxed by the
          work state and claims a credit for tax paid to another state on
          the Colorado return.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form DR 0004"
        title="Your W-4 already covers Colorado — DR 0004 is optional fine-tuning"
        summary="Colorado withholds from your federal W-4 by default. DR 0004 is only for adjusting it. The how-to is inside."
      >
        <Para>
          Colorado is unusual: you are not required to complete a state
          withholding form at all. If you do not complete Form DR 0004,
          the Colorado Employee Withholding Certificate, your employer
          calculates your Colorado withholding from your IRS Form W-4 —
          and the form itself says that calculation is designed to
          withhold the tax due and will generally result in a refund when
          you file.
        </Para>
        <Para>
          Complete a DR 0004 only if you want to adjust that default: you
          earn most of your income from one job, you expect to claim
          federal itemized deductions or the Colorado child tax credit, or
          you expect significant income from sources that will not have
          withholding. The certificate is one page with two numbers: an
          annual withholding allowance on line 2 (from Table 1, or
          Worksheet 1 if you expect extra federal deductions or Colorado
          credits), and an additional amount per pay period on line 3
          (from Worksheet 2 if you have other income without withholding).
          Give it to your employer, and they must calculate your Colorado
          withholding from the amounts you entered. File a new one if your
          situation changes — and note that submitting a new federal W-4
          without a new DR 0004 revokes any prior DR 0004. Completing a
          DR 0004 usually increases take-home pay and reduces your refund,
          so enter the amounts carefully: too little withheld means tax
          owed at filing, and possibly a penalty.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="FAMLI · 0.44% employee share in 2026"
        title="The paid-leave premium on your pay stub"
        summary="FAMLI is 0.88% of wages in total, split 50/50 — your share is 0.44%, up to the $184,500 cap. The detail is inside."
      >
        <Para>
          Colorado&apos;s Family and Medical Leave Insurance program
          (FAMLI) charges a total premium of 0.88% of wages in 2026,
          split evenly between employer and employee — your share is
          0.44%, up to the $184,500 Social Security wage base. Your
          employer may cover part of your share, so the amount on your
          stub can be less than 0.44%. The premium is separate from income
          tax: it does not reduce your Colorado taxable income, and it
          buys up to 12 weeks of paid family and medical leave (plus 4
          more weeks for pregnancy or childbirth complications).
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Credits · 2026 amounts · return-only"
        title="The Colorado credits claimed on your return"
        summary="EITC at 25% of the federal credit for 2026, the child tax credit up to $1,200 — and the Family Affordability credit is paused this year. The detail is inside."
      >
        <Para>
          <strong className="text-slate-900">Colorado earned income tax
          credit (refundable):</strong> 25% of your federal EITC for tax
          year 2026, down from 50% for tax years 2024 and 2025. It is
          refundable, so it can produce a refund even if you owe no
          Colorado tax. A filer whose federal credit is $4,000 may reduce
          Colorado tax by up to $1,000, subject to eligibility and the
          federal credit actually claimed.
        </Para>
        <Para>
          <strong className="text-slate-900">Colorado child tax credit
          (refundable):</strong> up to $1,200 per eligible child under age
          6 at the end of the tax year, with the amount depending on your
          income — $200, $600, or $1,200 per child — for adjusted gross
          income under the Department&apos;s annual threshold. It is
          claimed on Form DR 0104CN, and a valid ITIN is enough: the
          credit is not limited to Social Security number holders.
        </Para>
        <Para>
          <strong className="text-slate-900">Family Affordability Tax
          Credit — paused for 2026:</strong> the state must temporarily
          pause this credit for tax year 2026 (filed in 2027) because the
          December 2025 revenue forecast projected insufficient growth.
          The separate Colorado Child Tax Credit above is not paused and
          remains available.
        </Para>
        <Para>
          <strong className="text-slate-900">Child care credit:</strong>{" "}
          for tax years from 2026, the two old child-care credits are
          merged into one worth 70% of the federal child and dependent
          care credit, for resident filers with federal AGI of $60,000 or
          less (adjusted annually for inflation) — even if you do not
          qualify for the federal credit itself. A filer whose federal
          credit is $1,000 may reduce Colorado tax by up to $700, subject
          to eligibility and the federal credit amount.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Local taxes · flat monthly head taxes, not rates"
        title="Denver's $5.75-a-month head tax — and the other cities that charge one"
        summary="No Colorado city takes a percentage of your wages. Denver, Glendale, Greenwood Village and Sheridan charge a flat monthly occupational privilege tax. The detail is inside."
      >
        <Para>
          Colorado has no city or county income tax — no municipality
          takes a slice of your wages. What Denver and a few other cities
          charge instead is an occupational privilege tax (OPT): a flat
          monthly amount for the privilege of working in the city, whether
          or not you live there. Denver&apos;s employee OPT is $5.75 per
          month, withheld by your employer, for any month in which you
          earn at least $500 for work performed in Denver — $69 a year no
          matter what you earn. Your employer pays a separate $4.00 per
          month per taxable employee. Glendale, Greenwood Village, and
          Sheridan run their own smaller versions; Aurora repealed its OPT
          effective January 1, 2025.
        </Para>
        <Para>
          The calculator above does not include the OPT, because it is a
          fixed monthly charge rather than a rate on wages: if you work in
          Denver, subtract $69 a year from the take-home pay shown. It is
          the only local tax that touches a Colorado paycheck.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form DR 0104, and the $1,000 estimated-tax line"
        summary="The return is due April 15, 2027, with an automatic six-month extension to file. Estimated payments start at $1,000. The detail is inside."
      >
        <Para>
          Full-year residents file Form DR 0104, the Colorado Individual
          Income Tax Return, due April 15, 2027 for the 2026 tax year.
          Colorado grants an automatic six-month extension to file — to
          October 15, 2027 — with no form required, but that is an
          extension to file, not to pay: any tax due must still be paid by
          April 15, 2027. Part-year residents and nonresidents file the
          same form with the DR 0104PN apportionment schedule.
        </Para>
        <Para>
          You must pay estimated tax on Form DR 0104EP if you expect to
          owe more than $1,000 in net Colorado tax for 2026, after
          subtracting withholding and credits — the usual case for
          self-employment, interest, dividends, and rents. Four
          installments are due April 15, June 15, and September 15, 2026,
          and January 15, 2027. The required annual amount is the smaller
          of 70% of your actual 2026 net Colorado tax or 100% of your
          preceding year&apos;s net tax (110% if the preceding year&apos;s
          federal AGI was over $150,000, or over $75,000 if married filing
          separately) — or 50% of actual tax if at least two-thirds of
          your income is from farming or fishing. Farmers and fishermen
          who file and pay in full by March 1, 2027 avoid the estimated
          penalty.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* UTAH                                                                */
/* ------------------------------------------------------------------ */

function UtahContent() {
  const utRows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(UT_SLUG, gross);
    return [
      formatUSD0(gross),
      formatUSD0(stateTaxableIncome(UT_SLUG, gross)),
      formatAmountOrUnavailable(r.annualState),
    ];
  });
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          Utah tax at real salaries — partial, because the 2026 credit
          phaseout isn&apos;t in the calculator yet
        </SectionTitle>
        <Para>
          Utah&apos;s rate for 2026 is 4.45%, cut from 4.5% by Senate Bill
          60 in the 2026 session. These rows are shown at the 4.45% rate
          with the full taxpayer tax credit applied — and they are
          <strong> partial calculations</strong>: the credit actually phases
          out at higher incomes (see the note below), so the true liability
          is higher than the number in the table, not lower. Use these rows
          as a floor, not a final answer.
        </Para>
        <NoteBox tone="amber">
          <strong>Why these rows are partial:</strong> one thing is not
          yet modelled. The taxpayer tax credit phases out at a rate of
          1.3% of income above a low threshold, so the full credit shown
          here does not survive at higher incomes. The rate in the table
          is the enacted 4.45% (S.B. 60, Laws of Utah 2026, Chapter
          250); the credit phaseout is the remaining gap. The direction
          is clear: the true 2026 liability is higher than the table
          shows at every income above the phaseout threshold.
        </NoteBox>
        <WorkedTable
          caption="Utah income tax, single filer, 2026 — partial calculation"
          headers={["Gross wages", "UT taxable income", "UT income tax"]}
          rows={utRows}
          partialRowIndexes={[0, 1, 2]}
          footnote={`The $60,000 row shows an effective rate of ${effectiveRatePct(EX_UT_60.annualState, 60000)}% of gross, and the $150,000 row ${effectiveRatePct(EX_UT_150.annualState, 150000)}% — both understate the true liability because of the unmodelled credit phaseout. Every row is generated from the same calculation the calculator above runs, so the figures match the tool; they are flagged partial because the credit phaseout is not modelled.`}
        />
        <Para>
          The $60,000 row in detail: Utah starts from federal adjusted
          gross income, not federal taxable income, and Utah has no state
          standard deduction — so the middle column is the full $60,000 of
          gross wages, and the taxpayer tax credit of $966 for a single
          filer is subtracted from the tax itself, not from income. At the
          4.45% rate the computation is 4.45% × {formatUSD0(stateTaxableIncome(UT_SLUG, 60000))} ={" "}
          {formatUSD(0.0445 * stateTaxableIncome(UT_SLUG, 60000))}, minus the $966 credit ={" "}
          {formatAmountOrUnavailable(EX_UT_60.annualState)}. With the phaseout applied, the credit shrinks and the
          liability rises.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Tax Commission&apos;s own terms</Eyebrow>
        <SectionTitle>
          One flat rate — cut every year since 2022
        </SectionTitle>
        <Para>
          Utah taxes individual income at a single flat rate: 5% when the
          flat tax began in 2008, then 4.95%, 4.85% in 2022, 4.65% in
          2023, 4.55% in 2024, 4.5% in 2025, and 4.45% for 2026 under S.B.
          60, signed March 23, 2026 and retroactive to tax years beginning
          on or after January 1, 2026. The Tax Commission&apos;s own rates
          page still lists 4.5% as the current rate — that page is stale
          against the enacted statute, and the 4.45% figure here is the one
          to use.
        </Para>
        <Para>
          Utah starts from federal adjusted gross income, not federal
          taxable income. There is no Utah standard deduction to take: in
          its place is the taxpayer tax credit, worth 6% of the federal
          standard deduction — $966 for a single filer in 2026 ($1,932
          joint) — plus 6% of the personal exemption for each dependent.
          The credit phases out at 1.3% of income above a low threshold
          (the 2025 threshold was $18,213), and it is reduced by any Utah
          EITC, child tax credit, at-home parent credit, or Social Security
          benefits credit you claim. The phaseout is why the worked
          examples above are partial: at higher incomes the credit is
          mostly or entirely gone.
        </Para>
        <Para>
          Utah has no reciprocity agreement with any state, so a Utah
          resident working across a state line is taxed by the work state
          and claims a credit for tax paid to another state on the Utah
          return. There is no local income tax anywhere in Utah.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · no Utah W-4"
        title="Utah has no separate state withholding form — your federal W-4 does the work"
        summary="Employers read your filing status from the federal W-4 and use Publication 14. Extra withholding goes on W-4 line 4(c). The detail is inside."
      >
        <Para>
          Utah does not have its own withholding certificate. Your
          employer determines Utah withholding from your federal W-4 —
          the filing status you claimed — and the withholding schedules in
          the Tax Commission&apos;s Publication 14. The schedules are
          designed so that the amount withheld approximates the tax due on
          the return.
        </Para>
        <Para>
          If you need more withheld, write the extra amount per pay period
          on line 4(c) of your federal W-4 — that flows through to Utah
          withholding as well. If you have income that is not subject to
          withholding, you can pay voluntarily in advance with Form TC-546
          (Utah does not require quarterly estimated payments from
          individuals). The annual withholding schedule your employer gives
          you, TC-40W, is attached to your return — it is not a form you
          fill in to set withholding.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Credits · return-only"
        title="Utah's nonrefundable credits — none of them touch your paycheck"
        summary="EITC at 20% of the federal credit, the $1,000 child tax credit, the Social Security benefits credit. All claimed on the TC-40. The detail is inside."
      >
        <Para>
          <strong className="text-slate-900">Utah earned income tax
          credit (nonrefundable):</strong> 20% of your federal earned
          income tax credit, limited to the lesser of 20% of the federal
          credit or your total Utah W-2 wages. It is nonrefundable — it
          can reduce your Utah tax to zero but cannot produce a refund on
          its own. A filer whose federal credit is $4,000 and who earned
          at least that much in Utah wages may reduce Utah tax by up to
          $800, subject to eligibility and available Utah tax liability.
        </Para>
        <Para>
          <strong className="text-slate-900">Utah child tax credit
          (nonrefundable):</strong> $1,000 per qualifying child under age
          6 at the end of the tax year, subject to income limits. A filer
          with two qualifying children may reduce Utah tax by up to
          $2,000, subject to eligibility and available Utah tax liability.
        </Para>
        <Para>
          <strong className="text-slate-900">Social Security benefits
          credit (nonrefundable):</strong> a credit against the Utah tax
          on Social Security benefits included in federal AGI, phased out
          at higher incomes — the higher your income, the smaller the
          credit. The Tax Commission also offers a credit for a parent who
          stays home with a child under 12 months (up to $100 per child).
          All of these are return-only: they reduce the tax on your TC-40,
          not the withholding from your paycheck.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing · return-only"
        title="The TC-40, and what happens when the credit runs out"
        summary="The return is due April 15, 2027, with an automatic six-month extension to file. The detail is inside."
      >
        <Para>
          Full-year residents file Form TC-40, the Utah Individual Income
          Tax Return, due April 15, 2027 for the 2026 tax year. Utah
          grants an automatic six-month extension to file, to October 15,
          2027, with no form required — but that is an extension to file,
          not to pay, and any tax due must still be paid by April 15,
          2027. Part-year residents and nonresidents file the same form
          with the TC-40B apportionment schedule.
        </Para>
        <Para>
          One practical warning: because the taxpayer tax credit phases
          out and the Utah credits are all nonrefundable, a Utah filer
          whose employer withholds on the assumption of a full credit can
          owe at the return — especially at $150,000 and above, where the
          credit is largely gone. If your pay has risen this year, check
          the withholding against the phased-out credit, and add an extra
          amount on W-4 line 4(c) if the numbers say you will owe.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* IDAHO                                                               */
/* ------------------------------------------------------------------ */

function IdahoContent() {
  const idRows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(ID_SLUG, gross);
    return [
      formatUSD0(gross),
      formatUSD0(stateTaxableIncome(ID_SLUG, gross)),
      formatAmountOrUnavailable(r.annualState),
    ];
  });
  const idState = getStateBySlug(ID_SLUG);
  const idBrackets = idState?.brackets ?? [];
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          Idaho tax at real salaries — a 0% band, then a flat 5.3%
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the $16,100 federal
          standard deduction — Idaho starts from federal taxable income,
          so the federal deduction flows straight in — and then applies the
          two-step Idaho schedule: 0% on the first $4,811 of taxable
          income for a single filer, 5.3% on everything above it.
        </Para>
        <NoteBox tone="blue">
          <strong>How to read this table:</strong> the income-tax column
          is your <strong>annual state liability estimate</strong> — what
          you owe for the year, settled on your Form 40. Idaho employers
          withhold from the State Tax Commission&apos;s tables using the
          filing status on your W-4, so a real pay stub can differ by a few
          dollars. The $4,811 threshold is the latest published figure;
          the 2026 threshold had not been published when this page was
          researched — the difference would be a few dollars at most.
        </NoteBox>
        <WorkedTable
          caption="Idaho income tax, single filer, 2026"
          headers={["Gross wages", "ID taxable income", "ID income tax"]}
          rows={idRows}
          footnote={`At $60,000 the effective Idaho income-tax rate is ${effectiveRatePct(EX_ID_60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(EX_ID_150.annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          The $60,000 row in detail: {bracketDetailText(ID_SLUG, 60000, idBrackets)}; total{" "}
          {formatAmountOrUnavailable(EX_ID_60.annualState)}. Because the
          rate above the 0% band is a single 5.3%, the effective rate rises
          slowly with pay — the 0% band matters less and less as income
          grows.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the State Tax Commission&apos;s own terms</Eyebrow>
        <SectionTitle>
          A flat 5.3% — cut from 5.695% in 2025
        </SectionTitle>
        <Para>
          House Bill 40, signed in March 2025 and retroactive to January 1,
          2025, cut Idaho&apos;s single rate from 5.695% to 5.3% — the rate
          that applies for 2026. Idaho starts from federal taxable income,
          so the federal standard deduction ($16,100 single in 2026) is
          already in the number before Idaho tax begins, and the first
          $4,811 of Idaho taxable income is taxed at 0% ($9,622 for married
          filing jointly). The 0% threshold is indexed annually under Idaho
          Code 63-3024; the published figure at research time was the 2025
          threshold.
        </Para>
        <Para>
          Idaho has no reciprocity agreement with any state, so an Idaho
          resident working across a state line is taxed by the work state
          and claims a credit for taxes paid to another state on the Idaho
          return. There is no local income tax in Idaho — no city or county
          adds a wage tax.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Idaho W-4"
        title="Idaho's own W-4: the filing status decides the allowance"
        summary="Your Idaho W-4 filing status sets the withholding allowance. Supplemental wages are withheld at the flat 5.3%. The detail is inside."
      >
        <Para>
          Idaho employers withhold using the Idaho Form W-4 — a separate
          certificate from the federal W-4. The filing status you claim on
          the Idaho W-4 decides the withholding allowance: $16,100 for a
          single filer, $32,200 for married filing jointly, matching the
          federal standard deduction. If you do not file one, the employer
          withholds at the single rate.
        </Para>
        <Para>
          Supplemental wages — bonuses, commissions, and similar one-off
          payments — are withheld at the flat 5.3% rate. The withholding
          tables were revised on July 23, 2026 after the Idaho Child Tax
          Credit sunset under § 63-3029L, so if your employer&apos;s payroll
          software has not updated its tables, the amount withheld can
          differ from what the return shows.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Credits · return-only"
        title="The refundable food tax credit — claimable even without filing"
        summary="The grocery credit is $155 per person, or up to $250 with receipts, and it's refundable. The detail is inside."
      >
        <Para>
          <strong className="text-slate-900">Food tax credit
          (refundable):</strong> because Idaho taxes groceries, residents
          get a credit of $155 per person — or up to $250 per person if you
          have grocery receipts to prove the larger amount. It is
          refundable, so it can produce a refund larger than the Idaho tax
          you owe, and it is claimable on Form 24 even if you are not
          required to file an income tax return at all. A household of four
          may reduce Idaho tax by up to $620 (or up to $1,000 with
          receipts), subject to eligibility.
        </Para>
        <Para>
          <strong className="text-slate-900">Credit for taxes paid to
          another state:</strong> Idaho residents who paid income tax to
          another state on income that is also taxed by Idaho claim the
          credit on the return — the amount is the smaller of the tax paid
          to the other state and the Idaho tax on that same income.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Form 40, and Idaho's voluntary estimated payments"
        summary="The return is due April 15, 2027. Idaho does not require estimated payments from individuals — but you can prepay. The detail is inside."
      >
        <Para>
          Full-year residents file Form 40, the Idaho Individual Income Tax
          Return, due April 15, 2027 for the 2026 tax year. Part-year
          residents and nonresidents file Form 43. A nonresident or
          part-year resident must file if their Idaho-source gross income
          is more than $2,500. The filing thresholds for residents are
          based on gross income: a single filer under age 65 must file if
          gross income is $15,750 or more (2025 figures — the 2026
          thresholds are published with the 2026 instructions).
        </Para>
        <Para>
          Idaho does not require estimated payments from individuals. If
          your income is not subject to withholding — self-employment,
          rents, interest — you can prepay voluntarily at any time with
          Form 51, so the balance due on April 15 is smaller. Prepaying is
          optional; there is no estimated-tax penalty for individuals who
          do not.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* SOUTH DAKOTA                                                        */
/* ------------------------------------------------------------------ */

function SouthDakotaContent() {
  const sdRows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(SD_SLUG, gross);
    return [
      formatUSD0(gross),
      formatAmountOrUnavailable(r.annualFederal),
      formatUSD0(r.annualSocialSecurity),
      formatUSD0(r.annualMedicare),
      formatAmountOrUnavailable(r.annualState),
      formatAmountOrUnavailable(r.annualNet),
    ];
  });
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          South Dakota: no state income tax — the full paycheck
        </SectionTitle>
        <Para>
          There is no South Dakota income tax to calculate, so this table
          shows the whole paycheck: gross wages, federal income tax, Social
          Security, Medicare, and the state line — which is $0.00 at every
          income — and the take-home pay that results. The only state
          deductions in South Dakota are the ones that are not income tax.
        </Para>
        <NoteBox tone="blue">
          <strong>How to read this table:</strong> the $0.00 in the state
          column is a genuinely calculated zero — South Dakota has no
          personal income tax — not missing data. The take-home column is
          what lands in your bank account after federal tax, Social
          Security, and Medicare only.
        </NoteBox>
        <WorkedTable
          caption="South Dakota paycheck, single filer, 2026"
          headers={["Gross wages", "Federal tax", "Social Security", "Medicare", "SD income tax", "Take-home pay"]}
          rows={sdRows}
          footnote={`Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          Compare the $60,000 row with the same salary in a taxing state:
          in California the state income tax alone is{" "}
          {formatAmountOrUnavailable(EX_CA_60.annualState)}, and in New
          York State it is {formatAmountOrUnavailable(EX_NY_60.annualState)}
          — South Dakota keeps all of that. That is the whole story of a
          South Dakota pay stub: the state simply never appears on it.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the Department of Revenue&apos;s own terms</Eyebrow>
        <SectionTitle>
          No income tax at all — and no corporate income tax either
        </SectionTitle>
        <Para>
          South Dakota does not have a corporate, unitary, or personal
          income tax — the Department of Revenue says so in its own tax
          guide, in plain words. There is no state return to file, no
          withholding form, no estimated payments, and no state income-tax
          line on a pay stub. Your federal W-4 is the only withholding form
          your employer needs.
        </Para>
        <Para>
          The state still has to be paid for, and it is paid for mostly
          through sales tax and property tax. The state sales and use tax
          is 4.2% — cut temporarily from 4.5% in 2023, and scheduled to
          sunset back to 4.5% on June 30, 2027 unless the legislature
          extends it — and municipalities add up to 2% on top, plus a 1%
          municipal gross receipts tax on lodging, food, and alcohol. In
          most cities the combined rate at the register is 6.2% or more.
          Groceries are taxed at the full rate: a 2024 ballot measure to
          exempt food failed, so the weekly shop carries the same tax as
          everything else.
        </Para>
        <Para>
          Property tax is levied locally — by counties, cities, and school
          districts — and owner-occupied homes are assessed at a reduced
          rate. There is no estate or inheritance tax in South Dakota.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="What shows on the stub · no state form"
        title="Your pay stub has no state line — and the federal one does all the work"
        summary="No state withholding form, no state return, nothing to file. The detail is inside."
      >
        <Para>
          A South Dakota pay stub shows federal income tax, Social
          Security, and Medicare — and nothing else. There is no South
          Dakota withholding certificate to fill in when you start a job:
          the federal W-4 is the only form. There is no state return to
          file in April, and no estimated payments to make. The only
          withholding decision you make is federal.
        </Para>
        <Para>
          One warning: South Dakota residency does not shield income earned
          in another state. If you live in Sioux Falls and work remotely
          for a Minnesota employer, or cross into Iowa for a shift,
          the work state can still tax that income — and South Dakota has
          no income tax to credit it against. Remote workers should check
          the work state&apos;s rules before assuming the $0 state line
          travels with them.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="The trade-off · sales and property tax"
        title="What you pay instead of income tax"
        summary="The state leans on a 4.2% sales tax and local property taxes. The detail is inside."
      >
        <Para>
          The trade for no income tax is a heavier reliance on
          consumption and property taxes. At 4.2% state plus up to 2%
          municipal, a household that spends most of what it earns pays a
          meaningful share of its income in sales tax — and because
          groceries are taxed at the full rate, the tax lands on
          necessities as well as luxuries. Property tax, levied by
          counties, cities, and school districts, is the other pillar:
          owner-occupied homes get a reduced assessment rate, which softens
          the bill for residents, but the bill still arrives every year.
        </Para>
        <Para>
          Whether that trade leaves you better off depends on how you earn
          and spend. A high earner who saves a large share of income comes
          out well ahead of the same salary in California or New York. A
          household that spends nearly everything it earns pays more of
          that income in sales tax than a low-income-tax state would take
          — and the property-tax bill does not care whether your income
          rose or fell that year.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* WYOMING                                                             */
/* ------------------------------------------------------------------ */

function WyomingContent() {
  const wyRows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(WY_SLUG, gross);
    return [
      formatUSD0(gross),
      formatAmountOrUnavailable(r.annualFederal),
      formatUSD0(r.annualSocialSecurity),
      formatUSD0(r.annualMedicare),
      formatAmountOrUnavailable(r.annualState),
      formatAmountOrUnavailable(r.annualNet),
    ];
  });
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          Wyoming: no state income tax — the full paycheck
        </SectionTitle>
        <Para>
          There is no Wyoming income tax to calculate, so this table shows
          the whole paycheck: gross wages, federal income tax, Social
          Security, Medicare, and the state line — which is $0.00 at every
          income — and the take-home pay that results. The only state
          deductions in Wyoming are the ones that are not income tax.
        </Para>
        <NoteBox tone="blue">
          <strong>How to read this table:</strong> the $0.00 in the state
          column is a genuinely calculated zero — Wyoming has no personal
          income tax — not missing data. The take-home column is what lands
          in your bank account after federal tax, Social Security, and
          Medicare only.
        </NoteBox>
        <WorkedTable
          caption="Wyoming paycheck, single filer, 2026"
          headers={["Gross wages", "Federal tax", "Social Security", "Medicare", "WY income tax", "Take-home pay"]}
          rows={wyRows}
          footnote={`Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <Para>
          Compare the $60,000 row with the same salary in a taxing state:
          in California the state income tax alone is{" "}
          {formatAmountOrUnavailable(EX_CA_60.annualState)}, and in New
          York State it is {formatAmountOrUnavailable(EX_NY_60.annualState)}
          — Wyoming keeps all of that. That is the whole story of a Wyoming
          pay stub: the state simply never appears on it.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the state&apos;s own terms</Eyebrow>
        <SectionTitle>
          No income tax — the legislature never enacted one, paid for by minerals
        </SectionTitle>
        <Para>
          Wyoming has no personal income tax and no corporate income tax
          — not because the constitution forbids one, but because the
          legislature never enacted one. Article 15, Section 18 of the
          Wyoming Constitution does not bar an income tax: it says no tax
          shall be imposed upon income without allowing full credit
          against that liability for all sales, use, and ad valorem taxes
          paid in the taxable year by the same taxpayer to any taxing
          authority in Wyoming. That wording presupposes an income tax
          may be imposed — it conditions one on the credit, it does not
          prohibit it. The $0 line is therefore a legislative choice, not
          a constitutional bar: a future legislature could enact an income
          tax, subject to that credit. There is no state return to file,
          no withholding form, no estimated payments, and no state
          income-tax line on a pay stub. Your federal W-4 is the only
          withholding form your employer needs.
        </Para>
        <Para>
          The state is paid for very differently from most states. Wyoming
          levies severance taxes on the minerals taken out of the ground —
          6% on oil and 6% on natural gas — plus taxes on coal and trona,
          and it saves a share of that revenue in the Permanent Wyoming
          Mineral Trust Fund, created in 1974, whose earnings help fund
          state government. When mineral prices fall, the state budget
          feels it directly, which is why Wyoming&apos;s finances are more
          volatile than a state funded by income tax.
        </Para>
        <Para>
          The other pillar is sales tax: 4% at the state level (3% base
          plus 1% added in 1993), with local option taxes adding up to 3%
          more, so the combined rate at the register is generally 4% to 8%
          depending on the county. Groceries are exempt from sales tax.
          Property tax is assessed locally, with the state setting the
          assessment rules and overseeing the counties.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="What shows on the stub · no state form"
        title="Your pay stub has no state line — and the federal one does all the work"
        summary="No state withholding form, no state return, nothing to file. The detail is inside."
      >
        <Para>
          A Wyoming pay stub shows federal income tax, Social Security,
          and Medicare — and nothing else. There is no Wyoming withholding
          certificate to fill in when you start a job: the federal W-4 is
          the only form. There is no state return to file in April, and no
          estimated payments to make. The only withholding decision you
          make is federal.
        </Para>
        <Para>
          One warning: Wyoming residency does not shield income earned in
          another state. If you live in Cheyenne and work remotely for a
          Colorado employer, or cross into Utah for a shift, the work state
          can still tax that income — and Wyoming has no income tax to
          credit it against. Remote workers should check the work
          state&apos;s rules before assuming the $0 state line travels with
          them.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="The trade-off · minerals and sales tax"
        title="What you pay instead of income tax"
        summary="Mineral revenue and a 4% sales tax carry the state. The detail is inside."
      >
        <Para>
          The trade for no income tax is a state budget that rises and
          falls with the price of oil, gas, and coal. In a good year the
          severance taxes and the Mineral Trust Fund earnings cover the
          state&apos;s bills with room to spare; in a bad year the
          legislature cuts spending or draws on savings, because there is
          no income tax to fall back on. That volatility is the price of
          the $0 line — and it is why Wyoming&apos;s budget debates are
          about mineral prices, not tax rates.
        </Para>
        <Para>
          For the individual, the trade is simpler. A high earner who
          saves a large share of income comes out well ahead of the same
          salary in California or New York, and groceries are exempt from
          the 4% sales tax, which softens the consumption-tax bite. The
          bill that does arrive is property tax, assessed locally under
          state rules — and it does not care whether your income rose or
          fell that year.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* BATCH WIRING                                                        */
/* ------------------------------------------------------------------ */

export function BatchContent({ slug }: { slug: string }) {
  if (slug === NE_SLUG) return <NebraskaContent />;
  if (slug === SD_SLUG) return <SouthDakotaContent />;
  if (slug === ND_SLUG) return <NorthDakotaContent />;
  if (slug === MT_SLUG) return <MontanaContent />;
  if (slug === WY_SLUG) return <WyomingContent />;
  if (slug === CO_SLUG) return <ColoradoContent />;
  if (slug === UT_SLUG) return <UtahContent />;
  if (slug === ID_SLUG) return <IdahoContent />;
  return null;
}

/* ------------------------------------------------------------------ */
/* BATCH FAQS                                                          */
/*                                                                     */
/* Every engine figure below is interpolated from the module-level     */
/* examplePaycheck() consts — no literal dollar amounts from the       */
/* calculator appear in any answer. Statutory figures (rates,          */
/* thresholds, credit amounts published by the DOR) are literal.       */
/* ------------------------------------------------------------------ */

export const BATCH_FAQS: Record<string, FaqItem[]> = {
  [NE_SLUG]: [
    {
      q: "How much Nebraska income tax do I pay on a $60,000 salary?",
      a: `As a single filer with wages only, about ${formatAmountOrUnavailable(EX_NE_60.annualState)} a year — an effective rate of ${effectiveRatePct(EX_NE_60.annualState, 60000)}% of gross pay. Your Nebraska taxable income is ${formatUSD0(stateTaxableIncome(NE_SLUG, 60000))} after the $8,850 Nebraska standard deduction, taxed at 2.46% on the first dollars, 3.51% in the middle, and 4.55% at the top.`,
    },
    {
      q: "What are Nebraska's income tax rates for 2026?",
      a: "Three graduated rates: 2.46%, 3.51%, and 4.55%. The top rate fell from 5.20% in 2025 to 4.55% in 2026 under LB 754, and it is scheduled to fall again to 3.99% in 2027.",
    },
    {
      q: "What is Nebraska's standard deduction for 2026?",
      a: "$8,850 for single and married filing separately, $17,700 for married filing jointly, and $12,950 for head of household. Nebraska also gives a personal exemption credit of $176 per person ($352 for a joint return) — a credit against the tax itself, not a deduction.",
    },
    {
      q: "What is the Nebraska W-4N, and do I have to fill one out?",
      a: "The W-4N is Nebraska's own withholding certificate. You must complete one if your federal W-4 is dated on or after January 1, 2020. If you don't file one, your employer withholds as if you were single with no allowances. Line 2 is where you add extra withholding per pay period, and line 3 is where you claim an exemption from Nebraska withholding.",
    },
    {
      q: "Does Nebraska have an earned income tax credit?",
      a: "Yes — a refundable credit worth 10% of your federal earned income tax credit, claimed on line 44 of Form 1040N. Because it is refundable it can produce a refund larger than the Nebraska tax you owe. It is available to residents and part-year residents, but not to married-filing-separately filers. A filer whose federal credit is $4,000 may reduce Nebraska tax by up to $400, subject to eligibility and the federal credit actually claimed.",
    },
    {
      q: "What are Nebraska's property tax credits?",
      a: "Nebraska gives two refundable property tax credits, claimed with Form PTC: a school-district credit and a community-college credit. They reduce the tax on your Form 1040N directly, and because they are refundable they can produce a refund even if you owe no Nebraska tax. The amounts depend on the property taxes you actually paid.",
    },
    {
      q: "How much Nebraska tax on $150,000?",
      a: `As a single filer with wages only, about ${formatAmountOrUnavailable(EX_NE_150.annualState)} a year — an effective rate of ${effectiveRatePct(EX_NE_150.annualState, 150000)}% of gross pay, on Nebraska taxable income of ${formatUSD0(stateTaxableIncome(NE_SLUG, 150000))}. Most of the income is taxed at the 4.55% top rate.`,
    },
    {
      q: "Do I have to pay Nebraska estimated tax?",
      a: "Yes, if you expect to owe $500 or more in Nebraska tax after withholding and credits — the usual case for self-employment, rent, interest, and dividends. Use Form 1040N-ES, with four installments due April 15, June 15, and September 15, 2026, and January 15, 2027. The safe harbor is 90% of this year's tax or 100% of last year's (110% if your 2025 federal AGI was over $150,000, or over $75,000 if married filing separately).",
    },
    {
      q: "Does Nebraska have a local income tax?",
      a: "No. No Nebraska city or county levies an income tax on wages, so the state rate is the only income-tax layer on a Nebraska paycheck.",
    },
    {
      q: "Does Nebraska have reciprocity with any state?",
      a: "No. Nebraska has no income-tax reciprocity agreement with any state, so if you work across a state line you pay the work state's tax and claim a credit for tax paid to another state on your Nebraska return.",
    },
    {
      q: "What income does Nebraska not tax?",
      a: "Interest on federal bonds is subtracted from Nebraska income, and Nebraska excludes some Social Security benefits from tax, subject to federal AGI limits. Wages, salaries, and business income are all fully taxable.",
    },
    {
      q: "When is my Nebraska return due?",
      a: "Form 1040N, the Nebraska Individual Income Tax Return, is due April 15, 2027 for the 2026 tax year.",
    },
  ],

  [ND_SLUG]: [
    {
      q: "How much North Dakota income tax do I pay on a $60,000 salary?",
      a: `Nothing — ${formatAmountOrUnavailable(EX_ND_60.annualState)}. Your North Dakota taxable income is ${formatUSD0(stateTaxableIncome(ND_SLUG, 60000))} after the $16,100 federal standard deduction, and the 0% rate covers all of it. The first tax you owe starts when taxable income passes the 0% threshold.`,
    },
    {
      q: "What are North Dakota's income tax rates for 2026?",
      a: "Three rates under HB 1158: 0% on the first $49,575 of taxable income for a single filer ($82,800 joint), 1.95% up to $250,400 ($304,850 joint), and 2.5% above that. Those are the official 2026 figures from Form ND-1ES.",
    },
    {
      q: "How much North Dakota tax on $150,000?",
      a: `As a single filer with wages only, about ${formatAmountOrUnavailable(EX_ND_150.annualState)} a year — an effective rate of ${effectiveRatePct(EX_ND_150.annualState, 150000)}% of gross pay. That figure uses the official 2026 schedule from Form ND-1ES — 0% to $49,575, 1.95% to $250,400, then 2.5%.`,
    },
    {
      q: "Is there a North Dakota withholding form?",
      a: "No. North Dakota employers withhold using your federal W-4 only — there is no state withholding certificate to fill in.",
    },
    {
      q: "Does North Dakota have reciprocity with Minnesota or Montana?",
      a: "Yes, both. Minnesota and Montana residents working in North Dakota can claim exemption from North Dakota withholding with Form NDW-R, and North Dakota residents working in Minnesota or Montana use the other state's form. The agreements cover wages and other personal-services income only, and the Minnesota agreement requires you to keep your permanent home in your resident state and return there at least once a month.",
    },
    {
      q: "What is North Dakota's Primary Residence Credit?",
      a: "A credit of up to $1,600 against the property tax on an owner-occupied primary residence, paid from Legacy Fund earnings. There is no age or income limit, one credit per household, and you apply between January 1 and April 1 at tax.nd.gov/prc.",
    },
    {
      q: "Does North Dakota have a state earned income tax credit?",
      a: "No. North Dakota has no state EITC — the federal EITC is the only earned income credit available to North Dakota filers.",
    },
    {
      q: "Do I have to pay North Dakota estimated tax?",
      a: "Yes, if you expect to owe $1,000 or more in North Dakota tax after withholding and credits — the usual case for self-employment and investment income. Use Form ND-1ES, with four installments due April 15, June 15, and September 15, 2026, and January 15, 2027. The safe harbor is 90% of this year's tax or 100% of last year's, and underpayment interest runs at 12% a year — even if your return ends in a refund.",
    },
    {
      q: "Does North Dakota have a local income tax?",
      a: "No. No North Dakota city or county levies an income tax on wages, so the state rate is the only income-tax layer on a North Dakota paycheck.",
    },
    {
      q: "When is my North Dakota return due?",
      a: "Form ND-1 (or the shorter ND-EZ) is due April 15, 2027 for the 2026 tax year.",
    },
    {
      q: "Why is my North Dakota tax $0 at $60,000 but not at $150,000?",
      a: `Because the 0% rate covers the first $49,575 of taxable income. At $60,000 your taxable income of ${formatUSD0(stateTaxableIncome(ND_SLUG, 60000))} sits entirely inside the 0% band. At $150,000 your taxable income is ${formatUSD0(stateTaxableIncome(ND_SLUG, 150000))}, so the part above the threshold is taxed at 1.95%.`,
    },
  ],

  [MT_SLUG]: [
    {
      q: "How much Montana income tax do I pay on a $60,000 salary?",
      a: `As a single filer with wages only, about ${formatAmountOrUnavailable(EX_MT_60.annualState)} a year — an effective rate of ${effectiveRatePct(EX_MT_60.annualState, 60000)}% of gross pay. Your Montana taxable income is ${formatUSD0(stateTaxableIncome(MT_SLUG, 60000))} after the $16,100 federal standard deduction, and all of it is taxed at the 4.7% lower rate.`,
    },
    {
      q: "What are Montana's income tax rates for 2026?",
      a: "Two rates under HB 337: 4.7% on taxable income up to $47,500 for single filers ($71,250 head of household, $95,000 joint), and 5.65% above that. For 2027 the lower bracket widens to $65,000 single ($130,000 joint) and the top rate falls to 5.4%.",
    },
    {
      q: "How much Montana tax on $150,000?",
      a: `As a single filer with wages only, about ${formatAmountOrUnavailable(EX_MT_150.annualState)} a year — an effective rate of ${effectiveRatePct(EX_MT_150.annualState, 150000)}% of gross pay, on Montana taxable income of ${formatUSD0(stateTaxableIncome(MT_SLUG, 150000))}. The first $47,500 of taxable income is taxed at 4.7% and the rest at 5.65%.`,
    },
    {
      q: "What is the Montana MW-4, and what changed in 2026?",
      a: "The MW-4 is Montana's employee withholding certificate — Montana does not accept the federal W-4 for state withholding. Since the 2026 method there are no Montana allowances to count: the calculation now resembles the federal method and relies on the federal standard deduction. The form asks for your filing status, any additional amount to withhold, and any exemption that applies. The Department of Revenue recommends a revised MW-4 every year and whenever your income or household changes.",
    },
    {
      q: "Does Montana have reciprocity with North Dakota?",
      a: "Yes — Montana's only reciprocity agreement. Montana residents earning income in North Dakota pay Montana tax instead of North Dakota tax, and North Dakota residents working in Montana can be exempt from Montana withholding by completing Form MW-4. It covers personal-services income only — salaries, wages, commissions, and fees. If Montana tax was withheld on covered wages, you get it back by filing a Montana return.",
    },
    {
      q: "Does Montana have an earned income tax credit?",
      a: "Yes — and it doubled for 2026. HB 337 raises the Montana EITC to 20% of the federal credit, beginning in tax year 2026, up from 10%. It is refundable, so it can produce a refund larger than the Montana tax you owe. A filer whose federal credit is $4,000 may reduce Montana tax by up to $800, subject to eligibility and the federal credit actually claimed.",
    },
    {
      q: "Does Montana have a sales tax?",
      a: "No. Montana has no general sales tax — the price on the shelf is the price you pay at the register. Income and property taxes carry more of the load instead.",
    },
    {
      q: "Does Montana have a local income tax?",
      a: "No. No Montana city or county levies an income tax on wages. Some resort communities levy a local resort tax on lodging and meals, which is a sales-style tax, not a wage tax.",
    },
    {
      q: "How are long-term capital gains taxed in Montana?",
      a: "At separate lower rates: 3.0% and 4.1%, on brackets that match the ordinary-income ranges. A paycheck with only wages never sees those rates, but a gain on a sale does.",
    },
    {
      q: "Do I have to pay Montana estimated tax?",
      a: "You must pay your Montana tax through the year — through employer withholding, installment payments of estimated tax, or both. Estimated payments use Worksheet ESA in Publication 1. If you do not pay at least 90% of your current-year liability after credits, or 100% of your prior-year liability after credits, you may owe interest on the underpayment.",
    },
    {
      q: "When is my Montana return due?",
      a: "Form 2, the Montana Individual Income Tax Return, is due April 15, 2027 for the 2026 tax year.",
    },
    {
      q: "What subtractions can I claim on a Montana return?",
      a: "Contributions to a 529 or 529A plan are subtractable up to $4,500 per filer ($9,000 joint) for tax year 2025, with annual inflation adjustments after that, and HB 129 created a $3,000 subtraction for qualified volunteer firefighters and volunteer emergency care providers. These are return-only items — they do not change what is withheld from a paycheck.",
    },
  ],

  [CO_SLUG]: [
    {
      q: "How much Colorado income tax do I pay on a $60,000 salary?",
      a: `As a single filer with wages only, about ${formatAmountOrUnavailable(EX_CO_60.annualState)} a year in income tax — an effective rate of ${effectiveRatePct(EX_CO_60.annualState, 60000)}% of gross pay — plus ${formatUSD(EX_CO_60.annualStateInsurance)} in FAMLI premiums withheld from your paychecks. Your Colorado taxable income is ${formatUSD0(stateTaxableIncome(CO_SLUG, 60000))} after the $16,100 federal standard deduction, taxed at the flat 4.4% rate.`,
    },
    {
      q: "What is Colorado's income tax rate for 2026?",
      a: "A single flat rate of 4.4% on federal taxable income. There are no brackets — every taxable dollar costs the same 4.4 cents — and no separate Colorado standard deduction: line 1 of Form DR 0104 is your federal taxable income.",
    },
    {
      q: "How much Colorado tax on $150,000?",
      a: `As a single filer with wages only, about ${formatAmountOrUnavailable(EX_CO_150.annualState)} a year in income tax — an effective rate of ${effectiveRatePct(EX_CO_150.annualState, 150000)}% of gross pay — plus ${formatUSD(EX_CO_150.annualStateInsurance)} in FAMLI premiums. Because the rate is flat, the effective rate barely moves as pay rises.`,
    },
    {
      q: "What is FAMLI, and how much does it cost me?",
      a: `Colorado's paid family and medical leave program charges a total premium of 0.88% of wages in 2026, split evenly — your share is 0.44%, up to the $184,500 wage base. At $60,000 that is ${formatUSD(EX_CO_60.annualStateInsurance)} a year; at $150,000 it is ${formatUSD(EX_CO_150.annualStateInsurance)} a year. At $250,000 the premium is capped at ${formatUSD(examplePaycheck(CO_SLUG, 250000).annualStateInsurance)} because the wage base is reached. Your employer may cover part of your share, so your stub can show less.`,
    },
    {
      q: "Do I have to fill out a Colorado DR 0004?",
      a: "No — Colorado withholds from your federal W-4 by default, and that calculation is designed to withhold the tax due. Complete a DR 0004 only if you want to adjust it: you earn most of your income from one job, you expect to itemize federally or claim the Colorado child tax credit, or you expect significant income without withholding. Line 2 is your annual withholding allowance; line 3 is an additional amount per pay period.",
    },
    {
      q: "Does Colorado have an earned income tax credit?",
      a: "Yes — a refundable credit worth 25% of your federal EITC for tax year 2026, down from 50% for tax years 2024 and 2025. Because it is refundable it can produce a refund even if you owe no Colorado tax. A filer whose federal credit is $4,000 may reduce Colorado tax by up to $1,000, subject to eligibility and the federal credit actually claimed.",
    },
    {
      q: "What is Colorado's child tax credit for 2026?",
      a: "Up to $1,200 per eligible child under age 6 at the end of the tax year — $200, $600, or $1,200 per child depending on your income — for adjusted gross income under the Department's annual threshold. It is refundable, claimed on Form DR 0104CN, and a valid ITIN is enough. A filer with two eligible children at the top tier may reduce Colorado tax by up to $2,400, subject to eligibility and available tax liability.",
    },
    {
      q: "Is the Family Affordability Tax Credit available for 2026?",
      a: "No — the state must temporarily pause it for tax year 2026 (filed in 2027) because the December 2025 revenue forecast projected insufficient growth. The separate Colorado Child Tax Credit above is not paused and remains available.",
    },
    {
      q: "What is Denver's occupational privilege tax?",
      a: "$5.75 a month — $69 a year — withheld by your employer, for any month in which you earn at least $500 for work performed in Denver. It is a flat monthly charge, not a percentage of wages, so it is the same whether you earn $30,000 or $300,000. Your employer pays a separate $4.00 a month per taxable employee. Glendale, Greenwood Village, and Sheridan run their own smaller versions; Aurora repealed its OPT effective January 1, 2025.",
    },
    {
      q: "Do I have to pay Colorado estimated tax?",
      a: "Yes, if you expect to owe more than $1,000 in net Colorado tax after withholding and credits — the usual case for self-employment, interest, dividends, and rents. Use Form DR 0104EP, with four installments due April 15, June 15, and September 15, 2026, and January 15, 2027. The required annual amount is the smaller of 70% of your actual 2026 net Colorado tax or 100% of the preceding year's net tax (110% if the preceding year's federal AGI was over $150,000).",
    },
    {
      q: "When is my Colorado return due?",
      a: "Form DR 0104 is due April 15, 2027 for the 2026 tax year. Colorado grants an automatic six-month extension to file — to October 15, 2027 — with no form required, but that is an extension to file, not to pay: any tax due must still be paid by April 15, 2027.",
    },
    {
      q: "Does Colorado have reciprocity with any state?",
      a: "No. Colorado has no income-tax reciprocity agreement with any state, so if you work across a state line you pay the work state's tax and claim a credit for tax paid to another state on your Colorado return.",
    },
  ],

  [UT_SLUG]: [
    {
      q: "How much Utah income tax do I pay on a $60,000 salary?",
      a: `The calculator shows about ${formatAmountOrUnavailable(EX_UT_60.annualState)} a year — an effective rate of ${effectiveRatePct(EX_UT_60.annualState, 60000)}% of gross pay — but treat that as a floor, not a final answer. It is a partial calculation: the rate used is the enacted 4.45%, but the full $966 taxpayer tax credit is applied, even though the credit phases out at higher incomes. The true 2026 liability is higher than the figure shown.`,
    },
    {
      q: "What is Utah's income tax rate for 2026?",
      a: "4.45% — cut from 4.5% by Senate Bill 60 in the 2026 session, signed March 23, 2026 and retroactive to tax years beginning on or after January 1, 2026. The Tax Commission's own rates page still lists 4.5%, but that page is stale against the enacted statute. The rate has been cut every year since 2022: 4.85%, 4.65%, 4.55%, 4.5%, and now 4.45%.",
    },
    {
      q: "Why are the Utah examples on this page partial calculations?",
      a: "One thing is not yet in the calculator: the taxpayer tax credit phases out at 1.3% of income above a low threshold, so the full credit does not survive at higher incomes. The rate in the table is the enacted 4.45% (S.B. 60). The true 2026 liability is higher than the table shows at every income above the phaseout threshold.",
    },
    {
      q: "What is Utah's taxpayer tax credit?",
      a: "A credit worth 6% of the federal standard deduction — $966 for a single filer in 2026 ($1,932 joint) — plus 6% of the personal exemption for each dependent. It phases out at 1.3% of income above a low threshold, and it is reduced by any Utah EITC, child tax credit, at-home parent credit, or Social Security benefits credit you claim.",
    },
    {
      q: "Is there a Utah withholding form?",
      a: "No. Utah does not have its own withholding certificate. Your employer determines Utah withholding from your federal W-4 — the filing status you claimed — and the withholding schedules in the Tax Commission's Publication 14. To have more withheld, write the extra amount per pay period on line 4(c) of your federal W-4.",
    },
    {
      q: "Does Utah have an earned income tax credit?",
      a: "Yes — a nonrefundable credit worth 20% of your federal earned income tax credit, limited to the lesser of 20% of the federal credit or your total Utah W-2 wages. Because it is nonrefundable it can reduce your Utah tax to zero but cannot produce a refund on its own. A filer whose federal credit is $4,000 and who earned at least that much in Utah wages may reduce Utah tax by up to $800, subject to eligibility and available Utah tax liability.",
    },
    {
      q: "Does Utah have a child tax credit?",
      a: "Yes — a nonrefundable credit of $1,000 per qualifying child under age 6 at the end of the tax year, subject to income limits. A filer with two qualifying children may reduce Utah tax by up to $2,000, subject to eligibility and available Utah tax liability.",
    },
    {
      q: "When is my Utah return due?",
      a: "Form TC-40 is due April 15, 2027 for the 2026 tax year. Utah grants an automatic six-month extension to file, to October 15, 2027, with no form required — but that is an extension to file, not to pay, and any tax due must still be paid by April 15, 2027.",
    },
    {
      q: "Do I have to pay Utah estimated tax?",
      a: "No — Utah does not require quarterly estimated payments from individuals. If you have income that is not subject to withholding, you can pay voluntarily in advance with Form TC-546.",
    },
    {
      q: "Does Utah have a local income tax or reciprocity?",
      a: "Neither. There is no local income tax anywhere in Utah, and Utah has no reciprocity agreement with any state — a Utah resident working across a state line pays the work state's tax and claims a credit for tax paid to another state on the Utah return.",
    },
    {
      q: "Does Utah tax Social Security benefits?",
      a: "Social Security benefits included in federal AGI are included in Utah income, but Utah offers a nonrefundable Social Security benefits credit that phases out at higher incomes — the higher your income, the smaller the credit.",
    },
  ],

  [ID_SLUG]: [
    {
      q: "How much Idaho income tax do I pay on a $60,000 salary?",
      a: `As a single filer with wages only, about ${formatAmountOrUnavailable(EX_ID_60.annualState)} a year — an effective rate of ${effectiveRatePct(EX_ID_60.annualState, 60000)}% of gross pay. Your Idaho taxable income is ${formatUSD0(stateTaxableIncome(ID_SLUG, 60000))} after the $16,100 federal standard deduction; the first $4,811 of it is taxed at 0% and the rest at the flat 5.3% rate.`,
    },
    {
      q: "What is Idaho's income tax rate for 2026?",
      a: "A single flat rate of 5.3% on taxable income above the 0% band — $4,811 for a single filer, $9,622 for married filing jointly. House Bill 40 cut the rate from 5.695% to 5.3%, retroactive to January 1, 2025.",
    },
    {
      q: "How much Idaho tax on $150,000?",
      a: `As a single filer with wages only, about ${formatAmountOrUnavailable(EX_ID_150.annualState)} a year — an effective rate of ${effectiveRatePct(EX_ID_150.annualState, 150000)}% of gross pay, on Idaho taxable income of ${formatUSD0(stateTaxableIncome(ID_SLUG, 150000))}. Because the rate above the 0% band is a single 5.3%, the effective rate rises only slowly as pay grows.`,
    },
    {
      q: "What is the Idaho W-4, and how do I fill it out?",
      a: "Idaho employers withhold using the Idaho Form W-4 — a separate certificate from the federal W-4. The filing status you claim decides the withholding allowance: $16,100 for a single filer, $32,200 for married filing jointly. If you do not file one, your employer withholds at the single rate.",
    },
    {
      q: "What is Idaho's food tax credit?",
      a: "A refundable credit of $155 per person — or up to $250 per person if you have grocery receipts to prove the larger amount — because Idaho taxes groceries. It is refundable, so it can produce a refund larger than the Idaho tax you owe, and it is claimable on Form 24 even if you are not required to file an income tax return at all. A household of four may reduce Idaho tax by up to $620 (or up to $1,000 with receipts), subject to eligibility.",
    },
    {
      q: "Do I have to pay Idaho estimated tax?",
      a: "No — Idaho does not require estimated payments from individuals. If your income is not subject to withholding, you can prepay voluntarily at any time with Form 51, so the balance due on April 15 is smaller. Prepaying is optional; there is no estimated-tax penalty for individuals who do not.",
    },
    {
      q: "When is my Idaho return due?",
      a: "Form 40, the Idaho Individual Income Tax Return, is due April 15, 2027 for the 2026 tax year. Part-year residents and nonresidents file Form 43, and a nonresident or part-year resident must file if their Idaho-source gross income is more than $2,500.",
    },
    {
      q: "Does Idaho have a local income tax?",
      a: "No. No Idaho city or county levies an income tax on wages, so the state rate is the only income-tax layer on an Idaho paycheck.",
    },
    {
      q: "Does Idaho have reciprocity with any state?",
      a: "No. Idaho has no income-tax reciprocity agreement with any state, so if you work across a state line you pay the work state's tax and claim a credit for taxes paid to another state on your Idaho return.",
    },
    {
      q: "What if I work in Idaho but live in another state?",
      a: "You file Form 43, the part-year resident and nonresident return, and Idaho taxes only your Idaho-source income. You must file if your Idaho-source gross income is more than $2,500, and you claim a credit for taxes paid to another state on income taxed by both states.",
    },
    {
      q: "Why did Idaho's withholding tables change in 2026?",
      a: "The State Tax Commission revised the withholding tables on July 23, 2026 after the Idaho Child Tax Credit sunset under § 63-3029L. If your employer's payroll software has not updated its tables, the amount withheld can differ from what the return shows.",
    },
  ],

  [SD_SLUG]: [
    {
      q: "How much South Dakota income tax do I pay on a $60,000 salary?",
      a: `Nothing — ${formatAmountOrUnavailable(EX_SD_60.annualState)}. South Dakota has no personal income tax, so your take-home pay is ${formatAmountOrUnavailable(EX_SD_60.annualNet)} after federal tax, Social Security, and Medicare only. There is no state line on a South Dakota pay stub.`,
    },
    {
      q: "Does South Dakota really have no income tax?",
      a: "Yes — South Dakota does not have a corporate, unitary, or personal income tax, in the Department of Revenue's own words. There is no state return to file, no withholding form, no estimated payments, and no state income-tax line on a pay stub.",
    },
    {
      q: "What withholding form do I fill out in South Dakota?",
      a: "None for the state. The federal W-4 is the only withholding form your employer needs — there is no South Dakota withholding certificate.",
    },
    {
      q: "What tax do I pay in South Dakota instead of income tax?",
      a: "Mostly sales tax and property tax. The state sales and use tax is 4.2% — cut temporarily from 4.5% in 2023, and scheduled to return to 4.5% on June 30, 2027 unless the legislature extends it — and municipalities add up to 2% on top, plus a 1% municipal gross receipts tax on lodging, food, and alcohol. Property tax is levied locally by counties, cities, and school districts, with owner-occupied homes assessed at a reduced rate.",
    },
    {
      q: "Does South Dakota tax groceries?",
      a: "Yes — groceries are taxed at the full sales-tax rate. A 2024 ballot measure to exempt food failed, so the weekly shop carries the same tax as everything else.",
    },
    {
      q: "Does South Dakota have an estate or inheritance tax?",
      a: "No. South Dakota has no estate or inheritance tax.",
    },
    {
      q: "How much would I save versus California or New York on $60,000?",
      a: `In California the state income tax alone on a $60,000 salary is ${formatAmountOrUnavailable(EX_CA_60.annualState)}, and in New York State it is ${formatAmountOrUnavailable(EX_NY_60.annualState)} — South Dakota keeps all of that. The saving grows with income, because the other states' rates rise while South Dakota's stays at zero.`,
    },
    {
      q: "Does living in South Dakota shield income I earn in another state?",
      a: "No. South Dakota residency does not shield income earned in another state — if you work remotely for a Minnesota employer or cross into Iowa for a shift, the work state can still tax that income, and South Dakota has no income tax to credit it against.",
    },
    {
      q: "What is my take-home pay in South Dakota on $150,000?",
      a: `As a single filer with wages only, ${formatAmountOrUnavailable(examplePaycheck(SD_SLUG, 150000).annualNet)} a year after federal tax, Social Security, and Medicare — with ${formatAmountOrUnavailable(examplePaycheck(SD_SLUG, 150000).annualState)} in state income tax.`,
    },
    {
      q: "Do I have to file any South Dakota tax return?",
      a: "No. There is no South Dakota individual income tax return, and no estimated payments to make. Your only April filing is the federal return.",
    },
    {
      q: "Is South Dakota's no-income-tax status permanent?",
      a: "It is the long-standing structure of the state's tax system, funded instead by sales and property taxes. The 4.2% sales-tax rate is the temporary piece: it sunsets back to 4.5% on June 30, 2027 unless the legislature extends the cut.",
    },
  ],

  [WY_SLUG]: [
    {
      q: "How much Wyoming income tax do I pay on a $60,000 salary?",
      a: `Nothing — ${formatAmountOrUnavailable(EX_WY_60.annualState)}. Wyoming has no personal income tax, so your take-home pay is ${formatAmountOrUnavailable(EX_WY_60.annualNet)} after federal tax, Social Security, and Medicare only. There is no state line on a Wyoming pay stub.`,
    },
    {
      q: "Does Wyoming really have no income tax?",
      a: "Yes — but not because the constitution forbids one. Article 15, Section 18 of the Wyoming Constitution says no tax shall be imposed upon income without allowing full credit against that liability for all sales, use, and ad valorem taxes paid in the taxable year by the same taxpayer to any taxing authority in Wyoming — a condition that presupposes an income tax may be imposed, not a ban on one. Wyoming has no income tax because the legislature never enacted one, so the $0 line is a legislative choice a future legislature could change, subject to that credit. There is no state return to file, no withholding form, and no estimated payments.",
    },
    {
      q: "What withholding form do I fill out in Wyoming?",
      a: "None for the state. The federal W-4 is the only withholding form your employer needs — there is no Wyoming withholding certificate.",
    },
    {
      q: "What pays for Wyoming's government if there is no income tax?",
      a: "Mostly minerals and sales tax. Wyoming levies severance taxes on what comes out of the ground — 6% on oil and 6% on natural gas — plus taxes on coal and trona, and it saves a share of that revenue in the Permanent Wyoming Mineral Trust Fund, created in 1974, whose earnings help fund state government. Sales tax is the other pillar: 4% at the state level, with local option taxes adding up to 3% more.",
    },
    {
      q: "What is Wyoming's sales tax rate?",
      a: "4% at the state level (3% base plus 1% added in 1993), with local option taxes adding up to 3% more — so the combined rate at the register is generally 4% to 8% depending on the county. Groceries are exempt from sales tax.",
    },
    {
      q: "How much would I save versus California or New York on $60,000?",
      a: `In California the state income tax alone on a $60,000 salary is ${formatAmountOrUnavailable(EX_CA_60.annualState)}, and in New York State it is ${formatAmountOrUnavailable(EX_NY_60.annualState)} — Wyoming keeps all of that. The saving grows with income, because the other states' rates rise while Wyoming's stays at zero.`,
    },
    {
      q: "Does living in Wyoming shield income I earn in another state?",
      a: "No. Wyoming residency does not shield income earned in another state — if you work remotely for a Colorado employer or cross into Utah for a shift, the work state can still tax that income, and Wyoming has no income tax to credit it against.",
    },
    {
      q: "What is my take-home pay in Wyoming on $150,000?",
      a: `As a single filer with wages only, ${formatAmountOrUnavailable(examplePaycheck(WY_SLUG, 150000).annualNet)} a year after federal tax, Social Security, and Medicare — with ${formatAmountOrUnavailable(examplePaycheck(WY_SLUG, 150000).annualState)} in state income tax.`,
    },
    {
      q: "Do I have to file any Wyoming tax return?",
      a: "No. There is no Wyoming individual income tax return, and no estimated payments to make. Your only April filing is the federal return.",
    },
    {
      q: "Is Wyoming's budget affected by mineral prices?",
      a: "Directly. When oil, gas, and coal prices fall, severance-tax revenue falls with them, and the legislature cuts spending or draws on savings — because there is no income tax to fall back on. That volatility is the price of the $0 line, and it is why Wyoming's budget debates are about mineral prices, not tax rates.",
    },
    {
      q: "Does Wyoming tax my property?",
      a: "Yes — property tax is assessed locally, with the state setting the assessment rules and overseeing the counties. It is one of the taxes that replaces the income tax, and the bill does not depend on whether your income rose or fell that year.",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* BATCH SOURCES                                                       */
/*                                                                     */
/* DOR/agency link first per state, then verified official links.      */
/* Every URL below returned HTTP 200 to curl (with a browser          */
/* user-agent) on 2026-11-15, except the tax.colorado.gov links,       */
/* which return 403 to curl (bot protection) but load fine in a        */
/* browser — see ~/workspace/paycheckbeam-research/state-guides-       */
/* mountain.md for the full verification log.                          */
/* ------------------------------------------------------------------ */

export const BATCH_SOURCES: Record<string, { label: string; url: string }[]> = {
  [NE_SLUG]: [
    { label: "Nebraska Department of Revenue", url: "https://revenue.nebraska.gov/" },
    { label: "Form 1040N — 2026 Nebraska Individual Income Tax Return", url: "https://revenue.nebraska.gov/sites/default/files/doc/tax-forms/2026/f_1040n.pdf" },
    { label: "Form 1040N-ES — 2026 Nebraska Estimated Income Tax", url: "https://revenue.nebraska.gov/sites/default/files/doc/tax-forms/2025/f_1040N-ES.pdf" },
  ],
  [SD_SLUG]: [
    { label: "South Dakota Department of Revenue", url: "https://dor.sd.gov/" },
    { label: "Sales and Use Tax — South Dakota DOR", url: "https://dor.sd.gov/individuals/taxes/sales-use-tax/" },
  ],
  [ND_SLUG]: [
    { label: "North Dakota Office of State Tax Commissioner", url: "https://www.tax.nd.gov/" },
    { label: "Form ND-1ES — 2026 Estimated Income Tax (2026 rate schedule)", url: "https://www.tax.nd.gov/sites/www/files/documents/forms/software-developer/individual-income-forms/28709-form-nd-1es-2026%20final.pdf" },
    { label: "Primary Residence Credit — apply at tax.nd.gov/prc", url: "https://www.tax.nd.gov/prc" },
    { label: "North Dakota Tax Forms", url: "https://www.tax.nd.gov/forms" },
  ],
  [MT_SLUG]: [
    { label: "Montana Department of Revenue", url: "https://revenue.mt.gov/" },
    { label: "HB 337 — 2026 and 2027 income tax rates (Montana DOR)", url: "https://revenue.mt.gov/news/recent-news/HB-337" },
    { label: "2026 Withholding Updates — Form MW-4 (Montana DOR)", url: "https://revenue.mt.gov/news/recent-news/2026-withholding-updates" },
    { label: "North Dakota Reciprocity (Montana DOR)", url: "https://revenue.mt.gov/taxes/withholding-tax/north-dakota-reciprocity" },
    { label: "2025 Form 2 Instructions — Montana Individual Income Tax Return", url: "https://mtrevenue.gov/files/forms/Montana-Individual-Income-Tax-Return-Form-2-Instructions/2025_Montana_Individual_Income_Tax_Return_Form_2_Instructions.pdf" },
  ],
  [WY_SLUG]: [
    { label: "Wyoming Department of Revenue", url: "https://revenue.wyo.gov/" },
    { label: "Wyoming Constitution — Article 15, Section 18 (Secretary of State)", url: "https://sos.wyo.gov/Forms/Publications/WYConstitution.pdf" },
    { label: "Excise Tax FAQs — Wyoming DOR (sales tax rates)", url: "https://excise-tax-div.wyo.gov/general-administrative/excise-tax-faqs" },
  ],
  [CO_SLUG]: [
    { label: "Colorado Department of Revenue", url: "https://tax.colorado.gov/" },
    { label: "DR 0004 — Colorado Employee Withholding Certificate", url: "https://tax.colorado.gov/dr-0004-employee-resources" },
    { label: "Child Tax Credit & Earned Income Tax Credit (Colorado DOR)", url: "https://tax.colorado.gov/ctc-eitc" },
    { label: "FAMLI Premium and Benefits Calculator", url: "https://famli.colorado.gov/individuals-and-families/how-famli-works/premium-and-benefits-calculator" },
    { label: "Denver Tax Guide Topic 61 — Occupational Privilege Tax (rev. 04/2026)", url: "https://www.denvergov.org/files/assets/public/v/2/finance/documents/treasury/tax-guides/2026/taxguidetopic61_occupationalprivilegetaxes.pdf" },
  ],
  [UT_SLUG]: [
    { label: "Utah State Tax Commission", url: "https://tax.utah.gov/" },
    { label: "Utah Income Tax Rates", url: "https://incometax.utah.gov/paying/tax-rates" },
    { label: "Utah Withholding Tax", url: "https://tax.utah.gov/withholding" },
    { label: "2026 Tax Commission Webinar — EITC, Child Tax Credit, Social Security Credit", url: "https://files.tax.utah.gov/tax/train/webinars/2026-07-16-presentation.pdf" },
  ],
  [ID_SLUG]: [
    { label: "Idaho State Tax Commission", url: "https://tax.idaho.gov/" },
    { label: "Idaho Individual Income Tax — Online Guide", url: "https://tax.idaho.gov/taxes/income-tax/individual-income/online-guide" },
    { label: "Idaho Form W-4", url: "https://tax.idaho.gov/w4" },
    { label: "Idaho Form 40 — Individual Income Tax Return (2026)", url: "https://tax.idaho.gov/wp-content/uploads/forms/EFO00089/EFO00089_03-02-2026.pdf" },
  ],
};
