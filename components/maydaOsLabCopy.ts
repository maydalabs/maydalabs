import type { Locale } from "@/lib/i18n";

export type MaydaOsApp =
  | "overview"
  | "pathways"
  | "capabilities"
  | "work"
  | "terminal";

export type MaydaOsCopy = {
  ariaLabel: string;
  dockLabel: string;
  labMode: string;
  connected: string;
  windowLabel: string;
  footerStatus: string;
  apps: Record<MaydaOsApp, { label: string; hint: string; glyph: string }>;
  overview: {
    kicker: string;
    heading: string;
    body: string;
    inputLabel: string;
    input: string;
    outputLabel: string;
    outputs: string[];
    primaryAction: string;
    secondaryAction: string;
    facts: Array<[string, string]>;
  };
  pathways: {
    kicker: string;
    heading: string;
    body: string;
    action: string;
    items: Array<{
      number: string;
      label: string;
      title: string;
      body: string;
      result: string;
    }>;
  };
  capabilities: {
    kicker: string;
    heading: string;
    body: string;
    onchainLabel: string;
    onchainTitle: string;
    onchainBody: string;
    items: Array<{
      number: string;
      title: string;
      body: string;
      signals: string[];
    }>;
  };
  work: {
    kicker: string;
    heading: string;
    body: string;
    action: string;
    items: Array<{
      title: string;
      relationship: string;
      status: string;
      body: string;
      href: string;
    }>;
  };
  terminal: {
    kicker: string;
    heading: string;
    body: string;
    prompt: string;
    inputLabel: string;
    placeholder: string;
    run: string;
    welcome: string;
    help: string;
    cleared: string;
    unknown: string;
    opened: string;
    navigating: string;
    suggestionsLabel: string;
    suggestions: string[];
  };
};

