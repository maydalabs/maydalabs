import { ContactBrief } from "@/components/ContactBrief";
import { getIntroCallUrl } from "@/lib/marketingLinks";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";

const COPY = {
  en: {
    meta: {
      title: "Start a conversation",
      socialTitle: "Tell us what you need · MaydaLabs",
      description:
        "Discuss a website, software project, automation, email journey or repair. Send a short enquiry without creating an account.",
    },
    availability: "Open for new work",
    kicker: "Contact / Direct channel",
    heading: ["Tell us what you need.","Let’s work out the next step."],
    intro:
      "A website, an app, an automation or something that needs fixing — tell us what you have in mind. You do not need a finished brief or an account. Your enquiry is reviewed by a person.",
    call: "Book a 30-minute call",
    email: "Email directly",
    stepsKicker: "After you reach out",
    stepsHeading: "A clear next step, not a sales maze.",
    steps: [
      ["01", "Fit and direction", "We look at the problem, who it affects, what exists, and whether MaydaLabs can help."],
      ["02", "First useful phase", "We identify the smallest credible phase, the important risks, and what evidence should exist at the end."],
      ["03", "Tailored proposal", "If there is a fit, scope, timing, responsibilities, and commercial terms follow in writing."],
    ],
    location: "Founder-led from Istanbul, working with teams anywhere.",
    brief: {
      nameLabel: "Your name",
      emailLabel: "Work email",
      emailPlaceholder: "you@company.com",
      companyLabel: "Company or product",
      stageLabel: "Stage",
      stages: [
        ["idea", "Idea"],
        ["launched", "Launched"],
        ["growing", "Growing"],
        ["established", "Established"],
      ],
      constraintLabel: "What needs attention?",
      constraints: [
        ["product_not_built", "Product doesn't exist yet"],
        ["product_stuck", "Product is stuck"],
        ["growth_flat", "Growth is flat"],
        ["operations_drag", "Too much manual work"],
        ["reliability_risk", "Reliability / security"],
        ["unclear", "Unclear"],
      ],
      timelineLabel: "Timeline",
      timelines: [
        ["now", "Now"],
        ["quarter", "This quarter"],
        ["exploring", "Still exploring"],
      ],
      budgetLabel: "Budget range",
      budgets: [
        ["undisclosed", "Prefer not to say"],
        ["under_10k", "Under $10k"],
        ["10k_30k", "$10k–30k"],
        ["30k_plus", "$30k+"],
      ],
      optional: "optional",
      messageLabel: "What would you like to build or improve?",
      messageHint: "Tell us what you need, what already exists and what a useful result would look like. At least 24 characters.",
      consentContact: "MaydaLabs may store these details and contact me about this request.",
      consentUpdates: "Send me occasional product and build updates by email (free, revocable any time).",
      submit: "Send enquiry",
      done: "Received.",
      doneHint: "Your enquiry is saved for human review. We will use your email to follow up about this request.",
      errors: {
        invalid: "Check the highlighted fields.",
        consent_required: "The contact consent is required to send this.",
        rate_limited: "Too many submissions. Wait a while and try again.",
        save_failed: "Sending failed. Try again in a moment or email directly.",
      },
    },
  },
  tr: {
    meta: {
      title: "Bir görüşme başlatın",
      socialTitle: "İhtiyacınızı anlatın · MaydaLabs",
      description:
        "Web sitesi, yazılım, otomasyon, e-posta akışı veya düzeltme ihtiyacınızı konuşalım. Hesap açmadan kısa bir talep gönderin.",
    },
    availability: "Yeni işlere açık",
    kicker: "İletişim / Doğrudan kanal",
    heading: ["Neye ihtiyacınız olduğunu anlatın.","Sonraki adımı birlikte belirleyelim."],
    intro:
      "Bir web sitesi, uygulama, otomasyon veya düzeltilmesi gereken bir şey: aklınızdakini anlatın. Hazır bir brief'e veya hesaba ihtiyacınız yok. Talebinizi bir insan inceler.",
    call: "30 dakikalık görüşme ayarla",
    email: "Doğrudan e-posta yaz",
    stepsKicker: "Ulaştıktan sonra",
    stepsHeading: "Satış labirenti değil, net bir sonraki adım.",
    steps: [
      ["01", "Uyum ve yön", "Problemi, kimi etkilediğini, neyin mevcut olduğunu ve MaydaLabs'in doğru operatör olup olmadığını inceleriz."],
      ["02", "İlk faydalı aşama", "En küçük güvenilir aşamayı, önemli riskleri ve sonunda hangi kanıtların bulunması gerektiğini belirleriz."],
      ["03", "Size özel teklif", "Uyum varsa kapsam, zamanlama, sorumluluklar ve ticari koşullar yazılı olarak gelir."],
    ],
    location: "İstanbul'dan, dünyanın her yerindeki ekiplerle kurucu liderliğinde.",
    brief: {
      nameLabel: "Adınız",
      emailLabel: "İş e-postası",
      emailPlaceholder: "siz@sirket.com",
      companyLabel: "Şirket veya ürün",
      stageLabel: "Aşama",
      stages: [
        ["idea", "Fikir"],
        ["launched", "Yayında"],
        ["growing", "Büyüyor"],
        ["established", "Oturmuş"],
      ],
      constraintLabel: "Neyin iyileşmesi gerekiyor?",
      constraints: [
        ["product_not_built", "Ürün henüz yok"],
        ["product_stuck", "Ürün tıkandı"],
        ["growth_flat", "Büyüme düz"],
        ["operations_drag", "Çok fazla manuel iş"],
        ["reliability_risk", "Güvenilirlik / güvenlik"],
        ["unclear", "Belirsiz"],
      ],
      timelineLabel: "Zamanlama",
      timelines: [
        ["now", "Şimdi"],
        ["quarter", "Bu çeyrek"],
        ["exploring", "Hâlâ araştırıyorum"],
      ],
      budgetLabel: "Bütçe aralığı",
      budgets: [
        ["undisclosed", "Belirtmek istemiyorum"],
        ["under_10k", "10 bin doların altı"],
        ["10k_30k", "10–30 bin dolar"],
        ["30k_plus", "30 bin dolar üzeri"],
      ],
      optional: "opsiyonel",
      messageLabel: "Ne geliştirmek veya iyileştirmek istiyorsunuz?",
      messageHint: "İhtiyacınızı, elinizde ne olduğunu ve faydalı bir sonucun neyi değiştireceğini anlatın. En az 24 karakter.",
      consentContact: "MaydaLabs bu bilgileri saklayabilir ve bu talep hakkında benimle iletişime geçebilir.",
      consentUpdates: "Bana ara sıra ürün ve geliştirme güncellemeleri gönderin (ücretsiz, her an iptal edilebilir).",
      submit: "Talebi gönder",
      done: "Alındı.",
      doneHint: "Talebiniz insan incelemesi için kaydedildi. Bu talebi takip etmek için e-posta adresinizi kullanacağız.",
      errors: {
        invalid: "İşaretli alanları kontrol edin.",
        consent_required: "Göndermek için iletişim onayı gereklidir.",
        rate_limited: "Çok fazla gönderim. Bir süre bekleyip tekrar deneyin.",
        save_failed: "Gönderim başarısız. Az sonra tekrar deneyin veya doğrudan e-posta yazın.",
      },
    },
  },
  fr: {
    meta: {
      title: "Démarrer un échange",
      socialTitle: "Parlez-nous de votre besoin · MaydaLabs",
      description:
        "Parlons de votre site, logiciel, automatisation, parcours email ou réparation. Envoyez une demande sans créer de compte.",
    },
    availability: "Ouvert à de nouveaux projets",
    kicker: "Contact / Canal direct",
    heading: ["Parlez-nous de votre besoin.","Définissons la prochaine étape."],
    intro:
      "Un site, une application, une automatisation ou quelque chose à réparer : dites-nous ce que vous avez en tête. Aucun brief finalisé ni compte nécessaire. Une personne examine votre demande.",
    call: "Réserver un échange de 30 minutes",
    email: "Écrire directement",
    stepsKicker: "Après votre message",
    stepsHeading: "Une prochaine étape claire, pas un labyrinthe commercial.",
    steps: [
      ["01", "Adéquation et direction", "Nous examinons le problème, son public, l'existant et si MaydaLabs est le bon opérateur."],
      ["02", "Première phase utile", "Nous identifions la plus petite phase crédible, les risques importants et les preuves attendues à la fin."],
      ["03", "Proposition sur mesure", "S'il y a adéquation, périmètre, calendrier, responsabilités et conditions commerciales suivent par écrit."],
    ],
    location: "Piloté depuis Istanbul, avec des équipes partout dans le monde.",
    brief: {
      nameLabel: "Votre nom",
      emailLabel: "E-mail professionnel",
      emailPlaceholder: "vous@entreprise.com",
      companyLabel: "Entreprise ou produit",
      stageLabel: "Stade",
      stages: [
        ["idea", "Idée"],
        ["launched", "Lancée"],
        ["growing", "En croissance"],
        ["established", "Établie"],
      ],
      constraintLabel: "Que faut-il améliorer ?",
      constraints: [
        ["product_not_built", "Le produit n'existe pas encore"],
        ["product_stuck", "Le produit est bloqué"],
        ["growth_flat", "La croissance est plate"],
        ["operations_drag", "Trop de travail manuel"],
        ["reliability_risk", "Fiabilité / sécurité"],
        ["unclear", "Flou"],
      ],
      timelineLabel: "Délai",
      timelines: [
        ["now", "Maintenant"],
        ["quarter", "Ce trimestre"],
        ["exploring", "Encore en exploration"],
      ],
      budgetLabel: "Budget",
      budgets: [
        ["undisclosed", "Préfère ne pas dire"],
        ["under_10k", "Moins de 10 k$"],
        ["10k_30k", "10–30 k$"],
        ["30k_plus", "Plus de 30 k$"],
      ],
      optional: "optionnel",
      messageLabel: "Que souhaitez-vous créer ou améliorer ?",
      messageHint: "Précisez votre besoin, ce qui existe déjà et le résultat utile attendu. Au moins 24 caractères.",
      consentContact: "MaydaLabs peut conserver ces informations et me contacter au sujet de cette demande.",
      consentUpdates: "Envoyez-moi des nouvelles occasionnelles des produits et des builds (gratuit, révocable à tout moment).",
      submit: "Envoyer la demande",
      done: "Bien reçu.",
      doneHint: "Votre demande est enregistrée pour examen. Nous utiliserons votre email pour le suivi de cette demande.",
      errors: {
        invalid: "Vérifiez les champs signalés.",
        consent_required: "Le consentement de contact est requis pour envoyer.",
        rate_limited: "Trop d'envois. Attendez un moment puis réessayez.",
        save_failed: "L'envoi a échoué. Réessayez dans un instant ou écrivez directement.",
      },
    },
  },
} as const;

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({ ...COPY[locale].meta, path: "/contact", locale, socialCard: "contact" });
}

