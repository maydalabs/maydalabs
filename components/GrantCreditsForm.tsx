import { grantOsCreditsAction } from "@/app/actions/os";

/* Pricing is switched off during the beta, so more rope is a decision an
 * operator makes person by person. */
export function GrantCreditsForm({ userId, granted }: { userId: string; granted: number }) {
  return (
    <form action={grantOsCreditsAction} className="mayda-hero-actions" style={{ gap: "0.5rem" }}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="granted" value={granted + 10} />
      <button type="submit" className="mayda-button mayda-button-outline">+10 credits</button>
    </form>
  );
}
