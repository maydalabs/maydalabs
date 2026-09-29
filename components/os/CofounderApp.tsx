"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { OS_ASK_EVENT } from "@/components/os/OsCommandBar";
import { ReviewCards } from "@/components/os/ReviewCards";
import { ReviewIntentFields, ReviewIntentSummary } from "@/components/os/ReviewIntentFields";
import { readReviewStream } from "@/lib/osReviewStream";
import { REVIEW_REQUEST_MODES, parseReviewRequestIntent, reviewIntentEquals, type ReviewRequestMode } from "@/lib/osReviewIntent";
import type { ReviewWorkKind } from "@/lib/osReviewGuard";
import type { ReviewSnapshot } from "@/lib/osReviewTypes";
import type { Locale } from "@/lib/i18n";
import { pendingQuestionKey, parseLegacyPendingQuestion, parsePendingQuestion, subscribePending, writePending, type LegacyPendingQuestion, type PendingQuestion } from "@/lib/osReviewPending";

export type ChatMessage = { id: string; role: "person" | "cofounder"; body: string };
export type CofounderCopy = {
  placeholder: string; modeLabel: string;
  modes: Record<ReviewRequestMode, { label: string; help: string; submit: string }>;
  sending: string; empty: string; emptyHint: string;
  filed: string; learned: string; failed: string; budget: string; notConfigured: string; noCompany: string;
};
const recoveryCopy = {
  en: { reload: "Check stored progress", failed: "The result is unconfirmed. Check stored progress before continuing; nothing is automatically retried.", running: "An answer has not finished saving. You can refresh to check it. It will not be generated again automatically.", stopped: "An earlier answer was interrupted. Any suggestions remain separate and need your review.", saved: "Stored conversation and review cards refreshed.", retry: "Retry this exact request", unresolved: "This request still needs a stored receipt. Do not start a replacement. Check stored progress first; if no receipt exists, you can deliberately retry the same request.", storage: "The browser’s recovery record is unreadable. No new request will start until you check stored progress and explicitly clear the browser hint.", storageUnavailable: "Browser session storage is unavailable. No new request can safely start. Restore browser storage, then reload this page; the browser hint cannot be checked or cleared here.", legacy: "This older request did not capture its draft format or company statement. Check its stored result; it cannot be retried with new choices.", discard: "Clear old browser hint", discardConfirm: "Only the browser hint will be cleared; no server record is deleted. If the earlier question is still running, starting another could duplicate it. Clear this hint after checking stored progress?", discarded: "Browser recovery hint cleared. No server record was changed.", refused: "The request was refused before anything started. Nothing was recorded or saved; your text is back in the box." },
  tr: { reload: "Kayıtlı durumu kontrol et", failed: "Sonuç doğrulanamadı. Devam etmeden önce kayıtları kontrol edin; otomatik tekrar yapılmaz.", running: "Bir yanıtın kaydı henüz tamamlanmadı. Kontrol etmek için yenileyin. Otomatik olarak yeniden üretilmez.", stopped: "Önceki bir yanıt yarıda kaldı. Öneriler ayrıdır ve incelemenizi bekler.", saved: "Kayıtlı konuşma ve inceleme kartları yenilendi.", retry: "Aynı isteği yeniden dene", unresolved: "Bu istek için kayıtlı bir sonuç henüz doğrulanmadı. Yerine yeni bir istek başlatmayın. Önce kayıtları kontrol edin; kayıt yoksa aynı isteği bilinçli olarak tekrar deneyebilirsiniz.", storage: "Tarayıcıdaki kurtarma kaydı okunamıyor. Kayıtlı durumu kontrol edip tarayıcı kaydını açıkça temizleyene kadar yeni istek başlamaz.", storageUnavailable: "Tarayıcı oturum depolamasına erişilemiyor. Yeni istek güvenle başlatılamaz. Tarayıcı depolamasını açıp sayfayı yenileyin; bu kayıt burada kontrol edilemez veya silinemez.", legacy: "Bu eski istekte taslak biçimi veya şirket bilgisi kaydedilmedi. Kayıtlı sonucunu kontrol edin; yeni seçimlerle yeniden denenemez.", discard: "Eski tarayıcı kaydını temizle", discardConfirm: "Yalnızca tarayıcı kaydı temizlenir; sunucu kaydı silinmez. Önceki soru sürüyorsa yeni istek onu çoğaltabilir. Kayıtlı durumu kontrol ettikten sonra temizlensin mi?", discarded: "Tarayıcıdaki kurtarma kaydı temizlendi. Sunucu kaydı değişmedi.", refused: "İstek daha hiçbir şey başlamadan reddedildi. Hiçbir şey kaydedilmedi; metniniz kutuya geri kondu." },
  fr: { reload: "Vérifier les données enregistrées", failed: "Le résultat est incertain. Vérifiez les données avant de continuer ; aucune nouvelle tentative automatique.", running: "Une réponse n'a pas fini de s'enregistrer. Actualisez pour vérifier. Elle ne sera pas régénérée automatiquement.", stopped: "Une réponse précédente a été interrompue. Les suggestions restent distinctes et nécessitent votre relecture.", saved: "Conversation et propositions enregistrées actualisées.", retry: "Réessayer cette demande exacte", unresolved: "Cette demande attend encore une confirmation enregistrée. Ne lancez pas de remplacement. Vérifiez d’abord les données ; si aucune confirmation n’existe, vous pouvez relancer volontairement la même requête.", storage: "La trace de récupération du navigateur est illisible. Aucune nouvelle demande ne démarrera avant vérification et effacement explicite de cette trace.", storageUnavailable: "Le stockage de session du navigateur est indisponible. Aucune nouvelle demande ne peut démarrer en sécurité. Rétablissez le stockage puis rechargez la page ; cette trace ne peut être vérifiée ni effacée ici.", legacy: "Cette ancienne demande n’a pas conservé son format de brouillon ou son énoncé d’entreprise. Vérifiez son résultat enregistré ; elle ne peut pas être relancée avec de nouveaux choix.", discard: "Effacer l'ancienne trace du navigateur", discardConfirm: "Seule la trace du navigateur sera effacée ; aucun dossier serveur ne sera supprimé. Si la question précédente est encore en cours, une autre peut la dupliquer. L'effacer après vérification des données ?", discarded: "Trace de récupération effacée. Aucun dossier serveur n'a été modifié.", refused: "La demande a été refusée avant tout démarrage. Rien n’a été enregistré ; votre texte est de retour dans le champ." },
};
const interruptionCopy = {
  en: { close: "Close interrupted answer", help: "If an answer has been interrupted, you can close it after three minutes. This does not restart generation or discard its saved suggestions.", other: "Another company member owns a running answer. They need to close it if it was interrupted.", failed: "The answer may still be running, may be too recent to close, or the result is unconfirmed. Check stored progress before trying again.", closing: "Closing…" },
  tr: { close: "Yarıda kalan yanıtı kapat", help: "Yanıt yarıda kaldıysa üç dakika sonra kapatabilirsiniz. Bu işlem üretimi yeniden başlatmaz ve kayıtlı önerileri silmez.", other: "Devam eden yanıtı başka bir şirket üyesi başlattı. Yarıda kaldıysa o kişinin kapatması gerekir.", failed: "Yanıt hâlâ çalışıyor olabilir, kapatmak için çok yeni olabilir veya sonuç doğrulanamamış olabilir. Tekrar denemeden önce kayıtlı durumu kontrol edin.", closing: "Kapatılıyor…" },
  fr: { close: "Clore la réponse interrompue", help: "Si une réponse a été interrompue, vous pouvez la clore après trois minutes. Cela ne relance pas la génération et ne supprime pas les propositions enregistrées.", other: "Une réponse en cours appartient à un autre membre de l’entreprise. Cette personne doit la clore si elle a été interrompue.", failed: "La réponse peut encore être en cours, être trop récente pour être close, ou le résultat est incertain. Vérifiez les données enregistrées avant de réessayer.", closing: "Clôture…" },
};

