"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { getIntroCallUrl } from "@/lib/marketingLinks";
import { trackOsEvent } from "@/lib/osAnalytics";
import { isTerminalBriefDraft, TERMINAL_BRIEF_SESSION_KEY, type TerminalBriefKind } from "@/lib/terminalBrief";

type Option = { id: string; label: string; detail?: string };
type Step = 1 | 2 | 3;

type ConsoleCopy = {
  label: string; kicker: string; heading: [string, string]; intro: string; progressLabel: string; steps: [string, string, string]; stepCount: string;
  moveLabel: string; moveHint: string; moves: Option[]; stageLabel: string; stageHint: string; stages: Option[];
  ideaLabel: string; ideaHint: string; ideaPlaceholder: string; timelineLabel: string; timelines: Option[]; contextLabel: string; contextPlaceholder: string;
  nameLabel: string; namePlaceholder: string; emailLabel: string; emailPlaceholder: string; companyLabel: string; companyPlaceholder: string; replyHint: string;
  back: string; continue: string; prepare: string; readyKicker: string; readyHeading: string; readyIntro: string; bookAction: string; mailAction: string;
  copyAction: string; copied: string; copyFailed: string; calendarOpened: string; emailOpened: string; privacy: string; imported: string; briefTitle: string;
  secureDraft: string; liveBrief: string; documentHeading: string;
  fields: { building: string; stage: string; move: string; timeline: string; context: string; name: string; email: string; company: string };
  errors: { move: string; stage: string; idea: string; timeline: string; name: string; email: string };
  mailSubject: string;
};

