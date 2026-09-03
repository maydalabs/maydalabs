import Link from "next/link";
import { Icon, IconBox, type IconName } from "@/components/icons";
import { LogoMarkBitcoin } from "@/components/Logo";
import { ApprovalQueue } from "@/components/illustrations/ApprovalQueue";
import { PaymentsFlow } from "@/components/illustrations/PaymentsFlow";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";

const COPY = {
  en: {
    meta: {
      title: "Offers",
      socialTitle: "Two offers, both in production · MaydaLabs",
      description:
        "Evidence-gated AI operations and Bitcoin payments engineering. Pilots from $2,500, fixed scope, your approval on everything external.",
    },
    kicker: "Offers",
    heading: ["Two offers.", "Both already in production."],
    lead: "Pilots are deliberately small: one bounded workflow, a fixed price, three to four weeks. Bitcoin-first, not Bitcoin-only — if your company isn't in Bitcoin but the problem fits, write anyway.",
    offers: [
      {
        title: "Evidence-gated AI operations",
        forLabel: "For",
        forText: "Bitcoin companies where content, research, or internal operations eat the team's week — newsletters, market notes, listings, support docs, reporting.",
        installLabel: "What gets installed",
        install: [
          "One workflow rebuilt as a pipeline: intake → AI production → human approval → publish/execute",
          "Sourcing rules: every claim linked to its source or marked unverified",
          "An approval surface where review takes minutes, with a full record of what went out and why",
          "Cost and output metrics from day one",
        ],
        endLabel: "At the end of the pilot",
        endText: "A running system in your accounts, the operating runbook, and a plain report: output volume, approval latency, source coverage, cost per piece. Continue monthly, or keep the system and walk.",
        price: "Pilot from $2,500 fixed · 3–4 weeks · then from $1,000/month",
        proofLabel: "Proof",
        proofText: "Satoshi Gazette — our own Bitcoin publication — runs on this system, publicly.",
        proofHref: "/proof",
        proofLink: "See how the system works",
      },
      {
        title: "Bitcoin payments engineering",
        forLabel: "For",
        forText: "Companies and serious merchants that want to accept Bitcoin properly — or already run BTCPay Server and feel it wobble.",
        installLabel: "Scope",
        install: [
          "BTCPay Server deployment or rescue, and store configuration",
          "Integration with your product: invoice creation through settlement",
          "Signed webhook verification and idempotent payment handling",
          "Settlement, payout, and reconciliation records your accountant can read",
          "Hardening, monitoring, and an operations runbook",
        ],
        endLabel: "At the end",
        endText: "A payment lifecycle you can trace end to end, owned by you, documented. No custody: your node, your keys, your accounts.",
        price: "Scoped fixed-price engagements — priced after a short technical call",
        proofLabel: "Proof",
        proofText: "HodlStay's production payment system — invoice lifecycle, signed webhooks, settlement, payouts — built end to end.",
        proofHref: "/case-studies/hodlstay",
        proofLink: "Read the HodlStay case",
      },
    ],
    stepsKicker: "How a pilot runs",
    steps: [
      ["Scope", "One workflow, named precisely: what comes in, what goes out, who approves. Fixed price agreed in writing."],
      ["Install", "The pipeline, sourcing rules, and approval gate — in your accounts, owned by you from day one."],
      ["Operate", "AI produces daily. Your review takes minutes. Nothing external moves without your approval."],
      ["Measure", "Output, approval latency, source coverage, cost — reported plainly. Then extend, or stop and keep everything."],
    ],
    boundariesKicker: "What we don't do",
    boundaries: [
      "We never take custody of funds or hold keys. Payments work runs on your node and your accounts.",
      "We don't launch tokens, run ads for speculation, or write hype. Sourcing rules apply to your content like they apply to ours.",
      "AI never gets send/publish/spend authority. The approval stays with a human at your company — that's the design, not a limitation.",
    ],
    ctaHeading: "Name the workflow. We'll scope the pilot.",
    payNote: "Pay in bitcoin. BTCPay Server checkout is being wired in; until then, an invoice you can settle on-chain or by transfer.",
    ctaStart: "Start a pilot",
    ctaMail: "info@maydalabs.com",
  },
  tr: {
    meta: {
      title: "Teklifler",
      socialTitle: "İki teklif, ikisi de üretimde · MaydaLabs",
      description:
        "Kanıt kapılı yapay zekâ operasyonları ve Bitcoin ödeme mühendisliği. Pilotlar 2.500 $'dan, sabit kapsam, dışa dönük her şeyde sizin onayınız.",
    },
    kicker: "Teklifler",
    heading: ["İki teklif.", "İkisi de üretimde çalışıyor."],
    lead: "Pilotlar bilerek küçüktür: sınırları belli tek iş akışı, sabit fiyat, üç-dört hafta. Bitcoin öncelikli; sadece Bitcoin değil — şirketiniz Bitcoin'de değilse ama problem uyuyorsa yine yazın.",
    offers: [
      {
        title: "Kanıt kapılı yapay zekâ operasyonları",
        forLabel: "Kimin için",
        forText: "İçeriğin, araştırmanın veya iç operasyonun ekibin haftasını yediği Bitcoin şirketleri — bültenler, piyasa notları, ilanlar, destek dokümanları, raporlama.",
        installLabel: "Ne kurulur",
        install: [
          "Tek iş akışı hat olarak yeniden kurulur: giriş → yapay zekâ üretimi → insan onayı → yayın/uygulama",
          "Kaynak kuralları: her iddia kaynağına bağlı, değilse doğrulanmamış işaretli",
          "İncelemenin dakikalar sürdüğü, neyin neden çıktığının tam kayıtlı olduğu bir onay yüzeyi",
          "İlk günden maliyet ve üretim metrikleri",
        ],
        endLabel: "Pilotun sonunda",
        endText: "Sizin hesaplarınızda çalışan bir sistem, işletim runbook'u ve yalın bir rapor: üretim hacmi, onay süresi, kaynak kapsamı, içerik başı maliyet. Aylık devam edin ya da sistemi alıp ayrılın.",
        price: "Pilot 2.500 $'dan sabit · 3–4 hafta · sonrası aylık 1.000 $'dan",
        proofLabel: "Kanıt",
        proofText: "Kendi Bitcoin yayınımız Satoshi Gazette bu sistemle, herkese açık biçimde çalışıyor.",
        proofHref: "/proof",
        proofLink: "Sistemin nasıl çalıştığını görün",
      },
      {
        title: "Bitcoin ödeme mühendisliği",
        forLabel: "Kimin için",
        forText: "Bitcoin'i doğru biçimde kabul etmek isteyen — veya BTCPay Server'ı zaten çalıştırıp sallandığını hisseden — şirketler ve ciddi satıcılar.",
        installLabel: "Kapsam",
        install: [
          "BTCPay Server kurulumu veya kurtarma, mağaza yapılandırması",
          "Ürününüzle entegrasyon: fatura oluşturmadan mutabakata",
          "İmzalı webhook doğrulaması ve idempotent ödeme işleme",
          "Muhasebecinizin okuyabileceği mutabakat ve ödeme kayıtları",
          "Sıkılaştırma, izleme ve işletim runbook'u",
        ],
        endLabel: "Sonunda",
        endText: "Uçtan uca izleyebildiğiniz, sahibi siz olduğunuz, dokümante bir ödeme yaşam döngüsü. Saklama yok: sizin node'unuz, sizin anahtarlarınız, sizin hesaplarınız.",
        price: "Kapsamı belirli, sabit fiyatlı çalışmalar — kısa bir teknik görüşme sonrası fiyatlanır",
        proofLabel: "Kanıt",
        proofText: "HodlStay'in üretimdeki ödeme sistemi — fatura yaşam döngüsü, imzalı webhooklar, mutabakat, ödemeler — uçtan uca.",
        proofHref: "/case-studies/hodlstay",
        proofLink: "HodlStay vakasını okuyun",
      },
    ],
    stepsKicker: "Pilot nasıl ilerler",
    steps: [
      ["Kapsam", "Tek iş akışı, net tanım: ne girer, ne çıkar, kim onaylar. Sabit fiyat yazılı olarak."],
      ["Kurulum", "Hat, kaynak kuralları ve onay kapısı — ilk günden sizin hesaplarınızda, sahibi sizsiniz."],
      ["İşletim", "Yapay zekâ her gün üretir. İncelemeniz dakikalar sürer. Onayınız olmadan dışarı hiçbir şey çıkmaz."],
      ["Ölçüm", "Üretim, onay süresi, kaynak kapsamı, maliyet — açıkça raporlanır. Sonra genişletin ya da durun; her şey sizde kalır."],
    ],
    boundariesKicker: "Yapmadıklarımız",
    boundaries: [
      "Asla fon saklamayız, anahtar tutmayız. Ödeme işleri sizin node'unuzda, sizin hesaplarınızda çalışır.",
      "Token çıkarmayız, spekülasyon reklamı yapmayız, boş heyecan yazmayız. Kaynak kuralları bizim içeriğimize uygulandığı gibi sizinkine de uygulanır.",
      "Yapay zekâ asla gönderme/yayınlama/harcama yetkisi almaz. Onay, şirketinizdeki bir insanda kalır — bu bir kısıt değil, tasarımın kendisi.",
    ],
    ctaHeading: "İş akışını adlandırın. Pilotu kapsamlandıralım.",
    payNote: "Bitcoin ile ödeyin. BTCPay Server ödeme sayfası kuruluyor; o zamana kadar zincir üstü veya havale ile ödenebilen bir fatura.",
    ctaStart: "Pilot başlat",
    ctaMail: "info@maydalabs.com",
  },
  fr: {
    meta: {
      title: "Offres",
      socialTitle: "Deux offres, déjà en production · MaydaLabs",
      description:
        "Opérations IA à preuves obligatoires et ingénierie des paiements Bitcoin. Pilotes dès 2 500 $, périmètre fixe, votre approbation sur tout ce qui est externe.",
    },
    kicker: "Offres",
    heading: ["Deux offres.", "Déjà en production."],
    lead: "Les pilotes sont volontairement petits : un flux borné, un prix fixe, trois à quatre semaines. Bitcoin-first, pas Bitcoin-only — si votre entreprise n'est pas dans Bitcoin mais que le problème correspond, écrivez quand même.",
    offers: [
      {
        title: "Opérations IA à preuves obligatoires",
        forLabel: "Pour",
        forText: "Les entreprises Bitcoin où contenu, recherche ou opérations internes dévorent la semaine de l'équipe — newsletters, notes de marché, listings, docs support, reporting.",
        installLabel: "Ce qui est installé",
        install: [
          "Un flux reconstruit en pipeline : entrée → production IA → approbation humaine → publication/exécution",
          "Règles de sourçage : chaque affirmation liée à sa source, sinon marquée non vérifiée",
          "Une surface d'approbation où la revue prend des minutes, avec l'historique complet de ce qui est sorti et pourquoi",
          "Métriques de coût et de production dès le premier jour",
        ],
        endLabel: "À la fin du pilote",
        endText: "Un système qui tourne dans vos comptes, le runbook d'exploitation et un rapport simple : volume, délai d'approbation, couverture des sources, coût par pièce. Continuez au mois, ou gardez le système et partez.",
        price: "Pilote dès 2 500 $ fixe · 3–4 semaines · puis dès 1 000 $/mois",
        proofLabel: "Preuve",
        proofText: "Satoshi Gazette — notre propre publication Bitcoin — tourne sur ce système, publiquement.",
        proofHref: "/proof",
        proofLink: "Voir comment le système fonctionne",
      },
      {
        title: "Ingénierie des paiements Bitcoin",
        forLabel: "Pour",
        forText: "Les entreprises et marchands sérieux qui veulent accepter Bitcoin correctement — ou qui font déjà tourner BTCPay Server et le sentent vaciller.",
        installLabel: "Périmètre",
        install: [
          "Déploiement ou sauvetage de BTCPay Server, configuration du store",
          "Intégration à votre produit : de la création de facture au règlement",
          "Vérification des webhooks signés et traitement idempotent des paiements",
          "Registres de règlement, versement et réconciliation lisibles par votre comptable",
          "Durcissement, supervision et runbook d'exploitation",
        ],
        endLabel: "À la fin",
        endText: "Un cycle de paiement traçable de bout en bout, à vous, documenté. Pas de garde : votre nœud, vos clés, vos comptes.",
        price: "Missions cadrées à prix fixe — chiffrées après un court appel technique",
        proofLabel: "Preuve",
        proofText: "Le système de paiement en production de HodlStay — cycle de facture, webhooks signés, règlement, versements — construit de bout en bout.",
        proofHref: "/case-studies/hodlstay",
        proofLink: "Lire le cas HodlStay",
      },
    ],
    stepsKicker: "Comment se déroule un pilote",
    steps: [
      ["Cadrer", "Un flux, nommé précisément : ce qui entre, ce qui sort, qui approuve. Prix fixe convenu par écrit."],
      ["Installer", "Le pipeline, les règles de sourçage et la porte d'approbation — dans vos comptes, à vous dès le premier jour."],
      ["Opérer", "L'IA produit chaque jour. Votre revue prend des minutes. Rien d'externe ne bouge sans votre approbation."],
      ["Mesurer", "Production, délai d'approbation, couverture, coût — rapportés simplement. Puis étendez, ou arrêtez et gardez tout."],
    ],
    boundariesKicker: "Ce que nous ne faisons pas",
    boundaries: [
      "Nous ne prenons jamais la garde de fonds ni de clés. Le travail paiements tourne sur votre nœud et vos comptes.",
      "Pas de lancement de token, pas de pub spéculative, pas de hype. Les règles de sourçage s'appliquent à votre contenu comme au nôtre.",
      "L'IA n'obtient jamais l'autorité d'envoyer, publier ou dépenser. L'approbation reste chez un humain de votre entreprise — c'est le design, pas une limite.",
    ],
    ctaHeading: "Nommez le flux. Nous cadrons le pilote.",
    payNote: "Payez en bitcoin. Le paiement BTCPay Server est en cours d'installation ; d'ici là, une facture réglable on-chain ou par virement.",
    ctaStart: "Lancer un pilote",
    ctaMail: "info@maydalabs.com",
  },
} as const;

