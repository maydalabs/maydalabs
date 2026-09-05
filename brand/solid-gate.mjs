// Pure renderer shared by metadata and exports. No filesystem, hooks or input from visitors.
export function solidGateBody(master, { paint = 'url(#solid-gate-color)', id = 'solid-gate' } = {}) {
  const [x, y, radius] = master.dot;
  return `<defs><linearGradient id="${id}-color" gradientUnits="userSpaceOnUse" x1="${master.gradient.x1}" y1="16" x2="${master.gradient.x2}" y2="16"><stop stop-color="${master.colors.cobalt}"/><stop offset="1" stop-color="${master.colors.mint}"/></linearGradient><mask id="${id}-cutout" maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32"><rect width="32" height="32" fill="white"/><g fill="none" stroke="black" stroke-width="${master.stroke}" stroke-linecap="round" stroke-linejoin="round"><path d="${master.inputs}"/><path d="${master.gate}"/></g><circle cx="${x}" cy="${y}" r="${radius}" fill="black"/></mask></defs><path d="${master.frame}" fill="${paint}" mask="url(#${id}-cutout)"/>`;
}
export function solidGateSvg(master, { size = 32, color, background } = {}) {
  const backdrop = background ? `<rect width="32" height="32" fill="${background}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${master.viewBox}" width="${size}" height="${size}" role="img" aria-label="MaydaLabs Solid Gate"><title>MaydaLabs Solid Gate</title>${backdrop}${solidGateBody(master, { paint: color || 'url(#solid-gate-color)' })}</svg>`;
}
