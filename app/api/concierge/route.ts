import { conciergeSystemPrompt } from "@/lib/concierge";
import { isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const MODEL = process.env.CONCIERGE_MODEL || "claude-haiku-4-5-20251001";
const MAX_TURNS = 12;
const MAX_CHARS = 600;

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
 * Concierge chat: answers guests' questions from the site's live data with
 * Claude, streamed back as plain text. Needs ANTHROPIC_API_KEY.
 */
export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return new Response("The chat is not set up yet.", { status: 503 });

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
  // the API wants the conversation to start with the guest
  while (messages[0]?.role === "assistant") messages.shift();

  const locale = body.locale && isLocale(body.locale) ? body.locale : "en";
  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 400, stream: true, system: await conciergeSystemPrompt(locale), messages }),
  });
  if (!upstream.ok || !upstream.body) {
    console.error("[concierge]", upstream.status, await upstream.text().catch(() => ""));
    return new Response("Sorry, the chat is unavailable right now.", { status: 502 });
  }

  // Server-sent events from the API → plain text chunks for the browser.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  const stream = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          try {
            const evt = JSON.parse(line.slice(5));
            if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") controller.enqueue(encoder.encode(evt.delta.text));
          } catch {}
        }
      },
    }),
  );
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
