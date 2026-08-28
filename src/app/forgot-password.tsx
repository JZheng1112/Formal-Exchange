import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { resetPasswordForEmail } from "../lib/formalApi";
import { useAppLanguage } from "../lib/language";

const C = {
  background: "#F7F4EE",
  card: "#FFFFFF",
  navy: "#071B3A",
  muted: "#64748B",
  border: "#E2E8F0",
  surface: "#FAFAF8",
  text: "#0F172A",
  successBg: "#ECFDF5",
  successText: "#047857",
  warningBg: "#FFF7ED",
  warningText: "#9A3412",
};

export default function ForgotPasswordScreen() {
  const { text } = useAppLanguage();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!email.trim()) {
      Alert.alert(text("Enter your email", "请输入邮箱"));
      return;
    }
    try {
      setSubmitting(true);
      await resetPasswordForEmail(email);
      setSent(true);
    } catch (error: any) {
      Alert.alert(
        text("Error", "出错了"),
        error?.message ?? text("Please try again.", "请重试。")
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Image
        source={require("../assets/formal-exchange-full.png")}
        accessibilityLabel="Formal Exchange"
        resizeMode="contain"
        style={s.logo}
      />
      <View style={s.card}>
        <Pressable
          style={s.backButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/login"))}
        >
          <Ionicons name="arrow-back" size={20} color={C.navy} />
        </Pressable>

        <Text style={s.title}>{text("Reset password", "重置密码")}</Text>
        <Text style={s.subtitle}>
          {text(
            "Enter your registered email. We'll send a link to reset your password.",
            "输入你注册时使用的邮箱，我们将发送重置密码的链接。"
          )}
        </Text>

        {sent ? (
          <View style={s.successBox}>
            <Ionicons name="checkmark-circle" size={20} color={C.successText} />
            <Text style={s.successText}>
              {text(
                "Reset link sent! Check your inbox and spam folder.",
                "重置链接已发送！请检查收件箱和垃圾邮件文件夹。"
              )}
            </Text>
          </View>
        ) : null}

        <Text style={s.label}>{text("Email", "邮箱")}</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="your@email.com"
          placeholderTextColor="#94A3B8"
          style={s.input}
          editable={!sent}
        />

        <Pressable
          style={[s.primaryButton, (submitting || sent) && s.disabled]}
          disabled={submitting || sent}
          onPress={submit}
        >
          <Text style={s.primaryButtonText}>
            {submitting
              ? text("Sending…", "发送中……")
              : sent
                ? text("Sent", "已发送")
                : text("Send reset link", "发送重置链接")}
          </Text>
        </Pressable>

        {sent ? (
          <Pressable style={s.resendButton} onPress={() => setSent(false)}>
            <Text style={s.resendText}>
              {text("Didn't receive it? Send again", "没收到？重新发送")}
            </Text>
          </Pressable>
        ) : null}

        <Pressable style={s.linkButton} onPress={() => router.push("/login")}>
          <Text style={s.linkText}>
            {text("Back to login", "返回登录")}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.background },
  content: { minHeight: "100%", padding: 24, alignItems: "center", justifyContent: "center" },
  logo: { width: "100%", maxWidth: 520, height: 150, marginBottom: 16 },
  card: { width: "100%", maxWidth: 520, backgroundColor: C.card, borderRadius: 30, borderWidth: 1, borderColor: C.border, padding: 26 },
  backButton: { width: 44, height: 44, borderRadius: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  title: { marginTop: 6, fontSize: 34, fontWeight: "900", color: C.navy },
  subtitle: { marginTop: 10, fontSize: 15, lineHeight: 23, color: C.muted },
  successBox: { marginTop: 16, flexDirection: "row", gap: 8, backgroundColor: C.successBg, borderRadius: 16, padding: 12, alignItems: "center" },
  successText: { flex: 1, fontSize: 13, lineHeight: 20, color: C.successText, fontWeight: "700" },
  label: { marginTop: 18, marginBottom: 8, fontSize: 13, fontWeight: "900", color: C.muted },
  input: { height: 54, borderRadius: 16, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, paddingHorizontal: 14, color: C.text, fontSize: 15 },
  primaryButton: { marginTop: 22, height: 54, borderRadius: 18, backgroundColor: C.navy, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.55 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  resendButton: { marginTop: 14, alignItems: "center" },
  resendText: { color: C.warningText, fontSize: 13, fontWeight: "700" },
  linkButton: { marginTop: 16, alignItems: "center" },
  linkText: { color: C.navy, fontWeight: "900" },
});
