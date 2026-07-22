"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleStaffActiveAction, updateStaffRoleAction, deleteStaffAction } from "@/actions/admin-staff";

const ROLES = ["OWNER", "MANAGER", "SUPPORT", "FULFILLMENT"] as const;

export function StaffRowControls({
  id,
  role,
  active,
  isSelf,
}: {
  id: string;
  role: (typeof ROLES)[number];
  active: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (isSelf) return <span className="font-mono text-xs text-concrete-grey">You</span>;

  return (
    <div className="flex items-center gap-3">
      <select
        defaultValue={role}
        disabled={isPending}
        onChange={(e) => startTransition(async () => {
          await updateStaffRoleAction(id, e.target.value as (typeof ROLES)[number]);
          router.refresh();
        })}
        className="input"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <button
        disabled={isPending}
        onClick={() => startTransition(async () => {
          await toggleStaffActiveAction(id, !active);
          router.refresh();
        })}
        className="font-mono text-xs underline"
      >
        {active ? "Deactivate" : "Activate"}
      </button>
      <button
        disabled={isPending}
        onClick={() => {
          if (!confirm("Delete this staff account?")) return;
          startTransition(async () => {
            await deleteStaffAction(id);
            router.refresh();
          });
        }}
        className="font-mono text-xs text-red-600 hover:underline"
      >
        Delete
      </button>
    </div>
  );
}
