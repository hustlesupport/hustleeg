import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-off-white px-6 text-center text-matte-black">
      <p className="font-mono text-xs uppercase tracking-widest text-neon-accent mb-3">404</p>
      <h1 className="font-display text-4xl sm:text-6xl">Page not found</h1>
      <p className="mt-4 max-w-md font-ui text-concrete-grey">
        This page doesn&apos;t exist, or the drop already sold out and moved on.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block bg-matte-black px-8 py-3 font-mono text-sm uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black"
      >
        Back to home
      </Link>
    </div>
  );
}
