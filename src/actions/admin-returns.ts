"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

const statusSchema = z.enum(["REQUESTED", "APPROVED", "REJECTED", "COMPLETED"]);

export async function updateReturnStatusAction(requestId: string, status: z.infer<typeof statusSchema>) {
  await requireAdmin();
  await db.returnRequest.update({ where: { id: requestId }, data: { status: statusSchema.parse(status) } });
  revalidatePath("/admin/returns");
}
