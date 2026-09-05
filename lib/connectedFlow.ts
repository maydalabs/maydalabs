import type { Locale } from "@/lib/i18n";

export const FLOW_DURATION = 4800;
export const FLOW_PHASES = [[1000, "prepare"], [2000, "review"], [3200, "approve"], [3800, "deliver"], [FLOW_DURATION, "settled"]] as const;
export const STORY_SERVICES = { build: ["websites", "software"], connect: ["automation", "email"], improve: ["support", "software"] } as const;

export const CONNECTED_COPY = {
  en: {
    hero: ["Build what’s next.", "Run it better."],
    intro: "Websites, software and connected workflows—for a new idea or a business ready for its next step.",
    flow: { label: "Illustrative workflow", replay: "Replay illustration", prepared: "Prepared work", review: "Human review", approval: "Human approval", outputs: ["Product", "Workflow", "Customer journey"], description: "Illustrative workflow: information is prepared, held for human review, then approved work becomes a product, workflow or customer journey. No real actions occur." },
    services: {
      kicker: "What do you want to change?", heading: "Start with your next move.", aside: "One useful project, or several connected pieces. Start where you are.", group: "Choose a service example", illustrative: "Illustrative", all: "Explore all five services", includes: "Related services",
      stories: [
        { id: "build", title: "Build something new.", text: "A website, online store, app or customer portal—designed and built to work together.", label: "Customer portal", note: "A place for your customers." },
        { id: "connect", title: "Connect the moving parts.", text: "Bring your tools, repetitive tasks and customer communication into a clearer flow.", label: "Connected workflow", note: "Less copying. Clearer follow-through." },
        { id: "improve", title: "Improve what you have.", text: "Fix the friction, refine the experience and take care of the systems you rely on.", label: "Experience refinement", note: "A better path through your product." },
      ],
      portal: { name: "Your customer space", overview: "Overview", heading: "Everything in one place.", intro: "Projects, documents and the next step.", files: ["Project brief", "Shared files"], next: "Next up · Review the project plan" },
      workflow: [["Enquiry received", "From your website or inbox"], ["Details organised in your CRM", "Context stays with the request"], ["Follow-up prepared", "Human review before sending"]],
      booking: { label: "Booking journey / example", heading: "A clearer way to book.", periods: ["Morning", "Afternoon", "Evening"], summary: "Your choice, the details and what happens next—together before you confirm." },
    },
  },
  tr: {
    hero: ["Fikrinizi hayata geçirin.", "İşinizi kolaylaştırın."],
    intro: "Yeni bir fikir ya da sıradaki adımına hazır bir işletme için web siteleri, yazılım ve birbirine bağlı iş akışları.",
    flow: { label: "Örnek iş akışı", replay: "Animasyonu tekrar oynat", prepared: "Hazırlanan iş", review: "İnsan incelemesi", approval: "İnsan onayı", outputs: ["Ürün", "İş akışı", "Müşteri yolculuğu"], description: "Örnek iş akışı: bilgiler hazırlanır, insan incelemesini bekler; onaylanan çalışma bir ürüne, iş akışına veya müşteri yolculuğuna dönüşür. Gerçek bir işlem yapılmaz." },
    services: {
      kicker: "Neyi değiştirmek istiyorsunuz?", heading: "Sıradaki adımınızla başlayın.", aside: "Tek bir faydalı proje ya da birbirine bağlı birkaç parça. Bulunduğunuz yerden başlayın.", group: "Bir hizmet örneği seçin", illustrative: "Örnek tasarım", all: "Beş hizmetin tamamını inceleyin", includes: "İlgili hizmetler",
      stories: [
        { id: "build", title: "Yeni bir şey geliştirin.", text: "Web sitesi, online mağaza, uygulama veya müşteri portalı. Birlikte çalışacak şekilde tasarlayıp geliştiriyoruz.", label: "Müşteri portalı", note: "Müşterileriniz için ortak bir alan." },
        { id: "connect", title: "İşin parçalarını birleştirin.", text: "Araçlarınızı, tekrarlayan görevleri ve müşteri iletişimini daha düzenli bir akışta bir araya getirin.", label: "Bağlantılı iş akışı", note: "Daha az kopyalama. Daha düzenli takip." },
        { id: "improve", title: "Elinizdekini iyileştirin.", text: "Aksayan noktaları düzeltin, deneyimi iyileştirin ve güvendiğiniz sistemleri bakımlı tutun.", label: "Deneyim iyileştirmesi", note: "Ürününüzde daha anlaşılır bir yol." },
      ],
      portal: { name: "Müşteri alanınız", overview: "Genel bakış", heading: "Her şey tek bir yerde.", intro: "Projeler, belgeler ve sıradaki adım.", files: ["Proje özeti", "Paylaşılan dosyalar"], next: "Sıradaki adım · Proje planını inceleyin" },
      workflow: [["Talep alındı", "Web sitenizden veya gelen kutunuzdan"], ["Bilgiler CRM’inizde düzenlendi", "Ayrıntılar taleple birlikte kalır"], ["Takip mesajı hazırlandı", "Göndermeden önce insan incelemesi"]],
      booking: { label: "Rezervasyon akışı / örnek", heading: "Daha anlaşılır bir rezervasyon.", periods: ["Sabah", "Öğleden sonra", "Akşam"], summary: "Seçiminiz, ayrıntılar ve sonraki adım; onaylamadan önce hepsi bir arada." },
    },
  },
  fr: {
    hero: ["Donnez vie à vos idées.", "Simplifiez votre activité."],
    intro: "Sites web, logiciels et processus connectés—pour une nouvelle idée ou une entreprise prête à avancer.",
    flow: { label: "Processus illustratif", replay: "Rejouer l’illustration", prepared: "Travail préparé", review: "Relecture humaine", approval: "Validation humaine", outputs: ["Produit", "Processus", "Parcours client"], description: "Processus illustratif : les informations sont préparées puis soumises à une relecture humaine. Le travail validé devient un produit, un processus ou un parcours client. Aucune action réelle n’est effectuée." },
    services: {
      kicker: "Que voulez-vous changer ?", heading: "Commencez par la prochaine étape.", aside: "Un projet utile ou plusieurs éléments connectés. Partez de là où vous êtes.", group: "Choisissez un exemple de service", illustrative: "Illustration", all: "Explorer les cinq services", includes: "Services associés",
      stories: [
        { id: "build", title: "Créez quelque chose.", text: "Site web, boutique, application ou portail client : des éléments conçus pour fonctionner ensemble.", label: "Portail client", note: "Un espace pour vos clients." },
        { id: "connect", title: "Reliez les différentes pièces.", text: "Réunissez vos outils, tâches répétitives et communications clients dans un processus plus clair.", label: "Processus connecté", note: "Moins de saisie. Un suivi plus clair." },
        { id: "improve", title: "Améliorez l’existant.", text: "Éliminez les frictions, affinez l’expérience et entretenez les systèmes sur lesquels vous comptez.", label: "Amélioration de l’expérience", note: "Un parcours plus clair dans votre produit." },
      ],
      portal: { name: "Votre espace client", overview: "Vue d’ensemble", heading: "Tout au même endroit.", intro: "Projets, documents et prochaine étape.", files: ["Brief du projet", "Fichiers partagés"], next: "À suivre · Examiner le plan du projet" },
      workflow: [["Demande reçue", "Depuis votre site ou votre boîte mail"], ["Informations classées dans votre CRM", "Le contexte accompagne la demande"], ["Suivi préparé", "Relecture humaine avant l’envoi"]],
      booking: { label: "Parcours de réservation / exemple", heading: "Une réservation plus claire.", periods: ["Matin", "Après-midi", "Soir"], summary: "Votre choix, les détails et la suite du parcours, réunis avant de confirmer." },
    },
  },
} as const satisfies Record<Locale, unknown>;

export type FlowCopy = (typeof CONNECTED_COPY)[Locale]["flow"];
