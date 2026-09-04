import Link from "next/link";
import Image from "next/image";
import { OsRunCard } from "@/components/OsRunCard";
import { OS_DESK_COPY } from "@/components/osCopy";
import { OS_EXAMPLE_LABEL, osExampleRun } from "@/components/osExample";
import { OS_APP_META, OS_APPS } from "@/components/os/OsShell";
import { isOsConfigured } from "@/lib/osDraft";
import { getVerifiedClaims } from "@/lib/supabase/server";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";
import { redirect } from "next/navigation";
import deskPreview from "@/public/os/desk-preview.jpg";

/*
 * MaydaOS, for people who have not signed in.
 *
 * It used to be an interactive lab full of copy about what the company
 * might do. The operating system is real now, so this page shows it: what
 * the apps are, what a run actually produces, and the way in. Signed in,
 * /os boots the machine instead of describing it.
 */

const COPY = {
  en: {
    meta: {
      title: "MaydaOS",
      socialTitle: "MaydaOS · MaydaLabs",
      description:
        "The operating system behind MaydaLabs: give a workflow its sources, it produces the work, and nothing leaves without your approval. Free while in beta.",
    },
    kicker: "MaydaOS",
    heading: ["An operating system", "for the work you repeat."],
    intro:
      "A workflow reads its sources, produces the piece with every claim beside the source it came from, and stops. You read the claims, then approve or send it back. Nothing leaves without you, and nothing is published by us.",
    badges: ["Free while in beta", "Ten runs", "No card"],
    appsKicker: "Five apps",
    exampleKicker: "A real run, not a mock-up",
    exampleIntro:
      "This is what comes back. Read the claims list first: it is what you are approving, and a claim with no source says so.",
    ctaHeading: "Ten runs, free while it is in beta.",
    ctaBody:
      "Sign in with your email and the desk is there. A credit is one run; reading sources, editing, approving and sending back cost nothing.",
    cta: "Open the desk",
    closed: "The beta is not open yet.",
    previewAlt: "The MaydaOS desk: the dock, a workflow ready to run, and a draft waiting for approval.",
  },
  tr: {
    meta: {
      title: "MaydaOS",
      socialTitle: "MaydaOS · MaydaLabs",
      description:
        "MaydaLabs'in arkasındaki işletim sistemi: iş akışına kaynaklarını verin, işi o üretsin, sizin onayınız olmadan hiçbir şey çıkmasın. Beta boyunca ücretsiz.",
    },
    kicker: "MaydaOS",
    heading: ["Tekrarlanan işler için", "bir işletim sistemi."],
    intro:
      "Bir iş akışı kaynaklarını okur, metni her iddia kaynağının yanında olacak şekilde üretir ve durur. Siz iddiaları okur, onaylar ya da geri gönderirsiniz. Sizsiz hiçbir şey çıkmaz; biz de hiçbir şey yayınlamayız.",
    badges: ["Beta boyunca ücretsiz", "On çalıştırma", "Kart yok"],
    appsKicker: "Beş uygulama",
    exampleKicker: "Gerçek bir çalıştırma, maket değil",
    exampleIntro:
      "Geri gelen şey budur. Önce iddialar listesini okuyun: onayladığınız şey odur ve kaynağı olmayan iddia bunu söyler.",
    ctaHeading: "On çalıştırma, beta boyunca ücretsiz.",
    ctaBody:
      "E-postanızla giriş yapın, masa orada. Bir kredi bir çalıştırmadır; kaynakları okumak, düzenlemek, onaylamak ve geri göndermek ücretsizdir.",
    cta: "Masayı aç",
    closed: "Beta henüz açık değil.",
    previewAlt: "MaydaOS masası: uygulama çubuğu, çalıştırılmaya hazır bir iş akışı ve onay bekleyen bir taslak.",
  },
  fr: {
    meta: {
      title: "MaydaOS",
      socialTitle: "MaydaOS · MaydaLabs",
      description:
        "Le systeme d'exploitation derriere MaydaLabs : donnez ses sources a un flux, il produit le travail, et rien ne sort sans votre approbation. Gratuit pendant la beta.",
    },
    kicker: "MaydaOS",
    heading: ["Un systeme d'exploitation", "pour le travail qui revient."],
    intro:
      "Un flux lit ses sources, produit le texte avec chaque affirmation a cote de sa source, puis s'arrete. Vous lisez les affirmations, puis vous approuvez ou vous renvoyez. Rien ne sort sans vous, et nous ne publions rien.",
    badges: ["Gratuit pendant la beta", "Dix executions", "Sans carte"],
    appsKicker: "Cinq applications",
    exampleKicker: "Une vraie execution, pas une maquette",
    exampleIntro:
      "Voici ce qui revient. Lisez d'abord la liste des affirmations : c'est ce que vous approuvez, et une affirmation sans source le dit.",
    ctaHeading: "Dix executions, gratuites pendant la beta.",
    ctaBody:
      "Connectez-vous avec votre email et le bureau est la. Un credit vaut une execution ; lire, editer, approuver et renvoyer ne coutent rien.",
    cta: "Ouvrir le bureau",
    closed: "La beta n'est pas encore ouverte.",
    previewAlt: "Le bureau MaydaOS : le dock, un flux pret a tourner et un brouillon en attente d'approbation.",
  },
} as const;

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({ ...COPY[locale].meta, path: "/os", locale, socialCard: "studio" });
}

