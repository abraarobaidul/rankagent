"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface GenerateReportButtonProps {
  projectId: string;
}

export function GenerateReportButton({ projectId }: GenerateReportButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/reports`, {
          method: "POST",
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data?.error ?? "Failed to generate report. Please try again.");
          return;
        }

        router.refresh();
      } catch {
        setError("Network error — please try again.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        className="gap-1.5"
        onClick={handleClick}
        disabled={isPending}
      >
        <FileText className="h-4 w-4" />
        {isPending ? "Generating…" : "Generate New Report"}
      </Button>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