export const MAYDA_OS_COPY: Record<Locale, MaydaOsCopy> = {
  en: {
    ariaLabel: "MaydaOS interactive lab",
    dockLabel: "Open a MaydaOS module",
    labMode: "Lab mode",
    connected: "Field connected",
    windowLabel: "Active MaydaOS window",
    footerStatus: "MaydaLabs is the company · MaydaOS is the lab",
    apps: {
      overview: { label: "Overview", hint: "What MaydaOS is now", glyph: "01" },
      pathways: { label: "Paths", hint: "Launch, accelerate, remove drag", glyph: "02" },
      capabilities: { label: "Systems", hint: "The connected capability stack", glyph: "03" },
      work: { label: "Work", hint: "Proof and ownership boundaries", glyph: "04" },
      terminal: { label: "Terminal", hint: "Navigate with commands", glyph: ">_" },
    },
    overview: {
      kicker: "System / orientation",
      heading: "One constraint in. A stronger business out.",
      body:
        "MaydaOS is the interactive proof layer inside MaydaLabs v3. It makes the connections visible without asking a first-time buyer to decode an operating-system metaphor before understanding the company.",
      inputLabel: "Input",
      input: "An idea, a stalled product, or operational friction",
      outputLabel: "Connected outputs",
      outputs: ["Working product", "Automated flow", "Growth loop", "Reliable system"],
      primaryAction: "Run the Multiplier Map",
      secondaryAction: "See the approach",
      facts: [
        ["Company", "MaydaLabs"],
        ["Interface", "MaydaOS Lab"],
        ["Mode", "Buyer-first · v3"],
      ],
    },
    pathways: {
      kicker: "System / pathways",
      heading: "Enter from the problem, not the service list.",
      body:
        "The same product, automation, lifecycle, and security capabilities combine differently depending on where the business is stuck.",
      action: "Map this situation",
      items: [
        {
          number: "01",
          label: "Launch",
          title: "Idea → working product",
          body: "Shape the product, build the frontend and backend, connect the operating foundations, and establish a credible release path.",
          result: "A product people can actually use and inspect.",
        },
        {
          number: "02",
          label: "Accelerate",
          title: "Existing company → more leverage",
          body: "Find the constraint across product, conversion, lifecycle, data, or reliability and improve the system around it.",
          result: "Focused improvement instead of disconnected activity.",
        },
        {
          number: "03",
          label: "Remove the drag",
          title: "Manual friction → a better system",
          body: "Trace repetitive work, broken handoffs, and hidden risk before building the automation or internal tool that removes them.",
          result: "Less operational drag with accountable controls.",
        },
      ],
    },
    capabilities: {
      kicker: "System / capability stack",
      heading: "Four disciplines. One accountable build.",
      body:
        "MaydaOS shows how the parts connect. The buyer does not need to assemble separate frontend, backend, automation, growth, and security vendors.",
      onchainLabel: "Optional module",
      onchainTitle: "Onchain when it earns its place",
      onchainBody:
        "Wallets, signatures, and onchain systems belong inside Product Engineering only when they solve a real ownership, payment, identity, or coordination problem. They are never a gate to using MaydaLabs.",
      items: [
        {
          number: "01",
          title: "Product Engineering",
          body: "Frontend, backend, APIs, data, infrastructure, and complete digital products.",
          signals: ["Web", "Mobile-ready", "Onchain when useful"],
        },
        {
          number: "02",
          title: "Automation & AI",
          body: "Workflows, integrations, internal tools, and bounded AI with human control.",
          signals: ["Operations", "Data flows", "Human review"],
        },
        {
          number: "03",
          title: "Lifecycle & Growth",
          body: "Activation, conversion, retention, analytics, and customer journeys.",
          signals: ["Acquisition", "Conversion", "Retention"],
        },
        {
          number: "04",
          title: "Security & Reliability",
          body: "Access control, resilience, performance, and security foundations.",
          signals: ["Auth", "RLS", "Operational confidence"],
        },
      ],
    },
    work: {
      kicker: "System / proof",
      heading: "Inspect the work. Keep ownership honest.",
      body:
        "MaydaOS routes to the same conversion-grade cases as the main site. Client work, owned products, live evidence, and private boundaries remain explicit.",
      action: "Open case",
      items: [
        {
          title: "HodlStay",
          relationship: "Client build",
          status: "Live",
          body: "A hospitality marketplace built across the complete product surface.",
          href: "/case-studies/hodlstay",
        },
        {
          title: "Satoshi Gazette",
          relationship: "Owned publication",
          status: "Live",
          body: "An independent Bitcoin newsroom built as a product and operating system.",
          href: "/case-studies/satoshi-gazette",
        },
        {
          title: "Sofra",
          relationship: "Owned product",
          status: "Private Phase 1",
          body: "Marketplace architecture proof with no claim of live transactions.",
          href: "/case-studies/sofra",
        },
        {
          title: "Mortal Vault",
          relationship: "Owned experiment",
          status: "Private alpha",
          body: "Security-sensitive product exploration with explicit unaudited boundaries.",
          href: "/case-studies/mortal-vault",
        },
      ],
    },
    terminal: {
      kicker: "System / terminal",
      heading: "The terminal is real navigation, not decoration.",
      body:
        "Use commands to move through the lab or open a useful buyer path. Nothing typed here is stored or transmitted.",
      prompt: "guest@maydaos:~$",
      inputLabel: "MaydaOS command",
      placeholder: "Type help",
      run: "Run",
      welcome: "MaydaOS v3 ready. Type help to see the available commands.",
      help: "Commands: overview, launch, accelerate, optimize, systems, work, map, contact, clear.",
      cleared: "Terminal cleared.",
      unknown: "Unknown command. Type help.",
      opened: "Opened",
      navigating: "Opening",
      suggestionsLabel: "Suggested commands",
      suggestions: ["help", "launch", "systems", "work", "map"],
    },
  },
  tr: {
    ariaLabel: "MaydaOS etkileşimli laboratuvarı",
    dockLabel: "Bir MaydaOS modülü açın",
    labMode: "Lab modu",
    connected: "Alan bağlı",
    windowLabel: "Etkin MaydaOS penceresi",
    footerStatus: "Şirket MaydaLabs · laboratuvar MaydaOS",
    apps: {
      overview: { label: "Genel bakış", hint: "MaydaOS artık nedir", glyph: "01" },
      pathways: { label: "Yollar", hint: "Başlat, hızlandır, sürtünmeyi kaldır", glyph: "02" },
      capabilities: { label: "Sistemler", hint: "Bağlı yetkinlik yapısı", glyph: "03" },
      work: { label: "Projeler", hint: "Kanıt ve sahiplik sınırları", glyph: "04" },
      terminal: { label: "Terminal", hint: "Komutlarla gezinin", glyph: ">_" },
    },
    overview: {
      kicker: "Sistem / yönlendirme",
      heading: "Bir kısıt girer. Daha güçlü bir işletme çıkar.",
      body:
        "MaydaOS, MaydaLabs v3 içindeki etkileşimli kanıt katmanıdır. İlk kez gelen bir alıcıya şirketi anlamadan önce işletim sistemi metaforunu çözdürmeden bağlantıları görünür kılar.",
      inputLabel: "Girdi",
      input: "Bir fikir, takılmış bir ürün veya operasyonel sürtünme",
      outputLabel: "Bağlı çıktılar",
      outputs: ["Çalışan ürün", "Otomatik akış", "Büyüme döngüsü", "Güvenilir sistem"],
      primaryAction: "Multiplier Map'i çalıştır",
      secondaryAction: "Yaklaşımı gör",
      facts: [
        ["Şirket", "MaydaLabs"],
        ["Arayüz", "MaydaOS Lab"],
        ["Mod", "Alıcı odaklı · v3"],
      ],
    },
    pathways: {
      kicker: "Sistem / yollar",
      heading: "Hizmet listesinden değil, problemden girin.",
      body:
        "Aynı ürün, otomasyon, yaşam döngüsü ve güvenlik yetkinlikleri işletmenin nerede takıldığına göre farklı biçimde birleşir.",
      action: "Bu durumu haritala",
      items: [
        {
          number: "01",
          label: "Başlat",
          title: "Fikir → çalışan ürün",
          body: "Ürünü şekillendirin, ön ve arka ucu inşa edin, işletim temellerini bağlayın ve güvenilir bir yayın yolu kurun.",
          result: "İnsanların gerçekten kullanıp inceleyebildiği bir ürün.",
        },
        {
          number: "02",
          label: "Hızlandır",
          title: "Mevcut şirket → daha fazla kaldıraç",
          body: "Ürün, dönüşüm, yaşam döngüsü, veri veya güvenilirlikteki kısıtı bulun ve çevresindeki sistemi iyileştirin.",
          result: "Birbirinden kopuk faaliyet yerine odaklı iyileştirme.",
        },
        {
          number: "03",
          label: "Sürtünmeyi kaldır",
          title: "Manuel yük → daha iyi sistem",
          body: "Tekrarlayan işi, kopuk devirleri ve gizli riski izleyin; sonra bunları kaldıran otomasyonu veya iç aracı kurun.",
          result: "Sorumlu kontrollerle daha az operasyonel yük.",
        },
      ],
    },
    capabilities: {
      kicker: "Sistem / yetkinlik yapısı",
      heading: "Dört disiplin. Tek sorumlu inşa.",
      body:
        "MaydaOS parçaların nasıl bağlandığını gösterir. Alıcının ayrı ön uç, arka uç, otomasyon, büyüme ve güvenlik tedarikçileri toplaması gerekmez.",
      onchainLabel: "İsteğe bağlı modül",
      onchainTitle: "Onchain, ancak yerini hak ettiğinde",
      onchainBody:
        "Cüzdanlar, imzalar ve onchain sistemler yalnızca gerçek bir sahiplik, ödeme, kimlik veya koordinasyon problemini çözdüğünde Ürün Mühendisliği içinde yer alır. MaydaLabs'i kullanmanın kapısı değildir.",
      items: [
        {
          number: "01",
          title: "Ürün Mühendisliği",
          body: "Ön uç, arka uç, API'ler, veri, altyapı ve eksiksiz dijital ürünler.",
          signals: ["Web", "Mobil uyumlu", "Yararlıysa onchain"],
        },
        {
          number: "02",
          title: "Otomasyon ve AI",
          body: "İş akışları, entegrasyonlar, iç araçlar ve insan kontrollü sınırlı AI.",
          signals: ["Operasyonlar", "Veri akışları", "İnsan incelemesi"],
        },
        {
          number: "03",
          title: "Yaşam Döngüsü ve Büyüme",
          body: "Aktivasyon, dönüşüm, elde tutma, analitik ve müşteri yolculukları.",
          signals: ["Edinim", "Dönüşüm", "Elde tutma"],
        },
        {
          number: "04",
          title: "Güvenlik ve Güvenilirlik",
          body: "Erişim kontrolü, dayanıklılık, performans ve güvenlik temelleri.",
          signals: ["Kimlik", "RLS", "Operasyonel güven"],
        },
      ],
    },
    work: {
      kicker: "Sistem / kanıt",
      heading: "İşi inceleyin. Sahipliği dürüst tutun.",
      body:
        "MaydaOS, ana siteyle aynı dönüşüm odaklı vakalara gider. Müşteri işi, sahip olunan ürünler, canlı kanıt ve özel sınırlar açık kalır.",
      action: "Vakayı aç",
      items: [
        {
          title: "HodlStay",
          relationship: "Müşteri inşası",
          status: "Canlı",
          body: "Ürünün tamamı boyunca inşa edilmiş bir konaklama pazaryeri.",
          href: "/case-studies/hodlstay",
        },
        {
          title: "Satoshi Gazette",
          relationship: "Sahip olunan yayın",
          status: "Canlı",
          body: "Ürün ve işletim sistemi olarak inşa edilmiş bağımsız Bitcoin haber odası.",
          href: "/case-studies/satoshi-gazette",
        },
        {
          title: "Sofra",
          relationship: "Sahip olunan ürün",
          status: "Özel Faz 1",
          body: "Canlı işlem iddiası taşımayan pazaryeri mimarisi kanıtı.",
          href: "/case-studies/sofra",
        },
        {
          title: "Mortal Vault",
          relationship: "Sahip olunan deney",
          status: "Özel alfa",
          body: "Denetlenmemiş sınırları açıkça belirtilen güvenlik hassasiyetli ürün keşfi.",
          href: "/case-studies/mortal-vault",
        },
      ],
    },
    terminal: {
      kicker: "Sistem / terminal",
      heading: "Terminal dekor değil, gerçek navigasyondur.",
      body:
        "Laboratuvarda gezinmek veya yararlı bir alıcı yolunu açmak için komutları kullanın. Buraya yazılan hiçbir şey saklanmaz veya gönderilmez.",
      prompt: "misafir@maydaos:~$",
      inputLabel: "MaydaOS komutu",
      placeholder: "help yazın",
      run: "Çalıştır",
      welcome: "MaydaOS v3 hazır. Kullanılabilir komutlar için help yazın.",
      help: "Komutlar: overview, launch, accelerate, optimize, systems, work, map, contact, clear.",
      cleared: "Terminal temizlendi.",
      unknown: "Bilinmeyen komut. help yazın.",
      opened: "Açıldı",
      navigating: "Açılıyor",
      suggestionsLabel: "Önerilen komutlar",
      suggestions: ["help", "launch", "systems", "work", "map"],
    },
  },
  fr: {
    ariaLabel: "Laboratoire interactif MaydaOS",
    dockLabel: "Ouvrir un module MaydaOS",
    labMode: "Mode Lab",
    connected: "Champ connecté",
    windowLabel: "Fenêtre MaydaOS active",
    footerStatus: "MaydaLabs est l’entreprise · MaydaOS est le laboratoire",
    apps: {
      overview: { label: "Vue d’ensemble", hint: "Ce qu’est MaydaOS maintenant", glyph: "01" },
      pathways: { label: "Parcours", hint: "Lancer, accélérer, retirer les frictions", glyph: "02" },
      capabilities: { label: "Systèmes", hint: "L’ensemble des capacités connectées", glyph: "03" },
      work: { label: "Réalisations", hint: "Preuves et limites de propriété", glyph: "04" },
      terminal: { label: "Terminal", hint: "Naviguer avec des commandes", glyph: ">_" },
    },
    overview: {
      kicker: "Système / orientation",
      heading: "Une contrainte entre. Une entreprise plus forte en sort.",
      body:
        "MaydaOS est la couche de preuve interactive de MaydaLabs v3. Elle rend les connexions visibles sans demander à un nouvel acheteur de décoder une métaphore de système d’exploitation avant de comprendre l’entreprise.",
      inputLabel: "Entrée",
      input: "Une idée, un produit bloqué ou une friction opérationnelle",
      outputLabel: "Sorties connectées",
      outputs: ["Produit fonctionnel", "Flux automatisé", "Boucle de croissance", "Système fiable"],
      primaryAction: "Lancer la Multiplier Map",
      secondaryAction: "Voir l’approche",
      facts: [
        ["Entreprise", "MaydaLabs"],
        ["Interface", "MaydaOS Lab"],
        ["Mode", "Acheteur d’abord · v3"],
      ],
    },
    pathways: {
      kicker: "Système / parcours",
      heading: "Entrez par le problème, pas par une liste de services.",
      body:
        "Les mêmes capacités produit, automatisation, cycle de vie et sécurité se combinent différemment selon le point de blocage de l’entreprise.",
      action: "Cartographier cette situation",
      items: [
        {
          number: "01",
          label: "Lancer",
          title: "Idée → produit fonctionnel",
          body: "Façonner le produit, construire le frontend et le backend, relier les fondations opérationnelles et établir une voie de lancement crédible.",
          result: "Un produit que les gens peuvent réellement utiliser et examiner.",
        },
        {
          number: "02",
          label: "Accélérer",
          title: "Entreprise existante → plus de levier",
          body: "Trouver la contrainte dans le produit, la conversion, le cycle de vie, les données ou la fiabilité et améliorer le système autour.",
          result: "Une amélioration ciblée plutôt que des activités déconnectées.",
        },
        {
          number: "03",
          label: "Retirer les frictions",
          title: "Friction manuelle → meilleur système",
          body: "Tracer le travail répétitif, les passages cassés et les risques cachés avant de construire l’automatisation ou l’outil interne qui les retire.",
          result: "Moins de friction opérationnelle avec des contrôles responsables.",
        },
      ],
    },
    capabilities: {
      kicker: "Système / ensemble de capacités",
      heading: "Quatre disciplines. Une construction responsable.",
      body:
        "MaydaOS montre comment les éléments se connectent. L’acheteur n’a pas à assembler séparément frontend, backend, automatisation, croissance et sécurité.",
      onchainLabel: "Module optionnel",
      onchainTitle: "Onchain uniquement lorsque cela mérite sa place",
      onchainBody:
        "Portefeuilles, signatures et systèmes onchain appartiennent à l’Ingénierie Produit uniquement lorsqu’ils résolvent un vrai problème de propriété, paiement, identité ou coordination. Ils ne conditionnent jamais l’accès à MaydaLabs.",
      items: [
        {
          number: "01",
          title: "Ingénierie Produit",
          body: "Frontend, backend, API, données, infrastructure et produits numériques complets.",
          signals: ["Web", "Prêt pour mobile", "Onchain si utile"],
        },
        {
          number: "02",
          title: "Automatisation et IA",
          body: "Flux de travail, intégrations, outils internes et IA encadrée avec contrôle humain.",
          signals: ["Opérations", "Flux de données", "Revue humaine"],
        },
        {
          number: "03",
          title: "Cycle de vie et Croissance",
          body: "Activation, conversion, rétention, analytique et parcours client.",
          signals: ["Acquisition", "Conversion", "Rétention"],
        },
        {
          number: "04",
          title: "Sécurité et Fiabilité",
          body: "Contrôle d’accès, résilience, performance et fondations de sécurité.",
          signals: ["Authentification", "RLS", "Confiance opérationnelle"],
        },
      ],
    },
    work: {
      kicker: "Système / preuves",
      heading: "Examinez le travail. Gardez la propriété honnête.",
      body:
        "MaydaOS mène aux mêmes études de cas orientées conversion que le site principal. Travail client, produits détenus, preuves publiques et limites privées restent explicites.",
      action: "Ouvrir l’étude",
      items: [
        {
          title: "HodlStay",
          relationship: "Construction client",
          status: "En ligne",
          body: "Une place de marché d’hospitalité construite sur toute la surface produit.",
          href: "/case-studies/hodlstay",
        },
        {
          title: "Satoshi Gazette",
          relationship: "Publication détenue",
          status: "En ligne",
          body: "Une rédaction Bitcoin indépendante construite comme produit et système opérationnel.",
          href: "/case-studies/satoshi-gazette",
        },
        {
          title: "Sofra",
          relationship: "Produit détenu",
          status: "Phase 1 privée",
          body: "Preuve d’architecture de place de marché sans prétention de transactions publiques.",
          href: "/case-studies/sofra",
        },
        {
          title: "Mortal Vault",
          relationship: "Expérience détenue",
          status: "Alpha privée",
          body: "Exploration sensible à la sécurité avec limites non auditées explicites.",
          href: "/case-studies/mortal-vault",
        },
      ],
    },
    terminal: {
      kicker: "Système / terminal",
      heading: "Le terminal est une vraie navigation, pas une décoration.",
      body:
        "Utilisez des commandes pour parcourir le laboratoire ou ouvrir un parcours acheteur utile. Rien de ce qui est saisi ici n’est conservé ni transmis.",
      prompt: "invite@maydaos:~$",
      inputLabel: "Commande MaydaOS",
      placeholder: "Saisissez help",
      run: "Exécuter",
      welcome: "MaydaOS v3 est prêt. Saisissez help pour voir les commandes disponibles.",
      help: "Commandes : overview, launch, accelerate, optimize, systems, work, map, contact, clear.",
      cleared: "Terminal effacé.",
      unknown: "Commande inconnue. Saisissez help.",
      opened: "Ouvert",
      navigating: "Ouverture",
      suggestionsLabel: "Commandes suggérées",
      suggestions: ["help", "launch", "systems", "work", "map"],
    },
  },
};
