import * as si from "simple-icons";

/* Brand marks for the places MaydaLabs actually publishes.
 *
 * X and GitHub come from simple-icons, already a dependency for the stack
 * strip. LinkedIn was removed from that set, so its mark is drawn here.
 * Using a platform's own mark to link to your account on it is ordinary
 * practice; the glyphs are monochrome and take the surrounding colour.
 */

const LINKEDIN_PATH =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z";

type SimpleIcon = { path: string };

function path(key: "X" | "Github"): string | null {
  const icon = (si as unknown as Record<string, SimpleIcon | undefined>)[`si${key}`];
  return icon?.path ?? null;
}

export type BrandName = "x" | "linkedin" | "github";

const PATHS: Record<BrandName, string | null> = {
  x: path("X"),
  linkedin: LINKEDIN_PATH,
  github: path("Github"),
};

export function BrandGlyph({ name, size = 16 }: { name: BrandName; size?: number }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className="mayda-brand-glyph"
    >
      <path d={d} fill="currentColor" />
    </svg>
  );
}
