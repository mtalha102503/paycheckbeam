/**
 * PaycheckBeam — StateGuides aggregator: the 48 state-guide batches
 * (every state except the CA/TX/NY exemplars, which live in
 * components/StateExemplars.tsx and are frozen).
 *
 * Each batch exports BATCH_SLUGS, BatchContent, BATCH_FAQS and
 * BATCH_SOURCES. This module merges them into the single lookups the
 * [stateSlug] page uses, and renders the matching batch's content.
 * Batch slugs are disjoint by construction; mergeRecords() throws at
 * module load on a duplicate slug rather than silently shadowing a
 * state, so a bad merge fails the build instead of a page.
 */
import type { FaqItem } from "@/components/FaqAccordion";
import {
  BatchContent as SouthCentralContent,
  BATCH_FAQS as SOUTH_CENTRAL_FAQS,
  BATCH_SLUGS as SOUTH_CENTRAL_SLUGS,
  BATCH_SOURCES as SOUTH_CENTRAL_SOURCES,
} from "./batch-southcentral";
import {
  BatchContent as WestContent,
  BATCH_FAQS as WEST_FAQS,
  BATCH_SLUGS as WEST_SLUGS,
  BATCH_SOURCES as WEST_SOURCES,
} from "./batch-west";
import {
  BatchContent as NortheastContent,
  BATCH_FAQS as NORTHEAST_FAQS,
  BATCH_SLUGS as NORTHEAST_SLUGS,
  BATCH_SOURCES as NORTHEAST_SOURCES,
} from "./batch-northeast";
import {
  BatchContent as MidAtlanticContent,
  BATCH_FAQS as MID_ATLANTIC_FAQS,
  BATCH_SLUGS as MID_ATLANTIC_SLUGS,
  BATCH_SOURCES as MID_ATLANTIC_SOURCES,
} from "./batch-midatlantic";
import {
  BatchContent as MountainContent,
  BATCH_FAQS as MOUNTAIN_FAQS,
  BATCH_SLUGS as MOUNTAIN_SLUGS,
  BATCH_SOURCES as MOUNTAIN_SOURCES,
} from "./batch-mountain";
import {
  BatchContent as MidwestContent,
  BATCH_FAQS as MIDWEST_FAQS,
  BATCH_SLUGS as MIDWEST_SLUGS,
  BATCH_SOURCES as MIDWEST_SOURCES,
} from "./batch-midwest";

export type GuideSourceLink = { label: string; url: string };

function mergeRecords<T>(
  label: string,
  parts: Record<string, T>[],
): Record<string, T> {
  const out: Record<string, T> = {};
  for (const part of parts) {
    for (const [k, v] of Object.entries(part)) {
      if (out[k] !== undefined) {
        throw new Error(`StateGuides: duplicate slug ${k} in ${label}`);
      }
      out[k] = v;
    }
  }
  return out;
}

export const GUIDE_SLUGS: string[] = [
  ...SOUTH_CENTRAL_SLUGS,
  ...WEST_SLUGS,
  ...NORTHEAST_SLUGS,
  ...MID_ATLANTIC_SLUGS,
  ...MOUNTAIN_SLUGS,
  ...MIDWEST_SLUGS,
];

export const GUIDE_FAQS: Record<string, FaqItem[]> = mergeRecords(
  "BATCH_FAQS",
  [
    SOUTH_CENTRAL_FAQS,
    WEST_FAQS,
    NORTHEAST_FAQS,
    MID_ATLANTIC_FAQS,
    MOUNTAIN_FAQS,
    MIDWEST_FAQS,
  ],
);

export const GUIDE_SOURCES: Record<string, GuideSourceLink[]> = mergeRecords(
  "BATCH_SOURCES",
  [
    SOUTH_CENTRAL_SOURCES,
    WEST_SOURCES,
    NORTHEAST_SOURCES,
    MID_ATLANTIC_SOURCES,
    MOUNTAIN_SOURCES,
    MIDWEST_SOURCES,
  ],
);

/** Deep guide content for one of the 48 batch states; null otherwise. */
export function GuideContent({ slug }: { slug: string }) {
  if (SOUTH_CENTRAL_SLUGS.includes(slug)) {
    return <SouthCentralContent slug={slug} />;
  }
  if (WEST_SLUGS.includes(slug)) {
    return <WestContent slug={slug} />;
  }
  if (NORTHEAST_SLUGS.includes(slug)) {
    return <NortheastContent slug={slug} />;
  }
  if (MID_ATLANTIC_SLUGS.includes(slug)) {
    return <MidAtlanticContent slug={slug} />;
  }
  if (MOUNTAIN_SLUGS.includes(slug)) {
    return <MountainContent slug={slug} />;
  }
  if (MIDWEST_SLUGS.includes(slug)) {
    return <MidwestContent slug={slug} />;
  }
  return null;
}
