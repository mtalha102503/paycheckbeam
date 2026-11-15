"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { STATE_TAX_DATA, topRatePct, type StateTaxInfo } from "@/lib/stateTaxData";

type Filter = "all" | "none" | "flat" | "graduated";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All states" },
  { id: "none", label: "No income tax" },
  { id: "flat", label: "Flat rate" },
  { id: "graduated", label: "Graduated" },
];

const FEATURED_SLUGS = [
  "texas-paycheck-calculator",
  "california-paycheck-calculator",
  "florida-paycheck-calculator",
  "new-york-paycheck-calculator",
];

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function RatePill({ state }: { state: StateTaxInfo }) {
  if (state.structure === "none") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-extrabold text-emerald-800">
        0% — no income tax
      </span>
    );
  }
  if (state.structure === "flat") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
        Flat {state.flatRatePct}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
      Top {topRatePct(state)}%
    </span>
  );
}

function StateCard({ state, featured }: { state: StateTaxInfo; featured?: boolean }) {
  return (
    <Link
      href={`/${state.slug}`}
      className={`group relative block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-600 hover:shadow-lg ${
        featured ? "sm:p-5" : ""
      }`}
    >
      <span className="flex items-start justify-between gap-2">
        <span
          className={`inline-flex items-center justify-center rounded-lg bg-navy-900 font-extrabold text-white ${
            featured ? "h-11 w-11 text-base" : "h-9 w-9 text-sm"
          }`}
          aria-hidden="true"
        >
          {state.abbreviation}
        </span>
        <ArrowIcon className="mt-1 h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
      </span>
      <span className="mt-3 block text-sm font-bold text-slate-900 group-hover:text-blue-700 sm:text-base">
        {state.state}
      </span>
      <span className="mt-2 block">
        <RatePill state={state} />
      </span>
      {featured && state.structure === "none" && (
        <span className="mt-2 block text-xs leading-relaxed text-slate-500">
          Keep your whole state share — $0 withheld.
        </span>
      )}
      {featured && state.structure !== "none" && (
        <span className="mt-2 block text-xs leading-relaxed text-slate-500">
          {state.structure === "flat"
            ? `One flat rate on taxable income.`
            : `Graduated brackets — top rate ${topRatePct(state)}%.`}
        </span>
      )}
    </Link>
  );
}

export default function StateDirectory() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const featured = useMemo(
    () =>
      FEATURED_SLUGS.map((slug) =>
        STATE_TAX_DATA.find((s) => s.slug === slug),
      ).filter((s): s is StateTaxInfo => Boolean(s)),
    [],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STATE_TAX_DATA.filter((s) => {
      if (filter !== "all" && s.structure !== filter) return false;
      if (!q) return true;
      return (
        s.state.toLowerCase().includes(q) ||
        s.abbreviation.toLowerCase().includes(q)
      );
    });
  }, [query, filter]);

  return (
    <div>
      {/* Featured row */}
      <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
        Most searched
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {featured.map((s) => (
          <StateCard key={s.slug} state={s} featured />
        ))}
      </div>

      {/* Search + filters */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <label htmlFor="state-search" className="sr-only">
            Search states
          </label>
          <input
            id="state-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a state — try “Texas” or “NY”…"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by tax structure">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
                filter === f.id
                  ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-500" aria-live="polite">
        {results.length === 0
          ? `No states match “${query}”.`
          : `Showing ${results.length} of ${STATE_TAX_DATA.length} states + DC.`}
      </p>

      {/* Full grid */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {results.map((s) => (
          <StateCard key={s.slug} state={s} />
        ))}
      </div>
      {results.length === 0 && (
        <p className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          Try a full state name (“California”) or a two-letter code (“CA”).
        </p>
      )}
    </div>
  );
}
