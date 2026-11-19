const $ = (id) => document.getElementById(id);
const messagesElement = $('chatMessages');
const input = $('messageInput');
const form = $('chatForm');
const sendButton = $('sendButton');
const typingIndicator = $('typingIndicator');
const suggestions = $('suggestions');
const resetButton = $('resetButton');
const dialog = $('privacyDialog');

const STORAGE_KEY = 'pikooo-chat-v1';
const greeting = { role: 'model', text: 'E\'a, apareciste 👀\nsoy Pikooo, una IA con onda de acá. ¿Qué contás?', intro: true, time: '' };
let messages = restore();
let sending = false;

function restore() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    if (Array.isArray(stored) && stored.length > 0 && stored.length <= 40 &&
        stored.every((message) => ['user', 'model'].includes(message.role) && typeof message.text === 'string' && message.text.length < 3000)) {
      return stored;
    }
  } catch {}
  return [{ ...greeting }];
}

function persist() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
  } catch {}
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

function updateSendButton() {
  sendButton.disabled = sending || !input.value.trim();
}
function resizeTextarea() {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 130) + 'px';
}
function setSending(value) {
  sending = value;
  typingIndicator.hidden = !value;
  input.disabled = value;
  updateSendButton();
  if (value) {
    messagesElement.scrollTop = messagesElement.scrollHeight;
  }
}

async function send(textOverride) {
  const text = String(textOverride ?? input.value).trim().slice(0, 1200);
  if (!text || sending) return;
  const history = messages.filter((message) => !message.intro && !message.error).slice(-12).map(({ role, text }) => ({ role, text }));
  input.value = '';
  resizeTextarea();
  addMessage('user', text);
  setSending(true);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 32000);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history }),
      signal: controller.signal
    });
    const data = await response.json();
    if (!response.ok || typeof data.reply !== 'string') {
      throw new Error(data.error || 'Pikooo no pudo responder ahora.');
    }
    addMessage('model', data.reply);
  } catch (error) {
    const detail = error.name === 'AbortError'
      ? 'Se demoró demasiado la respuesta. Probá otra vez, kp.'
      : error.message || 'Algo salió mal. Intentá de nuevo.';
    addMessage('model', detail, { error: true });
  } finally {
    clearTimeout(timeout);
    setSending(false);
    input.focus({ preventScroll: true });
  }
}

form.addEventListener('submit', (event) => { event.preventDefault(); send(); });
input.addEventListener('input', () => { resizeTextarea(); updateSendButton(); });
input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    send();
  }
});

for (const suggestion of document.querySelectorAll('.suggestion')) {
  suggestion.addEventListener('click', () => send(suggestion.dataset.message));
}

resetButton.addEventListener('click', () => {
  if (sending) return;
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
updateSendButton();
