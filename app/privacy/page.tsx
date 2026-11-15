import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — PaycheckBeam",
  description:
    "PaycheckBeam privacy policy: the calculator runs entirely in your browser. No accounts, no salary data stored, no tracking of what you type.",
};

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: November 15, 2026</p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        The calculator keeps nothing
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        The paycheck calculator runs entirely in your browser. The salary,
        filing status, state, and deductions you type are used only to compute
        the numbers on your screen. They are never sent to a server, stored in
        a database, or shared with anyone — because there is no server side to
        this calculation at all.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">Accounts</h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        PaycheckBeam has no accounts, no sign-up, and no login. There is
        nothing to create and nothing to delete.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        Cookies and analytics
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        We do not use cookies to track individual visitors, and we do not sell
        or share personal information — we don&apos;t collect any in the first
        place. If basic, privacy-respecting analytics are added in the future
        (for example, to see which state pages are most visited), this policy
        will be updated to say so before it goes live.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">Contact email</h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        If you email us, we receive your email address and the contents of your
        message, and use them only to reply to you. We do not add email
        addresses to any mailing list.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">Changes</h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        If this policy changes, the &quot;last updated&quot; date above will
        change with it.
      </p>
    </div>
  );
}
