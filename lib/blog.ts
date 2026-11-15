import type { ComponentType } from "react";
import HowToReadPayStub from "@/components/BlogPosts/HowToReadPayStub";

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  readMinutes: number;
  component: ComponentType;
}

export const BLOG_POSTS: BlogPostMeta[] = [
  {
    slug: "how-to-read-a-pay-stub",
    title: "How to Read a Pay Stub: Every Line Explained (2026)",
    description:
      "Read your pay stub line by line: gross pay, federal withholding, Social Security and Medicare, pre-tax and post-tax deductions, net pay, and the YTD column — with a worked sample stub using the verified 2026 figures.",
    date: "November 15, 2026",
    readMinutes: 11,
    component: HowToReadPayStub,
  },
];

export function getBlogPost(slug: string): BlogPostMeta | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
