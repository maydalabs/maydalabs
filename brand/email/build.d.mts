export const LOGO: string;
export const CONFIRM_URL: string;
export const SIGNATURE_TEXT: string;
export function authEmail(kind?: string, preview?: boolean): string;
export function signature(short?: boolean): string;
export function build(): Promise<void>;
