import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Paycheck Calculator & Take-Home Pay by State (2026)`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Free paycheck calculator for 2026. See your take-home pay after federal, Social Security, Medicare, and state taxes — for every state, with the official 2026 IRS withholding tables.",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Paycheck Calculator & Take-Home Pay by State (2026)`,
    description:
      "Free 2026 paycheck calculator. Federal, FICA, and state withholding for all 50 states — see your real take-home pay in seconds.",
  },
};

function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect width="28" height="28" rx="7" fill="#2563eb" />
      <path
        d="M15.5 5 8 15.5h5L12.5 23 20 12.5h-5l.5-7.5Z"
        fill="#fff"
        stroke="#fff"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-white font-sans text-slate-900">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <LogoMark />
              <span className="text-lg font-extrabold tracking-tight text-slate-900">
                Paycheck<span className="text-blue-600">Beam</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm font-semibold sm:gap-2">
              <Link
                href="/"
                className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                Calculator
              </Link>
              <Link
                href="/#states"
                className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                States
              </Link>
              <Link
                href="/about"
                className="hidden rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 sm:block"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="hidden rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 sm:block"
              >
                Contact
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <div className="grid gap-8 sm:grid-cols-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <LogoMark />
                  <span className="text-base font-extrabold tracking-tight text-slate-900">
                    Paycheck<span className="text-blue-600">Beam</span>
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  Free paycheck and take-home pay calculator for all 50 states,
                  using the official 2026 federal withholding tables.
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Popular calculators</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <Link href="/texas-paycheck-calculator" className="text-slate-600 hover:text-blue-600">
                      Texas paycheck calculator
                    </Link>
                  </li>
                  <li>
                    <Link href="/california-paycheck-calculator" className="text-slate-600 hover:text-blue-600">
                      California paycheck calculator
                    </Link>
                  </li>
                  <li>
                    <Link href="/florida-paycheck-calculator" className="text-slate-600 hover:text-blue-600">
                      Florida paycheck calculator
                    </Link>
                  </li>
                  <li>
                    <Link href="/new-york-paycheck-calculator" className="text-slate-600 hover:text-blue-600">
                      New York paycheck calculator
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Site</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <Link href="/about" className="text-slate-600 hover:text-blue-600">
                      About &amp; methodology
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-slate-600 hover:text-blue-600">
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="text-slate-600 hover:text-blue-600">
                      Privacy policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-10 border-t border-slate-200 pt-6 text-xs leading-relaxed text-slate-500">
              <p>
                © 2026 PaycheckBeam. All rights reserved. PaycheckBeam provides
                estimates for informational purposes only and is not tax, legal, or
                financial advice. Federal figures follow IRS Publication 15-T (2026)
                and Rev. Proc. 2025-32; state figures follow each state&apos;s
                Department of Revenue. Your actual paycheck depends on your W-4,
                employer payroll setup, and local taxes.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
