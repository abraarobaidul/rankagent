"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface AddCompetitorButtonProps {
  projectId: string;
}

export function AddCompetitorButton({ projectId }: AddCompetitorButtonProps) {
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = domain.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!trimmed) {
      setError("Please enter a domain name.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/competitors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain: trimmed }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data?.error ?? "Failed to add competitor. Please try again.");
          return;
        }

        setDomain("");
        setOpen(false);
        router.refresh();
      } catch {
        setError("Network error — please try again.");
      }
    });
  }

  return (
    <>
      <Button
        size="sm"
        className="gap-1.5"
        onClick={() => { setOpen(true); setError(null); setDomain(""); }}
      >
        <Plus className="h-4 w-4" />
        Add Competitor
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Competitor</DialogTitle>
            <DialogDescription>
              Enter a competitor domain to start tracking their SEO metrics.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="competitor-domain">Competitor Domain</Label>
              <Input
                id="competitor-domain"
                placeholder="e.g. competitor.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                disabled={isPending}
                autoFocus
              />
              {error && (
                <p className="text-xs text-red-400 mt-1">{error}</p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !domain.trim()}>
                {isPending ? "Adding…" : "Add Competitor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
