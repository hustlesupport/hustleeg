import Link from "next/link";
import { db } from "@/lib/db";

export const metadata = { title: "Journal" };

export default async function AdminJournalPage() {
  const posts = await db.journalPost.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl">Journal</h1>
        <Link
          href="/admin/journal/new"
          className="bg-matte-black px-5 py-2 font-mono text-xs uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black"
        >
          New post
        </Link>
      </div>

      <table className="w-full border-collapse font-mono text-xs">
        <thead>
          <tr className="border-b border-matte-black/10 text-left text-concrete-grey">
            <th className="py-2">Title</th>
            <th className="py-2">Author</th>
            <th className="py-2">Status</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <tr key={p.id} className="border-b border-matte-black/5">
              <td className="py-3">{p.title}</td>
              <td className="py-3">{p.author ?? "—"}</td>
              <td className="py-3">
                <span className={p.publishedAt ? "text-neon-accent" : "text-concrete-grey"}>
                  {p.publishedAt ? "Published" : "Draft"}
                </span>
              </td>
              <td className="py-3">
                <Link href={`/admin/journal/${p.id}`} className="hover:text-neon-accent">
                  Edit
                </Link>
              </td>
            </tr>
          ))}
          {posts.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-concrete-grey">
                No journal posts yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
