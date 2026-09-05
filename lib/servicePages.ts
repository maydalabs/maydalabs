import type { Locale } from "@/lib/i18n";
import { SERVICE_IDS, type ServiceId } from "@/lib/services";

export const SERVICE_SLUGS: Record<ServiceId, string> = {
  websites: "websites-and-ecommerce",
  software: "custom-software",
  automation: "ai-and-automation",
  email: "email-and-customer-journeys",
  support: "fixes-and-support",
};
export const servicePath = (id: ServiceId) => `/services/${SERVICE_SLUGS[id]}`;
export const serviceFromSlug = (slug: string) => SERVICE_IDS.find(id => SERVICE_SLUGS[id] === slug);

type ServicePage = {
  headline: string;
  card: string;
  fit: [string, string, string];
  scope: [string, string, string];
  start: string;
  cta: string;
  proof: string;
  faq: [string, string][];
};

export const SERVICE_PAGES: Record<Locale, Record<ServiceId, ServicePage>> = {
  en: {
    websites: {
      headline: "Make your next visitor’s next step obvious.",
      card: "A better front door for your business.",
      fit: ["Your website no longer reflects the business you run.", "People struggle to find, enquire about or buy what you offer.", "You need a new site or store, with a clear way to manage it."],
      scope: ["A page plan, clear content hierarchy and a visual system built around what visitors need to do.", "Responsive pages connected to the forms, booking tools or checkout your business actually uses.", "Content editing, essential search metadata, agreed analytics events and instructions for the person running the site."],
      start: "Send your current site, or tell us what you sell and what a visitor should do. We’ll help define the pages, connections and useful first release.",
      cta: "Let’s talk about your website.",
      proof: "From discovering a stay to making a booking: MaydaLabs rebuilt HodlStay’s brand, interface and full-stack platform. Explore the client case to see how the public pages connect to the product behind them.",
      faq: [["Can you improve our existing site instead of replacing it?", "Yes. We first review the content, customer journey and technical constraints. The recommendation can be a focused improvement, a partial rebuild or a new site."], ["Do you work on online stores as well?", "Yes. Catalogue, content, checkout and operational connections are scoped around your products and platform. We agree payment-provider and platform costs separately; they are not included by implication."], ["Will we be able to update it ourselves?", "We agree what your team needs to edit and choose the content setup around that. Handover includes the relevant access, documentation and instructions."]],
    },
    software: {
      headline: "Turn the way your business works into software that fits.",
      card: "Your idea. Working software.",
      fit: ["You have an idea but need to decide what the first version should do.", "Your team is managing an important process across spreadsheets and emails.", "An existing product needs a portal, dashboard or new capability."],
      scope: ["User journeys, a working prototype where useful, and a first release with explicit acceptance criteria.", "The interface, application logic, database and permissions designed together, including the difficult edge cases.", "Connections to existing systems, regression checks and documentation that make the product maintainable."],
      start: "Bring the idea, the current process or the product you want to extend. We’ll identify its users, the essential workflow and what the first release needs to prove.",
      cta: "Tell us what you want to build.",
      proof: "HodlStay is a live client platform with guest and host journeys, inventory, booking state and integrations. The case sets out MaydaLabs’ role across the interface, backend and migration—not just the screens.",
      faq: [["Can we start with a small first version?", "Yes. We separate essential workflows from later ideas and agree a useful first release. A prototype can help resolve uncertainty before a larger build."], ["Can you work with our current team or codebase?", "Yes, subject to an initial review. We check the architecture, access, dependencies and responsibilities before committing to changes."], ["Who owns the code and accounts?", "Ownership, licences and handover are agreed in writing before work begins. The build is organised for your business to operate; ongoing support is optional, not a condition of access."]],
    },
    automation: {
      headline: "Connect the work. Give your team its attention back.",
      card: "Less busywork. A clearer flow.",
      fit: ["The same information gets copied between several tools.", "Requests arrive, but context and responsibility get lost.", "You want to use AI without giving it unchecked authority."],
      scope: ["A map of inputs, decisions, handoffs and exceptions. We choose one recurring process with a clear owner.", "Connections between your tools and reviewable AI assistance where it adds value—not AI for every step.", "Human review where needed, retry and failure handling, useful logs, and instructions for operating the workflow."],
      start: "Show us one repetitive task, the tools involved and what happens when it goes wrong. We’ll work out what to automate, what to keep human and how to test the result.",
      cta: "Show us the work you keep repeating.",
      proof: "Source intake, structured records, editorial review and publishing workflows—connected, with people in control. Explore the system behind Satoshi Gazette, our owned and editorially independent publication, rather than a client engagement.",
      faq: [["Does the workflow have to use AI?", "No. Rules, forms and ordinary integrations are often sufficient. We use AI only where its output can be checked and its limitations are acceptable."], ["Can people review things before they go out?", "Yes. Review gates can sit before sending, publishing or other consequential actions. We agree those boundaries and test failure cases as part of the scope."], ["What if a tool changes or the workflow fails?", "The scope includes appropriate error handling and a documented recovery path. Ongoing monitoring and maintenance can be agreed separately; uninterrupted operation is not promised."]],
    },
    email: {
      headline: "Make the next message part of a better customer experience.",
      card: "Don’t let a good enquiry go quiet.",
      fit: ["New enquiries do not reach a clear owner or next step.", "Customers need better guidance after signing up or buying.", "Your CRM and email tools are disconnected or difficult to maintain."],
      scope: ["A defined path from enquiry to an assigned owner, with the context your team needs to follow up.", "Welcome, onboarding or follow-up sequences with agreed triggers, consent checks and unsubscribe handling.", "Reusable templates, meaningful audience segments and measurement tied to agreed customer actions."],
      start: "Tell us who the messages are for, the moment that needs attention and the tools you already use. We’ll map one useful flow before adding more campaigns.",
      cta: "Let’s improve your customer follow-through.",
      proof: "Start with one journey: an enquiry reaches the right owner, a relevant response is prepared, and the next action is clear. We agree the audience, message, trigger and measurement before implementation. This example is a proposed approach, not a reported client result.",
      faq: [["Can you work in our existing CRM and email platform?", "We start by checking what your current tools support. We do not ask you to move platforms without a clear reason and an agreed migration scope."], ["Is this a cold-email service?", "This service focuses on enquiry follow-up, onboarding and ongoing customer communication. It does not include purchased lists, unsolicited bulk sending or a promise of new leads."], ["Do you guarantee more sales or inbox placement?", "No. We can implement and test the agreed flows, templates and measurement. Revenue and delivery depend on factors including your offer, audience, sender reputation and provider; results need real evidence."]],
    },
    support: {
      headline: "Get the software you rely on working properly again.",
      card: "Fix what’s slowing you down.",
      fit: ["An important flow is broken, slow or unreliable.", "A build is unfinished and you need a clear route forward.", "Your team needs help maintaining a system it already uses."],
      scope: ["Reproduce the issue, inspect the affected code and dependencies, then prioritise work by impact and risk.", "Agreed repairs with regression checks and a release/rollback plan appropriate to the system.", "Clear documentation and optional maintenance with defined responsibilities, scope and availability."],
      start: "Send the affected URL or describe what should happen, what happens instead and how it affects your team. Don’t send passwords or private customer data with the first message.",
      cta: "Tell us what isn’t working.",
      proof: "A rebuild is more than new screens. For HodlStay, the work included reconciling legacy records, migrating data and connecting existing operational systems. Read how MaydaLabs handled the platform and the dependencies around it.",
      faq: [["Can you take over work someone else started?", "Often, but we review the code, licences, access and documentation first. We then recommend a bounded repair or explain where a rebuild would be more appropriate."], ["Do we have to sign up for ongoing support?", "No. You can start with a one-off review or agreed repair. Maintenance is a separate decision with a clear scope."], ["Is this emergency cover or a security audit?", "Neither is included by default. Availability and response expectations are agreed explicitly. Specialist penetration testing, compliance certification and round-the-clock cover require separate arrangements."]],
    },
  },
  tr: {
    websites: {
      headline: "Ziyaretçiniz sıradaki adımı kolayca bulsun.", card: "İşiniz için daha iyi bir giriş noktası.",
      fit: ["Siteniz artık işinizi doğru yansıtmıyor.", "Ziyaretçiler bilgi bulmakta, talep iletmekte veya satın almakta zorlanıyor.", "Kolayca yönetebileceğiniz yeni bir siteye veya mağazaya ihtiyacınız var."],
      scope: ["Ziyaretçinin ihtiyacına göre sayfa planı, içerik hiyerarşisi ve görsel tasarım.", "İşinizin kullandığı form, rezervasyon veya ödeme araçlarına bağlı, tüm ekranlara uyumlu sayfalar.", "İçerik düzenleme, temel arama metaverileri, kararlaştırılan ölçümleme olayları ve kullanım rehberi."],
      start: "Mevcut sitenizi gönderin veya ne sattığınızı ve ziyaretçinin ne yapmasını istediğinizi anlatın. Sayfaları, bağlantıları ve faydalı bir ilk sürümü birlikte netleştirelim.", cta: "Web sitenizi konuşalım.",
      proof: "Konaklama keşfinden rezervasyona: MaydaLabs, HodlStay’in markasını, arayüzünü ve uçtan uca platformunu yeniden geliştirdi. Müşteri vaka çalışmasında, herkese açık sayfaların arkalarındaki ürüne nasıl bağlandığını inceleyin.",
      faq: [["Mevcut sitemizi değiştirmeden iyileştirebilir misiniz?", "Evet. Önce içeriği, müşteri yolculuğunu ve teknik sınırları inceleriz. Öneri; belirli bir iyileştirme, kısmi geliştirme veya yeni bir site olabilir."], ["Online mağaza da geliştiriyor musunuz?", "Evet. Katalog, içerik, ödeme ve operasyon bağlantılarını ürünlerinize ve platformunuza göre belirleriz. Ödeme sağlayıcısı ve platform ücretleri ayrıca netleştirilir."], ["İçerikleri kendimiz güncelleyebilir miyiz?", "Ekibinizin neleri düzenlemesi gerektiğini belirleyip içerik altyapısını buna göre kurarız. Teslimde ilgili erişimler ve kullanım talimatları verilir."]],
    },
    software: {
      headline: "İşinizin çalışma biçimine uyan bir yazılım geliştirin.", card: "Fikriniz, çalışan bir yazılıma dönüşsün.",
      fit: ["Bir fikriniz var ama ilk sürümün ne yapması gerektiği belirsiz.", "Önemli bir süreci tablolar ve e-postalar arasında yönetiyorsunuz.", "Mevcut ürününüze portal, panel veya yeni bir özellik gerekiyor."],
      scope: ["Kullanıcı akışları, faydalıysa çalışan bir prototip ve kabul ölçütleri belirlenmiş ilk sürüm.", "Arayüz, uygulama mantığı, veritabanı ve yetkiler; zor senaryolar da düşünülerek birlikte tasarlanır.", "Mevcut sistemlerle bağlantılar, regresyon testleri ve bakımı kolaylaştıran dokümantasyon."],
      start: "Fikrinizi, mevcut süreci veya geliştirmek istediğiniz ürünü anlatın. Kullanıcıları, temel akışı ve ilk sürümün neyi göstermesi gerektiğini belirleyelim.", cta: "Ne geliştirmek istediğinizi anlatın.",
      proof: "HodlStay; misafir ve ev sahibi akışları, envanter, rezervasyon durumu ve entegrasyonları olan canlı bir müşteri platformudur. Vaka çalışması, MaydaLabs’ın yalnızca ekranlarda değil arayüz, sunucu tarafı ve veri taşımadaki rolünü açıklar.",
      faq: [["Küçük bir ilk sürümle başlayabilir miyiz?", "Evet. Temel akışları sonraki fikirlerden ayırır, faydalı bir ilk sürüm belirleriz. Büyük geliştirmeden önce belirsizlikleri azaltmak için prototip hazırlanabilir."], ["Mevcut ekibimiz veya kodumuzla çalışabilir misiniz?", "İlk incelemenin ardından evet. Değişiklik taahhüdünden önce mimariyi, erişimleri, bağımlılıkları ve sorumlulukları kontrol ederiz."], ["Kod ve hesaplar kime ait olacak?", "Sahiplik, lisanslar ve teslim koşulları işe başlamadan yazılı olarak belirlenir. Sistem işletmenizin kullanımı için düzenlenir; sürekli destek erişimin koşulu değildir."]],
    },
    automation: {
      headline: "İşleri birbirine bağlayın. Ekibiniz odağını geri kazansın.", card: "Daha az tekrar. Daha düzenli bir akış.",
      fit: ["Aynı bilgiyi farklı araçlara tekrar tekrar kopyalıyorsunuz.", "Talepler geliyor ama ayrıntılar ve sorumluluklar kayboluyor.", "Yapay zekâdan yararlanmak istiyor, kontrolsüz yetki vermek istemiyorsunuz."],
      scope: ["Girdiler, kararlar, devirler ve istisnalar haritalanır. Sorumlusu belli, tekrar eden bir süreç seçilir.", "Araçlarınız arasında bağlantılar ve faydalı olduğu yerde incelenebilir yapay zekâ desteği.", "Gerekli insan incelemesi, yeniden deneme ve hata yönetimi, anlamlı kayıtlar ve kullanım talimatları."],
      start: "Tekrarlayan bir işi, kullandığınız araçları ve hata olduğunda yaşananları gösterin. Neyi otomatikleştireceğimizi, neyi insanda tutacağımızı ve nasıl test edeceğimizi belirleyelim.", cta: "Tekrarlayıp durduğunuz işi gösterin.",
      proof: "Kaynak alımı, düzenli kayıtlar, editoryal inceleme ve yayın akışları; insan kontrolünde birbirine bağlı. Müşteri işi değil, sahibi olduğumuz editoryal olarak bağımsız yayın Satoshi Gazette’in arkasındaki sistemi inceleyin.",
      faq: [["Akışta mutlaka yapay zekâ mı kullanılmalı?", "Hayır. Kurallar, formlar ve standart entegrasyonlar çoğu zaman yeterlidir. Yapay zekâyı çıktısı kontrol edilebildiğinde ve sınırları kabul edilebilir olduğunda kullanırız."], ["Gönderimden önce insan incelemesi olabilir mi?", "Evet. Gönderim, yayın veya önemli işlemler öncesine inceleme adımları konabilir. Bu sınırları belirler, hata senaryolarını kapsam içinde test ederiz."], ["Bir araç değişirse veya akış bozulursa ne olur?", "Kapsama uygun hata yönetimi ve belgelenmiş kurtarma adımları eklenir. Sürekli izleme ve bakım ayrıca kararlaştırılabilir; kesintisiz çalışma garantisi verilmez."]],
    },
    email: {
      headline: "Bir sonraki mesaj, daha iyi bir müşteri deneyiminin parçası olsun.", card: "İyi bir talep, yanıtsız kalmasın.",
      fit: ["Yeni taleplerin sorumlusu veya sonraki adımı belli değil.", "Müşterilerin kayıt ya da satın alma sonrasında daha iyi yönlendirilmesi gerekiyor.", "CRM ve e-posta araçlarınız birbirinden kopuk veya zor yönetiliyor."],
      scope: ["Talebin doğru sorumluya, takip için gerekli ayrıntılarla ulaşacağı açık bir yol.", "Tetikleyicileri, izin kontrolleri ve abonelikten çıkışı belirlenmiş karşılama, alışma veya takip dizileri.", "Tekrar kullanılabilir şablonlar, anlamlı müşteri grupları ve kararlaştırılan müşteri eylemlerinin ölçümü."],
      start: "Mesajların kime gideceğini, hangi anda ihtiyaç olduğunu ve kullandığınız araçları anlatın. Daha fazla kampanya eklemeden önce tek bir faydalı akışı tasarlayalım.", cta: "Müşteri takibinizi iyileştirelim.",
      proof: "Tek bir yolculukla başlayın: talep doğru sorumluya ulaşır, ilgili bir yanıt hazırlanır ve sonraki adım netleşir. Uygulamadan önce kitleyi, mesajı, tetikleyiciyi ve ölçümü belirleriz. Bu örnek önerilen bir yaklaşım; raporlanmış müşteri sonucu değildir.",
      faq: [["Mevcut CRM ve e-posta platformumuzda çalışabilir misiniz?", "Önce mevcut araçlarınızın neleri desteklediğine bakarız. Açık bir neden ve kararlaştırılmış taşıma kapsamı olmadan platform değişikliği istemeyiz."], ["Bu bir soğuk e-posta hizmeti mi?", "Hizmet; gelen taleplerin takibine, müşteri karşılama ve iletişimine odaklanır. Satın alınmış listeler, izinsiz toplu gönderim veya yeni müşteri adayı garantisi içermez."], ["Daha fazla satış veya gelen kutusuna teslim garantisi var mı?", "Hayır. Kararlaştırılan akışları, şablonları ve ölçümü kurup test edebiliriz. Gelir ve teslim; teklifiniz, kitleniz, gönderici itibarınız ve sağlayıcı gibi etkenlere bağlıdır; sonuçlar gerçek kanıt gerektirir."]],
    },
    support: {
      headline: "Güvendiğiniz yazılım yeniden düzgün çalışsın.", card: "Sizi yavaşlatan noktayı düzeltin.",
      fit: ["Önemli bir akış bozuk, yavaş veya kararsız.", "Yarım kalmış bir geliştirme için net bir yol gerekiyor.", "Ekibiniz kullandığı sistemin bakımında desteğe ihtiyaç duyuyor."],
      scope: ["Sorunu yeniden üretir, etkilenen kodu ve bağımlılıkları inceler, işleri etki ve riske göre sıralarız.", "Regresyon testleri ve sisteme uygun yayın/geri alma planıyla kararlaştırılan onarımlar.", "Açık dokümantasyon; sorumlulukları, kapsamı ve erişilebilirliği belirlenmiş isteğe bağlı bakım."],
      start: "Etkilenen adresi paylaşın veya ne olması gerektiğini, ne olduğunu ve ekibinizi nasıl etkilediğini anlatın. İlk mesajda parola ya da özel müşteri verisi göndermeyin.", cta: "Neyin çalışmadığını anlatın.",
      proof: "Yeniden geliştirme, yeni ekranlardan fazlasıdır. HodlStay’de eski kayıtların uzlaştırılması, veri taşıma ve mevcut operasyon sistemlerinin bağlanması da işin parçasıydı. MaydaLabs’ın platformu ve çevresindeki bağımlılıkları nasıl ele aldığını okuyun.",
      faq: [["Başkasının başladığı işi devralabilir misiniz?", "Çoğu durumda önce kodu, lisansları, erişimi ve dokümantasyonu inceleriz. Sonra sınırlı bir onarım önerir veya yeniden geliştirmenin neden daha uygun olduğunu açıklarız."], ["Sürekli destek almak zorunda mıyız?", "Hayır. Tek seferlik inceleme veya kararlaştırılmış bir onarımla başlayabilirsiniz. Bakım, kapsamı ayrı belirlenen bir karardır."], ["Acil müdahale veya güvenlik denetimi dahil mi?", "Varsayılan olarak değil. Erişilebilirlik ve yanıt beklentileri açıkça kararlaştırılır. Uzman sızma testi, uyumluluk belgelendirmesi ve kesintisiz destek ayrı düzenleme gerektirir."]],
    },
  },
  fr: {
    websites: {
      headline: "Rendez la prochaine étape évidente pour vos visiteurs.", card: "Une meilleure porte d’entrée pour votre entreprise.",
      fit: ["Votre site ne reflète plus votre activité.", "Vos visiteurs peinent à trouver, réserver ou acheter ce que vous proposez.", "Vous avez besoin d’un site ou d’une boutique facile à gérer."],
      scope: ["Un plan de pages, une hiérarchie de contenu et une identité visuelle centrés sur les actions des visiteurs.", "Des pages responsive reliées aux formulaires, outils de réservation ou parcours d’achat utilisés par votre entreprise.", "L’édition du contenu, les métadonnées essentielles, les événements de mesure convenus et un guide de prise en main."],
      start: "Envoyez votre site actuel ou expliquez ce que vous vendez et ce que le visiteur doit faire. Nous définirons les pages, les connexions et une première version utile.", cta: "Parlons de votre site web.",
      proof: "De la découverte d’un séjour à sa réservation : MaydaLabs a repensé la marque, l’interface et toute la plateforme de HodlStay. L’étude de ce projet client montre comment les pages publiques se connectent au produit qui les anime.",
      faq: [["Pouvez-vous améliorer notre site plutôt que le remplacer ?", "Oui. Nous examinons le contenu, le parcours client et les contraintes techniques. La recommandation peut être une amélioration ciblée, une refonte partielle ou un nouveau site."], ["Créez-vous aussi des boutiques en ligne ?", "Oui. Catalogue, contenu, paiement et connexions opérationnelles sont définis selon vos produits et votre plateforme. Les frais de plateforme et de paiement sont convenus séparément."], ["Pourrons-nous mettre le contenu à jour ?", "Nous définissons ce que votre équipe doit pouvoir modifier et choisissons le système de contenu en conséquence. La livraison comprend les accès et instructions nécessaires."]],
    },
    software: {
      headline: "Un logiciel adapté à la façon dont votre entreprise travaille.", card: "Votre idée. Un logiciel qui fonctionne.",
      fit: ["Vous avez une idée, mais le rôle de la première version reste à définir.", "Un processus important se disperse entre tableurs et emails.", "Votre produit a besoin d’un portail, d’un tableau de bord ou d’une nouvelle fonction."],
      scope: ["Des parcours utilisateurs, un prototype si utile et une première version avec des critères de réception explicites.", "L’interface, la logique, la base de données et les permissions conçues ensemble, y compris les cas difficiles.", "Des connexions aux systèmes existants, des tests de non-régression et une documentation pour la maintenance."],
      start: "Apportez votre idée, votre processus ou le produit à faire évoluer. Nous identifierons les utilisateurs, le parcours essentiel et ce que la première version doit démontrer.", cta: "Dites-nous ce que vous voulez construire.",
      proof: "HodlStay est une plateforme client en ligne avec parcours voyageurs et hôtes, inventaire, états de réservation et intégrations. L’étude décrit le rôle de MaydaLabs dans l’interface, le backend et la migration, au-delà des écrans.",
      faq: [["Peut-on commencer par une petite version ?", "Oui. Nous séparons les parcours essentiels des idées ultérieures et définissons une première version utile. Un prototype peut lever les incertitudes avant un développement plus large."], ["Pouvez-vous travailler avec notre équipe ou notre code ?", "Oui, après un examen initial. Nous vérifions l’architecture, les accès, les dépendances et les responsabilités avant de nous engager sur des changements."], ["À qui appartiennent le code et les comptes ?", "La propriété, les licences et la transmission sont convenues par écrit avant le début du travail. Le produit est organisé pour votre entreprise ; la maintenance reste optionnelle, pas une condition d’accès."]],
    },
    automation: {
      headline: "Reliez le travail. Rendez son attention à votre équipe.", card: "Moins de répétition. Un flux plus clair.",
      fit: ["Les mêmes informations sont recopiées dans plusieurs outils.", "Les demandes arrivent, mais leur contexte et leur responsable se perdent.", "Vous voulez utiliser l’IA sans lui donner une autorité sans contrôle."],
      scope: ["Une carte des entrées, décisions, transmissions et exceptions. Un processus récurrent avec un responsable identifié.", "Des connexions entre vos outils et une assistance IA vérifiable là où elle apporte une valeur réelle.", "Les validations humaines nécessaires, la gestion des erreurs, des traces utiles et un mode d’emploi."],
      start: "Montrez une tâche répétitive, les outils concernés et ce qui arrive en cas d’erreur. Nous définirons quoi automatiser, quoi garder humain et comment le tester.", cta: "Montrez-nous le travail qui se répète.",
      proof: "Collecte de sources, dossiers structurés, relecture et publication : des processus reliés, sous contrôle humain. Découvrez le système de Satoshi Gazette, notre publication éditorialement indépendante, et non un projet client.",
      faq: [["Faut-il nécessairement utiliser l’IA ?", "Non. Des règles, formulaires et intégrations classiques suffisent souvent. L’IA intervient quand ses résultats peuvent être vérifiés et ses limites sont acceptables."], ["Une personne peut-elle relire avant un envoi ?", "Oui. Des validations peuvent précéder l’envoi, la publication ou d’autres actions importantes. Nous convenons de ces limites et testons les scénarios d’échec."], ["Et si un outil change ou si le processus échoue ?", "Le périmètre comprend une gestion d’erreurs adaptée et une procédure de reprise documentée. La surveillance et la maintenance peuvent être convenues séparément ; un fonctionnement sans interruption n’est pas promis."]],
    },
    email: {
      headline: "Faites du prochain message une meilleure expérience client.", card: "Ne laissez pas une bonne demande sans suite.",
      fit: ["Les nouvelles demandes n’ont ni responsable ni prochaine étape clairs.", "Les clients ont besoin de repères après une inscription ou un achat.", "Votre CRM et vos outils email sont déconnectés ou difficiles à maintenir."],
      scope: ["Un parcours défini entre la demande et son responsable, avec le contexte nécessaire au suivi.", "Des séquences d’accueil ou de suivi aux déclencheurs convenus, avec vérification du consentement et désinscription.", "Des modèles réutilisables, une segmentation utile et une mesure des actions clients convenues."],
      start: "Précisez le public, le moment à améliorer et vos outils actuels. Nous dessinerons un premier parcours utile avant d’ajouter des campagnes.", cta: "Améliorons votre suivi client.",
      proof: "Commencez par un parcours : la demande atteint le bon responsable, une réponse pertinente est préparée et la suite est claire. Public, message, déclencheur et mesure sont définis avant la mise en œuvre. Cet exemple est une approche proposée, pas un résultat client déclaré.",
      faq: [["Travaillez-vous dans notre CRM et notre plateforme email ?", "Nous examinons d’abord les possibilités de vos outils actuels. Aucun changement de plateforme n’est proposé sans raison claire et périmètre de migration convenu."], ["Est-ce un service de prospection à froid ?", "Ce service concerne le suivi des demandes, l’accueil et la communication client. Il ne comprend ni listes achetées, ni envois massifs non sollicités, ni promesse de nouveaux prospects."], ["Garantissez-vous plus de ventes ou la réception en boîte principale ?", "Non. Nous pouvons mettre en œuvre et tester les parcours, modèles et mesures convenus. Les résultats dépendent notamment de votre offre, public, réputation d’expéditeur et prestataire ; ils demandent des preuves réelles."]],
    },
    support: {
      headline: "Remettez les logiciels dont vous dépendez en état de marche.", card: "Corrigez ce qui vous ralentit.",
      fit: ["Un parcours important est cassé, lent ou instable.", "Un développement inachevé a besoin d’une suite claire.", "Votre équipe cherche de l’aide pour entretenir ses systèmes."],
      scope: ["Reproduire le problème, examiner le code et ses dépendances, puis prioriser selon l’impact et le risque.", "Des réparations convenues, des tests de non-régression et un plan de mise en ligne et de retour arrière adapté.", "Une documentation claire et une maintenance optionnelle avec périmètre, responsabilités et disponibilité définis."],
      start: "Partagez l’URL concernée ou décrivez le résultat attendu, le problème et son effet sur votre équipe. N’envoyez ni mot de passe ni données clients privées dans le premier message.", cta: "Dites-nous ce qui ne fonctionne pas.",
      proof: "Une refonte ne se limite pas aux écrans. Pour HodlStay, le travail comprenait le rapprochement d’anciens dossiers, la migration des données et la connexion des systèmes opérationnels. Découvrez comment MaydaLabs a traité la plateforme et ses dépendances.",
      faq: [["Pouvez-vous reprendre le travail d’une autre équipe ?", "Souvent, après examen du code, des licences, des accès et de la documentation. Nous recommandons alors une réparation limitée ou expliquons pourquoi une refonte serait préférable."], ["Faut-il souscrire une maintenance continue ?", "Non. Un examen ponctuel ou une réparation convenue suffit pour commencer. La maintenance fait l’objet d’une décision et d’un périmètre distincts."], ["L’urgence ou un audit de sécurité sont-ils inclus ?", "Pas par défaut. Disponibilité et délais de réponse sont convenus explicitement. Tests d’intrusion spécialisés, certification de conformité et permanence nécessitent des dispositions séparées."]],
    },
  },
};

