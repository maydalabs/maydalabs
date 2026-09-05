"""Rebuild approved outlines. Requires fontTools at export time only."""
import hashlib
import json
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "brand/fonts/BricolageGrotesque-variable.ttf"
font = instantiateVariableFont(TTFont(SOURCE), {"wght": 700, "wdth": 100, "opsz": 16.32})
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
upm = font["head"].unitsPerEm

def kern(left, right):
    value = 0
    if "GPOS" not in font:
        return value
    table = font["GPOS"].table
    indices = set()
    for feature in table.FeatureList.FeatureRecord:
        if feature.FeatureTag == "kern":
            indices.update(feature.Feature.LookupListIndex)
    for index in sorted(indices):
        lookup = table.LookupList.Lookup[index]
        for sub in lookup.SubTable:
            if lookup.LookupType == 9:
                sub = sub.ExtSubTable
            if not hasattr(sub, "Coverage") or left not in sub.Coverage.glyphs:
                continue
            adjustment = 0
            if sub.Format == 1:
                for pair in sub.PairSet[sub.Coverage.glyphs.index(left)].PairValueRecord:
                    if pair.SecondGlyph == right:
                        adjustment = getattr(pair.Value1, "XAdvance", 0) or 0
                        break
            elif sub.Format == 2:
                record = sub.Class1Record[sub.ClassDef1.classDefs.get(left, 0)].Class2Record[sub.ClassDef2.classDefs.get(right, 0)]
                adjustment = getattr(record.Value1, "XAdvance", 0) or 0
            value += adjustment
    return value

def outline(text, size, tracking=0):
    scale = size / upm
    pen = SVGPathPen(glyphs, ntos=lambda v: str(round(v, 4)))
    cursor = 0
    names = [cmap[ord(char)] for char in text]
    for index, name in enumerate(names):
        glyphs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, cursor, 0)))
        cursor += glyphs[name].width * scale
        if index + 1 < len(names):
            cursor += kern(name, names[index + 1]) * scale + tracking * size
    return {"path": pen.getCommands(), "advance": round(cursor, 4)}

result = {
    "font": "Bricolage Grotesque", "axes": {"wght": 700, "wdth": 100, "opsz": 16.32},
    "fontSha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    "source": "https://github.com/google/fonts/tree/main/ofl/bricolagegrotesque",
    "name": outline("MaydaLabs", 100, -0.03), "multiplier": outline("×", 66),
    "baseline": 78, "multiplierRise": 33, "multiplierGap": 14,
}
(ROOT / "brand/wordmark-paths.json").write_text(json.dumps(result, indent=2) + "\n")
print("Outlined MaydaLabs and multiplier from licensed font.")
