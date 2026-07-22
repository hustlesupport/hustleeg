export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

// Chrome/UI strings only — product, campaign, and journal content is
// author-entered in the admin and stays whatever language it was written
// in (Arabic content fields are a content-model addition for later, not a
// translation-at-render-time problem). This covers navigation, cart,
// checkout, account, and common actions, which is what a shopper interacts
// with on every single page regardless of catalog content.
const dictionary = {
  nav_essentials: { en: "Essentials", ar: "أساسيات" },
  nav_studio: { en: "Studio", ar: "استوديو" },
  nav_graffiti: { en: "Graffiti", ar: "جرافيتي" },
  nav_journal: { en: "Journal", ar: "المجلة" },
  nav_drop: { en: "Drop", ar: "الإصدار" },
  nav_search: { en: "Search", ar: "بحث" },
  nav_account: { en: "Account", ar: "حسابي" },
  nav_bag: { en: "Bag", ar: "الحقيبة" },
  nav_home: { en: "Home", ar: "الرئيسية" },
  nav_drops: { en: "Drops", ar: "الإصدارات" },

  cart_title: { en: "Bag", ar: "الحقيبة" },
  cart_close: { en: "Close", ar: "إغلاق" },
  cart_empty: { en: "Your bag is empty.", ar: "حقيبتك فارغة." },
  cart_subtotal: { en: "Subtotal", ar: "المجموع الفرعي" },
  cart_checkout: { en: "Checkout", ar: "إتمام الشراء" },
  cart_free_shipping_unlocked: { en: "Free shipping unlocked", ar: "شحن مجاني مفعّل" },
  cart_free_shipping_away: { en: "away from free shipping", ar: "متبقٍ للشحن المجاني" },
  cart_remove: { en: "Remove", ar: "إزالة" },

  product_add_to_bag: { en: "Add to bag", ar: "أضف إلى الحقيبة" },
  product_sold_out: { en: "Sold out", ar: "نفدت الكمية" },
  product_adding: { en: "Adding…", ar: "جارٍ الإضافة…" },
  product_add_to_wishlist: { en: "Add to wishlist", ar: "أضف إلى المفضلة" },
  product_saved_to_wishlist: { en: "Saved to wishlist", ar: "أُضيف إلى المفضلة" },
  product_notify_me: { en: "Notify me", ar: "أعلمني" },
  product_reviews: { en: "Reviews", ar: "التقييمات" },
  product_size: { en: "Size", ar: "المقاس" },

  checkout_title: { en: "Checkout", ar: "إتمام الشراء" },
  checkout_contact: { en: "Contact", ar: "بيانات التواصل" },
  checkout_shipping_address: { en: "Shipping address", ar: "عنوان الشحن" },
  checkout_payment: { en: "Payment", ar: "الدفع" },
  checkout_cod: { en: "Cash on Delivery", ar: "الدفع عند الاستلام" },
  checkout_place_order: { en: "Place order", ar: "إتمام الطلب" },
  checkout_order_summary: { en: "Order summary", ar: "ملخص الطلب" },
  checkout_full_name: { en: "Full name", ar: "الاسم بالكامل" },
  checkout_phone: { en: "Phone", ar: "رقم الهاتف" },
  checkout_email: { en: "Email", ar: "البريد الإلكتروني" },
  checkout_city: { en: "City", ar: "المدينة" },
  checkout_area: { en: "Area / District", ar: "المنطقة / الحي" },
  checkout_street: { en: "Street", ar: "الشارع" },

  account_overview: { en: "Overview", ar: "نظرة عامة" },
  account_orders: { en: "Orders", ar: "الطلبات" },
  account_addresses: { en: "Addresses", ar: "العناوين" },
  account_wishlist: { en: "Wishlist", ar: "المفضلة" },
  account_returns: { en: "Returns", ar: "المرتجعات" },
  account_referrals: { en: "Referrals", ar: "الإحالات" },
  account_profile: { en: "Profile", ar: "الملف الشخصي" },
  account_sign_in: { en: "Sign in", ar: "تسجيل الدخول" },
  account_sign_out: { en: "Sign out", ar: "تسجيل الخروج" },
  account_create_account: { en: "Create account", ar: "إنشاء حساب" },

  footer_shop: { en: "Shop", ar: "تسوق" },
  footer_community: { en: "Community", ar: "المجتمع" },
  footer_join: { en: "Join the community", ar: "انضم إلى المجتمع" },
  footer_legal: { en: "Legal", ar: "قانوني" },
  legal_privacy: { en: "Privacy Policy", ar: "سياسة الخصوصية" },
  legal_terms: { en: "Terms of Service", ar: "شروط الخدمة" },
  legal_returns: { en: "Returns & Refunds", ar: "الإرجاع والاسترداد" },
} as const;

export type TranslationKey = keyof typeof dictionary;

export function t(locale: Locale, key: TranslationKey): string {
  return dictionary[key][locale] ?? dictionary[key][DEFAULT_LOCALE];
}

export function isRtl(locale: Locale) {
  return locale === "ar";
}

/** Picks the Arabic variant of a content field when present and locale is ar, else falls back to English. */
export function pickLocalized(en: string, ar: string | null | undefined, locale: Locale): string {
  return locale === "ar" && ar ? ar : en;
}
