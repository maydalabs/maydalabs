import type { Locale } from "@/lib/i18n";
import type {
  MapCapability,
  MapNoteKey,
  MapOffer,
  MapPath,
  MapStepKey,
} from "@/lib/multiplierMap";

type Option = { id: string; label: string; detail?: string };

type Question = { label: string; hint?: string; options: Option[] };

export type MapCopy = {
  progressLabel: string;
  stepWord: string;
  questions: {
    stage: Question;
    constraint: Question;
    outcome: Question;
    timeline: Question;
    resources: Question;
  };
  back: string;
  next: string;
  seeMap: string;
  required: string;
  resultKicker: string;
  resultHeading: string;
  rubricNote: string;
  pathLabel: string;
  paths: Record<MapPath, { title: string; text: string }>;
  offerLabel: string;
  offers: Record<MapOffer, { title: string; text: string }>;
  focusLabel: string;
  capabilities: Record<MapCapability, string>;
  stepsLabel: string;
  steps: Record<MapStepKey, string>;
  notes: Record<MapNoteKey, string>;
  actionsLabel: string;
  saveAction: string;
  saveHint: string;
  discussAction: string;
  discussHint: string;
  restart: string;
  saved: string;
  savedHint: string;
  authIntro: string;
  emailLabel: string;
  emailPlaceholder: string;
  sendCode: string;
  codeSentTo: string;
  codeLabel: string;
  codeHint: string;
  verifyAndSave: string;
  changeEmail: string;
  discussIntro: string;
  nameLabel: string;
  companyLabel: string;
  messageLabel: string;
  messageHint: string;
  consentContact: string;
  consentUpdates: string;
  submitDiscuss: string;
  discussDone: string;
  discussDoneHint: string;
  errors: {
    invalid_email: string;
    rate_limited: string;
    send_failed: string;
    invalid_code: string;
    verify_failed: string;
    invalid_answers: string;
    save_failed: string;
    not_signed_in: string;
    consent_required: string;
    invalid: string;
    name: string;
    message: string;
  };
};

