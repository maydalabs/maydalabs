import Link from "next/link";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { getIntroCallUrl } from "@/lib/marketingLinks";
import { createPageMetadata } from "@/lib/metadata";

const META = {
  en: { title: "Services", socialTitle: "Product, commerce, and growth systems · MaydaLabs", description: "MaydaLabs connects product strategy, software delivery, commerce, and growth systems for ambitious founders." },
  tr: { title: "Hizmetler", socialTitle: "Ürün, e-ticaret ve büyüme sistemleri · MaydaLabs", description: "MaydaLabs; iddialı kurucular için ürün stratejisini, yazılım geliştirmeyi, e-ticareti ve büyüme sistemlerini birbirine bağlar." },
  fr: { title: "Services", socialTitle: "Produit, e-commerce et systèmes de croissance · MaydaLabs", description: "MaydaLabs relie stratégie produit, développement logiciel, e-commerce et systèmes de croissance pour des fondateurs ambitieux." },
} as const;

const COPY = {
  en: {
    kicker: "Capabilities / Connected by design", heading: ["One studio.", "Three ways to move."], intro: "Start with the product, the storefront, or the growth problem. We connect the other layers when the job requires them.", map: ["PRODUCT", "COMMERCE", "GROWTH"], fit: "Strong fit when", outputs: "What we can connect", discuss: "Discuss this kind of project",
    services: [
      { id: "product-builds", number: "01", eyebrow: "Zero to one / Rebuilds", title: "Build the product, not just the screens.", lead: "We turn an ambitious idea, an incomplete product, or a tangled operation into software people can understand and use.", fit: ["A new product needs its first credible release", "An existing build has outgrown its foundations", "A marketplace needs both customer and operator journeys"], outputs: ["Product strategy and release scope", "UX, interface, and brand system", "Web or mobile application delivery", "Payments, data, and third-party integrations", "QA, launch preparation, and handover"], surface: "services_product", tone: "dark" },
      { id: "commerce", number: "02", eyebrow: "Shopify / Custom commerce", title: "Turn the storefront into a system.", lead: "The best commerce work connects the brand people see with the operational machinery they never should have to think about.", fit: ["A template store no longer reflects the brand", "Purchase, subscription, or account flows create friction", "Commerce operations are split across disconnected tools"], outputs: ["Shopify theme and storefront builds", "Custom commerce experiences", "Subscriptions and customer accounts", "Checkout and conversion architecture", "Operational integrations and automation"], surface: "services_commerce", tone: "light" },
      { id: "growth-systems", number: "03", eyebrow: "Launch / Measurement / Lifecycle", title: "Make launch the start, not the finish.", lead: "We build the measurement, messaging, and lifecycle loops that help a shipped product learn what to do next.", fit: ["A product is shipping without a clear launch system", "Traffic arrives but the customer journey leaks intent", "Content, lifecycle, and analytics lack one operating view"], outputs: ["Launch strategy and campaign surfaces", "Landing pages and conversion journeys", "Analytics and decision dashboards", "Lifecycle messaging and automation", "Content systems and iteration plans"], surface: "services_growth", tone: "signal" },
    ],
    standardsKicker: "Every engagement / Same operating standard", standardsHeading: ["The shape changes.", "The rigor does not."],
    standards: [["01", "One decision loop", "Product context stays connected to design and engineering instead of being translated through account layers."], ["02", "Working releases", "Decisions happen against the real product in tight cycles, not against a presentation that disappears after kickoff."], ["03", "Built for ownership", "The system, documentation, and handover are prepared so the product can keep moving after the engagement."], ["04", "Measured momentum", "Launch instrumentation and customer signals shape the next highest-leverage move."]],
    availability: "Open for new client work", scope: "Scope follows understanding", cta: ["Start with the problem.", "We’ll shape the engagement."], book: "Book a project call", seeWork: "See the work", note: "No fixed packages or public rate card. Scope and commercial terms follow the first conversation.",
  },
  tr: {
    kicker: "Yetkinlikler / Tasarım gereği bağlantılı", heading: ["Tek stüdyo.", "İlerlemenin üç yolu."], intro: "Ürünle, mağazayla ya da büyüme problemiyle başlayın. İş gerektirdiğinde diğer katmanları biz birbirine bağlarız.", map: ["ÜRÜN", "E-TİCARET", "BÜYÜME"], fit: "Şu durumlarda güçlü uyum", outputs: "Birbirine bağlayabileceklerimiz", discuss: "Bu tür bir projeyi konuşalım",
    services: [
      { id: "product-builds", number: "01", eyebrow: "Sıfırdan ürün / Yeniden geliştirme", title: "Sadece ekranları değil, ürünü geliştirin.", lead: "İddialı bir fikri, yarım kalmış bir ürünü ya da karmaşık bir operasyonu insanların anlayıp kullanabileceği yazılıma dönüştürüyoruz.", fit: ["Yeni bir ürünün güven veren ilk sürüme ihtiyacı varsa", "Mevcut ürün temellerini aşmışsa", "Bir pazar yerinin hem müşteri hem operatör yolculuklarına ihtiyacı varsa"], outputs: ["Ürün stratejisi ve sürüm kapsamı", "UX, arayüz ve marka sistemi", "Web veya mobil uygulama geliştirme", "Ödeme, veri ve üçüncü taraf entegrasyonları", "QA, lansman hazırlığı ve devir"], surface: "services_product", tone: "dark" },
      { id: "commerce", number: "02", eyebrow: "Shopify / Özel e-ticaret", title: "Mağazayı bir sisteme dönüştürün.", lead: "En iyi e-ticaret çalışması, insanların gördüğü markayı hiç düşünmek zorunda kalmamaları gereken operasyon mekanizmasına bağlar.", fit: ["Şablon mağaza artık markayı yansıtmıyorsa", "Satın alma, abonelik veya hesap akışları sürtünme yaratıyorsa", "E-ticaret operasyonları bağlantısız araçlara dağılmışsa"], outputs: ["Shopify tema ve mağaza geliştirme", "Özel e-ticaret deneyimleri", "Abonelikler ve müşteri hesapları", "Ödeme ve dönüşüm mimarisi", "Operasyon entegrasyonları ve otomasyon"], surface: "services_commerce", tone: "light" },
      { id: "growth-systems", number: "03", eyebrow: "Lansman / Ölçüm / Yaşam döngüsü", title: "Lansmanı son değil, başlangıç yapın.", lead: "Yayınlanan ürünün bir sonraki hamleyi öğrenmesini sağlayan ölçüm, mesaj ve yaşam döngüsü sistemlerini kuruyoruz.", fit: ["Ürün net bir lansman sistemi olmadan yayına giriyorsa", "Trafik geliyor ama müşteri yolculuğu niyet kaybediyorsa", "İçerik, yaşam döngüsü ve analitik tek bir çalışma görünümünde değilse"], outputs: ["Lansman stratejisi ve kampanya yüzeyleri", "Açılış sayfaları ve dönüşüm yolculukları", "Analitik ve karar panoları", "Yaşam döngüsü mesajları ve otomasyon", "İçerik sistemleri ve iterasyon planları"], surface: "services_growth", tone: "signal" },
    ],
    standardsKicker: "Her çalışma / Aynı işletim standardı", standardsHeading: ["Şekil değişir.", "Titizlik değişmez."],
    standards: [["01", "Tek karar döngüsü", "Ürün bağlamı hesap katmanlarında çevrilmek yerine tasarım ve mühendislikle bağlantılı kalır."], ["02", "Çalışan sürümler", "Kararlar, başlangıç toplantısından sonra kaybolan sunumlar yerine kısa döngülerde gerçek ürün üzerinden alınır."], ["03", "Sahiplik için geliştirildi", "Sistem, dokümantasyon ve devir; çalışma sonrası ürünün ilerleyebilmesi için hazırlanır."], ["04", "Ölçülen ivme", "Lansman ölçümü ve müşteri sinyalleri en yüksek etkili sonraki hamleyi şekillendirir."]],
    availability: "Yeni müşteri projelerine açık", scope: "Kapsam, anlayıştan sonra gelir", cta: ["Problemle başlayın.", "Çalışmayı birlikte şekillendirelim."], book: "Proje görüşmesi ayarla", seeWork: "Projeleri incele", note: "Sabit paket veya herkese açık fiyat listesi yok. Kapsam ve ticari koşullar ilk görüşmeden sonra belirlenir.",
  },
  fr: {
    kicker: "Compétences / Connectées par conception", heading: ["Un studio.", "Trois façons d’avancer."], intro: "Commencez par le produit, la boutique ou le problème de croissance. Nous relions les autres couches lorsque le projet l’exige.", map: ["PRODUIT", "E-COMMERCE", "CROISSANCE"], fit: "Une bonne adéquation si", outputs: "Ce que nous pouvons connecter", discuss: "Discuter de ce type de projet",
    services: [
      { id: "product-builds", number: "01", eyebrow: "De zéro à un / Refontes", title: "Construisez le produit, pas seulement les écrans.", lead: "Nous transformons une idée ambitieuse, un produit incomplet ou une opération complexe en logiciel compréhensible et utilisable.", fit: ["Un nouveau produit a besoin d’une première version crédible", "Un produit existant a dépassé ses fondations", "Une marketplace doit servir clients et opérateurs"], outputs: ["Stratégie produit et périmètre de livraison", "UX, interface et système de marque", "Développement web ou mobile", "Paiements, données et intégrations tierces", "QA, préparation au lancement et transmission"], surface: "services_product", tone: "dark" },
      { id: "commerce", number: "02", eyebrow: "Shopify / E-commerce sur mesure", title: "Transformez la boutique en système.", lead: "Le meilleur e-commerce relie la marque visible à la mécanique opérationnelle que le client ne devrait jamais avoir à considérer.", fit: ["Une boutique template ne reflète plus la marque", "Achat, abonnement ou compte créent des frictions", "Les opérations sont dispersées entre des outils isolés"], outputs: ["Thèmes Shopify et boutiques", "Expériences e-commerce sur mesure", "Abonnements et comptes clients", "Architecture checkout et conversion", "Intégrations opérationnelles et automatisation"], surface: "services_commerce", tone: "light" },
      { id: "growth-systems", number: "03", eyebrow: "Lancement / Mesure / Cycle de vie", title: "Faites du lancement un début, pas une fin.", lead: "Nous construisons les boucles de mesure, de message et de cycle de vie qui aident le produit livré à apprendre la suite.", fit: ["Un produit est lancé sans système clair", "Le trafic arrive mais le parcours perd l’intention", "Contenu, cycle de vie et analytics manquent d’une vue commune"], outputs: ["Stratégie de lancement et campagnes", "Landing pages et parcours de conversion", "Analytics et tableaux de décision", "Messages de cycle de vie et automatisation", "Systèmes de contenu et plans d’itération"], surface: "services_growth", tone: "signal" },
    ],
    standardsKicker: "Chaque mission / La même exigence", standardsHeading: ["La forme change.", "La rigueur reste."],
    standards: [["01", "Une seule boucle de décision", "Le contexte produit reste relié au design et à l’ingénierie au lieu de traverser des couches de gestion."], ["02", "Des versions fonctionnelles", "Les décisions se prennent sur le produit réel par cycles courts, pas sur une présentation oubliée après le kickoff."], ["03", "Conçu pour être repris", "Système, documentation et transmission permettent au produit d’avancer après la mission."], ["04", "Un élan mesuré", "L’instrumentation du lancement et les signaux clients déterminent l’étape suivante à plus fort impact."]],
    availability: "Ouvert à de nouveaux projets clients", scope: "Le périmètre vient après la compréhension", cta: ["Commencez par le problème.", "Nous définirons la mission."], book: "Réserver un appel projet", seeWork: "Voir les projets", note: "Pas de forfaits fixes ni de tarifs publics. Le périmètre et les conditions commerciales suivent le premier échange.",
  },
} as const;

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({ ...META[locale], path: "/services", locale, socialCard: "services" });
}

