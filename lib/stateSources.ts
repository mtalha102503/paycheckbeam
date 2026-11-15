/**
 * PaycheckBeam — per-state Department of Revenue source links.
 *
 * An entry is rendered on a state page only when it exists here, and
 * entries are added only after verified research — never guessed.
 * The three exemplar states (CA / TX / NY) have verified entries from
 * the 2026-11-15 exemplar research; the other states are still pending.
 */
export const STATE_SOURCES: Record<string, { agency: string; url: string }> = {
  "california-paycheck-calculator": {
    agency: "California Franchise Tax Board",
    url: "https://www.ftb.ca.gov/about-ftb/newsroom/tax-news/2026/10.html",
  },
  "texas-paycheck-calculator": {
    agency: "Texas Comptroller of Public Accounts",
    url: "https://comptroller.texas.gov/economy/fiscal-notes/industry/2025/small-biz-info/",
  },
  "new-york-paycheck-calculator": {
    agency: "New York State Tax Department",
    url: "https://www.tax.ny.gov/pdf/current_forms/it/it2105i.pdf",
  },
};
