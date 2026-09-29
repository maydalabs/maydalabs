"use client";

import { useId, type CSSProperties } from "react";
import type { Locale } from "@/lib/i18n";
import { REVIEW_WORK_KINDS, type ReviewWorkKind } from "@/lib/osReviewGuard";
import type { ReviewRequestIntent, ReviewRequestMode } from "@/lib/osReviewIntent";

export const REVIEW_INTENT_COPY = {
  en: {
    format: "What kind of draft?", choose: "Choose a format", formatHelp: "Choose what you want to review. Saving a draft does not send or publish it.",
    formats: { email: "Email", reply: "Reply", post: "Public post", note: "Internal note", research: "Research brief", decision: "Decision note" },
    assertion: "Company statement I stand behind", assertionHelp: "Optional. Enter the exact statement you want considered for company knowledge. Pasting something in chat is not your approval. Leave this blank for no knowledge proposal. You will still review its scope and validity before saving.",
    noAssertion: "No company knowledge requested", retained: "Choices retained for this exact request", minimum: "Use at least 3 characters, or leave this blank.",
  },
  tr: {
    format: "Nasıl bir taslak?", choose: "Biçim seçin", formatHelp: "İncelemek istediğiniz biçimi seçin. Taslağı kaydetmek onu göndermez veya yayımlamaz.",
    formats: { email: "E-posta", reply: "Yanıt", post: "Herkese açık paylaşım", note: "İç not", research: "Araştırma özeti", decision: "Karar notu" },
    assertion: "Arkasında durduğum şirket bilgisi", assertionHelp: "İsteğe bağlı. Şirket bilgisi olarak değerlendirilmesini istediğiniz ifadeyi aynen yazın. Sohbete bir metin yapıştırmak onu onayladığınız anlamına gelmez. Bilgi önerisi istemiyorsanız boş bırakın. Kaydetmeden önce kapsamını ve geçerliliğini yine inceleyeceksiniz.",
    noAssertion: "Şirket bilgisi önerisi istenmedi", retained: "Bu istek için korunan seçimler", minimum: "En az 3 karakter yazın veya boş bırakın.",
  },
  fr: {
    format: "Quel type de brouillon ?", choose: "Choisir un format", formatHelp: "Choisissez ce que vous souhaitez relire. Enregistrer un brouillon ne l’envoie ni ne le publie.",
    formats: { email: "E-mail", reply: "Réponse", post: "Publication publique", note: "Note interne", research: "Note de recherche", decision: "Note de décision" },
    assertion: "Énoncé d’entreprise que j’assume", assertionHelp: "Facultatif. Saisissez l’énoncé exact à considérer pour les connaissances de l’entreprise. Coller un texte dans la conversation ne signifie pas l’approuver. Laissez ce champ vide pour ne proposer aucune connaissance. Vous relirez encore son périmètre et sa validité avant l’enregistrement.",
    noAssertion: "Aucune connaissance d’entreprise demandée", retained: "Choix conservés pour cette demande exacte", minimum: "Saisissez au moins 3 caractères ou laissez ce champ vide.",
  },
};
const field: CSSProperties = { width: "100%", minWidth: 0, maxWidth: "100%", boxSizing: "border-box" };
const hint: CSSProperties = { margin: 0, color: "var(--os-ink-2)", fontSize: "var(--os-t-small)", lineHeight: 1.5, overflowWrap: "anywhere" };

export function ReviewIntentFields({ locale, mode, format, assertion, disabled, onFormat, onAssertion }: {
  locale: Locale; mode: ReviewRequestMode; format: ReviewWorkKind | ""; assertion: string; disabled: boolean;
  onFormat: (value: ReviewWorkKind | "") => void; onAssertion: (value: string) => void;
}) {
  const copy = REVIEW_INTENT_COPY[locale];
  const id = useId();
  const assertionLength = Array.from(assertion.trim()).length;
  return <div style={{ display: "grid", gap: ".8rem", minWidth: 0 }}>
    {mode === "draft" || mode === "both" ? <label className="mayda-field" style={{ minWidth: 0 }}>
      <span>{copy.format}</span>
      <select name="review-draft-format" value={format} required disabled={disabled} aria-describedby={`${id}-format`} style={field}
        onChange={(event) => onFormat(REVIEW_WORK_KINDS.includes(event.target.value as ReviewWorkKind) ? event.target.value as ReviewWorkKind : "")}>
        <option value="" disabled>{copy.choose}</option>
        {REVIEW_WORK_KINDS.map((kind) => <option key={kind} value={kind}>{copy.formats[kind]}</option>)}
      </select>
      <span id={`${id}-format`} style={hint}>{copy.formatHelp}</span>
    </label> : null}
    {mode === "knowledge" || mode === "both" ? <label className="mayda-field" style={{ minWidth: 0 }}>
      <span>{copy.assertion}</span>
      <textarea name="review-knowledge-assertion" value={assertion} rows={3} maxLength={2000} disabled={disabled}
        aria-describedby={`${id}-assertion`} aria-invalid={assertionLength > 0 && assertionLength < 3 || undefined}
        style={{ ...field, resize: "vertical" }} onChange={(event) => onAssertion(event.target.value)} />
      <span id={`${id}-assertion`} style={hint}>{assertionLength > 0 && assertionLength < 3 ? `${copy.minimum} ` : ""}{copy.assertionHelp}</span>
    </label> : null}
  </div>;
}

export function ReviewIntentSummary({ locale, intent }: { locale: Locale; intent: ReviewRequestIntent }) {
  const copy = REVIEW_INTENT_COPY[locale];
  return <div style={{ display: "grid", gap: ".35rem", minWidth: 0 }}>
    <span className="os-chat-who">{copy.retained}</span>
    {intent.draftFormat ? <p style={hint}>{copy.format} {copy.formats[intent.draftFormat]}</p> : null}
    {intent.knowledgeAssertion ? <div style={hint}><span>{copy.assertion}</span><blockquote style={{ margin: ".3rem 0 0", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{intent.knowledgeAssertion}</blockquote></div> : <p style={hint}>{copy.noAssertion}</p>}
  </div>;
}
