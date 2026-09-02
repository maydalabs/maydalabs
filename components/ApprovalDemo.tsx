"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import type { Locale } from "@/lib/i18n";

/*
 * A thirty-second, fully local demo of the approval gate: a machine-drafted
 * piece with source-linked claims, one human button, and a ledger entry the
 * moment it's clicked. Nothing here talks to a server — it exists to make
 * "no approval means no external action" felt instead of read.
 */

type DemoCopy = {
  kicker: string;
  heading: string;
  intro: string;
  draftLabel: string;
  draftTitle: string;
  claimsLabel: string;
  claims: readonly { text: string; source: string | null }[];
  unverified: string;
  machineWaiting: string;
  approve: string;
  sendBack: string;
  approved: string;
  sentBack: string;
  ledgerLabel: string;
  ledgerIdle: string;
  ledgerApproved: string;
  ledgerSentBack: string;
  reset: string;
  note: string;
};

const COPY: Record<Locale, DemoCopy> = {
  en: {
    kicker: "Try the gate",
    heading: "The machine drafted this. It can't do the next part.",
    intro: "A local demo — nothing is sent anywhere. Notice the one claim without a source: it's marked, and it stays marked.",
    draftLabel: "Draft · machine",
    draftTitle: "Corporate treasury desk: two new filings this week",
    claimsLabel: "Claims in this draft",
    claims: [
      { text: "Company A disclosed additional BTC purchases in an 8-K filing.", source: "sec.gov/…/8-K" },
      { text: "Company B's quarterly report lists BTC holdings at cost basis.", source: "sec.gov/…/10-Q" },
      { text: "Analysts expect further purchases next quarter.", source: null },
    ],
    unverified: "unverified — will not publish as fact",
    machineWaiting: "Waiting for a human. The AI has no publish authority.",
    approve: "Approve and publish",
    sendBack: "Send back",
    approved: "Published. Recorded with your approval.",
    sentBack: "Sent back to drafting. Nothing left the building.",
    ledgerLabel: "Ledger",
    ledgerIdle: "No external action recorded.",
    ledgerApproved: "approval · human · piece published · distribution pending reconcile",
    ledgerSentBack: "revision requested · human · draft returned",
    reset: "Reset the demo",
    note: "In production the ledger entry carries the approver, the timestamp, the piece id, and — after reconcile — the public URL.",
  },
  tr: {
    kicker: "Kapıyı deneyin",
    heading: "Bu taslağı makine yazdı. Sıradaki adımı yapamaz.",
    intro: "Yerel bir demo — hiçbir şey hiçbir yere gönderilmiyor. Kaynağı olmayan tek iddiaya dikkat edin: işaretli ve işaretli kalıyor.",
    draftLabel: "Taslak · makine",
    draftTitle: "Kurumsal hazine masası: bu hafta iki yeni dosya",
    claimsLabel: "Bu taslaktaki iddialar",
    claims: [
      { text: "A Şirketi bir 8-K dosyasında ek BTC alımlarını açıkladı.", source: "sec.gov/…/8-K" },
      { text: "B Şirketi'nin çeyrek raporu BTC varlıklarını maliyet bazında listeliyor.", source: "sec.gov/…/10-Q" },
      { text: "Analistler gelecek çeyrekte yeni alımlar bekliyor.", source: null },
    ],
    unverified: "doğrulanmamış — gerçek olarak yayınlanmaz",
    machineWaiting: "Bir insan bekleniyor. Yapay zekânın yayın yetkisi yok.",
    approve: "Onayla ve yayınla",
    sendBack: "Geri gönder",
    approved: "Yayınlandı. Onayınızla kaydedildi.",
    sentBack: "Taslağa geri gönderildi. Hiçbir şey dışarı çıkmadı.",
    ledgerLabel: "Kayıt defteri",
    ledgerIdle: "Kayıtlı dış eylem yok.",
    ledgerApproved: "onay · insan · içerik yayınlandı · dağıtım mutabakat bekliyor",
    ledgerSentBack: "revizyon istendi · insan · taslak geri döndü",
    reset: "Demoyu sıfırla",
    note: "Üretimde kayıt; onaylayanı, zaman damgasını, içerik kimliğini ve — mutabakattan sonra — herkese açık URL'i taşır.",
  },
  fr: {
    kicker: "Essayez la porte",
    heading: "La machine a rédigé ceci. Elle ne peut pas faire la suite.",
    intro: "Une démo locale — rien n'est envoyé nulle part. Remarquez la seule affirmation sans source : elle est marquée, et elle le reste.",
    draftLabel: "Brouillon · machine",
    draftTitle: "Desk trésorerie : deux nouveaux dépôts cette semaine",
    claimsLabel: "Affirmations de ce brouillon",
    claims: [
      { text: "La société A a déclaré des achats de BTC supplémentaires dans un dépôt 8-K.", source: "sec.gov/…/8-K" },
      { text: "Le rapport trimestriel de la société B liste ses BTC au coût d'acquisition.", source: "sec.gov/…/10-Q" },
      { text: "Les analystes attendent d'autres achats le trimestre prochain.", source: null },
    ],
    unverified: "non vérifié — ne sera pas publié comme un fait",
    machineWaiting: "En attente d'un humain. L'IA n'a aucune autorité de publication.",
    approve: "Approuver et publier",
    sendBack: "Renvoyer",
    approved: "Publié. Enregistré avec votre approbation.",
    sentBack: "Renvoyé en rédaction. Rien n'est sorti.",
    ledgerLabel: "Registre",
    ledgerIdle: "Aucune action externe enregistrée.",
    ledgerApproved: "approbation · humain · pièce publiée · distribution en attente de réconciliation",
    ledgerSentBack: "révision demandée · humain · brouillon renvoyé",
    reset: "Réinitialiser la démo",
    note: "En production, l'entrée du registre porte l'approbateur, l'horodatage, l'identifiant de la pièce et — après réconciliation — l'URL publique.",
  },
};

