/**
 * PaycheckBeam — full exemplar content for California, Texas and New York.
 *
 * Every fact here comes from ~/workspace/paycheckbeam-research/
 * state-exemplars-research.md (researched 2026-11-15 from opened official
 * pages: FTB, EDD, Texas Comptroller, NY Tax Dept). Nothing unverified
 * from that file's "left out" sections is included.
 *
 * Worked-example numbers are generated at render time from the same
 * shared calculation the calculator above the fold runs
 * (calculatePaycheck / estimateStateWithholding / estimateStateInsurance),
 * so the tables match the tool. Two cases are labelled "Partial
 * calculation" in place and are partial by design: the California
 * $1,200,000 illustration (exemption-credit phaseout — the 2026
 * threshold was not published, so the calculator cannot model it) and
 * the New York $150,000 row (benefit recapture not modelled). No
 * incomplete example is presented as exact.
 *
 * Only the three slugs below get this content. The other 48 state pages
 * keep the generic template unchanged.
 */
import type { ReactNode } from "react";
import type { FaqItem } from "@/components/FaqAccordion";
import {
  applyBrackets,
  calculatePaycheck,
  formatUSD,
  formatUSD0,
  type NyLocalOption,
  type PaycheckBreakdown,
} from "@/lib/paycheckCalc";
import {
  estimateStateInsurance,
  estimateStateWithholding,
  getStateBySlug,
  NYC_BRACKETS_2026,
  type StateBracket,
} from "@/lib/stateTaxData";

/** Zero pre-tax deductions: the worked examples are wages-only, single filer. */
const WAGES_ONLY_PRE_TAX = { k401Annual: 0, sec125Annual: 0, hsaAnnual: 0 };

/**
 * Worked examples are generated from the same calculation the calculator
 * above the fold runs, so a table row can never drift from the tool.
 * Single filer, salary, no deductions, no overtime, wages only.
 */
function examplePaycheck(
  slug: string,
  gross: number,
  nyLocal: NyLocalOption = "none",
): PaycheckBreakdown {
  return calculatePaycheck(
    {
      payType: "salary",
      amount: gross,
      hoursPerWeek: 40,
      frequency: "biweekly",
      filingStatus: "single",
      preTax: WAGES_ONLY_PRE_TAX,
      postTaxAnnual: 0,
      overtime: { enabled: false, hoursPerPeriod: 0, multiplier: 1.5 },
      stateSlug: slug,
      nyLocal,
    },
    estimateStateWithholding,
    estimateStateInsurance,
  );
}

/**
 * State taxable income for a wages-only single filer: gross minus the
 * state standard deduction (the state estimator subtracts no exemption
 * for these states, so this matches its taxable base).
 */
function stateTaxableIncome(slug: string, gross: number): number {
  const state = getStateBySlug(slug);
  const sd = state?.standardDeductionSingle ?? 0;
  return Math.max(0, gross - sd);
}

/**
 * Display for a state/local tax result: "Unavailable" when the estimate
 * is missing — never a silent $0.00 for a result that was never computed.
 * A genuinely calculated zero (e.g. Texas) still shows $0.00.
 */
function formatAmountOrUnavailable(value: number | null): string {
  return value === null ? "Unavailable" : formatUSD(value);
}

/**
 * Per-bracket arithmetic for a detail paragraph, generated from the
 * state's own bracket table — the same walk applyBrackets does, so the
 * lines can never drift from the engine. Returns e.g.
 * "1% × $11,456 = $114.56; 2% × $15,701 = $314.02".
 */
function bracketDetailText(
  slug: string,
  gross: number,
  brackets: StateBracket[],
): string {
  const taxable = stateTaxableIncome(slug, gross);
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

/** 1% Behavioral Health Services Tax on CA taxable income over $1,000,000. */
function caBhst(taxableIncome: number): number {
  return 0.01 * Math.max(0, taxableIncome - 1000000);
}

/**
 * NYC rate-reduction credit, single filer: $21 + 0.228% of city taxable
 * income over $12,000 (IT-2105-I). The $21 / 0.228% / $12,000 figures are
 * the statutory table values; only the result is computed.
 */
function nycRateReductionCredit(cityTaxableIncome: number): number {
  return 21 + 0.00228 * Math.max(0, cityTaxableIncome - 12000);
}

/** Effective rate as a string, or "Unavailable" when the state result is missing. */
function effectiveRatePct(annualState: number | null, gross: number): string {
  return annualState === null
    ? "Unavailable"
    : ((annualState / gross) * 100).toFixed(1);
}

/** Amber/blue note box for labels that must not be missed (partial rows, return-only items). */
function NoteBox({
  tone,
  children,
}: {
  tone: "amber" | "blue";
  children: ReactNode;
}) {
  const cls =
    tone === "amber"
      ? "border-amber-300 bg-amber-50 text-amber-900"
      : "border-blue-200 bg-blue-50 text-blue-900";
  return (
    <div
      className={`mt-4 max-w-3xl rounded-2xl border px-4 py-3 text-sm leading-relaxed ${cls}`}
    >
      {children}
    </div>
  );
}

/**
 * Dense filing-guide material lives inside an expandable section so the
 * main page reads: calculator, examples, paycheck deductions, exclusions,
 * short FAQs + sources. The content is still in the HTML (and indexed);
 * it is just collapsed until the reader wants it.
 */
function ExpandableSection({
  eyebrow,
  title,
  summary,
  children,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
      <details className="group max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-5 [&::-webkit-details-marker]:hidden">
          <span>
            <Eyebrow>{eyebrow}</Eyebrow>
            <span className="mt-2 block text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              {title}
            </span>
            <span className="mt-2 block text-sm leading-relaxed text-slate-600">
              {summary}
            </span>
          </span>
          <span className="mt-1 shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold whitespace-nowrap text-slate-600 group-open:hidden">
            Show details +
          </span>
          <span className="mt-1 hidden shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold whitespace-nowrap text-slate-600 group-open:inline">
            Hide details −
          </span>
        </summary>
        <div className="border-t border-slate-100 px-5 pb-6">{children}</div>
      </details>
    </section>
  );
}

export const EXEMPLAR_SLUGS = [
  "california-paycheck-calculator",
  "texas-paycheck-calculator",
  "new-york-paycheck-calculator",
] as const;

export type ExemplarSlug = (typeof EXEMPLAR_SLUGS)[number];

export const EXEMPLAR_SOURCES: Record<
  ExemplarSlug,
  { label: string; url: string }[]
> = {
  "california-paycheck-calculator": [
    {
      label: "FTB Tax News, October 2026 — 2026 indexed amounts",
      url: "https://www.ftb.ca.gov/about-ftb/newsroom/tax-news/2026/10.html",
    },
    {
      label: "EDD Form DE 4 (Rev. 56, 1-26) — withholding certificate",
      url: "https://edd.ca.gov/siteassets/files/pdf_pub_ctr/de4.pdf",
    },
    {
      label: "EDD — contribution rates & withholding (SDI 1.3% for 2026)",
      url: "https://edd.ca.gov/en/payroll_taxes/rates_and_withholding/",
    },
    {
      label: "FTB — 2026 Form 540-ES instructions (estimated tax)",
      url: "https://www.ftb.ca.gov/forms/2026/2026-540-es-instructions.html",
    },
    {
      label: "FTB Publication 5130 (REV 09.10.2026) — 2026 reference manual",
      url: "https://www.ftb.ca.gov/help/free-tax-help/5130.pdf",
    },
    {
      label: "FTB — residency status & filing requirements",
      url: "https://www.ftb.ca.gov/file/personal/residency-status/index.html",
    },
    {
      label: "FTB Publication 1001 (2025) — HSA nonconformity, p. 9",
      url: "https://www.ftb.ca.gov/forms/2025/2025-1001-publication.pdf",
    },
    {
      label: "FTB — CalEITC eligibility & credit information",
      url: "https://www.ftb.ca.gov/file/personal/credits/caleitc/eligibility-and-credit-information.html",
    },
    {
      label: "FTB — nonrefundable renter's credit",
      url: "https://www.ftb.ca.gov/file/personal/credits/nonrefundable-renters-credit.html",
    },
  ],
  "texas-paycheck-calculator": [
    {
      label: "Texas Comptroller, Fiscal Notes Dec 2025 — “0% Texas has no state income tax”",
      url: "https://comptroller.texas.gov/economy/fiscal-notes/industry/2025/small-biz-info/",
    },
    {
      label: "Texas Comptroller, Fiscal Notes Dec 2023 — revenue mix & property tax",
      url: "https://comptroller.texas.gov/economy/fiscal-notes/archive/2023/dec/proptax.php",
    },
    {
      label: "Texas Comptroller, Fiscal Notes Feb 2016 — no personal income tax; franchise tax",
      url: "https://comptroller.texas.gov/economy/fiscal-notes/archive/2016/february/starting.php",
    },
  ],
  "new-york-paycheck-calculator": [
    {
      label: "NY Tax Dept — Form IT-2105-I (2026), estimated tax & rate tables",
      url: "https://www.tax.ny.gov/pdf/current_forms/it/it2105i.pdf",
    },
    {
      label: "NY Tax Dept — Form IT-2104-I (2026) withholding instructions",
      url: "https://www.tax.ny.gov/forms/current-forms/it/it2104i.htm",
    },
    {
      label: "NY Tax Dept — Tax Expenditure Estimates, FY2027 (2026 rate cut, recapture)",
      url: "https://www.tax.ny.gov/data/stats/ter/fiscal-year27/personal-income-tax.htm",
    },
    {
      label: "NY Tax Dept — Form IT-203 nonresident & part-year information",
      url: "https://www.tax.ny.gov/pit/ads/it203_information.htm",
    },
  ],
};

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">
      {children}
    </p>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
      {children}
    </h2>
  );
}

