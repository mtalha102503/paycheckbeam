/**
 * PaycheckBeam — federal + FICA withholding engine (tax year 2026).
 *
 * Method: IRS Publication 15-T (2026), percentage method, STANDARD W-4.
 * The simplified form used here is mathematically equivalent to the Pub 15-T
 * worksheet for a standard W-4 (no Step 2 checkbox, no Step 3/4 adjustments):
 *   1. annualize the pay-period wage,
 *   2. subtract pre-tax deductions (401(k), Section 125 health premiums),
 *   3. subtract the standard deduction for the filing status,
 *   4. apply the 2026 graduated brackets to the remainder,
 *   5. divide back by the number of pay periods.
 *
 * Spot-checks against published Pub 15-T examples (single, standard W-4,
 * no pre-tax deductions): $40,000 -> $2,620/yr federal; $78,000 -> $8,330/yr;
 * $100,000 -> $13,170/yr. All three reproduce exactly.
 *
 * Sources:
 * - 2026 brackets + standard deductions: IRS Rev. Proc. 2025-32
 *   (IR-2025-103), https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill
 * - Social Security wage base 2026 ($184,500, up from $176,100 in 2025):
 *   SSA Contribution and Benefit Base table,
 *   https://www.ssa.gov/oact/cola/cbb.html (verified 15 Nov 2026).
 *   Max employee SS tax 2026 = 6.2% x $184,500 = $11,439.
 * - Medicare additional 0.9% thresholds ($200,000 single / $250,000 joint):
 *   statutory, not indexed — unchanged for years.
 *
 * This is an ESTIMATE for planning, not tax advice. Actual withholding
 * depends on the employee's full W-4, employer payroll setup, and state
 * withholding certificates.
 */

export type FilingStatus =
  | "single"
  | "marriedFilingJointly"
  | "headOfHousehold"
  | "marriedFilingSeparately";

export type PayFrequency = "weekly" | "biweekly" | "semimonthly" | "monthly";
export type PayType = "salary" | "hourly";

export const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  single: "Single",
  marriedFilingJointly: "Married filing jointly",
  headOfHousehold: "Head of household",
  marriedFilingSeparately: "Married filing separately",
};

export const PAY_FREQUENCY_LABELS: Record<PayFrequency, string> = {
  weekly: "Weekly",
  biweekly: "Every two weeks",
  semimonthly: "Twice a month",
  monthly: "Monthly",
};

export const PERIODS_PER_YEAR: Record<PayFrequency, number> = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
};

/** 2026 standard deduction by filing status (Rev. Proc. 2025-32). */
export const STANDARD_DEDUCTION_2026: Record<FilingStatus, number> = {
  single: 16100,
  marriedFilingJointly: 32200,
  headOfHousehold: 24150,
  marriedFilingSeparately: 16100,
};

interface Bracket {
  /** Top of this bracket (taxable income). null = no ceiling. */
  upTo: number | null;
  ratePct: number;
}

/**
 * 2026 federal ordinary-income brackets (taxable income, Rev. Proc. 2025-32
 * §4.01 Tables 1–4). Head of household mirrors single above the 22%
 * bracket; married filing separately mirrors single except the 37% threshold
 * ($384,350).
 */
export const FEDERAL_BRACKETS_2026: Record<FilingStatus, Bracket[]> = {
  single: [
    { upTo: 12400, ratePct: 10 },
    { upTo: 50400, ratePct: 12 },
    { upTo: 105700, ratePct: 22 },
    { upTo: 201775, ratePct: 24 },
    { upTo: 256225, ratePct: 32 },
    { upTo: 640600, ratePct: 35 },
    { upTo: null, ratePct: 37 },
  ],
  marriedFilingJointly: [
    { upTo: 24800, ratePct: 10 },
    { upTo: 100800, ratePct: 12 },
    { upTo: 211400, ratePct: 22 },
    { upTo: 403550, ratePct: 24 },
    { upTo: 512450, ratePct: 32 },
    { upTo: 768700, ratePct: 35 },
    { upTo: null, ratePct: 37 },
  ],
  headOfHousehold: [
    { upTo: 17700, ratePct: 10 },
    { upTo: 67450, ratePct: 12 },
    { upTo: 105700, ratePct: 22 },
    { upTo: 201775, ratePct: 24 },
    { upTo: 256225, ratePct: 32 },
    { upTo: 640600, ratePct: 35 },
    { upTo: null, ratePct: 37 },
  ],
  marriedFilingSeparately: [
    { upTo: 12400, ratePct: 10 },
    { upTo: 50400, ratePct: 12 },
    { upTo: 105700, ratePct: 22 },
    { upTo: 201775, ratePct: 24 },
    { upTo: 256225, ratePct: 32 },
    { upTo: 384350, ratePct: 35 },
    { upTo: null, ratePct: 37 },
  ],
};

/** 2026 Social Security (OASDI) wage base — SSA Contribution and Benefit
 *  Base table (verified 15 Nov 2026). $176,100 was the 2025 figure. */
export const SOCIAL_SECURITY_WAGE_BASE_2026 = 184500;
export const SOCIAL_SECURITY_RATE = 0.062;
export const MEDICARE_RATE = 0.0145;
export const MEDICARE_ADDITIONAL_RATE = 0.009;
/** Additional Medicare tax kicks in above these wages (statutory). */
export const MEDICARE_ADDITIONAL_THRESHOLD: Record<FilingStatus, number> = {
  single: 200000,
  marriedFilingJointly: 250000,
  headOfHousehold: 200000,
  marriedFilingSeparately: 125000,
};

