/**
 * PaycheckBeam — federal + FICA withholding engine (tax year 2026).
 *
 * Method: IRS Publication 15-T (2026), percentage method, STANDARD W-4.
 * The simplified form used here is mathematically equivalent to the Pub 15-T
 * worksheet for a standard W-4 (no Step 2 checkbox, no Step 3/4 adjustments):
 *   1. annualize the pay-period wage,
 *   2. subtract pre-tax deductions (401(k), Section 125 health premiums,
 *      HSA, FSA, commuter, LTD, life),
 *   3. subtract the standard deduction for the filing status,
 *   4. apply the 2026 graduated brackets to the remainder,
 *   5. divide back by the number of pay periods.
 *
 * Spot-checks against published Pub 15-T examples (single, standard W-4,
 * no pre-tax deductions): $40,000 -> $2,620/yr federal; $78,000 -> $8,330/yr;
 * $100,000 -> $13,170/yr. All three reproduce exactly.
 *
 * Medicare additional 0.9% — WITHHOLDING vs LIABILITY, do not confuse them:
 * the employer must withhold the additional 0.9% on wages over $200,000 for
 * EVERY filing status (IRC 3101(b)(2)). The $250,000 married-filing-jointly
 * (and $125,000 married-filing-separately) thresholds are the thresholds for
 * the additional tax itself on the return (IRC 1401(b)(2)), not for
 * withholding. A $225,000 MFJ salary therefore withholds 0.9% on the
 * $25,000 above $200,000 = $225/yr extra.
 *
 * Overtime: regular pay is annualized from the pay type; overtime is
 * overtime-hours-per-pay-period x periods x hourly rate x multiplier
 * (default 1.5x, FLSA). For salaried workers the hourly rate is derived
 * from salary / (hours per week x 52). When overtime is off, no overtime
 * is included and the UI says so ("overtime excluded").
 *
 * State income tax and state payroll-insurance programs are delegated to
 * the pluggable estimators in lib/stateTaxData.ts (injected so this module
 * stays federal-only and unit-testable without the state data file).
 * State deduction treatment is per-state, never universal: most states
 * exclude 401(k) and Section 125 deductions from state taxable wages,
 * but Pennsylvania taxes 401(k) contributions, New Jersey taxes Section
 * 125 items and HSAs (but NOT 401(k) — N.J.S.A. 54A:6-21), and California
 * taxes HSA contributions (see STATE_DEDUCTION_RULES in stateTaxData.ts).
 * California SDI wages exclude Section 125 items but INCLUDE 401(k)
 * deferrals and HSA contributions.
 *
 * Sources:
 * - 2026 brackets + standard deductions: IRS Rev. Proc. 2025-32
 *   (IR-2025-103), https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill
 * - Social Security wage base 2026 ($184,500, up from $176,100 in 2025):
 *   SSA Contribution and Benefit Base table,
 *   https://www.ssa.gov/oact/cola/cbb.html (verified 15 Nov 2026).
 *   Max employee SS tax 2026 = 6.2% x $184,500 = $11,439.
 * - Medicare additional withholding: IRS Topic No. 560 / Publication 15
 *   (2026), "Additional Medicare Tax withholding begins when wages exceed
 *   $200,000 in a calendar year" — same threshold for all filing statuses.
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

export type PayFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "semimonthly"
  | "monthly"
  | "quarterly"
  | "semiannually"
  | "annually";
export type PayType = "salary" | "hourly";

/** New York local layer: none (rest of NY), NYC resident, Yonkers resident. */
export type NyLocalOption = "none" | "nyc" | "yonkers";

export const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  single: "Single",
  marriedFilingJointly: "Married filing jointly",
  headOfHousehold: "Head of household",
  marriedFilingSeparately: "Married filing separately",
};

export const PAY_FREQUENCY_LABELS: Record<PayFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Every two weeks",
  semimonthly: "Twice a month",
  monthly: "Monthly",
  quarterly: "Quarterly",
  semiannually: "Twice a year",
  annually: "Annually",
};