function Para({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
      {children}
    </p>
  );
}

function WorkedTable({
  caption,
  headers,
  rows,
  footnote,
  partialRowIndexes,
}: {
  caption: string;
  headers: string[];
  rows: string[][];
  footnote?: string;
  /** Row indexes that are partial calculations — badged in the table itself, not just in the footnote. */
  partialRowIndexes?: number[];
}) {
  return (
    <div className="mt-6 max-w-3xl">
      <h3 className="text-base font-bold text-slate-900">{caption}</h3>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              {headers.map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-2.5 font-semibold text-slate-700 ${i > 0 ? "text-right" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, rowIndex) => (
              <tr key={r[0]} className="border-b border-slate-100 last:border-b-0">
                {r.map((c, i) => (
                  <td
                    key={i}
                    className={`px-4 py-2.5 tabular-nums ${i === 0 ? "text-slate-600" : "text-right font-semibold text-slate-900"}`}
                  >
                    {c}
                    {i === 0 && partialRowIndexes?.includes(rowIndex) && (
                      <span className="ml-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 align-middle text-[11px] font-bold whitespace-nowrap text-amber-800">
                        Partial calculation
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footnote && (
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-500">
          {footnote}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CALIFORNIA                                                          */
/* ------------------------------------------------------------------ */

function CaliforniaContent() {
  const caSlug = "california-paycheck-calculator";
  const caRows = [30000, 60000, 150000, 200000].map((gross) => {
    const r = examplePaycheck(caSlug, gross);
    return [
      formatUSD0(gross),
      formatUSD0(stateTaxableIncome(caSlug, gross)),
      formatAmountOrUnavailable(r.annualState),
      formatUSD(r.annualStateInsurance),
    ];
  });
  // $1,200,000 partial illustration: tax before the exemption credit, and
  // what the calculator shows (it still applies the $158 credit).
  const caHighGross = 1200000;
  const caHigh = examplePaycheck(caSlug, caHighGross);
  const caState = getStateBySlug(caSlug);
  const caBrackets = caState?.brackets ?? [];
  const ca60 = examplePaycheck(caSlug, 60000);
  const ca150 = examplePaycheck(caSlug, 150000);
  const caTaxable60 = stateTaxableIncome(caSlug, 60000);
  const caTaxable1200k = stateTaxableIncome(caSlug, caHighGross);
  const caCreditSingle = caState?.creditSingle ?? 0;
  const caHighTaxBeforeCredit =
    caState?.brackets != null
      ? applyBrackets(
          stateTaxableIncome(caSlug, caHighGross),
          caState.brackets,
        )
      : null;
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          What California tax looks like at real salaries
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the 2026 standard
          deduction of $5,900, applies the nine graduated rates, then
          subtracts the $158 personal exemption credit. CA SDI is 1.3% of
          gross wages with no wage ceiling, so it grows with pay — unlike
          Social Security, it never stops.
        </Para>
        <NoteBox tone="blue">
          <strong>How to read this table:</strong> the income-tax column
          is your <strong>annual state liability estimate</strong> — what
          you owe for the year, settled on your tax return. The SDI column
          is different: SDI is{" "}
          <strong>withheld from every paycheck</strong>, so that column is
          what actually comes out of your pay.
        </NoteBox>
        <WorkedTable
          caption="California income tax + SDI, single filer, 2026"
          headers={["Gross wages", "CA taxable income", "CA income tax", "CA SDI (1.3%)"]}
          rows={caRows}
          footnote={`At $60,000 the effective CA income-tax rate is ${effectiveRatePct(ca60.annualState, 60000)}% of gross; at $150,000 it is ${effectiveRatePct(ca150.annualState, 150000)}%. Every row is generated from the same calculation the calculator above runs, so the figures match the tool.`}
        />
        <NoteBox tone="amber">
          <strong>Partial calculation — the $1,200,000 case.</strong> The
          tax before the $158 exemption credit is{" "}
          {caHighTaxBeforeCredit !== null
            ? formatUSD(caHighTaxBeforeCredit)
            : "—"}{" "}
          a year. The calculator shows{" "}
          {formatAmountOrUnavailable(caHigh.annualState)} because it still applies the
          $158 credit, and the credit phases out at high incomes — at
          $1.2M it is very likely $0, so the real liability is about{" "}
          {caHighTaxBeforeCredit !== null
            ? formatUSD(caHighTaxBeforeCredit)
            : "—"}
          . The 2026 phaseout threshold was not published on an FTB page
          we could open, so the calculator cannot model the phaseout yet.
          Do not treat either figure as exact at this income.
        </NoteBox>
        <Para>
          The $60,000 row in detail: {bracketDetailText(caSlug, 60000, caBrackets)}; total{" "}
          {formatUSD(applyBrackets(caTaxable60, caBrackets))}, minus the{" "}
          {formatUSD0(caCreditSingle)} credit = {formatAmountOrUnavailable(ca60.annualState)}.
          At $1,200,000 the 1% Behavioral Health Services Tax is{" "}
          {formatUSD(caBhst(caTaxable1200k))} — 1% of the{" "}
          {formatUSD0(caTaxable1200k - 1000000)} of taxable income over $1,000,000.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · in the FTB&apos;s own terms</Eyebrow>
        <SectionTitle>
          Nine rates, one surtax, and who gets taxed on what
        </SectionTitle>
        <Para>
          California imposes nine graduated personal income tax rates, from
          1% to 12.3%. On top of that there is a 1% Behavioral Health
          Services Tax — previously called the Mental Health Services Tax —
          on the portion of taxable income over $1,000,000. That is why the
          top rate is quoted as 13.3%: it is 12.3% plus the 1% surtax, and
          the surtax applies only to the dollars over $1,000,000, not to
          your whole income.
        </Para>
        <Para>
          Residents are taxed on all income regardless of source. You are a
          resident if you are present in California for other than a
          temporary or transitory purpose, or domiciled in California but
          outside the state for a temporary or transitory purpose.
          Nonresidents are taxed only on California-source income, and
          part-year residents on all income while resident plus
          California-source income while nonresident.
        </Para>
        <Para>
          California does not tax Social Security benefits, Tier 1 and Tier
          2 railroad retirement benefits, California Lottery winnings,
          unemployment compensation and paid family medical leave paid in
          lieu of unemployment, state income tax refunds, or interest from
          U.S. savings bonds, Treasury bills, or other U.S. or U.S.
          Territory bonds.
        </Para>
        <Para>
          The 2026 standard deduction is $5,900 for single or married
          filing separately, and $11,800 for joint, surviving spouse, or
          head of household filers. The personal exemption credit — a
          nonrefundable dollar-for-dollar reduction of tax, not a deduction
          — is $158 for single, separate, and head of household filers,
          $316 for joint filers, and $491 per dependent. The calculator
          subtracts the $158 / $316 personal credit; the $491
          per-dependent credit is not modelled, so a filer with dependents
          may reduce annual California income tax by up to $491 per
          qualifying dependent, subject to eligibility, available tax
          liability, and phaseout — that credit is claimed on the annual
          return, not on your paycheck.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form DE 4"
        title="Your W-4 does not cover California — you need a DE 4 too"
        summary="California uses its own withholding form, the DE 4 — not the federal W-4. The step-by-step for filling it in is inside."
      >
        <Para>
          Since January 1, 2020, the federal Form W-4 is used for federal
          income tax withholding only. To set your California withholding
          you must file the state form, EDD Form DE 4, Employee&apos;s
          Withholding Allowance Certificate. If you do not give your
          employer a completed DE 4, your employer must withhold as Single
          with zero withholding allowances — the heaviest default — which
          is why a first California paycheck often looks surprisingly
          small.
        </Para>
        <Para>
          The form has three filing-status boxes, and they are not the
          federal ones: “Single or Married (with two or more incomes)”,
          “Married (one income)”, or “Head of Household”. Line 1a takes
          your regular allowances from Worksheet A — one for yourself, one
          for a spouse who is not claiming their own, one each for
          blindness of yourself or your spouse, plus one per dependent.
          Line 1b takes allowances from Worksheet B for estimated
          deductions, and only if you itemize, claim adjustments, or have
          large nonwage income: you may claim one additional allowance for
          each $1,000, or fraction of $1,000, by which your expected
          deductions exceed your standard deduction. Line 1c is the total.
          Line 2 is an additional dollar amount per pay period, if your
          employer agrees — and your employer is not required to agree; if
          they do not, you may need quarterly estimates on Form 540-ES.
        </Para>
        <Para>
          With two earners or multiple jobs, check “Single or Married
          (with two or more incomes)”, figure the total allowances on one
          DE 4 only, and claim them with one employer — ideally the
          highest-paying job, zero at the others. Never claim the same
          allowances with more than one employer. Line 3 is the exemption
          from withholding: you can claim it only if you meet both
          conditions — you owed no federal and state income tax last year,
          and you expect to owe none this year. An exemption must be
          renewed with a new DE 4 by February 15 each year, and if you are
          not having tax withheld this year but expect a liability next
          year, you must give your employer a new DE 4 by December 1.
          Line 4 covers the military-spouse exemption. Filing a DE 4 with
          no reasonable basis that under-withholds can draw a $500 fine,
          and criminal penalties apply for willfully supplying false
          information. One figure not to confuse: Worksheet C values each
          allowance at $168.30 for withholding math — that is a
          withholding-computation figure, not the $158 exemption credit.
        </Para>
      </ExpandableSection>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>SDI · 1.3% in 2026, no cap</Eyebrow>
        <SectionTitle>
          CA SDI: the line on your pay stub that never stops
        </SectionTitle>
        <Para>
          The State Disability Insurance withholding rate for 2026 is 1.3%.
          Since January 1, 2024, Senate Bill 951 removed the taxable wage
          limit and the maximum withholding, so SDI is charged on every
          dollar of wages, all year — there is no point in the year where
          it stops, the way Social Security does at its $184,500 wage
          base. The 1.3% covers both State Disability Insurance and Paid
          Family Leave benefits. SDI is withheld from the employee&apos;s
          wages; unemployment insurance (taxable wage limit $7,000 per
          employee per year) and the 0.1% Employment Training Tax on the
          same $7,000 are employer-paid and do not come out of your pay.
        </Para>
        <Para>
          SDI is charged on a wider wage base than income-tax withholding:
          SDI wages exclude Section 125 items but include 401(k)
          deferrals and HSA contributions. So raising your 401(k) lowers
          your California income tax but does not lower your SDI — the
          calculator handles that split for you.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Credits · 2026 amounts · return-only"
        title="The California credits claimed on your return"
        summary="Renter's credit, CalEITC, and Young Child Tax Credit. Claimed on your annual return; this calculator does not automatically adjust withholding for them."
      >
        <Para>
          <strong className="text-slate-900">Renter&apos;s credit
          (nonrefundable):</strong> $60 for single or married filing
          separately, $120 for head of household, married filing jointly,
          or widow(er). You qualify if you paid rent in California for at
          least half the year, the property was not tax-exempt, your
          California AGI is within the limits — $55,830 or less for
          single / married filing separately, $111,660 or less for joint /
          head of household / surviving spouse in 2026 — you were not
          living with someone who can claim you as a dependent, and no
          property-tax exemption was given. Part-year residents get a
          prorated amount by months of rent.
        </Para>
        <Para>
          <strong className="text-slate-900">CalEITC
          (refundable):</strong> working families making up to $34,050 may
          qualify, whether or not the household has a qualifying child.
          Maximum investment income is $4,978. The maximum credit is $313
          with no children, $2,088 with one child, $3,447 with two, and
          $3,878 with three or more. You must not be married or a
          registered domestic partner filing separately, must have lived in
          California more than half the tax year, and must be 18 or older
          at year-end or have a qualifying child; a valid SSN or ITIN
          works. It is claimed on FTB Form 3514 with the return.
        </Para>
        <Para>
          <strong className="text-slate-900">Young Child Tax Credit
          (refundable):</strong> up to $1,229 for a taxpayer who qualifies
          for CalEITC — or would have qualified but has no earned income —
          and has a qualifying child under six years old on the last day
          of the year. It phases out as AGI exceeds $28,357 and is gone
          when earned income reaches $34,051. The Foster Youth Tax Credit
          is also up to $1,229, with the same phaseout, for ages 18–25 who
          were in foster care at age 13 or older and are CalEITC-eligible.
        </Para>
        <Para>
          Two smaller credits worth knowing: the Joint Custody Head of
          Household credit (up to $631 or 30% of net tax) and the Senior
          Head of Household credit (up to $1,923, income under $102,006).
          And if you pay tax to another state on the same income, the
          Other State Tax Credit (Schedule S) gives California residents a
          credit for it — New York is on the qualifying list.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="HSA · California does not conform"
        title="Your HSA does not reduce California taxable wages"
        summary="California taxes HSA contributions — they are added back into California taxable wages, which affects your withholding."
      >
        <Para>
          California does not conform to the federal HSA deduction.
          Contributions made by an employer are excluded from federal W-2
          wages but not from California wages, and interest and taxable
          dividends earned inside an HSA are taxable in California in the
          year earned. That is why the calculator adds HSA contributions
          back into California taxable wages — unlike the return-only
          credits above, the HSA rule changes what is withheld from your
          paycheck.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Filing &amp; estimated payments · return-only"
        title="Returns, deadlines, and the missing September payment"
        summary="Which return to file, the April 15, 2027 deadline, and California's unusual estimated-payment split — there is no September payment."
      >
        <Para>
          Full-year residents file Form 540 — or Form 540 2EZ for simple
          returns: single, married-joint, head of household, or surviving
          spouse status, 0–3 dependents, taxable income of $100,000 or
          less (single / head of household) or $200,000 or less (joint),
          standard deduction only, and limited income types and credits.
          Part-year residents and nonresidents file Form 540NR. For 2026
          a single filer under 65 with no dependents must file at gross
          income of $23,721 (AGI $18,977); a dependent of another person
          must file if gross income exceeds their standard deduction. The
          due date for 2026 returns is April 15, 2027, with an automatic
          extension to file until October 15, 2027 — that is an extension
          to file, not to pay; any tax due must still be paid by April 15,
          2027. If you are living or travelling outside the U.S. on April
          15, 2027, the due date is June 15, 2027, with interest accruing
          from April 15.
        </Para>
        <Para>
          You must generally make estimated payments on Form 540-ES if you
          expect to owe at least $500 — $250 if married or a registered
          domestic partner filing separately — in tax for 2026 after
          withholding and credits, and your withholding and credits will
          be less than the smaller of 90% of the tax on your 2026 return or
          100% of the tax on your 2025 return. Higher-income filers:
          2025 California AGI over $150,000 ($75,000 if filing
          separately) means the test uses 110% of the 2025 tax instead of
          100%, and AGI of $1,000,000 or more ($500,000 separately) means
          you must use your 2026 tax. Installments are 30% / 40% / 0% /
          30% of the required annual payment, due April 15, June 15, and
          September 15, 2026, and January 15, 2027 — there is no
          third-quarter payment, which is California&apos;s unusual split.
          Payment is mandatory by e-pay once an estimate or extension
          payment exceeds $20,000 or a return shows liability over
          $80,000. Filing the 2026 return by January 31, 2027 and paying
          in full replaces the fourth installment.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* TEXAS                                                               */
/* ------------------------------------------------------------------ */

function TexasContent() {
  const txSlug = "texas-paycheck-calculator";
  const txRows = [30000, 60000, 150000].map((gross) => {
    const r = examplePaycheck(txSlug, gross);
    return [
      formatUSD0(gross),
      formatUSD(r.annualFederal),
      formatUSD(r.annualSocialSecurity),
      formatUSD(r.annualMedicare),
      formatAmountOrUnavailable(r.annualState),
      formatUSD(r.annualNet),
    ];
  });
  const ca60 = examplePaycheck("california-paycheck-calculator", 60000);
  const ny60 = examplePaycheck("new-york-paycheck-calculator", 60000);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · every income level</Eyebrow>
        <SectionTitle>
          Texas state income tax is $0 — and here is the whole paycheck
        </SectionTitle>
        <Para>
          There is no Texas rate to apply, no Texas standard deduction to
          subtract, and no Texas bracket to climb. The state income-tax
          line is $0 at every wage, so the only taxes on a Texas paycheck
          are the federal ones.
        </Para>
        <NoteBox tone="blue">
          <strong>Annual figures:</strong> federal income tax, Social
          Security, and Medicare are the same in every state for the same
          pay — only the state column changes, and Texas keeps it at $0.
          Take-home pay is what is left after all of them.
        </NoteBox>
        <WorkedTable
          caption="Texas take-home pay, single filer, 2026 — annual"
          headers={["Gross wages", "Federal income tax", "Social Security", "Medicare", "Texas state tax", "Take-home pay"]}
          rows={txRows}
          footnote={`The comparison is the point: the same $60,000 single filer owes ${formatAmountOrUnavailable(ca60.annualState)} a year in California and ${formatAmountOrUnavailable(ny60.annualState)} in New York State (before New York City tax) — $0 in Texas. Federal tax is identical in all three states for the same W-4.`}
        />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>What $0 means in practice</Eyebrow>
        <SectionTitle>
          No Texas form, return, or pay-stub line — when you live and
          work in Texas
        </SectionTitle>
        <Para>
          Texas has no state income tax — the Comptroller puts it plainly
          as “0% — Texas has no state income tax” — and it does not have a
          personal income tax at all. That has three practical
          consequences. First, there is no Texas equivalent of
          California&apos;s DE 4 or New York&apos;s IT-2104: a Texas
          worker fills in only the federal Form W-4, and there is no state
          withholding form to get wrong. Second, there is no Texas
          income-tax return to file and no state estimated payments to
          make, because there is no tax for a return or an estimate to
          cover. Third, your pay stub simply has no state income-tax line
          — nothing is withheld, so nothing appears. All of that applies
          when you live and work in Texas: if you are a Texas resident
          who works in another state, that state can withhold its own
          income tax, and a state line can appear on your pay stub.
        </Para>
        <Para>
          What still comes out is everything federal: federal income tax,
          Social Security at 6.2% up to $184,500 in 2026, and Medicare at
          1.45% plus 0.9% over $200,000. Those apply exactly as in every
          other state, and the calculator above shows them in full.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How Texas pays for things instead</Eyebrow>
        <SectionTitle>
          Sales tax in, property tax up — the honest trade-off
        </SectionTitle>
        <Para>
          Unlike many other states, Texas does not levy an income tax, so
          it must generate revenue from other sources, primarily sales
          tax. In 2022, local property tax was 47.0% of all state and
          local tax revenue ($79.4 billion), state sales tax 25.5% ($43.0
          billion), local sales taxes 7.2%, and other state taxes 20.3%.
          The same Comptroller analysis notes that in calendar year 2022
          Texas ranked sixth-lowest for total effective state and local
          tax burden, according to Tax Foundation data — partly because
          there is no personal income tax.
        </Para>
        <Para>
          The counterweight is property tax. Texas does not have a state
          property tax — the Texas Constitution and statutes authorize
          local governments to collect it — so property tax is levied by
          cities, counties, and school districts. Texas ranked
          sixth-highest in effective property-tax rate in 2020, at 1.66%
          of home value (Tax Foundation, via the Comptroller). A Texas
          paycheck keeps more, but a Texas homeowner&apos;s property-tax
          bill is usually larger than in most states — that is the real
          trade-off behind the $0 state tax line.
        </Para>
      </section>

      <ExpandableSection
        eyebrow="Franchise tax · not an income tax"
        title="The Texas franchise tax is a business tax, not a wage tax"
        summary="A wage earner never sees it on a pay stub. The detail — who pays it and who is exempt — is inside."
      >
        <Para>
          The franchise tax is the state&apos;s main business tax, levied
          on taxable entities for the privilege of doing business in
          Texas. It is not an individual income tax, and a wage earner
          never sees it on a pay stub. Sole proprietorships — the
          state&apos;s most common form of new business — are completely
          exempt from it, and businesses with annualized total revenue of
          $2,650,000 or less pay no franchise tax from January 1, 2026
          (up from $2,470,000). If you are self-employed as a sole
          proprietor, there is no Texas personal income tax on your
          earnings; only a taxable entity above the revenue threshold owes
          franchise tax.
        </Para>
      </ExpandableSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* NEW YORK                                                            */
/* ------------------------------------------------------------------ */

function NewYorkContent() {
  const nySlug = "new-york-paycheck-calculator";
  const nyRows = [30000, 60000, 100000, 150000].map((gross) => {
    const stateOnly = examplePaycheck(nySlug, gross, "none");
    const nyc = examplePaycheck(nySlug, gross, "nyc");
    const yonkers = examplePaycheck(nySlug, gross, "yonkers");
    return [
      formatUSD0(gross),
      formatAmountOrUnavailable(stateOnly.annualState),
      formatAmountOrUnavailable(nyc.annualLocal),
      formatAmountOrUnavailable(yonkers.annualLocal),
    ];
  });
  const nyState = getStateBySlug(nySlug);
  const nyBrackets = nyState?.brackets ?? [];
  const nyTaxable60 = stateTaxableIncome(nySlug, 60000);
  const ny60state = examplePaycheck(nySlug, 60000, "none");
  const ny60nyc = examplePaycheck(nySlug, 60000, "nyc");
  const nycBeforeCredit = applyBrackets(nyTaxable60, NYC_BRACKETS_2026.single);
  const nycSchoolCredit =
    ny60nyc.annualLocal === null ? null : nycBeforeCredit - ny60nyc.annualLocal;
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>Worked examples · single filer, wages only</Eyebrow>
        <SectionTitle>
          New York tax at real salaries — state, city, and Yonkers
        </SectionTitle>
        <Para>
          Each row starts from gross wages, subtracts the 2026 standard
          deduction of $8,000, and applies the state brackets. The NYC
          column is the city tax on the same taxable income, as the
          calculator shows it — after the {formatAmountOrUnavailable(nycSchoolCredit)} fixed school tax credit
          only. The Yonkers column is the 16.75% surcharge on the state
          tax, instead of city tax.
        </Para>
        <NoteBox tone="blue">
          <strong>How to read this table:</strong> the state and city
          columns are <strong>annual liability estimates</strong> — what
          you owe for the year, settled on your tax return, not
          per-paycheck withholding. NY State bracket calculation is
          complete under the stated assumptions; NYC estimates exclude
          the rate-reduction credit. The $150,000 row is a partial
          calculation because benefit recapture applies above $107,650 of
          NYAGI.
        </NoteBox>
        <WorkedTable
          caption="New York State + NYC / Yonkers tax, single filer, 2026"
          headers={["Gross wages", "NY State tax", "NYC tax (calculator)", "Yonkers surcharge"]}
          rows={nyRows}
          partialRowIndexes={[3]}
          footnote={`* $150,000 row — partial calculation, plain-schedule figures only. NY adjusted gross income of $150,000 exceeds the $107,650 benefit-recapture threshold, so a supplemental (recapture) tax applies on top of the schedule figure and the true liability is higher; the recapture phases in over a $50,000 NYAGI band. Do not treat the $150,000 row as exact. The $100,000 row: NY State bracket calculation is complete under the stated assumptions (NYAGI $100,000 is below the $107,650 recapture threshold); NYC estimates exclude the separate NYC rate-reduction credit (${formatUSD(nycRateReductionCredit(stateTaxableIncome(nySlug, 30000)))} at $30,000; ${formatUSD(nycRateReductionCredit(stateTaxableIncome(nySlug, 60000)))} at $60,000; ${formatUSD(nycRateReductionCredit(stateTaxableIncome(nySlug, 100000)))} at $100,000; ${formatUSD(nycRateReductionCredit(stateTaxableIncome(nySlug, 150000)))} at $150,000) — that credit is claimed on the actual return and is not modelled in the calculator.`}
        />
        <Para>
          The $60,000 state row in detail: {bracketDetailText(nySlug, 60000, nyBrackets)}; total{" "}
          {formatUSD(applyBrackets(nyTaxable60, nyBrackets))}. The NYC row:{" "}
          {bracketDetailText(nySlug, 60000, NYC_BRACKETS_2026.single)}; total{" "}
          {formatUSD(nycBeforeCredit)}, minus the {formatAmountOrUnavailable(nycSchoolCredit)} fixed
          school tax credit = {formatAmountOrUnavailable(ny60nyc.annualLocal)}. A New York City resident earning
          $60,000 therefore pays {formatAmountOrUnavailable(ny60state.annualState)} state plus{" "}
          {formatAmountOrUnavailable(ny60nyc.annualLocal)} city —{" "}
          {ny60state.annualState !== null && ny60nyc.annualLocal !== null
            ? formatUSD(ny60state.annualState + ny60nyc.annualLocal)
            : "Unavailable"}{" "}
          combined — before the rate-reduction credit on the
          return.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>How it works · computation order</Eyebrow>
        <SectionTitle>
          New York starts from federal AGI — then does its own thing
        </SectionTitle>
        <Para>
          The New York State personal income tax starts with the federal
          definition of adjusted gross income. Taxpayers then subtract the
          higher of the New York standard deduction or New York itemized
          deductions, and a $1,000 exemption for each dependent — not
          including the taxpayer and spouse. New York itemized deductions
          generally conform to federal itemized deductions as they existed
          before Public Law 115-97, with modifications such as an add-back
          for income taxes, and an overall New York State deduction
          limitation applies to upper-income taxpayers. The 2026 standard
          deduction is $8,000 for single filers (or $3,100 for a single
          filer who can be claimed as a dependent), $16,050 for married
          filing jointly, and $11,200 for head of household.
        </Para>
        <Para>
          Two things about the 2026 rates are new. Beginning with tax year
          2026, an additional 0.2 percentage point rate reduction is
          phased in over two years for taxpayers with taxable income up to
          $215,400 ($323,200 for joint filers), fully phased in by 2027
          and permanent after that — which is why the 2026 middle brackets
          are 5.40% and 5.90% rather than the old 5.50% and 6.00%. And the
          top rates are temporary: for tax years 2021 through 2032 the old
          8.82% top rate is replaced by 9.65% on income between $1,077,550
          and $5 million, 10.30% between $5 million and $25 million, and
          10.90% over $25 million; for 2033 and after, the top rate
          reverts to 8.82% on income over $1,077,550 ($2,155,350 for joint
          filers).
        </Para>
        <Para>
          Two modelling gaps to know about. The $1,000-per-dependent
          exemption is not in the calculator&apos;s data, so the examples
          above omit it: a single filer with two children at $60,000
          would have taxable income of {formatUSD0(stateTaxableIncome(nySlug, 60000) - 2000)}, not{" "}
          {formatUSD0(stateTaxableIncome(nySlug, 60000))}, and state tax
          of {formatUSD(applyBrackets(stateTaxableIncome(nySlug, 60000) - 2000, nyBrackets))} instead of{" "}
          {formatAmountOrUnavailable(ny60state.annualState)}. And above $107,650 of New
          York adjusted gross income, a supplemental tax recaptures the
          benefit of the lower brackets — the plain rate schedule then
          understates the tax, which is why the $150,000 row above is
          flagged rather than presented as exact.
        </Para>
        <Para>
          What New York does not tax: Social Security and Tier 1 railroad
          retirement benefits are excluded from New York adjusted gross
          income, pensions and annuities are excludable up to $20,000 at
          age 59½ and over, and interest on U.S. obligations is excluded.
        </Para>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <Eyebrow>NYC &amp; Yonkers</Eyebrow>
        <SectionTitle>
          NYC tax is for residents — and Yonkers taxes nonresident
          earnings too
        </SectionTitle>
        <Para>
          New York City residents pay a separate city income tax on the
          same taxable income as the state tax — there is no separate NYC
          standard deduction — at 3.078% to $12,000, 3.762% to $25,000,
          3.819% to $50,000, and 3.876% over $50,000 for single filers
          (joint thresholds $21,600 / $45,000 / $90,000; head of household
          $14,400 / $30,000 / $60,000). It applies only to residents of
          the five boroughs — Manhattan, the Bronx, Brooklyn, Queens, and
          Staten Island.
        </Para>
        <Para>
          The NYC school tax credit has two parts. The fixed amount is
          $125 for married filing jointly or a qualifying surviving
          spouse, and $63 for everyone else, when income is $250,000 or
          less — that is the part the calculator models. The
          rate-reduction amount is computed from a separate table by
          filing status (for single filers: 0.171% of city taxable income
          up to $12,000, then $21 plus 0.228% of the excess over $12,000),
          and you do not qualify for it if your income is over $500,000.
          It is entered in the New York State column of the estimated-tax
          worksheet, not the NYC column, and it is not modelled in the
          calculator — see the worked-examples note above for the amounts
          it would save.
        </Para>
        <Para>
          Yonkers residents pay a 16.75% surcharge on their net New York
          State tax instead of city tax — a Yonkers resident pays state
          plus the surcharge, not state plus NYC. A person who lives
          outside New York City and outside Yonkers but works in New York
          City pays neither the NYC resident tax nor the Yonkers surcharge
          — but still pays New York State tax on New York-source income.
        </Para>
        <NoteBox tone="amber">
          <strong>Commuter exception:</strong> Yonkers also levies a
          separate nonresident earnings tax on wages earned in Yonkers by
          people who do not live there (Form Y-203). So “neither for
          commuters” is not the whole story — it holds for working in New
          York City, but working in Yonkers itself can trigger the
          Yonkers earnings tax. Its rate was not verified from an official
          page we could open, so no rate is stated here.
        </NoteBox>
      </section>

      <ExpandableSection
        eyebrow="Withholding · Form IT-2104"
        title="IT-2104: one form for state, city, and Yonkers — and zero is normal"
        summary="One form covers state, city, and Yonkers withholding — and zero allowances is the correct answer for a single filer with one job. The full how-to is inside."
      >
        <Para>
          Form IT-2104, the Employee&apos;s Withholding Allowance
          Certificate, tells your employer how much New York State — and
          New York City and Yonkers — tax to withhold. One form covers
          all three: line 1 is allowances for New York State and Yonkers,
          line 2 is allowances for New York City, and lines 3, 4, and 5
          are additional withholding per pay period for state, NYC, and
          Yonkers. The more allowances you claim, the less tax your
          employer withholds. The instructions were revised for tax years
          beginning on or after January 1, 2026: if you filed an IT-2104
          before January 1, 2026 and used the worksheet or charts, you
          should complete a new 2026 form and give it to your employer.
        </Para>
        <Para>
          The most surprising rule: you may not claim an allowance for
          yourself or, if married, your spouse. Single taxpayers with one
          job and zero dependents enter 0 on lines 1 and 2 — a zero on
          your IT-2104 is the correct answer, not a mistake. Allowances
          come from the worksheet (Parts 1 and 4), driven by dependents,
          itemized deductions, and credits; claiming fewer allowances
          withholds more. With more than one job, file a separate IT-2104
          with each employer and claim all allowances at the higher-paying
          job, zero at the lower-paying job. Single or head-of-household
          filers with combined wages under $107,650 reduce allowances by
          seven on lines 1 and 2 on the higher-paying job&apos;s
          certificate; with combined wages from $107,650 to $2,263,265,
          use the Part 6 charts and put the additional withholding on
          line 3. Married couples where both work each file their own
          form, the higher earner claims the allowances and the lower
          earner claims zero; under $107,650 combined, each marks
          “Married, but withhold at higher single rate” and splits the
          allowances, and at $107,650 or more they use the Part 5 charts.
        </Para>
        <Para>
          Three adjustments: if you are a dependent of another taxpayer
          and expect to earn more than $3,100, reduce allowances by one
          for each $1,000 of income over $2,500; if you have more than
          $1,000 of income from sources other than wages, reduce
          allowances by one for each $1,000 of nonwage income; and if the
          worksheet gives less than zero and your employer cannot
          accommodate negative allowances, enter 0 and use additional
          withholding instead — $1.85 of New York State tax per week
          (line 3), $0.80 of New York City tax per week (line 4), and for
          Yonkers residents 16.75% of the New York State amount (line 5),
          doubling those weekly figures for biweekly pay. Claiming more
          than 14 allowances means your employer must send a copy of your
          IT-2104 to the Tax Department. You cannot use IT-2104 to claim
          exemption from withholding — that needs Form IT-2104-E (or
          IT-2104-IND / IT-2104-MS for military). If you submit a federal
          W-4 for tax year 2020 or later and do not file an IT-2104, your
          employer may use zero as your number of allowances. Re-file
          when you start a new job, every year, and on life, income, or
          job changes — including moving into or out of New York City or
          Yonkers, wages reaching $107,650, marriage or divorce, a child,
          itemizing, or owing tax or getting a large refund last year. A
          $500 penalty may be imposed for a false statement that decreases
          withholding.
        </Para>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="Nonresidents · MCTMT · estimated payments"
        title="Working in New York without living there, and the commuter taxes"
        summary="Nonresident filing (Form IT-203), the self-employed MCTMT, and estimated payments — the detail is inside."
      >
        <Para>
          <strong className="text-slate-900">Nonresidents and part-year
          residents file Form IT-203.</strong> You must file it if you
          were not a New York resident and received income from New York
          State sources, or if you moved into or out of New York during
          the year. You are subject to New York State income tax on income
          received from New York sources while a nonresident, and on all
          income received while a resident. The mechanics: calculate a
          base tax as if you were a full-year resident, then determine the
          percentage of your income that is subject to New York State tax.
          A New Jersey, Connecticut, or Pennsylvania resident who works in
          New York owes New York tax on those wages and must file Form
          IT-203 — there is no reciprocity exemption on the New York side.
          Relief from double taxation comes from the home state&apos;s
          credit for taxes paid to New York (and, for New York residents
          working elsewhere, New York&apos;s resident credit, Form
          IT-112-R).
        </Para>
        <Para>
          <strong className="text-slate-900">MTA payroll mobility tax
          (MCTMT) — self-employed only, in this note.</strong> It is
          imposed on self-employed individuals engaging in business
          within the Metropolitan Commuter Transportation District: New
          York City plus Dutchess, Nassau, Orange, Putnam, Rockland,
          Suffolk, and Westchester counties. Zone 1 is the five New York
          City counties; Zone 2 is Rockland, Nassau, Suffolk, Orange,
          Putnam, Dutchess, and Westchester. The rate is 0.60% of net
          earnings from self-employment allocated to Zone 1, and 0.34%
          allocated to Zone 2, in each case only if those earnings exceed
          $150,000. The $150,000 threshold is computed per individual,
          even on a joint return, and you can owe in both zones. Example:
          $160,000 of Zone 1 earnings means $160,000 × 0.60% = $960 —
          the $150,000 is a threshold that switches the tax on, not an
          amount subtracted before the rate applies. No
          exemptions from any other New York law apply (except START-UP NY
          earnings), and no tax credit may offset the MCTMT. Regular
          employees are not the ones who pay this — their employer handles
          the employer-side MCTMT separately.
        </Para>
        <Para>
          <strong className="text-slate-900">Estimated payments.</strong>{" "}
          You must generally pay estimated income tax if you expect to
          owe, after subtracting withholding, estimated tax paid, and
          credits, at least $300 of New York State, New York City, or
          Yonkers tax for 2026. Four equal installments are due April 15,
          June 15, and September 15, 2026, and January 15, 2027. To avoid
          penalty, pay at least 90% of the tax on your 2026 return (66⅔%
          for farmers and fishermen), or 100% of the tax on your 2025
          return — 110% if you are not a farmer or fisherman and the New
          York adjusted gross income on that return is more than $150,000
          ($75,000 if married filing separately) — or 90% of annualized
          income. Filing the 2026 return on or before January 31, 2027
          and paying the full balance replaces the January 15 payment,
          and there is no penalty if you had no tax liability for the full
          12-month preceding tax year. A $50 fee applies if a payment is
          returned by the bank.
        </Para>
      </ExpandableSection>
    </>
  );
}

/**
 * Shared example results reused by prose and FAQs — no engine-derived
 * figure is ever a literal string in an answer. Computed once at module
 * load from the same calculation the calculator runs.
 */
const EX_CA_60 = examplePaycheck("california-paycheck-calculator", 60000);
const EX_CA_75 = examplePaycheck("california-paycheck-calculator", 75000);
const EX_NY_60_STATE = examplePaycheck("new-york-paycheck-calculator", 60000, "none");
const EX_NY_60_NYC = examplePaycheck("new-york-paycheck-calculator", 60000, "nyc");
const EX_NY_75_STATE = examplePaycheck("new-york-paycheck-calculator", 75000, "none");
const EX_NY_BRACKETS =
  getStateBySlug("new-york-paycheck-calculator")?.brackets ?? [];
/** NYC fixed school tax credit at $60,000: bracket total minus what the calculator shows (null if the local result is missing). */
const EX_NYC_SCHOOL_CREDIT_60: number | null =
  EX_NY_60_NYC.annualLocal === null
    ? null
    : applyBrackets(
        stateTaxableIncome("new-york-paycheck-calculator", 60000),
        NYC_BRACKETS_2026.single,
      ) - EX_NY_60_NYC.annualLocal;

/* ------------------------------------------------------------------ */
/* FAQs                                                                */
/* ------------------------------------------------------------------ */

export const EXEMPLAR_FAQS: Record<ExemplarSlug, FaqItem[]> = {
  "california-paycheck-calculator": [
    {
      q: "Does California have a state income tax?",
      a: "Yes. California taxes income on a graduated scale in 2026, from 1% up to a top rate of 13.3%. Only the dollars inside each bracket are taxed at that bracket's rate. The 13.3% top rate is the 12.3% bracket rate plus the 1% Behavioral Health Services Tax on taxable income over $1,000,000.",
    },
    {
      q: "What is the standard deduction in California in 2026?",
      a: "The California standard deduction in 2026 is $5,900 for single filers and $11,800 for married filing jointly. A nonrefundable personal exemption credit of $158 (single; $316 joint) is subtracted after the rate is applied, plus up to $491 per qualifying dependent, claimed on your annual return — though the per-dependent credit is not modelled in the calculator, so it may reduce annual California income tax by up to $491 per qualifying dependent, subject to eligibility, available tax liability, and phaseout.",
    },
    {
      q: "Why is California withholding separate from federal — do I really need a DE 4 as well as a W-4?",
      a: "Yes. Since January 1, 2020 the federal W-4 is used for federal withholding only. You must file the state form, EDD Form DE 4, to set your California withholding. Without a DE 4 your employer must withhold as Single with zero allowances.",
    },
    {
      q: "I didn't file a DE 4 — why is my employer withholding as Single with zero allowances?",
      a: "That is the required default. The DE 4 instructions say: if you do not provide your employer a completed DE 4, your employer must use Single with Zero withholding allowance. File a DE 4 to set your real status and allowances.",
    },
    {
      q: "What is CA SDI on my paystub, and why does it never stop?",
      a: "CA SDI is State Disability Insurance (covering disability and Paid Family Leave), withheld at 1.3% in 2026. Since January 1, 2024 there is no taxable wage limit and no maximum withholding, so it is charged on every dollar of wages all year — unlike Social Security, which stops at its $184,500 wage base.",
    },
    {
      q: "Does California tax my 401(k)? My HSA?",
      a: "A 401(k) reduces California taxable wages, just as federally. An HSA does not: California does not conform to the federal HSA deduction, so HSA contributions do not reduce your CA taxable income, and interest and dividends earned inside an HSA are taxable in California in the year earned. Section 125 items are excluded.",
    },
    {
      q: "I earn over $1M — what is the extra 1% on my return?",
      a: `The 1% Behavioral Health Services Tax (previously the Mental Health Services Tax) on the portion of your taxable income over $1,000,000. It applies only to the dollars over $1,000,000 — at $1.2M of gross wages it is ${formatUSD(caBhst(stateTaxableIncome("california-paycheck-calculator", 1200000)))} — and it is what makes the top rate 13.3% instead of 12.3%.`,
    },
    {
      q: "Do I qualify for the renter's credit, CalEITC, or Young Child Tax Credit?",
      a: "Renter's credit ($60 single / $120 joint or head of household) needs California rent for at least half the year and California AGI of $55,830 or less (single) or $111,660 or less (joint / head of household) in 2026. CalEITC is for working families making up to $34,050, with a maximum credit of $313 with no children up to $3,878 with three or more. The Young Child Tax Credit is up to $1,229 for a CalEITC-qualifying taxpayer with a child under six, phasing out above $28,357 of AGI. All three are claimed on your annual return; this calculator does not automatically adjust withholding for them.",
    },
    {
      q: "I moved to or from California mid-year — which return do I file?",
      a: "Form 540NR, the part-year / nonresident return. Part-year residents are taxed on all income while resident plus California-source income while nonresident; nonresidents are taxed only on California-source income.",
    },
    {
      q: "When are estimated payments due, and why is there no September payment?",
      a: "California installments are 30% / 40% / 0% / 30% of the required annual payment, due April 15, June 15, and September 15, 2026, and January 15, 2027 — there is no third-quarter payment, which is California's unusual split. You generally must pay estimates if you expect to owe at least $500 ($250 if married filing separately) after withholding and credits. Filing the 2026 return by January 31, 2027 and paying in full replaces the fourth installment.",
    },
    {
      q: "I'm a single filer earning $60,000 — how much California tax will I owe?",
      a: `About ${formatAmountOrUnavailable(EX_CA_60.annualState)} a year in California income tax, plus ${formatUSD(EX_CA_60.annualStateInsurance)} in CA SDI (1.3% of gross). That is $5,900 standard deduction, then the graduated rates on ${formatUSD0(stateTaxableIncome("california-paycheck-calculator", 60000))} of taxable income, minus the $158 exemption credit — an effective income-tax rate of ${effectiveRatePct(EX_CA_60.annualState, 60000)}% of gross.`,
    },
    {
      q: "Does California tax Social Security or unemployment benefits?",
      a: "No. California does not tax Social Security benefits, Tier 1 and Tier 2 railroad retirement benefits, California Lottery winnings, unemployment compensation, or interest from U.S. savings bonds and Treasury bills.",
    },
  ],
  "texas-paycheck-calculator": [
    {
      q: "Does Texas really have no state income tax — at any income level?",
      a: "Yes. Texas has no state income tax on wages in 2026 — the Comptroller states it as 0% — and the state income-tax line is $0 at $30,000 and at $1,000,000 alike. There are no Texas brackets, no Texas standard deduction, and no state withholding.",
    },
    {
      q: "Why is there no Texas line on my paystub?",
      a: "Because there is no state income tax to withhold. Your pay stub shows federal income tax, Social Security, and Medicare — all federal — and nothing for the state. There is no Texas withholding form to file, either: you fill in only the federal Form W-4. That is for Texas-source work: if you work in another state, that state's withholding can still appear as a state line on your pay stub.",
    },
    {
      q: "Do I need to file a Texas state tax return?",
      a: "No. There is no Texas individual income-tax return to file and no state estimated payments to make, because there is no tax for a return or an estimate to cover.",
    },
    {
      q: "I moved from California or New York to Texas — when does the state tax stop?",
      a: "There is nothing to stop in Texas — Texas never charges you. What changes is your old state: it taxes only the income you earned while you were its resident, plus its-source income after you leave, so you file its part-year or nonresident return for that period and nothing for Texas.",
    },
    {
      q: "What is the Texas franchise tax — is it an income tax by another name?",
      a: "No. The franchise tax is the state's main business tax, levied on taxable entities for the privilege of doing business in Texas. A wage earner never sees it on a pay stub, sole proprietorships are completely exempt, and businesses with annualized total revenue of $2,650,000 or less pay no franchise tax from January 1, 2026.",
    },
    {
      q: "If there's no income tax, how does Texas pay for things?",
      a: "Primarily through sales tax and local property tax. In 2022, local property tax was 47.0% of all state and local tax revenue ($79.4 billion), state sales tax 25.5% ($43.0 billion), local sales taxes 7.2%, and other state taxes 20.3%. Texas ranked sixth-lowest for total effective state and local tax burden in 2022.",
    },
    {
      q: "Are Texas property taxes higher because there's no income tax?",
      a: "They are high. Texas has no state property tax — cities, counties, and school districts levy it — and Texas ranked sixth-highest in effective property-tax rate in 2020, at 1.66% of home value. A Texas paycheck keeps more, but the property-tax bill is usually larger than in most states.",
    },
    {
      q: "Do I still pay federal income tax, Social Security and Medicare in Texas?",
      a: "Yes. Federal income tax, Social Security (6.2% up to $184,500 in 2026), and Medicare (1.45% plus 0.9% over $200,000) apply exactly as in every other state. Only the state layer is $0.",
    },
    {
      q: "I'm self-employed in Texas — what state taxes do I owe?",
      a: "No personal income tax. If you operate as a sole proprietor you are completely exempt from the franchise tax too. Only a taxable entity above the revenue threshold — $2,650,000 annualized total revenue from January 1, 2026 — owes franchise tax.",
    },
    {
      q: "Does Texas tax retirement income, Social Security, or investment income?",
      a: "No. Texas levies no personal income tax at all, so there is no state tax on wages, retirement income, Social Security, or investment income.",
    },
    {
      q: "How much Texas tax would I pay on a $75,000 salary?",
      a: `$0 — Texas has no state income tax. The same $75,000 single filer would pay ${formatAmountOrUnavailable(EX_CA_75.annualState)} in California and ${formatAmountOrUnavailable(EX_NY_75_STATE.annualState)} in New York State (before New York City tax).`,
    },
  ],
  "new-york-paycheck-calculator": [
    {
      q: "Does New York have a state income tax?",
      a: "Yes. New York taxes income on a graduated scale in 2026, from 3.9% up to a top rate of 10.9%. Only the dollars inside each bracket are taxed at that bracket's rate. New York City residents pay a separate city income tax on top, and Yonkers residents pay a 16.75% surcharge on their state tax instead.",
    },
    {
      q: "What is the standard deduction in New York in 2026?",
      a: "The New York standard deduction in 2026 is $8,000 for single filers, $16,050 for married filing jointly, and $11,200 for head of household (or $3,100 for a single filer who can be claimed as a dependent). There is also a $1,000 exemption per dependent — but that exemption is not modelled in the calculator.",
    },
    {
      q: "I live in NYC — why do I pay two income taxes (state + city)?",
      a: `Because New York City levies its own resident income tax on top of the state tax, on the same taxable income — 3.078% to 3.876% in 2026 — with no separate NYC standard deduction. At $60,000 a single NYC resident pays ${formatAmountOrUnavailable(EX_NY_60_STATE.annualState)} in state tax plus ${formatAmountOrUnavailable(EX_NY_60_NYC.annualLocal)} in city tax (after the ${formatAmountOrUnavailable(EX_NYC_SCHOOL_CREDIT_60)} fixed school tax credit).`,
    },
    {
      q: "I live in New Jersey or Connecticut and work in Manhattan — do I owe New York tax?",
      a: "Yes. You owe New York tax on your New York-source wages and must file Form IT-203, the nonresident and part-year resident return. There is no reciprocity exemption on the New York side; relief from double taxation comes from your home state's credit for taxes paid to New York.",
    },
    {
      q: "What's the difference between the NYC school tax credit fixed amount and the rate-reduction amount?",
      a: `The fixed amount is $125 for married filing jointly (or a qualifying surviving spouse) and $63 for everyone else, when income is $250,000 or less — that is the part the calculator subtracts. The rate-reduction amount is computed from a separate table (for single filers, $21 plus 0.228% of city taxable income over $12,000) and is return-only — it is not modelled in the calculator: at $60,000 it would save a further ${formatUSD(nycRateReductionCredit(stateTaxableIncome("new-york-paycheck-calculator", 60000)))} on the actual return.`,
    },
    {
      q: "I live in Yonkers — why is there a 16.75% surcharge instead of a city tax?",
      a: `Yonkers does not levy its own bracketed city income tax. Instead, Yonkers residents pay a 16.75% surcharge on their net New York State tax. At $60,000 that is 16.75% of ${formatAmountOrUnavailable(EX_NY_60_STATE.annualState)}, or ${EX_NY_60_STATE.annualState === null ? "Unavailable" : formatUSD(EX_NY_60_STATE.annualState * 0.1675)} — instead of, not in addition to, the New York City tax.`,
    },
    {
      q: "Why does my IT-2104 say 0 allowances when I'm single with one job and no kids?",
      a: "Because that is the correct answer. You may not claim an allowance for yourself or, if married, your spouse — the form itself says single taxpayers with one job and zero dependents enter 0 on lines 1 and 2. Allowances come from the worksheet and are driven by dependents, itemized deductions, and credits.",
    },
    {
      q: "I have two jobs — how do I fill in IT-2104 so I don't under-withhold?",
      a: "File a separate IT-2104 with each employer, claim all allowances at the higher-paying job and zero at the lower-paying job. If your combined wages are under $107,650, reduce allowances by seven on lines 1 and 2 of the higher-paying job's certificate; from $107,650 to $2,263,265, use the Part 6 charts and put additional withholding on line 3.",
    },
    {
      q: "I'm self-employed in the NYC area — what is the MCTMT and do I owe it?",
      a: "The Metropolitan Commuter Transportation Mobility Tax applies to self-employed individuals doing business in the MCTD — New York City plus Dutchess, Nassau, Orange, Putnam, Rockland, Suffolk, and Westchester counties. The rate is 0.60% of all net self-employment earnings allocated to Zone 1 (the five NYC counties) and 0.34% of all earnings allocated to Zone 2 — but only if those allocated earnings exceed $150,000. The $150,000 is a threshold, not a deduction: $160,000 of Zone 1 earnings means $160,000 × 0.60% = $960 in MCTMT, not 0.60% of the $10,000 above the threshold. The threshold is per individual, even on a joint return, and no credits may offset it.",
    },
    {
      q: "When do I need to make estimated payments, and what's the $300 rule?",
      a: "You must generally pay estimated tax if you expect to owe at least $300 of New York State, New York City, or Yonkers tax for 2026 after withholding, estimated payments, and credits. Four equal installments are due April 15, June 15, and September 15, 2026, and January 15, 2027. Filing the 2026 return by January 31, 2027 and paying in full replaces the January 15 payment.",
    },
    {
      q: "I earn over $107,650 — why is my tax higher than the bracket table suggests?",
      a: "Benefit recapture. Above $107,650 of New York adjusted gross income, a supplemental tax recaptures the benefit of the lower brackets, phasing in over a $50,000 NYAGI band. The plain rate schedule understates the tax at those incomes — that is why the $150,000 worked example on this page is flagged as plain-schedule only.",
    },
    {
      q: "Does New York tax Social Security?",
      a: "No. Social Security and Tier 1 railroad retirement benefits are excluded from New York adjusted gross income. Pensions and annuities are also excludable up to $20,000 at age 59½ and over, and interest on U.S. obligations is excluded.",
    },
    {
      q: "What is the $1,000 dependent exemption, and why doesn't the calculator show it?",
      a: `New York lets you subtract $1,000 from New York adjusted gross income for each dependent (not counting you or your spouse). The exemption is claimed on your annual return, and the calculator's data does not carry it, so it is not modelled: a single filer with two children at $60,000 would have taxable income of ${formatUSD0(stateTaxableIncome("new-york-paycheck-calculator", 60000) - 2000)}, not ${formatUSD0(stateTaxableIncome("new-york-paycheck-calculator", 60000))}, and state tax of ${formatUSD(applyBrackets(stateTaxableIncome("new-york-paycheck-calculator", 60000) - 2000, EX_NY_BRACKETS))} instead of ${formatAmountOrUnavailable(EX_NY_60_STATE.annualState)}.`,
    },
    {
      q: "How much New York tax would I pay on a $75,000 salary?",
      a: `About ${formatAmountOrUnavailable(EX_NY_75_STATE.annualState)} a year in New York State tax, as a single filer with no pre-tax deductions at 2026 rates — before any New York City tax or Yonkers surcharge. That is an estimate: the benefit-recapture threshold ($107,650 NYAGI) does not bite at this income, but the $1,000-per-dependent exemption is not modelled.`,
    },
  ],
};

export function StateExemplarContent({ slug }: { slug: string }) {
  if (slug === "california-paycheck-calculator") return <CaliforniaContent />;
  if (slug === "texas-paycheck-calculator") return <TexasContent />;
  if (slug === "new-york-paycheck-calculator") return <NewYorkContent />;
  return null;
}
