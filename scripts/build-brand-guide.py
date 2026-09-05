"""Create the digital usage guide and checksum-verified distribution package."""
import hashlib
import json
import shutil
import zipfile
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
KIT = ROOT / ".brand-build/maydalabs-solid-gate-v1.0.0"
PDF = KIT / "05-guidelines/maydalabs-solid-gate-usage.pdf"
W, H = 840, 840
C = canvas.Canvas(str(PDF), pagesize=(W, H), invariant=1)
C.setTitle("MaydaLabs Solid Gate - Identity usage guide")
C.setAuthor("MaydaLabs")
VOID, FROST, MIST = "#0A0B0F", "#F4F7FA", "#AAB2C0"

def text(x, y, value, size=12, color=FROST, bold=False):
    C.setFillColor(HexColor(color))
    C.setFont("Helvetica-Bold" if bold else "Helvetica", size)
    C.drawString(x, H-y, value)

def lines(x, y, content, size=12, color=MIST, leading=20):
    for index, value in enumerate(content):
        text(x, y+index*leading, value, size, color)

def image(relative, x, y, width, height=None):
    source = ImageReader(str(KIT / relative))
    sw, sh = source.getSize()
    height = height or width * sh / sw
    C.drawImage(source, x, H-y-height, width, height, mask="auto")

def rect(x, y, width, height, fill, radius=0):
    C.setFillColor(HexColor(fill))
    C.roundRect(x, H-y-height, width, height, radius, fill=1, stroke=0)

def page(number, label):
    rect(0, 0, W, H, VOID)
    text(48, 45, "MAYDALABS / SOLID GATE", 10, MIST)
    text(640, 45, "IDENTITY V1.0.0", 10, MIST)
    C.setStrokeColor(HexColor("#292D37"))
    C.line(48, 68, W-48, 68)
    text(48, 802, label, 10, MIST)
    text(755, 802, f"0{number}", 10, MIST)

page(1, "APPROVED 5 SEPTEMBER 2026")
text(48, 125, "A clearer gate.", 38, bold=True)
lines(48, 161, ["The approved MaydaLabs mark: converging inputs, a human gate,", "and a deliberate output. Exact direction C geometry, made consistent."])
image("02-lockups/horizontal/maydalabs-horizontal-gradient-transparent-dark-2400.png", 120, 225, 620)
text(48, 459, "One identity. Three essential treatments.", 19, bold=True)
for x, variant, caption in [(48,"gradient-transparent-dark","Primary / cobalt to mint"), (307,"mono-white","Reverse / one colour"), (566,"mono-black","Positive / one colour")]:
    if variant == "mono-black":
        rect(x, 487, 226, 204, "#FFFFFF", 16)
    image(f"01-marks/maydalabs-mark-{variant}-2048.png", x+45, 512, 136)
    text(x, 721, caption, 11, MIST)
C.showPage()

page(2, "GEOMETRY / CLEAR SPACE / SMALL SIZES")
text(48, 125, "Built to stay precise.", 34, bold=True)
image("01-marks/maydalabs-mark-gradient-transparent-dark-2048.png", 58, 181, 240)
C.setStrokeColor(HexColor("#4B6BFF"))
C.setDash(3, 4)
C.rect(43, H-166-270, 270, 270, fill=0, stroke=1)
C.setDash()
text(368, 204, "32-unit master", 18, bold=True)
lines(368, 239, ["28-unit solid tile. Rounded corners.", "2.5-unit interior cutouts. Horizontal gradient.", "No separately redrawn small-size variant.", "", "Clear space: 4 units outside the visible tile.", "The SVG includes 2 units of padding;", "add the remaining clearance in the layout."], 12)
text(48, 484, "Small-size proof", 19, bold=True)
for x, size in [(48,16),(125,20),(212,24),(310,32),(425,48),(563,64)]:
    image(f"03-icons/favicon-{size}.png", x, 522, size, size)
    text(x, 610, f"{size}px", 11, MIST)
lines(48, 659, ["Minimum symbol: 16px. Prefer 24px or larger where space allows.", "Horizontal lockup: recommended minimum width 160px. At favicon sizes, use mark only.", "Do not stretch, rotate, outline, bevel or close the transparent cutouts.", "Use a quiet background; do not put the mark on a busy photo."], 12)
C.showPage()

page(3, "PALETTE / TYPOGRAPHY / FILE HANDOFF")
text(48, 125, "Ready for real use.", 34, bold=True)
for x, label, color in [(48,"COBALT","#4B6BFF"),(240,"MINT","#42F5B6"),(432,"VOID","#0A0B0F"),(624,"FROST","#F4F7FA")]:
    rect(x, 165, 166, 62, color, 6)
    if label == "VOID":
        C.setStrokeColor(HexColor("#3B414C")); C.rect(x, H-165-62, 166, 62, fill=0, stroke=1)
    text(x, 254, label, 10, MIST)
    text(x, 275, color, 13)
text(48, 328, "Bricolage Grotesque / 700", 23, bold=True)
lines(48, 358, ["Approved lettering with -0.03em tracking and a raised multiplication sign.", "All supplied lockup SVGs use outlines. No installed font is needed to use them.", "Original variable font, SIL OFL license and provenance are included for editing."], 12)
text(48, 454, "Choose the right file", 20, bold=True)
for y, title, note in [(490,"01 Marks + 02 Lockups","SVG for scalable artwork; PNG for documents and image uploads."),(540,"03 Icons + 04 Avatars","Multi-size favicon / Apple icon / circle-safe profile images."),(590,"05 Guidelines + 06 Source","This guide, visual overview, geometry, outlines, palette and licensed font.")]:
    text(48, y, title, 13, bold=True)
    text(48, y+20, note, 11, MIST)
lines(48, 666, ["Digital sRGB handoff. Not a trademark clearance or certified print-colour specification.", "For print or embroidery, test the monochrome vector with the production supplier.", "MaydaLabs only: SG and client identities are not transferred. MaydaOS stays private.", "SHA256SUMS.txt verifies the package. No credentials or private operating data are included."], 11, leading=21)
C.save()
for filename in ["build-brand-assets.mjs", "build-brand-wordmark.py", "build-brand-guide.py"]:
    target = KIT / "06-source/scripts" / filename
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(ROOT / "scripts" / filename, target)
files = sorted(p for p in KIT.rglob("*") if p.is_file() and p.name != "SHA256SUMS.txt")
(KIT / "SHA256SUMS.txt").write_text("".join(f"{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.relative_to(KIT).as_posix()}\n" for p in files))
ZIP = ROOT / "public/brand/maydalabs-solid-gate-v1.0.0.zip"
with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for p in sorted(KIT.rglob("*")):
        if p.is_file():
            info = zipfile.ZipInfo(f"{KIT.name}/{p.relative_to(KIT).as_posix()}", (2026,9,5,0,0,0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, p.read_bytes())
print(json.dumps({"pdf":str(PDF),"zip":str(ZIP),"files":len(files)+1,"bytes":ZIP.stat().st_size,"sha256":hashlib.sha256(ZIP.read_bytes()).hexdigest()},indent=2))