export const MAP_COPY: Record<Locale, MapCopy> = {
  en: {
    progressLabel: "Multiplier Map progress",
    stepWord: "Question",
    questions: {
      stage: {
        label: "Where is the business today?",
        hint: "Rough is fine — this sets the frame, not the verdict.",
        options: [
          { id: "idea", label: "Idea", detail: "Nothing shipped yet" },
          { id: "launched", label: "Launched", detail: "Live, early usage" },
          { id: "growing", label: "Growing", detail: "Real customers and revenue" },
          { id: "established", label: "Established", detail: "Operating for years" },
        ],
      },
      constraint: {
        label: "What is holding things back right now?",
        hint: "Pick the closest one.",
        options: [
          { id: "product_not_built", label: "The product doesn't exist yet", detail: "The idea needs to become software" },
          { id: "product_stuck", label: "The product is stuck", detail: "Shipped, but progress has stalled" },
          { id: "growth_flat", label: "Growth is flat", detail: "Traffic, conversion, or retention won't move" },
          { id: "operations_drag", label: "Operations eat the week", detail: "Manual work, spreadsheets, disconnected tools" },
          { id: "reliability_risk", label: "Reliability or security worries me", detail: "Incidents, fragility, access questions" },
          { id: "unclear", label: "Honestly, unclear", detail: "Something is off but hard to name" },
        ],
      },
      outcome: {
        label: "What would a win look like in six months?",
        options: [
          { id: "launch", label: "A launched product" },
          { id: "revenue_growth", label: "Revenue growing again" },
          { id: "retention", label: "Customers who stay" },
          { id: "efficiency", label: "Hours back every week" },
          { id: "confidence", label: "Systems I can trust" },
        ],
      },
      timeline: {
        label: "When does movement matter?",
        options: [
          { id: "now", label: "Now" },
          { id: "quarter", label: "This quarter" },
          { id: "exploring", label: "Still exploring" },
        ],
      },
      resources: {
        label: "What do you have to work with?",
        options: [
          { id: "solo", label: "Mostly me", detail: "Solo founder or operator" },
          { id: "some_help", label: "Some help", detail: "Freelancers or part-time support" },
          { id: "team", label: "A team", detail: "In-house people who can execute" },
        ],
      },
    },
    back: "Back",
    next: "Continue",
    seeMap: "See my map",
    required: "Choose one to continue.",
    resultKicker: "Your Multiplier Map",
    resultHeading: "The next move that multiplies.",
    rubricNote:
      "Built from your answers by transparent, deterministic rules (rubric {version}) — no AI verdicts, no scoring theater. It's a structured starting point, not a substitute for judgment.",
    pathLabel: "Your situation",
    paths: {
      launch: {
        title: "Launch",
        text: "An idea that needs to become a working product. The risk is building too much before the business is proven.",
      },
      accelerate: {
        title: "Accelerate",
        text: "Something real is running — the question is which constraint, once removed, moves the numbers.",
      },
      unblock: {
        title: "Remove the drag",
        text: "The expensive problem is operational: manual work and disconnected systems quietly taxing every week.",
      },
    },
    offerLabel: "Suggested entry point",
    offers: {
      multiplier_sprint: {
        title: "Multiplier Sprint",
        text: "A focused engagement to identify and address one high-leverage constraint — the smallest honest way to start.",
      },
      build_partnership: {
        title: "Build Partnership",
        text: "End-to-end delivery of the product and the systems around it — scoped around the smallest release that proves the business.",
      },
      acceleration_partnership: {
        title: "Acceleration Partnership",
        text: "Continuing improvement across product, conversion, lifecycle, and reliability — compounding cycle by cycle.",
      },
    },
    focusLabel: "Capability focus",
    capabilities: {
      product_engineering: "Product Engineering",
      automation_ai: "Automation and AI",
      lifecycle_growth: "Lifecycle and Growth",
      security_reliability: "Security and Reliability",
    },
    stepsLabel: "Your next-step map",
    steps: {
      define_wedge: "Define the wedge: the one user, problem, and outcome the first release must prove.",
      scope_first_release: "Scope the smallest credible release — and name what deliberately waits.",
      build_measure: "Build it with measurement wired in from the first day, not bolted on later.",
      prepare_operate: "Prepare the operating side: how it runs, who owns what, what the data says.",
      clarify_buyer: "Sharpen who this is for and what they'd pay for before writing more code.",
      prototype_riskiest: "Prototype the riskiest assumption first — cheaply and honestly.",
      decide_build: "Decide build / adjust / stop on evidence, then scope the real first release.",
      instrument_funnel: "Instrument the funnel end to end so the constraint shows up in data, not opinions.",
      find_leverage: "Locate the highest-leverage constraint: where a fix multiplies instead of adds.",
      ship_loops: "Ship improvement loops against it — product, conversion, lifecycle — in small verified steps.",
      compound: "Review the evidence, pick the next constraint, and let the cycles compound.",
      map_constraint: "Map the constraint precisely: where the numbers actually stall and why.",
      one_leverage_move: "Make one high-leverage move against it — small enough to verify, big enough to matter.",
      measure_result: "Measure what changed, then decide the next move on results.",
      inventory_drag: "Inventory the drag: every manual step, hand-off, and workaround with its weekly cost.",
      pick_one_system: "Pick the one system whose fix frees the most time or removes the most risk.",
      automate_verify: "Automate it with checks you can inspect — then verify the hours actually came back.",
    },
    notes: {
      sprint_first: "You're still exploring — a bounded sprint beats a long commitment until direction is proven.",
      resource_light: "With limited hands, the map favors moves that reduce ongoing workload instead of adding it.",
      human_judgment: "This map is rule-based guidance. The real scope comes from a conversation, not a form.",
    },
    actionsLabel: "What you can do with this map",
    saveAction: "Save to my portal",
    saveHint: "Keep it, revisit it, compare later. Sign-in is a six-digit email code — no password.",
    discussAction: "Discuss it with MaydaLabs",
    discussHint: "Send the map with your context. A human reads it; nothing is automated.",
    restart: "Start over",
    saved: "Map saved to your portal.",
    savedHint: "You can find it under Your portal any time.",
    authIntro: "Enter your email to save this map. We send a six-digit code — no password, no spam.",
    emailLabel: "Email",
    emailPlaceholder: "you@company.com",
    sendCode: "Send code",
    codeSentTo: "Code sent to",
    codeLabel: "Six-digit code",
    codeHint: "Check your inbox and enter the code.",
    verifyAndSave: "Verify and save",
    changeEmail: "Use a different email",
    discussIntro:
      "Your map travels with this note. Mehmet reads every submission personally; you hear back by email.",
    nameLabel: "Your name",
    companyLabel: "Company or product (optional)",
    messageLabel: "Anything that helps (optional)",
    messageHint: "Context, links, the friction in your own words — at least 24 characters if you add it.",
    consentContact: "MaydaLabs may store these details and contact me about this request.",
    consentUpdates: "Send me occasional product and build updates by email (free, revocable any time).",
    submitDiscuss: "Send map and note",
    discussDone: "Received. Your map and note are in.",
    discussDoneHint:
      "A human will read it and reply by email. Nothing was auto-qualified, auto-sent, or added to any list beyond what you ticked.",
    errors: {
      invalid_email: "Add a valid email address.",
      rate_limited: "Too many attempts. Wait a few minutes and try again.",
      send_failed: "The code could not be sent. Try again in a moment.",
      invalid_code: "Enter the six-digit code from the email.",
      verify_failed: "That code didn't verify. Check it or request a new one.",
      invalid_answers: "The answers could not be read. Restart the map.",
      save_failed: "Saving failed. Try again in a moment.",
      not_signed_in: "Sign in to save this map.",
      consent_required: "The contact consent is required to send this.",
      invalid: "Check the highlighted fields.",
      name: "Add your name.",
      message: "Add at least 24 characters or leave it empty.",
    },
  },
  tr: {
    progressLabel: "Multiplier Map ilerlemesi",
    stepWord: "Soru",
    questions: {
      stage: {
        label: "İş bugün nerede?",
        hint: "Yaklaşık olması yeterli — bu çerçeveyi belirler, hükmü değil.",
        options: [
          { id: "idea", label: "Fikir", detail: "Henüz yayında bir şey yok" },
          { id: "launched", label: "Yayında", detail: "Canlı, erken kullanım" },
          { id: "growing", label: "Büyüyor", detail: "Gerçek müşteri ve gelir" },
          { id: "established", label: "Oturmuş", detail: "Yıllardır çalışıyor" },
        ],
      },
      constraint: {
        label: "Şu anda işi ne tutuyor?",
        hint: "En yakın olanı seçin.",
        options: [
          { id: "product_not_built", label: "Ürün henüz yok", detail: "Fikrin yazılıma dönüşmesi gerekiyor" },
          { id: "product_stuck", label: "Ürün tıkandı", detail: "Yayında ama ilerleme durdu" },
          { id: "growth_flat", label: "Büyüme düz", detail: "Trafik, dönüşüm veya elde tutma kımıldamıyor" },
          { id: "operations_drag", label: "Operasyon haftayı yiyor", detail: "Manuel iş, tablolar, kopuk araçlar" },
          { id: "reliability_risk", label: "Güvenilirlik/güvenlik endişesi", detail: "Arızalar, kırılganlık, erişim soruları" },
          { id: "unclear", label: "Açıkçası belirsiz", detail: "Bir şey ters ama adını koymak zor" },
        ],
      },
      outcome: {
        label: "Altı ay sonra kazanım neye benzerdi?",
        options: [
          { id: "launch", label: "Yayınlanmış bir ürün" },
          { id: "revenue_growth", label: "Yeniden büyüyen gelir" },
          { id: "retention", label: "Kalan müşteriler" },
          { id: "efficiency", label: "Her hafta geri kazanılan saatler" },
          { id: "confidence", label: "Güvenebileceğim sistemler" },
        ],
      },
      timeline: {
        label: "Hareket ne zaman önemli?",
        options: [
          { id: "now", label: "Şimdi" },
          { id: "quarter", label: "Bu çeyrek" },
          { id: "exploring", label: "Hâlâ araştırıyorum" },
        ],
      },
      resources: {
        label: "Elinizde ne var?",
        options: [
          { id: "solo", label: "Çoğunlukla ben", detail: "Tek kurucu veya operatör" },
          { id: "some_help", label: "Biraz destek", detail: "Freelancer veya yarı zamanlı destek" },
          { id: "team", label: "Bir ekip", detail: "Uygulayabilen şirket içi kişiler" },
        ],
      },
    },
    back: "Geri",
    next: "Devam et",
    seeMap: "Haritamı göster",
    required: "Devam etmek için birini seçin.",
    resultKicker: "Multiplier Map'iniz",
    resultHeading: "Çarpan etkisi yaratan sonraki hamle.",
    rubricNote:
      "Yanıtlarınızdan şeffaf, deterministik kurallarla üretildi (rubrik {version}) — yapay zekâ hükmü yok, puanlama tiyatrosu yok. Bu, yargının yerine geçmeyen yapılandırılmış bir başlangıç noktasıdır.",
    pathLabel: "Durumunuz",
    paths: {
      launch: {
        title: "Hayata geçir",
        text: "Çalışan bir ürüne dönüşmesi gereken bir fikir. Risk, iş kanıtlanmadan çok fazla şey inşa etmek.",
      },
      accelerate: {
        title: "Hızlandır",
        text: "Ortada gerçek bir şey var — soru şu: hangi kısıt kalkınca rakamlar hareket eder?",
      },
      unblock: {
        title: "Sürtünmeyi kaldır",
        text: "Pahalı problem operasyonel: manuel iş ve kopuk sistemler her haftadan sessizce vergi alıyor.",
      },
    },
    offerLabel: "Önerilen giriş noktası",
    offers: {
      multiplier_sprint: {
        title: "Multiplier Sprint",
        text: "Tek bir yüksek kaldıraçlı kısıtı bulup ele alan odaklı bir çalışma — başlamanın en küçük ve dürüst yolu.",
      },
      build_partnership: {
        title: "Build Partnership",
        text: "Ürünün ve çevresindeki sistemlerin uçtan uca teslimi — işi kanıtlayan en küçük sürüm etrafında kapsamlandırılır.",
      },
      acceleration_partnership: {
        title: "Acceleration Partnership",
        text: "Ürün, dönüşüm, yaşam döngüsü ve güvenilirlikte süreklilik taşıyan iyileştirme — döngü döngü katlanır.",
      },
    },
    focusLabel: "Yetkinlik odağı",
    capabilities: {
      product_engineering: "Ürün Mühendisliği",
      automation_ai: "Otomasyon ve Yapay Zekâ",
      lifecycle_growth: "Yaşam Döngüsü ve Büyüme",
      security_reliability: "Güvenlik ve Güvenilirlik",
    },
    stepsLabel: "Sonraki adım haritanız",
    steps: {
      define_wedge: "Kamayı tanımlayın: ilk sürümün kanıtlaması gereken tek kullanıcı, problem ve sonuç.",
      scope_first_release: "En küçük güvenilir sürümü kapsamlandırın — ve bilinçli olarak neyin beklediğini adlandırın.",
      build_measure: "Ölçümü ilk günden içine örerek inşa edin, sonradan yamamayın.",
      prepare_operate: "İşletme tarafını hazırlayın: nasıl çalışır, neyin sahibi kim, veri ne diyor.",
      clarify_buyer: "Daha fazla kod yazmadan bunun kimin için olduğunu ve neye ödeme yapacaklarını netleştirin.",
      prototype_riskiest: "Önce en riskli varsayımın prototipini yapın — ucuz ve dürüst biçimde.",
      decide_build: "Kanıta göre inşa et / ayarla / dur kararını verin, sonra gerçek ilk sürümü kapsamlandırın.",
      instrument_funnel: "Huniyi uçtan uca ölçümleyin ki kısıt fikirlerde değil veride görünsün.",
      find_leverage: "En yüksek kaldıraçlı kısıtı bulun: düzeltmenin topladığı değil çarptığı yer.",
      ship_loops: "Ona karşı iyileştirme döngüleri yayınlayın — ürün, dönüşüm, yaşam döngüsü — küçük ve doğrulanmış adımlarla.",
      compound: "Kanıtı gözden geçirin, sıradaki kısıtı seçin ve döngülerin katlanmasına izin verin.",
      map_constraint: "Kısıtı hassas biçimde haritalayın: rakamlar tam olarak nerede ve neden duruyor.",
      one_leverage_move: "Ona karşı tek bir yüksek kaldıraçlı hamle yapın — doğrulanacak kadar küçük, önemli olacak kadar büyük.",
      measure_result: "Neyin değiştiğini ölçün, sonraki hamleyi sonuçlara göre belirleyin.",
      inventory_drag: "Sürtünmenin envanterini çıkarın: her manuel adım, devir ve geçici çözüm, haftalık maliyetiyle.",
      pick_one_system: "Düzeltilmesi en çok zamanı kurtaran veya en çok riski kaldıran tek sistemi seçin.",
      automate_verify: "Denetleyebileceğiniz kontrollerle otomatikleştirin — sonra saatlerin gerçekten geri geldiğini doğrulayın.",
    },
    notes: {
      sprint_first: "Hâlâ araştırma aşamasındasınız — yön kanıtlanana kadar sınırlı bir sprint uzun taahhütten iyidir.",
      resource_light: "Eller sınırlıyken harita, iş yükünü artıran değil azaltan hamleleri öne alır.",
      human_judgment: "Bu harita kural tabanlı bir rehberdir. Gerçek kapsam formdan değil, görüşmeden çıkar.",
    },
    actionsLabel: "Bu haritayla ne yapabilirsiniz",
    saveAction: "Portalıma kaydet",
    saveHint: "Saklayın, dönün, sonra karşılaştırın. Giriş altı haneli e-posta kodu ile — parola yok.",
    discussAction: "MaydaLabs ile görüşün",
    discussHint: "Haritayı bağlamınızla gönderin. Bir insan okur; hiçbir şey otomatik değildir.",
    restart: "Baştan başla",
    saved: "Harita portalınıza kaydedildi.",
    savedHint: "Portalınız altında her zaman bulabilirsiniz.",
    authIntro: "Bu haritayı kaydetmek için e-postanızı girin. Altı haneli bir kod göndeririz — parola yok, spam yok.",
    emailLabel: "E-posta",
    emailPlaceholder: "siz@sirket.com",
    sendCode: "Kodu gönder",
    codeSentTo: "Kod gönderildi:",
    codeLabel: "Altı haneli kod",
    codeHint: "Gelen kutunuzu kontrol edin ve kodu girin.",
    verifyAndSave: "Doğrula ve kaydet",
    changeEmail: "Farklı bir e-posta kullan",
    discussIntro:
      "Haritanız bu notla birlikte gider. Mehmet her gönderimi bizzat okur; yanıt e-postayla gelir.",
    nameLabel: "Adınız",
    companyLabel: "Şirket veya ürün (opsiyonel)",
    messageLabel: "Yardımcı olacak her şey (opsiyonel)",
    messageHint: "Bağlam, bağlantılar, kendi kelimelerinizle sürtünme — eklerseniz en az 24 karakter.",
    consentContact: "MaydaLabs bu bilgileri saklayabilir ve bu talep hakkında benimle iletişime geçebilir.",
    consentUpdates: "Bana ara sıra ürün ve geliştirme güncellemeleri gönderin (ücretsiz, her an iptal edilebilir).",
    submitDiscuss: "Haritayı ve notu gönder",
    discussDone: "Alındı. Haritanız ve notunuz ulaştı.",
    discussDoneHint:
      "Bir insan okuyup e-postayla yanıt verecek. Hiçbir şey otomatik nitelendirilmedi, gönderilmedi veya işaretlediğiniz dışında bir listeye eklenmedi.",
    errors: {
      invalid_email: "Geçerli bir e-posta adresi ekleyin.",
      rate_limited: "Çok fazla deneme. Birkaç dakika bekleyip tekrar deneyin.",
      send_failed: "Kod gönderilemedi. Az sonra tekrar deneyin.",
      invalid_code: "E-postadaki altı haneli kodu girin.",
      verify_failed: "Kod doğrulanamadı. Kontrol edin veya yeni kod isteyin.",
      invalid_answers: "Yanıtlar okunamadı. Haritayı baştan başlatın.",
      save_failed: "Kaydetme başarısız. Az sonra tekrar deneyin.",
      not_signed_in: "Bu haritayı kaydetmek için giriş yapın.",
      consent_required: "Göndermek için iletişim onayı gereklidir.",
      invalid: "İşaretli alanları kontrol edin.",
      name: "Adınızı ekleyin.",
      message: "En az 24 karakter ekleyin veya boş bırakın.",
    },
  },
  fr: {
    progressLabel: "Progression de la Multiplier Map",
    stepWord: "Question",
    questions: {
      stage: {
        label: "Où en est l’entreprise aujourd’hui ?",
        hint: "Une réponse approximative suffit — elle pose le cadre, pas le verdict.",
        options: [
          { id: "idea", label: "Idée", detail: "Rien n’est encore en ligne" },
          { id: "launched", label: "Lancée", detail: "En ligne, premiers usages" },
          { id: "growing", label: "En croissance", detail: "Vrais clients et revenus" },
          { id: "established", label: "Établie", detail: "En activité depuis des années" },
        ],
      },
      constraint: {
        label: "Qu’est-ce qui retient les choses en ce moment ?",
        hint: "Choisissez le plus proche.",
        options: [
          { id: "product_not_built", label: "Le produit n’existe pas encore", detail: "L’idée doit devenir du logiciel" },
          { id: "product_stuck", label: "Le produit est bloqué", detail: "En ligne, mais la progression a calé" },
          { id: "growth_flat", label: "La croissance est plate", detail: "Trafic, conversion ou rétention ne bougent pas" },
          { id: "operations_drag", label: "Les opérations mangent la semaine", detail: "Travail manuel, tableurs, outils déconnectés" },
          { id: "reliability_risk", label: "La fiabilité ou la sécurité m’inquiète", detail: "Incidents, fragilité, questions d’accès" },
          { id: "unclear", label: "Franchement, flou", detail: "Quelque chose cloche mais difficile à nommer" },
        ],
      },
      outcome: {
        label: "À quoi ressemblerait une victoire dans six mois ?",
        options: [
          { id: "launch", label: "Un produit lancé" },
          { id: "revenue_growth", label: "Un revenu qui repart" },
          { id: "retention", label: "Des clients qui restent" },
          { id: "efficiency", label: "Des heures récupérées chaque semaine" },
          { id: "confidence", label: "Des systèmes fiables" },
        ],
      },
      timeline: {
        label: "Quand le mouvement compte-t-il ?",
        options: [
          { id: "now", label: "Maintenant" },
          { id: "quarter", label: "Ce trimestre" },
          { id: "exploring", label: "Encore en exploration" },
        ],
      },
      resources: {
        label: "Avec quoi travaillez-vous ?",
        options: [
          { id: "solo", label: "Surtout moi", detail: "Fondateur ou opérateur solo" },
          { id: "some_help", label: "Un peu d’aide", detail: "Freelances ou support à temps partiel" },
          { id: "team", label: "Une équipe", detail: "Des personnes en interne qui exécutent" },
        ],
      },
    },
    back: "Retour",
    next: "Continuer",
    seeMap: "Voir ma carte",
    required: "Choisissez une réponse pour continuer.",
    resultKicker: "Votre Multiplier Map",
    resultHeading: "Le prochain mouvement qui multiplie.",
    rubricNote:
      "Générée à partir de vos réponses par des règles transparentes et déterministes (rubrique {version}) — pas de verdict d’IA, pas de théâtre de scoring. C’est un point de départ structuré, pas un substitut au jugement.",
    pathLabel: "Votre situation",
    paths: {
      launch: {
        title: "Lancer",
        text: "Une idée qui doit devenir un produit fonctionnel. Le risque : trop construire avant que le business soit prouvé.",
      },
      accelerate: {
        title: "Accélérer",
        text: "Quelque chose de réel tourne — la question est de savoir quelle contrainte, une fois levée, fait bouger les chiffres.",
      },
      unblock: {
        title: "Éliminer la friction",
        text: "Le problème coûteux est opérationnel : travail manuel et systèmes déconnectés qui taxent chaque semaine en silence.",
      },
    },
    offerLabel: "Point d’entrée suggéré",
    offers: {
      multiplier_sprint: {
        title: "Multiplier Sprint",
        text: "Un engagement ciblé pour identifier et traiter une contrainte à fort levier — la façon la plus petite et honnête de commencer.",
      },
      build_partnership: {
        title: "Build Partnership",
        text: "Livraison de bout en bout du produit et des systèmes autour — cadrée sur la plus petite version qui prouve le business.",
      },
      acceleration_partnership: {
        title: "Acceleration Partnership",
        text: "Amélioration continue du produit, de la conversion, du lifecycle et de la fiabilité — qui compose cycle après cycle.",
      },
    },
    focusLabel: "Capacités mobilisées",
    capabilities: {
      product_engineering: "Ingénierie produit",
      automation_ai: "Automatisation et IA",
      lifecycle_growth: "Lifecycle et croissance",
      security_reliability: "Sécurité et fiabilité",
    },
    stepsLabel: "Votre feuille de route",
    steps: {
      define_wedge: "Définir le coin d’entrée : l’utilisateur, le problème et le résultat que la première version doit prouver.",
      scope_first_release: "Cadrer la plus petite version crédible — et nommer ce qui attend délibérément.",
      build_measure: "La construire avec la mesure intégrée dès le premier jour, pas ajoutée après coup.",
      prepare_operate: "Préparer le côté opérationnel : comment ça tourne, qui possède quoi, ce que disent les données.",
      clarify_buyer: "Préciser pour qui c’est et ce qu’ils paieraient avant d’écrire plus de code.",
      prototype_riskiest: "Prototyper d’abord l’hypothèse la plus risquée — à bas coût et honnêtement.",
      decide_build: "Décider construire / ajuster / arrêter sur des preuves, puis cadrer la vraie première version.",
      instrument_funnel: "Instrumenter le funnel de bout en bout pour que la contrainte apparaisse dans les données, pas les opinions.",
      find_leverage: "Localiser la contrainte au plus fort levier : là où un correctif multiplie au lieu d’additionner.",
      ship_loops: "Livrer des boucles d’amélioration contre elle — produit, conversion, lifecycle — par petits pas vérifiés.",
      compound: "Passer les preuves en revue, choisir la contrainte suivante et laisser les cycles composer.",
      map_constraint: "Cartographier précisément la contrainte : où les chiffres calent vraiment, et pourquoi.",
      one_leverage_move: "Faire un mouvement à fort levier contre elle — assez petit pour être vérifié, assez grand pour compter.",
      measure_result: "Mesurer ce qui a changé, puis décider du mouvement suivant sur les résultats.",
      inventory_drag: "Inventorier la friction : chaque étape manuelle, passage de main et contournement, avec son coût hebdomadaire.",
      pick_one_system: "Choisir le système dont la correction libère le plus de temps ou retire le plus de risque.",
      automate_verify: "L’automatiser avec des contrôles inspectables — puis vérifier que les heures reviennent vraiment.",
    },
    notes: {
      sprint_first: "Vous explorez encore — un sprint borné vaut mieux qu’un long engagement tant que la direction n’est pas prouvée.",
      resource_light: "Avec des mains limitées, la carte privilégie les mouvements qui réduisent la charge au lieu de l’augmenter.",
      human_judgment: "Cette carte est un guide fondé sur des règles. Le vrai périmètre sort d’une conversation, pas d’un formulaire.",
    },
    actionsLabel: "Ce que vous pouvez faire de cette carte",
    saveAction: "Enregistrer dans mon portail",
    saveHint: "Gardez-la, revenez-y, comparez plus tard. Connexion par code e-mail à six chiffres — sans mot de passe.",
    discussAction: "En discuter avec MaydaLabs",
    discussHint: "Envoyez la carte avec votre contexte. Un humain la lit ; rien n’est automatisé.",
    restart: "Recommencer",
    saved: "Carte enregistrée dans votre portail.",
    savedHint: "Vous la retrouverez à tout moment dans Votre portail.",
    authIntro: "Entrez votre e-mail pour enregistrer cette carte. Nous envoyons un code à six chiffres — sans mot de passe, sans spam.",
    emailLabel: "E-mail",
    emailPlaceholder: "vous@entreprise.com",
    sendCode: "Envoyer le code",
    codeSentTo: "Code envoyé à",
    codeLabel: "Code à six chiffres",
    codeHint: "Vérifiez votre boîte de réception et saisissez le code.",
    verifyAndSave: "Vérifier et enregistrer",
    changeEmail: "Utiliser un autre e-mail",
    discussIntro:
      "Votre carte accompagne cette note. Mehmet lit chaque envoi personnellement ; la réponse arrive par e-mail.",
    nameLabel: "Votre nom",
    companyLabel: "Entreprise ou produit (optionnel)",
    messageLabel: "Tout ce qui peut aider (optionnel)",
    messageHint: "Contexte, liens, la friction avec vos mots — au moins 24 caractères si vous en ajoutez.",
    consentContact: "MaydaLabs peut conserver ces informations et me contacter au sujet de cette demande.",
    consentUpdates: "Envoyez-moi des nouvelles occasionnelles des produits et des builds (gratuit, révocable à tout moment).",
    submitDiscuss: "Envoyer la carte et la note",
    discussDone: "Bien reçu. Votre carte et votre note sont arrivées.",
    discussDoneHint:
      "Un humain la lira et répondra par e-mail. Rien n’a été auto-qualifié, auto-envoyé ni ajouté à une liste au-delà de ce que vous avez coché.",
    errors: {
      invalid_email: "Ajoutez une adresse e-mail valide.",
      rate_limited: "Trop de tentatives. Attendez quelques minutes puis réessayez.",
      send_failed: "Le code n’a pas pu être envoyé. Réessayez dans un instant.",
      invalid_code: "Saisissez le code à six chiffres reçu par e-mail.",
      verify_failed: "Ce code n’a pas été vérifié. Vérifiez-le ou demandez-en un nouveau.",
      invalid_answers: "Les réponses n’ont pas pu être lues. Recommencez la carte.",
      save_failed: "L’enregistrement a échoué. Réessayez dans un instant.",
      not_signed_in: "Connectez-vous pour enregistrer cette carte.",
      consent_required: "Le consentement de contact est requis pour envoyer.",
      invalid: "Vérifiez les champs signalés.",
      name: "Ajoutez votre nom.",
      message: "Ajoutez au moins 24 caractères ou laissez vide.",
    },
  },
};
