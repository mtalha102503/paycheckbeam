"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function LogoMark() {
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

const NAV_LINKS = [
  { href: "/", label: "Calculator" },
  { href: "/#states", label: "States" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
] as const;

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  // Close the mobile menu on Escape.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open ]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Paycheck<span className="text-blue-600">Beam</span>
          </span>
        </Link>

        {/* Desktop nav — unchanged from before, md and up. */}
        <nav
          aria-label="Main"
          className="hidden items-center gap-1 text-sm font-semibold md:flex sm:gap-2"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/#calculator"
            className="ml-1 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            Calculate
          </Link>
        </nav>

        {/* Hamburger — mobile only (below md). 44x44 tap target. */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((value) => !value)}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 md:hidden"
        >
          {open ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu panel — same links as the desktop nav. */}
      {open && (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="border-t border-slate-200 bg-white md:hidden"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/#calculator"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-full bg-blue-600 px-4 py-3 text-center text-base font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              Calculate
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
