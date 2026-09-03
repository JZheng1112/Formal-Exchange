import { Linking } from "react-native";
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
