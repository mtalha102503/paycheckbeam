import type { ComponentType } from "react";
import HowToReadPayStub from "@/components/BlogPosts/HowToReadPayStub";

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  datePublished: string;
  dateModified: string;
  readMinutes: number;
  component: ComponentType;
}

export interface AuthorInfo {
  name: string;
  slug: string;
  role: string;
  image: string;
  path: string;
  bioShort: string;
  bioLong: string[];
  sameAs: string[];
}

export const AUTHOR: AuthorInfo = {
  name: "Muhammad Talha",
  slug: "muhammad-talha",
  role: "Founder, HireSkys",
  image: "/muhammad-talha.jpg",
  path: "/author/muhammad-talha",
  bioShort:
    "Founder of HireSkys. Muhammad Talha built PaycheckBeam on the official 2026 IRS withholding tables and verified state tax data — so workers can see their real take-home pay, not a rough estimate.",
  bioLong: [
    "Muhammad Talha is the founder of HireSkys, the remote-jobs platform behind PaycheckBeam. He built PaycheckBeam to turn the IRS's 2026 withholding tables and every state's tax rules into a calculator anyone can use — type in your pay, pick your state, and see exactly what lands in your bank account.",
    "His work focuses on the numbers behind a paycheck: how federal withholding, Social Security, Medicare, and state taxes actually interact — including the details most calculators get wrong, like 401(k) contributions lowering income tax but not FICA, and the state payroll-insurance programs most tools ignore. Every guide on this site is written from the official 2026 figures and checked against IRS publications and state revenue sources.",
  ],
  sameAs: ["https://www.hireskys.com", "https://github.com/mtalha102503"],
};

export const BLOG_POSTS: BlogPostMeta[] = [
  {
    slug: "how-to-read-a-pay-stub",
    title: "How to Read a Pay Stub: Every Line Explained (2026)",
    description:
      "Read your pay stub line by line: gross pay, federal withholding, Social Security and Medicare, pre-tax and post-tax deductions, net pay, and the YTD column — with a worked sample stub using the verified 2026 figures.",
    date: "November 15, 2026",
    datePublished: "2026-11-15",
    dateModified: "2026-11-15",
    readMinutes: 11,
    component: HowToReadPayStub,
  },
];

export function getBlogPost(slug: string): BlogPostMeta | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