const STORAGE_UNAVAILABLE = "__maydaos_storage_unavailable__";
function pendingRaw(key: string | null): string | null {
  if (!key) return null;
  try { return sessionStorage.getItem(key); } catch { return STORAGE_UNAVAILABLE; }
}
const noServerPending = () => null;

/** A read started before a newer read or a mutation cannot clear uncertainty,
 * replace current receipts or refresh the desk. Stale failures are ignored too. */
export function createReviewReadFence() {
  let version = 0;
  return {
    invalidate() { version += 1; },
    async read<T>(load: () => Promise<T>, commit: (value: T) => void, fail: () => void): Promise<boolean> {
      const ticket = ++version;
      try {
        const value = await load();
        if (ticket !== version) return false;
        commit(value);
        return true;
      } catch {
        if (ticket === version) fail();
        return false;
      }
    },
  };
}

export function reviewIdentityChanged(current: ReviewSnapshot | null, incoming: ReviewSnapshot | null): boolean {
  return !!current && (!incoming || current.companyId !== incoming.companyId || current.actorId !== incoming.actorId);
}

export class ReviewIdentityChangedError extends Error {}

/** Bind both new questions and deliberate retries to the identity displayed in
 * this tab. The server still derives and authorises the real identity itself. */
export async function sendReviewQuestion(question: PendingQuestion, identity: Pick<ReviewSnapshot, "actorId" | "companyId">, request: typeof fetch = fetch): Promise<Response> {
  const response = await request("/api/os/cofounder", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: question.message, requestId: question.requestId, mode: question.mode, intent: question.intent,
      expectedActorId: identity.actorId, expectedCompanyId: identity.companyId }),
  });
  if (response.status === 409) {
    const value: unknown = await response.clone().json().catch(() => null);
    if (value && typeof value === "object" && "error" in value && value.error === "identity_changed") throw new ReviewIdentityChangedError("identity_changed");
  }
  return response;
}

