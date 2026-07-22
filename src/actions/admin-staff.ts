"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, hashPassword } from "@/lib/admin-auth";

const staffSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(["OWNER", "MANAGER", "SUPPORT", "FULFILLMENT"]),
  password: z.string().min(8),
});

export async function createStaffAction(input: z.infer<typeof staffSchema>) {
  await requireAdmin("OWNER");
  const data = staffSchema.parse(input);

  const existing = await db.adminUser.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("An admin with this email already exists.");

  await db.adminUser.create({
    data: {
      email: data.email,
      name: data.name,
      role: data.role,
      passwordHash: await hashPassword(data.password),
    },
  });

  revalidatePath("/admin/staff");
}

export async function toggleStaffActiveAction(id: string, active: boolean) {
  const admin = await requireAdmin("OWNER");
  if (admin.id === id) throw new Error("You can't deactivate your own account.");
  await db.adminUser.update({ where: { id }, data: { active } });
  revalidatePath("/admin/staff");
}

const roleSchema = z.enum(["OWNER", "MANAGER", "SUPPORT", "FULFILLMENT"]);

export async function updateStaffRoleAction(id: string, role: z.infer<typeof roleSchema>) {
  await requireAdmin("OWNER");
  await db.adminUser.update({ where: { id }, data: { role: roleSchema.parse(role) } });
  revalidatePath("/admin/staff");
}

export async function deleteStaffAction(id: string) {
  const admin = await requireAdmin("OWNER");
  if (admin.id === id) throw new Error("You can't delete your own account.");
  await db.adminUser.delete({ where: { id } });
  revalidatePath("/admin/staff");
}
