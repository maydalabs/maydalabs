import type { Locale } from "@/lib/i18n";

/* Client-facing copy for the "prepared for you" proposal (EN/TR/FR). The
 * proposal CONTENT is authored per prospect by an operator; only the
 * frame around it is localized here. */

export type ProposalCopy = {
  preparedFor: (company: string) => string;
  portalHeading: (company: string) => string;
  portalLead: string;
  fromLabel: string;
  signature: string;
  originJob: (role: string) => string;
  originReferral: string;
  roleSection: string;
  noticedSection: string;
  unsourced: string;
  sourceLabel: string;
  sampleSection: string;
  sampleDefaultTitle: string;
  sampleNoteLabel: string;
  scopeSection: string;
  termsSection: string;
  ctaDefault: string;
  ctaSecondary: string;
  openFull: string;
  draftBadge: string;
};

export const PROPOSAL_COPY: Record<Locale, ProposalCopy> = {
  en: {
    preparedFor: (company) => `Prepared for ${company}`,
    portalHeading: (company) => `Prepared for ${company}.`,
    portalLead: "This was built before we ever spoke. Read it at your pace; nothing here runs without your say-so.",
    fromLabel: "Why I reached out",
    signature: "Mehmet Emin Mayda · MaydaLabs",
    originJob: (role) => `This started as my application for the ${role} role. The pilot below is the same work, offered as a system instead of a seat.`,
    originReferral: "You were introduced to us; this is what we prepared before asking for your time.",
    roleSection: "The role, and the alternative",
    noticedSection: "What we noticed",
    unsourced: "no public source",
    sourceLabel: "source",
    sampleSection: "A sample, already produced",
    sampleDefaultTitle: "Sample output",
    sampleNoteLabel: "How this was made",
    scopeSection: "The pilot, week by week",
    termsSection: "Terms",
    ctaDefault: "Book a 20-minute call",
    ctaSecondary: "Or reply to the email you received",
    openFull: "Open the full proposal",
    draftBadge: "Draft · not visible to the client",
  },
  tr: {
    preparedFor: (company) => `${company} için hazırlandı`,
    portalHeading: (company) => `${company} için hazırlandı.`,
    portalLead: "Bu, daha konuşmadan önce hazırlandı. Kendi hızınızda okuyun; burada hiçbir şey sizin onayınız olmadan çalışmaz.",
    fromLabel: "Neden yazdım",
    signature: "Mehmet Emin Mayda · MaydaLabs",
    originJob: (role) => `Bu, ${role} rolüne başvurumla başladı. Aşağıdaki pilot aynı iş; bir koltuk yerine bir sistem olarak sunuluyor.`,
    originReferral: "Bize tanıştırıldınız; vaktinizi istemeden önce hazırladığımız şey bu.",
    roleSection: "Rol ve alternatifi",
    noticedSection: "Fark ettiklerimiz",
    unsourced: "herkese açık kaynak yok",
    sourceLabel: "kaynak",
    sampleSection: "Hazır bir örnek",
    sampleDefaultTitle: "Örnek çıktı",
    sampleNoteLabel: "Nasıl üretildi",
    scopeSection: "Pilot, hafta hafta",
    termsSection: "Koşullar",
    ctaDefault: "20 dakikalık görüşme ayarla",
    ctaSecondary: "Ya da aldığınız e-postayı yanıtlayın",
    openFull: "Teklifin tamamını aç",
    draftBadge: "Taslak · müşteri görmüyor",
  },
  fr: {
    preparedFor: (company) => `Préparé pour ${company}`,
    portalHeading: (company) => `Préparé pour ${company}.`,
    portalLead: "Ceci a été préparé avant même que nous parlions. Lisez à votre rythme ; rien ici ne tourne sans votre accord.",
    fromLabel: "Pourquoi je vous ai écrit",
    signature: "Mehmet Emin Mayda · MaydaLabs",
    originJob: (role) => `Tout a commencé par ma candidature au poste de ${role}. Le pilote ci-dessous est le même travail, proposé comme un système plutôt qu'un poste.`,
    originReferral: "On nous a présentés ; voici ce que nous avons préparé avant de demander votre temps.",
    roleSection: "Le poste, et l'alternative",
    noticedSection: "Ce que nous avons remarqué",
    unsourced: "pas de source publique",
    sourceLabel: "source",
    sampleSection: "Un échantillon, déjà produit",
    sampleDefaultTitle: "Exemple de production",
    sampleNoteLabel: "Comment il a été produit",
    scopeSection: "Le pilote, semaine par semaine",
    termsSection: "Conditions",
    ctaDefault: "Réserver un appel de 20 minutes",
    ctaSecondary: "Ou répondez à l'e-mail reçu",
    openFull: "Ouvrir la proposition complète",
    draftBadge: "Brouillon · invisible pour le client",
  },
};