const COPY: Record<Locale, ConsoleCopy> = {
  en: {
    label: "Project console",
    kicker: "Project console / Browser-local draft",
    heading: ["Give me the signal.", "We’ll shape the work."],
    intro: "Three short steps turn a rough problem into enough context for a useful first conversation. No polished brief required.",
    progressLabel: "Project brief progress", steps: ["Direction", "Context", "Reply"], stepCount: "Step",
    moveLabel: "What needs to move?", moveHint: "Choose the closest path. It does not lock the scope.",
    moves: [
      { id: "product", label: "Ship a product", detail: "App, marketplace, SaaS, internal system" },
      { id: "commerce", label: "Rebuild a system", detail: "Product, storefront, or operations layer" },
      { id: "growth", label: "Build a growth engine", detail: "Measurement, conversion, lifecycle, SEO" },
      { id: "automation", label: "Make AI useful", detail: "Controlled research or operations workflow" },
      { id: "unsure", label: "Not sure yet", detail: "Start with the friction; we’ll find the category" },
    ],
    stageLabel: "Where is it now?", stageHint: "A rough signal is enough.",
    stages: [{ id: "idea", label: "Idea" }, { id: "prototype", label: "Prototype" }, { id: "live", label: "Live product" }, { id: "rebuild", label: "Rebuild" }],
    ideaLabel: "Describe the problem in your words", ideaHint: "What is stuck, who feels it, and what would a useful first outcome change?",
    ideaPlaceholder: "The rough version is useful. Start wherever the friction is clearest…", timelineLabel: "When does movement matter?",
    timelines: [{ id: "asap", label: "As soon as possible" }, { id: "quarter", label: "This quarter" }, { id: "exploring", label: "Still exploring" }],
    contextLabel: "A link or useful context (optional)", contextPlaceholder: "Current site, product, repo, deck, stack…",
    nameLabel: "Your name", namePlaceholder: "Name", emailLabel: "Work email", emailPlaceholder: "you@company.com",
    companyLabel: "Company or product (optional)", companyPlaceholder: "Company, product, or team",
    replyHint: "These details only prefill the channel you choose next. This page does not submit them.",
    back: "Back", continue: "Continue", prepare: "Prepare my next step", readyKicker: "Brief ready / Nothing sent", readyHeading: "Choose the channel.",
    readyIntro: "Open the calendar with this context attached, prepare an email, or copy the brief for wherever you work.",
    bookAction: "Book the 30-minute call", mailAction: "Open prepared email", copyAction: "Copy brief", copied: "Brief copied",
    copyFailed: "Clipboard unavailable. The preview remains selectable.", calendarOpened: "Calendar opened in a new tab.", emailOpened: "Prepared email opened.",
    privacy: "Your draft stays in this browser until you deliberately open Calendly, your email app, or copy it.",
    imported: "Imported from your MaydaOS session. Review it before choosing a channel.", briefTitle: "project-brief.txt", secureDraft: "SECURE DRAFT · LOCAL", liveBrief: "LIVE BRIEF", documentHeading: "MAYDALABS PROJECT BRIEF",
    fields: { building: "PROBLEM", stage: "STAGE", move: "MOVE", timeline: "TIMELINE", context: "CONTEXT", name: "NAME", email: "EMAIL", company: "COMPANY" },
    errors: { move: "Choose the closest direction.", stage: "Choose the current stage.", idea: "Add at least 24 characters so the problem has enough signal.", timeline: "Choose the closest timeline.", name: "Add your name.", email: "Add a valid email address." },
    mailSubject: "MaydaLabs project brief",
  },
  tr: {
    label: "Proje konsolu", kicker: "Proje konsolu / Tarayıcıda kalan taslak", heading: ["Sinyali verin.", "İşi birlikte şekillendirelim."],
    intro: "Üç kısa adım, ham bir problemi faydalı ilk görüşme için yeterli bağlama dönüştürür. Kusursuz bir brief gerekmez.",
    progressLabel: "Proje brief'i ilerlemesi", steps: ["Yön", "Bağlam", "Yanıt"], stepCount: "Adım",
    moveLabel: "Neyin ilerlemesi gerekiyor?", moveHint: "En yakın yolu seçin. Bu seçim kapsamı sabitlemez.",
    moves: [
      { id: "product", label: "Bir ürün yayınlayın", detail: "Uygulama, pazar yeri, SaaS, iç sistem" },
      { id: "commerce", label: "Bir sistemi yeniden kurun", detail: "Ürün, mağaza veya operasyon katmanı" },
      { id: "growth", label: "Bir büyüme motoru kurun", detail: "Ölçüm, dönüşüm, yaşam döngüsü, SEO" },
      { id: "automation", label: "Yapay zekâyı faydalı kılın", detail: "Kontrollü araştırma veya operasyon akışı" },
      { id: "unsure", label: "Henüz emin değilim", detail: "Sürtünmeyle başlayın; kategoriyi birlikte buluruz" },
    ],
    stageLabel: "Şu anda hangi aşamada?", stageHint: "Yaklaşık bir işaret yeterli.",
    stages: [{ id: "idea", label: "Fikir" }, { id: "prototype", label: "Prototip" }, { id: "live", label: "Canlı ürün" }, { id: "rebuild", label: "Yeniden geliştirme" }],
    ideaLabel: "Problemi kendi kelimelerinizle anlatın", ideaHint: "Neresi tıkandı, bunu kim hissediyor ve faydalı ilk sonuç neyi değiştirirdi?",
    ideaPlaceholder: "Ham hali değerlidir. Sürtünmenin en net olduğu yerden başlayın…", timelineLabel: "Hareket ne zaman önemli?",
    timelines: [{ id: "asap", label: "En kısa sürede" }, { id: "quarter", label: "Bu çeyrek" }, { id: "exploring", label: "Hâlâ araştırıyorum" }],
    contextLabel: "Bağlantı veya faydalı bağlam (opsiyonel)", contextPlaceholder: "Mevcut site, ürün, repo, sunum, stack…",
    nameLabel: "Adınız", namePlaceholder: "Ad", emailLabel: "İş e-postası", emailPlaceholder: "siz@sirket.com",
    companyLabel: "Şirket veya ürün (opsiyonel)", companyPlaceholder: "Şirket, ürün veya ekip",
    replyHint: "Bu bilgiler yalnızca sıradaki seçtiğiniz kanalı önceden doldurur. Bu sayfa onları göndermez.",
    back: "Geri", continue: "Devam et", prepare: "Sonraki adımımı hazırla", readyKicker: "Brief hazır / Hiçbir şey gönderilmedi", readyHeading: "Kanalı seçin.",
    readyIntro: "Bu bağlamı ekleyerek takvimi açın, hazırlanmış bir e-posta oluşturun veya brief'i çalışma alanınıza kopyalayın.",
    bookAction: "30 dakikalık görüşmeyi ayarla", mailAction: "Hazır e-postayı aç", copyAction: "Brief'i kopyala", copied: "Brief kopyalandı",
    copyFailed: "Pano kullanılamıyor. Önizleme seçilebilir durumda.", calendarOpened: "Takvim yeni sekmede açıldı.", emailOpened: "Hazırlanmış e-posta açıldı.",
    privacy: "Taslağınız siz bilerek Calendly'yi, e-posta uygulamanızı açana veya kopyalayana kadar bu tarayıcıda kalır.",
    imported: "MaydaOS oturumunuzdan aktarıldı. Bir kanal seçmeden önce inceleyin.", briefTitle: "proje-briefi.txt", secureDraft: "GÜVENLİ TASLAK · YEREL", liveBrief: "CANLI BRIEF", documentHeading: "MAYDALABS PROJE BRIEF'İ",
    fields: { building: "PROBLEM", stage: "AŞAMA", move: "HAMLE", timeline: "ZAMAN", context: "BAĞLAM", name: "AD", email: "E-POSTA", company: "ŞİRKET" },
    errors: { move: "En yakın yönü seçin.", stage: "Mevcut aşamayı seçin.", idea: "Problemin yeterli sinyal taşıması için en az 24 karakter ekleyin.", timeline: "En yakın zamanlamayı seçin.", name: "Adınızı ekleyin.", email: "Geçerli bir e-posta adresi ekleyin." },
    mailSubject: "MaydaLabs proje brief'i",
  },
  fr: {
    label: "Console projet", kicker: "Console projet / Brouillon local au navigateur", heading: ["Donnez le signal.", "Nous structurerons le travail."],
    intro: "Trois étapes courtes transforment un problème brut en contexte suffisant pour un premier échange utile. Aucun brief parfait requis.",
    progressLabel: "Progression du brief projet", steps: ["Direction", "Contexte", "Réponse"], stepCount: "Étape",
    moveLabel: "Que faut-il faire avancer ?", moveHint: "Choisissez le parcours le plus proche. Il ne fige pas le périmètre.",
    moves: [
      { id: "product", label: "Livrer un produit", detail: "Application, marketplace, SaaS, outil interne" },
      { id: "commerce", label: "Reconstruire un système", detail: "Produit, boutique ou couche opérationnelle" },
      { id: "growth", label: "Créer un moteur de croissance", detail: "Mesure, conversion, cycle de vie, SEO" },
      { id: "automation", label: "Rendre l’IA utile", detail: "Workflow de recherche ou d’opérations contrôlé" },
      { id: "unsure", label: "Pas encore sûr", detail: "Partez de la friction ; nous trouverons la catégorie" },
    ],
    stageLabel: "Où en êtes-vous ?", stageHint: "Un repère approximatif suffit.",
    stages: [{ id: "idea", label: "Idée" }, { id: "prototype", label: "Prototype" }, { id: "live", label: "Produit en ligne" }, { id: "rebuild", label: "Refonte" }],
    ideaLabel: "Décrivez le problème avec vos mots", ideaHint: "Qu’est-ce qui bloque, qui le ressent et que changerait un premier résultat utile ?",
    ideaPlaceholder: "La version brute est utile. Commencez là où la friction est la plus claire…", timelineLabel: "Quand le mouvement compte-t-il ?",
    timelines: [{ id: "asap", label: "Dès que possible" }, { id: "quarter", label: "Ce trimestre" }, { id: "exploring", label: "Encore en exploration" }],
    contextLabel: "Lien ou contexte utile (optionnel)", contextPlaceholder: "Site, produit, repo, deck, stack…",
    nameLabel: "Votre nom", namePlaceholder: "Nom", emailLabel: "E-mail professionnel", emailPlaceholder: "vous@entreprise.com",
    companyLabel: "Entreprise ou produit (optionnel)", companyPlaceholder: "Entreprise, produit ou équipe",
    replyHint: "Ces informations préremplissent uniquement le canal choisi ensuite. Cette page ne les envoie pas.",
    back: "Retour", continue: "Continuer", prepare: "Préparer la prochaine étape", readyKicker: "Brief prêt / Rien n’est envoyé", readyHeading: "Choisissez le canal.",
    readyIntro: "Ouvrez l’agenda avec ce contexte, préparez un e-mail ou copiez le brief dans votre espace de travail.",
    bookAction: "Réserver l’échange de 30 minutes", mailAction: "Ouvrir l’e-mail préparé", copyAction: "Copier le brief", copied: "Brief copié",
    copyFailed: "Presse-papiers indisponible. L’aperçu reste sélectionnable.", calendarOpened: "Agenda ouvert dans un nouvel onglet.", emailOpened: "E-mail préparé ouvert.",
    privacy: "Votre brouillon reste dans ce navigateur jusqu’à ce que vous ouvriez volontairement Calendly, votre messagerie ou le copiiez.",
    imported: "Importé depuis votre session MaydaOS. Relisez-le avant de choisir un canal.", briefTitle: "brief-projet.txt", secureDraft: "BROUILLON SÉCURISÉ · LOCAL", liveBrief: "BRIEF EN DIRECT", documentHeading: "BRIEF PROJET MAYDALABS",
    fields: { building: "PROBLÈME", stage: "STADE", move: "MOUVEMENT", timeline: "DÉLAI", context: "CONTEXTE", name: "NOM", email: "E-MAIL", company: "ENTREPRISE" },
    errors: { move: "Choisissez la direction la plus proche.", stage: "Choisissez le stade actuel.", idea: "Ajoutez au moins 24 caractères pour donner assez de signal au problème.", timeline: "Choisissez le délai le plus proche.", name: "Ajoutez votre nom.", email: "Ajoutez une adresse e-mail valide." },
    mailSubject: "Brief projet MaydaLabs",
  },
};

