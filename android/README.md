# Pikooo para Android (APK de teste)

Este projeto Android abre **https://pikooo.vercel.app/** dentro de um WebView com hardware acceleration e JavaScript habilitados. Preserva o site existente, sem API paga, sem conta de usuário e sem servidor de inferência.

**Atenção:** a IA usa WebGPU no dispositivo, que depende do Android System WebView, GPU e drivers. Se a WebView não expuser WebGPU, o app oferece abrir no navegador Chrome. A primeira ativação baixa centenas de MB de pesos do modelo e pode usar cerca de 1 GB de memória da GPU. O APK **não inclui os pesos do modelo** e **não funciona totalmente offline desde a instalação**.

## Construir

Requer JDK 17, Android SDK 35 e Gradle 8.10.2.

```bash
cd android
gradle assembleDebug
```

Resultado: `android/app/build/outputs/apk/debug/app-debug.apk` (assinado com chave de depuração para teste/instalação manual).

O workflow `.github/workflows/android-apk.yml` testa o JavaScript, compila o APK, publica um artefato de Actions e cria uma release *prévia* do APK para baixar.

Pacote: `py.pikooo.app` · Versão: `0.1.0` · Android 8.0+.

Para distribuição em loja, é necessário assinar uma versão release com chave própria e fazer testes reais de compatibilidade, desempenho e segurança com celulares Android. Não há testes reais de WebGPU realizados pelo workflow.