export default async function ContactPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const copy = COPY[locale];

  return (
    <div className="mayda-shell mayda-section">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
        <header className="mayda-stack" style={{ alignContent: "start" }}>
          <div className="mayda-availability">
            <span /> {copy.availability}
          </div>
          <p className="mayda-kicker" style={{ margin: 0 }}>{copy.kicker}</p>
          <h1 className="mayda-heading">
            {copy.heading[0]}
            <br />
            <span className="mayda-multiply">{copy.heading[1]}</span>
          </h1>
          <p className="mayda-body">{copy.intro}</p>
          <div className="mayda-stack" style={{ gap: "0.6rem", marginTop: "0.5rem" }}>
            <a
              href={getIntroCallUrl("contact_intro")}
              target="_blank"
              rel="noopener noreferrer"
              className="mayda-text-link"
            >
              {copy.call} <span aria-hidden>↗</span>
            </a>
            <a href="mailto:info@maydalabs.com" className="mayda-text-link">
              {copy.email} <span aria-hidden>→</span>
            </a>
          </div>
          <p className="mayda-body" style={{ fontSize: "0.85rem", marginTop: "1rem" }}>
            {copy.location}
          </p>
        </header>

        <ContactBrief locale={locale} copy={copy.brief} />
      </div>

      <section className="mayda-section-tight" style={{ marginTop: "2rem" }}>
        <p className="mayda-kicker">{copy.stepsKicker}</p>
        <h2 className="mayda-heading">{copy.stepsHeading}</h2>
        <div className="mayda-grid-3" style={{ marginTop: "1.6rem" }}>
          {copy.steps.map(([number, title, text]) => (
            <article key={number} className="mayda-card">
              <p className="mayda-card-number">{number}</p>
              <h3 className="mayda-subheading mt-2">{title}</h3>
              <p className="mayda-body mt-3">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
