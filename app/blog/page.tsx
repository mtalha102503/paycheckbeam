import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog";

export const metadata: Metadata = {
  title: "PaycheckBeam Blog — Guides to Take-Home Pay",
  description:
    "Guides to calculating your paycheck, reading your pay stub, and understanding federal and state withholding — with the verified 2026 figures.",
};

export default function BlogIndex() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        Guides to take-home pay
      </h1>
      <p className="mt-3 max-w-3xl leading-relaxed text-slate-600">
        Step-by-step guides to calculating your paycheck, reading your pay
        stub, and understanding what comes out of your pay — written
        against the same verified 2026 figures the calculator uses.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {BLOG_POSTS.map((post) => (
          <article
            key={post.slug}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-600/40 hover:shadow-md"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              {post.date} · {post.readMinutes} min read
            </p>
            <h2 className="mt-2 text-xl font-extrabold leading-snug text-slate-900">
              <Link href={`/blog/${post.slug}`} className="hover:text-blue-600">
                {post.title}
              </Link>
            </h2>
            <p className="mt-2 flex-1 leading-relaxed text-slate-600">
              {post.description}
            </p>
            <Link
              href={`/blog/${post.slug}`}
              className="mt-4 text-sm font-bold text-blue-600 hover:underline"
            >
              Read the guide →
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
