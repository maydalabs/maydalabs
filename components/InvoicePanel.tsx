import QRCode from "qrcode";
import { checkInvoiceAction } from "@/app/actions/payments";
import { INVOICE_COPY } from "@/components/invoiceCopy";
import { mempoolAddressUrl, mempoolTxUrl } from "@/lib/chain";
import { bip21Uri, formatBtc, formatSats, invoiceState, type InvoiceStatus } from "@/lib/payments";
import type { Locale } from "@/lib/i18n";

/* The client's side of an on-chain invoice: a QR, an address, an amount
 * locked at a rate, and an honest statement of what the chain shows. No
 * payment processor sits between the two parties. */

export type InvoiceRecord = {
  id: string;
  label: string;
  amount_usd: number | string;
  amount_sats: number | string;
  rate_usd: number | string;
  address: string;
  status: InvoiceStatus;
  observed_sats: number | string;
  txid: string | null;
  paid_at: string | null;
  expires_at: string;
};

const num = (value: number | string): number => (typeof value === "number" ? value : Number(value) || 0);

function money(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function day(value: string, locale: Locale): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString(locale === "en" ? "en-GB" : locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }) + " UTC";
}

async function qrSvg(uri: string): Promise<string> {
  // Dark modules on a light chip: a QR on a dark ground fails to scan on
  // many phone cameras, and a payment that cannot be scanned is not a
  // payment page.
  return QRCode.toString(uri, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#0B0F1A", light: "#F4F6FB" },
  });
}

export async function InvoicePanel({
  invoices,
  locale,
}: {
  invoices: InvoiceRecord[];
  locale: Locale;
}) {
  const copy = INVOICE_COPY[locale];
  const visible = invoices.filter((invoice) => invoice.status !== "void");
  if (visible.length === 0) return null;

  const rendered = await Promise.all(
    visible.map(async (invoice) => {
      const amountSats = num(invoice.amount_sats);
      const observed = num(invoice.observed_sats);
      const state = invoiceState({
        status: invoice.status,
        amountSats,
        observedSats: observed,
        expiresAt: invoice.expires_at,
      });
      const uri = bip21Uri(invoice.address, amountSats, invoice.label);
      return { invoice, amountSats, observed, state, svg: state === "open" || state === "underpaid" ? await qrSvg(uri) : null, uri };
    }),
  );

  return (
    <section className="mayda-section" aria-labelledby="invoices-heading">
      <h2 id="invoices-heading" className="mayda-h3">{copy.heading}</h2>
      <p className="mayda-body" style={{ marginTop: "0.4rem" }}>{copy.intro}</p>

      <div className="mayda-stack" style={{ gap: "1rem", marginTop: "1.2rem" }}>
        {rendered.map(({ invoice, amountSats, observed, state, svg, uri }) => (
          <article key={invoice.id} className="mayda-card mayda-invoice">
            <div className="mayda-invoice-head">
              <p className="mayda-kicker" style={{ margin: 0 }}>{invoice.label}</p>
              <span className={`mayda-status${state === "paid" ? " is-active" : ""}`}>{copy.states[state]}</span>
            </div>

            <div className="mayda-invoice-body">
              {svg ? (
                <a className="mayda-invoice-qr" href={uri} aria-label={copy.heading} dangerouslySetInnerHTML={{ __html: svg }} />
              ) : null}

              <dl className="mayda-dl mayda-invoice-facts">
                <div>
                  <dt>{copy.amountLabel}</dt>
                  <dd>
                    <strong>{formatBtc(amountSats)} BTC</strong>
                    <span className="mayda-invoice-sub">{formatSats(amountSats)} sats · {money(num(invoice.amount_usd))}</span>
                  </dd>
                </div>
                <div>
                  <dt>{copy.addressLabel}</dt>
                  <dd><code className="mayda-invoice-address">{invoice.address}</code></dd>
                </div>
                <div>
                  <dt>{copy.rateLabel}</dt>
                  <dd>{money(num(invoice.rate_usd))} / BTC</dd>
                </div>
                <div>
                  <dt>{copy.expiresLabel}</dt>
                  <dd>{day(invoice.expires_at, locale)}</dd>
                </div>
                {observed > 0 && state !== "paid" ? (
                  <div>
                    <dt>{copy.received}</dt>
                    <dd>{formatSats(observed)} sats</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            {state === "paid" ? <p className="mayda-body">{copy.paidNote}</p> : null}
            {state === "expired" ? <p className="mayda-body">{copy.expiredNote}</p> : null}
            {state === "open" || state === "underpaid" ? <p className="mayda-note">{copy.manual}</p> : null}

            <div className="mayda-invoice-actions">
              {state === "open" || state === "underpaid" ? (
                <form action={checkInvoiceAction}>
                  <input type="hidden" name="invoiceId" value={invoice.id} />
                  <button type="submit" className="mayda-button mayda-button-outline">{copy.check}</button>
                </form>
              ) : null}
              <a
                href={invoice.txid ? mempoolTxUrl(invoice.txid) : mempoolAddressUrl(invoice.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="mayda-inline-link"
              >
                {copy.viewOnChain} <span aria-hidden>↗</span>
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
