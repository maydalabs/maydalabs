import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import master from "@/brand/mark-geometry.json";
import { solidGateSvg } from "@/brand/solid-gate.mjs";

describe("approved Solid Gate identity", () => {
  it("preserves the exact direction C geometry", () => {
    expect(master.frame).toBe("M9 2H23A7 7 0 0 1 30 9V23A7 7 0 0 1 23 30H9A7 7 0 0 1 2 23V9A7 7 0 0 1 9 2Z");
    expect(master.gate).toBe("M18 10V22");
    expect(master.dot).toEqual([24,16,1.75]);
    expect(master.stroke).toBe(2.5);
  });
  it("keeps the site icon and public SVG on the same master", () => {
    const expected = solidGateSvg(master) + "\n";
    expect(readFileSync("app/icon.svg", "utf8")).toBe(expected);
    expect(readFileSync("public/brand/logo/maydalabs-mark.svg", "utf8")).toBe(expected);
  });
  it("exports genuinely transparent cutouts, not black-painted holes", async () => {
    const { data, info } = await sharp(Buffer.from(solidGateSvg(master))).resize(320,320).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const alpha = (x:number,y:number) => data[(y*info.width+x)*4+3];
    expect(alpha(180,160)).toBe(0);
    expect(alpha(240,160)).toBe(0);
    expect(alpha(40,160)).toBe(255);
    expect(alpha(0,0)).toBe(0);
  });
  it("ships a 512px structured-data logo and four-frame ICO", async () => {
    const meta = await sharp("public/brand/logo/maydalabs-mark-transparent-512.png").metadata();
    expect([meta.width,meta.height,meta.hasAlpha]).toEqual([512,512,true]);
    const ico = readFileSync("app/favicon.ico");
    expect(ico.readUInt16LE(2)).toBe(1);
    expect(ico.readUInt16LE(4)).toBe(4);
    const apple = await sharp("app/apple-icon.png").metadata();
    expect([apple.width,apple.height]).toEqual([180,180]);
  });
  it("ships outlined lettering with font provenance", () => {
    const outline = JSON.parse(readFileSync("brand/wordmark-paths.json","utf8"));
    expect(outline.name.path.length).toBeGreaterThan(100);
    expect(outline.fontSha256).toMatch(/^[a-f0-9]{64}$/);
  });
});
