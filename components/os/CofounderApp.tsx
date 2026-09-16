"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* The conversation.
 *
 * The one app that makes the rest of MaydaOS a co-founder rather than a
 * dashboard with windows. Everything it says arrives as it is written, and
 * anything it files shows up in the transcript as a line of its own — because
 * "it did something" is a different fact from "it said something", and a
 * conversation that blurs the two is how you stop trusting it.
 */

export type ChatMessage = { id: string; role: "person" | "cofounder"; body: string };

export type CofounderCopy = {
  placeholder: string;
  send: string;
  sending: string;
  empty: string;
  emptyHint: string;
  /* A template with a {title} slot, not a function: copy crosses the
   * server/client boundary and functions do not. */
  filed: string;
  failed: string;
  budget: string;
  notConfigured: string;
  noCompany: string;
};

export function CofounderApp({
  initialMessages,
  copy,
  canTalk,
}: {
  initialMessages: ChatMessage[];
  copy: CofounderCopy;
  canTalk: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const streamId = useRef(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, pending]);

  const send = useCallback(async () => {
    const said = draft.trim();
    if (!said || pending) return;

    setDraft("");
    setNotice(null);
    setPending(true);

    streamId.current += 1;
    const replyId = `reply-${streamId.current}`;
    setMessages((prev) => [
      ...prev,
      { id: `said-${streamId.current}`, role: "person", body: said },
      { id: replyId, role: "cofounder", body: "" },
    ]);

    const append = (text: string) =>
      setMessages((prev) => prev.map((m) => (m.id === replyId ? { ...m, body: m.body + text } : m)));

    try {
      const response = await fetch("/api/os/cofounder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: said }),
      });

      if (!response.ok || !response.body) {
        const reason =
          response.status === 402
            ? copy.budget
            : response.status === 503
              ? copy.notConfigured
              : response.status === 409
                ? copy.noCompany
                : copy.failed;
        setNotice(reason);
        setMessages((prev) => prev.filter((m) => m.id !== replyId));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Newline-delimited JSON: a chunk can split a line anywhere, so the
      // tail is kept until the newline that completes it arrives.
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          let event: { type?: string; text?: string; title?: string; message?: string };
          try {
            event = JSON.parse(line);
          } catch {
            continue;
          }
          if (event.type === "text" && event.text) append(event.text);
          else if (event.type === "filed" && event.title) {
            setMessages((prev) => [
              ...prev,
              { id: `filed-${prev.length}`, role: "cofounder", body: `__filed__${event.title}` },
            ]);
          } else if (event.type === "error") setNotice(event.message ?? copy.failed);
        }
      }
    } catch {
      setNotice(copy.failed);
    } finally {
      setPending(false);
    }
  }, [copy, draft, pending]);

  return (
    <div className="os-chat">
      <div className="os-chat-log">
        {messages.length === 0 && !pending ? (
          <div className="os-chat-empty">
            <strong>{copy.empty}</strong>
            <span>{copy.emptyHint}</span>
          </div>
        ) : null}

        {messages.map((message) =>
          message.body.startsWith("__filed__") ? (
            <p key={message.id} className="os-chat-filed">
              {copy.filed.replace("{title}", message.body.slice("__filed__".length))}
            </p>
          ) : (
            <div key={message.id} className="os-chat-turn" data-role={message.role}>
              <span className="os-chat-who">{message.role === "person" ? "you" : "co-founder"}</span>
              <p className="os-chat-body">
                {message.body || (pending ? "…" : "")}
              </p>
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>

      {notice ? <p className="os-chat-notice" role="alert">{notice}</p> : null}

      <form
        className="os-chat-compose"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={canTalk ? copy.placeholder : copy.noCompany}
          rows={2}
          maxLength={8000}
          disabled={!canTalk || pending}
          onKeyDown={(event) => {
            // Enter sends, shift+enter is a new line. The other way round is
            // correct in a document and wrong in a conversation.
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send();
            }
          }}
        />
        <button type="submit" className="mayda-button" disabled={!canTalk || pending || !draft.trim()}>
          {pending ? copy.sending : copy.send}
        </button>
      </form>
    </div>
  );
}
