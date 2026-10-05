import { StatusBar } from "expo-status-bar";
import { Stack, usePathname } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, AppState, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import * as Updates from "expo-updates";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { recordPageView } from "../lib/formalApi";
import { LanguageProvider, useAppLanguage } from "../lib/language";

function CookieConsent() {
  const { text } = useAppLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    try {
      if (!globalThis.localStorage.getItem("cookie_consent")) {
        setVisible(true);
      }
    } catch {}
  }, []);

  function accept() {
    try { globalThis.localStorage.setItem("cookie_consent", "accepted"); } catch {}
    setVisible(false);
  }

  function decline() {
    try { globalThis.localStorage.setItem("cookie_consent", "declined"); } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <View style={cs.banner}>
      <View style={cs.content}>
        <Text style={cs.title}>{text("Cookie & Privacy Notice", "Cookie 和隐私声明")}</Text>
        <Text style={cs.desc}>
          {text(
            "Formal Exchange uses essential cookies to keep you logged in and remember your language preference. We do not use advertising or third-party tracking cookies. By continuing, you agree to our use of essential cookies.",
            "Formal Exchange 使用必要的 Cookie 来保持登录状态和记住语言偏好。我们不使用广告或第三方追踪 Cookie。继续使用即表示你同意我们使用必要的 Cookie。"
          )}
        </Text>
        <View style={cs.actions}>
          <Pressable style={cs.declineBtn} onPress={decline}>
            <Text style={cs.declineBtnText}>{text("Decline non-essential", "拒绝非必要")}</Text>
          </Pressable>
          <Pressable style={cs.acceptBtn} onPress={accept}>
            <Text style={cs.acceptBtnText}>{text("Accept all", "全部接受")}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/**
 * Screens draw from y=0, so on a device with a notch or Dynamic Island the
 * first line of every page sat underneath the clock and battery. Inset the
 * whole app once here rather than touching each screen. Web has no inset to
 * apply, and the bottom is left to BottomNav, which owns that edge.
 */
function SafeFrame({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  if (Platform.OS === "web") return <>{children}</>;
  return <View style={{ flex: 1, paddingTop: insets.top }}>{children}</View>;
}

/**
 * By default expo-updates downloads a new update in the background and only
 * runs it on the next cold start, so people kept seeing the old version.
 * Check as soon as the app opens, every time it comes back to the
 * foreground, and every 15 seconds while it is open; once an update has been
 * downloaded, ask whether to restart into it now.
 *
 * Choosing "Later" is not lost: expo-updates runs the downloaded update on
 * the next cold start anyway. The same update is not offered twice in one
 * session.
 */
// Shorter buys nothing: an update only exists once one is published, and
// the launch and foreground checks already catch it within a second.
const CHECK_EVERY_MS = 15 * 1000;

function UpdatePrompt() {
  const { text } = useAppLanguage();
  // Read through a ref so a language change does not restart the checker
  // and forget which update was already offered.
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    const text = (en: string, zh: string) => textRef.current(en, zh);
    if (Platform.OS === "web" || __DEV__ || !Updates.isEnabled) return;

    let checking = false;
    let offered = "";

    async function check() {
      if (checking || AppState.currentState !== "active") return;
      checking = true;
      try {
        const result = await Updates.checkForUpdateAsync();
        const id = result.isAvailable ? result.manifest?.id ?? "available" : "";
        if (!id || id === offered) return;
        // Fetch even if the launch-time check already downloaded it; in that
        // case isNew is false but the update is still waiting to run.
        await Updates.fetchUpdateAsync();
        offered = id;
        Alert.alert(
          text("A new version is ready", "有新版本可用"),
          text(
            "Tap Update now and the app restarts into the new version in a few seconds. Anything you were typing is not saved, so finish it first if you need to.\n\nChoose Later and the update installs itself next time you fully close and reopen the app.",
            "点「立即更新」，APP 会在几秒内自动重启到新版。正在填写的内容不会保存，需要的话先填完再更新。\n\n选「稍后」，下次把 APP 彻底关闭再打开时会自动更新。",
          ),
          [
            { text: text("Later", "稍后"), style: "cancel" },
            { text: text("Update now", "立即更新"), onPress: () => { Updates.reloadAsync().catch(() => {}); } },
          ],
        );
      } catch {
        // Offline or the update server is unreachable: keep running what we have.
      } finally {
        checking = false;
      }
    }

    check();
    const timer = setInterval(check, CHECK_EVERY_MS);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);

  return null;
}

export default function RootLayout() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) recordPageView(pathname).catch(() => {});
  }, [pathname]);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <StatusBar style="dark" />
        <UpdatePrompt />
        <SafeFrame>
          {/*
           * Slot renders a route with no navigator, so there was no stack and
           * therefore no swipe-back gesture at all — every secondary screen
           * could only be left through its own back button, which sits at the
           * top of a tall phone. A Stack restores the iOS edge swipe.
           *
           * The gesture stays on the left edge rather than full-screen: the
           * marketplace category row is a horizontal ScrollView and a
           * full-screen gesture would fight it.
           */}
          <Stack
            screenOptions={{
              headerShown: false,
              gestureEnabled: true,
              animation: "slide_from_right",
            }}
          />
        </SafeFrame>
        {Platform.OS === "web" && <CookieConsent />}
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const cs = StyleSheet.create({
  banner: {
    position: "absolute" as any,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: "rgba(7, 27, 58, 0.97)",
    padding: 16,
    paddingBottom: 20,
  },
  content: {
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 8,
  },
  desc: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  declineBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#475569",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  declineBtnText: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "900",
  },
  acceptBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  acceptBtnText: {
    color: "#071B3A",
    fontSize: 13,
    fontWeight: "900",
  },
});