export default async function MaydaOsPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const copy = COPY[locale];

  // Signed in, /os is not a page about an operating system: it is the
  // operating system.
  const claims = await getVerifiedClaims();
  if (claims) redirect(localizePath("/os/desk", locale));

  const apps = OS_APP_META[locale];

  return (
    <>
      <section className="mayda-hero">
        <div className="mayda-shell mayda-stack" style={{ maxWidth: "48rem" }}>
          <p className="mayda-kicker">{copy.kicker}</p>
          <h1 className="mayda-display">
            {copy.heading[0]}
            <br />
            <span className="mayda-multiply">{copy.heading[1]}</span>
          </h1>
          <p className="mayda-lead">{copy.intro}</p>
          <div className="flex flex-wrap gap-2">
            {copy.badges.map((badge, index) => (
              <span key={badge} className={"mayda-tag " + (index === 0 ? "is-mint" : "is-cobalt")}>
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mayda-section">
        <div className="mayda-shell">
          <Image
            src={deskPreview}
            alt={copy.previewAlt}
            placeholder="blur"
            sizes="(min-width: 1024px) 60rem, 96vw"
            className="mayda-os-preview"
            priority
          />
        </div>
      </section>

      <section className="mayda-section">
        <div className="mayda-shell mayda-stack">
          <p className="mayda-kicker">{copy.appsKicker}</p>
          <dl className="mayda-dl">
            {OS_APPS.map((app) => (
              <div key={app}>
                <dt>{apps[app].label}</dt>
                <dd>{apps[app].hint}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mayda-section">
        <div className="mayda-shell mayda-stack" style={{ maxWidth: "48rem" }}>
          <p className="mayda-kicker">{copy.exampleKicker}</p>
          <p className="mayda-body">{copy.exampleIntro}</p>
          <OsRunCard
            run={osExampleRun(locale)}
            copy={OS_DESK_COPY[locale]}
            exampleLabel={OS_EXAMPLE_LABEL[locale]}
          />
        </div>
      </section>

      <section className="mayda-section border-t border-[color:var(--border)]">
        <div className="mayda-shell grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="mayda-stack">
            <h2 className="mayda-heading">{isOsConfigured() ? copy.ctaHeading : copy.closed}</h2>
            {isOsConfigured() ? <p className="mayda-body">{copy.ctaBody}</p> : null}
          </div>
          {isOsConfigured() ? (
            <div className="mayda-hero-actions">
              <Link href={localizePath("/os/desk", locale)} className="mayda-button">
                {copy.cta} <span aria-hidden="true">→</span>
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
