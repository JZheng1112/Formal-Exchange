import { Alert, Linking } from "react-native";
import type { AppLanguage } from "./language";

const MARKET_URL = "https://liuxuejishi.com";

// The English route used to go through Google's translate.goog proxy. It does
// answer, but it took over seven seconds from the UK and that proxy is often
// refused outright in a mobile webview, so to a user the link simply did not
// open. Both languages now go to the real site, which responds in about three
// seconds; Safari and Chrome both offer to translate a Chinese page on arrival.
//
// The proxy could not have delivered a translation anyway: liuxuejishi.com
// renders its content client-side and sets <base href> back to its own origin,
// so the proxy returns the untranslated shell and the page stays in Chinese.
// The labels no longer promise a translation.
export function openHomeItemsMarket(_language: AppLanguage) {
  return Linking.openURL(MARKET_URL);
}

const APP_STORE_URL = "https://apps.apple.com/gb/app/formal-exchange/id6806546708";

type Translate = (en: string, zh: string) => string;

/**
 * "Download app" on the web landing page. iOS is live; Android is not on
 * Google Play yet, so an Android browser gets a plain message rather than
 * being sent to an App Store page it cannot use.
 */
export function openAppStore(text: Translate) {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/android/i.test(ua)) {
    Alert.alert(
      text("Android coming soon", "Android 版即将上线"),
      text(
        "The iOS app is on the App Store now. The Android release is in preparation — the full web app works on any phone in the meantime.",
        "iOS 版已上架 App Store，Android 版正在准备中。目前完整网页版可在任何手机上使用。"
      )
    );
    return;
  }
  return Linking.openURL(APP_STORE_URL);
}
