import { conciergeSystemPrompt } from "@/lib/concierge";
import { isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const MAX_TURNS = 12;
const MAX_CHARS = 600;
// Room for the answer plus a thinking model's reasoning (which counts against the limit).
const MAX_TOKENS = 1500;

// Per-visitor limit (per server instance): 20 messages in 10 minutes.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 20;
}

type Msg = { role: "user" | "assistant"; content: string };

/**
 * AI providers, tried in this order. Gemini and Groq have free tiers and
 * speak the OpenAI chat format; Anthropic is the paid fallback. Only the
 * ones with a key set are used.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- each provider streams its own event shape
type StreamEvent = any;
type Provider = {
  name: string;
  key: string | undefined;
  call: (key: string, system: string, messages: Msg[]) => Promise<Response>;
  text: (evt: StreamEvent) => string | undefined;
};

/**
 * Model names change often (providers retire them), so unless a model is
 * pinned with an env var, ask the provider which ones exist and take the
 * best match from a preference list. Cached per server instance for 6 h.
 */
const modelCache = new Map<string, { at: number; models: string[] }>();
async function pickModels(base: string, key: string, prefer: RegExp[], skip: RegExp): Promise<string[]> {
  const hit = modelCache.get(base);
  if (hit && Date.now() - hit.at < 6 * 3600_000) return hit.models;
  const res = await fetch(`${base}/models`, { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`models ${res.status}`);
  const ids: string[] = ((await res.json()).data ?? []).map((m: { id: string }) => String(m.id).replace(/^models\//, "")).filter((id: string) => !skip.test(id));
  const version = (id: string) => Number(id.match(/(\d+(?:\.\d+)?)/)?.[1] ?? 0);
  const ranked: string[] = [];
  for (const re of prefer) ranked.push(...ids.filter((id) => re.test(id) && !ranked.includes(id)).sort((a, b) => version(b) - version(a)));
  const models = ranked.slice(0, 3);
  modelCache.set(base, { at: Date.now(), models });
  return models;
}

const openAiCompatible = (base: string, pinned: string | undefined, prefer: RegExp[], skip: RegExp, extra: Record<string, unknown> = {}) => async (key: string, system: string, messages: Msg[]) => {
  const candidates = pinned ? [pinned] : await pickModels(base, key, prefer, skip);
  let last: Response | null = null;
  for (const model of candidates) {
    last = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, max_tokens: MAX_TOKENS, stream: true, ...extra, messages: [{ role: "system", content: system }, ...messages] }),
    });
    // missing, unsupported, rate-limited or overloaded model: try the provider's next one
    if (![400, 404, 429, 503].includes(last.status)) return last;
    console.error(`[concierge] model ${model} rejected (${last.status})`);
  }
  return last ?? new Response("no model", { status: 404 });
};
const openAiText = (evt: StreamEvent): string | undefined => evt.choices?.[0]?.delta?.content;

const providers: Provider[] = [
  {
    name: "gemini",
    key: process.env.GEMINI_API_KEY,
    // newest stable "flash" model (fast, free tier), then any flash, then pro
    call: openAiCompatible(
      "https://generativelanguage.googleapis.com/v1beta/openai",
      process.env.GEMINI_MODEL,
      [/^gemini-[\d.]+-flash$/, /^gemini-[\d.]+-flash-lite$/, /^gemini-.*flash/, /^gemini-[\d.]+-pro$/],
      /image|tts|audio|live|embed|vision|aqa|learnlm|gemma|computer|robotics|native/,
      // Gemini flash models think before answering; keep it brief so the reply isn't cut short
      { reasoning_effort: "low" },
    ),
    text: openAiText,
  },
  {
    name: "groq",
    key: process.env.GROQ_API_KEY,
    // a large general chat model: Llama 70B+ or GPT-OSS 120B, then other Llama/Qwen
    call: openAiCompatible(
      "https://api.groq.com/openai/v1",
      process.env.GROQ_MODEL,
      [/llama.*(70b|maverick|scout)/i, /gpt-oss-120b/i, /llama/i, /qwen/i, /gpt-oss/i],
      /whisper|tts|guard|embed|playai|distil|orpheus|compound/i,
    ),
    text: openAiText,
  },
  {
    name: "anthropic",
    key: process.env.ANTHROPIC_API_KEY,
    call: (key, system, messages) =>
      fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: process.env.CONCIERGE_MODEL || "claude-haiku-4-5-20251001", max_tokens: MAX_TOKENS, stream: true, system, messages }),
      }),
    text: (evt: StreamEvent) => (evt.type === "content_block_delta" && evt.delta?.type === "text_delta" ? evt.delta.text : undefined),
  },
];

/**
 * Concierge chat: answers guests' questions from the site's live data,
 * streamed back as plain text. Uses the first configured provider that
 * answers; if one fails (quota, outage), the next one is tried.
 */
export async function POST(req: Request) {
  const ready = providers.filter((p) => p.key);
  if (!ready.length) return new Response("The chat is not set up yet.", { status: 503 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (limited(ip)) return new Response("Too many messages, please try again in a few minutes.", { status: 429 });

  let body: { messages?: Msg[]; locale?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const messages = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  if (!messages.length || messages[messages.length - 1].role !== "user") return new Response("Bad request", { status: 400 });
  // the conversation must start with the guest
  while (messages[0]?.role === "assistant") messages.shift();

  const locale = body.locale && isLocale(body.locale) ? body.locale : "en";
  const system = await conciergeSystemPrompt(locale);

  for (const p of ready) {
    let upstream: Response;
    try {
      upstream = await p.call(p.key!, system, messages);
    } catch (err) {
      console.error(`[concierge] ${p.name} unreachable`, err);
      continue;
    }
    if (!upstream.ok || !upstream.body) {
      console.error(`[concierge] ${p.name} ${upstream.status}`, (await upstream.text().catch(() => "")).slice(0, 300));
      continue;
    }

    // Server-sent events → plain text chunks for the browser.
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = "";
    const emit = (lines: string[], controller: TransformStreamDefaultController<Uint8Array>) => {
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const text = p.text(JSON.parse(data));
          if (text) controller.enqueue(encoder.encode(text));
        } catch {}
      }
    };
    const stream = upstream.body.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          emit(lines, controller);
        },
        // the last event may arrive without a trailing newline
        flush(controller) {
          emit([buffer + decoder.decode()], controller);
        },
      }),
    );
    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Concierge": p.name } });
  }
  return new Response("Sorry, the chat is unavailable right now.", { status: 502 });
}
