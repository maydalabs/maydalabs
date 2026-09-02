import { MultiplierMap } from "@/components/MultiplierMap";
import { getVerifiedClaims } from "@/lib/supabase/server";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";

const COPY = {
  en: {
    meta: {
      title: "Multiplier Map",
      socialTitle: "Map my next move · MaydaLabs",
      description:
        "A free five-question diagnostic with transparent rules. Find the next move that multiplies — before any conversation, account, or commitment.",
    },
    kicker: "Start here / Free diagnostic",
    heading: ["Five questions.", "One clear next move."],
    intro:
      "The Multiplier Map turns your situation into a concrete next-step map: your situation, the honest entry point, the capabilities involved, and what to do first. The rules are deterministic and visible in the result — no AI verdicts.",
    facts: [
      ["01", "About two minutes", "Five questions, one answer each."],
      ["02", "Result first", "You see the full map before any account or contact is asked for."],
      ["03", "Human judgment stays", "The map is a starting point. Scope comes from a conversation."],
    ],
  },
  tr: {
    meta: {
      title: "Multiplier Map",
      socialTitle: "Sonraki hamlemi haritala · MaydaLabs",
      description:
        "Kuralları şeffaf, beş soruluk ücretsiz bir tanı. Herhangi bir görüşme, hesap veya taahhütten önce çarpan etkisi yaratan sonraki hamleyi bulun.",
    },
    kicker: "Buradan başlayın / Ücretsiz tanı",
    heading: ["Beş soru.", "Net bir sonraki hamle."],
    intro:
      "Multiplier Map durumunuzu somut bir sonraki adım haritasına dönüştürür: durumunuz, dürüst giriş noktası, devreye giren yetkinlikler ve önce ne yapılacağı. Kurallar deterministiktir ve sonuçta görünür — yapay zekâ hükmü yok.",
    facts: [
      ["01", "Yaklaşık iki dakika", "Beş soru, her birine tek yanıt."],
      ["02", "Önce sonuç", "Herhangi bir hesap veya iletişim istenmeden haritanın tamamını görürsünüz."],
      ["03", "İnsan yargısı kalır", "Harita bir başlangıç noktasıdır. Kapsam görüşmeden çıkar."],
    ],
  },
  fr: {
    meta: {
      title: "Multiplier Map",
      socialTitle: "Cartographier ma prochaine étape · MaydaLabs",
      description:
        "Un diagnostic gratuit en cinq questions, aux règles transparentes. Trouvez le mouvement qui multiplie — avant tout échange, compte ou engagement.",
    },
    kicker: "Commencez ici / Diagnostic gratuit",
    heading: ["Cinq questions.", "Un prochain mouvement clair."],
    intro:
      "La Multiplier Map transforme votre situation en feuille de route concrète : votre situation, le point d’entrée honnête, les capacités mobilisées et quoi faire en premier. Les règles sont déterministes et visibles dans le résultat — pas de verdict d’IA.",
    facts: [
      ["01", "Environ deux minutes", "Cinq questions, une réponse chacune."],
      ["02", "Le résultat d’abord", "Vous voyez la carte complète avant toute demande de compte ou de contact."],
      ["03", "Le jugement humain reste", "La carte est un point de départ. Le périmètre sort d’une conversation."],
    ],
  },
} as const;

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({ ...COPY[locale].meta, path: "/start", locale, socialCard: "start" });
}

export default async function StartPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const copy = COPY[locale];
  const claims = await getVerifiedClaims();

  return (
    <div className="mayda-shell mayda-section">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14">
        <header className="mayda-stack" style={{ alignContent: "start" }}>
          <p className="mayda-kicker">{copy.kicker}</p>
          <h1 className="mayda-heading">
            {copy.heading[0]}
            <br />
            <span className="mayda-multiply">{copy.heading[1]}</span>
          </h1>
          <p className="mayda-body">{copy.intro}</p>
          <div className="mayda-stack" style={{ marginTop: "1rem" }}>
            {copy.facts.map(([number, title, text]) => (
              <div key={number} className="flex gap-4">
                <span className="mayda-card-number" style={{ paddingTop: "0.2rem" }}>
                  {number}
                </span>
                <p className="mayda-body">
                  <strong>{title}</strong> — {text}
                </p>
              </div>
            ))}
          </div>
        </header>

        <MultiplierMap locale={locale} signedIn={Boolean(claims)} />
      </div>
    </div>
  );
}
