"use client";

import { useId, useRef, useState, type CSSProperties, type FormEvent } from "react";
import type { Locale } from "@/lib/i18n";
import type { ProposalPayload, KnowledgeDuration, KnowledgeScope } from "@/lib/osReviewBoundary";
import type { DurableProposal, DurableTurn } from "@/lib/osReviewTypes";
import { ConfirmedReviewRejection, isReviewGuardReason, type ReviewGuardReason } from "@/lib/osReviewGuard";

/* A suggestion is not a saved work item or company knowledge. The server owns
 * identity, authorisation, revision checks and the durable receipt. This view
 * sends only the exact revision the person saw, never retries a mutation, and
 * does not interpret a network failure as proof that nothing was saved. */

const COPY = {
  en: {
    heading: "Review before saving", work: "Work suggestion", knowledge: "Company knowledge suggestion",
    intro: "Each suggestion needs its own review. Saving does not approve, send or publish anything.",
    proposed: "Not saved", saved: "Saved", dismissed: "Dismissed", model: "Model-generated suggestion · not independently verified",
    title: "Title", body: "Draft", statement: "Statement", lane: "Work area", kind: "Type", outward: "Possible later action (not done here)", none: "None specified",
    scope: "Applies to", scopeLabel: "Company, project or customer name", company: "Company", project: "Project", customer: "Customer",
    duration: "Valid until", until_changed: "You change or retire it", until_date: "A specific date (UTC)", date: "Last valid date (UTC)",
    fact: "Fact", preference: "Preference", constraint: "Constraint", person: "Person", decision: "Decision",
    sources: "Source excerpts", sourceText: "Read captured source", sourceRevision: "Source revision", founder: "Founder’s message", record: "Existing record", quoted: "Quoted material", modelSource: "Model-generated material",
    attribution: "These excerpts show where the suggestion came from. They do not verify that it is true.",
    confirm: "I confirm this exact statement, scope and validity belongs in company knowledge. This is my approval, not independent verification.",
    assertionFixed: "This is the exact company statement from your request. To change it, start a new request with the statement you stand behind.",
    legacy: "This earlier suggestion has no captured request choices. You can read or dismiss it. To save it, start a new request with an explicit format or company statement.",
    missing: "Review details are incomplete. Edit the suggestion before saving.",
    saveWork: "Save to Work", saveKnowledge: "Add to company knowledge", edit: "Edit suggestion", dismiss: "Dismiss", cancel: "Cancel editing", revise: "Update preview", reviewing: "Updating…", saving: "Saving…", dismissing: "Dismissing…",
    editHint: "Updating the preview does not save it to Work or company knowledge. Review the updated version before saving.",
    workReceipt: "Saved to Work as a draft. It has not been approved, sent or published.",
    knowledgeReceipt: "Added to company knowledge with your confirmation. The source is retained; this is not independent verification.",
    dismissedReceipt: "Dismissed. No work item or company knowledge was created by this suggestion.",
    receipt: "Record", uncertain: "We cannot confirm the result of this change. Reload to check the saved state before trying again. Do not create a replacement suggestion.",
    reload: "Reload and check saved state", revision: "Version",
    rejected: {
      duplicate_work: "This attempt was refused: an open Work item already contains this exact draft. Check Work; do not create another copy.",
      calendar_date: "This attempt was refused: a date is invalid or its weekday does not match. Check the source and edit the preview before saving.",
      work_kind: "This attempt was refused: this draft uses an unsupported type. Dismiss it and request a new draft with the intended format.",
      work_action: "This attempt was refused: the draft type and its later action disagree. Dismiss it and request the intended format. Saving never sends or publishes.",
      intent_required: "This request did not capture your choices. Dismiss the suggestion and start a new request with an explicit format or company statement.",
      draft_format: "This draft does not match your chosen format. Dismiss it and ask again with the format you want.",
      knowledge_assertion: "This suggestion does not match the exact company statement you provided. Dismiss it and enter the statement you stand behind in a new request.",
      knowledge_approval: "Company knowledge needs your explicit approval of the exact statement, scope and validity. Review it and confirm the checkbox before saving.",
    },
  },
  tr: {
    heading: "Kaydetmeden önce inceleyin", work: "İş önerisi", knowledge: "Şirket bilgisi önerisi",
    intro: "Her öneri ayrı ayrı incelenir. Kaydetmek; onaylamak, göndermek veya yayımlamak değildir.",
    proposed: "Kaydedilmedi", saved: "Kaydedildi", dismissed: "Reddedildi", model: "Modelin ürettiği öneri · bağımsız olarak doğrulanmadı",
    title: "Başlık", body: "Taslak", statement: "Bilgi", lane: "İş alanı", kind: "Tür", outward: "Olası sonraki işlem (burada yapılmaz)", none: "Belirtilmedi",
    scope: "Geçerli olduğu kapsam", scopeLabel: "Şirket, proje veya müşteri adı", company: "Şirket", project: "Proje", customer: "Müşteri",
    duration: "Geçerlilik süresi", until_changed: "Siz değiştirene veya kaldırana kadar", until_date: "Belirli bir tarih (UTC)", date: "Son geçerli tarih (UTC)",
    fact: "Olgu", preference: "Tercih", constraint: "Kısıt", person: "Kişi", decision: "Karar",
    sources: "Kaynak alıntıları", sourceText: "Kaydedilen kaynağı oku", sourceRevision: "Kaynak sürümü", founder: "Kurucu beyanı", record: "Mevcut kayıt", quoted: "Alıntılanan içerik", modelSource: "Modelin ürettiği içerik",
    attribution: "Bu alıntılar önerinin nereden geldiğini gösterir. Bilginin doğru olduğunu doğrulamaz.",
    confirm: "Bu ifadenin aynen, belirtilen kapsam ve geçerlilikle şirket bilgisine eklenmesini onaylıyorum. Bu benim onayımdır; bağımsız doğrulama değildir.",
    assertionFixed: "Bu, isteğinizde yazdığınız şirket bilgisinin aynısıdır. Değiştirmek için arkasında durduğunuz ifadeyle yeni bir istek başlatın.",
    legacy: "Bu eski öneride istek seçimleri kayıtlı değil. Okuyabilir veya reddedebilirsiniz. Kaydetmek için açık bir biçim veya şirket bilgisiyle yeni istek başlatın.",
    missing: "İnceleme ayrıntıları eksik. Kaydetmeden önce öneriyi düzenleyin.",
    saveWork: "İşlere kaydet", saveKnowledge: "Şirket bilgisine ekle", edit: "Öneriyi düzenle", dismiss: "Reddet", cancel: "Düzenlemekten vazgeç", revise: "Önizlemeyi güncelle", reviewing: "Güncelleniyor…", saving: "Kaydediliyor…", dismissing: "Reddediliyor…",
    editHint: "Önizlemeyi güncellemek, İşlere veya şirket bilgisine kaydetmez. Kaydetmeden önce yeni sürümü inceleyin.",
    workReceipt: "İşlere taslak olarak kaydedildi. Onaylanmadı, gönderilmedi veya yayımlanmadı.",
    knowledgeReceipt: "Sizin onayınızla şirket bilgisine eklendi. Kaynak korunur; bu, bağımsız doğrulama değildir.",
    dismissedReceipt: "Reddedildi. Bu öneriden yeni iş veya şirket bilgisi oluşturulmadı.",
    receipt: "Kayıt", uncertain: "Bu değişikliğin sonucunu doğrulayamıyoruz. Tekrar denemeden önce sayfayı yenileyip kayıt durumunu kontrol edin. Yerine yeni bir öneri oluşturmayın.",
    reload: "Yenile ve kayıt durumunu kontrol et", revision: "Sürüm",
    rejected: {
      intent_required: "Bu istekte seçimleriniz kayıtlı değil. Öneriyi reddedip açık bir biçim veya şirket bilgisiyle yeni istek başlatın.",
      draft_format: "Taslak seçtiğiniz biçimle uyuşmuyor. Reddedip istediğiniz biçimle yeniden isteyin.",
      knowledge_assertion: "Öneri, yazdığınız şirket bilgisiyle aynen uyuşmuyor. Reddedip yeni istekte arkasında durduğunuz ifadeyi yazın.",
      knowledge_approval: "Şirket bilgisi için bu ifadenin, kapsamın ve geçerliliğin açık onayınız gerekir. İnceleyip kaydetmeden önce kutuyu işaretleyin.",
      duplicate_work: "Bu işlem reddedildi: açık bir işte aynı taslak zaten var. İşleri kontrol edin; başka bir kopya oluşturmayın.",
      calendar_date: "Bu işlem reddedildi: tarih geçersiz veya haftanın günüyle uyuşmuyor. Kaynağı kontrol edip kaydetmeden önce önizlemeyi düzenleyin.",
      work_kind: "Bu işlem reddedildi: taslağın türü desteklenmiyor. Öneriyi reddedip istediğiniz biçimde yeni bir taslak isteyin.",
      work_action: "Bu işlem reddedildi: taslağın türü ve sonraki işlem uyuşmuyor. Öneriyi reddedip istediğiniz biçimi belirtin. Kaydetmek, göndermek veya yayımlamak değildir.",
    },
  },
  fr: {
    heading: "Vérifier avant d’enregistrer", work: "Proposition de travail", knowledge: "Proposition de connaissance d’entreprise",
    intro: "Chaque proposition demande sa propre vérification. Enregistrer n’approuve, n’envoie et ne publie rien.",
    proposed: "Non enregistrée", saved: "Enregistrée", dismissed: "Écartée", model: "Proposition générée par le modèle · non vérifiée indépendamment",
    title: "Titre", body: "Brouillon", statement: "Énoncé", lane: "Domaine", kind: "Type", outward: "Action ultérieure possible (non effectuée ici)", none: "Non précisé",
    scope: "S’applique à", scopeLabel: "Nom de l’entreprise, du projet ou du client", company: "Entreprise", project: "Projet", customer: "Client",
    duration: "Valable jusqu’à", until_changed: "Votre modification ou retrait", until_date: "Une date précise (UTC)", date: "Dernier jour de validité (UTC)",
    fact: "Fait", preference: "Préférence", constraint: "Contrainte", person: "Personne", decision: "Décision",
    sources: "Extraits des sources", sourceText: "Lire la source conservée", sourceRevision: "Version de la source", founder: "Déclaration du fondateur", record: "Dossier existant", quoted: "Contenu cité", modelSource: "Contenu généré par le modèle",
    attribution: "Ces extraits indiquent l’origine de la proposition. Ils ne prouvent pas qu’elle est vraie.",
    confirm: "Je confirme que cet énoncé exact, avec ce périmètre et cette validité, appartient aux connaissances de l’entreprise. C’est mon approbation, pas une vérification indépendante.",
    assertionFixed: "C’est l’énoncé exact de votre demande. Pour le modifier, lancez une nouvelle demande avec l’énoncé que vous assumez.",
    legacy: "Cette ancienne proposition n’a pas de choix de demande enregistrés. Vous pouvez la lire ou l’écarter. Pour l’enregistrer, lancez une nouvelle demande avec un format ou un énoncé explicite.",
    missing: "Des précisions manquent. Modifiez la proposition avant de l’enregistrer.",
    saveWork: "Enregistrer dans le travail", saveKnowledge: "Ajouter aux connaissances", edit: "Modifier la proposition", dismiss: "Écarter", cancel: "Annuler la modification", revise: "Actualiser l’aperçu", reviewing: "Actualisation…", saving: "Enregistrement…", dismissing: "Traitement…",
    editHint: "Actualiser l’aperçu ne l’ajoute ni au travail ni aux connaissances. Vérifiez la nouvelle version avant de l’enregistrer.",
    workReceipt: "Enregistrée dans le travail comme brouillon. Rien n’a été approuvé, envoyé ou publié.",
    knowledgeReceipt: "Ajoutée aux connaissances avec votre confirmation. La source est conservée ; ce n’est pas une vérification indépendante.",
    dismissedReceipt: "Écartée. Cette proposition n’a créé ni travail ni connaissance d’entreprise.",
    receipt: "Dossier", uncertain: "Le résultat de cette modification est incertain. Rechargez la page pour vérifier l’état enregistré avant de réessayer. Ne créez pas de proposition de remplacement.",
    reload: "Recharger et vérifier l’enregistrement", revision: "Version",
    rejected: {
      intent_required: "Vos choix n’ont pas été enregistrés pour cette demande. Écartez la proposition et précisez un format ou un énoncé dans une nouvelle demande.",
      draft_format: "Ce brouillon ne correspond pas au format choisi. Écartez-le et demandez le format souhaité.",
      knowledge_assertion: "Cette proposition ne reprend pas exactement votre énoncé. Écartez-la et saisissez l’énoncé que vous assumez dans une nouvelle demande.",
      knowledge_approval: "Votre approbation explicite de cet énoncé, de son périmètre et de sa validité est nécessaire. Relisez et cochez la case avant l’enregistrement.",
      duplicate_work: "Cette tentative a été refusée : un travail ouvert contient déjà ce brouillon exact. Vérifiez le travail ; ne créez pas de copie.",
      calendar_date: "Cette tentative a été refusée : une date est invalide ou son jour ne correspond pas. Vérifiez la source et modifiez l’aperçu avant d’enregistrer.",
      work_kind: "Cette tentative a été refusée : le type du brouillon n’est pas pris en charge. Écartez-le et demandez le format voulu.",
      work_action: "Cette tentative a été refusée : le type et l’action ultérieure ne correspondent pas. Écartez la proposition et précisez le format voulu. Enregistrer n’envoie ni ne publie rien.",
    },
  },
};

