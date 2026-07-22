"use client";

import { useTransition } from "react";
import { exportSegmentAction, type CustomerSegment } from "@/actions/admin-customers";

export function ExportSegmentButton({ segment }: { segment: CustomerSegment }) {
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const csv = await exportSegmentAction(segment);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hustle-${segment}-segment.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <button
      onClick={handleExport}
      disabled={isPending}
      className="border border-matte-black px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-matte-black hover:text-off-white disabled:opacity-40"
    >
      {isPending ? "Exporting…" : "Export CSV"}
    </button>
  );
}
