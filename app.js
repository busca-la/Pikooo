import { buildLocalMessages, safeOfflineReply, textFromCompletion } from './lib/local-ai.js';

const $ = (id) => document.getElementById(id);
const messagesElement = $('chatMessages');
const input = $('messageInput');
const form = $('chatForm');
const sendButton = $('sendButton');
const typingIndicator = $('typingIndicator');
const suggestions = $('suggestions');
const resetButton = $('resetButton');
const dialog = $('privacyDialog');
const activateButton = $('activateAIButton');
const setupPanel = $('localAISetup');
const setupTitle = $('aiSetupTitle');
const setupText = $('aiSetupText');
const progressWrap = $('aiProgressWrap');
const progressBar = $('aiProgressBar');

const STORAGE_KEY = 'pikooo-chat-v1';
const MODEL_F16 = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';
const MODEL_F32 = 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC';
const WEBLLM_CDN = 'https://esm.run/@mlc-ai/web-llm@0.2.89';
const greeting = { role: 'model', text: "E'a, apareciste 👀\nsoy Pikooo, una IA con onda de acá. ¿Qué contás?", intro: true, time: '' };

let messages = restore();
let sending = false;
let loading = false;
let engine = null;
let worker = null;
let loadedModel = null;

function restore() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    if (Array.isArray(stored) && stored.length > 0 && stored.length <= 40 &&
        stored.every((item) => ['user', 'model'].includes(item.role) && typeof item.text === 'string' && item.text.length < 3000)) {
      return stored;
    }
  } catch {}
  return [{ ...greeting }];
}

function persist() {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30))); } catch {}
}

function stamp() {
  return new Intl.DateTimeFormat('es-PY', { hour: '2-digit', minute: '2-digit' }).format(new Date());
}

function addMessage(role, text, extra = {}) {
  messages.push({ role, text, time: stamp(), ...extra });
  persist();
  render();
}

function render() {
  const fragment = document.createDocumentFragment();
  const date = document.createElement('div');
  date.className = 'conversation-date';
  date.textContent = 'HOY, SIN VUELTAS';
  fragment.append(date);
  for (const message of messages) {
    const outer = document.createElement('div');
    outer.className = 'message ' + (message.role === 'user' ? 'user' : 'bot') + (message.error ? ' error' : '');
    const bubble = document.createElement('div');
    bubble.className = 'message-content';
    bubble.textContent = message.text;
    outer.append(bubble);
    if (message.time) {
      const time = document.createElement('span');
      time.className = 'message-time';
      time.textContent = message.time;
      outer.append(time);
    }
    fragment.append(outer);
  }
  messagesElement.replaceChildren(fragment);
  suggestions.hidden = messages.some((message) => message.role === 'user');
  messagesElement.scrollTop = messagesElement.scrollHeight;
}

function updateControls() {
  input.disabled = !engine || sending;
  input.placeholder = engine ? 'Escribí nomás lo que quieras...' : 'Primero activá la IA gratis...';
  sendButton.disabled = !engine || sending || !input.value.trim();
  for (const suggestion of document.querySelectorAll('.suggestion')) suggestion.disabled = !engine || sending;
  resetButton.disabled = sending || loading;
}

function resizeTextarea() {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 130) + 'px';
}

function updateLoadProgress(progress) {
  const percentage = Math.max(0, Math.min(100, Math.floor((Number(progress?.progress) || 0) * 100)));
  progressBar.style.width = percentage + '%';
  progressWrap.setAttribute('aria-valuenow', String(percentage));
  // Do not display untrusted internal source URLs/paths from the model runtime.
  setupText.textContent = percentage > 0
    ? `Descargando / preparando la IA: ${percentage}% · no cierres esta pestaña`
    : 'Preparando la IA local... la primera descarga puede tardar bastante.';
}

