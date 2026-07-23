"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/storefront/locale-provider";

const CONSENT_KEY = "hustle_cookie_consent";

export function CookieConsent() {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage is client-only, after mount
    setVisible(localStorage.getItem(CONSENT_KEY) !== "1");
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 mx-4 mb-4 flex flex-col gap-3 border border-matte-black/10 bg-off-white px-5 py-4 text-matte-black shadow-lg sm:inset-x-auto sm:right-6 sm:max-w-sm md:bottom-6">
      <p className="font-ui text-sm">
        {t("cookie_notice")}{" "}
        <Link href="/privacy" className="underline hover:text-neon-accent">
          {t("legal_privacy")}
        </Link>
      </p>
      <button
        onClick={() => {
          localStorage.setItem(CONSENT_KEY, "1");
          setVisible(false);
        }}
        className="self-start bg-matte-black px-5 py-2 font-mono text-xs uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black"
      >
        {t("cookie_accept")}
      </button>
    </div>
  );
}
