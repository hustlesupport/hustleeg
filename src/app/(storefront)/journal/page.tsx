import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";

export const revalidate = 120;
export const metadata = { title: "Journal" };

export default async function JournalIndexPage() {
  const posts = await db.journalPost.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-display text-3xl mb-10">Journal</h1>
      <div className="grid gap-10 sm:grid-cols-2">
        {posts.map((post) => (
          <Link key={post.id} href={`/journal/${post.slug}`} className="group block">
            <div className="relative aspect-[4/3] bg-concrete-grey/15">
              {post.coverImage && (
                <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
              )}
            </div>
            <p className="mt-3 font-ui text-lg group-hover:text-neon-accent">
              {post.title} {post.membersOnly && <span className="text-neon-accent">· Members</span>}
            </p>
            {post.excerpt && <p className="font-mono text-xs text-concrete-grey mt-1">{post.excerpt}</p>}
          </Link>
        ))}
        {posts.length === 0 && (
          <p className="font-mono text-sm text-concrete-grey">No stories published yet.</p>
        )}
      </div>
    </div>
  );
}
