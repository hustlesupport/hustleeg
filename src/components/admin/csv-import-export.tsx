"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { exportProductsCsvAction, importProductsCsvAction, type CsvImportResult } from "@/actions/admin-csv";

export function CsvImportExport() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const csv = await exportProductsCsvAction();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "hustle-products.csv";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    startTransition(async () => {
      const text = await file.text();
      const res = await importProductsCsvAction(text);
      setResult(res);
      router.refresh();
    });
    e.target.value = "";
  }

  return (
    <div>
      <div className="flex gap-3">
        <button
          onClick={handleExport}
          disabled={isPending}
          className="border border-matte-black px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-matte-black hover:text-off-white disabled:opacity-40"
        >
          Export CSV
        </button>
        <button
          onClick={handleImportClick}
          disabled={isPending}
          className="border border-matte-black px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-matte-black hover:text-off-white disabled:opacity-40"
        >
          {isPending ? "Working…" : "Import CSV"}
        </button>
        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
      </div>
      {result && (
        <div className="mt-3 font-mono text-xs">
          <p className="text-neon-accent">
            {result.productsCreated} created · {result.productsUpdated} updated · {result.variantsWritten} variants written
          </p>
          {result.errors.map((e, i) => (
            <p key={i} className="text-red-600">
              {e}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
