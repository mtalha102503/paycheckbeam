import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy — PaycheckBeam",
  description:
    "PaycheckBeam cookie policy: the calculator sets no first-party cookies; third-party advertising cookies apply only if ads are shown.",
};

export default function Cookies() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        Cookie Policy
      </h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: November 15, 2026</p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        What cookies are
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        Cookies are small text files that a website asks your browser to
        store on your device. They are commonly used to remember
        preferences, measure traffic, and serve advertising.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        Cookies PaycheckBeam sets: none
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        PaycheckBeam sets no first-party cookies. The calculator runs
        entirely in your browser: the salary, filing status, state, and
        deductions you type are used only to compute the numbers on your
        screen and are never stored, in a cookie or anywhere else. There
        are no accounts, no sign-up, and no login.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        Third-party cookies and advertising
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        PaycheckBeam currently shows no advertising and uses no analytics.
        If advertising is added in the future — for example, through
        Google AdSense — the advertising provider and its partners may
        use cookies to serve ads based on your prior visits to this or
        other websites. Google&apos;s use of advertising cookies enables
        it and its partners to serve ads to you based on your visit to
        this site and other sites on the internet. You can opt out of
        personalized advertising at any time through{" "}
        <a
          href="https://adssettings.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-blue-600 hover:underline"
        >
          Google Ad Settings
        </a>
        , or through the opt-out pages of the{" "}
        <a
          href="https://optout.aboutads.info/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-blue-600 hover:underline"
        >
          Digital Advertising Alliance
        </a>{" "}
        and the{" "}
        <a
          href="https://optout.networkadvertising.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-blue-600 hover:underline"
        >
          Network Advertising Initiative
        </a>
        .
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        Analytics
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        No analytics tool is currently in use. If basic, privacy-
        respecting analytics are added in the future (for example, to see
        which state pages are most visited), this policy — and the{" "}
        <a href="/privacy" className="font-semibold text-blue-600 hover:underline">
          Privacy Policy
        </a>{" "}
        — will be updated to say so before it goes live.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        Managing cookies in your browser
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        You can delete cookies already stored on your device and block
        cookies entirely through your browser&apos;s settings — usually
        under Privacy or Security. Blocking cookies does not affect the
        PaycheckBeam calculator, because it does not depend on any
        cookie.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        Changes and contact
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        If this policy changes, the &ldquo;last updated&rdquo; date above
        will change with it. Questions about cookies or privacy:{" "}
        <a
          href="mailto:contact@paycheckbeam.com"
          className="font-semibold text-blue-600 hover:underline"
        >
          contact@paycheckbeam.com
        </a>
        .
      </p>
    </div>
  );
}
