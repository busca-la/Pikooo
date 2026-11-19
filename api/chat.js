import { PIKOOO_SYSTEM, normalizeInput, makeGeminiContents, readReply } from '../lib/pikooo.js';

const MAX_REQUESTS = 12;
const WINDOW_MS = 10 * 60 * 1000;
// Limite básico por instância. Para liberar ao público, adicionar proteção distribuída.
const rateLimit = new Map();

function respond(res, status, payload) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).json(payload);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return respond(res, 405, { error: 'Método no permitido.' });
  }

  if (!(req.headers['content-type'] || '').startsWith('application/json')) {
    return respond(res, 415, { error: 'Se requiere JSON.' });
  }

  if (Number(req.headers['content-length'] || 0) > 30000) {
    return respond(res, 413, { error: 'Mensaje demasiado grande.' });
  }

  const body = normalizeInput(typeof req.body === 'string' ? (() => {
    try { return JSON.parse(req.body); } catch { return null; }
  })() : req.body);

  if (!body) return respond(res, 400, { error: 'Mensaje inválido o demasiado largo.' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return respond(res, 503, { error: 'Pikooo todavía no tiene la IA conectada. Falta configurar GEMINI_API_KEY en Vercel.' });
  }

  const ip = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown').split(',')[0].trim().slice(0, 80);
  const now = Date.now();
  const previous = rateLimit.get(ip);
  const bucket = !previous || now - previous.since > WINDOW_MS ? { since: now, count: 0 } : previous;
  if (bucket.count >= MAX_REQUESTS) return respond(res, 429, { error: 'Ya fueron muchos mensajes seguidos, kp. Probá en unos minutos.' });
  bucket.count += 1;
  rateLimit.set(ip, bucket);
  if (rateLimit.size > 1000) {
    for (const [address, data] of rateLimit) if (now - data.since > WINDOW_MS) rateLimit.delete(address);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

  try {
    const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: PIKOOO_SYSTEM }] },
        contents: makeGeminiContents(body),
        generationConfig: { temperature: 0.95, maxOutputTokens: 500 }
      }),
      signal: controller.signal
    });

    if (!upstream.ok) {
      if (upstream.status === 429) return respond(res, 429, { error: 'La IA llegó a su límite por ahora. Probá después, kp.' });
      if (upstream.status === 401 || upstream.status === 403) return respond(res, 503, { error: 'La conexión de IA todavía necesita ser autorizada.' });
      if (upstream.status === 404) return respond(res, 503, { error: 'El modelo de IA no está disponible para esta cuenta. Revisá GEMINI_MODEL en Vercel.' });
      return respond(res, 502, { error: 'La IA no está respondiendo ahora. Probá de nuevo.' });
    }

    const result = await upstream.json();
    const reply = readReply(result);
    if (!reply) return respond(res, 502, { error: 'No pude generar una respuesta segura a ese mensaje. Intentá reformularlo.' });
    return respond(res, 200, { reply });
  } catch (error) {
    return respond(res, 504, { error: error?.name === 'AbortError' ? 'La IA tardó demasiado en responder. Intentá de nuevo.' : 'No hay conexión con la IA ahora. Intentá de nuevo.' });
  } finally {
    clearTimeout(timeout);
  }
}