/** The route answers these before a turn exists, so nothing was recorded and
 * there is nothing to reconcile. A 409 turn_unconfirmed, a lost response or
 * an unreadable body may follow a begun turn and stays uncertain. */
const REFUSED_BEFORE_BEGIN = new Set(["not_configured", "origin", "content_type", "not_signed_in", "invalid_message", "invalid_intent", "no_company", "review_access_denied", "budget", "budget_unavailable", "context_unavailable", "key_unavailable", "model_settings_unavailable", "model_settings_invalid"]);
export async function refusedBeforeBegin(response: Response): Promise<string | null> {
  const value: unknown = await response.clone().json().catch(() => null);
  const error = value && typeof value === "object" && "error" in value ? value.error : null;
  return typeof error === "string" && REFUSED_BEFORE_BEGIN.has(error) ? error : null;
}

const identityCopy = {
  en: { message: "Your account or selected company has changed. Reload this page before continuing; this conversation will not be moved to another company.", reload: "Reload this page" },
  tr: { message: "Hesabınız veya seçili şirket değişti. Devam etmeden önce bu sayfayı yenileyin; bu konuşma başka bir şirkete taşınmayacak.", reload: "Bu sayfayı yenile" },
  fr: { message: "Votre compte ou l’entreprise sélectionnée a changé. Rechargez cette page avant de continuer ; cette conversation ne sera pas déplacée vers une autre entreprise.", reload: "Recharger cette page" },
};

export function pendingReceiptMatches(snapshot: ReviewSnapshot, question: PendingQuestion): boolean {
  return snapshot.turns.some((turn) => turn.id === question.requestId && turn.question === question.message && turn.mode === question.mode && reviewIntentEquals(turn.intent, question.intent) &&
    turn.company_id === snapshot.companyId && turn.actor_id === snapshot.actorId && ["running", "completed", "failed"].includes(turn.status));
}

