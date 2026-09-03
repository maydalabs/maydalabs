import Image from "next/image";
import Link from "next/link";
import portrait from "@/public/profile/mehmet-e-mayda-portrait.jpg";
import { Icon } from "@/components/icons";
import { localizePath, type Locale } from "@/lib/i18n";

/*
 * The human in the loop, literally: the founder who approves every action
 * the system takes. Facts only; the quoted line is a DRAFT for Mehmet's
 * own sentence and should be replaced during his voice pass.
 */

const COPY: Record<Locale, { kicker: string; name: string; role: string; facts: string[]; quote: string; tag: string; profile: string; proof: string }> = {
  en: {
    kicker: "The human at the gate",
    name: "Mehmet Emin Mayda",
    role: "Founder · Istanbul",
    facts: [
      "Operates Satoshi Gazette through the same system he installs for clients.",
      "Built HodlStay's production Bitcoin payment system end to end.",
      "Ran email for a mining-hardware retailer for two years before automating it.",
    ],
    quote: "I approve every action my own system takes. That is the whole product.",
    tag: "Approves every action",
    profile: "Founder profile",
    proof: "How the system runs",
  },
  tr: {
    kicker: "Kapıdaki insan",
    name: "Mehmet Emin Mayda",
    role: "Kurucu · İstanbul",
    facts: [
      "Satoshi Gazette'i müşterilere kurduğu sistemin aynısıyla işletiyor.",
      "HodlStay'in canlı Bitcoin ödeme sistemini uçtan uca kurdu.",
      "Otomatikleştirmeden önce iki yıl bir madencilik donanımı satıcısının e-postasını yönetti.",
    ],
    quote: "Kendi sistemimin attığı her adımı ben onaylıyorum. Ürünün tamamı bu.",
    tag: "Her eylemi onaylar",
    profile: "Kurucu profili",
    proof: "Sistem nasıl çalışır",
  },
  fr: {
    kicker: "L'humain à la porte",
    name: "Mehmet Emin Mayda",
    role: "Fondateur · Istanbul",
    facts: [
      "Fait tourner Satoshi Gazette avec le système qu'il installe chez ses clients.",
      "A construit de bout en bout le système de paiement Bitcoin de HodlStay.",
      "A géré pendant deux ans l'e-mail d'un revendeur de matériel de minage avant de l'automatiser.",
    ],
    quote: "J'approuve chaque action de mon propre système. C'est tout le produit.",
    tag: "Approuve chaque action",
    profile: "Profil du fondateur",
    proof: "Comment tourne le système",
  },
};

export function FounderNote({ locale, showPortrait = true }: { locale: Locale; showPortrait?: boolean }) {
  const copy = COPY[locale];
  return (
    <section className="mayda-section-tight" style={{ paddingTop: 0 }} aria-labelledby="founder-note">
      <div className="mayda-shell">
        <div className={`mayda-founder ${showPortrait ? "" : "is-text-only"}`}>
          {showPortrait ? (
          <figure className="mayda-founder-portrait">
            <Image src={portrait} alt={copy.name} placeholder="blur" sizes="(min-width: 768px) 240px, 60vw" />
            <figcaption>
              <Icon name="human" /> {copy.tag}
            </figcaption>
          </figure>
          ) : null}
          <div className="mayda-stack" style={{ gap: "0.9rem" }}>
            <p className="mayda-kicker" style={{ margin: 0 }}>{copy.kicker}</p>
            <h2 id="founder-note" className="mayda-subheading" style={{ fontSize: "clamp(1.5rem, 2.6vw, 2rem)" }}>
              {copy.name} <span style={{ color: "var(--mist)", fontWeight: 400 }}>· {copy.role}</span>
            </h2>
            <p className="mayda-founder-quote">“{copy.quote}”</p>
            <ul className="mayda-founder-facts">
              {copy.facts.map((fact) => (
                <li key={fact}>
                  <Icon name="gate" /> <span>{fact}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-4" style={{ marginTop: "0.2rem" }}>
              <Link href={localizePath("/profile", locale)} className="mayda-text-link">
                {copy.profile} <span aria-hidden>→</span>
              </Link>
              <Link href={localizePath("/proof", locale)} className="mayda-text-link">
                {copy.proof} <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
