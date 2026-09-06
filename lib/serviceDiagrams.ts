import type { Locale } from "@/lib/i18n";

type Pair = readonly [string, string];
type DiagramCopy = {
  software: { title: string; layers: readonly [Pair, Pair, Pair]; review: string };
  automation: { trigger: Pair; process: Pair; approved: Pair; exception: Pair; retry: string };
  websites: { page: string; phone: string; headline: string; action: string; steps: readonly [string, string, string] };
  email: { consent: string; stages: readonly [Pair, Pair, Pair]; exit: string };
  support: { issue: Pair; cause: Pair; patch: string; checks: readonly [string, string, string]; loop: string };
};

/** Explanatory working models, not screenshots of live systems or customer results. */
export const SERVICE_DIAGRAMS: Record<Locale, DiagramCopy> = {
  en: {
    software: { title: "One product. Connected layers.", layers: [["Interface", "The screens your team and customers use"], ["Business logic", "Rules, permissions and integrations"], ["Data", "The records behind every action"]], review: "Build → Try together → Refine" },
    automation: { trigger: ["A request arrives", "Form, document or connected tool"], process: ["Prepare the work", "Rules + AI where useful"], approved: ["Human approval", "Continue to the connected tool"], exception: ["Needs attention", "Pause for a person to resolve"], retry: "Resolve & return to the workflow" },
    websites: { page: "The customer view", phone: "Mobile", headline: "A clear offer.", action: "A clear next step", steps: ["Understand the offer", "Find what matters", "Enquire or buy"] },
    email: { consent: "Start with consent & preferences", stages: [["Welcome", "Help a new customer get started"], ["Guide", "Send help relevant to their next step"], ["Follow up", "Respond to what they do next"]], exit: "Preferences change? Update or stop the journey." },
    support: { issue: ["Reproduce the issue", "Trace the failing journey"], cause: ["Find the cause", "Follow the logs and dependencies"], patch: "A focused repair", checks: ["Original issue", "Connected features", "Release & recovery plan"], loop: "Verify → Review → Release → Observe" },
  },
  tr: {
    software: { title: "Tek ürün. Bağlantılı katmanlar.", layers: [["Arayüz", "Ekibinizin ve müşterilerinizin kullandığı ekranlar"], ["İş mantığı", "Kurallar, izinler ve entegrasyonlar"], ["Veri", "Her işlemin arkasındaki kayıtlar"]], review: "Geliştir → Birlikte dene → İyileştir" },
    automation: { trigger: ["Bir talep gelir", "Form, belge veya bağlı araç"], process: ["İşi hazırla", "Kurallar + gerektiğinde yapay zekâ"], approved: ["İnsan onayı", "Bağlı araçta devam et"], exception: ["İlgi gerekiyor", "Bir kişi çözene kadar beklet"], retry: "Çöz ve iş akışına dön" },
    websites: { page: "Müşterinin gördüğü", phone: "Mobil", headline: "Net bir teklif.", action: "Net bir sonraki adım", steps: ["Teklifi anla", "İhtiyacını bul", "İletişime geç veya satın al"] },
    email: { consent: "İzin ve tercihlerle başla", stages: [["Karşıla", "Yeni müşterinin başlamasına yardımcı ol"], ["Yol göster", "Sonraki adımına uygun yardım sun"], ["Takip et", "Bir sonraki davranışına göre iletişim kur"]], exit: "Tercihler değişti mi? Yolculuğu güncelle veya durdur." },
    support: { issue: ["Sorunu yeniden üret", "Aksayan yolculuğu izle"], cause: ["Nedenini bul", "Kayıtları ve bağımlılıkları takip et"], patch: "Hedefli bir düzeltme", checks: ["Asıl sorun", "Bağlantılı işlevler", "Yayın ve geri dönüş planı"], loop: "Doğrula → İncele → Yayınla → Gözlemle" },
  },
  fr: {
    software: { title: "Un produit. Des couches reliées.", layers: [["Interface", "Les écrans de votre équipe et de vos clients"], ["Logique métier", "Règles, permissions et intégrations"], ["Données", "Les informations derrière chaque action"]], review: "Construire → Essayer ensemble → Affiner" },
    automation: { trigger: ["Une demande arrive", "Formulaire, document ou outil connecté"], process: ["Préparer le travail", "Des règles + l’IA si utile"], approved: ["Validation humaine", "Continuer dans l’outil connecté"], exception: ["À examiner", "Mettre en pause pour une personne"], retry: "Résoudre et reprendre le processus" },
    websites: { page: "Le parcours client", phone: "Mobile", headline: "Une offre claire.", action: "Une prochaine étape claire", steps: ["Comprendre l’offre", "Trouver l’essentiel", "Contacter ou acheter"] },
    email: { consent: "Partir du consentement et des préférences", stages: [["Accueillir", "Aider un nouveau client à démarrer"], ["Guider", "Une aide adaptée à sa prochaine étape"], ["Accompagner", "Réagir à ce qu’il fait ensuite"]], exit: "Les préférences changent ? Adapter ou arrêter le parcours." },
    support: { issue: ["Reproduire le problème", "Suivre le parcours défaillant"], cause: ["Trouver la cause", "Examiner les logs et dépendances"], patch: "Une correction ciblée", checks: ["Problème initial", "Fonctions liées", "Mise en ligne et retour arrière"], loop: "Vérifier → Examiner → Livrer → Observer" },
  },
};