type Copy = (typeof COPY)[Locale];
type Action = "save_to_work" | "add_to_company_knowledge" | "revise" | "dismiss";
type Command = { proposalId: string; revision: number; fingerprint: string; action: Action; payload?: ProposalPayload; knowledgeApproved?: true };
type Props = { proposals: DurableProposal[]; turns?: Pick<DurableTurn, "id" | "intent">[]; locale: Locale; onChange: () => void; disabled?: boolean; onUncertain?: () => void; onRejected?: () => void; onMutationStart?: () => boolean };

const stack: CSSProperties = { display: "grid", gap: "1rem", minWidth: 0 };
const textStyle: CSSProperties = { margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.6 };
const fieldStyle: CSSProperties = { width: "100%", minWidth: 0, maxWidth: "100%", boxSizing: "border-box" };
const actionsStyle: CSSProperties = { display: "flex", flexWrap: "wrap", gap: ".65rem", alignItems: "center" };
const buttonStyle: CSSProperties = { maxWidth: "100%", whiteSpace: "normal", overflowWrap: "anywhere", minHeight: "2.75rem" };
const subdued: CSSProperties = { ...textStyle, fontSize: ".85rem", color: "var(--os-ink-2, #aab6c8)" };

function validKnowledge(payload: ProposalPayload) {
  if (payload.type !== "knowledge") return true;
  return !!payload.statement.trim() && !!payload.scope?.label.trim() &&
    ["company", "project", "customer"].includes(payload.scope?.type) &&
    (payload.duration?.type === "until_changed" || (payload.duration?.type === "until_date" && /^\d{4}-\d{2}-\d{2}$/.test(payload.duration.date)));
}

