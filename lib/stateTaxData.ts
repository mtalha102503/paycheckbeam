/**
 * PaycheckBeam — state income-tax data (tax year 2026).
 *
 * MERGED 15 Nov 2026 from ~/workspace/paycheckbeam-research/tax-tables-2026.json
 * (Tax Foundation 2026 tables, cross-checked against a second source).
 * All 51 jurisdictions (50 states + DC) are now verified — no TODO states.
 *
 * VERIFICATION RULE (do not break it): a rate/bracket is only marked
 * `verified: true` when it was confirmed against a published 2026 source.
 *
 * Two places where the research file was OVERRIDDEN with newer evidence:
 * - GEORGIA: the research file (TF Feb 2026 table) still showed 5.19% /
 *   $12,000, but HB 463 (signed May 11, 2026, retroactive to Jan 1, 2026)
 *   cut GA to 4.99% and raised the standard deduction to $15,000 / $30,000.
 *   Confirmed against GA DOR 2026 guidance (see the GA entry's sourceNote).
 * - SOUTH CAROLINA: top rate is 6% through Jun 30, 2026 and 6.2% from
 *   Jul 1, 2026. The calculator uses the 6.2% rate (what current paychecks
 *   withhold) and discloses the mid-year switch in the SC notes.
 *
 * CAVEATS carried from the research file (see the state entries):
 * - CA: CORRECTED 15 Nov 2026 to the FTB's official 2026 indexed
 *   amounts (FTB Tax News, Oct 2026): SD $5,900/$11,800, exemption
 *   credit $158/$316, Schedule X/Y bracket tops. The old 2025-based
 *   figures understated the deduction and overstated the tax.
 * - HI standard deduction / exemption are 2025 amounts for the same reason.
 * - UTAH has no standard deduction as a dollar amount: it gives a
 *   nonrefundable CREDIT of 6% of the federal standard deduction instead
 *   ($966 single / $1,932 joint). The estimator subtracts the credit after
 *   applying the 4.5% rate — do not add a UT deduction.
 * - Local (city/county) income taxes are NOT modeled anywhere, except New
 *   York City + Yonkers (see the NY local layer below). Each state page
 *   notes the big ones in `localTaxNote`; the calculator disclaims them.
 * - Per-state deduction rules (STATE_DEDUCTION_RULES): most states follow
 *   the federal treatment — 401(k), Section 125 and HSA excluded from
 *   state taxable wages — but a few states tax one or more of them. The
 *   table lists ONLY exceptions verified against a state DOR source
 *   (research 15 Nov 2026); every other state defaults to the federal
 *   treatment. Never add an exception without a source.
 * - State payroll-insurance programs (STATE_INSURANCE_PROGRAMS) — CA SDI,
 *   NY PFL/DBL, NJ TDI/FLI/UI, WA PFML + WA Cares, MA/CT/OR/CO/MN paid
 *   leave, RI/HI TDI, AK UI, PA UC, ME PFML, DE Paid Leave — are modeled
 *   separately from income tax, each with its verified 2026 rate, cap and
 *   official source. Programs whose 2026 rate could not be verified are
 *   NOT listed.
 * - Per-state adjustments (round-4 friend audit, 15 Nov 2026): AL
 *   standard-deduction phase-down + full federal-tax deduction (ALDOR
 *   withholding booklet, Rev. Jan 2026); WI standard-deduction phaseout
 *   (2026 Form 1-ES); AR 3.7% phase-in band $94,701–$97,600 (DFA
 *   Withholding Tax Formula Method, eff. 01/01/2026); MD personal-exemption
 *   phaseout (2026 PV Worksheet, Line 6); MO tiered federal-tax deduction
 *   (RSMo §143.171); SC SCIAD phaseout (SCDOR Information Letter #26-20).
 * - Round-5 engine fixes (15 Nov 2026): OR capped+phased federal-tax
 *   deduction (2026 OR-ESTIMATE / OR-17) + $263 exemption-credit AGI
 *   cutoff (ORS 316.085(5)); UT taxpayer-credit phaseout (Utah Code
 *   §59-10-1018); CT Tax Calculation Schedule (2026 CT-1040ES Tables
 *   A–E — CT has NO standard deduction; the $15,000 is a phased
 *   exemption); head-of-household schedules for 29 states, with an
 *   explicit hohUnsupported flag for the 13 unverified ones (DC, OR, VT,
 *   MA, NM, AR, DE, MS, OH, RI, VA, WV, MD); federal HoH 24%/32% tops
 *   corrected to $201,750/$256,200 (Rev. Proc. 2025-32 Table 2); PA
 *   employee UC 0.07% (no cap), ME PFML 0.5% and DE Paid Leave 0.4%
 *   added to STATE_INSURANCE_PROGRAMS.
 *   The AL/MO/OR federal-tax deduction uses the engine's own computed federal
 *   liability as an ESTIMATE (not observed withholding) — see
 *   estimateFederalLiability in paycheckCalc.ts and the
 *   federalLiabilityEstimate field on StateEstimateResult; content must
 *   label it as an estimate.
 * - New York local tax: NYC resident brackets 3.078%–3.876% (NY Tax Dept,
 *   Form IT-2105-I (2026), p. 10) on NY State taxable income, minus the
 *   $63/$125 NYC school tax credit (income ≤ $250,000); the NYC
 *   rate-reduction credit is NOT modeled. Yonkers residents pay a 16.75%
 *   surcharge on net NY State tax (IT-2105-I (2026), p. 8).
 * - Direct per-state Department of Revenue verification is still pending for
 *   the top-traffic states (TX, CA, FL, NY, PA, IL, OH, GA, NJ, NC) — the
 *   figures rest on the Tax Foundation 2026 tables + cross-check until then.
 * - State figures are ANNUAL LIABILITY brackets/deductions, not each state's
 *   official withholding formula — paychecks can differ by a few dollars.
 */

import { applyBrackets, estimateFederalLiability } from "./paycheckCalc";
import type {
  FilingStatus,
  NyLocalOption,
  StateEstimateInput,
  StateEstimateResult,
  StateInsuranceLine,
} from "./paycheckCalc";

export type StateTaxStructure = "none" | "flat" | "graduated";

export interface StateBracket {
  /** Top of this bracket (taxable income, single filer). null = no ceiling. */
  upTo: number | null;
  ratePct: number;
  /**
   * Lump sum added once when this bracket is entered, on top of the
   * marginal rate (e.g. Ohio's $332 step in ORC 5747.02(A)(3)(c)).
   * Absent on every other bracket.
   */
  base?: number;
}

export interface StateTaxInfo {
  /** URL slug, e.g. "texas-paycheck-calculator". */
  slug: string;
  state: string;
  abbreviation: string;
  structure: StateTaxStructure;
  /** Flat rate (%), only when structure === "flat" and verified. */
  flatRatePct: number | null;
  /** Single-filer standard deduction / exemption ($). 0 = none. */
  standardDeductionSingle: number | null;
  /** Married-filing-jointly standard deduction / exemption ($). 0 = none. */
  standardDeductionMfj: number | null;
  /** Extra deduction-type personal exemption ($), on top of the standard deduction. null = none. */
  exemptionSingle: number | null;
  exemptionMfj: number | null;
  /** Nonrefundable credit ($) subtracted AFTER the rate is applied. null = none. */
  creditSingle: number | null;
  creditMfj: number | null;
  /** Head-of-household standard deduction ($), when it differs from single (AL head-of-family $5,200; WI $18,030; SC $22,500). Absent = same as single. */
  standardDeductionHoh?: number | null;
  /** Married-filing-separately standard deduction ($), when it differs from single (AL $4,250; WI $12,280). Absent = same as single. */
  standardDeductionMfs?: number | null;
  /** Head-of-household personal exemption ($), when it differs from single (AL head of family $3,000; KS $11,480; CT $19,000). Absent = same as single. */
  exemptionHoh?: number | null;
  /** Married-filing-separately personal exemption ($), when it differs from single (CT $12,000). Absent = same as single. */
  exemptionMfs?: number | null;
  /** Head-of-household nonrefundable credit ($), when it differs from single (IA $80; UT $1,449; CT — see ctSchedule). Absent = same as single. */
  creditHoh?: number | null;
  /**
   * Head-of-household modeling status (round-5, 15 Nov 2026).
   * true = the HoH schedule is verified and modeled (bracketsHoh when the
   * HoH schedule differs from single; otherwise the single schedule, which
   * the state itself prescribes). false = the HoH schedule is unverified —
   * estimateStateWithholding returns { state: null, hohUnsupported: true }
   * instead of silently substituting the single-filer number. Absent =
   * supported (legacy single fallback); every income-tax entry now sets
   * this explicitly. No-tax states return $0 before the check runs.
   */
  hohSupported?: boolean;
  /** Utah-style taxpayer-credit phaseout (Utah Code §59-10-1018). */
  creditPhaseout?: CreditPhaseoutRule | null;
  /**
   * Credit AGI cutoff (OR: the $263 exemption credit is $0 when federal
   * AGI exceeds $100,000 single/MFS or $200,000 MFJ/HoH — ORS 316.085(5)).
   * The engine's AGI proxy is stateTaxableBase.
   */
  creditAgiLimit?: { single: number; joint: number } | null;
  /** Connecticut Tax Calculation Schedule (2026 CT-1040ES Tables A–E). */
  ctSchedule?: ConnecticutSchedule | null;
  /** Alabama-style standard-deduction phase-down (stepped, with a floor). */
  sdPhaseDown?: SdPhaseDownRule | null;
  /** Wisconsin-style standard-deduction phaseout (percentage of income over a threshold, floored at $0). */
  sdPhaseout?: SdPhaseoutRule | null;
  /** Federal income-tax deduction (AL full; MO tiered per §143.171; OR capped+phased). Input is the engine's computed federal liability (estimate). */
  federalTaxDeduction?: FederalTaxDeductionRule | null;
  /** Maryland-style personal-exemption phaseout (per-exemption amount by AGI band). */
  exemptionPhaseout?: ExemptionPhaseoutRule | null;
  /** Arkansas phase-in band for the 3.7% top rate ($94,701–$97,600). */
  arPhaseInBand?: ArkansasPhaseInBand | null;
  /** South Carolina SCIAD phaseout (Information Letter #26-20). */
  sciadPhaseout?: SciadPhaseoutRule | null;
  /** Graduated brackets (single filer). null for flat / no-tax states. */
  brackets: StateBracket[] | null;
  /** Graduated brackets (married filing jointly). null for flat / no-tax states. */
  bracketsMfj: StateBracket[] | null;
  /**
   * Graduated brackets (head of household), when the HoH schedule differs
   * from single (NY, CA, MN, ME, HI, NE, OK, ND, MT, ID, CT; NJ uses the
   * MFJ table). Absent on hohSupported states whose HoH schedule IS the
   * single schedule (AL, WI, SC, KS, MO, GA, PA, IL, IN, KY, MI) — the
   * estimator falls back to `brackets` for those, by design.
   */
  bracketsHoh?: StateBracket[] | null;
  /** True only when every number on this entry was verified (see header). */
  verified: boolean;
  /** Best source link available right now (Tax Foundation 2026 tables). */
  sourceUrl: string;
  sourceNote: string;
  /** 1–2 sentence plain-English summary, shown on the state page. */
  summary: string;
  /** Bullets shown on the state page under "How withholding works". */
  withholdingNotes: string[];
  /** e.g. "Maryland levies a county income tax on top of the state rate." */
  localTaxNote: string | null;
}

// ---- Per-state adjustment rules (round-4 friend audit, 15 Nov 2026) ----
// Each rule is data on the state entry; the math lives in the exported
// helpers just above estimateStateWithholding. Income measures:
// - AL phase-down: annual GROSS income (the ALDOR booklet chart is keyed to gross).
// - WI/MD/MO/SC phaseouts: AGI — the engine's proxy is stateTaxableBase
//   (gross minus the pre-tax deductions the state excludes).
// - AR band: NET TAXABLE income (after the $2,470 standard deduction),
//   i.e. the `taxable` variable in estimateStateWithholding.

/** One filing status's leg of an Alabama-style stepped phase-down. */
export interface SdPhaseDownLeg {
  /** Standard deduction at or below the threshold. */
  base: number;
  /** Floor — the deduction never falls below this. */
  floor: number;
  /** Dollars lost per step (e.g. $25 single, $175 MFJ, $135 HoF, $88 MFS). */
  reductionPerStep: number;
  /** Income width of one step ($500, or $250 for AL MFS). */
  stepSize: number;
  /** Income at or below which the full base applies. */
  threshold: number;
}

export interface SdPhaseDownRule {
  single: SdPhaseDownLeg;
  marriedFilingJointly: SdPhaseDownLeg;
  headOfHousehold: SdPhaseDownLeg;
  marriedFilingSeparately: SdPhaseDownLeg;
}

/** One filing status's leg of a Wisconsin-style percentage phaseout. */
export interface SdPhaseoutLeg {
  /** Standard deduction at or below the threshold. */
  base: number;
  /** Income at or below which the full base applies. */
  threshold: number;
  /** Percent of income over the threshold subtracted (e.g. 12 single). */
  ratePct: number;
}

export interface SdPhaseoutRule {
  single: SdPhaseoutLeg;
  marriedFilingJointly: SdPhaseoutLeg;
  marriedFilingSeparately: SdPhaseoutLeg;
  /**
   * Head of household: the rate applies from the threshold up to
   * segmentEnd ($58,827); above that the SINGLE leg's formula takes over
   * (Form 1-ES: the HoH schedule converges to the single schedule).
   * The ~$0.46 seam at $58,827 is the state's own table rounding.
   */
  headOfHousehold: SdPhaseoutLeg & { segmentEnd: number };
}

/**
 * Federal income-tax deduction.
 * - "full" (AL): 100% of the federal liability, no cap.
 * - "tiered" (MO §143.171): the percentage depends on MO AGI, capped at
 *   $5,000 single / $10,000 joint.
 * - "cappedPhased" (OR, 2026 Publication OR-ESTIMATE line 9 / OR-17):
 *   the federal liability is deductible up to a cap ($8,750; $4,375 MFS)
 *   that phases out above a federal-AGI threshold — single/MFS starts at
 *   $125,000 and loses $1,750 per further $5,000 band ($0 at $145,000);
 *   MFJ/HoH starts at $250,000 and loses $1,750 per further $10,000 band
 *   ($0 at $290,000). `agi` is the federal-AGI proxy (stateTaxableBase).
 */
export type FederalTaxDeductionRule =
  | { kind: "full" }
  | {
      kind: "tiered";
      tiers: { upTo: number | null; pct: number }[];
      capSingle: number;
      capMfj: number;
    }
  | {
      kind: "cappedPhased";
      capSingle: number;
      capMfj: number;
      capMfs: number;
      phaseoutStartSingle: number;
      phaseoutStartJoint: number;
      stepSizeSingle: number;
      stepSizeJoint: number;
      stepAmount: number;
    };

/**
 * Utah taxpayer-credit phaseout (Utah Code §59-10-1018): the credit is
 * reduced $0.013 per $1 of Utah taxable income over the indexed base —
 * 2026 bases single/MFS $18,696, HoH $28,045, MFJ $37,392 (UT Legislature
 * Revenue & Taxation Interim Committee, 2026 Tax Credit Review). The
 * credit reaches $0 at ≈ $93,004 of taxable income (single).
 */
export interface CreditPhaseoutRule {
  /** Credit lost per $1 of taxable income over the base. */
  ratePerDollar: number;
  /** Indexed income base by filing status. */
  bases: Record<FilingStatus, number>;
}

/** One leg of CT Table C (2% phase-out add-back, 2026 CT-1040ES). */
export interface ConnecticutTableCLeg {
  /** CT AGI at or below which the add-back is $0. */
  threshold: number;
  /** AGI width of one step ($5,000 single/MFJ, $2,500 MFS, $4,000 HoH). */
  bandWidth: number;
  /** Dollars added per step ($25 single/MFS, $50 MFJ, $40 HoH). */
  step: number;
  /** Maximum add-back ($250 single/MFS, $500 MFJ, $400 HoH). */
  max: number;
}

/**
 * One leg of CT Table D (tax recapture, 2026 CT-1040ES). Three phases:
 * a stepped climb from p1Threshold to p1SteppedUpTo, a flat plateau to
 * p1FlatUpTo, a second stepped climb from p2Start to p2SteppedUpTo, a
 * second plateau to p2FlatUpTo, then a stepped climb from p3Start capped
 * at p3Max. (Single: $25/$5k to $150k, $250 flat to $200k, $90/$5k to
 * $345k, $2,950 flat to $500k, $50/$5k to $3,400 max at $540k+.)
 */
export interface ConnecticutTableDLeg {
  p1Threshold: number;
  p1Width: number;
  p1Step: number;
  p1SteppedUpTo: number;
  p1FlatUpTo: number;
  p1Flat: number;
  p2Start: number;
  p2Width: number;
  p2Step: number;
  p2SteppedUpTo: number;
  p2FlatUpTo: number;
  p2Flat: number;
  p3Start: number;
  p3Width: number;
  p3Step: number;
  p3Max: number;
}

/** One band of CT Table E (personal tax credit, % of tax). */
export interface ConnecticutTableEBand {
  /** CT AGI at or below which this rate applies (null = no ceiling). */
  upTo: number | null;
  /** Credit rate (0.75 down to 0). */
  rate: number;
}