/** Pay periods per year. Daily = 260 working days (52 weeks x 5 days). */
export const PERIODS_PER_YEAR: Record<PayFrequency, number> = {
  daily: 260,
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
  quarterly: 4,
  semiannually: 2,
  annually: 1,
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
/**
 * Additional Medicare 0.9% WITHHOLDING threshold — $200,000 for every
 * filing status (IRC 3101(b)(2)). Do not use the $250,000 MFJ / $125,000
 * MFS return-liability thresholds here.
 */
export const MEDICARE_ADDITIONAL_WITHHOLDING_THRESHOLD = 200000;

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

/** Pre-tax deductions, split by how the tax code treats them. */
export interface PreTaxDeductions {
  /** Traditional 401(k) contribution, per year. Reduces income tax, NOT FICA. */
  k401Annual: number;
  /** Section 125 / 132 pre-tax items (medical, dental, vision, FSA,
   *  commuter, LTD, life), per year. Reduces income tax AND FICA. */
  sec125Annual: number;
  /** HSA contribution through payroll, per year. Reduces income tax AND FICA. */
  hsaAnnual: number;
}

export interface OvertimeInputs {
  enabled: boolean;
  /** Overtime hours per pay period. */
  hoursPerPeriod: number;
  /** Overtime multiplier, e.g. 1.5. */
  multiplier: number;
}

export interface PaycheckInputs {
  payType: PayType;
  /** Annual salary (payType "salary") OR hourly rate (payType "hourly"). */
  amount: number;
  /** Regular hours per week. Used for hourly annualization and to derive
   *  the hourly rate for salaried overtime. */
  hoursPerWeek: number;
  frequency: PayFrequency;
  filingStatus: FilingStatus;
  preTax: PreTaxDeductions;
  /** Post-tax deductions (taken after all taxes), per year. */
  postTaxAnnual: number;
  overtime: OvertimeInputs;
  /** State slug (e.g. "texas-paycheck-calculator") or null for federal only. */
  stateSlug: string | null;
  /** New York local layer (only applies when stateSlug is New York). */
  nyLocal: NyLocalOption;
}

/** Input to the pluggable state estimator (lib/stateTaxData.ts). */
export interface StateEstimateInput {
  stateSlug: string;
  annualGross: number;
  filingStatus: FilingStatus;
  preTax: PreTaxDeductions;
  nyLocal: NyLocalOption;
}

export interface StateEstimateResult {
  /** Annual state income tax. null = state estimate unavailable. */
  state: number | null;
  /** Annual local tax (NYC / Yonkers), if any. */
  local: { label: string; annual: number } | null;
}

export type StateEstimator = (input: StateEstimateInput) => StateEstimateResult;

/** One line of the state payroll-insurance breakdown (CA SDI, NY PFL, ...). */
export interface StateInsuranceLine {
  id: string;
  label: string;
  annual: number;
  /** Official source URL, when one was captured. */
  sourceUrl?: string;
  note?: string;
}

export interface PaycheckBreakdown {
  annualGross: number;
  annualRegularGross: number;
  annualOvertimeGross: number;
  annualPreTax: number;
  annualPostTax: number;
  annualFederal: number;
  annualSocialSecurity: number;
  annualMedicare: number;
  annualMedicareAdditional: number;
  annualState: number | null; // null = state estimate unavailable (tables pending)
  annualLocal: number | null;
  localLabel: string | null;
  annualStateInsurance: number;
  stateInsuranceLines: StateInsuranceLine[];
  annualNet: number;
  perPeriodGross: number;
  perPeriodRegularGross: number;
  perPeriodOvertimeGross: number;
  perPeriodFederal: number;
  perPeriodSocialSecurity: number;
  perPeriodMedicare: number;
  perPeriodState: number | null;
  perPeriodLocal: number | null;
  perPeriodStateInsurance: number;
  perPeriodPreTax: number;
  perPeriodPostTax: number;
  perPeriodNet: number;
  periodsPerYear: number;
  effectiveFederalRatePct: number;
  marginalFederalRatePct: number;
  effectiveTotalTaxRatePct: number;
  federalTaxableIncome: number;
}

/**
 * Core calculation. State withholding + state payroll insurance are
 * delegated to the pluggable estimators (injected so this module stays
 * federal-only and unit-testable without the state data file).
 */
export function calculatePaycheck(
  inputs: PaycheckInputs,
  estimateStateTax: StateEstimator,
  estimateStateInsurance: (
    stateSlug: string,
    annualGross: number,
    sec125Annual: number,
    hsaAnnual: number,
  ) => StateInsuranceLine[],
): PaycheckBreakdown {
  const periods = PERIODS_PER_YEAR[inputs.frequency];

  const annualRegularGross =
    inputs.payType === "hourly"
      ? inputs.amount * inputs.hoursPerWeek * 52
      : inputs.amount;

  // Hourly rate for overtime: the hourly wage, or salary derived hourly.
  const hourlyRate =
    inputs.payType === "hourly"
      ? inputs.amount
      : inputs.hoursPerWeek > 0
        ? inputs.amount / (inputs.hoursPerWeek * 52)
        : 0;

  const annualOvertimeGross = inputs.overtime.enabled
    ? inputs.overtime.hoursPerPeriod *
      periods *
      hourlyRate *
      inputs.overtime.multiplier
    : 0;

  const annualGross = annualRegularGross + annualOvertimeGross;

  const annualPreTax = Math.max(
    0,
    inputs.preTax.k401Annual +
      inputs.preTax.sec125Annual +
      inputs.preTax.hsaAnnual,
  );
  const annualPostTax = Math.max(0, inputs.postTaxAnnual);

  // Income-tax base: gross minus ALL pre-tax deductions.
  const incomeTaxBase = Math.max(0, annualGross - annualPreTax);
  // FICA base: 401(k) deferrals are still subject to Social Security/Medicare;
  // Section 125 + HSA contributions made through payroll are not.
  const ficaBase = Math.max(
    0,
    annualGross - inputs.preTax.sec125Annual - inputs.preTax.hsaAnnual,
  );

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

  const annualMedicareAdditional =
    MEDICARE_ADDITIONAL_RATE *
    Math.max(0, ficaBase - MEDICARE_ADDITIONAL_WITHHOLDING_THRESHOLD);
  const annualMedicare =
    MEDICARE_RATE * ficaBase + annualMedicareAdditional;

  const stateEstimate = inputs.stateSlug
    ? estimateStateTax({
        stateSlug: inputs.stateSlug,
        annualGross,
        filingStatus: inputs.filingStatus,
        preTax: inputs.preTax,
        nyLocal: inputs.nyLocal,
      })
    : { state: null, local: null };
  const annualState = stateEstimate.state;
  const annualLocal = stateEstimate.local ? stateEstimate.local.annual : null;
  const localLabel = stateEstimate.local ? stateEstimate.local.label : null;

  const stateInsuranceLines = inputs.stateSlug
    ? estimateStateInsurance(
        inputs.stateSlug,
        annualGross,
        inputs.preTax.sec125Annual,
        inputs.preTax.hsaAnnual,
      )
    : [];
  const annualStateInsurance = stateInsuranceLines.reduce(
    (sum, l) => sum + l.annual,
    0,
  );

  const annualNet =
    annualGross -
    annualPreTax -
    annualPostTax -
    annualFederal -
    annualSocialSecurity -
    annualMedicare -
    (annualState ?? 0) -
    (annualLocal ?? 0) -
    annualStateInsurance;

  const totalTax =
    annualFederal +
    annualSocialSecurity +
    annualMedicare +
    (annualState ?? 0) +
    (annualLocal ?? 0) +
    annualStateInsurance;

  return {
    annualGross,
    annualRegularGross,
    annualOvertimeGross,
    annualPreTax,
    annualPostTax,
    annualFederal,
    annualSocialSecurity,
    annualMedicare,
    annualMedicareAdditional,
    annualState,
    annualLocal,
    localLabel,
    annualStateInsurance,
    stateInsuranceLines,
    annualNet,
    perPeriodGross: annualGross / periods,
    perPeriodRegularGross: annualRegularGross / periods,
    perPeriodOvertimeGross: annualOvertimeGross / periods,
    perPeriodFederal: annualFederal / periods,
    perPeriodSocialSecurity: annualSocialSecurity / periods,
    perPeriodMedicare: annualMedicare / periods,
    perPeriodState: annualState === null ? null : annualState / periods,
    perPeriodLocal: annualLocal === null ? null : annualLocal / periods,
    perPeriodStateInsurance: annualStateInsurance / periods,
    perPeriodPreTax: annualPreTax / periods,
    perPeriodPostTax: annualPostTax / periods,
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

/** Convert an annual salary to an hourly rate (pay-type toggle). */
export function annualToHourly(
  annualSalary: number,
  hoursPerWeek: number,
): number {
  if (hoursPerWeek <= 0) return 0;
  return Math.round((annualSalary / (hoursPerWeek * 52)) * 100) / 100;
}

/** Convert an hourly rate to an annual salary (pay-type toggle). */
export function hourlyToAnnual(
  hourlyRate: number,
  hoursPerWeek: number,
): number {
  return Math.round(hourlyRate * hoursPerWeek * 52);
}

/** Validate calculator inputs. Returns a list of errors; empty = valid.
 *  The UI shows these and suppresses the result while any remain. */
export interface ValidationInput {
  amount: number;
  payType: PayType;
  hoursPerWeek: number;
  overtime: OvertimeInputs;
  totalPreTaxAnnual: number;
  postTaxAnnual: number;
  annualGross: number;
}

export function validatePaycheckInputs(
  input: ValidationInput,
): string[] {
  const errors: string[] = [];
  if (input.amount <= 0) {
    errors.push(
      input.payType === "salary"
        ? "Enter an annual salary above $0."
        : "Enter an hourly rate above $0.",
    );
  }
  if (
    input.payType === "hourly" &&
    (input.hoursPerWeek <= 0 || input.hoursPerWeek > 168)
  ) {
    errors.push("Hours per week must be between 1 and 168.");
  }
  if (input.overtime.enabled) {
    if (input.overtime.hoursPerPeriod < 0) {
      errors.push("Overtime hours can't be negative.");
    }
    if (input.overtime.multiplier < 1 || input.overtime.multiplier > 3) {
      errors.push("Overtime multiplier must be between 1× and 3×.");
    }
    if (input.payType === "salary" && input.hoursPerWeek <= 0) {
      errors.push(
        "Enter your usual hours per week so overtime can be worked out from your salary.",
      );
    }
  }
  if (
    input.annualGross > 0 &&
    input.totalPreTaxAnnual + input.postTaxAnnual > input.annualGross
  ) {
    errors.push(
      `Your deductions (${formatUSD0(input.totalPreTaxAnnual + input.postTaxAnnual)}/year) are more than your gross pay (${formatUSD0(input.annualGross)}/year). Lower them — take-home pay can't go below $0.`,
    );
  }
  return errors;
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
