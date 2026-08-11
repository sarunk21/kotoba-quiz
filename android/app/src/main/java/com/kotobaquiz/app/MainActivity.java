package com.kotobaquiz.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(StreakWidgetPlugin.class);
    super.onCreate(savedInstanceState);
  }

  @Override
  public void onBackPressed() {
    if (this.bridge != null && this.bridge.getWebView() != null && this.bridge.getWebView().canGoBack()) {
      this.bridge.getWebView().goBack();
    } else {
      super.onBackPressed();
    }
  }
}