/**
 * Connecticut Tax Calculation Schedule (2026 Form CT-1040ES, Rev. 01/26,
 * portal.ct.gov). Table A: the personal exemption (exemptionSingle/Mfj/
 * Hoh/Mfs on the entry — $15,000/$24,000/$19,000/$12,000) phases out
 * $1,000 per $1,000 (or part) of CT AGI over tableAThreshold; Table B is
 * the ordinary brackets; Table C is the add-back; Table D is the
 * recapture; Table E is the personal credit (a % of Table B + C + D).
 * The $15,000 used to sit in standardDeductionSingle mislabelled as a
 * standard deduction — Connecticut has NO standard deduction.
 */
export interface ConnecticutSchedule {
  /** Table A phaseout threshold by filing status. */
  tableAThreshold: Record<FilingStatus, number>;
  tableC: Record<FilingStatus, ConnecticutTableCLeg>;
  tableD: Record<FilingStatus, ConnecticutTableDLeg>;
  tableE: Record<FilingStatus, ConnecticutTableEBand[]>;
}

/** One AGI band of a Maryland-style per-exemption phaseout. */
export interface ExemptionPhaseoutBand {
  /** AGI at or below which this per-exemption amount applies (null = no ceiling). */
  upTo: number | null;
  /** Exemption dollars per exemption (one per filer: single 1, joint 2). */
  perExemption: number;
}

export interface ExemptionPhaseoutRule {
  /** Bands for single + married filing separately (1 exemption). */
  single: ExemptionPhaseoutBand[];
  /** Bands for married filing jointly (2 exemptions) + head of household (1). */
  joint: ExemptionPhaseoutBand[];
}

/**
 * Arkansas phase-in band (DFA Withholding Tax Formula Method, eff.
 * 01/01/2026): between bandStart and bandEnd the tax is
 * ratePct% x net taxable income minus a subtraction that starts at
 * firstSubtraction and falls stepDecrement per stepSize of income; above
 * the band the subtraction is aboveSubtraction. Below the band the normal
 * brackets apply (they equal ratePct% - $367.16 for $26,400–$94,700).
 */
export interface ArkansasPhaseInBand {
  bandStart: number;
  bandEnd: number;
  firstSubtraction: number;
  stepDecrement: number;
  stepSize: number;
  aboveSubtraction: number;
  ratePct: number;
}

/** One filing status's leg of the South Carolina SCIAD phaseout. */
export interface SciadPhaseoutLeg {
  /** Full SCIAD at or below the threshold ($15,000 single, $30,000 joint, $22,500 HoH). */
  base: number;
  /** AGI at or below which the full SCIAD applies. */
  threshold: number;
  /** AGI span over which the SCIAD phases to $0 (e.g. $55,000 single: $0 at $95,000). */
  span: number;
}

export interface SciadPhaseoutRule {
  single: SciadPhaseoutLeg;
  marriedFilingJointly: SciadPhaseoutLeg;
  headOfHousehold: SciadPhaseoutLeg;
  marriedFilingSeparately: SciadPhaseoutLeg;
}