export function applyBrackets(taxableIncome: number, brackets: Bracket[]): number {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  let prevTop = 0;
  for (const b of brackets) {
    const top = b.upTo ?? Infinity;
    const inBracket = Math.min(taxableIncome, top) - prevTop;
    if (inBracket > 0) tax += (inBracket * b.ratePct) / 100;
    if (taxableIncome <= top) break;
    prevTop = top;
  }
  return tax;
}

/** The marginal federal rate (the bracket the last dollar falls in). */
export function marginalRatePct(taxableIncome: number, brackets: Bracket[]): number {
  if (taxableIncome <= 0) return 0;
  for (const b of brackets) {
    if (b.upTo === null || taxableIncome <= b.upTo) return b.ratePct;
  }
  return 37;
}

export interface PaycheckInputs {
  payType: PayType;
  /** Annual salary (payType "salary") OR hourly rate (payType "hourly"). */
  amount: number;
  /** Hours per week — only used when payType is "hourly". */
  hoursPerWeek: number;
  frequency: PayFrequency;
  filingStatus: FilingStatus;
  /** Traditional 401(k) contribution, per year. Reduces income tax, NOT FICA. */
  retirement401kAnnual: number;
  /** Section 125 health-insurance premiums, per year. Reduces income tax AND FICA. */
  healthInsuranceAnnual: number;
  /** State slug (e.g. "texas-paycheck-calculator") or null for federal only. */
  stateSlug: string | null;
}

export interface PaycheckBreakdown {
  annualGross: number;
  annualPreTax: number;
  annualFederal: number;
  annualSocialSecurity: number;
  annualMedicare: number;
  annualState: number | null; // null = state estimate unavailable (tables pending)
  annualNet: number;
  perPeriodGross: number;
  perPeriodFederal: number;
  perPeriodSocialSecurity: number;
  perPeriodMedicare: number;
  perPeriodState: number | null;
  perPeriodPreTax: number;
  perPeriodNet: number;
  periodsPerYear: number;
  effectiveFederalRatePct: number;
  marginalFederalRatePct: number;
  effectiveTotalTaxRatePct: number;
  federalTaxableIncome: number;
}

/**
 * Core calculation. State withholding is delegated to the pluggable
 * `estimateStateTax` function (injected so this module stays federal-only
 * and unit-testable without the state data file).
 */
export function calculatePaycheck(
  inputs: PaycheckInputs,
  estimateStateTax: (
    stateSlug: string,
    annualGross: number,
    filingStatus: FilingStatus,
  ) => number | null,
): PaycheckBreakdown {
  const periods = PERIODS_PER_YEAR[inputs.frequency];

  const annualGross =
    inputs.payType === "hourly"
      ? inputs.amount * inputs.hoursPerWeek * 52
      : inputs.amount;

  const annualPreTax = Math.max(
    0,
    inputs.retirement401kAnnual + inputs.healthInsuranceAnnual,
  );

  // Income-tax base: gross minus ALL pre-tax deductions.
  const incomeTaxBase = Math.max(0, annualGross - annualPreTax);
  // FICA base: 401(k) deferrals are still subject to Social Security/Medicare;
  // Section 125 health premiums are not.
  const ficaBase = Math.max(0, annualGross - inputs.healthInsuranceAnnual);

  const federalTaxableIncome = Math.max(
    0,
    incomeTaxBase - STANDARD_DEDUCTION_2026[inputs.filingStatus],
  );
  const annualFederal = applyBrackets(
    federalTaxableIncome,
    FEDERAL_BRACKETS_2026[inputs.filingStatus],
  );

  const annualSocialSecurity =
    SOCIAL_SECURITY_RATE * Math.min(ficaBase, SOCIAL_SECURITY_WAGE_BASE_2026);

  const additionalThreshold =
    MEDICARE_ADDITIONAL_THRESHOLD[inputs.filingStatus];
  const annualMedicare =
    MEDICARE_RATE * ficaBase +
    MEDICARE_ADDITIONAL_RATE * Math.max(0, ficaBase - additionalThreshold);

  const annualState = inputs.stateSlug
    ? estimateStateTax(inputs.stateSlug, annualGross, inputs.filingStatus)
    : null;

  const annualNet =
    annualGross -
    annualPreTax -
    annualFederal -
    annualSocialSecurity -
    annualMedicare -
    (annualState ?? 0);

  const totalTax =
    annualFederal + annualSocialSecurity + annualMedicare + (annualState ?? 0);

  return {
    annualGross,
    annualPreTax,
    annualFederal,
    annualSocialSecurity,
    annualMedicare,
    annualState,
    annualNet,
    perPeriodGross: annualGross / periods,
    perPeriodFederal: annualFederal / periods,
    perPeriodSocialSecurity: annualSocialSecurity / periods,
    perPeriodMedicare: annualMedicare / periods,
    perPeriodState: annualState === null ? null : annualState / periods,
    perPeriodPreTax: annualPreTax / periods,
    perPeriodNet: annualNet / periods,
    periodsPerYear: periods,
    effectiveFederalRatePct:
      annualGross > 0 ? (annualFederal / annualGross) * 100 : 0,
    marginalFederalRatePct: marginalRatePct(
      federalTaxableIncome,
      FEDERAL_BRACKETS_2026[inputs.filingStatus],
    ),
    effectiveTotalTaxRatePct:
      annualGross > 0 ? (totalTax / annualGross) * 100 : 0,
    federalTaxableIncome,
  };
}

/** Format USD with cents (e.g. $1,234.56). */
export function formatUSD(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Format USD rounded to whole dollars (e.g. $1,235). */
export function formatUSD0(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
