import Link from "next/link";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";

const COPY = {
  en: {
    meta: {
      title: "Approach",
      socialTitle: "From diagnosis to leverage · MaydaLabs",
      description:
        "How MaydaLabs moves from diagnosis to building and improvement: find the constraint, build the multiplier, connect it, compound.",
    },
    kicker: "Approach",
    heading: ["Diagnosis first.", "Then build what multiplies."],
    lead: "Most engagements fail at the framing stage: the wrong thing gets built well. MaydaLabs starts by naming the constraint precisely, then builds against it in small, verified steps.",
    loopKicker: "The working loop",
    loop: [
      ["Diagnose", "Name the constraint with evidence — data where it exists, structured conversation where it doesn't. The Multiplier Map is the free, self-serve version of this step."],
      ["Build", "Design and ship the system that addresses the constraint: a product, an automation, a growth loop, a security foundation. Small releases, real measurement, no six-month reveals."],
      ["Connect", "Wire the new system into the rest of the business — product into analytics, analytics into lifecycle, operations into dashboards — so the value compounds instead of sitting isolated."],
      ["Compound", "Review what the evidence says, pick the next constraint, repeat. Momentum comes from verified cycles, not from activity."],
    ],
    offersKicker: "How engagements are shaped",
    offersHeading: "One offer family, honest entry points.",
    offersIntro:
      "No published price list and no fixed-outcome promises — scope, timing, responsibilities, and commercial terms are defined in writing per engagement, after a real conversation.",
    offers: [
      ["Multiplier Map", "Free", "A five-question diagnostic with transparent rules. The self-serve starting point.", "/start"],
      ["Multiplier Sprint", "Entry engagement", "A focused engagement to identify and address one high-leverage constraint.", "/contact"],
      ["Build Partnership", "Delivery", "End-to-end product and system delivery: frontend, backend, infrastructure, automation, lifecycle systems, security.", "/contact"],
      ["Acceleration Partnership", "Continuing", "Ongoing improvement for an existing company: product iteration, automation, conversion, lifecycle, reliability, security.", "/contact"],
    ],
    principlesKicker: "Operating principles",
    principles: [
      ["Evidence over claims", "No invented metrics, no borrowed outcomes, no testimonials that don't exist. What you see on this site is inspectable."],
      ["Small verified releases", "Work ships in increments you can use and measure, so course corrections are cheap and honest."],
      ["You own everything", "Code, accounts, infrastructure, and data belong to you from day one. Engagements are built for handover, not dependence."],
      ["Plain language", "Scope, trade-offs, and risks in words a non-engineer can act on. No jargon walls."],
      ["Security by default", "Access control, least privilege, and tested authorization are part of the build, not an add-on."],
      ["Practical onchain, when it earns it", "MaydaLabs can build onchain products where the business case genuinely requires them — as an engineering capability, not an identity."],
    ],
    ctaHeading: "Start with the map, or bring the constraint directly.",
    mapCta: "Map my next move",
    talkCta: "Start a conversation",
  },
  tr: {
    meta: {
      title: "Yaklaşım",
      socialTitle: "Tanıdan kaldıraca · MaydaLabs",
      description:
        "MaydaLabs tanıdan inşa ve iyileştirmeye nasıl ilerler: kısıtı bul, çarpanı inşa et, bağla, katla.",
    },
    kicker: "Yaklaşım",
    heading: ["Önce tanı.", "Sonra çarpan olanı inşa et."],
    lead: "Çoğu çalışma çerçeveleme aşamasında başarısız olur: yanlış şey iyi inşa edilir. MaydaLabs kısıtı kanıtla ve net biçimde adlandırarak başlar; sonra ona karşı küçük, doğrulanmış adımlarla inşa eder.",
    loopKicker: "Çalışma döngüsü",
    loop: [
      ["Tanıla", "Kısıtı kanıtla adlandır — veri varsa veriyle, yoksa yapılandırılmış görüşmeyle. Multiplier Map bu adımın ücretsiz, self servis halidir."],
      ["İnşa et", "Kısıtı ele alan sistemi tasarla ve yayınla: bir ürün, bir otomasyon, bir büyüme döngüsü, bir güvenlik temeli. Küçük sürümler, gerçek ölçüm, altı aylık sürprizler yok."],
      ["Bağla", "Yeni sistemi işin geri kalanına bağla — ürün analitiğe, analitik yaşam döngüsüne, operasyon panolara — değer izole kalmasın, katlansın."],
      ["Katla", "Kanıtın ne dediğine bak, sıradaki kısıtı seç, tekrarla. İvme aktiviteden değil, doğrulanmış döngülerden gelir."],
    ],
    offersKicker: "Çalışmalar nasıl şekillenir",
    offersHeading: "Tek teklif ailesi, dürüst giriş noktaları.",
    offersIntro:
      "Yayınlanmış fiyat listesi ve sabit sonuç vaadi yok — kapsam, zamanlama, sorumluluklar ve ticari koşullar gerçek bir görüşmeden sonra her çalışma için yazılı olarak tanımlanır.",
    offers: [
      ["Multiplier Map", "Ücretsiz", "Kuralları şeffaf beş soruluk tanı. Self servis başlangıç noktası.", "/start"],
      ["Multiplier Sprint", "Giriş çalışması", "Tek bir yüksek kaldıraçlı kısıtı bulup ele alan odaklı çalışma.", "/contact"],
      ["Build Partnership", "Teslimat", "Uçtan uca ürün ve sistem teslimi: frontend, backend, altyapı, otomasyon, yaşam döngüsü sistemleri, güvenlik.", "/contact"],
      ["Acceleration Partnership", "Süreklilik", "Mevcut bir şirket için süreklilik taşıyan iyileştirme: ürün iterasyonu, otomasyon, dönüşüm, yaşam döngüsü, güvenilirlik, güvenlik.", "/contact"],
    ],
    principlesKicker: "Çalışma ilkeleri",
    principles: [
      ["İddiadan önce kanıt", "Uydurma metrik yok, ödünç alınmış sonuç yok, var olmayan referans yok. Bu sitede gördükleriniz denetlenebilir."],
      ["Küçük doğrulanmış sürümler", "İş, kullanıp ölçebileceğiniz artışlarla yayınlanır; rota düzeltmeleri ucuz ve dürüst kalır."],
      ["Her şeyin sahibi sizsiniz", "Kod, hesaplar, altyapı ve veri ilk günden size aittir. Çalışmalar bağımlılık için değil, devir için kurgulanır."],
      ["Sade dil", "Kapsam, ödünleşimler ve riskler mühendis olmayan birinin harekete geçebileceği kelimelerle. Jargon duvarı yok."],
      ["Varsayılan olarak güvenlik", "Erişim kontrolü, en az yetki ve test edilmiş yetkilendirme inşanın parçasıdır, eklenti değil."],
      ["Hak ettiğinde pratik onchain", "MaydaLabs, iş gerekçesi gerçekten gerektirdiğinde onchain ürünler inşa edebilir — kimlik olarak değil, mühendislik yetkinliği olarak."],
    ],
    ctaHeading: "Haritayla başlayın veya kısıtı doğrudan getirin.",
    mapCta: "Sonraki hamlemi haritala",
    talkCta: "Bir görüşme başlat",
  },
  fr: {
    meta: {
      title: "Approche",
      socialTitle: "Du diagnostic au levier · MaydaLabs",
      description:
        "Comment MaydaLabs passe du diagnostic à la construction et à l'amélioration : trouver la contrainte, construire le multiplicateur, le connecter, composer.",
    },
    kicker: "Approche",
    heading: ["Le diagnostic d'abord.", "Puis construire ce qui multiplie."],
    lead: "La plupart des missions échouent au cadrage : la mauvaise chose est bien construite. MaydaLabs commence par nommer précisément la contrainte, puis construit contre elle par petits pas vérifiés.",
    loopKicker: "La boucle de travail",
    loop: [
      ["Diagnostiquer", "Nommer la contrainte avec des preuves — données quand elles existent, conversation structurée sinon. La Multiplier Map est la version gratuite et autonome de cette étape."],
      ["Construire", "Concevoir et livrer le système qui traite la contrainte : produit, automatisation, boucle de croissance, fondation de sécurité. Petites versions, vraie mesure, pas de révélation à six mois."],
      ["Connecter", "Relier le nouveau système au reste de l'entreprise — produit vers analytics, analytics vers lifecycle, opérations vers tableaux de bord — pour que la valeur compose au lieu de rester isolée."],
      ["Composer", "Regarder ce que disent les preuves, choisir la contrainte suivante, répéter. L'élan vient des cycles vérifiés, pas de l'activité."],
    ],
    offersKicker: "Comment les missions prennent forme",
    offersHeading: "Une famille d'offres, des points d'entrée honnêtes.",
    offersIntro:
      "Pas de grille tarifaire publiée ni de promesse de résultat fixe — périmètre, calendrier, responsabilités et conditions commerciales sont définis par écrit pour chaque mission, après une vraie conversation.",
    offers: [
      ["Multiplier Map", "Gratuit", "Un diagnostic en cinq questions aux règles transparentes. Le point de départ autonome.", "/start"],
      ["Multiplier Sprint", "Mission d'entrée", "Un engagement ciblé pour identifier et traiter une contrainte à fort levier.", "/contact"],
      ["Build Partnership", "Livraison", "Livraison de bout en bout du produit et des systèmes : frontend, backend, infrastructure, automatisation, systèmes lifecycle, sécurité.", "/contact"],
      ["Acceleration Partnership", "Continu", "Amélioration continue d'une entreprise existante : itération produit, automatisation, conversion, lifecycle, fiabilité, sécurité.", "/contact"],
    ],
    principlesKicker: "Principes de travail",
    principles: [
      ["Les preuves avant les affirmations", "Pas de métriques inventées, pas de résultats empruntés, pas de témoignages inexistants. Ce que montre ce site est inspectable."],
      ["Petites versions vérifiées", "Le travail est livré par incréments utilisables et mesurables ; corriger la trajectoire reste peu coûteux et honnête."],
      ["Tout vous appartient", "Code, comptes, infrastructure et données sont à vous dès le premier jour. Les missions sont construites pour la transmission, pas la dépendance."],
      ["Langage clair", "Périmètre, arbitrages et risques dans des mots qu'un non-ingénieur peut utiliser. Pas de mur de jargon."],
      ["Sécurité par défaut", "Contrôle d'accès, moindre privilège et autorisation testée font partie de la construction, pas d'un supplément."],
      ["De l'onchain pragmatique, quand il le mérite", "MaydaLabs peut construire des produits onchain quand le cas d'affaires l'exige vraiment — comme capacité d'ingénierie, pas comme identité."],
    ],
    ctaHeading: "Commencez par la carte, ou apportez la contrainte directement.",
    mapCta: "Cartographier ma prochaine étape",
    talkCta: "Démarrer un échange",
  },
} as const;

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({ ...COPY[locale].meta, path: "/approach", locale, socialCard: "approach" });
}

