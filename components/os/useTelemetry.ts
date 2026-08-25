"use client";

import { useEffect, useState } from "react";

export type Telemetry = {
  checks: Array<{ id: string; host: string; ok: boolean; status: number; ms: number | null }>;
  blockHeight: number | null;
};

export function useTelemetry() {
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/telemetry")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((payload: Telemetry) => {
        if (!cancelled) setTelemetry(payload);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { telemetry, failed };
}
