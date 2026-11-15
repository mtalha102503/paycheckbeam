import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import SiteHeader, { LogoMark } from "@/components/SiteHeader";

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
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Paycheck Calculator & Take-Home Pay by State (2026)`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Paycheck Calculator & Take-Home Pay by State (2026)`,
    description:
      "Free 2026 paycheck calculator. Federal, FICA, and state withholding for all 50 states — see your real take-home pay in seconds.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-white font-sans text-slate-900">
        <SiteHeader />

        <main className="flex-1">{children}</main>

        <footer className="bg-navy-950 text-slate-300">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            {/* Footer CTA */}
            <div className="flex flex-col items-start justify-between gap-5 rounded-3xl bg-white/[0.06] px-6 py-7 ring-1 ring-white/10 sm:flex-row sm:items-center">
              <div>
                <p className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                  Know what you actually take home.
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Free 2026 paycheck calculator — federal, FICA, and state tax for
                  all 50 states. No sign-up, nothing leaves your browser.
                </p>
              </div>
              <a
                href="/#calculator"
                className="shrink-0 rounded-full bg-white px-5 py-3 text-sm font-extrabold text-navy-900 shadow-lg transition hover:bg-beam-100"
              >
                Calculate my paycheck →
              </a>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <LogoMark />
                  <span className="text-base font-extrabold tracking-tight text-white">
                    Paycheck<span className="text-beam-300">Beam</span>
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  Free paycheck and take-home pay calculator for all 50 states,
                  using the official 2026 federal withholding tables.
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Popular calculators</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <Link href="/texas-paycheck-calculator" className="text-slate-400 transition hover:text-white">
                      Texas paycheck calculator
                    </Link>
                  </li>
                  <li>
                    <Link href="/california-paycheck-calculator" className="text-slate-400 transition hover:text-white">
                      California paycheck calculator
                    </Link>
                  </li>
                  <li>
                    <Link href="/florida-paycheck-calculator" className="text-slate-400 transition hover:text-white">
                      Florida paycheck calculator
                    </Link>
                  </li>
                  <li>
                    <Link href="/new-york-paycheck-calculator" className="text-slate-400 transition hover:text-white">
                      New York paycheck calculator
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Site</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <Link href="/blog" className="text-slate-400 transition hover:text-white">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="/author/muhammad-talha" className="text-slate-400 transition hover:text-white">
                      About the author
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="text-slate-400 transition hover:text-white">
                      About &amp; methodology
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-slate-400 transition hover:text-white">
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="text-slate-400 transition hover:text-white">
                      Privacy policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-slate-400 transition hover:text-white">
                      Terms of service
                    </Link>
                  </li>
                  <li>
                    <Link href="/disclaimer" className="text-slate-400 transition hover:text-white">
                      Disclaimer
                    </Link>
                  </li>
                  <li>
                    <Link href="/cookies" className="text-slate-400 transition hover:text-white">
                      Cookie policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-12 border-t border-white/10 pt-6 text-xs leading-relaxed text-slate-400">
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
