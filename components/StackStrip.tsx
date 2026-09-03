import Image from "next/image";
import * as si from "simple-icons";
import { STACK_GROUPS, type StackItem } from "@/lib/stack";
import type { Locale } from "@/lib/i18n";

/*
 * Stack and partner strip: logos only. Tech glyphs are monochrome mist and
 * take their brand colour on hover; partner logos keep their own colours.
 * Names live in the tooltip and for screen readers. `compact` renders one
 * row with no group labels (case studies).
 */

type SimpleIcon = { path: string; hex: string; title: string };

function simpleIcon(key: string): SimpleIcon | null {
  const icon = (si as unknown as Record<string, SimpleIcon | undefined>)[`si${key}`];
  return icon ?? null;
}

function Glyph({ item }: { item: StackItem }) {
  if (item.icon.startsWith("si:")) {
    const icon = simpleIcon(item.icon.slice(3));
    if (!icon) return <span className="mayda-stack-fallback">{item.name.slice(0, 2)}</span>;
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d={icon.path} fill="currentColor" />
      </svg>
    );
  }
  const src = item.icon.slice(4);
  return (
    <Image
      src={src}
      alt=""
      width={item.wide ? 96 : 32}
      height={32}
      className={`mayda-stack-img ${item.wide ? "is-wide" : ""}`}
      unoptimized={src.endsWith(".svg")}
    />
  );
}

function brandHex(item: StackItem): string | undefined {
  if (!item.icon.startsWith("si:")) return undefined;
  return simpleIcon(item.icon.slice(3))?.hex;
}

function StackList({ items, tone }: { items: StackItem[]; tone: "mono" | "brand" }) {
  return (
    <ul className="mayda-stack-list">
      {items.map((item) => {
        const hex = brandHex(item);
        return (
          <li key={item.id}>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`mayda-stack-item ${tone === "brand" ? "is-brand" : ""} ${item.wide ? "is-wide" : ""}`}
              style={hex ? ({ "--brand": `#${hex}` } as React.CSSProperties) : undefined}
              title={item.name}
              aria-label={item.name}
            >
              <Glyph item={item} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function StackStrip({ locale, kicker }: { locale: Locale; kicker: string }) {
  return (
    <section className="mayda-section-tight" aria-label={kicker}>
      <div className="mayda-shell">
        <p className="mayda-kicker">{kicker}</p>
        <div className="mayda-stack-groups">
          {STACK_GROUPS.map((group) => (
            <div key={group.id} className="mayda-stack-group" data-group={group.id}>
              <span className="mayda-stack-group-label">{group.label[locale]}</span>
              <StackList items={group.items} tone={group.id === "worked" ? "brand" : "mono"} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* One row of logos for a single project (case studies). */
export function ProjectStack({ items, label }: { items: StackItem[]; label: string }) {
  return (
    <div className="mayda-stack-compact" aria-label={label}>
      <span className="mayda-stack-group-label">{label}</span>
      <StackList items={items} tone="mono" />
    </div>
  );
}