export function legacyPendingReceiptMatches(snapshot: ReviewSnapshot, question: LegacyPendingQuestion): boolean {
  return snapshot.turns.some((turn) => turn.id === question.requestId && turn.question === question.message && turn.mode === (question.mode ?? "both") && turn.intent == null &&
    turn.company_id === snapshot.companyId && turn.actor_id === snapshot.actorId && ["running", "completed", "failed"].includes(turn.status));
}

export function interruptionReceiptMatches(value: unknown, turnId: string, snapshot: ReviewSnapshot): boolean {
  if (!value || typeof value !== "object" || !("turn" in value)) return false;
  const turn = value.turn;
  return !!turn && typeof turn === "object" && "id" in turn && turn.id === turnId &&
    "company_id" in turn && turn.company_id === snapshot.companyId && "actor_id" in turn && turn.actor_id === snapshot.actorId &&
    "status" in turn && (turn.status === "failed" || turn.status === "completed");
}

/** Only a newly observed durable save changes the other desk panes. A proposal,
 * failed request or unchanged receipt is not a reason to refresh their data.
 * Full-page loads already contain these records, so this runs on deliberate
 * reconciliation rather than in a mount/prop effect. */
export function reviewSnapshotNeedsDeskRefresh(previous: ReviewSnapshot | null, next: ReviewSnapshot): boolean {
  if (previous && (previous.actorId !== next.actorId || previous.companyId !== next.companyId)) return false;
  return next.proposals.some((proposal) => proposal.status === "saved" && !!proposal.record_id &&
    proposal.actor_id === next.actorId && proposal.company_id === next.companyId &&
    !previous?.proposals.some((old) => old.id === proposal.id && old.status === "saved" &&
      old.record_id === proposal.record_id && old.revision === proposal.revision && old.fingerprint === proposal.fingerprint));
}

