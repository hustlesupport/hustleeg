import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";

const CART_COOKIE = "hustle_cart";

const cartInclude = {
  items: {
    orderBy: { addedAt: "asc" as const },
    include: {
      variant: {
        include: {
          product: { include: { images: { orderBy: { position: "asc" as const }, take: 1 } } },
          inventory: true,
        },
      },
    },
  },
};

export async function getOrCreateCart() {
  const jar = await cookies();
  let token = jar.get(CART_COOKIE)?.value;

  if (token) {
    const existing = await db.cart.findUnique({
      where: { sessionToken: token },
      include: cartInclude,
    });
    if (existing) return existing;
  }

  token = randomUUID();
  jar.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return db.cart.create({
    data: { sessionToken: token },
    include: cartInclude,
  });
}

export async function getCart() {
  const jar = await cookies();
  const token = jar.get(CART_COOKIE)?.value;
  if (!token) return null;
  return db.cart.findUnique({ where: { sessionToken: token }, include: cartInclude });
}

export async function clearCartCookie() {
  const jar = await cookies();
  jar.delete(CART_COOKIE);
}