function Arrow() { return <span aria-hidden>↗</span>; }

export default async function ServicesPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const copy = COPY[locale];

  return (
    <div className="services-page">
      <section className="services-hero">
        <div><p className="studio-kicker">{copy.kicker}</p><h1>{copy.heading[0]}<br /><em>{copy.heading[1]}</em></h1></div>
        <div className="services-hero-aside">
          <p>{copy.intro}</p>
          <div className="services-system-map" aria-hidden="true">
            <span>{copy.map[0]}</span><i />
            <span>{copy.map[1]}</span><i />
            <span>{copy.map[2]}</span><b />
          </div>
        </div>
      </section>

      <section className="service-detail-stack" aria-label="MaydaLabs services">
        {copy.services.map((service) => (
          <article id={service.id} key={service.id} className="service-detail scroll-mt-24" data-tone={service.tone} data-service-number={service.number}>
            <div className="service-detail-index"><span>{service.number}</span><p>{service.eyebrow}</p></div>
            <div className="service-detail-main">
              <div><h2>{service.title}</h2><p className="service-detail-lead">{service.lead}</p></div>
              <div className="service-detail-lists">
                <section><p>{copy.fit}</p><ul>{service.fit.map((item) => <li key={item}>{item}</li>)}</ul></section>
                <section><p>{copy.outputs}</p><ul>{service.outputs.map((item) => <li key={item}>{item}</li>)}</ul></section>
              </div>
            </div>
            <Link href={getIntroCallUrl(service.surface)} target="_blank" rel="noopener noreferrer" className={service.tone === "dark" ? "studio-button" : "studio-button studio-button-light"}>{copy.discuss} <Arrow /></Link>
          </article>
        ))}
      </section>

      <section className="services-standards">
        <div className="services-standards-heading"><p className="studio-kicker">{copy.standardsKicker}</p><h2>{copy.standardsHeading[0]}<br /><em>{copy.standardsHeading[1]}</em></h2></div>
        <div className="services-standards-grid">{copy.standards.map(([number, title, description]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
      </section>

      <section className="studio-final-cta">
        <div className="studio-availability"><span /> {copy.availability}</div><p className="studio-kicker">{copy.scope}</p>
        <h2>{copy.cta[0]}<br /><em>{copy.cta[1]}</em></h2>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={getIntroCallUrl("services_bottom")} target="_blank" rel="noopener noreferrer" className="studio-button studio-button-light">{copy.book} <Arrow /></Link>
          <Link href={localizePath("/case-studies", locale)} className="studio-button studio-button-outline-light">{copy.seeWork}</Link>
        </div>
        <p className="studio-final-note">{copy.note}</p>
      </section>
    </div>
  );
}