export const SERVICE_UI = {
  en: { homeTitle: "What would move your business forward?", homeIntro: "A new website. A useful tool. Less work between your tools. Start with what needs to change.", explore: "Explore this service", all: "All services", fit: "Is this what you need?", scope: "What we can deliver", proof: "Work you can inspect", approach: "Start with one useful journey", questions: "Before we start", next: "A clear first step", related: "Often useful together", sample: "Example interface", noGate: "No account needed. Scope and price agreed before work starts.", costQ: "How are scope and price agreed?", costA: "We review what exists, the work required and any dependencies. You receive a defined scope, price, responsibilities and exclusions before implementation. Third-party costs and ongoing support are discussed separately.", client: "Client build · Live", owned: "Owned publication · Editorially independent", case: "Read the case study", scopeLink: "See what’s included", diagram: ["Discover", "Choose", "Get in touch"], portal: ["Your workspace", "Projects", "Documents", "Next step"], flow: ["Request", "Organise", "Review"], email: ["Welcome", "Get started", "Keep in touch"], support: ["Reproduce", "Repair", "Verify"], proofEmailTitle: "The right message. The right moment.", ownership: "Agreed scope. Clear ownership. A useful handover." },
  tr: { homeTitle: "İşinizi hangi adım ileri taşır?", homeIntro: "Yeni bir site. Faydalı bir araç. Araçlar arasında daha az iş. Değişmesi gereken yerden başlayın.", explore: "Bu hizmeti inceleyin", all: "Tüm hizmetler", fit: "İhtiyacınız bu mu?", scope: "Neler teslim edebiliriz?", proof: "İnceleyebileceğiniz işler", approach: "Tek bir faydalı yolculukla başlayın", questions: "Başlamadan önce", next: "Net bir ilk adım", related: "Birlikte faydalı olabilecekler", sample: "Örnek arayüz", noGate: "Hesap gerekmez. Kapsam ve ücret işe başlamadan belirlenir.", costQ: "Kapsam ve ücret nasıl belirlenir?", costA: "Mevcut durumu, gerekli işi ve bağımlılıkları inceleriz. Uygulamadan önce kapsam, ücret, sorumluluklar ve kapsam dışı işler netleşir. Üçüncü taraf maliyetleri ve sürekli destek ayrıca konuşulur.", client: "Müşteri projesi · Yayında", owned: "Kendi yayınımız · Editoryal olarak bağımsız", case: "Vaka çalışmasını okuyun", scopeLink: "Kapsamı görün", diagram: ["Keşfet", "Seç", "İletişime geç"], portal: ["Çalışma alanınız", "Projeler", "Belgeler", "Sıradaki adım"], flow: ["Talep", "Düzenleme", "İnceleme"], email: ["Hoş geldiniz", "İlk adım", "İletişimi sürdür"], support: ["Yeniden üret", "Onar", "Doğrula"], proofEmailTitle: "Doğru mesaj. Doğru an.", ownership: "Belirli kapsam. Açık sahiplik. Faydalı bir teslim." },
  fr: { homeTitle: "Qu’est-ce qui ferait avancer votre entreprise ?", homeIntro: "Un nouveau site. Un outil utile. Moins de travail entre vos outils. Partez de ce qui doit changer.", explore: "Explorer ce service", all: "Tous les services", fit: "Est-ce votre besoin ?", scope: "Ce que nous pouvons livrer", proof: "Des réalisations à examiner", approach: "Commencer par un parcours utile", questions: "Avant de commencer", next: "Une première étape claire", related: "Souvent utiles ensemble", sample: "Exemple d’interface", noGate: "Aucun compte requis. Périmètre et prix convenus avant le travail.", costQ: "Comment convenons-nous du périmètre et du prix ?", costA: "Nous examinons l’existant, le travail et les dépendances. Vous recevez un périmètre, un prix, des responsabilités et des exclusions définis avant la mise en œuvre. Frais tiers et maintenance sont discutés séparément.", client: "Projet client · En ligne", owned: "Notre publication · Indépendance éditoriale", case: "Lire l’étude de cas", scopeLink: "Voir le périmètre", diagram: ["Découvrir", "Choisir", "Prendre contact"], portal: ["Votre espace", "Projets", "Documents", "Prochaine étape"], flow: ["Demande", "Organisation", "Relecture"], email: ["Bienvenue", "Premiers pas", "Garder le lien"], support: ["Reproduire", "Corriger", "Vérifier"], proofEmailTitle: "Le bon message. Le bon moment.", ownership: "Un périmètre défini. Une propriété claire. Une transmission utile." },
} as const;

export const SERVICE_RELATED: Record<ServiceId, ServiceId[]> = {
  websites: ["email", "support"], software: ["automation", "support"],
  automation: ["software", "email"], email: ["websites", "automation"], support: ["websites", "software"],
};
