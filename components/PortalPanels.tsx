"use client";

import { signOutAction } from "@/app/actions/auth";
import type { Locale } from "@/lib/i18n";

export function SignOutButton({ locale, label }: { locale: Locale; label: string }) {
  return (
    <form action={signOutAction}>
      <input type="hidden" name="locale" value={locale} />
      <button type="submit" className="mayda-button mayda-button-outline mayda-button-small">
        {label}
      </button>
    </form>
  );
}
