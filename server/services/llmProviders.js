/**
 * Free local inference via Ollama (https://ollama.com) — no API bill.
 * Install: ollama.com/download → then:
 *   ollama pull nomic-embed-text
 *   ollama pull llama3.2
 */

const DEFAULT_OLLAMA = 'http://127.0.0.1:11434';

export function ollamaBaseUrl() {
  return (process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA).replace(/\/$/, '');
}

export function ollamaEmbedModel() {
  return process.env.OLLAMA_EMBED_MODEL?.trim() || 'nomic-embed-text';
}

export function ollamaChatModel() {
  return process.env.OLLAMA_CHAT_MODEL?.trim() || 'llama3.2';
}

/** @param {string} text */
export async function ollamaEmbed(text) {
  const base = ollamaBaseUrl();
  const model = ollamaEmbedModel();
  const slice = String(text).slice(0, 8000);

  let res = await fetch(`${base}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input: slice }),
  });

  if (res.ok) {
    const data = await res.json();
    const emb = Array.isArray(data.embeddings?.[0])
      ? data.embeddings[0]
      : data.embedding;
    if (Array.isArray(emb)) return emb;
  } else if (res.status !== 404) {
    const t = await res.text();
    throw new Error(`Ollama embed ${res.status}: ${t.slice(0, 200)}`);
  }

  res = await fetch(`${base}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: slice }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Ollama embed ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const emb = data.embedding ?? data.embeddings?.[0];
  if (!Array.isArray(emb)) {
    throw new Error('Ollama returned no embedding array');
  }
  return emb;
}

/**
 * @param {{ role: string, content: string }[]} messages
 * @returns {Promise<string>}
 */
export async function ollamaChat(messages, model = ollamaChatModel()) {
  const base = ollamaBaseUrl();
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: { temperature: 0.7 },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Ollama chat ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const msg = data.message?.content;
  if (typeof msg === 'string') return msg;
  if (Array.isArray(msg)) {
    return msg.map((p) => (typeof p === 'string' ? p : p?.text ?? '')).join('');
  }
  return String(msg ?? '');
}