/** One request only. Only the server's finite, confirmed refusal is safe to
 * unlock. Unknown failures, malformed or lost responses require reconciliation. */
export async function sendReviewCommand(command: Command, request: typeof fetch = fetch): Promise<DurableProposal> {
  const response = await request("/api/os/review", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      proposalId: command.proposalId, revision: command.revision, fingerprint: command.fingerprint, action: command.action,
      ...(command.payload ? { payload: command.payload } : {}),
      ...(command.action === "add_to_company_knowledge" && command.knowledgeApproved === true ? { knowledgeApproved: true } : {}),
    }),
  });
  if (!response.ok) {
    if (response.status === 422) {
      const refusal: unknown = await response.json();
      if (refusal && typeof refusal === "object" && "error" in refusal && refusal.error === "review_rejected" &&
        "reason" in refusal && isReviewGuardReason(refusal.reason)) throw new ConfirmedReviewRejection(refusal.reason);
    }
    throw new Error("review_reconciliation_required");
  }
  const result: unknown = await response.json();
  const proposal = result && typeof result === "object" && "proposal" in result ? result.proposal : null;
  const expected = command.action === "dismiss" ? "dismissed" : command.action === "revise" ? "proposed" : "saved";
  if (!proposal || typeof proposal !== "object" || !("id" in proposal) || proposal.id !== command.proposalId ||
    !("status" in proposal) || proposal.status !== expected || !("revision" in proposal) ||
    typeof proposal.revision !== "number" || !Number.isInteger(proposal.revision) || proposal.revision < command.revision ||
    !("fingerprint" in proposal) || typeof proposal.fingerprint !== "string" || !proposal.fingerprint ||
    (command.action !== "revise" && (proposal.revision !== command.revision || proposal.fingerprint !== command.fingerprint)) ||
    (expected === "saved" && (!("record_id" in proposal) || typeof proposal.record_id !== "string" || !proposal.record_id))) {
    throw new Error("review_reconciliation_required");
  }
  return proposal as DurableProposal;
}