function labelOf(options: Option[], id: string | null) {
  return options.find((option) => option.id === id)?.label ?? "—";
}

function ChoiceGroup({ label, hint, options, value, onPick, cards = false, error }: { label: string; hint?: string; options: Option[]; value: string | null; onPick: (id: string) => void; cards?: boolean; error?: string | null }) {
  return (
    <fieldset className={`project-console-field ${cards ? "is-cards" : ""}`}>
      <legend>{label}</legend>
      {hint ? <p>{hint}</p> : null}
      <div className="project-console-choices">
        {options.map((option, index) => (
          <button key={option.id} type="button" aria-pressed={value === option.id} className={value === option.id ? "is-selected" : ""} onClick={() => onPick(option.id)}>
            {cards ? <span>{String(index + 1).padStart(2, "0")}</span> : null}<strong>{option.label}</strong>{option.detail ? <small>{option.detail}</small> : null}{cards ? <i aria-hidden="true">↘</i> : null}
          </button>
        ))}
      </div>
      {error ? <p className="project-console-error" role="alert">{error}</p> : null}
    </fieldset>
  );
}

export function BriefComposer({ locale, initialMove = null }: { locale: Locale; initialMove?: string | null }) {
  const copy = COPY[locale];
  const validInitialMove = copy.moves.some((option) => option.id === initialMove) ? initialMove : null;
  const [step, setStep] = useState<Step>(1);
  const [move, setMove] = useState<string | null>(validInitialMove);
  const [stage, setStage] = useState<string | null>(null);
  const [idea, setIdea] = useState("");
  const [timeline, setTimeline] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [ready, setReady] = useState(false);
  const [actionStatus, setActionStatus] = useState("");
  const [importedKind, setImportedKind] = useState<TerminalBriefKind | null>(null);
  const startedRef = useRef(false);
  const movedRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { trackOsEvent("project_console_impression", { locale, source: validInitialMove ? "need_parameter" : "direct" }); }, [locale, validInitialMove]);

  useEffect(() => {
    let frame = 0;
    try {
      const raw = window.sessionStorage.getItem(TERMINAL_BRIEF_SESSION_KEY);
      if (!raw) return;
      const candidate: unknown = JSON.parse(raw);
      if (!isTerminalBriefDraft(candidate)) { window.sessionStorage.removeItem(TERMINAL_BRIEF_SESSION_KEY); return; }
      frame = window.requestAnimationFrame(() => {
        window.sessionStorage.removeItem(TERMINAL_BRIEF_SESSION_KEY);
        setIdea(candidate.summary.slice(0, 600));
        setImportedKind(candidate.kind);
        trackOsEvent("brief_imported", { kind: candidate.kind });
      });
    } catch { /* A blocked or malformed session handoff is ignored. */ }
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!movedRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      headingRef.current?.focus({ preventScroll: true });
      headingRef.current?.scrollIntoView({ block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [step]);

  const markStarted = (field: string) => {
    setShowErrors(false); setReady(false); setActionStatus("");
    if (startedRef.current) return;
    startedRef.current = true;
    trackOsEvent("project_console_started", { field, locale });
  };
  const select = (setter: (value: string) => void, value: string, field: string) => { markStarted(field); setter(value); };
  const stepOneValid = Boolean(move && stage);
  const stepTwoValid = idea.trim().length >= 24 && Boolean(timeline);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const identityValid = name.trim().length >= 2 && emailValid;

  const goToStep = (nextStep: Step) => { movedRef.current = true; setStep(nextStep); setShowErrors(false); setReady(false); setActionStatus(""); };
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setShowErrors(true);
    if (step === 1) {
      if (!stepOneValid) return;
      trackOsEvent("project_console_step_complete", { step: 1, move: move ?? "unset", stage: stage ?? "unset" }); goToStep(2); return;
    }
    if (step === 2) {
      if (!stepTwoValid) return;
      trackOsEvent("project_console_step_complete", { step: 2, timeline: timeline ?? "unset", has_context: Boolean(context.trim()) }); goToStep(3); return;
    }
    if (!identityValid) return;
    setReady(true); setShowErrors(false);
    trackOsEvent("project_console_complete", { move: move ?? "unset", stage: stage ?? "unset", timeline: timeline ?? "unset", has_company: Boolean(company.trim()), has_context: Boolean(context.trim()) });
  };

  const brief = useMemo(() => {
    const lines = [copy.documentHeading, "────────────────────────", `${copy.fields.building.padEnd(11)} ${idea.trim() || "—"}`, `${copy.fields.stage.padEnd(11)} ${labelOf(copy.stages, stage)}`, `${copy.fields.move.padEnd(11)} ${labelOf(copy.moves, move)}`, `${copy.fields.timeline.padEnd(11)} ${labelOf(copy.timelines, timeline)}`];
    if (context.trim()) lines.push(`${copy.fields.context.padEnd(11)} ${context.trim()}`);
    lines.push("", `${copy.fields.name.padEnd(11)} ${name.trim() || "—"}`, `${copy.fields.email.padEnd(11)} ${email.trim() || "—"}`);
    if (company.trim()) lines.push(`${copy.fields.company.padEnd(11)} ${company.trim()}`);
    return lines.join("\n");
  }, [company, context, copy, email, idea, move, name, stage, timeline]);

  const markers = { move: move ?? "unset", stage: stage ?? "unset", timeline: timeline ?? "unset" };
  const bookUrl = getIntroCallUrl("project_console", { name: name.trim(), email: email.trim(), a1: brief.slice(0, 900) });
  const mailUrl = `mailto:info@maydalabs.com?subject=${encodeURIComponent(copy.mailSubject)}&body=${encodeURIComponent(brief)}`;
  const trackAction = (action: "book" | "email") => {
    trackOsEvent("project_console_action", { action, ...markers }); trackOsEvent("brief_composed", { action, ...markers });
    setActionStatus(action === "book" ? copy.calendarOpened : copy.emailOpened);
  };
  const copyBrief = async () => {
    trackOsEvent("project_console_action", { action: "copy", ...markers }); trackOsEvent("brief_composed", { action: "copy", ...markers });
    try { await navigator.clipboard.writeText(brief); setActionStatus(copy.copied); } catch { setActionStatus(copy.copyFailed); }
  };

  return (
    <section className="project-console" id="brief" aria-label={copy.label}>
      <header className="project-console-bar"><div aria-hidden="true"><i /><i /><i /></div><span>~/start/project-console</span><b>{copy.secureDraft}</b></header>
      <div className="project-console-progress">
        <div><p>{copy.kicker}</p><small>{copy.stepCount} {step} / 3</small></div>
        <ol aria-label={copy.progressLabel}>
          {copy.steps.map((label, index) => {
            const number = (index + 1) as Step;
            return <li key={label} className={number === step ? "is-current" : number < step ? "is-complete" : ""} aria-current={number === step ? "step" : undefined}><span>0{number}</span>{label}</li>;
          })}
        </ol>
      </div>
      <div className="project-console-body">
        <form className="project-console-form" onSubmit={handleSubmit} noValidate>
          <div className="project-console-step-heading">
            <p>0{step} / {copy.steps[step - 1].toLocaleUpperCase(locale)}</p>
            <h2 ref={headingRef} tabIndex={-1}>{step === 1 ? copy.heading[0] : step === 2 ? copy.heading[1] : copy.prepare}</h2>
            <small>{step === 1 ? copy.intro : step === 2 ? copy.ideaHint : copy.replyHint}</small>
          </div>
          {importedKind && step === 1 ? <p className="project-console-imported" role="status"><span aria-hidden="true">↳</span>{copy.imported}</p> : null}
          {step === 1 ? <>
            <ChoiceGroup label={copy.moveLabel} hint={copy.moveHint} options={copy.moves} value={move} cards onPick={(value) => select(setMove, value, "move")} error={showErrors && !move ? copy.errors.move : null} />
            <ChoiceGroup label={copy.stageLabel} hint={copy.stageHint} options={copy.stages} value={stage} onPick={(value) => select(setStage, value, "stage")} error={showErrors && !stage ? copy.errors.stage : null} />
          </> : null}
          {step === 2 ? <>
            <label className="project-console-input is-large">
              <span>{copy.ideaLabel}</span><small>{copy.ideaHint}</small>
              <textarea value={idea} onChange={(event) => { markStarted("problem"); setIdea(event.target.value); }} placeholder={copy.ideaPlaceholder} rows={5} maxLength={600} aria-invalid={showErrors && idea.trim().length < 24 ? "true" : undefined} />
              <b>{idea.length} / 600</b>{showErrors && idea.trim().length < 24 ? <em role="alert">{copy.errors.idea}</em> : null}
            </label>
            <ChoiceGroup label={copy.timelineLabel} options={copy.timelines} value={timeline} onPick={(value) => select(setTimeline, value, "timeline")} error={showErrors && !timeline ? copy.errors.timeline : null} />
            <label className="project-console-input"><span>{copy.contextLabel}</span><input type="text" value={context} onChange={(event) => { markStarted("context"); setContext(event.target.value); }} placeholder={copy.contextPlaceholder} maxLength={240} /></label>
          </> : null}
          {step === 3 ? <>
            <div className="project-console-identity">
              <label className="project-console-input"><span>{copy.nameLabel}</span><input type="text" autoComplete="name" value={name} onChange={(event) => { markStarted("name"); setName(event.target.value); }} placeholder={copy.namePlaceholder} aria-invalid={showErrors && name.trim().length < 2 ? "true" : undefined} />{showErrors && name.trim().length < 2 ? <em role="alert">{copy.errors.name}</em> : null}</label>
              <label className="project-console-input"><span>{copy.emailLabel}</span><input type="email" inputMode="email" autoComplete="email" value={email} onChange={(event) => { markStarted("email"); setEmail(event.target.value); }} placeholder={copy.emailPlaceholder} aria-invalid={showErrors && !emailValid ? "true" : undefined} />{showErrors && !emailValid ? <em role="alert">{copy.errors.email}</em> : null}</label>
            </div>
            <label className="project-console-input"><span>{copy.companyLabel}</span><input type="text" autoComplete="organization" value={company} onChange={(event) => { markStarted("company"); setCompany(event.target.value); }} placeholder={copy.companyPlaceholder} maxLength={120} /></label>
            {ready ? <div className="project-console-ready" role="status">
              <p>{copy.readyKicker}</p><h3>{copy.readyHeading}</h3><small>{copy.readyIntro}</small>
              <div><a href={bookUrl} target="_blank" rel="noopener noreferrer" className="project-console-primary" onClick={() => trackAction("book")}>{copy.bookAction}<span aria-hidden="true">↗</span></a><a href={mailUrl} onClick={() => trackAction("email")}>{copy.mailAction}<span aria-hidden="true">→</span></a><button type="button" onClick={copyBrief}>{copy.copyAction}<span aria-hidden="true">□</span></button></div>
            </div> : null}
          </> : null}
          <div className="project-console-navigation">{step > 1 ? <button type="button" onClick={() => goToStep((step - 1) as Step)}>{copy.back}</button> : <span />}{!ready ? <button type="submit" className="is-next">{step < 3 ? copy.continue : copy.prepare}<span aria-hidden="true">→</span></button> : null}</div>
        </form>
        <aside className="project-console-preview" aria-label={copy.briefTitle}>
          <div><span>{copy.liveBrief}</span><i aria-hidden="true" /></div><pre>{brief}</pre><p><span aria-hidden="true">●</span>{copy.privacy}</p>
          <div className="project-console-preview-actions"><button type="button" onClick={() => goToStep(1)}>01 · {copy.steps[0]}</button><button type="button" onClick={() => step > 1 && goToStep(2)} disabled={step < 2}>02 · {copy.steps[1]}</button><button type="button" onClick={() => step > 2 && goToStep(3)} disabled={step < 3}>03 · {copy.steps[2]}</button></div>
          {actionStatus ? <small className="project-console-status" role="status">{actionStatus}</small> : null}
        </aside>
      </div>
    </section>
  );
}