async function activateLocalAI() {
  if (loading || engine) return;
  loading = true;
  activateButton.disabled = true;
  setupPanel.classList.remove('error');
  setupTitle.textContent = 'Preparando tu IA local';
  progressWrap.hidden = false;
  progressBar.style.width = '0%';
  setupText.textContent = 'Verificando el navegador...';
  updateControls();

  try {
    if (!window.isSecureContext || !navigator.gpu) throw new Error('Tu navegador no tiene WebGPU. Probá con Chrome o Edge actualizado en un celular compatible.');
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) throw new Error('No hay GPU compatible disponible. Este modo gratis necesita WebGPU.');
    const modelId = adapter.features.has('shader-f16') ? MODEL_F16 : MODEL_F32;

    const webllm = await import(WEBLLM_CDN);
    worker = new Worker(new URL('./llm-worker.js', import.meta.url), { type: 'module' });
    const instance = await webllm.CreateWebWorkerMLCEngine(worker, modelId, {
      initProgressCallback: updateLoadProgress
    });
    engine = instance;
    loadedModel = modelId;
    setupPanel.classList.add('ready');
    setupTitle.textContent = 'Tu IA ya está funcionando ✳';
    setupText.textContent = 'Sin API ni cobro por mensaje · las respuestas se generan en este dispositivo.';
    activateButton.hidden = true;
    progressWrap.hidden = true;
    input.focus({ preventScroll: true });
  } catch (error) {
    console.error('Pikooo local AI initialization:', error);
    engine = null;
    loadedModel = null;
    if (worker) { worker.terminate(); worker = null; }
    setupPanel.classList.add('error');
    setupTitle.textContent = 'Todavía no pude activar la IA';
    setupText.textContent = error?.message || 'Falta memoria, espacio o compatibilidad. Probá con un navegador actualizado.';
    activateButton.textContent = 'Reintentar ↗';
    activateButton.disabled = false;
  } finally {
    loading = false;
    updateControls();
  }
}

function setSending(value) {
  sending = value;
  typingIndicator.hidden = !value;
  updateControls();
  if (value) messagesElement.scrollTop = messagesElement.scrollHeight;
}

async function send(textOverride) {
  const text = String(textOverride ?? input.value).trim().slice(0, 1200);
  if (!text || sending || !engine) return;
  input.value = '';
  resizeTextarea();
  const previous = messages.filter((msg) => !msg.intro && !msg.error);
  addMessage('user', text);
  setSending(true);

  try {
    const protectedReply = safeOfflineReply(text);
    if (protectedReply) {
      addMessage('model', protectedReply);
      return;
    }
    const completion = await engine.chat.completions.create({
      messages: buildLocalMessages(previous, text),
      temperature: 0.8,
      top_p: 0.9,
      max_tokens: 175
    });
    const reply = textFromCompletion(completion);
    if (!reply) throw new Error('La IA no generó una respuesta clara. Probá reformular.');
    addMessage('model', reply);
  } catch (error) {
    console.error('Pikooo local generation:', error);
    addMessage('model', 'La IA local tuvo un problema (puede faltar memoria). Cerrá otras pestañas y probá de nuevo, kp.', { error: true });
  } finally {
    setSending(false);
    input.focus({ preventScroll: true });
  }
}

form.addEventListener('submit', (event) => { event.preventDefault(); send(); });
input.addEventListener('input', () => { resizeTextarea(); updateControls(); });
input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    send();
  }
});
activateButton.addEventListener('click', activateLocalAI);
for (const suggestion of document.querySelectorAll('.suggestion')) {
  suggestion.addEventListener('click', () => send(suggestion.dataset.message));
}
resetButton.addEventListener('click', () => {
  if (sending || loading) return;
  if (messages.length > 1 && !window.confirm('¿Borramos la charla y empezamos de cero?')) return;
  messages = [{ ...greeting }];
  persist();
  render();
  input.focus();
});
$('privacyButton').addEventListener('click', () => dialog.showModal());
$('closePrivacy').addEventListener('click', () => dialog.close());
$('privacyOk').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
render();
updateControls();