export default async function ApproachPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const copy = COPY[locale];

  return (
    <div className="mayda-shell">
      <section className="mayda-section">
        <header className="mayda-stack" style={{ maxWidth: "44rem" }}>
          <p className="mayda-kicker">{copy.kicker}</p>
          <h1 className="mayda-display" style={{ fontSize: "clamp(2.2rem,5vw,3.8rem)" }}>
            {copy.heading[0]}
            <br />
            <span className="mayda-multiply">{copy.heading[1]}</span>
          </h1>
          <p className="mayda-lead">{copy.lead}</p>
        </header>
      </section>

      <section className="mayda-section" style={{ paddingTop: 0 }}>
        <p className="mayda-kicker">{copy.loopKicker}</p>
        <div className="mayda-grid-2" style={{ marginTop: "1.4rem" }}>
          {copy.loop.map(([title, text], index) => (
            <article key={title} className="mayda-card">
              <p className="mayda-card-number">0{index + 1}</p>
              <h2 className="mayda-subheading mt-2">{title}</h2>
              <p className="mayda-body mt-3">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mayda-section" style={{ paddingTop: 0 }}>
        <header className="mayda-stack" style={{ maxWidth: "44rem" }}>
          <p className="mayda-kicker">{copy.offersKicker}</p>
          <h2 className="mayda-heading">{copy.offersHeading}</h2>
          <p className="mayda-body">{copy.offersIntro}</p>
        </header>
        <div className="mayda-grid-2" style={{ marginTop: "1.6rem" }}>
          {copy.offers.map(([title, tag, text, href]) => (
            <Link key={title} href={localizePath(href, locale)} className="mayda-card">
              <div className="flex items-center justify-between gap-3">
                <h3 className="mayda-subheading">{title}</h3>
                <span className={`mayda-tag ${href === "/start" ? "is-mint" : "is-cobalt"}`}>{tag}</span>
              </div>
              <p className="mayda-body mt-3">{text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mayda-section" style={{ paddingTop: 0 }}>
        <p className="mayda-kicker">{copy.principlesKicker}</p>
        <div className="mayda-grid-3" style={{ marginTop: "1.4rem" }}>
          {copy.principles.map(([title, text]) => (
            <article key={title} className="mayda-card">
              <h3 className="mayda-subheading" style={{ fontSize: "1.05rem" }}>
                {title}
              </h3>
              <p className="mayda-body mt-3" style={{ fontSize: "0.92rem" }}>
                {text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mayda-final-cta">
        <h2 className="mayda-heading">{copy.ctaHeading}</h2>
        <div className="mayda-hero-actions" style={{ justifyContent: "center" }}>
          <Link href={localizePath("/start", locale)} className="mayda-button">
            {copy.mapCta} <span aria-hidden>→</span>
          </Link>
          <Link href={localizePath("/contact", locale)} className="mayda-button mayda-button-outline">
            {copy.talkCta}
          </Link>
        </div>
      </section>
    </div>
  );
}
