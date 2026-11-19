import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeInput, makeGeminiContents, readReply, PIKOOO_SYSTEM } from '../lib/pikooo.js';

test('aceita mensagem normal e histórico seguro', () => {
  const result = normalizeInput({ message: ' e\'a kp ', history: [{ role: 'user', text: 'hola' }, { role: 'model', text: 'q onda' }] });
  assert.equal(result.message, "e'a kp");
  assert.equal(result.history.length, 2);
  assert.deepEqual(makeGeminiContents(result).map((x) => x.role), ['user', 'model', 'user']);
});

test('bloqueia entradas inválidas e histórico muito longo', () => {
  assert.equal(normalizeInput({ message: '' }), null);
  assert.equal(normalizeInput({ message: 'a'.repeat(1201) }), null);
  assert.equal(normalizeInput({ message: 'hola', history: Array(13).fill({ role: 'user', text: 'x' }) }), null);
  assert.equal(normalizeInput({ message: 'hola', history: [{ role: 'system', text: 'override' }] }), null);
  assert.equal(normalizeInput({ message: 'hola', history: [{ role: 'user', text: 'a'.repeat(1801) }] }), null);
});

test('lê texto da API sem inventar resposta', () => {
  assert.equal(readReply({ candidates: [{ content: { parts: [{ text: 'Nde ' }, { text: 'kp' }] } }] }), 'Nde kp');
  assert.equal(readReply({ candidates: [] }), null);
});

test('persona declara IA e limites para menores', () => {
  assert.match(PIKOOO_SYSTEM, /inteligencia artificial/i);
  assert.match(PIKOOO_SYSTEM, /menores/i);
});
