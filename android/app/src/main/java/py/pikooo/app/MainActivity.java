package py.pikooo.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.webkit.WebViewAssetLoader;

/**
 * Standalone Android Pikooo: all web UI + Qwen model are packaged in the APK.
 * No remote webpage ever receives the PikoooNative Javascript interface.
 */
public final class MainActivity extends Activity {
    private static final String HOME = "https://appassets.androidplatform.net/index.html";
    private static final String LOCAL_HOST = "appassets.androidplatform.net";
    private static final int BG = Color.rgb(16, 21, 20);
    private WebView webView;
    private NativeAiBridge ai;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(BG);
        getWindow().setNavigationBarColor(BG);
        webView = new WebView(this);
        webView.setBackgroundColor(BG);
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .setDomain(LOCAL_HOST)
                .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        ai = new NativeAiBridge(this, webView);
        webView.addJavascriptInterface(ai, "PikoooNative");
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(
                    WebView view, WebResourceRequest request) {
                if ("https".equalsIgnoreCase(request.getUrl().getScheme()) &&
                        LOCAL_HOST.equalsIgnoreCase(request.getUrl().getHost())) {
                    return loader.shouldInterceptRequest(request.getUrl());
                }
                // Do not let a remote resource load into the privileged UI.
                return new WebResourceResponse("text/plain", "UTF-8",
                        new java.io.ByteArrayInputStream(new byte[0]));
            }

            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!request.isForMainFrame()) return true;
                if (isLocal(uri)) {
                    return false;
                }
                if ("https".equalsIgnoreCase(uri.getScheme())) {
                    try {
                        Intent external = new Intent(Intent.ACTION_VIEW, uri);
                        startActivity(external);
                    } catch (ActivityNotFoundException exception) {
                        Toast.makeText(MainActivity.this, "No se pudo abrir el enlace.", Toast.LENGTH_SHORT).show();
                    }
                }
                return true;
            }
        });

        setContentView(webView);
        webView.loadUrl(HOME);
    }

    private boolean isLocal(Uri uri) {
        return "https".equalsIgnoreCase(uri.getScheme()) &&
                LOCAL_HOST.equalsIgnoreCase(uri.getHost());
    }

    @Override @Deprecated public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override protected void onDestroy() {
        if (ai != null) ai.close();
        if (webView != null) {
            webView.removeJavascriptInterface("PikoooNative");
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
