import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { getCurrentSession } from "../lib/formalApi";
import { useAppLanguage } from "../lib/language";

const COLORS = {
  background: "#F7F4EE",
  card: "#FFFFFF",
  navy: "#071B3A",
  muted: "#64748B",
  border: "#E2E8F0",
  successBg: "#ECFDF5",
  successText: "#065F46",
};

export default function VerifySuccessScreen() {
  const { text } = useAppLanguage();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    async function run() {
      const session = await getCurrentSession();
      setHasSession(Boolean(session));
      setChecking(false);
    }
    run();
  }, []);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.iconBox}>
          {checking ? (
            <ActivityIndicator color={COLORS.successText} />
          ) : (
            <Ionicons name="checkmark-circle-outline" size={40} color={COLORS.successText} />
          )}
        </View>

        <Text style={styles.title}>{text("Email verification complete", "邮箱验证完成")}</Text>
        <Text style={styles.subtitle}>
          {text("Your Formal Exchange account has been verified. You can now continue to your account.", "你的 Formal Exchange 账号已经验证，现在可以继续使用。")}
        </Text>

        <View style={styles.buttonRow}>
          <Pressable style={styles.primaryButton} onPress={() => router.replace(hasSession ? "/my-profile" : "/login")}>
            <Text style={styles.primaryButtonText}>{hasSession ? text("Go to my profile", "进入个人资料") : text("Go to login", "前往登录")}</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => router.replace("/")}>
            <Text style={styles.secondaryButtonText}>{text("Back to home", "返回首页")}</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background },
  content: { flexGrow: 1, padding: 24, alignItems: "center", justifyContent: "center" },
  card: { width: "100%", maxWidth: 560, backgroundColor: COLORS.card, borderRadius: 30, borderWidth: 1, borderColor: COLORS.border, padding: 30, alignItems: "center" },
  iconBox: { width: 70, height: 70, borderRadius: 24, backgroundColor: COLORS.successBg, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  title: { fontSize: 32, fontWeight: "900", color: COLORS.navy, textAlign: "center" },
  subtitle: { marginTop: 10, fontSize: 15, lineHeight: 23, color: COLORS.muted, textAlign: "center", maxWidth: 440 },
  buttonRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 24, justifyContent: "center" },
  primaryButton: { height: 52, borderRadius: 18, backgroundColor: COLORS.navy, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  secondaryButton: { height: 52, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" },
  secondaryButtonText: { color: COLORS.navy, fontSize: 15, fontWeight: "900" },
});