export const STATE_TAX_DATA: StateTaxInfo[] = [  {
    slug: "alabama-paycheck-calculator",
    state: "Alabama",
    abbreviation: "AL",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 3000,
    standardDeductionMfj: 8500,
    standardDeductionHoh: 5200,
    standardDeductionMfs: 4250,
    exemptionSingle: 1500,
    exemptionMfj: 3000,
    exemptionHoh: 3000,
    creditSingle: null,
    creditMfj: null,
    // AL head of family uses the single bracket schedule (ALDOR) with its
    // own $5,200 standard deduction + $3,000 exemption; the phase-down leg
    // above already carries the HoF taper.
    hohSupported: true,
    sdPhaseDown: {
      single: { base: 3000, floor: 2500, reductionPerStep: 25, stepSize: 500, threshold: 25999 },
      marriedFilingJointly: { base: 8500, floor: 5000, reductionPerStep: 175, stepSize: 500, threshold: 25999 },
      headOfHousehold: { base: 5200, floor: 2500, reductionPerStep: 135, stepSize: 500, threshold: 25999 },
      marriedFilingSeparately: { base: 4250, floor: 2500, reductionPerStep: 88, stepSize: 250, threshold: 12999 },
    },
    federalTaxDeduction: { kind: "full" },
    brackets: [{ upTo: 500, ratePct: 2 }, { upTo: 3000, ratePct: 4 }, { upTo: null, ratePct: 5 }],
    bracketsMfj: [{ upTo: 1000, ratePct: 2 }, { upTo: 6000, ratePct: 4 }, { upTo: null, ratePct: 5 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source. Standard-deduction phase-down + federal-tax deduction per ALDOR Withholding Tax Tables and Instructions, Rev. Jan 2026 (whbooklet_0126.pdf): single $3,000 → $2,500 floor ($25 per $500 over $25,999); joint $8,500 → $5,000 floor ($175 per $500); head of family $5,200 → $2,500 ($135 per $500); MFS $4,250 → $2,500 ($88 per $250 over $12,999).",
    summary: "Alabama taxes wages on a graduated scale — the rate rises as income rises, from 2% to a top rate of 5% in 2026.",
    withholdingNotes: [
      "Alabama taxes taxable income in 3 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $3,000 single standard deduction first. A further $1,500 personal exemption also applies.",
      "The standard deduction phases down as gross income rises — $3,000 single down to a $2,500 floor ($8,500 down to $5,000 joint) — and Alabama also lets you deduct your federal income tax. The calculator subtracts its own estimated federal liability for that line (an estimate, not your actual withholding).",
    ],
    localTaxNote: "Some Alabama cities levy a local occupational tax on wages (for example, Birmingham) — separate from state withholding.",
  },
  {
    slug: "alaska-paycheck-calculator",
    state: "Alaska",
    abbreviation: "AK",
    structure: "none",
    hohSupported: true,
    flatRatePct: null,
    standardDeductionSingle: null,
    standardDeductionMfj: null,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    brackets: null,
    bracketsMfj: null,
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026: no tax on wages in 2026 (Tax Foundation 2026 tables).",
    summary: "Alaska has no state income tax on wages — your paycheck has $0 withheld for state income tax.",
    withholdingNotes: [
      "Alaska levies no personal income tax at all, so there is no state withholding line on your paycheck.",
      "Federal tax, Social Security, and Medicare still apply exactly as in every other state.",
      "Alaska workers still pay a 0.50% unemployment-insurance contribution on the first $54,200 of wages (max $271 a year) — the calculator shows it as its own line, separate from state income tax, which stays $0.",
    ],
    localTaxNote: null,
  },
  {
    slug: "arizona-paycheck-calculator",
    state: "Arizona",
    abbreviation: "AZ",
    structure: "flat",
    flatRatePct: 2.5,
    standardDeductionSingle: 16100,
    standardDeductionMfj: 32200,
    standardDeductionHoh: 24150,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    hohSupported: true,
    brackets: null,
    bracketsMfj: null,
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source. AZ standard deduction per A.R.S. § 43-1041 as amended by HB 4168 (Laws 2026, Ch. 140): $15,750 base indexed like the federal deduction = $16,100/$32,200 for 2026.",
    summary: "Arizona taxes income at a single flat rate of 2.5% in 2026. The lowest flat rate in the country.",
    withholdingNotes: [
      "Arizona's 2.5% flat rate applies to every dollar of taxable income, after the $16,100 single standard deduction.",
      "Arizona gives a $125 credit per dependent under 17 ($25 for age 17 and older).",
    ],
    localTaxNote: null,
  },
  {
    slug: "arkansas-paycheck-calculator",
    state: "Arkansas",
    abbreviation: "AR",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 2470,
    standardDeductionMfj: 4940,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: 29,
    creditMfj: 58,
    hohSupported: false,
    arPhaseInBand: {
      bandStart: 94701,
      bandEnd: 97600,
      firstSubtraction: 369.9,
      stepDecrement: 10,
      stepSize: 100,
      aboveSubtraction: 79.9,
      ratePct: 3.7,
    },
    brackets: [{ upTo: 5599, ratePct: 0 }, { upTo: 11199, ratePct: 2 }, { upTo: 15999, ratePct: 3 }, { upTo: 26399, ratePct: 3.4 }, { upTo: null, ratePct: 3.7 }],
    bracketsMfj: [{ upTo: 5599, ratePct: 0 }, { upTo: 11199, ratePct: 2 }, { upTo: 15999, ratePct: 3 }, { upTo: 26399, ratePct: 3.4 }, { upTo: null, ratePct: 3.7 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source. 2026 schedule per the DFA Withholding Tax Formula Method, eff. 01/01/2026 (Act 1 of the 2026 First Extraordinary Session). Phase-in band $94,701–$97,600 of net taxable income: 3.7% minus a subtraction stepping $369.90 → $89.90 in $100 steps; 3.7% minus $79.90 above $97,601.",
    summary: "Arkansas taxes wages on a graduated scale — the rate rises as income rises, from 0% to a top rate of 3.7% in 2026.",
    withholdingNotes: [
      "Arkansas taxes taxable income in 5 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $2,470 single standard deduction first, then a $29 credit per exemption.",
      "A separate lower-rate tax table applies if you earn $92,300 or less.",
      "Above $94,700 of net taxable income the 3.7% rate phases in over a $94,701–$97,600 band before the full rate applies.",
    ],
    localTaxNote: null,
  },
  {
    slug: "california-paycheck-calculator",
    state: "California",
    abbreviation: "CA",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 5900,
    standardDeductionMfj: 11800,
    standardDeductionHoh: 11800,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: 158,
    creditMfj: 316,
    creditHoh: 158,
    hohSupported: true,
    brackets: [{ upTo: 11456, ratePct: 1 }, { upTo: 27157, ratePct: 2 }, { upTo: 42861, ratePct: 4 }, { upTo: 59498, ratePct: 6 }, { upTo: 75197, ratePct: 8 }, { upTo: 384109, ratePct: 9.3 }, { upTo: 460927, ratePct: 10.3 }, { upTo: 768213, ratePct: 11.3 }, { upTo: 1000000, ratePct: 12.3 }, { upTo: null, ratePct: 13.3 }],
    bracketsMfj: [{ upTo: 22912, ratePct: 1 }, { upTo: 54314, ratePct: 2 }, { upTo: 85722, ratePct: 4 }, { upTo: 118996, ratePct: 6 }, { upTo: 150394, ratePct: 8 }, { upTo: 768218, ratePct: 9.3 }, { upTo: 921854, ratePct: 10.3 }, { upTo: 1000000, ratePct: 11.3 }, { upTo: 1536426, ratePct: 12.3 }, { upTo: null, ratePct: 13.3 }],
    bracketsHoh: [{ upTo: 22927, ratePct: 1 }, { upTo: 54316, ratePct: 2 }, { upTo: 70018, ratePct: 4 }, { upTo: 86654, ratePct: 6 }, { upTo: 102356, ratePct: 8 }, { upTo: 522385, ratePct: 9.3 }, { upTo: 626864, ratePct: 10.3 }, { upTo: 1000000, ratePct: 11.3 }, { upTo: 1044771, ratePct: 12.3 }, { upTo: null, ratePct: 13.3 }],
    verified: true,
    sourceUrl: "https://www.ftb.ca.gov/about-ftb/newsroom/tax-news/2026/10.html",
    sourceNote: "CORRECTED 15 Nov 2026 to the FTB's official 2026 indexed amounts (FTB Tax News, October 2026; CCPI inflation 3.4%): standard deduction $5,900 single / $11,800 joint, personal exemption credit $158 / $316, and the 2026 Schedule X/Y bracket tops. The previous figures were the 2025 inflation-adjusted amounts.",
    summary: "California taxes wages on a graduated scale — the rate rises as income rises, from 1% to a top rate of 13.3% in 2026. The highest top rate in the country.",
    withholdingNotes: [
      "California taxes taxable income in 10 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $5,900 single standard deduction first.",
      "The 13.3% top rate is the 12.3% bracket rate plus the 1% Behavioral Health Services Tax (previously called the Mental Health Services Tax) on taxable income over $1 million.",
      "California's 1.3% SDI payroll tax has no wage ceiling and is separate from income tax — the calculator shows it as its own deduction line below.",
      "California taxes HSA contributions — they do not reduce CA taxable income, unlike 401(k) and Section 125 items.",
    ],
    localTaxNote: null,
  },
  {
    slug: "colorado-paycheck-calculator",
    state: "Colorado",
    abbreviation: "CO",
    structure: "flat",
    flatRatePct: 4.4,
    standardDeductionSingle: 16100,
    standardDeductionMfj: 32200,
    standardDeductionHoh: 24150,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    hohSupported: true,
    brackets: null,
    bracketsMfj: null,
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source.",
    summary: "Colorado taxes income at a single flat rate of 4.4% in 2026.",
    withholdingNotes: [
      "Colorado's 4.4% flat rate applies to every dollar of taxable income, after the $16,100 single standard deduction.",
      "Colorado starts from your federal taxable income, so the federal standard deduction applies here too.",
    ],
    localTaxNote: "Denver levies an occupational privilege tax on wages — separate from state withholding.",
  },
  {
    slug: "connecticut-paycheck-calculator",
    state: "Connecticut",
    abbreviation: "CT",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: null,
    standardDeductionMfj: null,
    exemptionSingle: 15000,
    exemptionMfj: 24000,
    exemptionHoh: 19000,
    exemptionMfs: 12000,
    creditSingle: null,
    creditMfj: null,
    hohSupported: true,
    ctSchedule: {
      tableAThreshold: {
        single: 30000,
        marriedFilingJointly: 48000,
        headOfHousehold: 38000,
        marriedFilingSeparately: 24000,
      },
      tableC: {
        single: { threshold: 56500, bandWidth: 5000, step: 25, max: 250 },
        marriedFilingJointly: { threshold: 100500, bandWidth: 5000, step: 50, max: 500 },
        headOfHousehold: { threshold: 78500, bandWidth: 4000, step: 40, max: 400 },
        marriedFilingSeparately: { threshold: 50250, bandWidth: 2500, step: 25, max: 250 },
      },
      tableD: {
        single: { p1Threshold: 105000, p1Width: 5000, p1Step: 25, p1SteppedUpTo: 150000, p1FlatUpTo: 200000, p1Flat: 250, p2Start: 200000, p2Width: 5000, p2Step: 90, p2SteppedUpTo: 345000, p2FlatUpTo: 500000, p2Flat: 2950, p3Start: 500000, p3Width: 5000, p3Step: 50, p3Max: 3400 },
        marriedFilingJointly: { p1Threshold: 210000, p1Width: 10000, p1Step: 50, p1SteppedUpTo: 300000, p1FlatUpTo: 400000, p1Flat: 500, p2Start: 400000, p2Width: 10000, p2Step: 180, p2SteppedUpTo: 690000, p2FlatUpTo: 1000000, p2Flat: 5900, p3Start: 1000000, p3Width: 10000, p3Step: 100, p3Max: 6800 },
        headOfHousehold: { p1Threshold: 168000, p1Width: 8000, p1Step: 40, p1SteppedUpTo: 240000, p1FlatUpTo: 320000, p1Flat: 400, p2Start: 320000, p2Width: 8000, p2Step: 140, p2SteppedUpTo: 552000, p2FlatUpTo: 800000, p2Flat: 4600, p3Start: 800000, p3Width: 8000, p3Step: 80, p3Max: 5320 },
        marriedFilingSeparately: { p1Threshold: 105000, p1Width: 5000, p1Step: 25, p1SteppedUpTo: 150000, p1FlatUpTo: 200000, p1Flat: 250, p2Start: 200000, p2Width: 5000, p2Step: 90, p2SteppedUpTo: 345000, p2FlatUpTo: 500000, p2Flat: 2950, p3Start: 500000, p3Width: 5000, p3Step: 50, p3Max: 3400 },
      },
      tableE: {
        single: [{ upTo: 18800, rate: 0.75 }, { upTo: 19300, rate: 0.7 }, { upTo: 19800, rate: 0.65 }, { upTo: 20300, rate: 0.6 }, { upTo: 20800, rate: 0.55 }, { upTo: 21300, rate: 0.5 }, { upTo: 21800, rate: 0.45 }, { upTo: 22300, rate: 0.4 }, { upTo: 25000, rate: 0.35 }, { upTo: 25500, rate: 0.3 }, { upTo: 26000, rate: 0.25 }, { upTo: 26500, rate: 0.2 }, { upTo: 31300, rate: 0.15 }, { upTo: 31800, rate: 0.14 }, { upTo: 32300, rate: 0.13 }, { upTo: 32800, rate: 0.12 }, { upTo: 33300, rate: 0.11 }, { upTo: 60000, rate: 0.1 }, { upTo: 60500, rate: 0.09 }, { upTo: 61000, rate: 0.08 }, { upTo: 61500, rate: 0.07 }, { upTo: 62000, rate: 0.06 }, { upTo: 62500, rate: 0.05 }, { upTo: 63000, rate: 0.04 }, { upTo: 63500, rate: 0.03 }, { upTo: 64000, rate: 0.02 }, { upTo: 64500, rate: 0.01 }, { upTo: null, rate: 0 }],
        marriedFilingJointly: [{ upTo: 30000, rate: 0.75 }, { upTo: 30500, rate: 0.7 }, { upTo: 31000, rate: 0.65 }, { upTo: 31500, rate: 0.6 }, { upTo: 32000, rate: 0.55 }, { upTo: 32500, rate: 0.5 }, { upTo: 33000, rate: 0.45 }, { upTo: 33500, rate: 0.4 }, { upTo: 40000, rate: 0.35 }, { upTo: 40500, rate: 0.3 }, { upTo: 41000, rate: 0.25 }, { upTo: 41500, rate: 0.2 }, { upTo: 50000, rate: 0.15 }, { upTo: 50500, rate: 0.14 }, { upTo: 51000, rate: 0.13 }, { upTo: 51500, rate: 0.12 }, { upTo: 52000, rate: 0.11 }, { upTo: 96000, rate: 0.1 }, { upTo: 96500, rate: 0.09 }, { upTo: 97000, rate: 0.08 }, { upTo: 97500, rate: 0.07 }, { upTo: 98000, rate: 0.06 }, { upTo: 98500, rate: 0.05 }, { upTo: 99000, rate: 0.04 }, { upTo: 99500, rate: 0.03 }, { upTo: 100000, rate: 0.02 }, { upTo: 100500, rate: 0.01 }, { upTo: null, rate: 0 }],
        headOfHousehold: [{ upTo: 24000, rate: 0.75 }, { upTo: 24500, rate: 0.7 }, { upTo: 25000, rate: 0.65 }, { upTo: 25500, rate: 0.6 }, { upTo: 26000, rate: 0.55 }, { upTo: 26500, rate: 0.5 }, { upTo: 27000, rate: 0.45 }, { upTo: 27500, rate: 0.4 }, { upTo: 34000, rate: 0.35 }, { upTo: 34500, rate: 0.3 }, { upTo: 35000, rate: 0.25 }, { upTo: 35500, rate: 0.2 }, { upTo: 44000, rate: 0.15 }, { upTo: 44500, rate: 0.14 }, { upTo: 45000, rate: 0.13 }, { upTo: 45500, rate: 0.12 }, { upTo: 46000, rate: 0.11 }, { upTo: 74000, rate: 0.1 }, { upTo: 74500, rate: 0.09 }, { upTo: 75000, rate: 0.08 }, { upTo: 75500, rate: 0.07 }, { upTo: 76000, rate: 0.06 }, { upTo: 76500, rate: 0.05 }, { upTo: 77000, rate: 0.04 }, { upTo: 77500, rate: 0.03 }, { upTo: 78000, rate: 0.02 }, { upTo: 78500, rate: 0.01 }, { upTo: null, rate: 0 }],
        marriedFilingSeparately: [{ upTo: 15000, rate: 0.75 }, { upTo: 15500, rate: 0.7 }, { upTo: 16000, rate: 0.65 }, { upTo: 16500, rate: 0.6 }, { upTo: 17000, rate: 0.55 }, { upTo: 17500, rate: 0.5 }, { upTo: 18000, rate: 0.45 }, { upTo: 18500, rate: 0.4 }, { upTo: 20000, rate: 0.35 }, { upTo: 20500, rate: 0.3 }, { upTo: 21000, rate: 0.25 }, { upTo: 21500, rate: 0.2 }, { upTo: 25000, rate: 0.15 }, { upTo: 25500, rate: 0.14 }, { upTo: 26000, rate: 0.13 }, { upTo: 26500, rate: 0.12 }, { upTo: 27000, rate: 0.11 }, { upTo: 48000, rate: 0.1 }, { upTo: 48500, rate: 0.09 }, { upTo: 49000, rate: 0.08 }, { upTo: 49500, rate: 0.07 }, { upTo: 50000, rate: 0.06 }, { upTo: 50500, rate: 0.05 }, { upTo: 51000, rate: 0.04 }, { upTo: 51500, rate: 0.03 }, { upTo: 52000, rate: 0.02 }, { upTo: 52500, rate: 0.01 }, { upTo: null, rate: 0 }],
      },
    },
    brackets: [{ upTo: 10000, ratePct: 2 }, { upTo: 50000, ratePct: 4.5 }, { upTo: 100000, ratePct: 5.5 }, { upTo: 200000, ratePct: 6 }, { upTo: 250000, ratePct: 6.5 }, { upTo: 500000, ratePct: 6.9 }, { upTo: null, ratePct: 6.99 }],
    bracketsMfj: [{ upTo: 20000, ratePct: 2 }, { upTo: 100000, ratePct: 4.5 }, { upTo: 200000, ratePct: 5.5 }, { upTo: 400000, ratePct: 6 }, { upTo: 500000, ratePct: 6.5 }, { upTo: 1000000, ratePct: 6.9 }, { upTo: null, ratePct: 6.99 }],
    bracketsHoh: [{ upTo: 16000, ratePct: 2 }, { upTo: 80000, ratePct: 4.5 }, { upTo: 160000, ratePct: 5.5 }, { upTo: 320000, ratePct: 6 }, { upTo: 400000, ratePct: 6.5 }, { upTo: 800000, ratePct: 6.9 }, { upTo: null, ratePct: 6.99 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source. Full Tax Calculation Schedule per 2026 Form CT-1040ES (Rev. 01/26, CT DRS, portal.ct.gov): Table A exemption $15,000 single / $24,000 joint / $19,000 HoH / $12,000 MFS, −$1,000 per $1,000 over $30,000 / $48,000 / $38,000 / $24,000 AGI ($1,000 remains at exactly $44,000 single); Table B brackets; Table C add-back; Table D recapture; Table E personal credit (75% down to 0% — single 0% above $64,500, HoH above $78,500, MFJ above $100,500, MFS above $52,500). CORRECTED 15 Nov 2026: the $15,000 was mislabelled as a standard deduction — Connecticut has NO standard deduction; it is a phased personal exemption.",
    summary: "Connecticut taxes wages on a graduated scale — the rate rises as income rises, from 2% to a top rate of 6.99% in 2026.",
    withholdingNotes: [
      "Connecticut taxes taxable income in 7 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $15,000 personal exemption (single filer) first.",
      "There is no standard deduction — the $15,000 personal exemption phases out above $30,000 AGI, and high earners can end up paying the top rate on all income (benefit recapture).",
    ],
    localTaxNote: null,
  },
  {
    slug: "delaware-paycheck-calculator",
    state: "Delaware",
    abbreviation: "DE",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 3250,
    standardDeductionMfj: 6500,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: 110,
    creditMfj: 220,
    hohSupported: false,
    brackets: [{ upTo: 2000, ratePct: 0 }, { upTo: 5000, ratePct: 2.2 }, { upTo: 10000, ratePct: 3.9 }, { upTo: 20000, ratePct: 4.8 }, { upTo: 25000, ratePct: 5.2 }, { upTo: 60000, ratePct: 5.55 }, { upTo: null, ratePct: 6.6 }],
    bracketsMfj: [{ upTo: 2000, ratePct: 0 }, { upTo: 5000, ratePct: 2.2 }, { upTo: 10000, ratePct: 3.9 }, { upTo: 20000, ratePct: 4.8 }, { upTo: 25000, ratePct: 5.2 }, { upTo: 60000, ratePct: 5.55 }, { upTo: null, ratePct: 6.6 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source.",
    summary: "Delaware taxes wages on a graduated scale — the rate rises as income rises, from 0% to a top rate of 6.6% in 2026.",
    withholdingNotes: [
      "Delaware taxes taxable income in 7 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $3,250 single standard deduction first.",
      "No tax on the first $2,000 of income.",
    ],
    localTaxNote: "Wilmington levies a city wage tax — separate from state withholding.",
  },
  {
    slug: "district-of-columbia-paycheck-calculator",
    state: "District of Columbia",
    abbreviation: "DC",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 16100,
    standardDeductionMfj: 32200,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    hohSupported: false,
    brackets: [{ upTo: 10000, ratePct: 4 }, { upTo: 40000, ratePct: 6 }, { upTo: 60000, ratePct: 6.5 }, { upTo: 250000, ratePct: 8.5 }, { upTo: 500000, ratePct: 9.25 }, { upTo: 1000000, ratePct: 9.75 }, { upTo: null, ratePct: 10.75 }],
    bracketsMfj: [{ upTo: 10000, ratePct: 4 }, { upTo: 40000, ratePct: 6 }, { upTo: 60000, ratePct: 6.5 }, { upTo: 250000, ratePct: 8.5 }, { upTo: 500000, ratePct: 9.25 }, { upTo: 1000000, ratePct: 9.75 }, { upTo: null, ratePct: 10.75 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source.",
    summary: "District of Columbia taxes wages on a graduated scale — the rate rises as income rises, from 4% to a top rate of 10.75% in 2026.",
    withholdingNotes: [
      "District of Columbia taxes taxable income in 7 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $16,100 single standard deduction first.",
    ],
    localTaxNote: null,
  },
  {
    slug: "florida-paycheck-calculator",
    state: "Florida",
    abbreviation: "FL",
    structure: "none",
    hohSupported: true,
    flatRatePct: null,
    standardDeductionSingle: null,
    standardDeductionMfj: null,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    brackets: null,
    bracketsMfj: null,
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026: no tax on wages in 2026 (Tax Foundation 2026 tables).",
    summary: "Florida has no state income tax on wages — your paycheck has $0 withheld for state income tax.",
    withholdingNotes: [
      "Florida's constitution prohibits a personal income tax, so there is no state withholding line on your paycheck.",
      "Federal tax, Social Security, and Medicare still apply exactly as in every other state.",
    ],
    localTaxNote: null,
  },
  {
    slug: "georgia-paycheck-calculator",
    state: "Georgia",
    abbreviation: "GA",
    structure: "flat",
    flatRatePct: 4.99,
    standardDeductionSingle: 15000,
    standardDeductionMfj: 30000,
    standardDeductionHoh: 15000,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    hohSupported: true,
    brackets: null,
    bracketsMfj: null,
    verified: true,
    sourceUrl: "https://www.incometaxpro.com/tax-rates/georgia.htm",
    sourceNote: "CORRECTED 15 Nov 2026: the Tax Foundation's Feb 2026 table still showed 5.19% / $12,000, but HB 463 (signed May 11, 2026, retroactive to Jan 1, 2026) cut Georgia to 4.99% and raised the standard deduction to $15,000 / $30,000. Confirmed against the Georgia Department of Revenue's 2026 guidance.",
    summary: "Georgia taxes income at a single flat rate of 4.99% in 2026. House Bill 463 cut the rate from 5.19% and raised the standard deduction for the full 2026 year.",
    withholdingNotes: [
      "Georgia's 4.99% flat rate applies to every dollar of taxable income, after the $15,000 single standard deduction.",
      "House Bill 463 cut the rate from 5.19% to 4.99% and raised the standard deduction to $15,000 single / $30,000 joint for the full 2026 year. Employers withheld at 5.19% until the May 11, 2026 signing, so early-2026 pay stubs may show a blend.",
    ],
    localTaxNote: null,
  },
  {
    slug: "hawaii-paycheck-calculator",
    state: "Hawaii",
    abbreviation: "HI",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 8000,
    standardDeductionMfj: 16000,
    standardDeductionHoh: 12000,
    exemptionSingle: 1144,
    exemptionMfj: 2288,
    exemptionHoh: 1144,
    creditSingle: null,
    creditMfj: null,
    hohSupported: true,
    brackets: [{ upTo: 9600, ratePct: 1.4 }, { upTo: 14400, ratePct: 3.2 }, { upTo: 19200, ratePct: 5.5 }, { upTo: 24000, ratePct: 6.4 }, { upTo: 36000, ratePct: 6.8 }, { upTo: 48000, ratePct: 7.2 }, { upTo: 125000, ratePct: 7.6 }, { upTo: 175000, ratePct: 7.9 }, { upTo: 225000, ratePct: 8.25 }, { upTo: 275000, ratePct: 9 }, { upTo: 325000, ratePct: 10 }, { upTo: null, ratePct: 11 }],
    bracketsMfj: [{ upTo: 19200, ratePct: 1.4 }, { upTo: 28800, ratePct: 3.2 }, { upTo: 38400, ratePct: 5.5 }, { upTo: 48000, ratePct: 6.4 }, { upTo: 72000, ratePct: 6.8 }, { upTo: 96000, ratePct: 7.2 }, { upTo: 250000, ratePct: 7.6 }, { upTo: 350000, ratePct: 7.9 }, { upTo: 450000, ratePct: 8.25 }, { upTo: 550000, ratePct: 9 }, { upTo: 650000, ratePct: 10 }, { upTo: null, ratePct: 11 }],
    // HI Schedule III: HoH brackets are 1.5x the single schedule (Act 46, SLH 2024; HRS §235-51).
    bracketsHoh: [{ upTo: 14400, ratePct: 1.4 }, { upTo: 21600, ratePct: 3.2 }, { upTo: 28800, ratePct: 5.5 }, { upTo: 36000, ratePct: 6.4 }, { upTo: 54000, ratePct: 6.8 }, { upTo: 72000, ratePct: 7.2 }, { upTo: 187500, ratePct: 7.6 }, { upTo: 262500, ratePct: 7.9 }, { upTo: 337500, ratePct: 8.25 }, { upTo: 412500, ratePct: 9 }, { upTo: 487500, ratePct: 10 }, { upTo: null, ratePct: 11 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source. HI 2026 standard deduction per Act 46, SLH 2024 (DOTAX Announcement 2024-03).",
    summary: "Hawaii taxes wages on a graduated scale — the rate rises as income rises, from 1.4% to a top rate of 11% in 2026. Twelve brackets — the most of any state.",
    withholdingNotes: [
      "Hawaii taxes taxable income in 12 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $8,000 single standard deduction first. A further $1,144 personal exemption also applies.",
      "Hawaii has 12 brackets — the most of any state. The 2026 standard deduction is $8,000 single / $16,000 joint under Act 46, up from $4,400 / $8,800 in 2025.",
    ],
    localTaxNote: null,
  },
  {
    slug: "idaho-paycheck-calculator",
    state: "Idaho",
    abbreviation: "ID",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 16100,
    standardDeductionMfj: 32200,
    standardDeductionHoh: 24150,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    hohSupported: true,
    brackets: [{ upTo: 4811, ratePct: 0 }, { upTo: null, ratePct: 5.3 }],
    bracketsMfj: [{ upTo: 9622, ratePct: 0 }, { upTo: null, ratePct: 5.3 }],
    // ID HoH uses the joint zero-band amount (Idaho Form 40 instructions).
    bracketsHoh: [{ upTo: 9622, ratePct: 0 }, { upTo: null, ratePct: 5.3 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source.",
    summary: "Idaho taxes wages on a graduated scale — the rate rises as income rises, from 0% to a top rate of 5.3% in 2026.",
    withholdingNotes: [
      "Idaho taxes taxable income in 2 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $16,100 single standard deduction first.",
      "Idaho charges 5.3% only on income above $4,811 single / $9,622 joint.",
    ],
    localTaxNote: null,
  },
  {
    slug: "illinois-paycheck-calculator",
    state: "Illinois",
    abbreviation: "IL",
    structure: "flat",
    flatRatePct: 4.95,
    standardDeductionSingle: 2925,
    standardDeductionMfj: 5850,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    // IL HoH exemption is $2,925 (= single) — the single-schedule fallback applies.
    hohSupported: true,
    brackets: null,
    bracketsMfj: null,
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source.",
    summary: "Illinois taxes income at a single flat rate of 4.95% in 2026.",
    withholdingNotes: [
      "Illinois's 4.95% flat rate applies to taxable income after the $2,925 personal exemption (single filer).",
    ],
    localTaxNote: null,
  },
  {
    slug: "indiana-paycheck-calculator",
    state: "Indiana",
    abbreviation: "IN",
    structure: "flat",
    flatRatePct: 2.95,
    standardDeductionSingle: 1000,
    standardDeductionMfj: 2000,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    // IN HoH exemption is $1,000 (= single) — the single-schedule fallback applies.
    hohSupported: true,
    brackets: null,
    bracketsMfj: null,
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source. County rates per DOR Departmental Notice #1 (eff. Oct 1, 2026).",
    summary: "Indiana taxes income at a single flat rate of 2.95% in 2026. Cut from 3.00% on January 1, 2026.",
    withholdingNotes: [
      "Indiana's 2.95% flat rate applies to taxable income after the $1,000 personal exemption (single filer).",
      "The rate was cut to 2.95% on January 1, 2026, and is scheduled to fall to 2.90% on January 1, 2027.",
    ],
    localTaxNote: "Every Indiana county adds its own local income tax (0.5% to 3.00% of AGI; Marion County, Indianapolis, is 2.02%) on top of the state rate.",
  },
  {
    slug: "iowa-paycheck-calculator",
    state: "Iowa",
    abbreviation: "IA",
    structure: "flat",
    flatRatePct: 3.8,
    standardDeductionSingle: 16100,
    standardDeductionMfj: 32200,
    standardDeductionHoh: 24150,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: 40,
    creditMfj: 80,
    // IA-1040 Step 3: head of household enters 2 x $40.
    creditHoh: 80,
    hohSupported: true,
    brackets: null,
    bracketsMfj: null,
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source. $40 personal exemption credit per filer ($80 joint) per IA W-4 / IDR.",
    summary: "Iowa taxes income at a single flat rate of 3.8% in 2026.",
    withholdingNotes: [
      "Iowa's 3.8% flat rate applies to every dollar of taxable income, after the $16,100 single standard deduction, then a $40 personal exemption credit off the tax ($80 joint).",
    ],
    localTaxNote: null,
  },
  {
    slug: "kansas-paycheck-calculator",
    state: "Kansas",
    abbreviation: "KS",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 3605,
    standardDeductionMfj: 8240,
    standardDeductionHoh: 6180,
    exemptionSingle: 9160,
    exemptionMfj: 18320,
    exemptionHoh: 11480,
    creditSingle: null,
    creditMfj: null,
    // HoH uses the single bracket schedule (K.S.A. 79-32,110); the $11,480
    // HoH exemption is the $9,160 base + the $2,320 additional HoH
    // exemption (K.S.A. 79-32,121(b)(1), HB 2231).
    hohSupported: true,
    brackets: [{ upTo: 23000, ratePct: 5.2 }, { upTo: null, ratePct: 5.58 }],
    bracketsMfj: [{ upTo: 46000, ratePct: 5.2 }, { upTo: null, ratePct: 5.58 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source. Personal exemption $9,160 single / $18,320 joint per 2026 Form K-40ES.",
    summary: "Kansas taxes wages on a graduated scale — the rate rises as income rises, from 5.2% to a top rate of 5.58% in 2026.",
    withholdingNotes: [
      "Kansas taxes taxable income in 2 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $3,605 single standard deduction and the $9,160 single personal exemption first.",
      "Kansas has just two brackets: 5.2% to $23,000 single, then 5.58%.",
    ],
    localTaxNote: null,
  },
  {
    slug: "kentucky-paycheck-calculator",
    state: "Kentucky",
    abbreviation: "KY",
    structure: "flat",
    flatRatePct: 3.5,
    standardDeductionSingle: 3360,
    standardDeductionMfj: 3360,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    // KY HoH standard deduction is $3,360 (= single/MFJ) — flat rate, no brackets.
    hohSupported: true,
    brackets: null,
    bracketsMfj: null,
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source.",
    summary: "Kentucky taxes income at a single flat rate of 3.5% in 2026. Cut from 4% on January 1, 2026.",
    withholdingNotes: [
      "Kentucky's 3.5% flat rate applies to every dollar of taxable income, after the $3,360 single standard deduction.",
      "The rate was cut from 4% to 3.5% on January 1, 2026.",
    ],
    localTaxNote: "Some Kentucky cities and counties levy a local occupational tax on wages (for example, Louisville) — separate from state withholding.",
  },
  {
    slug: "louisiana-paycheck-calculator",
    state: "Louisiana",
    abbreviation: "LA",
    structure: "flat",
    flatRatePct: 3,
    standardDeductionSingle: 12875,
    standardDeductionMfj: 25750,
    standardDeductionHoh: 25750,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    hohSupported: true,
    brackets: null,
    bracketsMfj: null,
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source.",
    summary: "Louisiana taxes income at a single flat rate of 3% in 2026.",
    withholdingNotes: [
      "Louisiana's 3% flat rate applies to every dollar of taxable income, after the $12,875 single standard deduction.",
      "Louisiana moved to a flat 3% in the 2025 reform.",
    ],
    localTaxNote: null,
  },
  {
    slug: "maine-paycheck-calculator",
    state: "Maine",
    abbreviation: "ME",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 15700,
    standardDeductionMfj: 31400,
    standardDeductionHoh: 23550,
    exemptionSingle: 5300,
    exemptionMfj: 10600,
    exemptionHoh: 5300,
    creditSingle: null,
    creditMfj: null,
    hohSupported: true,
    brackets: [{ upTo: 27399, ratePct: 5.8 }, { upTo: 64849, ratePct: 6.75 }, { upTo: null, ratePct: 7.15 }],
    bracketsMfj: [{ upTo: 54849, ratePct: 5.8 }, { upTo: 129749, ratePct: 6.75 }, { upTo: null, ratePct: 7.15 }],
    bracketsHoh: [{ upTo: 41100, ratePct: 5.8 }, { upTo: 97300, ratePct: 6.75 }, { upTo: null, ratePct: 7.15 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source. 2026 standard deduction per Maine Revenue Services 2026 Withholding Tables & Instructions (revised Aug 2026).",
    summary: "Maine taxes wages on a graduated scale — the rate rises as income rises, from 5.8% to a top rate of 7.15% in 2026.",
    withholdingNotes: [
      "Maine taxes taxable income in 3 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $15,700 single standard deduction first. A further $5,300 personal exemption also applies.",
      "The standard deduction phases out above $100,000 single / $200,050 joint Maine income.",
    ],
    localTaxNote: null,
  },
  {
    slug: "maryland-paycheck-calculator",
    state: "Maryland",
    abbreviation: "MD",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 3350,
    standardDeductionMfj: 6700,
    exemptionSingle: 3200,
    exemptionMfj: 6400,
    creditSingle: null,
    creditMfj: null,
    hohSupported: false,
    exemptionPhaseout: {
      single: [
        { upTo: 100000, perExemption: 3200 },
        { upTo: 125000, perExemption: 1600 },
        { upTo: 150000, perExemption: 800 },
        { upTo: null, perExemption: 0 },
      ],
      joint: [
        { upTo: 150000, perExemption: 3200 },
        { upTo: 175000, perExemption: 1600 },
        { upTo: 200000, perExemption: 800 },
        { upTo: null, perExemption: 0 },
      ],
    },
    brackets: [{ upTo: 1000, ratePct: 2 }, { upTo: 2000, ratePct: 3 }, { upTo: 3000, ratePct: 4 }, { upTo: 100000, ratePct: 4.75 }, { upTo: 125000, ratePct: 5 }, { upTo: 150000, ratePct: 5.25 }, { upTo: 250000, ratePct: 5.5 }, { upTo: 500000, ratePct: 5.75 }, { upTo: 1000000, ratePct: 6.25 }, { upTo: null, ratePct: 6.5 }],
    bracketsMfj: [{ upTo: 1000, ratePct: 2 }, { upTo: 2000, ratePct: 3 }, { upTo: 3000, ratePct: 4 }, { upTo: 150000, ratePct: 4.75 }, { upTo: 175000, ratePct: 5 }, { upTo: 225000, ratePct: 5.25 }, { upTo: 300000, ratePct: 5.5 }, { upTo: 600000, ratePct: 5.75 }, { upTo: 1200000, ratePct: 6.25 }, { upTo: null, ratePct: 6.5 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source. Personal-exemption phaseout per the 2026 Form PV Worksheet, Line 6 chart: single/MFS $3,200 to $100,000, then $1,600 / $800 / $0 at $125,000 / $150,000; joint/HoH keep the full $3,200 until $150,000, then $1,600 / $800 / $0 at $175,000 / $200,000.",
    summary: "Maryland taxes wages on a graduated scale — the rate rises as income rises, from 2% to a top rate of 6.5% in 2026.",
    withholdingNotes: [
      "Maryland taxes taxable income in 10 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $3,350 single standard deduction first. A further $3,200 personal exemption also applies.",
      "Two new top brackets (6.25% / 6.50%) were added retroactive to January 1, 2025. A 2% surtax on capital gains over $350,000 AGI does not affect wages.",
      "The $3,200 personal exemption phases out as income rises — single filers lose it entirely above $150,000; joint filers keep the full amount until $150,000.",
    ],
    localTaxNote: "Maryland counties levy their own local income tax (averaging roughly 2.4% of AGI) on top of the state rate — the combined rate is what actually comes out of your paycheck.",
  },
  {
    slug: "massachusetts-paycheck-calculator",
    state: "Massachusetts",
    abbreviation: "MA",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 4400,
    standardDeductionMfj: 8800,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    hohSupported: false,
    brackets: [{ upTo: 1083150, ratePct: 5 }, { upTo: null, ratePct: 9 }],
    bracketsMfj: [{ upTo: 1083150, ratePct: 5 }, { upTo: null, ratePct: 9 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source.",
    summary: "Massachusetts taxes wages on a graduated scale — the rate rises as income rises, from 5% to a top rate of 9% in 2026.",
    withholdingNotes: [
      "Massachusetts taxes taxable income in 2 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $4,400 personal exemption (single filer) first.",
      "Massachusetts charges 5% plus a 4% surtax on income over $1,083,150 (shown as the 9% top band). The 0.46% Paid Family and Medical Leave payroll tax is separate and not modeled.",
    ],
    localTaxNote: null,
  },
  {
    slug: "michigan-paycheck-calculator",
    state: "Michigan",
    abbreviation: "MI",
    structure: "flat",
    flatRatePct: 4.25,
    standardDeductionSingle: 5900,
    standardDeductionMfj: 11800,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    // MI HoH exemption is $5,900 (= single) — the single-schedule fallback applies.
    hohSupported: true,
    brackets: null,
    bracketsMfj: null,
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source.",
    summary: "Michigan taxes income at a single flat rate of 4.25% in 2026.",
    withholdingNotes: [
      "Michigan's 4.25% flat rate applies to taxable income after the $5,900 personal exemption (single filer).",
    ],
    localTaxNote: "Some Michigan cities (including Detroit) levy a local city income tax on residents and workers — separate from state withholding.",
  },
  {
    slug: "minnesota-paycheck-calculator",
    state: "Minnesota",
    abbreviation: "MN",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 15300,
    standardDeductionMfj: 30600,
    standardDeductionHoh: 23000,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    hohSupported: true,
    brackets: [{ upTo: 33310, ratePct: 5.35 }, { upTo: 109430, ratePct: 6.8 }, { upTo: 203150, ratePct: 7.85 }, { upTo: null, ratePct: 9.85 }],
    bracketsMfj: [{ upTo: 48700, ratePct: 5.35 }, { upTo: 193480, ratePct: 6.8 }, { upTo: 337930, ratePct: 7.85 }, { upTo: null, ratePct: 9.85 }],
    bracketsHoh: [{ upTo: 41010, ratePct: 5.35 }, { upTo: 164800, ratePct: 6.8 }, { upTo: 270060, ratePct: 7.85 }, { upTo: null, ratePct: 9.85 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source.",
    summary: "Minnesota taxes wages on a graduated scale — the rate rises as income rises, from 5.35% to a top rate of 9.85% in 2026.",
    withholdingNotes: [
      "Minnesota taxes taxable income in 4 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $15,300 single standard deduction first.",
      "The standard deduction phases down at high incomes (up to an 80% reduction).",
    ],
    localTaxNote: null,
  },
  {
    slug: "mississippi-paycheck-calculator",
    state: "Mississippi",
    abbreviation: "MS",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 2300,
    standardDeductionMfj: 4600,
    exemptionSingle: 6000,
    exemptionMfj: 12000,
    creditSingle: null,
    creditMfj: null,
    hohSupported: false,
    brackets: [{ upTo: 10000, ratePct: 0 }, { upTo: null, ratePct: 4 }],
    bracketsMfj: [{ upTo: 10000, ratePct: 0 }, { upTo: null, ratePct: 4 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source.",
    summary: "Mississippi taxes wages on a graduated scale — the rate rises as income rises, from 0% to a top rate of 4% in 2026.",
    withholdingNotes: [
      "Mississippi taxes taxable income in 2 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $2,300 single standard deduction first. A further $6,000 personal exemption also applies.",
      "Mississippi charges 4% on income above $10,000. The rate is scheduled to phase down further: 3.75% in 2027, 3.5% in 2028.",
    ],
    localTaxNote: null,
  },
  {
    slug: "missouri-paycheck-calculator",
    state: "Missouri",
    abbreviation: "MO",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 16100,
    standardDeductionMfj: 32200,
    standardDeductionHoh: 24150,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    // HoH uses the single bracket schedule (same for all statuses in MO);
    // the federal-tax deduction cap for HoH stays $5,000 (capSingle).
    hohSupported: true,
    federalTaxDeduction: {
      kind: "tiered",
      tiers: [
        { upTo: 25000, pct: 35 },
        { upTo: 50000, pct: 25 },
        { upTo: 100000, pct: 15 },
        { upTo: 125000, pct: 5 },
        { upTo: null, pct: 0 },
      ],
      capSingle: 5000,
      capMfj: 10000,
    },
    brackets: [{ upTo: 1348, ratePct: 0 }, { upTo: 2696, ratePct: 2 }, { upTo: 4044, ratePct: 2.5 }, { upTo: 5392, ratePct: 3 }, { upTo: 6740, ratePct: 3.5 }, { upTo: 8088, ratePct: 4 }, { upTo: 9436, ratePct: 4.5 }, { upTo: null, ratePct: 4.7 }],
    bracketsMfj: [{ upTo: 1348, ratePct: 0 }, { upTo: 2696, ratePct: 2 }, { upTo: 4044, ratePct: 2.5 }, { upTo: 5392, ratePct: 3 }, { upTo: 6740, ratePct: 3.5 }, { upTo: 8088, ratePct: 4 }, { upTo: 9436, ratePct: 4.5 }, { upTo: null, ratePct: 4.7 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source. Federal-tax deduction per RSMo §143.171: 35% of federal tax at MO AGI up to $25,000, 25% to $50,000, 15% to $100,000, 5% to $125,000, 0% above — capped at $5,000 single / $10,000 joint.",
    summary: "Missouri taxes wages on a graduated scale — the rate rises as income rises, from 0% to a top rate of 4.7% in 2026.",
    withholdingNotes: [
      "Missouri taxes taxable income in 8 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $16,100 single standard deduction first.",
      "Missouri lets you deduct part of your federal income tax — 35% at low incomes, phasing to 0% above $125,000. The calculator uses its own estimated federal liability for that line (an estimate, not your actual federal tax).",
    ],
    localTaxNote: "St. Louis and Kansas City levy a 1% earnings tax on wages earned in the city — separate from state withholding.",
  },
  {
    slug: "montana-paycheck-calculator",
    state: "Montana",
    abbreviation: "MT",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 16100,
    standardDeductionMfj: 32200,
    standardDeductionHoh: 24150,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    hohSupported: true,
    brackets: [{ upTo: 47500, ratePct: 4.7 }, { upTo: null, ratePct: 5.65 }],
    bracketsMfj: [{ upTo: 95000, ratePct: 4.7 }, { upTo: null, ratePct: 5.65 }],
    bracketsHoh: [{ upTo: 71250, ratePct: 4.7 }, { upTo: null, ratePct: 5.65 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source.",
    summary: "Montana taxes wages on a graduated scale — the rate rises as income rises, from 4.7% to a top rate of 5.65% in 2026.",
    withholdingNotes: [
      "Montana taxes taxable income in 2 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $16,100 single standard deduction first.",
      "The top rate was cut from 5.9% to 5.65% in 2026, with a further cut to 5.4% scheduled for 2027.",
    ],
    localTaxNote: null,
  },
  {
    slug: "nebraska-paycheck-calculator",
    state: "Nebraska",
    abbreviation: "NE",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 8850,
    standardDeductionMfj: 17700,
    standardDeductionHoh: 12950,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: 176,
    creditMfj: 352,
    creditHoh: 176,
    hohSupported: true,
    brackets: [{ upTo: 4130, ratePct: 2.46 }, { upTo: 24760, ratePct: 3.51 }, { upTo: null, ratePct: 4.55 }],
    bracketsMfj: [{ upTo: 8250, ratePct: 2.46 }, { upTo: 49530, ratePct: 3.51 }, { upTo: null, ratePct: 4.55 }],
    bracketsHoh: [{ upTo: 7700, ratePct: 2.46 }, { upTo: 39620, ratePct: 3.51 }, { upTo: null, ratePct: 4.55 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source.",
    summary: "Nebraska taxes wages on a graduated scale — the rate rises as income rises, from 2.46% to a top rate of 4.55% in 2026.",
    withholdingNotes: [
      "Nebraska taxes taxable income in 3 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $8,850 single standard deduction first.",
      "The top rate was cut from 5.2% to 4.55% on January 1, 2026, on a phasedown to 3.99% by 2027.",
    ],
    localTaxNote: null,
  },
  {
    slug: "nevada-paycheck-calculator",
    state: "Nevada",
    abbreviation: "NV",
    structure: "none",
    hohSupported: true,
    flatRatePct: null,
    standardDeductionSingle: null,
    standardDeductionMfj: null,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    brackets: null,
    bracketsMfj: null,
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026: no tax on wages in 2026 (Tax Foundation 2026 tables).",
    summary: "Nevada has no state income tax on wages — your paycheck has $0 withheld for state income tax.",
    withholdingNotes: [
      "Nevada levies no personal income tax, so there is no state withholding line on your paycheck.",
      "Federal tax, Social Security, and Medicare still apply exactly as in every other state.",
    ],
    localTaxNote: null,
  },
  {
    slug: "new-hampshire-paycheck-calculator",
    state: "New Hampshire",
    abbreviation: "NH",
    structure: "none",
    hohSupported: true,
    flatRatePct: null,
    standardDeductionSingle: null,
    standardDeductionMfj: null,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    brackets: null,
    bracketsMfj: null,
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026: no tax on wages in 2026 (Tax Foundation 2026 tables).",
    summary: "New Hampshire has no state income tax on wages — your paycheck has $0 withheld for state income tax.",
    withholdingNotes: [
      "New Hampshire taxes no wage income. Its former tax on interest and dividends was repealed, so nothing is withheld from your paycheck for the state.",
      "Federal tax, Social Security, and Medicare still apply exactly as in every other state.",
    ],
    localTaxNote: null,
  },
  {
    slug: "new-jersey-paycheck-calculator",
    state: "New Jersey",
    abbreviation: "NJ",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 1000,
    standardDeductionMfj: 2000,
    standardDeductionHoh: 1000,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    hohSupported: true,
    brackets: [{ upTo: 20000, ratePct: 1.4 }, { upTo: 35000, ratePct: 1.75 }, { upTo: 40000, ratePct: 3.5 }, { upTo: 75000, ratePct: 5.53 }, { upTo: 500000, ratePct: 6.37 }, { upTo: 1000000, ratePct: 8.97 }, { upTo: null, ratePct: 10.75 }],
    bracketsMfj: [{ upTo: 20000, ratePct: 1.4 }, { upTo: 50000, ratePct: 1.75 }, { upTo: 70000, ratePct: 2.45 }, { upTo: 80000, ratePct: 3.5 }, { upTo: 150000, ratePct: 5.53 }, { upTo: 500000, ratePct: 6.37 }, { upTo: 1000000, ratePct: 8.97 }, { upTo: null, ratePct: 10.75 }],
    // NJ Table B: head of household uses the married-filing-jointly table (NJ-1040-ES).
    bracketsHoh: [{ upTo: 20000, ratePct: 1.4 }, { upTo: 50000, ratePct: 1.75 }, { upTo: 70000, ratePct: 2.45 }, { upTo: 80000, ratePct: 3.5 }, { upTo: 150000, ratePct: 5.53 }, { upTo: 500000, ratePct: 6.37 }, { upTo: 1000000, ratePct: 8.97 }, { upTo: null, ratePct: 10.75 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source.",
    summary: "New Jersey taxes wages on a graduated scale — the rate rises as income rises, from 1.4% to a top rate of 10.75% in 2026. The highest top rate on the East Coast.",
    withholdingNotes: [
      "New Jersey taxes taxable income in 7 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $1,000 personal exemption (single filer) first.",
      "New Jersey is the only state where joint brackets differ structurally from single brackets in the middle bands.",
      "New Jersey taxes Section 125 health premiums, FSAs and HSAs — they do not reduce NJ taxable income. 401(k) contributions do follow the federal treatment and are excluded.",
    ],
    localTaxNote: null,
  },
  {
    slug: "new-mexico-paycheck-calculator",
    state: "New Mexico",
    abbreviation: "NM",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 16100,
    standardDeductionMfj: 32200,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    hohSupported: false,
    brackets: [{ upTo: 5500, ratePct: 1.5 }, { upTo: 16500, ratePct: 3.2 }, { upTo: 33500, ratePct: 4.3 }, { upTo: 66500, ratePct: 4.7 }, { upTo: 210000, ratePct: 4.9 }, { upTo: null, ratePct: 5.9 }],
    bracketsMfj: [{ upTo: 8000, ratePct: 1.5 }, { upTo: 25000, ratePct: 3.2 }, { upTo: 50000, ratePct: 4.3 }, { upTo: 100000, ratePct: 4.7 }, { upTo: 315000, ratePct: 4.9 }, { upTo: null, ratePct: 5.9 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source. NM single standard deduction $16,100 is CORRECT — NM conforms to the federal standard deduction; the $8,050 figure in the FYI-104 withholding tables is the zero band, not the standard deduction. HoH standard deduction $24,150 is therefore known, but the HoH bracket schedule is unverified — HoH not modeled.",
    summary: "New Mexico taxes wages on a graduated scale — the rate rises as income rises, from 1.5% to a top rate of 5.9% in 2026.",
    withholdingNotes: [
      "New Mexico taxes taxable income in 6 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $16,100 single standard deduction first.",
      "New Mexico gives a $4,000 deduction for all but one dependent.",
    ],
    localTaxNote: null,
  },
  {
    slug: "new-york-paycheck-calculator",
    state: "New York",
    abbreviation: "NY",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 8000,
    standardDeductionMfj: 16050,
    standardDeductionHoh: 11200,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    hohSupported: true,
    brackets: [{ upTo: 8500, ratePct: 3.9 }, { upTo: 11700, ratePct: 4.4 }, { upTo: 13900, ratePct: 5.15 }, { upTo: 80650, ratePct: 5.4 }, { upTo: 215400, ratePct: 5.9 }, { upTo: 1077550, ratePct: 6.85 }, { upTo: 5000000, ratePct: 9.65 }, { upTo: 25000000, ratePct: 10.3 }, { upTo: null, ratePct: 10.9 }],
    bracketsMfj: [{ upTo: 17150, ratePct: 3.9 }, { upTo: 23600, ratePct: 4.4 }, { upTo: 27900, ratePct: 5.15 }, { upTo: 161550, ratePct: 5.4 }, { upTo: 323200, ratePct: 5.9 }, { upTo: 2155350, ratePct: 6.85 }, { upTo: 5000000, ratePct: 9.65 }, { upTo: 25000000, ratePct: 10.3 }, { upTo: null, ratePct: 10.9 }],
    bracketsHoh: [{ upTo: 12800, ratePct: 3.9 }, { upTo: 17650, ratePct: 4.4 }, { upTo: 20900, ratePct: 5.15 }, { upTo: 107650, ratePct: 5.4 }, { upTo: 269300, ratePct: 5.9 }, { upTo: 1616450, ratePct: 6.85 }, { upTo: 5000000, ratePct: 9.65 }, { upTo: 25000000, ratePct: 10.3 }, { upTo: null, ratePct: 10.9 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source.",
    summary: "New York taxes wages on a graduated scale — the rate rises as income rises, from 3.9% to a top rate of 10.9% in 2026. New York City residents pay a separate city income tax on top.",
    withholdingNotes: [
      "New York taxes taxable income in 9 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $8,000 single standard deduction first.",
      "Benefit recapture: high earners pay the top rate on all income.",
      "New York City residents add city tax (3.078%–3.876%) on the same taxable income, minus the $63/$125 school tax credit — pick \"New York City\" in the calculator. Yonkers residents add a 16.75% surcharge on their state tax instead. The NYC rate-reduction credit is not modeled.",
    ],
    localTaxNote: "New York City levies its own income tax on residents (3.078%–3.876%), and Yonkers adds a 16.75% surcharge on state tax — pick your local layer in the calculator above. Commuters who live outside the city pay neither.",
  },
  {
    slug: "north-carolina-paycheck-calculator",
    state: "North Carolina",
    abbreviation: "NC",
    structure: "flat",
    flatRatePct: 3.99,
    standardDeductionSingle: 12750,
    standardDeductionMfj: 25500,
    standardDeductionHoh: 19125,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    hohSupported: true,
    brackets: null,
    bracketsMfj: null,
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source.",
    summary: "North Carolina taxes income at a single flat rate of 3.99% in 2026. The final step of the phasedown — cut from 4.25% on January 1, 2026.",
    withholdingNotes: [
      "North Carolina's 3.99% flat rate applies to every dollar of taxable income, after the $12,750 single standard deduction.",
      "The final step of the phasedown: the rate was cut from 4.25% to 3.99% on January 1, 2026.",
    ],
    localTaxNote: null,
  },
  {
    slug: "north-dakota-paycheck-calculator",
    state: "North Dakota",
    abbreviation: "ND",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 16100,
    standardDeductionMfj: 32200,
    standardDeductionHoh: 24150,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    hohSupported: true,
    brackets: [{ upTo: 49575, ratePct: 0 }, { upTo: 250400, ratePct: 1.95 }, { upTo: null, ratePct: 2.5 }],
    bracketsMfj: [{ upTo: 82800, ratePct: 0 }, { upTo: 304850, ratePct: 1.95 }, { upTo: null, ratePct: 2.5 }],
    bracketsHoh: [{ upTo: 66400, ratePct: 0 }, { upTo: 277600, ratePct: 1.95 }, { upTo: null, ratePct: 2.5 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source. 2026 thresholds per 2026 Form ND-1ES (Office of State Tax Commissioner).",
    summary: "North Dakota taxes wages on a graduated scale — the rate rises as income rises, from 0% to a top rate of 2.5% in 2026. The lowest top rate of any state that taxes income.",
    withholdingNotes: [
      "North Dakota taxes taxable income in 3 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $16,100 single standard deduction first.",
      "North Dakota has the lowest top rate of any state that taxes income — and no tax on the first $49,575 single / $82,800 joint of taxable income.",
    ],
    localTaxNote: null,
  },
  {
    slug: "ohio-paycheck-calculator",
    state: "Ohio",
    abbreviation: "OH",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 2400,
    standardDeductionMfj: 4800,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    hohSupported: false,
    brackets: [{ upTo: 26050, ratePct: 0 }, { upTo: null, ratePct: 2.75, base: 332 }],
    bracketsMfj: [{ upTo: 26050, ratePct: 0 }, { upTo: null, ratePct: 2.75, base: 332 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source. $332 step per ORC 5747.02(A)(3)(c): tax is $332 plus 2.75% of the amount over $26,050.",
    summary: "Ohio taxes wages on a graduated scale — the rate rises as income rises, from 0% to a top rate of 2.75% in 2026.",
    withholdingNotes: [
      "Ohio taxes taxable income in 2 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $2,400 personal exemption (single filer) first.",
      "Ohio moved to a flat 2.75% on nonbusiness income over $26,050 on January 1, 2026. The $2,400 exemption phases down at higher incomes and is $0 above $500,000 AGI.",
    ],
    localTaxNote: "Many Ohio municipalities levy a local income tax (commonly around 1–2.5%) on top of the state rate — check your city for the full picture.",
  },
  {
    slug: "oklahoma-paycheck-calculator",
    state: "Oklahoma",
    abbreviation: "OK",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 6350,
    standardDeductionMfj: 12700,
    standardDeductionHoh: 9350,
    exemptionSingle: 1000,
    exemptionMfj: 2000,
    exemptionHoh: 1000,
    creditSingle: null,
    creditMfj: null,
    hohSupported: true,
    brackets: [{ upTo: 3750, ratePct: 0 }, { upTo: 4900, ratePct: 2.5 }, { upTo: 7200, ratePct: 3.5 }, { upTo: null, ratePct: 4.5 }],
    bracketsMfj: [{ upTo: 7500, ratePct: 0 }, { upTo: 9800, ratePct: 2.5 }, { upTo: 14400, ratePct: 3.5 }, { upTo: null, ratePct: 4.5 }],
    // OK HoH uses the doubled (joint) schedule (HB 2764, 68 O.S. §2355).
    bracketsHoh: [{ upTo: 7500, ratePct: 0 }, { upTo: 9800, ratePct: 2.5 }, { upTo: 14400, ratePct: 3.5 }, { upTo: null, ratePct: 4.5 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source.",
    summary: "Oklahoma taxes wages on a graduated scale — the rate rises as income rises, from 0% to a top rate of 4.5% in 2026.",
    withholdingNotes: [
      "Oklahoma taxes taxable income in 4 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $6,350 single standard deduction first. A further $1,000 personal exemption also applies.",
      "Six brackets collapsed to three, and the top rate was cut from 4.75% to 4.5% effective January 1, 2026. Oklahoma brackets are not indexed for inflation.",
    ],
    localTaxNote: null,
  },
  {
    slug: "oregon-paycheck-calculator",
    state: "Oregon",
    abbreviation: "OR",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 2910,
    standardDeductionMfj: 5820,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: 263,
    creditMfj: 526,
    hohSupported: false,
    federalTaxDeduction: {
      kind: "cappedPhased",
      capSingle: 8750,
      capMfj: 8750,
      capMfs: 4375,
      phaseoutStartSingle: 125000,
      phaseoutStartJoint: 250000,
      stepSizeSingle: 5000,
      stepSizeJoint: 10000,
      stepAmount: 1750,
    },
    creditAgiLimit: { single: 100000, joint: 200000 },
    brackets: [{ upTo: 4550, ratePct: 4.75 }, { upTo: 11400, ratePct: 6.75 }, { upTo: 125000, ratePct: 8.75 }, { upTo: null, ratePct: 9.9 }],
    bracketsMfj: [{ upTo: 9100, ratePct: 4.75 }, { upTo: 22800, ratePct: 6.75 }, { upTo: 250000, ratePct: 8.75 }, { upTo: null, ratePct: 9.9 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source. 2026 exemption credit $263 per allowance per OR DOR Withholding Tax Formulas 150-206-436 (Rev. 12-31-25) — $263 is the final indexed figure (ORS 316.085 CPI computation); $260 was the Oct 2025 OR-ESTIMATE preliminary estimate and $256 the 2025 credit. The credit is $0 when federal AGI exceeds $100,000 single/MFS or $200,000 MFJ/HoH (ORS 316.085(5)). Federal-tax subtraction per 2026 Publication OR-ESTIMATE line 9 / OR-17: federal liability deductible up to $8,750 ($4,375 MFS), phasing out $1,750 per $5,000 band above $125,000 federal AGI single/MFS ($0 at $145,000) and per $10,000 band above $250,000 MFJ/HoH ($0 at $290,000). Head of household: SD ≈ $4,685 and the HoH bracket schedule are unverified — HoH not modeled.",
    summary: "Oregon taxes wages on a graduated scale — the rate rises as income rises, from 4.75% to a top rate of 9.9% in 2026.",
    withholdingNotes: [
      "Oregon taxes taxable income in 4 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $2,910 single standard deduction first.",
      "Oregon lets you deduct federal income tax paid — capped at $8,750, phasing out above $125,000 federal AGI ($250,000 joint).",
    ],
    localTaxNote: "Portland and Multnomah County levy local taxes on wages — separate from state withholding.",
  },
  {
    slug: "pennsylvania-paycheck-calculator",
    state: "Pennsylvania",
    abbreviation: "PA",
    structure: "flat",
    flatRatePct: 3.07,
    standardDeductionSingle: 0,
    standardDeductionMfj: 0,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    // PA has no standard deduction or exemption — HoH is trivially the single (flat) treatment.
    hohSupported: true,
    brackets: null,
    bracketsMfj: null,
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source.",
    summary: "Pennsylvania taxes income at a single flat rate of 3.07% in 2026.",
    withholdingNotes: [
      "Pennsylvania's 3.07% flat rate applies to taxable income. Pennsylvania has no standard deduction or personal exemption for state purposes.",
      "Pennsylvania taxes 401(k) contributions — unlike most states, they do not reduce PA taxable income. Dependent-care FSA contributions are taxed too; health-related Section 125 items are excluded.",
    ],
    localTaxNote: "Most Pennsylvania municipalities and school districts add a local earned income tax (commonly 1%) on top of the state rate.",
  },
  {
    slug: "rhode-island-paycheck-calculator",
    state: "Rhode Island",
    abbreviation: "RI",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 11200,
    standardDeductionMfj: 22400,
    exemptionSingle: 5250,
    exemptionMfj: 10500,
    creditSingle: null,
    creditMfj: null,
    hohSupported: false,
    brackets: [{ upTo: 82050, ratePct: 3.75 }, { upTo: 186450, ratePct: 4.75 }, { upTo: null, ratePct: 5.99 }],
    bracketsMfj: [{ upTo: 82050, ratePct: 3.75 }, { upTo: 186450, ratePct: 4.75 }, { upTo: null, ratePct: 5.99 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source.",
    summary: "Rhode Island taxes wages on a graduated scale — the rate rises as income rises, from 3.75% to a top rate of 5.99% in 2026.",
    withholdingNotes: [
      "Rhode Island taxes taxable income in 3 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $11,200 single standard deduction first. A further $5,250 personal exemption also applies.",
      "The standard deduction and exemptions phase out between $261,000–$290,800 modified federal AGI.",
    ],
    localTaxNote: null,
  },
  {
    slug: "south-carolina-paycheck-calculator",
    state: "South Carolina",
    abbreviation: "SC",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 15000,
    standardDeductionMfj: 30000,
    standardDeductionHoh: 22500,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    // SC uses ONE schedule for all filing statuses (H. 4216 / Act 110 of
    // 2026); the sciadPhaseout HoH leg above carries the $22,500 SCIAD.
    hohSupported: true,
    sciadPhaseout: {
      single: { base: 15000, threshold: 40000, span: 55000 },
      marriedFilingJointly: { base: 30000, threshold: 80000, span: 110000 },
      headOfHousehold: { base: 22500, threshold: 60000, span: 82500 },
      marriedFilingSeparately: { base: 15000, threshold: 40000, span: 55000 },
    },
    brackets: [{ upTo: 30000, ratePct: 1.99 }, { upTo: null, ratePct: 5.21 }],
    bracketsMfj: [{ upTo: 30000, ratePct: 1.99 }, { upTo: null, ratePct: 5.21 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source. SC 2026 law per H. 4216 (signed Mar 30, 2026): 1.99% under $30,000, 5.21% at/above minus $966; SCIAD $15,000 single / $30,000 joint replaces the federal standard deduction. SCIAD phaseout per SCDOR Information Letter #26-20 (Aug 31, 2026): single $15,000 phases out $40,000–$95,000; joint $30,000 phases out $80,000–$190,000; HoH $22,500 phases out $60,000–$142,500; reductions rounded down to the next $10.",
    summary: "South Carolina taxes wages on a graduated scale — the rate rises as income rises, from 1.99% to a top rate of 5.21% in 2026.",
    withholdingNotes: [
      "South Carolina taxes taxable income in 2 rates under H. 4216 — 1.99% under $30,000, 5.21% minus $966 at and above. The calculator subtracts the $15,000 SCIAD (single filer) first.",
      "H. 4216 supersedes the old 0%/3%/6.2% schedule for the 2026 return. The SCIAD phases out as income rises — single filers lose it entirely at $95,000 — with reductions rounded down to the next $10.",
    ],
    localTaxNote: null,
  },
  {
    slug: "south-dakota-paycheck-calculator",
    state: "South Dakota",
    abbreviation: "SD",
    structure: "none",
    hohSupported: true,
    flatRatePct: null,
    standardDeductionSingle: null,
    standardDeductionMfj: null,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    brackets: null,
    bracketsMfj: null,
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026: no tax on wages in 2026 (Tax Foundation 2026 tables).",
    summary: "South Dakota has no state income tax on wages — your paycheck has $0 withheld for state income tax.",
    withholdingNotes: [
      "South Dakota levies no personal income tax, so there is no state withholding line on your paycheck.",
      "Federal tax, Social Security, and Medicare still apply exactly as in every other state.",
    ],
    localTaxNote: null,
  },
  {
    slug: "tennessee-paycheck-calculator",
    state: "Tennessee",
    abbreviation: "TN",
    structure: "none",
    hohSupported: true,
    flatRatePct: null,
    standardDeductionSingle: null,
    standardDeductionMfj: null,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    brackets: null,
    bracketsMfj: null,
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026: no tax on wages in 2026 (Tax Foundation 2026 tables).",
    summary: "Tennessee has no state income tax on wages — your paycheck has $0 withheld for state income tax.",
    withholdingNotes: [
      "Tennessee taxes no wage income. The Hall tax on interest and dividends was fully repealed in 2021.",
      "Federal tax, Social Security, and Medicare still apply exactly as in every other state.",
    ],
    localTaxNote: null,
  },
  {
    slug: "texas-paycheck-calculator",
    state: "Texas",
    abbreviation: "TX",
    structure: "none",
    hohSupported: true,
    flatRatePct: null,
    standardDeductionSingle: null,
    standardDeductionMfj: null,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    brackets: null,
    bracketsMfj: null,
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026: no tax on wages in 2026 (Tax Foundation 2026 tables).",
    summary: "Texas has no state income tax on wages — your paycheck has $0 withheld for state income tax.",
    withholdingNotes: [
      "Texas levies no personal income tax, so there is no state withholding line on your paycheck — a big reason Texas take-home pay looks higher than in most states.",
      "Federal tax, Social Security, and Medicare still apply exactly as in every other state.",
      "Texas funds state services mainly through sales and property taxes instead of an income tax.",
    ],
    localTaxNote: null,
  },
  {
    slug: "utah-paycheck-calculator",
    state: "Utah",
    abbreviation: "UT",
    structure: "flat",
    flatRatePct: 4.45,
    standardDeductionSingle: 0,
    standardDeductionMfj: 0,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: 966,
    creditMfj: 1932,
    creditHoh: 1449,
    hohSupported: true,
    creditPhaseout: {
      ratePerDollar: 0.013,
      bases: {
        single: 18696,
        marriedFilingJointly: 37392,
        headOfHousehold: 28045,
        marriedFilingSeparately: 18696,
      },
    },
    brackets: null,
    bracketsMfj: null,
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source. 2026 rate per S.B. 60 (Laws of Utah 2026, Ch. 250, signed Mar 23, 2026, retroactive Jan 1, 2026). Taxpayer credit 6% of the federal standard deduction ($966 single / $1,932 joint / $1,449 HoH) per Utah Code §59-10-1018, reduced $0.013 per $1 of Utah taxable income over the indexed 2026 base (single/MFS $18,696, HoH $28,045, MFJ $37,392 — UT Legislature Revenue & Taxation Interim Committee, 2026 Tax Credit Review, Sep 16, 2026); credit $0 at ≈ $93,004 taxable income single.",
    summary: "Utah taxes income at a single flat rate of 4.45% in 2026. Utah pairs its flat rate with a 6% credit instead of a standard deduction.",
    withholdingNotes: [
      "Utah's 4.45% flat rate applies to taxable income. Utah has no standard deduction — instead it gives a nonrefundable credit of 6% of the federal standard deduction ($966 single / $1,932 joint).",
      "Utah has no standard deduction as a dollar amount. Instead it gives a nonrefundable credit of 6% of the federal standard deduction — $966 single / $1,932 joint for 2026 — applied after the 4.45% rate. The credit phases out at higher incomes.",
    ],
    localTaxNote: null,
  },
  {
    slug: "vermont-paycheck-calculator",
    state: "Vermont",
    abbreviation: "VT",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 7650,
    standardDeductionMfj: 15300,
    exemptionSingle: 5300,
    exemptionMfj: 10600,
    creditSingle: null,
    creditMfj: null,
    hohSupported: false,
    brackets: [{ upTo: 49400, ratePct: 3.35 }, { upTo: 119700, ratePct: 6.6 }, { upTo: 249700, ratePct: 7.6 }, { upTo: null, ratePct: 8.75 }],
    bracketsMfj: [{ upTo: 82500, ratePct: 3.35 }, { upTo: 199450, ratePct: 6.6 }, { upTo: 304000, ratePct: 7.6 }, { upTo: null, ratePct: 8.75 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source.",
    summary: "Vermont taxes wages on a graduated scale — the rate rises as income rises, from 3.35% to a top rate of 8.75% in 2026.",
    withholdingNotes: [
      "Vermont taxes taxable income in 4 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $7,650 single standard deduction first. A further $5,300 personal exemption also applies.",
      "If federal AGI exceeds $150,000, you pay the greater of state income tax or 3% of federal AGI.",
    ],
    localTaxNote: null,
  },
  {
    slug: "virginia-paycheck-calculator",
    state: "Virginia",
    abbreviation: "VA",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 8750,
    standardDeductionMfj: 17500,
    exemptionSingle: 930,
    exemptionMfj: 1860,
    creditSingle: null,
    creditMfj: null,
    hohSupported: false,
    brackets: [{ upTo: 3000, ratePct: 2 }, { upTo: 5000, ratePct: 3 }, { upTo: 17000, ratePct: 5 }, { upTo: null, ratePct: 5.75 }],
    bracketsMfj: [{ upTo: 3000, ratePct: 2 }, { upTo: 5000, ratePct: 3 }, { upTo: 17000, ratePct: 5 }, { upTo: null, ratePct: 5.75 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source.",
    summary: "Virginia taxes wages on a graduated scale — the rate rises as income rises, from 2% to a top rate of 5.75% in 2026.",
    withholdingNotes: [
      "Virginia taxes taxable income in 4 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $8,750 single standard deduction first. A further $930 personal exemption also applies.",
      "The top bracket starts at just $17,000 — most earners pay 5.75% on the marginal dollar.",
    ],
    localTaxNote: null,
  },
  {
    slug: "washington-paycheck-calculator",
    state: "Washington",
    abbreviation: "WA",
    structure: "none",
    hohSupported: true,
    flatRatePct: null,
    standardDeductionSingle: null,
    standardDeductionMfj: null,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    brackets: null,
    bracketsMfj: null,
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026: no tax on wages in 2026 (Tax Foundation 2026 tables).",
    summary: "Washington has no state income tax on wages — your paycheck has $0 withheld for state income tax.",
    withholdingNotes: [
      "Washington levies no personal income tax on wages, so there is no state withholding line on your paycheck.",
      "Washington does levy a capital-gains tax above an annual threshold — it applies to investment gains, not to your paycheck.",
      "Federal tax, Social Security, and Medicare still apply exactly as in every other state.",
    ],
    localTaxNote: null,
  },
  {
    slug: "west-virginia-paycheck-calculator",
    state: "West Virginia",
    abbreviation: "WV",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 2000,
    standardDeductionMfj: 4000,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    hohSupported: false,
    brackets: [{ upTo: 10000, ratePct: 2.11 }, { upTo: 25000, ratePct: 2.81 }, { upTo: 40000, ratePct: 3.16 }, { upTo: 60000, ratePct: 4.22 }, { upTo: null, ratePct: 4.58 }],
    bracketsMfj: [{ upTo: 10000, ratePct: 2.11 }, { upTo: 25000, ratePct: 2.81 }, { upTo: 40000, ratePct: 3.16 }, { upTo: 60000, ratePct: 4.22 }, { upTo: null, ratePct: 4.58 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source. 2026 rates per SB 392 (signed Mar 31, 2026, retroactive Jan 1, 2026): every rate cut 5%.",
    summary: "West Virginia taxes wages on a graduated scale — the rate rises as income rises, from 2.11% to a top rate of 4.58% in 2026.",
    withholdingNotes: [
      "West Virginia taxes taxable income in 5 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $2,000 personal exemption (single filer) first.",
    ],
    localTaxNote: "Some West Virginia localities levy payroll or wage taxes — separate from state withholding.",
  },
  {
    slug: "wisconsin-paycheck-calculator",
    state: "Wisconsin",
    abbreviation: "WI",
    structure: "graduated",
    flatRatePct: null,
    standardDeductionSingle: 13960,
    standardDeductionMfj: 25840,
    standardDeductionHoh: 18030,
    standardDeductionMfs: 12280,
    exemptionSingle: 700,
    exemptionMfj: 1400,
    creditSingle: null,
    creditMfj: null,
    // WI HoH uses the single bracket schedule (2026 Form 1-ES) with its
    // own $18,030 standard deduction; the sdPhaseout HoH leg above carries
    // the 22.515% taper to $58,827, then the single formula.
    hohSupported: true,
    sdPhaseout: {
      single: { base: 13960, threshold: 20120, ratePct: 12 },
      marriedFilingJointly: { base: 25840, threshold: 29040, ratePct: 19.778 },
      marriedFilingSeparately: { base: 12280, threshold: 13780, ratePct: 19.778 },
      headOfHousehold: { base: 18030, threshold: 20120, ratePct: 22.515, segmentEnd: 58827 },
    },
    brackets: [{ upTo: 15110, ratePct: 3.5 }, { upTo: 51950, ratePct: 4.4 }, { upTo: 332720, ratePct: 5.3 }, { upTo: null, ratePct: 7.65 }],
    bracketsMfj: [{ upTo: 20150, ratePct: 3.5 }, { upTo: 69260, ratePct: 4.4 }, { upTo: 443630, ratePct: 5.3 }, { upTo: null, ratePct: 7.65 }],
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026 against the Tax Foundation's 2026 state tax tables (compiled from state statutes, forms and instructions as of Jan 1, 2026), cross-checked against a second source. Standard-deduction phaseout per 2026 Form 1-ES: single $13,960 less 12% of Wisconsin income over $20,120 ($0 at $136,453); joint $25,840 less 19.778% over $29,040 ($0 at $159,690); MFS $12,280 less 19.778% over $13,780 ($0 at $75,869); HoH $18,030 less 22.515% over $20,120 to $58,827, then the single formula.",
    summary: "Wisconsin taxes wages on a graduated scale — the rate rises as income rises, from 3.5% to a top rate of 7.65% in 2026.",
    withholdingNotes: [
      "Wisconsin taxes taxable income in 4 brackets — only the dollars inside each bracket are taxed at that bracket's rate. The calculator subtracts the $13,960 single standard deduction first. A further $700 personal exemption also applies.",
      "The standard deduction is a sliding scale: single filers keep the full $13,960 only to $20,119 of Wisconsin income, then lose 12% of the excess, reaching $0 at $136,453. Joint filers phase out at 19.778% from $29,040 ($0 at $159,690); heads of household start at $18,030 and phase out at 22.515% until the single schedule takes over at $58,827.",
    ],
    localTaxNote: null,
  },
  {
    slug: "wyoming-paycheck-calculator",
    state: "Wyoming",
    abbreviation: "WY",
    structure: "none",
    hohSupported: true,
    flatRatePct: null,
    standardDeductionSingle: null,
    standardDeductionMfj: null,
    exemptionSingle: null,
    exemptionMfj: null,
    creditSingle: null,
    creditMfj: null,
    brackets: null,
    bracketsMfj: null,
    verified: true,
    sourceUrl: "https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/",
    sourceNote: "Verified 15 Nov 2026: no tax on wages in 2026 (Tax Foundation 2026 tables).",
    summary: "Wyoming has no state income tax on wages — your paycheck has $0 withheld for state income tax.",
    withholdingNotes: [
      "Wyoming levies no personal income tax, so there is no state withholding line on your paycheck.",
      "Federal tax, Social Security, and Medicare still apply exactly as in every other state.",
    ],
    localTaxNote: null,
  },
];

export const ALL_STATE_SLUGS: string[] = STATE_TAX_DATA.map((s) => s.slug);

export function getStateBySlug(slug: string): StateTaxInfo | undefined {
  return STATE_TAX_DATA.find((s) => s.slug === slug);
}

export function getStateByAbbreviation(abbr: string): StateTaxInfo | undefined {
  return STATE_TAX_DATA.find(
    (s) => s.abbreviation.toLowerCase() === abbr.toLowerCase(),
  );
}

export const VERIFIED_STATE_COUNT = STATE_TAX_DATA.filter((s) => s.verified).length;
export const TODO_STATE_COUNT = STATE_TAX_DATA.length - VERIFIED_STATE_COUNT;

/** Top marginal rate (%) for a state — 0 for no-tax states. */
export function topRatePct(state: StateTaxInfo): number {
  if (state.structure === "none") return 0;
  if (state.structure === "flat") return state.flatRatePct ?? 0;
  const b = state.brackets;
  return b && b.length > 0 ? b[b.length - 1].ratePct : 0;
}

// ---- Pluggable state withholding estimate ----

// ---- Per-state deduction rules ----

/**
 * Which pre-tax deductions a state excludes from its own taxable wages.
 * Defaults (most states) follow the federal treatment: everything excluded.
 * Exceptions exist ONLY where a state DOR source says so — see the table
 * below. Filled from verified DOR research, 15 Nov 2026.
 */
export interface StateDeductionRules {
  /** 401(k) elective deferrals excluded from state taxable wages? */
  k401Excluded: boolean;
  /** Section 125 / 132 items (medical, dental, vision, FSA, commuter,
   *  LTD, life) excluded from state taxable wages? */
  sec125Excluded: boolean;
  /** HSA contributions excluded from state taxable wages? */
  hsaExcluded: boolean;
}

const FEDERAL_DEDUCTION_RULES: StateDeductionRules = {
  k401Excluded: true,
  sec125Excluded: true,
  hsaExcluded: true,
};

/**
 * States whose deduction treatment differs from the federal norm.
 * Verified 15 Nov 2026 against state DOR sources. Only three deviant
 * states exist for these deduction types — every other state with an
 * income tax follows the federal norm.
 *
 * - California: HSA contributions are TAXED for PIT (EDD DE 231EB, HSA
 *   rows "Subject"; FTB Schedule CA add-back). 401(k) and Section 125
 *   are excluded from PIT (but 401(k) is INCLUDED in SDI wages).
 * - Pennsylvania: 401(k)/403(b)/457(b) employee contributions are TAXED
 *   (PA DOR, PIT Guide — Gross Compensation, "Income Items Always
 *   Taxable"). Section 125 health premiums are excluded; HSA through a
 *   payroll §125 plan is excluded (61 Pa. Code §101.6(c)(6), PIT-06-005).
 *   Dependent-care FSA is taxed — the panel's FSA row is the HEALTH FSA.
 * - New Jersey: Section 125 health premiums, FSAs and HSAs are TAXED
 *   (NJ Division of Taxation, Technical Bulletin TB-39(R), 2003 — NJ
 *   does not adopt IRC §125). 401(k) is EXCLUDED, following the federal
 *   treatment (N.J.S.A. 54A:6-21) — NJ taxes 403(b)/457/SEP/TSP/IRA
 *   contributions instead, which this calculator does not model.
 */
export const STATE_DEDUCTION_RULES: Record<string, StateDeductionRules> = {
  "california-paycheck-calculator": {
    k401Excluded: true,
    sec125Excluded: true,
    hsaExcluded: false,
  },
  "pennsylvania-paycheck-calculator": {
    k401Excluded: false,
    sec125Excluded: true,
    hsaExcluded: true,
  },
  "new-jersey-paycheck-calculator": {
    k401Excluded: true,
    sec125Excluded: false,
    hsaExcluded: false,
  },
};

export function getStateDeductionRules(
  stateSlug: string,
): StateDeductionRules {
  return STATE_DEDUCTION_RULES[stateSlug] ?? FEDERAL_DEDUCTION_RULES;
}

// ---- New York local tax (NYC + Yonkers) ----

/**
 * 2026 NYC resident income-tax brackets (NY Tax Dept, Form IT-2105-I
 * (2026), p. 10 — https://www.tax.ny.gov/pdf/current_forms/it/it2105i.pdf).
 * NYC taxable income = NY State taxable income; there is no separate NYC
 * standard deduction. Single and MFS share a schedule; MFJ shares with
 * qualifying surviving spouse.
 */
export const NYC_BRACKETS_2026: Record<FilingStatus, StateBracket[]> = {
  single: [
    { upTo: 12000, ratePct: 3.078 },
    { upTo: 25000, ratePct: 3.762 },
    { upTo: 50000, ratePct: 3.819 },
    { upTo: null, ratePct: 3.876 },
  ],
  marriedFilingSeparately: [
    { upTo: 12000, ratePct: 3.078 },
    { upTo: 25000, ratePct: 3.762 },
    { upTo: 50000, ratePct: 3.819 },
    { upTo: null, ratePct: 3.876 },
  ],
  marriedFilingJointly: [
    { upTo: 21600, ratePct: 3.078 },
    { upTo: 45000, ratePct: 3.762 },
    { upTo: 90000, ratePct: 3.819 },
    { upTo: null, ratePct: 3.876 },
  ],
  headOfHousehold: [
    { upTo: 14400, ratePct: 3.078 },
    { upTo: 30000, ratePct: 3.762 },
    { upTo: 60000, ratePct: 3.819 },
    { upTo: null, ratePct: 3.876 },
  ],
};

/**
 * NYC school tax credit (fixed amount, refundable): $125 MFJ, $63 all
 * other filers, when income is $250,000 or less (IT-2105-I (2026) p. 8).
 * The separate NYC rate-reduction credit is NOT modeled.
 */
export const NYC_SCHOOL_TAX_CREDIT: Record<FilingStatus, number> = {
  single: 63,
  marriedFilingJointly: 125,
  headOfHousehold: 63,
  marriedFilingSeparately: 63,
};
export const NYC_SCHOOL_TAX_CREDIT_INCOME_LIMIT = 250000;

/** Yonkers resident income-tax surcharge: 16.75% of net NY State tax
 *  (IT-2105-I (2026), p. 8, Line 22a). Residents only. */
export const YONKERS_SURCHARGE_RATE = 0.1675;

// ---- State payroll-insurance programs (separate from income tax) ----

export interface StateInsuranceProgram {
  id: string;
  label: string;
  /** Employee rate (%). */
  ratePct: number;
  /** Annual wage cap (null = none). */
  wageCap: number | null;
  /** Annual contribution cap (null = none) — e.g. NY PFL $411.91. */
  contributionCap: number | null;
  /** Weekly deduction cap (null = none) — e.g. HI TDI $7.50/week. */
  weeklyCap: number | null;
  /**
   * "gross" = all wages; "fica" = wages after Section 125 + HSA
   * deductions (the FICA-wage basis — CT, OR, MN); "grossMinusSec125" =
   * wages after Section 125 only (CA SDI: 401(k) deferrals and HSA
   * contributions stay IN SDI wages — EDD DE 231EB).
   */
  base: "gross" | "fica" | "grossMinusSec125";
  /** Official source URL. Empty string only when no direct official URL
   *  was captured (the rate is then statutory + corroborated). */
  sourceUrl: string;
  sourceNote: string;
  /** e.g. "Maximum employee share — your employer may cover part of it." */
  note?: string;
}

/**
 * Mandatory employee-paid payroll-insurance programs, 2026.
 * Every rate/cap below was verified 15 Nov 2026 against an official
 * state source. Programs whose 2026 rate could not be verified are NOT
 * listed. Oregon's 0.1% Statewide Transit Tax is intentionally not here
 * (a transit tax, not an insurance program).
 */
export const STATE_INSURANCE_PROGRAMS: Record<
  string,
  StateInsuranceProgram[]
> = {
  "california-paycheck-calculator": [
    {
      id: "ca-sdi",
      label: "California SDI",
      ratePct: 1.3,
      wageCap: null,
      contributionCap: null,
      weeklyCap: null,
      base: "grossMinusSec125",
      sourceUrl: "https://www.edd.ca.gov/Payroll_Taxes/Rates_and_Withholding.htm",
      sourceNote:
        "Verified 15 Nov 2026: EDD 2026 SDI rate 1.3%, no wage ceiling (SB 951, since 1 Jan 2024). Covers disability + Paid Family Leave. SDI wages exclude Section 125 items but include 401(k) deferrals and HSA contributions.",
    },
  ],
  "new-york-paycheck-calculator": [
    {
      id: "ny-pfl",
      label: "NY Paid Family Leave",
      ratePct: 0.432,
      wageCap: null,
      contributionCap: 411.91,
      weeklyCap: null,
      base: "gross",
      sourceUrl: "https://paidfamilyleave.ny.gov/2026",
      sourceNote:
        "Verified 15 Nov 2026: NY PFL 0.432% of gross wages, max $411.91/yr (2026).",
    },
    {
      id: "ny-dbl",
      label: "NY Disability Benefits",
      ratePct: 0.5,
      wageCap: null,
      contributionCap: null,
      weeklyCap: 0.6,
      base: "gross",
      sourceUrl: "",
      sourceNote:
        "Verified 15 Nov 2026: NY DBL 0.5% of wages, max $0.60/week (Workers' Compensation Law §209) — statutory rate, corroborated by multiple sources citing the NY Workers' Compensation Board.",
      note: "Your employer may pay this — on many pay stubs it is $0.",
    },
  ],
  "new-jersey-paycheck-calculator": [
    {
      id: "nj-tdi",
      label: "NJ Temporary Disability Insurance",
      ratePct: 0.19,
      wageCap: 171100,
      contributionCap: null,
      weeklyCap: null,
      base: "gross",
      sourceUrl: "https://www.nj.gov/labor/ea/employer-services/rate-info/",
      sourceNote:
        "Verified 15 Nov 2026: NJDOL 2026 TDI employee rate 0.19% on a $171,100 wage base (max $325.09/yr).",
    },
    {
      id: "nj-fli",
      label: "NJ Family Leave Insurance",
      ratePct: 0.23,
      wageCap: 171100,
      contributionCap: null,
      weeklyCap: null,
      base: "gross",
      sourceUrl: "https://www.nj.gov/labor/ea/employer-services/rate-info/",
      sourceNote:
        "Verified 15 Nov 2026: NJDOL 2026 FLI employee rate 0.23% on a $171,100 wage base (max $393.53/yr).",
    },
    {
      id: "nj-ui-wf",
      label: "NJ Unemployment + Workforce (UI/WF)",
      ratePct: 0.425,
      wageCap: 44800,
      contributionCap: null,
      weeklyCap: null,
      base: "gross",
      sourceUrl: "https://www.nj.gov/labor/ea/employer-services/rate-info/",
      sourceNote:
        "Verified 15 Nov 2026: NJDOL 2026 UI 0.3825% + WF/SWF 0.0425% = 0.425% on the first $44,800 (max $190.40/yr).",
    },
  ],
  "washington-paycheck-calculator": [
    {
      id: "wa-pfml",
      label: "WA Paid Family & Medical Leave",
      ratePct: 0.8072,
      wageCap: 184500,
      contributionCap: null,
      weeklyCap: null,
      base: "gross",
      sourceUrl: "https://paidleave.wa.gov/employer-roles-responsibilities/",
      sourceNote:
        "Verified 15 Nov 2026: WA PFML 2026 total premium 1.13% x 71.43% employee share = 0.8072%, up to the $184,500 Social Security cap (ESD).",
      note: "Maximum employee share — your employer may cover part of it.",
    },
    {
      id: "wa-cares",
      label: "WA Cares (long-term care)",
      ratePct: 0.58,
      wageCap: null,
      contributionCap: null,
      weeklyCap: null,
      base: "gross",
      sourceUrl: "https://paidleave.wa.gov/employer-roles-responsibilities/",
      sourceNote:
        "Verified 15 Nov 2026: WA Cares 0.58% of gross wages, no wage cap (ESD). 100% employee-paid.",
    },
  ],
  "massachusetts-paycheck-calculator": [
    {
      id: "ma-pfml",
      label: "MA Paid Family & Medical Leave",
      ratePct: 0.46,
      wageCap: 184500,
      contributionCap: null,
      weeklyCap: null,
      base: "gross",
      sourceUrl:
        "https://www.mass.gov/info-details/paid-family-and-medical-leave-employer-contribution-rates-and-calculator",
      sourceNote:
        "Verified 15 Nov 2026: MA PFML 2026 max employee share 0.46% (0.28% medical + 0.18% family) up to the $184,500 cap (DFML).",
      note: "Maximum employee share — your employer may cover part of it.",
    },
  ],
  "connecticut-paycheck-calculator": [
    {
      id: "ct-paid-leave",
      label: "CT Paid Leave",
      ratePct: 0.5,
      wageCap: 184500,
      contributionCap: null,
      weeklyCap: null,
      base: "fica",
      sourceUrl: "https://www.ctpaidleave.org/remit-contributions",
      sourceNote:
        "Verified 15 Nov 2026: CT Paid Leave 0.5% of wages up to the $184,500 Social Security cap; base is FICA wages (Section 125 excluded).",
    },
  ],
  "oregon-paycheck-calculator": [
    {
      id: "or-paid-leave",
      label: "Paid Leave Oregon",
      ratePct: 0.6,
      wageCap: 184500,
      contributionCap: null,
      weeklyCap: null,
      base: "fica",
      sourceUrl: "https://paidleave.oregon.gov/employees/overview.html",
      sourceNote:
        "Verified 15 Nov 2026: Paid Leave Oregon 2026 total 1% x 60% employee share = 0.6%, up to $184,500; subject wages exclude Section 125 / FSA / HSA.",
      note: "Maximum employee share — your employer may cover part of it.",
    },
  ],
  "colorado-paycheck-calculator": [
    {
      id: "co-famli",
      label: "CO FAMLI",
      ratePct: 0.44,
      wageCap: 184500,
      contributionCap: null,
      weeklyCap: null,
      base: "gross",
      sourceUrl:
        "https://famli.colorado.gov/individuals-and-families/how-famli-works/premium-and-benefits-calculator",
      sourceNote:
        "Verified 15 Nov 2026: CO FAMLI 2026 total 0.88%, 50/50 split — employee 0.44% up to the $184,500 cap (SB 25-144).",
      note: "Maximum employee share — your employer may cover part of it.",
    },
  ],
  "rhode-island-paycheck-calculator": [
    {
      id: "ri-tdi",
      label: "RI Temporary Disability Insurance",
      ratePct: 1.1,
      wageCap: 100000,
      contributionCap: null,
      weeklyCap: null,
      base: "gross",
      sourceUrl:
        "https://dlt.ri.gov/press-releases/2026-tax-rates-unemployment-insurance-and-temporary-disability-insurance",
      sourceNote:
        "Verified 15 Nov 2026: RI DLT 2026 TDI rate 1.1% (down from 1.3% in 2025) on a $100,000 wage base (max $1,100/yr). Includes Temporary Caregiver Insurance — no separate line.",
    },
  ],
  "hawaii-paycheck-calculator": [
    {
      id: "hi-tdi",
      label: "HI Temporary Disability Insurance",
      ratePct: 0.5,
      wageCap: null,
      contributionCap: null,
      weeklyCap: 7.5,
      base: "gross",
      sourceUrl:
        "https://labor.hawaii.gov/dcd/files/2025/12/2026-Maximum-Weekly-Wage-Base.pdf",
      sourceNote:
        "Verified 15 Nov 2026: HI DLIR 2026 TDI up to 0.5% of weekly wages, max $7.50/week (weekly wage base $1,500.21).",
      note: "Your employer may pay the whole premium — often $0 on pay stubs.",
    },
  ],
  "minnesota-paycheck-calculator": [
    {
      id: "mn-paid-leave",
      label: "MN Paid Leave",
      ratePct: 0.44,
      wageCap: 185000,
      contributionCap: null,
      weeklyCap: null,
      base: "fica",
      sourceUrl: "https://pl.mn.gov/individuals/how-paid-leave-works",
      sourceNote:
        "Verified 15 Nov 2026: MN Paid Leave 2026 total 0.88%, employee max 0.44%, cap $185,000 (the Social Security limit rounded to the nearest thousand — NOT $184,500). Base is FICA wages.",
      note: "Maximum employee share — your employer may cover part of it.",
    },
  ],
  "alaska-paycheck-calculator": [
    {
      id: "ak-ui",
      label: "Alaska Unemployment Insurance",
      ratePct: 0.5,
      wageCap: 54200,
      contributionCap: null,
      weeklyCap: null,
      base: "gross",
      sourceUrl: "https://labor.alaska.gov/estax/2026-experience-rates.html",
      sourceNote:
        "Verified 15 Nov 2026: AK DOL&WD 2026 employee UI rate 0.50% on the first $54,200 of wages (max $271/yr). Employee-paid UI is unusual — only AK, NJ and PA withhold it from the employee. Alaska has no state income tax, so this is the only state line on an Alaska paycheck.",
    },
  ],
  "pennsylvania-paycheck-calculator": [
    {
      id: "pa-uc",
      label: "PA Unemployment Compensation",
      ratePct: 0.07,
      wageCap: null,
      contributionCap: null,
      weeklyCap: null,
      base: "gross",
      sourceUrl:
        "https://www.pa.gov/agencies/dli/resources/for-employers-and-educators/how-to-file/uc-tax/employee-withholding",
      sourceNote:
        "Verified 15 Nov 2026: PA DLI 2026 employee UC withholding 0.07% of total gross wages (70 cents per $1,000), NO wage cap — the $10,000 wage base is employer-side only. Applies to all employees, including 401(k) deferrals.",
    },
  ],
  "maine-paycheck-calculator": [
    {
      id: "me-pfml",
      label: "ME Paid Family & Medical Leave",
      ratePct: 0.5,
      wageCap: 184500,
      contributionCap: null,
      weeklyCap: null,
      base: "fica",
      sourceUrl: "https://www.maine.gov/paidleave/",
      sourceNote:
        "Verified 15 Nov 2026: ME PFML total 1% of wages up to the Social Security cap ($184,500) for 2026 — employers with 15+ employees contribute 1% and may deduct up to half (0.5%) from the employee; employers under 15 contribute 0.5% and may deduct it all. No more than 0.5% ever comes from the employee, so the modeled line is the maximum employee share. Contributions began Jan 1, 2025; benefits began May 1, 2026 (MDOL).",
      note: "Maximum employee share — your employer may cover part of it.",
    },
  ],
  "delaware-paycheck-calculator": [
    {
      id: "de-paid-leave",
      label: "DE Paid Leave",
      ratePct: 0.4,
      wageCap: 184500,
      contributionCap: null,
      weeklyCap: null,
      base: "fica",
      sourceUrl: "https://labor.delaware.gov/delaware-paid-leave/",
      sourceNote:
        "Verified 15 Nov 2026: DE Paid Leave total 0.8% of wages (medical 0.4% + parental 0.32% + family caregiving 0.08%), employers may deduct up to half — modeled line is the 25+ employee maximum employee share 0.4% up to the Social Security cap ($184,500). Employers with 10–24 employees owe parental leave only (0.16% max employee share); under 10 are exempt. Contributions began Jan 1, 2025; benefits began Jan 1, 2026 (DE DOL, Healthy Delaware Families Act, 19 Del. C. Ch. 37).",
      note: "Maximum employee share (25+ employees) — smaller employers pay less, and your employer may cover part of it.",
    },
  ],
};

/**
 * Estimate the annual state payroll-insurance deductions for a state.
 * Returns one line per program (only lines with an amount above $0).
 */
export function estimateStateInsurance(
  stateSlug: string,
  annualGross: number,
  sec125Annual: number,
  hsaAnnual: number,
): StateInsuranceLine[] {
  const programs = STATE_INSURANCE_PROGRAMS[stateSlug] ?? [];
  const ficaBase = Math.max(0, annualGross - sec125Annual - hsaAnnual);
  const sec125Base = Math.max(0, annualGross - sec125Annual);
  const lines: StateInsuranceLine[] = [];
  for (const p of programs) {
    const base =
      p.base === "fica" ? ficaBase : p.base === "grossMinusSec125" ? sec125Base : annualGross;
    let annual: number;
    if (p.weeklyCap !== null) {
      annual = Math.min((base / 52) * (p.ratePct / 100), p.weeklyCap) * 52;
    } else if (p.contributionCap !== null) {
      annual = Math.min((base * p.ratePct) / 100, p.contributionCap);
    } else if (p.wageCap !== null) {
      annual = (Math.min(base, p.wageCap) * p.ratePct) / 100;
    } else {
      annual = (base * p.ratePct) / 100;
    }
    if (annual > 0) {
      lines.push({
        id: p.id,
        label: p.label,
        annual,
        ...(p.sourceUrl ? { sourceUrl: p.sourceUrl } : {}),
        note: p.note,
      });
    }
  }
  return lines;
}

// ---- Pluggable state withholding estimate ----

// ---- Per-state adjustment helpers (round-4 friend audit, 15 Nov 2026) ----

/**
 * Alabama-style stepped standard deduction (ALDOR Withholding Tax Tables
 * and Instructions, Rev. Jan 2026): full base at or below the threshold,
 * then reductionPerStep for each stepSize (or fraction thereof) of income
 * over the threshold, floored at `floor`. Income here is annual GROSS.
 */
export function phaseDownStandardDeduction(
  leg: SdPhaseDownLeg,
  grossIncome: number,
): number {
  if (grossIncome <= leg.threshold) return leg.base;
  const steps = Math.ceil((grossIncome - leg.threshold) / leg.stepSize);
  return Math.max(leg.floor, leg.base - steps * leg.reductionPerStep);
}

/**
 * Wisconsin-style percentage standard deduction (2026 Form 1-ES): full
 * base at or below the threshold, then ratePct% of income over the
 * threshold, floored at $0. Head of household uses its own rate up to
 * segmentEnd, then the single leg's formula.
 */
export function phaseoutStandardDeduction(
  status: FilingStatus,
  income: number,
  rule: SdPhaseoutRule,
): number {
  const linear = (leg: SdPhaseoutLeg): number =>
    Math.max(
      0,
      leg.base - (leg.ratePct / 100) * Math.max(0, income - leg.threshold),
    );
  if (status === "headOfHousehold") {
    const hoh = rule.headOfHousehold;
    if (income <= hoh.segmentEnd) return linear(hoh);
    return linear(rule.single);
  }
  const leg =
    status === "marriedFilingJointly"
      ? rule.marriedFilingJointly
      : status === "marriedFilingSeparately"
        ? rule.marriedFilingSeparately
        : rule.single;
  return linear(leg);
}

/**
 * Federal income-tax deduction (AL full; MO §143.171 tiered; OR capped +
 * phased). Input is the engine's computed federal liability — an ESTIMATE,
 * not observed withholding. `agi` is the AGI proxy (stateTaxableBase);
 * unused for the "full" kind.
 */
export function federalTaxDeductionAmount(
  rule: FederalTaxDeductionRule,
  agi: number,
  federalLiability: number,
  filingStatus: FilingStatus,
): number {
  if (rule.kind === "full") return Math.max(0, federalLiability);
  if (rule.kind === "cappedPhased") {
    const isJoint =
      filingStatus === "marriedFilingJointly" ||
      filingStatus === "headOfHousehold";
    const capBase =
      filingStatus === "marriedFilingSeparately"
        ? rule.capMfs
        : isJoint
          ? rule.capMfj
          : rule.capSingle;
    const start = isJoint
      ? rule.phaseoutStartJoint
      : rule.phaseoutStartSingle;
    const stepSize = isJoint ? rule.stepSizeJoint : rule.stepSizeSingle;
    let cap = capBase;
    // The phaseout bands are lower-bound inclusive: at AGI exactly equal
    // to the start ($125,000 single / $250,000 joint) the cap is already
    // one step down ($7,000), per the OR-ESTIMATE / OR-17 band table.
    if (agi >= start) {
      const steps = Math.floor((agi - start) / stepSize) + 1;
      cap = Math.max(0, capBase - steps * rule.stepAmount);
    }
    return Math.min(cap, Math.max(0, federalLiability));
  }
  const tier = rule.tiers.find((t) => t.upTo === null || agi <= t.upTo);
  const pct = tier ? tier.pct : 0;
  const cap =
    filingStatus === "marriedFilingJointly" ? rule.capMfj : rule.capSingle;
  return Math.min(cap, (Math.max(0, federalLiability) * pct) / 100);
}

/**
 * Utah taxpayer credit after phaseout (Utah Code §59-10-1018): the base
 * credit (6% of the federal standard deduction) less $0.013 per $1 of
 * Utah taxable income over the indexed base, floored at $0.
 */
export function utahTaxpayerCredit(
  rule: CreditPhaseoutRule,
  status: FilingStatus,
  utahTaxableIncome: number,
  baseCredit: number,
): number {
  const excess = Math.max(0, utahTaxableIncome - rule.bases[status]);
  return Math.max(0, baseCredit - rule.ratePerDollar * excess);
}

/**
 * Connecticut Table C add-back (2026 CT-1040ES): $step per bandWidth (or
 * part) of CT AGI over the threshold, capped at max.
 */
export function connecticutTableC(
  leg: ConnecticutTableCLeg,
  agi: number,
): number {
  if (agi <= leg.threshold) return 0;
  return Math.min(
    leg.max,
    leg.step * Math.ceil((agi - leg.threshold) / leg.bandWidth),
  );
}

/**
 * Connecticut Table D recapture (2026 CT-1040ES): two stepped climbs
 * separated by flat plateaus, then a final climb capped at p3Max.
 */
export function connecticutTableD(
  leg: ConnecticutTableDLeg,
  agi: number,
): number {
  if (agi <= leg.p1Threshold) return 0;
  if (agi <= leg.p1SteppedUpTo)
    return leg.p1Step * Math.ceil((agi - leg.p1Threshold) / leg.p1Width);
  if (agi <= leg.p1FlatUpTo) return leg.p1Flat;
  if (agi <= leg.p2SteppedUpTo)
    return (
      leg.p1Flat + leg.p2Step * Math.ceil((agi - leg.p2Start) / leg.p2Width)
    );
  if (agi <= leg.p2FlatUpTo) return leg.p2Flat;
  return Math.min(
    leg.p3Max,
    leg.p2Flat + leg.p3Step * Math.ceil((agi - leg.p3Start) / leg.p3Width),
  );
}

/** Connecticut Table E personal-credit rate for a CT AGI. */
export function connecticutTableE(
  bands: ConnecticutTableEBand[],
  agi: number,
): number {
  for (const b of bands) {
    if (b.upTo === null || agi <= b.upTo) return b.rate;
  }
  return 0;
}

/**
 * Connecticut Tax Calculation Schedule (2026 CT-1040ES Tables A–E).
 * Income measure for every table is CT AGI — the engine's proxy is
 * stateTaxableBase (gross minus the pre-tax deductions CT excludes).
 * Table A phases the personal exemption out $1,000 per $1,000 of AGI
 * over the threshold (the $1,000 at exactly $44,000 single is real — the
 * exemption hits $0 only ABOVE $44,000); Table B is the ordinary
 * brackets on taxable income; Tables C + D add back on top; Table E is
 * a credit percentage of (Table B + C + D). Connecticut has no standard
 * deduction — effectiveStandardDeduction is $0.
 */
export function connecticutTax(
  state: StateTaxInfo,
  filingStatus: FilingStatus,
  agi: number,
): StateEstimateResult {
  const schedule = state.ctSchedule;
  if (!schedule) return { state: null, local: null };
  const isMfj = filingStatus === "marriedFilingJointly";
  const isHoh = filingStatus === "headOfHousehold";
  const isMfs = filingStatus === "marriedFilingSeparately";
  const exemptionBase = isMfj
    ? (state.exemptionMfj ?? 0)
    : isHoh
      ? (state.exemptionHoh ?? 0)
      : isMfs
        ? (state.exemptionMfs ?? 0)
        : (state.exemptionSingle ?? 0);
  const aThreshold = schedule.tableAThreshold[filingStatus];
  const exemption =
    agi <= aThreshold
      ? exemptionBase
      : Math.max(
          0,
          exemptionBase - 1000 * Math.ceil((agi - aThreshold) / 1000),
        );
  const taxable = Math.max(0, agi - exemption);
  const brackets =
    isHoh && state.bracketsHoh
      ? state.bracketsHoh
      : isMfj && state.bracketsMfj
        ? state.bracketsMfj
        : state.brackets;
  if (!brackets) return { state: null, local: null };
  const initial = applyBrackets(taxable, brackets);
  const addBack = connecticutTableC(schedule.tableC[filingStatus], agi);
  const recapture = connecticutTableD(schedule.tableD[filingStatus], agi);
  const grossTax = initial + addBack + recapture;
  const creditRate = connecticutTableE(schedule.tableE[filingStatus], agi);
  const tax = Math.max(0, grossTax * (1 - creditRate));
  return {
    state: tax,
    local: null,
    effectiveStandardDeduction: 0,
    effectiveExemption: exemption,
  };
}

/**
 * Maryland personal-exemption phaseout (2026 PV Worksheet, Line 6 chart):
 * per-exemption amount by federal-AGI band; MFJ counts 2 exemptions,
 * every other status 1. Single/MFS phase out at $100k/$125k/$150k;
 * joint/HoH keep the full $3,200 until $150k, then $1,600/$800/$0.
 */
export function phasedOutExemption(
  rule: ExemptionPhaseoutRule,
  filingStatus: FilingStatus,
  agi: number,
): number {
  const bands =
    filingStatus === "marriedFilingJointly" ||
    filingStatus === "headOfHousehold"
      ? rule.joint
      : rule.single;
  const band = bands.find((b) => b.upTo === null || agi <= b.upTo);
  const perExemption = band ? band.perExemption : 0;
  const count = filingStatus === "marriedFilingJointly" ? 2 : 1;
  return perExemption * count;
}

/**
 * Arkansas tax with the 3.7% phase-in band (DFA Withholding Tax Formula
 * Method, eff. 01/01/2026). `taxable` is net taxable income (after the
 * $2,470 standard deduction). Below $94,701 the graduated brackets
 * apply; inside the band the subtraction steps down $10 per $100 of
 * income ($369.90 → $89.90); at $97,601+ it is 3.7% − $79.90.
 * Note the state's own $2.70 seam: tax at $94,701 ($3,134.04) is $2.70
 * BELOW tax at $94,700 ($3,136.74), because the band's first subtraction
 * ($369.90) exceeds the $367.16 below the band.
 */
export function arkansasTaxWithPhaseIn(
  taxable: number,
  brackets: StateBracket[],
  band: ArkansasPhaseInBand,
): number {
  if (taxable < band.bandStart) return applyBrackets(taxable, brackets);
  if (taxable <= band.bandEnd) {
    const step = Math.floor((taxable - band.bandStart) / band.stepSize);
    const subtraction = band.firstSubtraction - step * band.stepDecrement;
    return Math.max(0, (taxable * band.ratePct) / 100 - subtraction);
  }
  return Math.max(0, (taxable * band.ratePct) / 100 - band.aboveSubtraction);
}

/**
 * South Carolina SCIAD phaseout (SCDOR Information Letter #26-20, Aug 31,
 * 2026): full SCIAD at or below the threshold, then reduced by the
 * fraction (AGI − threshold) / span, reaching $0 at threshold + span.
 * The REDUCTION (not the SCIAD) is rounded DOWN to the next lowest $10.
 */
export function southCarolinaSciad(
  status: FilingStatus,
  agi: number,
  rule: SciadPhaseoutRule,
): number {
  const leg =
    status === "marriedFilingJointly"
      ? rule.marriedFilingJointly
      : status === "headOfHousehold"
        ? rule.headOfHousehold
        : status === "marriedFilingSeparately"
          ? rule.marriedFilingSeparately
          : rule.single;
  if (agi <= leg.threshold) return leg.base;
  if (agi >= leg.threshold + leg.span) return 0;
  const reduction = leg.base * ((agi - leg.threshold) / leg.span);
  const roundedReduction = Math.floor(reduction / 10) * 10;
  return Math.max(0, leg.base - roundedReduction);
}

/**
 * Estimate annual state withholding for a given state.
 *
 * Method (annual-liability approximation, disclosed as an estimate):
 * taxable base = gross − the pre-tax deductions THIS state excludes
 * (per-state rules — see STATE_DEDUCTION_RULES; most states follow the
 * federal treatment);
 * taxable = base − standard deduction (or exemption) − extra exemption,
 * then the flat rate or the graduated brackets for the filing status
 * (head of household uses bracketsHoh where the state has its own HoH
 * schedule, else the single schedule where the state prescribes it —
 * and returns { state: null, hohUnsupported: true } where the HoH
 * schedule is unverified; married filing separately falls back to the
 * single schedule), then subtract any nonrefundable credit (UT, DE, OR,
 * NE, CA, IA), floored at $0. Connecticut runs its own Tax Calculation
 * Schedule (Tables A–E) instead of this path.
 *
 * New York local layer: NYC residents add city tax on the same taxable
 * income (3.078%–3.876% brackets, minus the $63/$125 school tax credit);
 * Yonkers residents add a 16.75% surcharge on net state tax.
 *
 * Per-state adjustments (round-4 friend audit, 15 Nov 2026 — see the
 * rule fields on the state entries): AL standard-deduction phase-down +
 * full federal-tax deduction; WI standard-deduction phaseout; AR 3.7%
 * phase-in band; MD personal-exemption phaseout; MO tiered federal-tax
 * deduction (§143.171); SC SCIAD phaseout. Round-5 (15 Nov 2026): OR
 * capped+phased federal-tax deduction + credit AGI cutoff; UT taxpayer-
 * credit phaseout (§59-10-1018); CT Tax Calculation Schedule (Tables
 * A–E); head-of-household schedules for 29 states + an explicit
 * hohUnsupported flag for the 13 unverified ones. The federal-tax
 * deduction input is the engine's computed federal liability (an
 * ESTIMATE, not observed withholding); the result exposes it as
 * federalLiabilityEstimate so content can label it.
 *
 * Returns 0 for no-tax states and null when a state has no usable table
 * at all (should not happen now that all 51 are verified) or when the
 * filer is head of household in a hohUnsupported state.
 *
 * This is a planning estimate only: it ignores state credits beyond the
 * ones modeled, local taxes other than NYC/Yonkers, and state-specific
 * withholding tables (e.g. the AR $50-midrange lookup and whole-dollar
 * rounding), which is why the UI always labels the state line as an
 * estimate.
 */
export function estimateStateWithholding(
  input: StateEstimateInput,
): StateEstimateResult {
  const { stateSlug, annualGross, filingStatus, preTax, nyLocal } = input;
  const state = getStateBySlug(stateSlug);
  if (!state) return { state: null, local: null };
  if (state.structure === "none") return { state: 0, local: null };

  // Head of household: never silently substitute the single-filer number
  // for a state whose HoH schedule is unverified (hohSupported === false).
  // The caller gets state: null + hohUnsupported so the UI can label it.
  if (filingStatus === "headOfHousehold" && state.hohSupported === false) {
    return { state: null, local: null, hohUnsupported: true };
  }

  const rules = getStateDeductionRules(stateSlug);
  const excluded =
    (rules.k401Excluded ? preTax.k401Annual : 0) +
    (rules.sec125Excluded ? preTax.sec125Annual : 0) +
    (rules.hsaExcluded ? preTax.hsaAnnual : 0);
  const stateTaxableBase = Math.max(0, annualGross - excluded);

  const isMfj = filingStatus === "marriedFilingJointly";
  const isHoh = filingStatus === "headOfHousehold";
  const isMfs = filingStatus === "marriedFilingSeparately";

  // Connecticut runs its own Tax Calculation Schedule (Tables A–E) —
  // no standard deduction, phased exemption, add-back, recapture, credit.
  if (state.ctSchedule) {
    return connecticutTax(state, filingStatus, stateTaxableBase);
  }

  // Standard deduction: status-specific base, then any phase-down/phaseout.
  // (AL's chart is keyed to annual GROSS income; WI/SC use the AGI proxy
  // stateTaxableBase.)
  let deduction = isMfj
    ? (state.standardDeductionMfj ?? 0)
    : isHoh
      ? (state.standardDeductionHoh ?? state.standardDeductionSingle ?? 0)
      : isMfs
        ? (state.standardDeductionMfs ?? state.standardDeductionSingle ?? 0)
        : (state.standardDeductionSingle ?? 0);
  if (state.sdPhaseDown) {
    deduction = phaseDownStandardDeduction(
      state.sdPhaseDown[filingStatus],
      annualGross,
    );
  } else if (state.sdPhaseout) {
    deduction = phaseoutStandardDeduction(
      filingStatus,
      stateTaxableBase,
      state.sdPhaseout,
    );
  } else if (state.sciadPhaseout) {
    deduction = southCarolinaSciad(
      filingStatus,
      stateTaxableBase,
      state.sciadPhaseout,
    );
  }

  // Personal exemption: the MD phaseout overrides the static amount.
  let exemption =
    (isMfj
      ? state.exemptionMfj
      : isHoh
        ? (state.exemptionHoh ?? state.exemptionSingle)
        : isMfs
          ? (state.exemptionMfs ?? state.exemptionSingle)
          : state.exemptionSingle) ?? 0;
  if (state.exemptionPhaseout) {
    exemption = phasedOutExemption(
      state.exemptionPhaseout,
      filingStatus,
      stateTaxableBase,
    );
  }

  // Nonrefundable credit: status-specific base amount. The UT phaseout
  // and the OR AGI cutoff need `taxable` / the AGI proxy, so they are
  // applied after `taxable` is computed below — not here.
  const baseCredit =
    (isMfj
      ? state.creditMfj
      : isHoh
        ? (state.creditHoh ?? state.creditSingle)
        : state.creditSingle) ?? 0;

  // Federal income-tax deduction (AL full; MO §143.171 tiered; OR capped
  // + phased). Input is the engine's computed federal liability — an
  // ESTIMATE, not observed federal withholding. Direct callers that did
  // not pass annualFederal get the same figure recomputed here.
  let federalDeduction = 0;
  let federalLiabilityEstimate: number | undefined;
  if (state.federalTaxDeduction) {
    federalLiabilityEstimate =
      input.annualFederal ??
      estimateFederalLiability(annualGross, filingStatus, preTax);
    federalDeduction = federalTaxDeductionAmount(
      state.federalTaxDeduction,
      stateTaxableBase,
      federalLiabilityEstimate,
      filingStatus,
    );
  }

  const taxable = Math.max(
    0,
    stateTaxableBase - deduction - exemption - federalDeduction,
  );

  // Credit adjustments that need the computed base: UT phases the credit
  // out against Utah taxable income (§59-10-1018); OR zeroes the credit
  // above the federal-AGI cutoff (ORS 316.085(5)).
  let credit = baseCredit;
  if (state.creditPhaseout) {
    credit = utahTaxpayerCredit(
      state.creditPhaseout,
      filingStatus,
      taxable,
      baseCredit,
    );
  }
  if (state.creditAgiLimit) {
    const limit =
      isMfj || isHoh
        ? state.creditAgiLimit.joint
        : state.creditAgiLimit.single;
    if (stateTaxableBase > limit) credit = 0;
  }

  let tax: number;
  if (state.structure === "flat") {
    if (state.flatRatePct === null) return { state: null, local: null };
    tax = (taxable * state.flatRatePct) / 100;
  } else {
    const brackets =
      isHoh && state.bracketsHoh
        ? state.bracketsHoh
        : isMfj && state.bracketsMfj
          ? state.bracketsMfj
          : state.brackets;
    if (!brackets) return { state: null, local: null };
    tax = state.arPhaseInBand
      ? arkansasTaxWithPhaseIn(taxable, brackets, state.arPhaseInBand)
      : applyBrackets(taxable, brackets);
  }
  const stateTax = Math.max(0, tax - credit);

  // New York local layer (NYC / Yonkers — mutually exclusive, residents only).
  let local: StateEstimateResult["local"] = null;
  if (stateSlug === "new-york-paycheck-calculator") {
    if (nyLocal === "nyc") {
      const nycTax = Math.max(
        0,
        applyBrackets(taxable, NYC_BRACKETS_2026[filingStatus]),
      );
      const schoolCredit =
        annualGross <= NYC_SCHOOL_TAX_CREDIT_INCOME_LIMIT
          ? NYC_SCHOOL_TAX_CREDIT[filingStatus]
          : 0;
      local = {
        label: "New York City tax",
        annual: Math.max(0, nycTax - schoolCredit),
      };
    } else if (nyLocal === "yonkers") {
      local = {
        label: "Yonkers resident surcharge",
        annual: stateTax * YONKERS_SURCHARGE_RATE,
      };
    }
  }

  return {
    state: stateTax,
    local,
    effectiveStandardDeduction: deduction,
    effectiveExemption: exemption,
    ...(state.federalTaxDeduction
      ? {
          federalTaxDeduction: federalDeduction,
          federalLiabilityEstimate,
        }
      : {}),
  };
}

/**
 * True when the state estimate is approximate — i.e. the flat rate is
 * verified but the state standard deduction is still a TODO, so the
 * estimate is computed on the full gross and may overstate withholding
 * slightly. The UI shows an "approximate" label in that case.
 * (No state is approximate now that all 51 are verified; kept as a guard.)
 */
export function stateEstimateIsApproximate(stateSlug: string): boolean {
  const state = getStateBySlug(stateSlug);
  if (!state) return false;
  return (
    state.structure === "flat" &&
    state.flatRatePct !== null &&
    state.standardDeductionSingle === null &&
    state.creditSingle === null
  );
}

/** Bracket table rows for the state page (single filer). null = flat / no-tax. */
export function stateBracketsForPage(
  state: StateTaxInfo,
): StateBracket[] | null {
  return state.brackets;
}
