package com.studiorad.tarefaswhatsapp;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView webView;
    private String pendingSection = "";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        if (Build.VERSION.SDK_INT >= 21) {
            getWindow().setStatusBarColor(Color.TRANSPARENT);
            getWindow().setNavigationBarColor(Color.TRANSPARENT);
        }
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_FULLSCREEN |
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );

        if (Build.VERSION.SDK_INT >= 33 &&
                checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1001);
        }

        pendingSection = getIntent() != null ? getIntent().getStringExtra("open_section") : "";

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        webView.addJavascriptInterface(new AndroidBridge(), "AndroidApp");
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (pendingSection != null && !pendingSection.isEmpty()) {
                    view.evaluateJavascript("if(window.openFromAndroid){openFromAndroid('" + pendingSection + "');}", null);
                    pendingSection = "";
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith("https://wa.me/") || url.startsWith("whatsapp://")) {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                    return true;
                }
                return false;
            }
        });

        NotificationScheduler.ensureChannel(this);
        NotificationScheduler.showStatusNotification(this);
        webView.loadUrl("file:///android_asset/index.html");
    }

    public class AndroidBridge {
        @JavascriptInterface
        public void saveDailyReport(String report, String time) {
            NotificationScheduler.saveReport(MainActivity.this, report, time);
            NotificationScheduler.scheduleDaily(MainActivity.this, time);
        }

        @JavascriptInterface
        public void updateStatusNotification(String summary, String detail) {
            NotificationScheduler.saveStatus(MainActivity.this, summary, detail);
            NotificationScheduler.showStatusNotification(MainActivity.this);
        }

        @JavascriptInterface
        public void scheduleTaskReminder(String title, String detail, String date, String time, String taskId) {
            NotificationScheduler.scheduleTaskReminder(MainActivity.this, title, detail, date, time, taskId);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        pendingSection = intent != null ? intent.getStringExtra("open_section") : "";
        if (webView != null && pendingSection != null && !pendingSection.isEmpty()) {
            webView.evaluateJavascript("if(window.openFromAndroid){openFromAndroid('" + pendingSection + "');}", null);
            pendingSection = "";
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
}
