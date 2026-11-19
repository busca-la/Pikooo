package py.pikooo.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

public final class MainActivity extends Activity {
    private static final String START_URL = "https://pikooo.vercel.app/";
    private static final String ALLOWED_HOST = "pikooo.vercel.app";
    private static final int BG = Color.rgb(16, 21, 20);
    private static final int LIME = Color.rgb(201, 244, 106);

    private FrameLayout root;
    private WebView webView;
    private LinearLayout overlay;
    private TextView overlayTitle;
    private TextView overlayMessage;
    private Button openBrowserButton;
    private ProgressBar progress;
    private boolean loadError;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(BG);
        getWindow().setNavigationBarColor(BG);
        getWindow().getDecorView().setSystemUiVisibility(0);

        root = new FrameLayout(this);
        root.setBackgroundColor(BG);
        setContentView(root);

        addWebView();

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setIndeterminate(false);
        progress.setProgressTintList(android.content.res.ColorStateList.valueOf(LIME));
        FrameLayout.LayoutParams progressParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(3), Gravity.TOP);
        root.addView(progress, progressParams);

        createOverlay();
        loadHome();
    }

    private int dp(float value) {
        return Math.round(getResources().getDisplayMetrics().density * value);
    }

    private TextView makeText(String value, int size, int color) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(size);
        view.setTextColor(color);
        view.setGravity(Gravity.CENTER);
        return view;
    }

    private Button makeButton(String value, boolean primary) {
        Button button = new Button(this);
        button.setText(value);
        button.setAllCaps(false);
        button.setTextColor(primary ? BG : Color.WHITE);
        button.setBackgroundTintList(android.content.res.ColorStateList.valueOf(
                primary ? LIME : Color.rgb(49, 58, 56)));
        return button;
    }

    private void createOverlay() {
        overlay = new LinearLayout(this);
        overlay.setBackgroundColor(BG);
        overlay.setGravity(Gravity.CENTER);
        overlay.setOrientation(LinearLayout.VERTICAL);
        overlay.setPadding(dp(28), dp(32), dp(28), dp(32));

        TextView symbol = makeText("p.", 56, LIME);
        overlay.addView(symbol);

        overlayTitle = makeText("", 23, Color.WHITE);
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        titleParams.topMargin = dp(12);
        overlay.addView(overlayTitle, titleParams);

        overlayMessage = makeText("", 15, Color.rgb(174, 188, 182));
        LinearLayout.LayoutParams messageParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        messageParams.topMargin = dp(15);
        overlay.addView(overlayMessage, messageParams);

        Button retryButton = makeButton("Reintentar", true);
        LinearLayout.LayoutParams retryParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(54));
        retryParams.topMargin = dp(28);
        overlay.addView(retryButton, retryParams);
        retryButton.setOnClickListener(v -> loadHome());

        openBrowserButton = makeButton("Abrir en Chrome", false);
        LinearLayout.LayoutParams chromeParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(54));
        chromeParams.topMargin = dp(12);
        overlay.addView(openBrowserButton, chromeParams);
        openBrowserButton.setOnClickListener(v -> openInBrowser());

        root.addView(overlay, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        overlay.setVisibility(View.GONE);
    }

    private void addWebView() {
        webView = new WebView(this);
        webView.setBackgroundColor(BG);
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (progress != null) {
                    progress.setProgress(newProgress);
                    progress.setVisibility(newProgress < 100 ? View.VISIBLE : View.GONE);
                }
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame()) return false;
                Uri uri = request.getUrl();
                if ("https".equalsIgnoreCase(uri.getScheme())
                        && ALLOWED_HOST.equalsIgnoreCase(uri.getHost())) {
                    return false;
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (ActivityNotFoundException ignored) {
                    Toast.makeText(MainActivity.this, "No se puede abrir ese enlace.", Toast.LENGTH_SHORT).show();
                }
                return true;
            }

            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                loadError = false;
                if (progress != null) progress.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (loadError || !isTrustedUrl(url)) return;
                view.evaluateJavascript("Boolean(navigator.gpu)", result -> {
                    if (view != webView || isFinishing() || loadError) return;
                    if ("false".equals(result)) {
                        showOverlay("WebGPU no disponible",
                                "Pikooo necesita WebGPU para generar respuestas en tu celu. Probá abriendo el sitio en Chrome actualizado.",
                                true);
                    } else {
                        overlay.setVisibility(View.GONE);
                    }
                });
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (!request.isForMainFrame()) return;
                loadError = true;
                showOverlay("No pudimos conectarnos",
                        "Revisá tu internet y volvé a intentar. Pikooo necesita conexión para abrir el sitio y descargar la IA por primera vez.",
                        true);
            }

            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                root.removeView(view);
                view.destroy();
                if (view == webView) {
                    addWebView();
                    showOverlay("El celu se quedó sin recursos",
                            "La IA local puede necesitar mucha memoria. Cerrá otras apps e intentá de nuevo.",
                            true);
                }
                return true;
            }
        });

        root.addView(webView, 0, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
    }

    private boolean isTrustedUrl(String url) {
        Uri uri = Uri.parse(url);
        return "https".equalsIgnoreCase(uri.getScheme())
                && ALLOWED_HOST.equalsIgnoreCase(uri.getHost());
    }

    private void showOverlay(String title, String message, boolean showChrome) {
        overlayTitle.setText(title);
        overlayMessage.setText(message);
        openBrowserButton.setVisibility(showChrome ? View.VISIBLE : View.GONE);
        overlay.setVisibility(View.VISIBLE);
        if (progress != null) progress.setVisibility(View.GONE);
    }

    private void loadHome() {
        loadError = false;
        overlay.setVisibility(View.GONE);
        progress.setVisibility(View.VISIBLE);
        webView.loadUrl(START_URL);
    }

    private void openInBrowser() {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(START_URL));
            intent.addCategory(Intent.CATEGORY_BROWSABLE);
            startActivity(intent);
        } catch (ActivityNotFoundException exception) {
            Toast.makeText(this, "Instalá o actualizá Chrome para usar Pikooo.", Toast.LENGTH_LONG).show();
        }
    }

    @Override
    @Deprecated
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            root.removeView(webView);
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
