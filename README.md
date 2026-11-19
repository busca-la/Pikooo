# Pikooo 🇵🇾

**Tu kp virtual.** Chat mobile-first com personalidade paraguaia (espanhol local, jopará e abreviações naturais), feito para rodar na Vercel.

## Publicar na Vercel

1. Importe **busca-la/Pikooo** em https://vercel.com/new.
2. Deixe **Framework Preset: Other**, **Root Directory: .** e sem comando de build. A página está em `index.html` e a função em `api/chat.js`.
3. Em **Settings → Environment Variables**, adicione `GEMINI_API_KEY` com uma chave obtida pela conta responsável em https://aistudio.google.com/apikey (não coloque a chave no GitHub ou na conversa).
4. Opcional: `GEMINI_MODEL` para escolher outro modelo habilitado na sua conta. O padrão é `gemini-3.1-flash-lite`.
5. Faça redeploy após configurar a variável. **Sem chave, o site abre, mas a IA informa que ainda não está conectada**; não há respostas falsas.

Sem dependências externas para o frontend. `npm test` usa o Node.js 20+. Uma modalidade gratuita de IA pode ter limites e nem toda conta/região tem os mesmos modelos; confira os termos do provedor.

## Privacidade e segurança

- A conversa é armazenada somente em `sessionStorage` durante a sessão desta aba e pode ser apagada com **Nuevo chat**.
- As mensagens e o histórico recente são enviados à função da Vercel e ao provedor de IA para obter respostas.
- A chave fica no servidor, nunca no navegador.
- O prompt obriga o chatbot a se identificar como IA, não solicitar informações pessoais, evitar dependência emocional e lidar com temas delicados adequadamente.
- O rate limit atual é **somente em memória por instância** e NÃO substitui controle distribuído, antifraude e proteção contra uso abusivo. Antes de divulgação ampla, configurar rate limiting distribuído, proteção automatizada, moderação/monitoramento adequada e política de privacidade revisada; por envolver menores, revisar requisitos aplicáveis de consentimento/responsáveis e tratamento de dados.
- Não existe autenticação, contas, memória persistente entre sessões, áudio nem integração com WhatsApp nesta primeira versão.

## Estrutura

- `index.html`, `styles.css`, `app.js` — interface responsiva.
- `api/chat.js` — endpoint seguro da função Vercel.
- `lib/pikooo.js` — personalidade e validação.
- `tests/` — testes de regras e validação de mensagens.
