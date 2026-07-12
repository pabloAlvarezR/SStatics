"use client";

import { useQuery } from "@tanstack/react-query";
import type { ScanUsage } from "@/lib/validators/api";

async function fetchScanUsage(): Promise<ScanUsage> {
  const res = await fetch("/api/scans");
  if (!res.ok) throw new Error("Error al cargar escaneos");
  return res.json();
}

export function useScanUsage(initialData?: ScanUsage) {
  return useQuery<ScanUsage>({
    queryKey: ["scans"],
    queryFn: fetchScanUsage,
    initialData,
    staleTime: 30_000,
  });
}
