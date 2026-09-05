import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { solidGateSvg, solidGateBody } from '../brand/solid-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const master = JSON.parse(await fs.readFile(path.join(root, 'brand/mark-geometry.json'), 'utf8'));
const type = JSON.parse(await fs.readFile(path.join(root, 'brand/wordmark-paths.json'), 'utf8'));
const kit = path.join(root, '.brand-build/maydalabs-solid-gate-v1.0.0');
const live = path.join(root, 'public/brand/logo');
await Promise.all([kit, live].map(dir => fs.mkdir(dir, { recursive: true })));
const save = async (relative, body) => {
  const target = path.join(kit, relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, body);
};
const png = (svg, width) => sharp(Buffer.from(svg)).resize({ width }).png().toBuffer();
const variants = {
  'gradient-on-dark': { ink: master.colors.frost, bg: master.colors.void },
  'gradient-on-light': { ink: master.colors.void, bg: '#FFFFFF' },
  'gradient-transparent-dark': { ink: master.colors.frost },
  'gradient-transparent-light': { ink: master.colors.void },
  'mono-black': { ink: '#000000', mark: '#000000' },
  'mono-white': { ink: '#FFFFFF', mark: '#FFFFFF' },
};
const nameWidth = type.name.advance + type.multiplierGap + type.multiplier.advance;
function letters(ink, multiplier) {
  return `<path d="${type.name.path}" fill="${ink}"/><path d="${type.multiplier.path}" transform="translate(${type.name.advance + type.multiplierGap} ${-type.multiplierRise})" fill="${multiplier}"/>`;
}
function lockup(layout, variant) {
  const { ink, bg, mark } = variant;
  const horizontal = layout === 'horizontal';
  const wordOnly = layout === 'wordmark';
  const width = Math.ceil(nameWidth + (horizontal ? 202 : 64));
  const height = horizontal ? 192 : wordOnly ? 144 : 346;
  const markX = horizontal ? 24 : width / 2 - 88;
  const markY = horizontal ? 16 : 24;
  const scale = horizontal ? 5 : 5.5;
  const textX = horizontal ? 194 : 32;
  const baseline = horizontal ? 125 : wordOnly ? 105 : 295;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><title>MaydaLabs Solid Gate ${layout} logo</title>${bg ? `<rect width="${width}" height="${height}" fill="${bg}"/>` : ''}${wordOnly ? '' : `<g transform="translate(${markX} ${markY}) scale(${scale})">${solidGateBody(master, { paint: mark || 'url(#solid-gate-color)' })}</g>`}<g transform="translate(${textX} ${baseline})">${letters(ink, mark || master.colors.cobalt)}</g></svg>`;
}
for (const [name, variant] of Object.entries(variants)) {
  const mark = solidGateSvg(master, { size: 2048, color: variant.mark, background: variant.bg });
  await save(`01-marks/maydalabs-mark-${name}.svg`, mark);
  await save(`01-marks/maydalabs-mark-${name}-2048.png`, await png(mark, 2048));
  for (const layout of ['horizontal', 'stacked', 'wordmark']) {
    const svg = lockup(layout, variant);
    await save(`02-lockups/${layout}/maydalabs-${layout}-${name}.svg`, svg);
    await save(`02-lockups/${layout}/maydalabs-${layout}-${name}-2400.png`, await png(svg, 2400));
  }
}
const canonical = solidGateSvg(master, { size: 32 });
await fs.writeFile(path.join(root, 'app/icon.svg'), canonical + '\n');
await fs.writeFile(path.join(live, 'maydalabs-mark.svg'), canonical + '\n');
await fs.writeFile(path.join(live, 'maydalabs-mark-transparent-512.png'), await png(canonical, 512));
const iconBuffers = [];
for (const size of [16, 20, 24, 32, 48, 64, 128, 256, 512]) {
  const buffer = await png(canonical, size);
  await save(`03-icons/favicon-${size}.png`, buffer);
  if ([16, 32, 48, 256].includes(size)) iconBuffers.push({ size, buffer });
}
const header = Buffer.alloc(6 + 16 * iconBuffers.length);
header.writeUInt16LE(1, 2); header.writeUInt16LE(iconBuffers.length, 4);
let offset = header.length;
iconBuffers.forEach(({ size, buffer }, index) => {
  const at = 6 + index * 16;
  header[at] = size === 256 ? 0 : size; header[at + 1] = header[at];
  header.writeUInt16LE(1, at + 4); header.writeUInt16LE(32, at + 6);
  header.writeUInt32LE(buffer.length, at + 8); header.writeUInt32LE(offset, at + 12);
  offset += buffer.length;
});
const ico = Buffer.concat([header, ...iconBuffers.map(item => item.buffer)]);
await save('03-icons/favicon.ico', ico);
await fs.writeFile(path.join(root, 'app/favicon.ico'), ico);
const apple = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><rect width="180" height="180" fill="${master.colors.void}"/><g transform="translate(15 15) scale(4.6875)">${solidGateBody(master)}</g></svg>`;
const applePng = await png(apple, 180);
await save('03-icons/apple-touch-icon-180.png', applePng);
await fs.writeFile(path.join(root, 'app/apple-icon.png'), applePng);
for (const [name, bg, fill] of [['dark', master.colors.void, undefined], ['light', '#FFFFFF', undefined], ['mono', '#FFFFFF', '#000000']]) {
  const avatar = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400"><rect width="400" height="400" fill="${bg}"/><g transform="translate(60 60) scale(8.75)">${solidGateBody(master, { paint: fill || 'url(#solid-gate-color)' })}</g></svg>`;
  await save(`04-avatars/maydalabs-avatar-${name}-400.png`, await png(avatar, 400));
  await save(`04-avatars/maydalabs-avatar-${name}-1024.png`, await png(avatar, 1024));
}
for (const file of ['mark-geometry.json', 'wordmark-paths.json', 'solid-gate.mjs']) await save(`06-source/${file}`, await fs.readFile(path.join(root, 'brand', file)));
for (const file of ['BricolageGrotesque-variable.ttf', 'OFL.txt']) await save(`06-source/fonts/${file}`, await fs.readFile(path.join(root, 'brand/fonts', file)));
await save('06-source/colors.json', JSON.stringify(master.colors, null, 2) + '\n');
await save('06-source/colors.css', `:root {\n${Object.entries(master.colors).map(([name, value]) => `  --mayda-${name}: ${value};`).join('\n')}\n}\n`);
await save('README.md', await fs.readFile(path.join(root, 'brand/KIT-README.md')));
await save('06-source/font-provenance.json', JSON.stringify({ source: type.source, sha256: type.fontSha256, license: 'SIL Open Font License 1.1', axes: type.axes }, null, 2));
await save('06-source/EXPORTING.md', 'SVG lettering is outlined: fonts are not needed to use it. The repository scripts/build-brand-assets.mjs builds all exports using Node + sharp. Optional outline regeneration uses scripts/build-brand-wordmark.py and fontTools. Font redistribution includes OFL.txt. No AI raster generation or external design service was used.\n');
const proof = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000"><rect width="1600" height="1000" fill="${master.colors.void}"/><text x="100" y="100" fill="#AAB2C0" font-family="Arial" font-size="17" letter-spacing="4">MAYDALABS / APPROVED IDENTITY / 2026</text><g transform="translate(400 160) scale(1.05)">${lockup('horizontal', variants['gradient-transparent-dark']).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g><path d="M100 450H1500" stroke="#282C36"/><g transform="translate(120 520) scale(7)">${solidGateBody(master, { id: 'proof-a', paint: 'url(#proof-a-color)' })}</g><g transform="translate(520 520) scale(7)">${solidGateBody(master, { id: 'proof-b', paint: '#FFFFFF' })}</g><rect x="910" y="490" width="330" height="280" rx="20" fill="#FFFFFF"/><g transform="translate(960 520) scale(7)">${solidGateBody(master, { id: 'proof-c', paint: '#000000' })}</g><text x="120" y="835" fill="#F4F7FA" font-family="Arial" font-size="24">Solid Gate</text><text x="120" y="876" fill="#AAB2C0" font-family="Arial" font-size="20">One mark. Clear inputs. A human gate. A deliberate output.</text><text x="120" y="945" fill="#AAB2C0" font-family="Arial" font-size="15">Cobalt #4B6BFF  /  Mint #42F5B6  /  Void #0A0B0F  /  Frost #F4F7FA</text></svg>`;
await save('05-guidelines/identity-overview.png', await png(proof, 1600));
console.log(`Logo exports built in ${kit}`);
