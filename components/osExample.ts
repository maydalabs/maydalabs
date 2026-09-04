import type { Locale } from "@/lib/i18n";
import type { OsRunRecord } from "@/components/OsRunCard";

/* A worked example, shown to anyone who has not run anything yet.
 *
 * It costs nothing and calls nothing: the point is that a person can see the
 * shape of the output, and specifically the claims list, before they decide
 * to spend one of their ten credits.
 *
 * The claims cite MaydaLabs' own public pages, which say exactly this, so the
 * example is not a fabrication dressed up as evidence. The last claim carries
 * no source on purpose: that is the marker a reader has to learn to look for.
 */

const PROOF = "https://maydalabs.com/proof";
const APPROACH = "https://maydalabs.com/approach";

export const OS_EXAMPLE_LABEL: Record<Locale, string> = {
  en: "Example",
  tr: "Örnek",
  fr: "Exemple",
};

export const OS_EXAMPLE_NOTE: Record<Locale, string> = {
  en: "An example run, so you can see the shape before you spend a credit. Read the claims list first: that is what you are approving.",
  tr: "Kredi harcamadan biçimi görebilmeniz için örnek bir çalıştırma. Önce iddialar listesini okuyun: onayladığınız şey odur.",
  fr: "Une execution d'exemple, pour voir la forme avant de depenser un credit. Lisez d'abord la liste des affirmations : c'est ce que vous approuvez.",
};

const DRAFTS: Record<Locale, { topic: string; draft: string; claims: { text: string; source_url: string | null }[] }> = {
  en: {
    topic: "How an approval gate changes what AI can be trusted with",
    draft:
      "Most objections to putting AI into an operation are really objections to losing control of it. The fix is not a better model. It is a gate.\n\nMaydaLabs installs workflows where the system produces the work and a named person approves every external action. A claim either carries the source it came from or is marked unverified, and the pipeline enforces that rather than a policy document. The same system runs Satoshi Gazette in public, so the mechanism can be inspected before anyone buys it.\n\nEngagements start with a single workflow over three to four weeks, installed in the client's own accounts. That is a small enough bet to be worth making.",
    claims: [
      { text: "The system produces the work and a named person approves every external action.", source_url: PROOF },
      { text: "A claim either carries its source or is marked unverified, enforced by the pipeline.", source_url: PROOF },
      { text: "Satoshi Gazette runs on the same system, in public, so it can be inspected first.", source_url: PROOF },
      { text: "A pilot is one workflow, three to four weeks, in the client's own accounts.", source_url: APPROACH },
      { text: "Most objections to AI in an operation are really objections to losing control.", source_url: null },
    ],
  },
  tr: {
    topic: "Onay kapısı, yapay zekâya neyin emanet edilebileceğini nasıl değiştirir",
    draft:
      "Yapay zekâyı bir operasyona sokmaya yönelik itirazların çoğu, aslında kontrolü kaybetmeye yönelik itirazlardır. Çözüm daha iyi bir model değil. Bir kapı.\n\nMaydaLabs, işi sistemin ürettiği ve dışa dönük her eylemi adı belli bir insanın onayladığı iş akışları kurar. Bir iddia ya geldiği kaynağı taşır ya da doğrulanmamış olarak işaretlenir; bunu bir politika belgesi değil, hattın kendisi uygular. Aynı sistem Satoshi Gazette'i herkese açık biçimde yürütür; yani mekanizma satın alınmadan önce incelenebilir.\n\nÇalışma, müşterinin kendi hesaplarına kurulan tek bir iş akışıyla, üç-dört hafta içinde başlar. Bu, yapmaya değecek kadar küçük bir bahistir.",
    claims: [
      { text: "İşi sistem üretir, dışa dönük her eylemi adı belli bir insan onaylar.", source_url: PROOF },
      { text: "Bir iddia ya kaynağını taşır ya doğrulanmamış olarak işaretlenir; bunu hat uygular.", source_url: PROOF },
      { text: "Satoshi Gazette aynı sistemle, herkese açık çalışır; önce incelenebilir.", source_url: PROOF },
      { text: "Pilot, müşterinin kendi hesaplarında, üç-dört haftalık tek bir iş akışıdır.", source_url: APPROACH },
      { text: "Yapay zekâya yönelik itirazların çoğu aslında kontrol kaybına yöneliktir.", source_url: null },
    ],
  },
  fr: {
    topic: "Ce qu'une barriere d'approbation change a ce qu'on peut confier a l'IA",
    draft:
      "La plupart des objections a l'IA dans une operation sont en realite des objections a la perte de controle. La reponse n'est pas un meilleur modele. C'est une barriere.\n\nMaydaLabs installe des flux ou le systeme produit le travail et ou une personne nommee approuve chaque action externe. Une affirmation porte sa source ou est marquee non verifiee, et c'est le pipeline qui l'impose, pas une note de service. Le meme systeme fait tourner Satoshi Gazette en public : le mecanisme peut donc etre inspecte avant tout achat.\n\nUne mission commence par un seul flux, sur trois a quatre semaines, installe dans les comptes du client. Un pari assez petit pour valoir la peine.",
    claims: [
      { text: "Le systeme produit le travail et une personne nommee approuve chaque action externe.", source_url: PROOF },
      { text: "Une affirmation porte sa source ou est marquee non verifiee, impose par le pipeline.", source_url: PROOF },
      { text: "Satoshi Gazette tourne sur le meme systeme, en public, donc inspectable.", source_url: PROOF },
      { text: "Un pilote est un flux, trois a quatre semaines, dans les comptes du client.", source_url: APPROACH },
      { text: "La plupart des objections a l'IA visent en realite la perte de controle.", source_url: null },
    ],
  },
};

export function osExampleRun(locale: Locale): OsRunRecord {
  const content = DRAFTS[locale];
  return {
    id: "example",
    shape: "post",
    topic: content.topic,
    sources: [
      { url: PROOF, title: "The system, in public", chars: 4200 },
      { url: APPROACH, title: "Offers and pilot scope", chars: 3100 },
    ],
    status: "drafted",
    draft: content.draft,
    claims: content.claims,
    decision: "pending",
    decision_note: null,
    error: null,
    created_at: new Date(0).toISOString(),
  };
}
