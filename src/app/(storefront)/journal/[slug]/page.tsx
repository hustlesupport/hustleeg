import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { getLocale } from "@/lib/locale-cookie";
import { pickLocalized, isRtl } from "@/lib/i18n";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.journalPost.findUnique({ where: { slug } });
  return { title: post?.title ?? "Journal" };
}

export default async function JournalPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, locale] = await Promise.all([
    db.journalPost.findUnique({ where: { slug } }),
    getLocale(),
  ]);
  if (!post || !post.publishedAt) notFound();

  const displayTitle = pickLocalized(post.title, post.titleAr, locale);
  const displayBody = pickLocalized(post.body, post.bodyAr, locale);

  if (post.membersOnly) {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return (
        <div className="mx-auto max-w-md px-6 py-24 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-neon-accent mb-4">
            Members only
          </p>
          <h1 className="font-display text-2xl mb-6">{displayTitle}</h1>
          <p className="font-ui text-sm text-concrete-grey mb-8">
            This story — BTS video, moodboards, and all — is for signed-in members.
          </p>
          <Link
            href={`/account/login?from=/journal/${slug}`}
            className="inline-block bg-matte-black px-6 py-3 font-mono text-sm uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black"
          >
            Sign in
          </Link>
        </div>
      );
    }
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      {post.membersOnly && (
        <p className="font-mono text-xs uppercase tracking-widest text-neon-accent mb-4">Members only</p>
      )}
      {post.coverImage && (
        <div className="relative aspect-[16/9] mb-10 bg-concrete-grey/15">
          <Image src={post.coverImage} alt={displayTitle} fill className="object-cover" />
        </div>
      )}
      <h1 className="font-display text-4xl mb-4">{displayTitle}</h1>
      {post.author && <p className="font-mono text-xs text-concrete-grey mb-10">By {post.author}</p>}
      <div dir={isRtl(locale) ? "rtl" : "ltr"} className="font-ui text-base leading-relaxed whitespace-pre-line">
        {displayBody}
      </div>
    </article>
  );
}
