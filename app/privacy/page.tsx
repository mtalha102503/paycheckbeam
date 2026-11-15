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

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        Third-party advertising
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        PaycheckBeam currently shows no advertising. If advertising is
        added in the future — for example, through Google AdSense —
        third-party vendors, including Google, may use cookies to serve
        ads based on your prior visits to this or other websites.
        Google&apos;s use of advertising cookies enables it and its
        partners to serve ads to you based on your visit to this site
        and other sites on the internet. You can opt out of personalized
        advertising at any time through{" "}
        <a
          href="https://adssettings.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-blue-600 hover:underline"
        >
          Google Ad Settings
        </a>{" "}
        or through{" "}
        <a
          href="https://optout.aboutads.info/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-blue-600 hover:underline"
        >
          aboutads.info
        </a>
        . See the{" "}
        <a href="/cookies" className="font-semibold text-blue-600 hover:underline">
          Cookie Policy
        </a>{" "}
        for more detail.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        Your rights — California
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        Under the California Consumer Privacy Act (CCPA), as amended by
        the CPRA, California residents have the right to know what
        personal information is collected about them, to request its
        deletion or correction, and to opt out of its sale or sharing.
        PaycheckBeam does not sell or share personal information — it
        collects none in the first place, beyond an email you choose to
        send us. To make a privacy request, email{" "}
        <a
          href="mailto:contact@paycheckbeam.com"
          className="font-semibold text-blue-600 hover:underline"
        >
          contact@paycheckbeam.com
        </a>{" "}
        with the subject &ldquo;Privacy request&rdquo;; we will respond
        within the time required by law.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        Your rights — European Union and United Kingdom
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        If you are in the EU or the UK, the General Data Protection
        Regulation (GDPR) gives you the right to access, rectify, erase,
        restrict, or port personal information held about you, and to
        object to its processing. Because PaycheckBeam collects no
        personal information through the site itself, there is normally
        nothing to access or erase — the only personal information we
        may hold is an email you sent us, which we use only to reply.
        You may request its deletion at any time by emailing{" "}
        <a
          href="mailto:contact@paycheckbeam.com"
          className="font-semibold text-blue-600 hover:underline"
        >
          contact@paycheckbeam.com
        </a>
        . You also have the right to complain to your local data
        protection authority.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        Children&apos;s privacy
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        PaycheckBeam is not directed at children under 13, and we do not
        knowingly collect personal information from children. If you
        believe a child has sent us personal information, email{" "}
        <a
          href="mailto:contact@paycheckbeam.com"
          className="font-semibold text-blue-600 hover:underline"
        >
          contact@paycheckbeam.com
        </a>{" "}
        and we will delete it.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">
        Data retention
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        Email correspondence is kept only as long as needed to reply and
        to follow up on the matter raised, then deleted. We keep no
        other visitor data, because we collect none.
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
