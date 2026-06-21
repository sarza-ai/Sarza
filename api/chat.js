/* ============================================================
   Sarza AI — chat proxy (Vercel serverless function)
   Primary:  self-hosted Ollama  (OLLAMA_URL env var)
   Fallback: Anthropic Claude    (ANTHROPIC_API_KEY env var)
   The browser only ever talks to this same-origin route —
   neither key is ever exposed to the client.

   Vercel environment variables:
     OLLAMA_URL          Base URL of your Ollama server (primary)
     OLLAMA_MODEL        Model to use on Ollama (default: llama3.1)
     OLLAMA_AUTH         Optional bearer token for Ollama
     ANTHROPIC_API_KEY   Anthropic key (fallback when Ollama is down)
     CLAUDE_MODEL        Claude model ID (default: claude-haiku-4-5-20251001)
   ============================================================ */

const SYSTEM_PROMPT = `You are the Sarza AI assistant, a friendly virtual agent on sarza.ai.

About Sarza AI: an AI integration and automation consultancy that works exclusively with
small businesses — automating repetitive work, deploying 24/7 AI customer support, running
AI audits & roadmaps, building AI content systems, training teams, and offering ongoing
retainers. Every engagement starts with a FREE 30-minute discovery call; pricing is scoped
per business (there are NO fixed packages). Most projects pay for themselves within 30–90 days.

How to respond:
- Be concise, warm, and practical. Plain language, no hype or jargon. 2–4 short sentences.
- Help visitors understand what Sarza does and figure out where AI could help them.
- Encourage booking the free call. The booking page is /contact and the email is hello@sarza.ai.
- NEVER invent specific prices, numbers, timelines, client names, or guarantees. If asked for
  exact pricing, explain it's scoped per business after the free discovery call.
- If you don't know something or it's outside Sarza's scope, say so and point them to the
  contact page or email.
- You may suggest relevant pages: /services and the blog at /blog.`;

function sanitise(incoming) {
  return (Array.isArray(incoming) ? incoming : [])
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .slice(-12)
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content.slice(0, 2000),
    }));
}

async function tryOllama(messages) {
  const base = process.env.OLLAMA_URL || process.env.OLLAMA_BASE_URL;
  if (!base) return null;

  const headers = { 'Content-Type': 'application/json' };
  if (process.env.OLLAMA_AUTH) headers.Authorization = `Bearer ${process.env.OLLAMA_AUTH}`;

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(base.replace(/\/+$/, '') + '/api/chat', {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'llama3.1',
        stream: false,
        options: { temperature: 0.4, num_predict: 400 },
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.message?.content || '').trim() || null;
  } catch {
    return null;
  } finally {
    clearTimeout(tid);
  }
}

async function tryClaude(messages) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.content?.[0]?.text || '').trim() || null;
  } catch {
    return null;
  } finally {
    clearTimeout(tid);
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }

  const messages = sanitise(body?.messages);
  if (messages.length === 0) {
    res.status(400).json({ error: 'no_messages' });
    return;
  }

  try {
    const ollamaConfigured = !!(process.env.OLLAMA_URL || process.env.OLLAMA_BASE_URL);
    const claudeConfigured = !!process.env.ANTHROPIC_API_KEY;

    const ollamaReply = await tryOllama(messages);
    const claudeReply = ollamaReply === null ? await tryClaude(messages) : null;
    const reply = ollamaReply ?? claudeReply;

    if (!reply) {
      res.status(503).json({ error: 'offline', debug: { ollamaConfigured, claudeConfigured } });
      return;
    }
    res.status(200).json({ reply });
  } catch (err) {
    res.status(502).json({ error: 'upstream', detail: String(err?.message || err) });
  }
};
