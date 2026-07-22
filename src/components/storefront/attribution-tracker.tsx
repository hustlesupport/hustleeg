"use client";

import { useEffect } from "react";
import { captureAttributionAction } from "@/actions/attribution";

function detectSource(): string {
  const params = new URLSearchParams(window.location.search);
  const utm = params.get("utm_source");
  if (utm) return utm;

  if (!document.referrer) return "direct";
  try {
    const host = new URL(document.referrer).hostname;
    if (host.includes("instagram")) return "instagram";
    if (host.includes("tiktok")) return "tiktok";
    if (host.includes("facebook") || host.includes("fb.com")) return "facebook";
    if (host.includes("google")) return "google";
    return host;
  } catch {
    return "direct";
  }
}

/** Invisible — captures first-touch attribution once per visitor. */
export function AttributionTracker() {
  useEffect(() => {
    captureAttributionAction(detectSource());
  }, []);

  return null;
}
