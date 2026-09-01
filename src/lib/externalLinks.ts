import { Linking } from "react-native";
import type { AppLanguage } from "./language";

const MARKET_URL = "https://liuxuejishi.com";

// The English route used to go through Google's translate.goog proxy. It does
// answer, but it took over seven seconds from the UK and that proxy is often
// refused outright in a mobile webview, so to a user the link simply did not
// open. Both languages now go to the real site, which responds in about three
// seconds; Safari and Chrome both offer to translate a Chinese page on arrival.
export function openHomeItemsMarket(_language: AppLanguage) {
  return Linking.openURL(MARKET_URL);
}
