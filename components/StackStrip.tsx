import Image from "next/image";
import * as si from "simple-icons";
import { STACK_GROUPS, type StackItem } from "@/lib/stack";
import type { Locale } from "@/lib/i18n";

/*
 * Stack and partner strip: monochrome mist glyphs that take their brand
 * colour on hover. Server-rendered; the simple-icons paths are inlined so
 * nothing loads from a CDN.
 */

type SimpleIcon = { path: string; hex: string; title: string };

function simpleIcon(key: string): SimpleIcon | null {
  const icon = (si as unknown as Record<string, SimpleIcon | undefined>)[`si${key}`];
  return icon ?? null;
}

function Glyph({ item }: { item: StackItem }) {
  if (item.icon.startsWith("si:")) {
    const icon = simpleIcon(item.icon.slice(3));
    if (!icon) return <span className="mayda-stack-text">{item.name}</span>;
    return (
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">
        <path d={icon.path} fill="currentColor" />
      </svg>
    );
  }
  if (item.icon.startsWith("img:")) {
    const src = item.icon.slice(4);
    return <Image src={src} alt="" width={26} height={26} className="mayda-stack-img" unoptimized={src.endsWith(".svg")} />;
  }
  return <span className="mayda-stack-text">{item.icon.slice(5)}</span>;
}

function brandHex(item: StackItem): string | undefined {
  if (!item.icon.startsWith("si:")) return undefined;
  return simpleIcon(item.icon.slice(3))?.hex;
}

export function StackStrip({ locale, kicker }: { locale: Locale; kicker: string }) {
  return (
    <section className="mayda-section-tight" aria-label={kicker}>
      <div className="mayda-shell">
        <p className="mayda-kicker">{kicker}</p>
        <div className="mayda-stack-groups">
          {STACK_GROUPS.map((group) => (
            <div key={group.id} className="mayda-stack-group">
              <span className="mayda-stack-group-label">{group.label[locale]}</span>
              <ul className="mayda-stack-list">
                {group.items.map((item) => {
                  const hex = brandHex(item);
                  return (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`mayda-stack-item ${item.icon.startsWith("text:") ? "is-text" : ""}`}
                        style={hex ? ({ "--brand": `#${hex}` } as React.CSSProperties) : undefined}
                        title={item.name}
                      >
                        <Glyph item={item} />
                        {!item.icon.startsWith("text:") ? <span>{item.name}</span> : null}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