export function CofounderApp({ initialSnapshot, locale, copy, canTalk, why }: {
  initialSnapshot: ReviewSnapshot | null; locale: Locale; copy: CofounderCopy; canTalk: boolean; why: string | null;
}) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [messages, setMessages] = useState<ChatMessage[]>(initialSnapshot?.messages ?? []);
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<ReviewRequestMode>("ask");
  const [draftFormat, setDraftFormat] = useState<ReviewWorkKind | "">("");
  const [knowledgeAssertion, setKnowledgeAssertion] = useState("");
  const [pending, setPending] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [retryReady, setRetryReady] = useState(false);
  const [recoveryCheckedRaw, setRecoveryCheckedRaw] = useState<string | null>(null);
  const [readVersion, setReadVersion] = useState(0);
  const [interrupting, setInterrupting] = useState<string | null>(null);
  const [reviewPending, setReviewPending] = useState(false);
  const [identityRejected, setIdentityRejected] = useState(false);
  const [readFence] = useState(createReviewReadFence);
  const reviewBusy = useRef(false);
  const busy = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);
  const composeRef = useRef<HTMLTextAreaElement>(null);
  const modeHelpId = useId();
  const words = recoveryCopy[locale];
  const interruption = interruptionCopy[locale];
  const storageKey = snapshot ? pendingQuestionKey(snapshot.actorId, snapshot.companyId) : null;
  const getPending = useCallback(() => pendingRaw(storageKey), [storageKey]);
  const storedPending = useSyncExternalStore(subscribePending, getPending, noServerPending);
  const questionPending = parsePendingQuestion(storedPending);
  const legacyPending = questionPending ? null : parseLegacyPendingQuestion(storedPending);
  const storageUnavailable = storedPending === STORAGE_UNAVAILABLE;
  const storageInvalid = storedPending !== null && !storageUnavailable && !questionPending && !legacyPending;
  const identityChanged = identityRejected || reviewIdentityChanged(snapshot, initialSnapshot);
  const running = snapshot?.turns.some((turn) => turn.status === "running") ?? false;
  const ownRunningTurns = snapshot?.turns.filter((turn) => turn.status === "running" && turn.actor_id === snapshot.actorId) ?? [];
  const blocked = uncertain || storedPending !== null || running || reviewPending || identityChanged;
  const displayedMode = pending && questionPending ? questionPending.mode : mode;
  const displayedFormat = pending && questionPending ? questionPending.intent.draftFormat ?? "" : draftFormat;
  const displayedAssertion = pending && questionPending ? questionPending.intent.knowledgeAssertion ?? "" : knowledgeAssertion;
  const composerIntent = parseReviewRequestIntent({
    draftFormat: mode === "draft" || mode === "both" ? draftFormat || null : null,
    knowledgeAssertion: mode === "knowledge" || mode === "both" ? knowledgeAssertion.trim() || null : null,
  }, mode);
  const selectMode = (next: ReviewRequestMode) => {
    setMode(next); setDraftFormat(""); setKnowledgeAssertion("");
  };

  useEffect(() => () => readFence.invalidate(), [readFence, initialSnapshot?.actorId, initialSnapshot?.companyId]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages, pending]);
  useEffect(() => {
    const onAsk = (event: Event) => {
      const asked = (event as CustomEvent<string>).detail;
      if (typeof asked === "string" && asked.trim()) { setMode("ask"); setDraftFormat(""); setKnowledgeAssertion(""); setDraft(asked); composeRef.current?.focus(); }
    };
    window.addEventListener(OS_ASK_EVENT, onAsk);
    return () => window.removeEventListener(OS_ASK_EVENT, onAsk);
  }, []);

  const reload = useCallback(async (question?: PendingQuestion) => {
    if (identityChanged) return false;
    return readFence.read(async () => {
      const raw = pendingRaw(storageKey);
      const hint = question ?? parsePendingQuestion(raw);
      if (raw === STORAGE_UNAVAILABLE) throw new Error("storage_unavailable");
      const legacy = hint ? null : parseLegacyPendingQuestion(raw);
      const targetId = hint?.requestId ?? legacy?.requestId;
      const response = await fetch(`/api/os/review${targetId ? `?requestId=${encodeURIComponent(targetId)}` : ""}`, { cache: "no-store" });
      if (!response.ok) throw new Error("unavailable");
      const next = await response.json() as ReviewSnapshot;
      if (!next.companyId || !next.actorId || !Array.isArray(next.messages) || !Array.isArray(next.proposals) || !Array.isArray(next.turns)) throw new Error("invalid");
      // Don't silently adopt another company in a stale tab.
      if (snapshot && (next.companyId !== snapshot.companyId || next.actorId !== snapshot.actorId)) throw new Error("identity_changed");
      return { next, hint, legacy, raw };
    }, ({ next, hint, legacy, raw }) => {
      const matched = hint ? pendingReceiptMatches(next, hint) : legacy ? legacyPendingReceiptMatches(next, legacy) : false;
      if (matched && storageKey && pendingRaw(storageKey) === raw) writePending(storageKey, null);
      const missing = !!(hint || legacy) && !matched;
      setSnapshot(next); setMessages(next.messages); setUncertain(missing); setRetryReady(!!hint && missing);
      setRecoveryCheckedRaw(raw !== null && !matched && !hint ? raw : null);
      setReadVersion((version) => version + 1);
      setNotice(legacy && missing ? words.legacy : missing ? words.unresolved : raw !== null && !hint && !legacy && !matched ? words.storage : words.saved);
      // Work, Memory, Record, the Brief and command targets are Server
      // Components. Refresh their RSC data after the stored receipt is read;
      // keep this chat's draft/recovery state and the desk's open windows.
      if (reviewSnapshotNeedsDeskRefresh(snapshot, next)) router.refresh();
    }, () => { setUncertain(true); setRetryReady(false); setNotice(pendingRaw(storageKey) === STORAGE_UNAVAILABLE ? words.storageUnavailable : words.failed); });
  }, [snapshot, storageKey, words, router, readFence, identityChanged]);

  const beginReviewMutation = () => {
    if (busy.current || reviewBusy.current || identityChanged) return false;
    readFence.invalidate();
    reviewBusy.current = true; setReviewPending(true);
    return true;
  };
  const reconcileReviewMutation = async () => {
    try { await reload(); }
    finally { reviewBusy.current = false; setReviewPending(false); }
  };
  const uncertainReviewMutation = () => {
    readFence.invalidate();
    reviewBusy.current = false; setReviewPending(false);
    setUncertain(true); setNotice(words.failed);
  };
  const rejectedReviewMutation = () => {
    readFence.invalidate();
    reviewBusy.current = false; setReviewPending(false);
  };

  const send = useCallback(async (retry?: PendingQuestion) => {
    const said = retry?.message ?? draft.trim();
    if (!said || busy.current || reviewBusy.current || identityChanged || !canTalk || !snapshot || !storageKey || (!retry && (blocked || !composerIntent)) || (retry && (!retryReady || running))) return;
    readFence.invalidate();
    let question: PendingQuestion;
    try {
      const raw = sessionStorage.getItem(storageKey);
      const existing = parsePendingQuestion(raw);
      if (retry ? !existing || existing.requestId !== retry.requestId || existing.message !== retry.message || existing.mode !== retry.mode || !reviewIntentEquals(existing.intent, retry.intent) : raw !== null) throw new Error("pending_changed");
      if (!retry && !composerIntent) return;
      question = retry ?? { requestId: crypto.randomUUID(), message: said, mode, intent: composerIntent! };
      // Persist before POST. A reload after a lost begin response must retain
      // the same nonce and question, even when the first GET cannot see a row.
      writePending(storageKey, question);
      const retained = parsePendingQuestion(sessionStorage.getItem(storageKey));
      if (!retained || retained.requestId !== question.requestId || retained.message !== question.message || retained.mode !== question.mode || !reviewIntentEquals(retained.intent, question.intent)) throw new Error("storage_unavailable");
    } catch { setUncertain(true); setRetryReady(false); setNotice(words.storage); return; }
    busy.current = true; setPending(true); setRetryReady(false); setDraft(""); setNotice(null);
    if (!retry) { setMode("ask"); setDraftFormat(""); setKnowledgeAssertion(""); }
    const { requestId } = question;
    const replyId = `reply-${requestId}`;
    setMessages((prev) => [...prev.filter((m) => m.id !== requestId && m.id !== replyId), { id: requestId, role: "person", body: said }, { id: replyId, role: "cofounder", body: "" }]);
    try {
      const response = await sendReviewQuestion(question, snapshot);
      if (!response.ok) {
        const refusal = await refusedBeforeBegin(response);
        if (refusal) {
          // Nothing began, so nothing is uncertain: put the request back in
          // the person's hands instead of locking the desk behind a retry.
          if (parsePendingQuestion(pendingRaw(storageKey))?.requestId === requestId) writePending(storageKey, null);
          setMessages((prev) => prev.filter((m) => m.id !== requestId && m.id !== replyId));
          setDraft(said); setMode(question.mode); setDraftFormat(question.intent.draftFormat ?? ""); setKnowledgeAssertion(question.intent.knowledgeAssertion ?? "");
          setNotice(refusal === "budget" ? copy.budget : refusal === "not_configured" ? copy.notConfigured : refusal === "no_company" ? copy.noCompany : `${words.refused} (${refusal})`);
          return;
        }
        throw new Error("unconfirmed");
      }
      await readReviewStream(response, (text) => setMessages((prev) => prev.map((m) => m.id === replyId ? { ...m, body: m.body + text } : m)));
      await reload(question);
    } catch (error) {
      if (error instanceof ReviewIdentityChangedError) setIdentityRejected(true);
      setUncertain(true); setNotice(words.failed);
      // Preserve partial output and question; never manufacture a successful receipt.
    } finally { busy.current = false; setPending(false); }
  }, [draft, mode, composerIntent, blocked, canTalk, snapshot, storageKey, retryReady, running, copy, reload, words, readFence, identityChanged]);
  function discardOldHint() {
    if (!recoveryCheckedRaw || recoveryCheckedRaw !== storedPending || !storageKey || (!legacyPending && !storageInvalid) ||
      !window.confirm(words.discardConfirm)) return;
    try {
      if (pendingRaw(storageKey) !== recoveryCheckedRaw) throw new Error("recovery_hint_changed");
      readFence.invalidate();
      writePending(storageKey, null);
      setUncertain(false); setRetryReady(false); setRecoveryCheckedRaw(null); setNotice(words.discarded);
    } catch { setNotice(words.storage); }
  }
  async function closeInterrupted(turnId: string) {
    if (busy.current || reviewBusy.current || identityChanged || !snapshot || !ownRunningTurns.some((turn) => turn.id === turnId)) return;
    readFence.invalidate();
    busy.current = true; setPending(true); setInterrupting(turnId); setNotice(null);
    try {
      const response = await fetch("/api/os/review/interrupt", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ turnId }),
      });
      if (!response.ok || !interruptionReceiptMatches(await response.json(), turnId, snapshot)) throw new Error("interrupt_unconfirmed");
      await reload();
    } catch { setUncertain(true); setNotice(interruption.failed); }
    finally { busy.current = false; setPending(false); setInterrupting(null); }
  }
  const latestStatus = snapshot?.turns[0]?.status;
  return (
    <div className="os-chat">
      <div className="os-chat-log">
        {!messages.length && !pending ? <div className="os-chat-empty"><strong>{copy.empty}</strong><span>{why ?? copy.emptyHint}</span></div> : null}
        {messages.map((message) => <div key={message.id} className="os-chat-turn" data-role={message.role}>
          <span className="os-chat-who">{message.role === "person" ? (locale === "tr" ? "siz" : locale === "fr" ? "vous" : "you") : "co-founder"}</span>
          <p className="os-chat-body">{message.body || (pending ? "…" : "")}</p>
        </div>)}
        <div ref={endRef} />
      </div>
      {running ? <p role="status" className="os-chat-notice">{words.running}</p> : latestStatus === "failed" ? <p className="os-chat-notice">{words.stopped}</p> : null}
      {ownRunningTurns.length ? <div style={{ display: "grid", gap: ".6rem", minWidth: 0 }}>
        <p className="os-chat-notice">{interruption.help}</p>
        {ownRunningTurns.map((turn) => <div key={turn.id} style={{ display: "grid", gap: ".4rem", minWidth: 0 }}>
          <blockquote style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{turn.question}</blockquote>
          <button type="button" className="mayda-button mayda-button-outline" disabled={pending || reviewPending || identityChanged || uncertain} onClick={() => void closeInterrupted(turn.id)}>{interrupting === turn.id ? interruption.closing : interruption.close}</button>
        </div>)}
      </div> : running ? <p className="os-chat-notice">{interruption.other}</p> : null}
      {notice ? <p className="os-chat-notice" role="status">{notice}</p> : null}
      {identityChanged ? <div role="alert"><p className="os-chat-notice">{identityCopy[locale].message}</p><button type="button" className="mayda-button" onClick={() => window.location.reload()}>{identityCopy[locale].reload}</button></div> : null}
      {storageUnavailable ? <p className="os-chat-notice" role="alert">{words.storageUnavailable}</p> : storageInvalid ? <p className="os-chat-notice" role="alert">{words.storage}</p> : legacyPending && !pending ? <div style={{ display: "grid", gap: ".6rem", minWidth: 0 }}>
        <p className="os-chat-notice" role="status">{words.legacy}</p>
        <blockquote style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{legacyPending.message}</blockquote>
      </div> : questionPending && !pending ? <div style={{ display: "grid", gap: ".6rem", minWidth: 0 }}>
        <p className="os-chat-notice" role="status">{words.unresolved}</p>
        <span className="os-chat-who">{copy.modeLabel}: {copy.modes[questionPending.mode].label}</span>
        <blockquote style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{questionPending.message}</blockquote>
        <ReviewIntentSummary locale={locale} intent={questionPending.intent} />
        {retryReady ? <button type="button" className="mayda-button" disabled={!canTalk || pending || reviewPending || identityChanged || running} onClick={() => void send(questionPending)}>{words.retry}</button> : null}
      </div> : null}
      {recoveryCheckedRaw === storedPending && (legacyPending || storageInvalid) ? <button type="button" className="mayda-button mayda-button-outline" onClick={discardOldHint}>{words.discard}</button> : null}
      <button type="button" className="mayda-button" disabled={pending || reviewPending || identityChanged} onClick={() => void reload()}>{words.reload}</button>
      {snapshot ? <ReviewCards key={readVersion} proposals={snapshot.proposals} turns={snapshot.turns} locale={locale} disabled={uncertain || storedPending !== null || pending || reviewPending || identityChanged} onMutationStart={beginReviewMutation} onUncertain={uncertainReviewMutation} onRejected={rejectedReviewMutation} onChange={() => void reconcileReviewMutation()} /> : null}
      <form style={{ display: "grid", gap: "var(--os-gap-2)", minWidth: 0 }} onSubmit={(event) => { event.preventDefault(); void send(); }}>
        <fieldset disabled={!canTalk || pending || blocked || !snapshot} aria-describedby={modeHelpId}
          style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
          <legend className="os-chat-who" style={{ marginBottom: ".35rem" }}>{copy.modeLabel}</legend>
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".35rem" }}>
            {REVIEW_REQUEST_MODES.map((choice) => <label key={choice}
              style={{ display: "inline-flex", alignItems: "center", gap: ".3rem", padding: ".3rem .5rem", border: `1px solid ${displayedMode === choice ? "var(--os-accent)" : "var(--os-line-2)"}`, borderRadius: "var(--os-radius-sm)", color: displayedMode === choice ? "var(--os-ink)" : "var(--os-ink-2)", cursor: "pointer" }}>
              <input type="radio" name="review-request-mode" value={choice} checked={displayedMode === choice} onChange={() => selectMode(choice)} />
              {copy.modes[choice].label}
            </label>)}
          </div>
        </fieldset>
        <p id={modeHelpId} style={{ margin: 0, color: "var(--os-ink-2)", fontSize: "var(--os-t-small)" }}>{copy.modes[displayedMode].help}</p>
        <ReviewIntentFields locale={locale} mode={displayedMode} format={displayedFormat} assertion={displayedAssertion}
          disabled={!canTalk || pending || blocked || !snapshot} onFormat={setDraftFormat} onAssertion={setKnowledgeAssertion} />
        <div className="os-chat-compose" style={{ flexWrap: "wrap" }}>
          <textarea ref={composeRef} value={pending && questionPending ? questionPending.message : draft} onChange={(event) => setDraft(event.target.value)}
            style={{ flex: "1 1 12rem" }} aria-label={copy.placeholder} placeholder={canTalk ? copy.placeholder : why ?? copy.notConfigured}
            rows={2} maxLength={8000} disabled={!canTalk || pending || blocked || !snapshot}
            onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }} />
          <button type="submit" className="mayda-button" style={{ marginInlineStart: "auto" }} disabled={!canTalk || pending || blocked || !snapshot || !draft.trim() || !composerIntent}>{pending ? copy.sending : copy.modes[mode].submit}</button>
        </div>
      </form>
    </div>
  );
}
