"use client";

import { useEffect } from "react";

const COOKIE_NAME = "hustle_recently_viewed";
const MAX_ITEMS = 8;

/** Invisible — just records the current product slug into a cookie on mount. */
export function RecentlyViewedTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
    let slugs: string[] = [];
    if (match) {
      try {
        slugs = JSON.parse(decodeURIComponent(match[1]));
      } catch {
        slugs = [];
      }
    }

    const next = [slug, ...slugs.filter((s) => s !== slug)].slice(0, MAX_ITEMS);
    const maxAge = 60 * 60 * 24 * 90;
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(next))}; path=/; max-age=${maxAge}; samesite=lax`;
  }, [slug]);

  return null;
}
