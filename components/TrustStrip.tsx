import Link from "next/link";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.14" />
      <path
        d="M6 10.2 8.8 13 14 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10Z" />
      <path d="m9 11.5 2 2 4-4.5" />
    </svg>
  );
}

/** Trust strip shown directly under the calculator on the homepage. */
export default function TrustStrip() {
  return (
    <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-slate-700">
        <li className="flex items-center gap-2">
          <CheckIcon className="h-5 w-5 text-emerald-600" />
          Free forever
        </li>
        <li className="flex items-center gap-2">
          <CheckIcon className="h-5 w-5 text-emerald-600" />
          No sign-up
        </li>
        <li className="flex items-center gap-2">
          <CheckIcon className="h-5 w-5 text-emerald-600" />
          Private — runs in your browser
        </li>
      </ul>
      <Link
        href="/about"
        className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-100"
      >
        <ShieldIcon className="h-4 w-4" />
        Verified 15 Nov 2026 · IRS Pub 15-T · Tax Foundation 2026 tables
        <span className="text-emerald-600 transition group-hover:translate-x-0.5" aria-hidden="true">
          →
        </span>
        <span className="sr-only">See methodology</span>
      </Link>
    </div>
  );
}
