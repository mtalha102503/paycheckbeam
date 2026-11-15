import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS, getBlogPost, AUTHOR } from "@/lib/blog";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: `${post.title} — PaycheckBeam`,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article",
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified,
      siteName: SITE_NAME,
      images: [
        {
          url: `/blog/${post.slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();
  const Post = post.component;
  const url = `${SITE_URL}/blog/${post.slug}`;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: post.title,
        description: post.description,
        url,
        datePublished: post.datePublished,
        dateModified: post.dateModified,
        author: {
          "@type": "Person",
          name: AUTHOR.name,
          url: `${SITE_URL}${AUTHOR.path}`,
          image: `${SITE_URL}${AUTHOR.image}`,
        },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          url: `${SITE_URL}/`,
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/opengraph-image`,
          },
        },
        image: `${SITE_URL}/blog/${post.slug}/opengraph-image`,
        mainEntityOfPage: url,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${SITE_URL}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Guides",
            item: `${SITE_URL}/blog`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
            item: url,
          },
        ],
      },
    ],
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <p className="text-sm font-semibold">
        <Link href="/blog" className="text-blue-600 hover:underline">
          ← All guides
        </Link>
      </p>
      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
        By{" "}
        <Link
          href={AUTHOR.path}
          className="text-blue-600 hover:underline"
        >
          {AUTHOR.name}
        </Link>{" "}
        · {post.date} · {post.readMinutes} min read
      </p>
      <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
        {post.title}
      </h1>
      <Post />

      {/* Author box */}
      <section className="mt-12 flex gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={AUTHOR.image}
          alt={AUTHOR.name}
          width={72}
          height={72}
          className="h-[72px] w-[72px] shrink-0 rounded-full object-cover"
        />
        <div>
          <p className="font-bold text-slate-900">
            <Link href={AUTHOR.path} className="hover:text-blue-700">
              {AUTHOR.name}
            </Link>
          </p>
          <p className="text-sm font-medium text-blue-700">{AUTHOR.role}</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {AUTHOR.bioShort}
          </p>
          <Link
            href={AUTHOR.path}
            className="mt-2 inline-block text-sm font-semibold text-blue-700 hover:underline"
          >
            More from {AUTHOR.name} →
          </Link>
        </div>
      </section>
    </div>
  );
}
