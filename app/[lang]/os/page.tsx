import Link from "next/link";
import { FieldFigure } from "@/components/FieldFigure";
import { MaydaOSLab } from "@/components/MaydaOSLab";
import { MAYDA_OS_COPY } from "@/components/maydaOsLabCopy";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";

const COPY = {
  en: {
    meta: {
      title: "MaydaOS Lab",
      socialTitle: "MaydaOS Lab · MaydaLabs",
      description:
        "The interactive proof layer inside MaydaLabs v3. Explore how product engineering, automation, lifecycle growth, and security connect.",
    },
    kicker: "MaydaOS / Lab",
    heading: ["MaydaOS is back.", "This time, it knows its job."],
    intro:
      "MaydaLabs is the company. MaydaOS is its interactive lab: a working interface for exploring how ideas, products, workflows, growth, and security connect—without making the commercial homepage harder to understand.",
    badges: ["Built into v3", "No wallet required", "Interactive proof"],
    fieldLabel: "One input · connected systems · several useful outputs",
    closingKicker: "The hierarchy is now clear",
    closingHeading: "The commercial site stays simple. The lab earns the complexity.",
    closingBody:
      "Use MaydaOS to explore the system. Use the Multiplier Map when you want to turn your own situation into a concrete next move.",
    primaryAction: "Map my next move",
    secondaryAction: "Return to MaydaLabs",
  },
  tr: {
    meta: {
      title: "MaydaOS Lab",
      socialTitle: "MaydaOS Lab · MaydaLabs",
      description:
        "MaydaLabs v3 içindeki etkileşimli kanıt katmanı. Ürün mühendisliği, otomasyon, yaşam döngüsü büyümesi ve güvenliğin nasıl bağlandığını keşfedin.",
    },
    kicker: "MaydaOS / Lab",
    heading: ["MaydaOS geri döndü.", "Bu kez görevini biliyor."],
    intro:
      "Şirket MaydaLabs. MaydaOS ise onun etkileşimli laboratuvarı: ticari ana sayfayı anlaşılmaz hâle getirmeden fikirlerin, ürünlerin, iş akışlarının, büyümenin ve güvenliğin nasıl bağlandığını keşfeden çalışan bir arayüz.",
    badges: ["v3 içine işlendi", "Cüzdan gerekmez", "Etkileşimli kanıt"],
    fieldLabel: "Tek girdi · bağlı sistemler · birden fazla yararlı çıktı",
    closingKicker: "Hiyerarşi artık net",
    closingHeading: "Ticari site sade kalır. Karmaşıklığı laboratuvar hak eder.",
    closingBody:
      "Sistemi keşfetmek için MaydaOS'i kullanın. Kendi durumunuzu somut bir sonraki hamleye çevirmek istediğinizde Multiplier Map'i kullanın.",
    primaryAction: "Sonraki hamlemi haritala",
    secondaryAction: "MaydaLabs'e dön",
  },
  fr: {
    meta: {
      title: "MaydaOS Lab",
      socialTitle: "MaydaOS Lab · MaydaLabs",
      description:
        "La couche de preuve interactive de MaydaLabs v3. Explorez comment ingénierie produit, automatisation, cycle de vie et sécurité se connectent.",
    },
    kicker: "MaydaOS / Lab",
    heading: ["MaydaOS est de retour.", "Cette fois, son rôle est clair."],
    intro:
      "MaydaLabs est l’entreprise. MaydaOS est son laboratoire interactif : une interface fonctionnelle pour explorer comment idées, produits, flux de travail, croissance et sécurité se connectent—sans rendre la page commerciale plus difficile à comprendre.",
    badges: ["Intégré à v3", "Aucun portefeuille requis", "Preuve interactive"],
    fieldLabel: "Une entrée · systèmes connectés · plusieurs sorties utiles",
    closingKicker: "La hiérarchie est désormais claire",
    closingHeading: "Le site commercial reste simple. Le laboratoire mérite la complexité.",
    closingBody:
      "Utilisez MaydaOS pour explorer le système. Utilisez la Multiplier Map lorsque vous souhaitez transformer votre propre situation en prochain mouvement concret.",
    primaryAction: "Cartographier ma prochaine étape",
    secondaryAction: "Retourner à MaydaLabs",
  },
} as const;

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const metadata = createPageMetadata({
    ...COPY[locale].meta,
    path: "/os",
    locale,
    socialCard: "studio",
  });

  return {
    ...metadata,
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function MaydaOsPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const copy = COPY[locale];

  return (
    <>
      <section className="mayda-hero">
        <div className="mayda-shell mayda-hero-grid">
          <div className="mayda-stack">
            <p className="mayda-kicker">{copy.kicker}</p>
            <h1 className="mayda-display">
              {copy.heading[0]}
              <br />
              <span className="mayda-multiply">{copy.heading[1]}</span>
            </h1>
            <p className="mayda-lead">{copy.intro}</p>
            <div className="flex flex-wrap gap-2">
              {copy.badges.map((badge, index) => (
                <span
                  key={badge}
                  className={"mayda-tag " + (index === 1 ? "is-mint" : "is-cobalt")}
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="mayda-card" aria-label={copy.fieldLabel}>
            <FieldFigure />
            <p className="mayda-mono mt-3 text-[color:var(--mist)]">{copy.fieldLabel}</p>
          </div>
        </div>
      </section>

      <section className="mayda-shell-wide pb-[clamp(4rem,9vw,7rem)]">
        <MaydaOSLab locale={locale} copy={MAYDA_OS_COPY[locale]} />
      </section>

      <section className="mayda-section border-t border-[color:var(--border)]">
        <div className="mayda-shell grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="mayda-stack">
            <p className="mayda-kicker">{copy.closingKicker}</p>
            <h2 className="mayda-heading">{copy.closingHeading}</h2>
            <p className="mayda-body">{copy.closingBody}</p>
          </div>
          <div className="mayda-hero-actions">
            <Link href={localizePath("/start", locale)} className="mayda-button">
              {copy.primaryAction} <span aria-hidden="true">→</span>
            </Link>
            <Link
              href={localizePath("/", locale)}
              className="mayda-button mayda-button-outline"
            >
              {copy.secondaryAction}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
