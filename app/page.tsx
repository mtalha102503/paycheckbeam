import Link from "next/link";
import PaycheckCalculator from "@/components/PaycheckCalculator";
import StateDirectory from "@/components/StateDirectory";
import FaqAccordion from "@/components/FaqAccordion";
import TrustStrip from "@/components/TrustStrip";
import { VERIFIED_STATE_COUNT, TODO_STATE_COUNT } from "@/lib/stateTaxData";
import {
  FEDERAL_BRACKETS_2026,
  STANDARD_DEDUCTION_2026,
} from "@/lib/paycheckCalc";

function BracketTable({
  status,
  title,
}: {
  status: "single" | "marriedFilingJointly";
  title: string;
}) {
  const brackets = FEDERAL_BRACKETS_2026[status];
  let prev = 0;
  return (
    <div>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <caption className="sr-only">
            2026 federal income tax brackets, {title}
          </caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-4 py-2.5 font-semibold text-slate-700">Taxable income</th>
              <th className="px-4 py-2.5 text-right font-semibold text-slate-700">Rate</th>
            </tr>
          </thead>
          <tbody>
            {brackets.map((b) => {
              const label =
                b.upTo === null
                  ? `Over $${prev.toLocaleString()}`
                  : prev === 0
                    ? `$0 – $${b.upTo.toLocaleString()}`
                    : `$${prev.toLocaleString()} – $${b.upTo.toLocaleString()}`;
              prev = b.upTo ?? prev;
              return (
                <tr key={b.ratePct} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-2.5 text-slate-600">{label}</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                    {b.ratePct}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">
      {children}
    </p>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.16" />
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

const FAQS = [
  {
    q: "How accurate is this paycheck calculator?",
    a: "Federal withholding follows the IRS Publication 15-T (2026) percentage method with a standard W-4, and reproduces the IRS examples exactly. State withholding uses verified 2026 state rates where available. Your real paycheck can still differ by a few dollars because of your full W-4 elections, employer payroll timing, and local taxes — treat the result as a planning estimate, not a pay stub.",
  },
  {
    q: "Does 401(k) lower my Social Security and Medicare tax?",
    a: "No. Traditional 401(k) contributions lower your federal income tax, but they are still subject to Social Security and Medicare taxes. Health-insurance premiums paid through a cafeteria (Section 125) plan lower both income tax and FICA — and this calculator models that difference. For state tax, most states follow the federal treatment, but Pennsylvania taxes 401(k) contributions, New Jersey taxes Section 125 premiums, FSAs and HSAs (but not 401(k)), and California taxes HSAs — the calculator applies each state's own verified rule.",
  },
  {
    q: "What is California SDI, and why does it lower my take-home pay?",
    a: "California's State Disability Insurance is a mandatory 1.3% payroll deduction in 2026 with no wage ceiling — $975 a year on a $75,000 salary. It is separate from California income tax and funds disability and Paid Family Leave benefits. Other states have their own versions (New York Paid Family Leave, New Jersey TDI and Family Leave, Washington PFML, and more) — the calculator deducts each program it has verified from an official state source, as its own line in your results.",
  },
  {
    q: "Does the calculator include overtime?",
    a: "Yes. Turn on overtime, enter your overtime hours per pay period and the multiplier (1.5× is the FLSA time-and-a-half default). Salaried workers get an hourly rate worked out from salary ÷ hours per week ÷ 52. When overtime is off, your gross pay counts straight time only and the results say so.",
  },
  {
    q: "Why is my state estimate missing for some states?",
    a: "It isn't — every state and DC now has a verified 2026 estimate, built from the Tax Foundation's 2026 tables and cross-checked against a second source. The estimate is based on annual-liability brackets rather than your employer's exact withholding table, and it excludes local (city/county) taxes, so your real paycheck can still differ by a few dollars.",
  },
  {
    q: "Which states have no income tax?",
    a: "Nine states tax no wage income in 2026: Alaska, Florida, Nevada, New Hampshire, South Dakota, Tennessee, Texas, Washington, and Wyoming. If you work in one of them, your state withholding line is $0.",
  },
  {
    q: "Is my salary data stored anywhere?",
    a: "No. The calculator runs entirely in your browser. Nothing you type is sent to a server, stored, or shared. See the privacy policy for details.",
  },
];

const STEPS = [
  {
    n: "1",
    t: "Annualize your pay",
    d: "Your per-period wage is multiplied out to a full year — daily × 260 working days, weekly × 52, biweekly × 26, twice a month × 24, monthly × 12, quarterly × 4, twice a year × 2, annually × 1. Overtime hours are added at your multiplier (default 1.5×).",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M16 2v4M8 2v4M3 9h18" />
      </svg>
    ),
  },
  {
    n: "2",
    t: "Subtract what isn't taxed",
    d: "Pre-tax 401(k), health and other deductions come off first — using each state's own rules for what counts (Pennsylvania taxes 401(k) contributions, New Jersey taxes Section 125 items, California taxes HSAs) — then the 2026 standard deduction ($16,100 single, $32,200 married filing jointly, $24,150 head of household).",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12h8" />
      </svg>
    ),
  },
  {
    n: "3",
    t: "Apply the 2026 brackets",
    d: "The remainder runs through the graduated federal brackets (10%–37%), Social Security at 6.2% up to $184,500, Medicare at 1.45% plus 0.9% over $200,000 for every filing status, your state tax, and state payroll programs like California SDI — then back down to one paycheck.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
        <path d="M3 3v18h18" />
        <path d="m7 14 4-4 3 3 5-6" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero — deep navy, dot + grid texture */}
      <section className="bg-hero-navy relative overflow-hidden">
        <div className="bg-hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="bg-hero-dots pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 pb-28 pt-12 sm:px-6 sm:pt-16">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-beam-300">
            2026 · IRS Pub 15-T tables
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl">
            See your real{" "}
            <span className="text-beam-300">take-home pay</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">
            Enter your pay and state. We apply the official 2026 federal
            withholding tables, Social Security, Medicare, and your state&apos;s
            income tax — and show your estimated take-home pay, per
            paycheck and per year.
          </p>
          <ul className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold text-slate-200">
            <li className="flex items-center gap-2">
              <CheckIcon className="h-5 w-5 text-emerald-400" />
              Free
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="h-5 w-5 text-emerald-400" />
              No sign-up
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="h-5 w-5 text-emerald-400" />
              Private — runs in your browser
            </li>
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#calculator"
              className="rounded-full bg-white px-5 py-3 text-sm font-extrabold text-navy-900 shadow-lg transition hover:bg-beam-100"
            >
              Calculate my paycheck
            </a>
            <a
              href="#states"
              className="rounded-full px-5 py-3 text-sm font-bold text-white ring-1 ring-white/40 transition hover:bg-white/10 hover:ring-white/70"
            >
              See all states →
            </a>
          </div>
        </div>
      </section>

      {/* Calculator — white card overlapping the hero */}
      <div id="calculator" className="relative z-10 mx-auto -mt-20 max-w-6xl scroll-mt-24 px-4 sm:px-6">
        <PaycheckCalculator />
        <TrustStrip />
        <p className="mt-4 text-center text-sm text-slate-500">
          {TODO_STATE_COUNT > 0
            ? `${VERIFIED_STATE_COUNT} states with verified 2026 rates, ${TODO_STATE_COUNT} more being verified against official sources.`
            : `All 50 states + DC with verified 2026 rates.`}
        </p>
      </div>

      {/* How it works — pale blue-grey */}
      <section className="mt-16 bg-mist-50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            How your paycheck is calculated
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <span className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-extrabold text-white ring-4 ring-blue-100">
                    {s.n}
                  </span>
                  <span className="text-blue-600">{s.icon}</span>
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-900">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Federal brackets — white */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <Eyebrow>2026 federal tables</Eyebrow>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            2026 federal tax brackets
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-slate-600">
            These are the official 2026 brackets from IRS Revenue Procedure
            2025-32. They apply to <em>taxable</em> income — what is left after
            the standard deduction — not to your gross salary. Only the dollars
            inside each bracket are taxed at that bracket&apos;s rate.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <BracketTable status="single" title="Single" />
            <BracketTable status="marriedFilingJointly" title="Married filing jointly" />
          </div>
          <p className="mt-5 text-sm text-slate-500">
            Standard deduction 2026: single ${STANDARD_DEDUCTION_2026.single.toLocaleString()} ·{" "}
            married filing jointly $
            {STANDARD_DEDUCTION_2026.marriedFilingJointly.toLocaleString()} · head of
            household ${STANDARD_DEDUCTION_2026.headOfHousehold.toLocaleString()}.
            Source: IRS Rev. Proc. 2025-32.
          </p>
        </div>
      </section>

      {/* State directory — pale blue-grey */}
      <section id="states" className="scroll-mt-20 bg-mist-50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <Eyebrow>By state</Eyebrow>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Paycheck calculator by state
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-slate-600">
            State income tax is the biggest reason two identical salaries take home
            different pay. Pick your state for its 2026 rate, withholding notes,
            and a calculator set to that state.
          </p>
          <div className="mt-8">
            <StateDirectory />
          </div>
        </div>
      </section>

      {/* FAQ — white, real accordion */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <Eyebrow>Questions</Eyebrow>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Frequently asked questions
          </h2>
          <div className="mt-8">
            <FaqAccordion faqs={FAQS} />
          </div>
          <p className="mt-8 text-sm text-slate-500">
            Still unsure?{" "}
            <Link href="/about" className="font-semibold text-blue-600 hover:underline">
              Read the full methodology →
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
