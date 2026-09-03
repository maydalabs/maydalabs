"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { isValidBitcoinAddress } from "@/lib/bitcoinAddress";
import { fetchAddressFunding, fetchBtcUsdRate } from "@/lib/chain";
import { INVOICE_TTL_HOURS, satsFromUsd } from "@/lib/payments";

/*
 * On-chain invoices. Two callers, two different powers:
 *
 * - Operators create, cancel, and check. RLS enforces that.
 * - A client may check their own invoice, because waiting for a page to
 *   refresh itself is a poor way to learn that money arrived. The check
 *   reads through the caller's RLS-scoped client (so they can only touch an
 *   invoice on their own pilot) and writes the chain's answer through the
 *   admin client, because payment state is not the client's to assert.
 */

export type InvoiceFormState = {
  status: "idle" | "saved" | "checked" | "error";
  code?: "not_authorized" | "invalid" | "save_failed" | "chain_unavailable" | "rate_unavailable";
  field?: string;
};

const UUID = /^[0-9a-f-]{36}$/;

async function operatorClient() {
  if (!isSupabaseConfigured()) return null;
  const claims = await getVerifiedClaims();
  if (!claims) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("operator_status").select("user_id").maybeSingle();
  if (!data) return null;
  return supabase;
}

export async function createInvoiceAction(
  _prev: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  const supabase = await operatorClient();
  if (!supabase) return { status: "error", code: "not_authorized" };

  const pilotId = formData.get("pilotId");
  if (typeof pilotId !== "string" || !UUID.test(pilotId)) return { status: "error", code: "invalid", field: "pilotId" };

  const label = typeof formData.get("label") === "string" ? String(formData.get("label")).trim().slice(0, 120) : "";
  if (!label) return { status: "error", code: "invalid", field: "label" };

  const amountUsd = Number(formData.get("amountUsd"));
  if (!Number.isFinite(amountUsd) || amountUsd <= 0 || amountUsd > 1_000_000) {
    return { status: "error", code: "invalid", field: "amountUsd" };
  }

  const address = typeof formData.get("address") === "string" ? String(formData.get("address")).trim() : "";
  // Checksum, not shape: a mistyped address sends the client's money nowhere.
  if (!isValidBitcoinAddress(address)) return { status: "error", code: "invalid", field: "address" };

  const rate = await fetchBtcUsdRate();
  if (!rate) return { status: "error", code: "rate_unavailable" };

  const amountSats = satsFromUsd(amountUsd, rate);
  if (amountSats <= 0) return { status: "error", code: "invalid", field: "amountUsd" };

  const expiresAt = new Date(Date.now() + INVOICE_TTL_HOURS * 3600_000).toISOString();
  const { error } = await supabase.from("pilot_invoices").insert({
    pilot_id: pilotId,
    label,
    amount_usd: amountUsd,
    amount_sats: amountSats,
    rate_usd: rate,
    address,
    expires_at: expiresAt,
  });
  if (error) return { status: "error", code: "save_failed" };

  revalidatePath("/internal/pilots");
  revalidatePath(`/portal/pilots/${pilotId}`);
  return { status: "saved" };
}

export async function voidInvoiceAction(formData: FormData): Promise<void> {
  const supabase = await operatorClient();
  if (!supabase) return;

  const invoiceId = formData.get("invoiceId");
  if (typeof invoiceId !== "string" || !UUID.test(invoiceId)) return;

  // Paid invoices are a record of money received; they are never voided.
  await supabase.from("pilot_invoices").update({ status: "void" }).eq("id", invoiceId).neq("status", "paid");

  revalidatePath("/internal/pilots");
}

/* Ask the chain about one invoice and record what it says. Callable by the
 * client who owns the pilot and by operators; nobody else matches a row. */
export async function checkInvoiceAction(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const claims = await getVerifiedClaims();
  if (!claims) return;

  const invoiceId = formData.get("invoiceId");
  if (typeof invoiceId !== "string" || !UUID.test(invoiceId)) return;

  const supabase = await createSupabaseServerClient();
  const { data: invoice } = await supabase
    .from("pilot_invoices")
    .select("id, pilot_id, address, amount_sats, status, expires_at")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice || invoice.status === "void") return;

  const funding = await fetchAddressFunding(invoice.address);
  // A failed lookup leaves the invoice exactly as it was: silence from an
  // API is not evidence that nothing was paid.
  if (!funding) return;

  const paid = funding.confirmedSats >= invoice.amount_sats;
  const expired = !paid && Date.parse(invoice.expires_at) <= Date.now();

  const admin = createSupabaseAdminClient();
  if (!admin) return;
  await admin
    .from("pilot_invoices")
    .update({
      observed_sats: funding.confirmedSats,
      txid: funding.txid,
      checked_at: new Date().toISOString(),
      status: paid ? "paid" : expired && invoice.status === "open" ? "expired" : invoice.status,
      paid_at: paid ? new Date().toISOString() : null,
    })
    .eq("id", invoice.id)
    .neq("status", "paid");

  revalidatePath(`/portal/pilots/${invoice.pilot_id}`);
  revalidatePath("/internal/pilots");
}
