# Pikooo 🇵🇾 — IA local sem API

Pikooo é um chat mobile-first em espanhol paraguaio, com jopará e abreviações informais naturais. **A IA roda no navegador da pessoa**, não em um servidor.

## Como funciona

- Interface estática na Vercel, sem necessidade de `GEMINI_API_KEY` ou qualquer outra chave de inferência.
- Após clicar em **Activar IA**, o navegador baixa os arquivos do WebLLM e um modelo aberto Qwen2.5-0.5B-Instruct quantizado.
- Usa WebGPU no dispositivo: variante f16 se disponível, caso contrário f32.
- Os arquivos do modelo ficam em cache do navegador, quando permitido; após o carregamento, as respostas são processadas localmente.
- A primeira instalação envolve **centenas de megabytes** de download e o modelo usa cerca de **1 GB de memória de GPU**. A execução pode ser lenta ou falhar em celulares modestos. WebGPU e HTTPS são necessários.
- As conversas são salvas somente em `sessionStorage` no navegador durante a sessão atual. Não há conta, banco, WhatsApp nem histórico compartilhado.
- A interface avisa explicitamente quando um aparelho não é compatível, em vez de simular IA.

## Publicação

O GitHub `busca-la/Pikooo` já está ligado à Vercel. Qualquer push em `main` deve gerar deploy pelo Git integration do projeto, se estiver habilitado. **Framework: Other; build command vazio; diretório raiz: .**. Nenhuma variável de ambiente necessária.

## Aviso importante para lançamento ao público

Este é um **piloto técnico**, não um chatbot já validado para uso irrestrito por crianças/adolescentes. Modelos locais pequenos podem inventar informações, usar guarani incorretamente ou gerar respostas inadequadas; instruções de segurança e bloqueios por palavras-chave não equivalem a moderação confiável. Faça testes com supervisão de um responsável antes de divulgar para menores. Reveja requisitos legais de consentimento e proteção de dados.

`llm-worker.js` importa WebLLM 0.2.89 de CDN público, e os pesos são baixados de servidores públicos do modelo. Não há custo de API por mensagem, mas **há custos de tráfego da hospedagem/CDN, energia, conexão e armazenamento no aparelho**. Modelos e bibliotecas de terceiros têm licenças próprias.

## Testes

```bash
npm test
node --check app.js
node --check llm-worker.js
node --check lib/local-ai.js
```

Os testes automáticos validam a estrutura e a lógica, **não testam a geração real** em celular WebGPU. Esse teste depende de um dispositivo compatível.
