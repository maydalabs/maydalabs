"use client";

import { useRef, type CSSProperties, type PointerEvent } from "react";

type NoiseStyle = CSSProperties & {
  "--noise-x": string;
  "--noise-y": string;
  "--settle-x": string;
  "--settle-y": string;
  "--noise-delay": string;
};

const NOISE_POINTS = [
  ["-228px", "-142px", "-84px", "-66px", "0ms"],
  ["202px", "-176px", "86px", "-74px", "65ms"],
  ["-174px", "154px", "-76px", "70px", "120ms"],
  ["225px", "127px", "95px", "58px", "180ms"],
  ["-276px", "20px", "-118px", "5px", "225ms"],
  ["280px", "-18px", "122px", "-6px", "285ms"],
  ["-86px", "-225px", "-38px", "-102px", "340ms"],
  ["92px", "214px", "40px", "98px", "410ms"],
  ["-242px", "208px", "-106px", "92px", "470ms"],
  ["254px", "-225px", "110px", "-98px", "535ms"],
] as const;

export function SignalField() {
  const fieldRef = useRef<HTMLDivElement>(null);

  const moveSignal = (event: PointerEvent<HTMLDivElement>) => {
    const field = fieldRef.current;
    if (!field) return;

    const rect = field.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    field.style.setProperty("--signal-dx", `${(x * 22).toFixed(2)}px`);
    field.style.setProperty("--signal-dy", `${(y * 22).toFixed(2)}px`);
    field.style.setProperty("--field-rotate-x", `${(-y * 2.4).toFixed(2)}deg`);
    field.style.setProperty("--field-rotate-y", `${(x * 2.4).toFixed(2)}deg`);
  };

  const resetSignal = () => {
    const field = fieldRef.current;
    if (!field) return;
    field.style.setProperty("--signal-dx", "0px");
    field.style.setProperty("--signal-dy", "0px");
    field.style.setProperty("--field-rotate-x", "0deg");
    field.style.setProperty("--field-rotate-y", "0deg");
  };

  return (
    <div
      ref={fieldRef}
      className="signal-field"
      aria-hidden="true"
      onPointerMove={moveSignal}
      onPointerLeave={resetSignal}
    >
      <div className="signal-grid" />
      <div className="signal-scan" />
      <div className="signal-noise">
        {NOISE_POINTS.map(([x, y, settleX, settleY, delay], index) => (
          <span
            key={`${x}-${y}`}
            className={index % 3 === 0 ? "is-square" : ""}
            style={{
              "--noise-x": x,
              "--noise-y": y,
              "--settle-x": settleX,
              "--settle-y": settleY,
              "--noise-delay": delay,
            } as NoiseStyle}
          />
        ))}
      </div>
      <div className="signal-orbit signal-orbit-one" />
      <div className="signal-orbit signal-orbit-two" />
      <div className="signal-core">
        <span className="signal-core-ring" />
        <span className="signal-core-dot" />
      </div>
      <div className="signal-card signal-card-one">
        <span>INPUT / CONTEXT</span>
        <strong>Ambiguous brief</strong>
        <i>Resolving</i>
      </div>
      <div className="signal-card signal-card-two">
        <span>OUTPUT / SYSTEM</span>
        <strong>Working product</strong>
        <i>Signal found</i>
      </div>
      <p className="signal-coordinate signal-coordinate-one">41.0082° N</p>
      <p className="signal-coordinate signal-coordinate-two">28.9784° E</p>
      <div className="signal-cursor"><span>MaydaLabs</span></div>
      <div className="signal-lock"><span>Signal acquired</span><b>100%</b></div>
    </div>
  );
}
