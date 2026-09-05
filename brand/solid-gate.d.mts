import type master from './mark-geometry.json';
export function solidGateBody(geometry: typeof master, options?: { paint?: string; id?: string }): string;
export function solidGateSvg(geometry: typeof master, options?: { size?: number; color?: string; background?: string }): string;
