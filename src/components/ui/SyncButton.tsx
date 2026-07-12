"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useScanUsage } from "@/hooks/useScanUsage";
import { formatScanButtonSubtext } from "@/lib/tier";
import type { ScanUsage, SyncResponse } from "@/lib/validators/api";

interface SyncButtonProps {
  initialScanUsage?: ScanUsage;
}

export function SyncButton({ initialScanUsage }: SyncButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: scanUsage } = useScanUsage(initialScanUsage);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  const mutation = useMutation({
    mutationFn: async (): Promise<SyncResponse> => {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Error al sincronizar");
      }
      return data;
    },
    onSuccess: async (data) => {
      setMessage({ type: "success", text: data.message ?? "Sincronizado" });
      await queryClient.invalidateQueries({ queryKey: ["library"] });
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
      await queryClient.invalidateQueries({ queryKey: ["scans"] });
      router.refresh();
      setTimeout(() => setMessage(null), 6000);
    },
    onError: (error: Error) => {
      setMessage({ type: "error", text: error.message });
      setTimeout(() => setMessage(null), 8000);
    },
  });

  const scanSubtext = formatScanButtonSubtext(scanUsage);

  return (
    <div className="relative">
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="steam-btn-secondary flex min-h-9 flex-col items-center justify-center gap-0.5 px-3 py-1.5 text-xs sm:min-h-11 sm:px-4 sm:text-sm"
        aria-label="Sincronizar biblioteca"
      >
        {mutation.isPending ? (
          <span className="flex items-center gap-2">
            <LoadingSpinner size="sm" />
            <span>Sincronizando...</span>
          </span>
        ) : (
          <>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="hidden sm:inline">Sincronizar</span>
              <span className="sm:hidden">Sync</span>
            </span>
            {scanSubtext && (
              <span className="text-[10px] font-normal leading-none opacity-75">{scanSubtext}</span>
            )}
          </>
        )}
      </button>
      {message && (
        <div
          className={`absolute right-0 top-full z-50 mt-2 w-56 rounded border px-3 py-2 text-xs shadow-xl sm:w-72 ${
            message.type === "success"
              ? "border-steam-green/40 bg-steam-bg-medium text-steam-green"
              : "border-red-500/40 bg-steam-bg-medium text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
