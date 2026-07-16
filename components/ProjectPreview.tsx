"use client";

import Image from "next/image";
import { useState, type KeyboardEvent, type PointerEvent } from "react";

type ProjectPreviewProps = {
  variant: "hodl" | "gazette";
  domain: string;
  status: string;
  imageSrc: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  watermarkSrc: string;
  watermarkWidth: number;
  watermarkHeight: number;
  watermarkClassName: string;
};

const XRAY_LAYERS = {
  hodl: [
    ["01", "Discovery", "Native and partner inventory"],
    ["02", "Transaction", "Booking and payment state"],
    ["03", "Operations", "Hosts, calendars, and payouts"],
    ["04", "Trust", "Reviews and support lifecycle"],
  ],
  gazette: [
    ["01", "Intelligence", "Markets and source context"],
    ["02", "Editorial", "Desks, stories, and briefings"],
    ["03", "Operations", "Publishing and distribution"],
    ["04", "Knowledge", "Search and assisted research"],
  ],
} as const;

export function ProjectPreview({
  variant,
  domain,
  status,
  imageSrc,
  imageAlt,
  imageWidth,
  imageHeight,
  watermarkSrc,
  watermarkWidth,
  watermarkHeight,
  watermarkClassName,
}: ProjectPreviewProps) {
  const [inspecting, setInspecting] = useState(false);

  const beginInspection = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setInspecting(true);
  };

  const endInspection = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setInspecting(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      setInspecting(true);
    }
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " " || event.key === "Enter") setInspecting(false);
  };

  return (
    <div className={`project-preview-shell ${inspecting ? "is-inspecting" : ""}`}>
      <div className={`project-browser project-browser-${variant}`}>
        <div className="project-browser-chrome">
          <div><i /><i /><i /></div>
          <span>{domain}</span>
          <b>{status}</b>
        </div>
        <div className="project-screen-stage">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={imageWidth}
            height={imageHeight}
            sizes="(max-width: 900px) 100vw, 62vw"
            className="project-screen"
          />
          <div className="project-xray" aria-hidden="true">
            <div className="project-xray-grid" />
            <p>System anatomy / {domain}</p>
            <div className="project-xray-layers">
              {XRAY_LAYERS[variant].map(([number, title, copy]) => (
                <div key={number}>
                  <span>{number}</span>
                  <strong>{title}</strong>
                  <small>{copy}</small>
                </div>
              ))}
            </div>
            <i className="project-xray-route" />
          </div>
        </div>
        <Image
          src={watermarkSrc}
          alt=""
          width={watermarkWidth}
          height={watermarkHeight}
          className={`project-watermark ${watermarkClassName}`}
        />
      </div>
      <button
        type="button"
        className="project-inspect-button"
        aria-label={`Hold to inspect the systems behind ${domain}`}
        aria-pressed={inspecting}
        onPointerDown={beginInspection}
        onPointerUp={endInspection}
        onPointerCancel={() => setInspecting(false)}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBlur={() => setInspecting(false)}
      >
        <span /> Hold to inspect system
      </button>
    </div>
  );
}
