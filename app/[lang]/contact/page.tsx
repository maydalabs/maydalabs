import { ContactBrief } from "@/components/ContactBrief";
import { getIntroCallUrl } from "@/lib/marketingLinks";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";

const COPY = {
  en: {
    meta: {
      title: "Start a conversation",
      socialTitle: "Bring the constraint · MaydaLabs",
      description:
        "Send a short brief, book a call, or write directly. A human reads everything; nothing is automated.",
    },
    availability: "Open for new work",
    kicker: "Contact / Direct channel",
    heading: ["Bring the constraint.", "We’ll take it from there."],
    intro:
      "You don't need a polished brief. Send enough signal to understand the friction — a human reads it and replies by email. Prefer talking? Book the call directly.",
    call: "Book a 30-minute call",
    email: "Email directly",
    stepsKicker: "After you reach out",
    stepsHeading: "A clear next step, not a sales maze.",
    steps: [
      ["01", "Fit and direction", "We look at the problem, who it affects, what exists, and whether MaydaLabs is the right operator."],
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
      constraintLabel: "Biggest constraint",
      constraints: [
        ["product_not_built", "Product doesn't exist yet"],
        ["product_stuck", "Product is stuck"],
        ["growth_flat", "Growth is flat"],
        ["operations_drag", "Operations eat the week"],
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
      messageLabel: "The problem in your words",
      messageHint: "What is stuck, who feels it, and what would a useful first outcome change? At least 24 characters.",
      consentContact: "MaydaLabs may store these details and contact me about this request.",
      consentUpdates: "Send me occasional product and build updates by email (free, revocable any time).",
      submit: "Send the brief",
      done: "Received.",
      doneHint: "A human will read it and reply by email — usually within two working days.",
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
      socialTitle: "Kısıtı getirin · MaydaLabs",
      description:
        "Kısa bir brief gönderin, görüşme ayarlayın veya doğrudan yazın. Her şeyi bir insan okur; hiçbir şey otomatik değildir.",
    },
    availability: "Yeni işlere açık",
    kicker: "İletişim / Doğrudan kanal",
    heading: ["Kısıtı getirin.", "Gerisini birlikte alırız."],
    intro:
      "Kusursuz bir brief'e ihtiyacınız yok. Sürtünmeyi anlamaya yetecek sinyali gönderin — bir insan okur ve e-postayla yanıtlar. Konuşmayı mı tercih edersiniz? Görüşmeyi doğrudan ayarlayın.",
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
      constraintLabel: "En büyük kısıt",
      constraints: [
        ["product_not_built", "Ürün henüz yok"],
        ["product_stuck", "Ürün tıkandı"],
        ["growth_flat", "Büyüme düz"],
        ["operations_drag", "Operasyon haftayı yiyor"],
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
      messageLabel: "Problemi kendi kelimelerinizle anlatın",
      messageHint: "Neresi tıkandı, bunu kim hissediyor ve faydalı ilk sonuç neyi değiştirirdi? En az 24 karakter.",
      consentContact: "MaydaLabs bu bilgileri saklayabilir ve bu talep hakkında benimle iletişime geçebilir.",
      consentUpdates: "Bana ara sıra ürün ve geliştirme güncellemeleri gönderin (ücretsiz, her an iptal edilebilir).",
      submit: "Brief'i gönder",
      done: "Alındı.",
      doneHint: "Bir insan okuyup e-postayla yanıtlayacak — genellikle iki iş günü içinde.",
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
      socialTitle: "Apportez la contrainte · MaydaLabs",
      description:
        "Envoyez un brief court, réservez un échange ou écrivez directement. Un humain lit tout ; rien n'est automatisé.",
    },
    availability: "Ouvert à de nouveaux projets",
    kicker: "Contact / Canal direct",
    heading: ["Apportez la contrainte.", "Nous prenons la suite."],
    intro:
      "Pas besoin d'un brief parfait. Envoyez assez de signal pour comprendre la friction — un humain le lit et répond par e-mail. Vous préférez parler ? Réservez l'échange directement.",
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
      constraintLabel: "Contrainte principale",
      constraints: [
        ["product_not_built", "Le produit n'existe pas encore"],
        ["product_stuck", "Le produit est bloqué"],
        ["growth_flat", "La croissance est plate"],
        ["operations_drag", "Les opérations mangent la semaine"],
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
      messageLabel: "Le problème avec vos mots",
      messageHint: "Qu'est-ce qui bloque, qui le ressent, et que changerait un premier résultat utile ? Au moins 24 caractères.",
      consentContact: "MaydaLabs peut conserver ces informations et me contacter au sujet de cette demande.",
      consentUpdates: "Envoyez-moi des nouvelles occasionnelles des produits et des builds (gratuit, révocable à tout moment).",
      submit: "Envoyer le brief",
      done: "Bien reçu.",
      doneHint: "Un humain le lira et répondra par e-mail — en général sous deux jours ouvrés.",
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
