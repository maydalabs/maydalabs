import type { Locale } from "@/lib/i18n";
import type { ServiceId } from "@/lib/services";

type Flow = {
  sources: [string, string, string];
  prepare: string;
  review: string;
  delivery: string;
  detail: string;
};

/** A proposed working process, not a live feed or evidence of a client result. */
export const SERVICE_FLOWS: Record<Locale, Record<ServiceId, Flow>> = {
  en: {
    software: { sources: ["Your users", "Your idea", "Your tools"], prepare: "Working product", review: "You try it", delivery: "Software built around your business", detail: "Agree the scope. Build in reviewable steps. Test the product and hand over the code and guidance defined in your agreement." },
    automation: { sources: ["Requests", "Documents", "Your tools"], prepare: "Connected workflow", review: "You approve", delivery: "Less work between your tools", detail: "Map one process. Connect the steps, add checks and test exceptions. Agree where human approval is needed before it runs." },
    websites: { sources: ["Your offer", "Your content", "Your customers"], prepare: "Working pages", review: "You review", delivery: "A clear path from visit to action", detail: "Plan the journey. Build the pages and integrations. Check mobile, accessibility and key actions before an agreed launch." },
    email: { sources: ["Enquiries", "Your CRM", "Consent"], prepare: "Customer journey", review: "You review", delivery: "Useful messages at the right moment", detail: "Choose a journey. Write the messages and connect triggers. Check consent, timing and opt-out paths before activation." },
    support: { sources: ["The issue", "Your system", "Error reports"], prepare: "Tested repair", review: "You verify", delivery: "A fix you can understand and maintain", detail: "Reproduce the problem. Repair the cause and check for regressions. Agree release and support with a clear change record." },
  },
  tr: {
    software: { sources: ["Kullanıcılarınız", "Fikriniz", "Araçlarınız"], prepare: "Çalışan ürün", review: "Siz deneyin", delivery: "İşinize göre geliştirilen yazılım", detail: "Kapsamı birlikte belirleyelim. İnceleyebileceğiniz adımlarla geliştirelim. Ürünü test edip anlaşmada belirlenen kod ve rehberleri teslim edelim." },
    automation: { sources: ["Talepler", "Belgeler", "Araçlarınız"], prepare: "Bağlı iş akışı", review: "Siz onaylayın", delivery: "Araçlar arasında daha az iş", detail: "Bir süreci haritalayalım. Adımları bağlayıp kontroller ekleyelim ve istisnaları test edelim. Çalıştırmadan önce insan onayı gereken noktaları belirleyelim." },
    websites: { sources: ["Teklifiniz", "İçeriğiniz", "Müşterileriniz"], prepare: "Çalışan sayfalar", review: "Siz inceleyin", delivery: "Ziyaretten aksiyona net bir yol", detail: "Kullanıcı yolculuğunu planlayalım. Sayfa ve entegrasyonları geliştirelim. Yayından önce mobil görünümü, erişilebilirliği ve temel işlemleri kontrol edelim." },
    email: { sources: ["Başvurular", "CRM sisteminiz", "İzinler"], prepare: "Müşteri yolculuğu", review: "Siz inceleyin", delivery: "Doğru zamanda faydalı mesajlar", detail: "Bir yolculuk seçelim. Mesajları yazıp tetikleyicileri bağlayalım. Etkinleştirmeden önce izinleri, zamanlamayı ve abonelikten çıkışı kontrol edelim." },
    support: { sources: ["Sorun", "Sisteminiz", "Hata kayıtları"], prepare: "Test edilmiş çözüm", review: "Siz doğrulayın", delivery: "Anlaşılır ve sürdürülebilir bir çözüm", detail: "Sorunu yeniden üretelim. Nedenini giderip diğer işlevleri kontrol edelim. Değişiklik kaydıyla yayın ve desteği birlikte belirleyelim." },
  },
  fr: {
    software: { sources: ["Vos utilisateurs", "Votre idée", "Vos outils"], prepare: "Produit fonctionnel", review: "Vous essayez", delivery: "Un logiciel adapté à votre entreprise", detail: "Définir le périmètre. Construire par étapes que vous pouvez examiner. Tester, puis transmettre le code et les guides prévus dans votre accord." },
    automation: { sources: ["Demandes", "Documents", "Vos outils"], prepare: "Processus connecté", review: "Vous approuvez", delivery: "Moins de travail entre vos outils", detail: "Cartographier un processus. Relier les étapes, ajouter des contrôles et tester les exceptions. Définir les validations humaines avant la mise en route." },
    websites: { sources: ["Votre offre", "Vos contenus", "Vos clients"], prepare: "Pages fonctionnelles", review: "Vous vérifiez", delivery: "Un chemin clair de la visite à l’action", detail: "Concevoir le parcours. Construire les pages et les intégrations. Vérifier le mobile, l’accessibilité et les actions clés avant une mise en ligne convenue." },
    email: { sources: ["Demandes", "Votre CRM", "Consentement"], prepare: "Parcours client", review: "Vous vérifiez", delivery: "Des messages utiles au bon moment", detail: "Choisir un parcours. Rédiger les messages et relier les déclencheurs. Vérifier consentement, calendrier et désabonnement avant l’activation." },
    support: { sources: ["Le problème", "Votre système", "Rapports d’erreur"], prepare: "Correction testée", review: "Vous validez", delivery: "Une correction compréhensible et durable", detail: "Reproduire le problème. Corriger la cause et vérifier les régressions. Convenir de la mise en ligne et du suivi, avec un relevé des changements." },
  },
};

export const SERVICE_FLOW_UI: Record<Locale, { heading: string; inputs: string; handover: string }> = {
  en: { heading: "How we work with you", inputs: "Start with your context", handover: "Agreed delivery" },
  tr: { heading: "Birlikte nasıl çalışırız?", inputs: "Sizin ihtiyaçlarınızla başlarız", handover: "Birlikte belirlenen teslim" },
  fr: { heading: "Comment nous travaillons avec vous", inputs: "Partir de votre contexte", handover: "Livraison convenue" },
};