const OFFER_ICONS: IconName[] = ["gate", "bitcoin"];
const STEP_ICONS: IconName[] = ["scope", "install", "machine", "report"];
const BOUNDARY_ICONS: IconName[] = ["wallet", "shield", "human"];

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({ ...COPY[locale].meta, path: "/approach", locale, socialCard: "approach" });
}

export default async function OffersPage({ params }: LocalePageProps) {
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
        <div className="mayda-stack-lg">
          {copy.offers.map((offer, index) => (
            <article key={offer.title} className="mayda-card">
              <div className="flex items-center gap-4">
                <IconBox name={OFFER_ICONS[index]} tone={index === 0 ? "mint" : "btc"} />
                <h2 className="mayda-heading" style={{ fontSize: "clamp(1.5rem,3vw,2rem)", marginBottom: "1rem" }}>
                  {offer.title}
                </h2>
              </div>
              <div className="grid gap-8 lg:grid-cols-2" style={{ marginTop: "1.4rem" }}>
                <div className="mayda-stack">
                  <div>
                    <p className="mayda-kicker">{offer.forLabel}</p>
                    <p className="mayda-body">{offer.forText}</p>
                  </div>
                  <div>
                    <p className="mayda-kicker">{offer.installLabel}</p>
                    <ul className="mayda-case-section-body" style={{ paddingLeft: "1.1rem", margin: 0 }}>
                      {offer.install.map((item) => (
                        <li key={item.slice(0, 24)} style={{ marginBottom: "0.4rem" }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mayda-stack">
                  <div className="mayda-offer-figure" aria-hidden="true">
                    {index === 0 ? <ApprovalQueue /> : <PaymentsFlow />}
                  </div>
                  <div>
                    <p className="mayda-kicker">{offer.endLabel}</p>
                    <p className="mayda-body">{offer.endText}</p>
                  </div>
                  <div>
                    <p className="mayda-kicker">{offer.proofLabel}</p>
                    <p className="mayda-body">{offer.proofText}</p>
                    <Link href={localizePath(offer.proofHref, locale)} className="mayda-text-link mt-2" style={{ display: "inline-flex" }}>
                      {offer.proofLink} <span aria-hidden>→</span>
                    </Link>
                  </div>
                  <p className="mayda-mono" style={{ color: "var(--mint)" }}>{offer.price}</p>
                </div>
              </div>
            </article>
          ))}
          <p className="mayda-paynote">
            <LogoMarkBitcoin size={22} /> <span>{copy.payNote}</span>
          </p>
        </div>
      </section>

      <section className="mayda-section" style={{ paddingTop: 0 }}>
        <p className="mayda-kicker">{copy.stepsKicker}</p>
        <div className="mayda-grid-2" style={{ marginTop: "1.4rem" }}>
          {copy.steps.map(([title, text], index) => (
            <article key={title} className="mayda-card">
              <div className="flex items-center justify-between">
                <IconBox name={STEP_ICONS[index]} />
                <p className="mayda-card-number">0{index + 1}</p>
              </div>
              <h3 className="mayda-subheading">{title}</h3>
              <p className="mayda-body mt-3">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mayda-section" style={{ paddingTop: 0 }}>
        <div className="mayda-card" style={{ borderColor: "var(--mint-line)" }}>
          <p className="mayda-kicker">{copy.boundariesKicker}</p>
          <div className="mayda-grid-3">
            {copy.boundaries.map((item, index) => (
              <div key={item.slice(0, 24)} className="mayda-rule-card" style={{ fontWeight: 400, fontSize: "0.92rem", lineHeight: 1.5 }}>
                <Icon name={BOUNDARY_ICONS[index]} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mayda-final-cta">
        <h2 className="mayda-heading">{copy.ctaHeading}</h2>
        <div className="mayda-hero-actions" style={{ justifyContent: "center" }}>
          <Link href={localizePath("/contact", locale)} className="mayda-button">
            {copy.ctaStart} <span aria-hidden>→</span>
          </Link>
          <a href="mailto:info@maydalabs.com" className="mayda-button mayda-button-outline">
            {copy.ctaMail}
          </a>
        </div>
      </section>
    </div>
  );
}
