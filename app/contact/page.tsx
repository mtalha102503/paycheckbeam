import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact PaycheckBeam",
  description: "Contact PaycheckBeam — corrections, missing state tables, or feedback on the calculator.",
};

export default function Contact() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        Contact
      </h1>
      <p className="mt-4 leading-relaxed text-slate-600">
        Found a wrong number, a state table we haven&apos;t verified yet, or
        something the calculator should handle better? Tell us — corrections
        backed by an official source get fixed first.
      </p>
      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Email
        </p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="mt-1 block text-xl font-bold text-blue-600 hover:underline"
        >
          {CONTACT_EMAIL}
        </a>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Please include the state and the figure you&apos;re questioning, plus a
          link to the official source (IRS, SSA, or the state Department of
          Revenue) if you have one.
        </p>
      </div>
      <p className="mt-8 text-sm leading-relaxed text-slate-500">
        We can&apos;t give personal tax advice by email. For questions about your
        own withholding, your payroll department or a qualified tax
        professional is the right place to ask.
      </p>
    </div>
  );
}