type DemoState = "waiting" | "approved" | "sent_back";

export function ApprovalDemo({ locale }: { locale: Locale }) {
  const copy = COPY[locale];
  const [state, setState] = useState<DemoState>("waiting");
  const [stamp, setStamp] = useState<string | null>(null);

  const act = (next: Exclude<DemoState, "waiting">) => {
    setState(next);
    setStamp(new Date().toLocaleTimeString(locale, { hour12: false }));
  };

  return (
    <section className="mayda-card approval-demo" aria-labelledby="approval-demo-heading">
      <p className="mayda-kicker">{copy.kicker}</p>
      <h2 id="approval-demo-heading" className="mayda-heading" style={{ fontSize: "clamp(1.4rem,2.6vw,1.9rem)" }}>
        {copy.heading}
      </h2>
      <p className="mayda-body mt-3">{copy.intro}</p>

      <div className="approval-demo-grid">
        <div className="approval-demo-draft">
          <div className="mayda-browser-chrome">
            <div aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
            <span>{copy.draftLabel}</span>
            <b className={state === "approved" ? "" : "is-muted"}>
              {state === "approved" ? "PUBLISHED" : state === "sent_back" ? "RETURNED" : "DRAFT"}
            </b>
          </div>
          <div className="approval-demo-body">
            <h3 className="mayda-subheading">{copy.draftTitle}</h3>
            <p className="mayda-mono" style={{ color: "var(--mist)", margin: "0.8rem 0 0.4rem" }}>
              {copy.claimsLabel}
            </p>
            <ul className="approval-demo-claims">
              {copy.claims.map((claim) => (
                <li key={claim.text.slice(0, 20)} className={claim.source ? "" : "is-unverified"}>
                  <Icon name={claim.source ? "source" : "shield"} />
                  <span>
                    {claim.text}
                    <small>{claim.source ?? copy.unverified}</small>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="approval-demo-gate">
          <div className={`approval-demo-status ${state}`} role="status">
            <Icon name={state === "approved" ? "gate" : state === "sent_back" ? "reconcile" : "human"} />
            <span>
              {state === "waiting"
                ? copy.machineWaiting
                : state === "approved"
                  ? copy.approved
                  : copy.sentBack}
            </span>
          </div>

          {state === "waiting" ? (
            <div className="mayda-hero-actions">
              <button type="button" className="mayda-button mayda-button-mint" onClick={() => act("approved")}>
                {copy.approve}
              </button>
              <button type="button" className="mayda-button mayda-button-outline" onClick={() => act("sent_back")}>
                {copy.sendBack}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="mayda-text-link"
              style={{ border: "none", background: "none", cursor: "pointer", alignSelf: "flex-start" }}
              onClick={() => {
                setState("waiting");
                setStamp(null);
              }}
            >
              {copy.reset}
            </button>
          )}

          <div className="approval-demo-ledger">
            <p className="mayda-kicker" style={{ margin: 0 }}>{copy.ledgerLabel}</p>
            <p className="mayda-mono">
              {state === "waiting"
                ? copy.ledgerIdle
                : `${stamp} · ${state === "approved" ? copy.ledgerApproved : copy.ledgerSentBack}`}
            </p>
          </div>
          <p className="mayda-body" style={{ fontSize: "0.82rem" }}>{copy.note}</p>
        </div>
      </div>
    </section>
  );
}
