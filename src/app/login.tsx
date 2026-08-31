import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { getKeepSignedIn, setKeepSignedIn } from "../lib/authStorage";
import { signInWithEmail, isAcUkEmail } from "../lib/formalApi";
import { useAppLanguage } from "../lib/language";

const COLORS = {
  background: "#F7F4EE",
  card: "#FFFFFF",
  navy: "#071B3A",
  muted: "#64748B",
  border: "#E2E8F0",
  surface: "#FAFAF8",
  text: "#0F172A",
  warningBg: "#FFF7ED",
  warningText: "#9A3412",
};

export default function LoginScreen() {
  const { text } = useAppLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [keepMeSignedIn, setKeepMeSignedIn] = useState(true);

  useEffect(() => { getKeepSignedIn().then(setKeepMeSignedIn).catch(() => {}); }, []);

  async function submit() {
    try {
      setSubmitting(true);
      // Set before signing in: the preference decides where the new
      // session is written.
      await setKeepSignedIn(keepMeSignedIn);
      await signInWithEmail(email, password);
      router.replace("/my-profile");
    } catch (error: any) {
      Alert.alert(text("Login failed", "登录失败"), error?.message ?? text("Please try again.", "请重试。"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Image
        source={require("../assets/formal-exchange-full.png")}
        accessibilityLabel={text("Formal Exchange — Oxford and Cambridge", "Formal Exchange — 牛津与剑桥")}
        resizeMode="contain"
        style={styles.fullLogo}
      />
      <View style={styles.card}>
        <Pressable style={styles.backButton} onPress={() => router.canGoBack() ? router.back() : router.replace("/")}>
          <Ionicons name="arrow-back" size={20} color={COLORS.navy} />
        </Pressable>

        <Text style={styles.title}>{text("Log in", "登录")}</Text>
        <Text style={styles.subtitle}>
          {text("Sign in with your registered email. Verified .ac.uk accounts enjoy a verified badge; Oxford and Cambridge accounts can also publish Formal tickets.", "使用已注册的邮箱登录。经认证的 .ac.uk 账号享有认证标识；牛津和剑桥账号还可发布 Formal 票。")}
        </Text>

        <View style={styles.notice}>
          <Ionicons name="mail-outline" size={19} color={COLORS.warningText} />
          <Text style={styles.noticeText}>
            {text("New users should check their spam or junk folder after registration.", "新用户注册后请同时检查垃圾邮件文件夹。")}
          </Text>
        </View>

        <Text style={styles.label}>{text("Email", "邮箱")}</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="your@email.com"
          placeholderTextColor="#94A3B8"
          style={styles.input}
        />

        <Text style={styles.label}>{text("Password", "密码")}</Text>
        <View style={styles.passwordRow}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholder={text("Password", "密码")}
            placeholderTextColor="#94A3B8"
            style={styles.passwordInput}
          />
          <Pressable style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.navy} />
          </Pressable>
        </View>

        <Pressable style={styles.keepRow} onPress={() => setKeepMeSignedIn(!keepMeSignedIn)}>
          <Ionicons
            name={keepMeSignedIn ? "checkbox" : "square-outline"}
            size={22}
            color={COLORS.navy}
          />
          <Text style={styles.keepText}>
            {text("Keep me signed in on this device", "在此设备上保持登录")}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.primaryButton, submitting && styles.disabled]}
          disabled={submitting}
          onPress={submit}
        >
          <Text style={styles.primaryButtonText}>{submitting ? text("Logging in...", "正在登录……") : text("Log in", "登录")}</Text>
        </Pressable>

        <Pressable style={styles.forgotButton} onPress={() => router.push("/forgot-password")}>
          <Text style={styles.forgotText}>{text("Forgot password?", "忘记密码？")}</Text>
        </Pressable>

        <Pressable style={styles.linkButton} onPress={() => router.push("/register")}>
          <Text style={styles.linkText}>{text("No account yet? Create one", "还没有账号？立即注册")}</Text>
        </Pressable>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background },
  keepRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 18, alignSelf: "flex-start" },
  keepText: { color: COLORS.navy, fontSize: 14, fontWeight: "700" },
  content: { flexGrow: 1, padding: 24, alignItems: "center", justifyContent: "center" },
  fullLogo: { width: "100%", maxWidth: 520, height: 150, marginBottom: 16 },
  card: { width: "100%", maxWidth: 520, backgroundColor: COLORS.card, borderRadius: 30, borderWidth: 1, borderColor: COLORS.border, padding: 26 },
  backButton: { width: 44, height: 44, borderRadius: 16, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  title: { marginTop: 6, fontSize: 34, fontWeight: "900", color: COLORS.navy },
  subtitle: { marginTop: 10, fontSize: 15, lineHeight: 23, color: COLORS.muted },
  notice: { marginTop: 16, marginBottom: 16, flexDirection: "row", gap: 8, backgroundColor: COLORS.warningBg, borderRadius: 16, padding: 12 },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 20, color: COLORS.warningText, fontWeight: "700" },
  label: { marginTop: 14, marginBottom: 8, fontSize: 13, fontWeight: "900", color: COLORS.muted },
  input: { height: 54, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, paddingHorizontal: 14, color: COLORS.text, fontSize: 15 },
  passwordRow: { height: 54, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, flexDirection: "row", alignItems: "center" },
  passwordInput: { flex: 1, height: "100%", paddingHorizontal: 14, color: COLORS.text, fontSize: 15 },
  eyeButton: { width: 52, height: "100%", alignItems: "center", justifyContent: "center" },
  primaryButton: { marginTop: 22, height: 54, borderRadius: 18, backgroundColor: COLORS.navy, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.55 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  forgotButton: { marginTop: 14, alignItems: "center" },
  forgotText: { color: COLORS.muted, fontSize: 13, fontWeight: "700" },
  linkButton: { marginTop: 16, alignItems: "center" },
  linkText: { color: COLORS.navy, fontWeight: "900" },
});
