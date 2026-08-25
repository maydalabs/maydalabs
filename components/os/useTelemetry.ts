"use client";

import { useEffect, useState } from "react";

export type Telemetry = {
  checks: Array<{ id: string; host: string; ok: boolean; status: number; ms: number | null }>;
  blockHeight: number | null;
  mempoolCount?: number | null;
};

export function useTelemetry() {
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch("/api/telemetry")
        .then((response) => (response.ok ? response.json() : Promise.reject()))
        .then((payload: Telemetry) => {
          if (!cancelled) {
            setTelemetry(payload);
            setFailed(false);
          }
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        });
    };
    load();
    // Keep the block height and product status current while the OS
    // stays open; the endpoint is CDN-cached, so this stays cheap.
    const interval = setInterval(load, 75_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { telemetry, failed };
}