export function ReviewCards({ proposals, turns = [], locale, onChange, disabled = false, onUncertain, onRejected, onMutationStart }: Props) {
  const headingId = useId();
  const copy = COPY[locale];
  if (!proposals.length) return null;
  return (
    <section aria-labelledby={headingId} style={stack}>
      <div style={{ ...stack, gap: ".4rem" }}>
        <h2 id={headingId} style={{ fontSize: "1rem", margin: 0 }}>{copy.heading}</h2>
        <p style={subdued}>{copy.intro}</p>
      </div>
      {proposals.map((proposal) => (
        <ReviewCard key={`${proposal.id}:${proposal.revision}:${proposal.fingerprint}:${proposal.status}`} initial={proposal} copy={copy} onChange={onChange} disabled={disabled}
          readOnly={!turns.some((turn) => turn.id === proposal.turn_id && turn.intent != null)} onUncertain={onUncertain} onRejected={onRejected} onMutationStart={onMutationStart} />
      ))}
    </section>
  );
}

function ReviewCard({ initial, copy, onChange, disabled, readOnly, onUncertain, onRejected, onMutationStart }: { initial: DurableProposal; copy: Copy; onChange: () => void; disabled: boolean; readOnly: boolean; onUncertain?: () => void; onRejected?: () => void; onMutationStart?: () => boolean }) {
  const [proposal, setProposal] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState<Action | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [rejected, setRejected] = useState<ReviewGuardReason | null>(null);
  const locked = useRef(false);
  const titleId = useId();
  const payload = proposal.payload;
  const inactive = disabled || proposal.status !== "proposed" || pending !== null || uncertain;
  const sourcesAvailable = payload.citations.length > 0 && payload.citations.every((citation) => proposal.sources.some((source) => source.id === citation.sourceId && source.companyId === proposal.company_id && source.text.includes(citation.quote)));

  async function submit(action: Action, revised?: ProposalPayload) {
    // A ref closes the gap before React disables the buttons. No automatic
    // retry or new operation is available after an unconfirmed result.
    if (locked.current || inactive || (readOnly && action !== "dismiss") || ((action === "save_to_work" || action === "add_to_company_knowledge") && !sourcesAvailable) || (action === "add_to_company_knowledge" && (!confirmed || !validKnowledge(payload)))) return;
    if (onMutationStart && !onMutationStart()) return;
    locked.current = true;
    setPending(action);
    setRejected(null);
    try {
      const saved = await sendReviewCommand({ proposalId: proposal.id, revision: proposal.revision, fingerprint: proposal.fingerprint, action, ...(revised ? { payload: revised } : {}),
        ...(action === "add_to_company_knowledge" && confirmed ? { knowledgeApproved: true as const } : {}) });
      // A validated response identifies the revision/status. Payload rendering
      // remains the reviewed local data until the parent reloads server state.
      setProposal({ ...proposal, revision: saved.revision, fingerprint: saved.fingerprint, status: saved.status, record_id: saved.record_id, payload: revised ?? payload });
      setEditing(false);
      setConfirmed(false);
      locked.current = false;
      onChange();
    } catch (error) {
      if (error instanceof ConfirmedReviewRejection) {
        setRejected(error.reason);
        setConfirmed(false);
        locked.current = false;
        onRejected?.();
      } else {
        setUncertain(true);
        onUncertain?.();
        // Deliberately retain the lock for every unconfirmed response.
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <article aria-labelledby={titleId} aria-busy={pending !== null} data-review-status={proposal.status} style={{ ...stack, padding: "clamp(.85rem, 3vw, 1.25rem)", border: "1px solid var(--os-line, #2b3442)", borderRadius: ".8rem", background: "var(--os-surface, #111823)", overflowWrap: "anywhere" }}>
      <header style={{ ...stack, gap: ".35rem" }}>
        <p style={{ ...subdued, color: "var(--os-accent, #42f5b6)" }}>{copy[proposal.status]} · {copy.revision} {proposal.revision}</p>
        <h3 id={titleId} style={{ fontSize: "1rem", margin: 0 }}>{payload.type === "work" ? copy.work : copy.knowledge}</h3>
        <p style={subdued}>{copy.model}</p>
      </header>

      {editing ? <ReviewEditor key={proposal.fingerprint} payload={payload} copy={copy} pending={inactive} onCancel={() => setEditing(false)} onSubmit={(revised) => { void submit("revise", revised); }} /> : (
        <div style={{ ...stack, gap: ".75rem" }}>
          {payload.type === "work" ? <>
            <Detail label={copy.title} value={payload.title} />
            <Detail label={copy.body} value={payload.body} />
            <Detail label={copy.lane} value={payload.lane} />
            <Detail label={copy.kind} value={payload.kind} />
            <Detail label={copy.outward} value={payload.outwardAction ?? copy.none} />
          </> : <>
            <Detail label={copy.statement} value={payload.statement} />
            <Detail label={copy.kind} value={copy[payload.kind]} />
            <Detail label={copy.scope} value={`${copy[payload.scope.type]} — ${payload.scope.label}`} />
            <Detail label={copy.duration} value={payload.duration.type === "until_date" ? `${payload.duration.date} (UTC)` : copy.until_changed} />
          </>}
        </div>
      )}

      <div style={{ ...stack, gap: ".65rem" }}>
        <h4 style={{ margin: 0, fontSize: ".9rem" }}>{copy.sources}</h4>
        <p style={subdued}>{copy.attribution}</p>
        {payload.citations.map((citation, index) => {
          const source = proposal.sources.find((candidate) => candidate.id === citation.sourceId);
          return <div key={`${citation.sourceId}:${index}`} style={{ ...stack, gap: ".4rem", borderLeft: "2px solid var(--os-accent, #42f5b6)", paddingLeft: ".8rem" }}>
            <blockquote style={textStyle}>{citation.quote}</blockquote>
            {source ? <details style={subdued}>
              <summary style={{ cursor: "pointer", minHeight: "2rem" }}>{copy.sourceText}</summary>
              <p style={subdued}>{source.origin === "model" ? copy.modelSource : copy[source.origin]} · {copy.sourceRevision}: {source.revision}</p>
              <p style={textStyle}>{source.text}</p>
            </details> : <p role="alert" style={subdued}>{copy.missing}</p>}
          </div>;
        })}
      </div>

      {proposal.status === "proposed" && !editing ? <>
        {payload.type === "knowledge" ? <label style={{ display: "flex", alignItems: "flex-start", gap: ".65rem", lineHeight: 1.5 }}>
          <input type="checkbox" checked={confirmed} disabled={inactive || readOnly} onChange={(event) => setConfirmed(event.target.checked)} style={{ flex: "none", marginTop: ".25rem", width: "1.1rem", height: "1.1rem" }} />
          <span>{copy.confirm}</span>
        </label> : null}
        {!validKnowledge(payload) || !sourcesAvailable ? <p role="alert" style={subdued}>{copy.missing}</p> : null}
        <div style={actionsStyle}>
          <button type="button" className="mayda-button" style={buttonStyle} disabled={inactive || readOnly || !sourcesAvailable || !validKnowledge(payload) || (payload.type === "knowledge" && !confirmed)} onClick={() => { void submit(payload.type === "work" ? "save_to_work" : "add_to_company_knowledge"); }}>
            {pending === "save_to_work" || pending === "add_to_company_knowledge" ? copy.saving : payload.type === "work" ? copy.saveWork : copy.saveKnowledge}
          </button>
          <button type="button" className="mayda-button mayda-button-outline" style={buttonStyle} disabled={inactive || readOnly} onClick={() => { if (!inactive && !readOnly) setEditing(true); }}>{copy.edit}</button>
          <button type="button" className="mayda-button mayda-button-outline" style={buttonStyle} disabled={inactive} onClick={() => { void submit("dismiss"); }}>{pending === "dismiss" ? copy.dismissing : copy.dismiss}</button>
        </div>
      </> : null}
      {readOnly && proposal.status === "proposed" ? <p style={subdued}>{copy.legacy}</p> : null}

      {proposal.status !== "proposed" ? <div role="status" style={{ ...stack, gap: ".35rem" }}>
        <p style={textStyle}>{proposal.status === "dismissed" ? copy.dismissedReceipt : payload.type === "work" ? copy.workReceipt : copy.knowledgeReceipt}</p>
        {proposal.record_id ? <p style={subdued}>{copy.receipt}: {proposal.record_id}</p> : null}
      </div> : null}
      {uncertain ? <div role="alert" style={stack}>
        <p style={textStyle}>{copy.uncertain}</p>
        <button type="button" className="mayda-button mayda-button-outline" style={buttonStyle} onClick={() => window.location.reload()}>{copy.reload}</button>
      </div> : null}
      {rejected ? <p role="alert" style={textStyle}>{copy.rejected[rejected]}</p> : null}
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div style={{ ...stack, gap: ".2rem" }}><p style={subdued}>{label}</p><p style={textStyle}>{value}</p></div>;
}

function ReviewEditor({ payload, copy, pending, onCancel, onSubmit }: { payload: ProposalPayload; copy: Copy; pending: boolean; onCancel: () => void; onSubmit: (value: ProposalPayload) => void }) {
  const [duration, setDuration] = useState<KnowledgeDuration["type"]>(payload.type === "knowledge" ? payload.duration.type : "until_changed");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    if (payload.type === "work") {
      onSubmit({ ...payload, title: String(form.get("title") ?? ""), body: String(form.get("body") ?? "") });
    } else {
      onSubmit({ ...payload,
        scope: { type: String(form.get("scopeType")) as KnowledgeScope["type"], label: String(form.get("scopeLabel") ?? "") },
        duration: duration === "until_changed" ? { type: "until_changed" } : { type: "until_date", date: String(form.get("date") ?? "") },
      });
    }
  }
  return <form onSubmit={submit} style={stack}>
    <p style={subdued}>{copy.editHint}</p>
    <fieldset disabled={pending} style={{ ...stack, padding: 0, margin: 0, border: 0 }}>
      {payload.type === "work" ? <>
        <label className="mayda-field"><span>{copy.title}</span><input name="title" required maxLength={200} defaultValue={payload.title} style={fieldStyle} /></label>
        <label className="mayda-field"><span>{copy.body}</span><textarea name="body" required maxLength={8000} rows={8} defaultValue={payload.body} style={fieldStyle} /></label>
      </> : <>
        <Detail label={copy.statement} value={payload.statement} />
        <p style={subdued}>{copy.assertionFixed}</p>
        <label className="mayda-field"><span>{copy.scope}</span><select name="scopeType" defaultValue={payload.scope.type} style={fieldStyle}>{(["company", "project", "customer"] as const).map((value) => <option key={value} value={value}>{copy[value]}</option>)}</select></label>
        <label className="mayda-field"><span>{copy.scopeLabel}</span><input name="scopeLabel" required maxLength={200} defaultValue={payload.scope.label} style={fieldStyle} /></label>
        <label className="mayda-field"><span>{copy.duration}</span><select value={duration} onChange={(event) => setDuration(event.target.value as KnowledgeDuration["type"])} style={fieldStyle}><option value="until_changed">{copy.until_changed}</option><option value="until_date">{copy.until_date}</option></select></label>
        {duration === "until_date" ? <label className="mayda-field"><span>{copy.date}</span><input type="date" name="date" required defaultValue={payload.duration.type === "until_date" ? payload.duration.date : ""} style={fieldStyle} /></label> : null}
      </>}
      <div style={actionsStyle}>
        <button type="submit" className="mayda-button" style={buttonStyle}>{pending ? copy.reviewing : copy.revise}</button>
        <button type="button" className="mayda-button mayda-button-outline" style={buttonStyle} onClick={onCancel}>{copy.cancel}</button>
      </div>
    </fieldset>
  </form>;
}
