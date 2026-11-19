# Pikooo Android — offline com IA embutida (v0.2)

Este Android APK contém a interface, Qwen2.5-0.5B-Instruct GGUF Q4_K_M e motor llama.cpp em CPU arm64. Após a instalação, o Pikooo copia o modelo dos assets do APK para armazenamento privado ao iniciar pela primeira vez e o carrega sem internet. **Não é necessário instalar modelo, WebGPU, serviços, contas, API keys, nem downloads adicionais.**

A instalação do APK é confirmada pelo Android (não há instalação silenciosa). Em versões anteriores de teste assinadas com chave debug diferente, pode ser necessário desinstalar o APK anterior antes de instalar esta versão.

## Tamanho e requisitos

- APK é grande (~500 MB + runtime), devido ao modelo incluso. Reserve espaço adicional para a cópia do modelo (mínimo 600 MB livres) e memória RAM.
- Android 8+ em **arm64-v8a**; inferência em CPU, desempenho varia conforme o dispositivo.
- Qwen 0.5B pode cometer erros, ter limitações no jopará e produzir conteúdos inadequados: **ainda não lançar para menores sem validação de segurança e supervisão**.
- UI e conversas locais; histórico apenas durante a sessão como no site original.
- O site público continua com seu modo WebGPU e descarga inicial por demanda; apenas o APK v0.2 traz tudo pronto.
- Licenças: Qwen2.5 = Apache 2.0; llama-android = MIT; llama.cpp = MIT. Consulte o código-fonte e avisos upstream.

## Construir localmente

Requer JDK 17, Android SDK 35, Gradle 8.10.2.

1. Copie `index.html`, `app.js`, `styles.css`, `favicon.svg`, `llm-worker.js` para `android/app/src/main/assets`, e `lib/*.js` para `android/app/src/main/assets/lib`.
2. Baixe `https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf` para `android/app/src/main/assets/models/qwen2.5-0.5b-instruct-q4_k_m.gguf`.
3. Rode `cd android && gradle assembleDebug`.

Workflow GitHub Actions `.github/workflows/android-offline-apk.yml` prepara tudo e faz upload do APK verificado e release de teste.

Não afirmamos teste da inferência em dispositivos reais até testá-la efetivamente em um aparelho compatível.
