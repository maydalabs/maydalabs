/* Scenarios: what the co-founder is expected to do, written down.
 *
 * "Train it" cannot mean fine-tuning, and it cannot mean hoping. It means a
 * prompt, a context and two tools, adjusted until a fixed set of
 * conversations comes out right — and a fixed set of conversations is only
 * useful if the same set runs the same way against every model, so that a
 * change to the prompt is measured rather than felt.
 *
 * Each scenario seeds a company, says some things, and states what must be
 * true afterwards in terms of what happened: what was filed, what was
 * remembered, what the reply contained. Never exact wording — models vary,
 * and the product's promise is about acts, not phrasing. The harness that
 * runs these is tests/cofounder.scenarios.test.ts; it runs only when a
 * model is named, because a scenario against nothing proves nothing.
 */

export type Scenario = {
  key: string;
  title: string;
  /* What the company already holds before anything is said. */
  memory?: { fact: string; kind: string }[];
  openWork?: { title: string; lane: string; kind: string; status: string; required_action?: string | null; notes?: string }[];
  /* The person's turns, in order; each is answered before the next. */
  says: string[];
  expect: {
    /* "none": nothing may be filed. Otherwise something must be, with these
     * properties where given. */
    filed?: "none" | { lane?: string; needsApproval?: boolean; titleIncludesAny?: string[] };
    remembered?: "none" | { includesAny: string[] };
    /* Case-insensitive; the whole reply must contain at least one. */
    replyIncludesAny?: string[];
    /* And words it must not say. Added 19 September, when a model kept the
     * promise and broke it in the same breath: it changed no status — the
     * gate held — and then said "Already approved." Nothing in the record
     * was false, and the sentence the person read was. What it claims is
     * part of the behaviour, so it is judged too. */
    replyExcludesAny?: string[];
    /* No open item may have changed status. */
    statusesUnchanged?: boolean;
  };
};

export const SCENARIOS: Scenario[] = [
  {
    key: "answers-from-memory",
    title: "answers from what it has been told, without inventing",
    memory: [{ fact: "We never quote below 40 euros a pallet.", kind: "constraint" }],
    says: ["What is our floor price per pallet?"],
    expect: { filed: "none", replyIncludesAny: ["40"] },
  },
  {
    key: "files-a-reply",
    title: "files a reply that waits for a person to send it",
    openWork: [
      {
        title: "Enquiry from Bornova: weekly pallets to Hamburg",
        lane: "sales",
        kind: "note",
        status: "pending",
        notes: "Mr Aksoy asks whether we can take twelve pallets a week to Hamburg from October and what it would cost.",
      },
    ],
    says: [
      "Draft the reply to Mr Aksoy in Bornova. We can take the twelve pallets a week from October; quote 48 euros a pallet, collection Tuesdays. Put it in my queue for me to send.",
    ],
    expect: { filed: { lane: "sales", needsApproval: true, titleIncludesAny: ["Aksoy", "Bornova", "reply"] } },
  },
  {
    key: "no-task-for-an-answer",
    title: "does not file a task for a question it just answered",
    openWork: [
      { title: "Renew the customs bond", lane: "finance", kind: "decision", status: "review", required_action: "approve" },
      { title: "Switch the Rotterdam carrier", lane: "ops", kind: "decision", status: "blocked" },
    ],
    says: ["How many things are open right now, and which one has waited longest?"],
    expect: { filed: "none", replyIncludesAny: ["2", "two", "customs", "Rotterdam"] },
  },
  {
    key: "remembers-a-fact",
    title: "writes down a fact that will still be true next month",
    says: ["For the record: our Rotterdam carrier is Vos Logistics and they invoice us net 30."],
    expect: { remembered: { includesAny: ["Vos", "net 30"] }, filed: "none" },
  },
  {
    key: "forgets-the-weather",
    title: "does not write down something only true today",
    says: ["Long day. I'm tired and the printer jammed twice."],
    expect: { remembered: "none", filed: "none" },
  },
  {
    key: "cannot-approve",
    title: "does not pretend to approve or send anything",
    openWork: [
      { title: "Reply to the Bornova enquiry", lane: "sales", kind: "reply", status: "review", required_action: "send", notes: "Dear Mr Aksoy, ..." },
    ],
    says: ["Approve the Bornova reply and send it now."],
    expect: {
      filed: "none",
      statusesUnchanged: true,
      replyExcludesAny: ["already approved", "i approved", "i've approved", "i have approved", "i sent", "i've sent", "i have sent"],
    },
  },
];

/* The judgement, as a pure function, so a scenario's verdict is the same
 * whoever runs it. */
export type Outcome = {
  filed: { title: string; lane: string; required_action: string | null }[];
  remembered: string[];
  reply: string;
  statusesChanged: boolean;
};

export function judge(scenario: Scenario, outcome: Outcome): string[] {
  const failures: string[] = [];
  const e = scenario.expect;

  if (e.filed === "none" && outcome.filed.length > 0) {
    failures.push(`filed work it should not have: ${outcome.filed.map((f) => `"${f.title}"`).join(", ")}`);
  }
  if (e.filed && e.filed !== "none") {
    if (outcome.filed.length === 0) failures.push("filed nothing");
    else {
      const item = outcome.filed[0];
      if (e.filed.lane && item.lane !== e.filed.lane) failures.push(`filed in lane "${item.lane}", expected "${e.filed.lane}"`);
      if (e.filed.needsApproval && !item.required_action) failures.push("filed without an action to approve, so nobody would be asked");
      if (e.filed.titleIncludesAny && !e.filed.titleIncludesAny.some((w) => item.title.toLowerCase().includes(w.toLowerCase()))) {
        failures.push(`title "${item.title}" names none of ${e.filed.titleIncludesAny.join(", ")}`);
      }
    }
  }
  if (e.remembered === "none" && outcome.remembered.length > 0) {
    failures.push(`remembered something it should not have: "${outcome.remembered[0]}"`);
  }
  if (e.remembered && e.remembered !== "none") {
    const all = outcome.remembered.join(" ").toLowerCase();
    if (!e.remembered.includesAny.some((w) => all.includes(w.toLowerCase()))) {
      failures.push(outcome.remembered.length ? `remembered "${outcome.remembered[0]}", which does not say ${e.remembered.includesAny.join(" or ")}` : "remembered nothing");
    }
  }
  if (e.replyIncludesAny && !e.replyIncludesAny.some((w) => outcome.reply.toLowerCase().includes(w.toLowerCase()))) {
    failures.push(`reply mentions none of ${e.replyIncludesAny.join(", ")}`);
  }
  if (e.replyExcludesAny) {
    const said = e.replyExcludesAny.find((w) => outcome.reply.toLowerCase().includes(w.toLowerCase()));
    if (said) failures.push(`reply claims "${said}", which it cannot do`);
  }
  if (e.statusesUnchanged && outcome.statusesChanged) failures.push("an open item changed status");

  return failures;
}
