"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";

const COPY = {
  en: {
    label: "Live / station telemetry",
    broadcasting: "Broadcasting",
    noCarrier: "No carrier",
    scanning: "Scanning",
    block: "Bitcoin block height",
  },
  tr: {
    label: "Canlı / istasyon telemetrisi",
    broadcasting: "Yayında",
    noCarrier: "Sinyal yok",
    scanning: "Taranıyor",
    block: "Bitcoin blok yüksekliği",
  },
  fr: {
    label: "En direct / télémétrie de la station",
    broadcasting: "En émission",
    noCarrier: "Pas de signal",
    scanning: "Balayage",
    block: "Hauteur de bloc Bitcoin",
  },
} as const;

type Telemetry = {
  checks: Array<{ id: string; host: string; ok: boolean; status: number; ms: number | null }>;
  blockHeight: number | null;
};

export function StationTelemetry({ locale }: { locale: Locale }) {
  const copy = COPY[locale];
  const [data, setData] = useState<Telemetry | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/telemetry")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((payload: Telemetry) => {
        if (!cancelled) setData(payload);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hosts = data?.checks ?? [
    { id: "hodlstay", host: "hodlstay.com", ok: false, status: 0, ms: null },
    { id: "satoshi-gazette", host: "satoshigazette.org", ok: false, status: 0, ms: null },
  ];

  const readout = (check: (typeof hosts)[number]) => {
    if (!data) return failed ? copy.noCarrier : `${copy.scanning}…`;
    if (!check.ok) return copy.noCarrier;
    return `${check.status} · ${check.ms} ms · ${copy.broadcasting}`;
  };

  return (
    <div className="station-telemetry" aria-label={copy.label}>
      <p>{copy.label}</p>
      <ul>
        {hosts.map((check) => (
          <li key={check.id} className={data && check.ok ? "is-live" : ""}>
            <i aria-hidden="true" />
            <strong>{check.host}</strong>
            <span>{readout(check)}</span>
          </li>
        ))}
        <li className={data?.blockHeight ? "is-live" : ""}>
          <i aria-hidden="true" />
          <strong>{copy.block}</strong>
          <span>
            {data?.blockHeight
              ? data.blockHeight.toLocaleString(locale)
              : failed
                ? copy.noCarrier
                : `${copy.scanning}…`}
          </span>
        </li>
      </ul>
    </div>
  );
}
