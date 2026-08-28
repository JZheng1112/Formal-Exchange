import { Linking } from "react-native";
import type { AppLanguage } from "./language";

const MARKET_URL = "https://liuxuejishi.com";
// Open the translated proxy directly so English-mode users do not briefly land
// on the untranslated Chinese site first.
const MARKET_ENGLISH_URL = "https://liuxuejishi-com.translate.goog/?_x_tr_sl=zh-CN&_x_tr_tl=en&_x_tr_hl=en-GB";

export function openHomeItemsMarket(language: AppLanguage) {
  return Linking.openURL(language === "en" ? MARKET_ENGLISH_URL : MARKET_URL);
}
