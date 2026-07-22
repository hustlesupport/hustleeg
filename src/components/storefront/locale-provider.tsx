"use client";

import { createContext, useContext, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { setLocaleAction } from "@/actions/locale";
import { t as translate, isRtl, type Locale, type TranslationKey } from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  t: (key: TranslationKey) => string;
  isRtl: boolean;
  setLocale: (locale: Locale) => void;
  isPending: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setLocale(next: Locale) {
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  }

  return (
    <LocaleContext.Provider
      value={{
        locale,
        t: (key) => translate(locale, key),
        isRtl: isRtl(locale),
        setLocale,
        isPending,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
