import { CartProvider } from "@/components/storefront/cart-provider";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { SiteHeader } from "@/components/storefront/site-header";
import { SiteFooter } from "@/components/storefront/site-footer";
import { AttributionTracker } from "@/components/storefront/attribution-tracker";

export default function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CartProvider>
      <AttributionTracker />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <CartDrawer />
    </CartProvider>
  );
}
