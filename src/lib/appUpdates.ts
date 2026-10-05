import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { Alert, Platform } from "react-native";

type Text = (english: string, chinese: string) => string;

/** Over-the-air updates only exist in a store or internal build. */
export function updatesSupported() {
  return Platform.OS !== "web" && !__DEV__ && Updates.isEnabled;
}

/**
 * The installed version and the date of the code it is running, so people
 * can tell whether they are on the latest release.
 */
export function versionLabel(language: "en" | "zh") {
  const version = Constants.expoConfig?.version ?? "";
  const created = Updates.createdAt;
  if (!created || Updates.isEmbeddedLaunch) return version;
  const day = created.toISOString().slice(0, 10);
  return language === "zh" ? `${version} · 更新于 ${day}` : `${version} · updated ${day}`;
}

/**
 * Checks the update server and downloads anything newer. Returns the
 * update's id when one is ready to run, otherwise an empty string.
 */
export async function downloadUpdate() {
  const result = await Updates.checkForUpdateAsync();
  if (!result.isAvailable) return "";
  // Fetch even if the launch-time check already downloaded it; in that case
  // isNew is false but the update is still waiting to run.
  await Updates.fetchUpdateAsync();
  return result.manifest?.id ?? "available";
}

export function offerRestart(text: Text) {
  Alert.alert(
    text("A new version is ready", "有新版本可用"),
    text(
      "Tap Update now and the app restarts into the new version in a few seconds. Anything you were typing is not saved, so finish it first if you need to.\n\nChoose Later and you will be asked again next time you return to the app. You can also update any time from My profile → Settings → Check for updates.",
      "点「立即更新」，APP 会在几秒内自动重启到新版。正在填写的内容不会保存，需要的话先填完再更新。\n\n选「稍后」，下次回到 APP 时会再提醒；也可以随时在「我的资料 → 设置 → 检查更新」里手动更新。",
    ),
    [
      { text: text("Later", "稍后"), style: "cancel" },
      { text: text("Update now", "立即更新"), onPress: () => { Updates.reloadAsync().catch(() => {}); } },
    ],
  );
}

/** The manual "Check for updates" action. */
export async function checkForUpdatesNow(text: Text) {
  if (!updatesSupported()) {
    Alert.alert(
      text("Always up to date", "已是最新"),
      text("The website loads the latest version every time you open it.", "网页版每次打开都是最新版本。"),
    );
    return;
  }
  try {
    const id = await downloadUpdate();
    if (id) offerRestart(text);
    else Alert.alert(text("You're up to date", "已是最新版本"), text("You already have the latest version.", "你使用的已经是最新版本。"));
  } catch {
    Alert.alert(
      text("Could not check for updates", "无法检查更新"),
      text("Check your internet connection and try again.", "请检查网络连接后重试。"),
    );
  }
}
