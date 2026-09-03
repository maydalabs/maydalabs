/*
 * v3 identity: the gate mark plus the typographic wordmark, MaydaLabs
 * raised to ×. Kept as a thin alias so existing imports keep working;
 * the lockup itself lives in components/Logo.tsx.
 */
import { Logo } from "@/components/Logo";

export function Wordmark({ className = "" }: { className?: string }) {
  return <Logo className={className} />;
}
