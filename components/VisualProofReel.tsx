import Image from "next/image";
import Link from "next/link";
import { type Locale, localizePath } from "@/lib/i18n";

const REEL_COPY = {
  en: {
    label: "Visual project index",
    inspect: "Inspect case",
    projects: [
      { number: "TX-01", name: "HodlStay", status: "Client project · Live", discipline: "Marketplace · Product · Bitcoin", path: "/case-studies/hodlstay", image: "/work/hodlstay-2026-08-home.png", alt: "HodlStay marketplace homepage" },
      { number: "TX-02", name: "Satoshi Gazette", status: "MaydaLabs product · Live", discipline: "Media · Data · Editorial ops", path: "/case-studies/satoshi-gazette", image: "/work/satoshi-gazette-2026-08-data.png", alt: "Satoshi Gazette evidence-led Data Desk" },
      { number: "TX-03", name: "Mortal Vault", status: "Private alpha · Unaudited", discipline: "Self-custody · Contracts · Safety", path: "/case-studies/mortal-vault", image: null, alt: "" },
      { number: "TX-04", name: "Sofra", status: "Private Phase 1", discipline: "Marketplace · Trust · Bilingual", path: "/case-studies/sofra", image: null, alt: "" },
    ],
  },
  tr: {
    label: "Görsel proje dizini",
    inspect: "Vakayı incele",
    projects: [
      { number: "TX-01", name: "HodlStay", status: "Müşteri projesi · Canlı", discipline: "Pazar yeri · Ürün · Bitcoin", path: "/case-studies/hodlstay", image: "/work/hodlstay-2026-08-home.png", alt: "HodlStay pazar yeri ana sayfası" },
      { number: "TX-02", name: "Satoshi Gazette", status: "MaydaLabs ürünü · Canlı", discipline: "Medya · Veri · Editoryal operasyon", path: "/case-studies/satoshi-gazette", image: "/work/satoshi-gazette-2026-08-data.png", alt: "Satoshi Gazette kanıt odaklı Veri Masası" },
      { number: "TX-03", name: "Mortal Vault", status: "Özel alpha · Denetlenmedi", discipline: "Self-custody · Sözleşmeler · Güvenlik", path: "/case-studies/mortal-vault", image: null, alt: "" },
      { number: "TX-04", name: "Sofra", status: "Özel Phase 1", discipline: "Pazar yeri · Güven · İki dilli", path: "/case-studies/sofra", image: null, alt: "" },
    ],
  },
  fr: {
    label: "Index visuel des projets",
    inspect: "Voir le cas",
    projects: [
      { number: "TX-01", name: "HodlStay", status: "Projet client · En ligne", discipline: "Marketplace · Produit · Bitcoin", path: "/case-studies/hodlstay", image: "/work/hodlstay-2026-08-home.png", alt: "Accueil de la marketplace HodlStay" },
      { number: "TX-02", name: "Satoshi Gazette", status: "Produit MaydaLabs · En ligne", discipline: "Média · Données · Opérations", path: "/case-studies/satoshi-gazette", image: "/work/satoshi-gazette-2026-08-data.png", alt: "Data Desk de Satoshi Gazette fondé sur les preuves" },
      { number: "TX-03", name: "Mortal Vault", status: "Alpha privée · Non auditée", discipline: "Autogarde · Contrats · Sécurité", path: "/case-studies/mortal-vault", image: null, alt: "" },
      { number: "TX-04", name: "Sofra", status: "Phase 1 privée", discipline: "Marketplace · Confiance · Bilingue", path: "/case-studies/sofra", image: null, alt: "" },
    ],
  },
} as const;

export function VisualProofReel({
  locale,
  placement = "home",
}: {
  locale: Locale;
  placement?: "home" | "profile";
}) {
  const copy = REEL_COPY[locale];

  return (
    <div
      id={placement === "profile" ? "visual-work" : undefined}
      className={`visual-proof-reel visual-proof-reel-${placement}`}
      aria-label={copy.label}
    >
      {placement === "profile" ? <h2 className="sr-only">{copy.label}</h2> : null}
      {copy.projects.map((project, index) => (
        <Link
          href={localizePath(project.path, locale)}
          className={`visual-proof-card visual-proof-card-${index + 1}`}
          key={project.name}
        >
          <div className="visual-proof-media">
            {project.image ? (
              <Image
                src={project.image}
                alt={project.alt}
                fill
                sizes={index === 0 ? "(max-width: 760px) 88vw, 58vw" : "(max-width: 760px) 88vw, 42vw"}
              />
            ) : (
              <div className={`visual-proof-private visual-proof-private-${index}`} aria-hidden="true">
                <div className="visual-proof-private-grid" />
                <div className="visual-proof-private-orbit"><span /><i /><b /><em /></div>
                <div className="visual-proof-private-wire"><i /><i /><i /></div>
                <strong>{project.name}</strong>
                <small>{project.status}</small>
              </div>
            )}
          </div>
          <div className="visual-proof-caption">
            <div><span>{project.number}</span><small>{project.status}</small></div>
            <h3>{project.name}</h3>
            <p>{project.discipline}</p>
            <strong>{copy.inspect} <span aria-hidden>↗</span></strong>
          </div>
        </Link>
      ))}
    </div>
  );
}
