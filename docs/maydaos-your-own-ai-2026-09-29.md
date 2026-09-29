# Your own AI — 29 September 2026

Slice 1 of the second arc: a company chooses which model speaks for its
co-founder and pays for it with its own key. Built the evening the review
shipped, after the owner's decision to store keys server-side ("store them").

## What a founder can do now

In the Company window, an owner sees **Which AI answers**. Until they choose,
the line says the platform's model answers when one is switched on. *Choose
your AI* opens a form: a provider preset (Anthropic; OpenAI; xAI/Grok; Groq;
any OpenAI-compatible endpoint), a model name, an endpoint for the compatible
dialect, a write-only key field, and the two prices per million tokens the
ledger will use — pre-filled for Anthropic's models, required for anything
else. Save, and the next question is answered by that model on that key. The
line then reads, for example, *claude-sonnet-5 on your own key, ending in
mnop. Recorded at $2 in / $10 out per million tokens.* Nobody, the owner
included, can read the key back.

With their own key, the owner may also set the **monthly ceiling** (0–500
dollars); the co-founder stops answering when it is reached. On the
platform's key the ceiling stays ours, as decided on 19 September.
*Stop using my key* removes the setting; the platform's model answers again
if one exists.

## How it is built

- **Vault** (`lib/osKeyVault.ts`): AES-256-GCM under `MAYDAOS_KEY_SECRET`,
  a deployment-environment secret that never enters the database. Stored
  as `v1:<base64 iv|tag|data>` beside the key's last four characters.
  Without the secret, keys cannot be stored and stored keys cannot be
  opened; rotating it invalidates every stored key.
- **Table** (`os_model_settings`, migration `20260930100000_your_own_ai`):
  one row per company; provider, model, endpoint, ciphertext, last four,
  prices, who set it. Column-scoped grants: a member may select everything
  except `key_ciphertext`; no signed-in user may insert, update or delete;
  the service role writes named columns from a verified server action. A
  compatible provider must carry an https endpoint (loopback allowed for a
  developer's own gateway); Anthropic must not.
- **Adapters**: `lib/osCofounderOpenAI.ts` speaks the chat-completions
  dialect over SSE — text deltas, tool-call fragments reassembled in order,
  usage, stop reasons mapped so a token-limit stop stays interrupted. The
  Anthropic adapter now takes its key and model as arguments. Both sit
  behind the same `ModelTurn` seam; the loop does not know which spoke.
- **Choice** (`pickTurn(env, choice)`): the company's own choice first, then
  a local model off Vercel, then the platform's key. `priced: true` and the
  company's own rates for the ledger (`costUsdAt`).
- **Route**: the signed-in read checks whether a choice exists (a failed
  read is a definite refusal — falling back to the platform's model would
  spend the wrong money); only then does the service role read and open the
  key. A vault that cannot open it answers `503 key_unavailable`, which the
  composer shows as a refusal, not an uncertainty.
- **Actions** (`app/actions/model.ts`): save (update, then insert — an upsert
  would ask PostgREST to set the primary key on conflict, which the service
  role deliberately may not; the RLS suite proves it), remove, and set the
  ceiling, all owner-only through the signed-in membership read.

## Verified

- 1,619 tests: vault round-trip and tamper cases; the compatible adapter
  against a scripted server, including that the key never appears in an
  error; the picker's precedence; the route on a company key, a locked
  vault and an unreadable setting; and six new row-level-security tests on
  the real database (a member reads the summary and is refused the
  ciphertext, a non-member sees nothing, no signed-in role can write, the
  owner cannot raise the ceiling through the API, the check constraints
  hold, and the service role cannot upsert).
- Lint, TypeScript, build.
- In the browser on the local stack: the owner's form appeared, a
  fake Anthropic key was saved (summary showed the model and last four; the
  row held ciphertext and `mnop`), and the ceiling form appeared.

## What the owner does

1. Generate a secret and set it in Vercel as `MAYDAOS_KEY_SECRET` (any
   string of at least 32 characters; `openssl rand -base64 32`). I never see
   it.
2. Run the one-migration bundle in the SQL editor.
3. After the deploy, open Company → *Choose your AI*, paste your own
   Anthropic key, save. The production co-founder answers on your key under
   your ceiling. No platform key is needed, then or later.

## Not in this slice

- A "test the key" button: the first real question is the test, and a
  refused key shows as a refusal.
- The worker (`DraftClient`) still uses the platform's model only; the
  scheduled workflows do not yet run on a company's key.
- Per-person choices; the choice is the company's.
