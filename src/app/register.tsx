import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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

import {
  isAcUkEmail,
  isOxbridgeEmail,
  passwordStrength,
  resendVerificationEmail,
  signUpWithEmail,
} from "../lib/formalApi";
import { useAppLanguage } from "../lib/language";

const COLORS = {
  background: "#F7F4EE",
  card: "#FFFFFF",
  navy: "#071B3A",
  muted: "#64748B",
  border: "#E2E8F0",
  surface: "#FAFAF8",
  warning: "#9A3412",
  warningBackground: "#FFF7ED",
  success: "#065F46",
  successBackground: "#ECFDF5",
};

function getAuthErrorMessage(error: unknown) {
  if (typeof error === "string" && error.trim()) return error;

  if (error && typeof error === "object") {
    const authError = error as {
      message?: unknown;
      error_description?: unknown;
      code?: unknown;
      status?: unknown;
      name?: unknown;
    };

    const rawMessage =
      typeof authError.message === "string"
        ? authError.message
        : typeof authError.error_description === "string"
          ? authError.error_description
          : "";

    const message = rawMessage.trim();
    const lowerMessage = message.toLowerCase();

    if (message === "{}" || message === "[object Object]") {
      const details = [
        typeof authError.code === "string" ? `code: ${authError.code}` : "",
        typeof authError.status === "number" ? `status: ${authError.status}` : "",
        typeof authError.name === "string" ? `type: ${authError.name}` : "",
      ].filter(Boolean);

      return details.length > 0
        ? `Authentication request failed (${details.join(", ")}). Check Supabase Auth logs for the underlying error.`
        : "Supabase returned an empty error. Check the project URL, anonymous key, Auth email settings, and browser console.";
    }

    if (lowerMessage.includes("already registered")) {
      return "This email is already registered. Try logging in or use the resend verification option.";
    }
    if (lowerMessage.includes("rate limit")) {
      return "Too many verification emails have been requested. Please wait a few minutes and try again.";
    }
    if (
      lowerMessage.includes("failed to fetch") ||
      lowerMessage.includes("network request failed")
    ) {
      return "Could not connect to Supabase. Check your internet connection and the EXPO_PUBLIC_SUPABASE_URL configuration.";
    }

    const details = [
      typeof authError.code === "string" ? `code: ${authError.code}` : "",
      typeof authError.status === "number" ? `status: ${authError.status}` : "",
    ].filter(Boolean);

    if (message) {
      return details.length > 0 ? `${message} (${details.join(", ")})` : message;
    }

    if (authError instanceof Error && authError.name) {
      return `${authError.name}: The authentication request failed without a readable message.`;
    }
  }

  return "The authentication request failed without a readable error message. Check the browser console and Supabase Auth logs.";
}

export default function RegisterScreen() {
  const { language, text } = useAppLanguage();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [formError, setFormError] = useState("");

  const strength = useMemo(() => passwordStrength(password), [password]);
  const emailIsValid = email.trim().length > 0 && email.includes("@") && email.includes(".");
  const emailIsAcUk = isAcUkEmail(email);
  const emailIsOxbridge = isOxbridgeEmail(email);
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  useEffect(() => {
    if (resendCountdown <= 0) return;

    const timer = setTimeout(
      () => setResendCountdown((current) => Math.max(0, current - 1)),
      1000
    );

    return () => clearTimeout(timer);
  }, [resendCountdown]);

  async function submitRegistration() {
    setFormError("");

    if (!displayName.trim()) {
      setFormError(text("Please enter a display name or nickname.", "请输入显示名称或昵称。"));
      Alert.alert(
        text("Display name required", "请填写显示名称"),
        text("Please enter a display name or nickname.", "请输入显示名称或昵称。")
      );
      return;
    }

    if (!emailIsValid) {
      setFormError(
        text("Please enter a valid email address.", "请输入有效的邮箱地址。")
      );
      Alert.alert(
        text("Invalid email address", "邮箱地址无效"),
        text("Please enter a valid email address.", "请输入有效的邮箱地址。")
      );
      return;
    }

    if (strength.score < 2) {
      setFormError(
        text("Use a stronger password with at least 8 characters and a mixture of character types.", "密码至少需要 8 个字符，并混合使用不同字符类型。")
      );
      Alert.alert(
        text("Password too weak", "密码强度不足"),
        text("Please use a stronger password with at least 8 characters and a mixture of character types.", "密码至少需要 8 个字符，并混合使用不同字符类型。")
      );
      return;
    }

    if (!confirmPassword) {
      setFormError(text("Please enter your password again.", "请再次输入密码。"));
      Alert.alert(
        text("Confirm your password", "确认密码"),
        text("Please enter your password again.", "请再次输入密码。")
      );
      return;
    }

    if (password !== confirmPassword) {
      setFormError(text("The two passwords must be identical.", "两次输入的密码必须一致。"));
      Alert.alert(
        text("Passwords do not match", "两次密码不一致"),
        text("The two passwords must be identical.", "两次输入的密码必须一致。")
      );
      return;
    }

    if (!termsAccepted) {
      setFormError(
        text("You must agree to the Terms and Conditions before registering.", "注册前必须同意条款与条件。")
      );
      Alert.alert(
        text("Terms required", "请同意条款"),
        text("You must agree to the Terms and Conditions before registering.", "注册前必须同意条款与条件。")
      );
      return;
    }

    try {
      setSubmitting(true);
      await Promise.race([
        signUpWithEmail(email, password, displayName),
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  "The registration request timed out. Check your internet connection and Supabase configuration, then try again."
                )
              ),
            20000
          )
        ),
      ]);
      setRegistrationComplete(true);
      setResendCountdown(60);
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error);
      setFormError(errorMessage);
      Alert.alert(
        text("Registration failed", "注册失败"),
        errorMessage
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function resendEmail() {
    if (resending || resendCountdown > 0) return;

    try {
      setResending(true);
      setResendMessage("");
      await resendVerificationEmail(email.trim().toLowerCase());
      setResendCountdown(60);
      setResendMessage(text("A new verification email has been sent.", "新的验证邮件已经发送。"));
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error);
      Alert.alert(
        text("Could not resend email", "无法重新发送邮件"),
        errorMessage
      );
    } finally {
      setResending(false);
    }
  }

  if (registrationComplete) {
    return (
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.centerContent}
      >
        <Image
          source={require("../assets/formal-exchange-full.png")}
          accessibilityLabel={text("Formal Exchange — Oxford and Cambridge", "Formal Exchange — 牛津与剑桥")}
          resizeMode="contain"
          style={styles.fullLogo}
        />
        <View style={styles.card}>
          <View style={styles.successIcon}>
            <Ionicons
              name="mail-open-outline"
              size={36}
              color={COLORS.success}
            />
          </View>

          <Text style={styles.title}>{text("Check your email", "请查收邮件")}</Text>

          <Text style={styles.subtitle}>
            {text("A verification email has been sent to:", "验证邮件已发送至：")}
          </Text>

          <Text style={styles.sentEmail}>{email.trim().toLowerCase()}</Text>

          <View style={styles.sentStatusBox}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={COLORS.success}
            />
            <Text style={styles.sentStatusText}>
              {text("Email sent. Open the verification link to activate your account.", "邮件已发送。请打开验证链接以激活账号。")}
            </Text>
          </View>

          <View style={styles.warningBox}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color={COLORS.warning}
            />
            <Text style={styles.warningText}>
              {text("If it does not arrive within a few minutes, check your spam or junk folder.", "如果几分钟后仍未收到，请检查垃圾邮件文件夹。")}
            </Text>
          </View>

          <Pressable
            style={[
              styles.resendButton,
              (resending || resendCountdown > 0) && styles.resendButtonDisabled,
            ]}
            disabled={resending || resendCountdown > 0}
            onPress={resendEmail}
          >
            <Ionicons
              name="refresh-outline"
              size={18}
              color={resendCountdown > 0 ? COLORS.muted : COLORS.navy}
            />
            <Text
              style={[
                styles.resendButtonText,
                resendCountdown > 0 && styles.resendButtonTextDisabled,
              ]}
            >
              {resending
                ? text("Sending...", "正在发送……")
                : resendCountdown > 0
                  ? text(`Resend available in ${resendCountdown}s`, `${resendCountdown} 秒后可重发`)
                  : text("Resend verification email", "重新发送验证邮件")}
            </Text>
          </Pressable>

          {!!resendMessage && (
            <Text style={styles.resendSuccess}>{resendMessage}</Text>
          )}

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace("/login")}
          >
            <Text style={styles.primaryButtonText}>{text("Go to login", "前往登录")}</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.centerContent}
      keyboardShouldPersistTaps="handled"
    >
      <Image
        source={require("../assets/formal-exchange-full.png")}
        accessibilityLabel={text("Formal Exchange — Oxford and Cambridge", "Formal Exchange — 牛津与剑桥")}
        resizeMode="contain"
        style={styles.fullLogo}
      />
      <View style={styles.card}>
        <Pressable style={styles.backButton} onPress={() => router.canGoBack() ? router.back() : router.replace("/login")}>
          <Ionicons name="arrow-back" size={20} color={COLORS.navy} />
        </Pressable>

        <Text style={styles.kicker}>{text("CREATE YOUR ACCOUNT", "创建账户")}</Text>
        <Text style={styles.title}>{text("Register", "注册")}</Text>
        <Text style={styles.subtitle}>
          {text("Register with any email address. Users with a UK .ac.uk academic email are automatically verified; Oxford and Cambridge accounts can also publish Formal tickets. You can verify later in My Profile.", "使用任意邮箱注册。使用英国 .ac.uk 高校邮箱注册将自动获得认证；牛津和剑桥账号还可发布 Formal 票。你也可以稍后在「我的资料」中进行认证。")}
        </Text>

        <Text style={styles.label}>{text("Display name / nickname", "显示名称 / 昵称")}</Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder={text("How other users will see you", "其他用户看到的名称")}
          placeholderTextColor="#94A3B8"
          autoCapitalize="words"
          style={styles.input}
        />

        <Text style={styles.label}>{text("Email address", "邮箱地址")}</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="your@email.com"
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={[
            styles.input,
            email.length > 0 && !emailIsValid && styles.inputWarning,
          ]}
        />

        {email.length > 0 && !emailIsValid && (
          <Text style={styles.inlineWarning}>
            {text("Please enter a valid email address.", "请输入有效的邮箱地址。")}
          </Text>
        )}

        {email.length > 0 && emailIsValid && emailIsAcUk && (
          <View style={styles.verifiedHint}>
            <Ionicons name="shield-checkmark" size={16} color="#065F46" />
            <Text style={styles.verifiedHintText}>
              {emailIsOxbridge
                ? text("Oxford/Cambridge email — auto-verified with Formal listing privileges.", "牛津/剑桥邮箱 — 自动认证，可发布 Formal 票。")
                : text("UK academic email — auto-verified on registration.", "英国高校邮箱 — 注册后自动认证。")}
            </Text>
          </View>
        )}

        {email.length > 0 && emailIsValid && !emailIsAcUk && (
          <View style={styles.verifyLaterHint}>
            <Ionicons name="information-circle-outline" size={16} color="#64748B" />
            <Text style={styles.verifyLaterHintText}>
              {text("You can verify with a .ac.uk email later in My Profile to unlock the verified badge and Formal listing access.", "你可以稍后在「我的资料」中使用 .ac.uk 邮箱进行认证，以获得认证标识和 Formal 票发布权限。")}
            </Text>
          </View>
        )}

        <Text style={styles.label}>{text("Password", "密码")}</Text>
        <View style={styles.passwordRow}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={text("Create a password", "设置密码")}
            placeholderTextColor="#94A3B8"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.passwordInput}
          />
          <Pressable
            style={styles.eyeButton}
            onPress={() => setShowPassword((current) => !current)}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={21}
              color={COLORS.navy}
            />
          </Pressable>
        </View>

        <View style={styles.strengthBox}>
          <View style={styles.strengthHeader}>
            <Text style={styles.strengthLabel}>{text("Password strength", "密码强度")}</Text>
            <Text style={styles.strengthValue}>{language === "zh" ? ({Weak:"弱",Fair:"一般",Good:"良好",Strong:"强",Excellent:"很强"} as Record<string,string>)[strength.label] ?? strength.label : strength.label}</Text>
          </View>
          <View style={styles.strengthTrack}>
            <View
              style={[
                styles.strengthFill,
                { width: `${Math.min(100, strength.score * 20)}%` },
              ]}
            />
          </View>
          <Text style={styles.strengthAdvice}>{language === "zh" ? "请至少使用 8 个字符，并混合字母、数字或符号。" : strength.advice}</Text>
        </View>

        <Text style={styles.label}>{text("Confirm password", "确认密码")}</Text>
        <View
          style={[
            styles.passwordRow,
            confirmPassword.length > 0 &&
              !passwordsMatch &&
              styles.passwordRowWarning,
            passwordsMatch && styles.passwordRowSuccess,
          ]}
        >
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={text("Enter the password again", "再次输入密码")}
            placeholderTextColor="#94A3B8"
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.passwordInput}
          />
          <Pressable
            style={styles.eyeButton}
            onPress={() =>
              setShowConfirmPassword((current) => !current)
            }
          >
            <Ionicons
              name={
                showConfirmPassword ? "eye-off-outline" : "eye-outline"
              }
              size={21}
              color={COLORS.navy}
            />
          </Pressable>
        </View>

        {confirmPassword.length > 0 && !passwordsMatch && (
          <Text style={styles.inlineWarning}>{text("Passwords do not match.", "两次输入的密码不一致。")}</Text>
        )}

        {passwordsMatch && (
          <View style={styles.matchRow}>
            <Ionicons
              name="checkmark-circle-outline"
              size={17}
              color={COLORS.success}
            />
            <Text style={styles.matchText}>{text("Passwords match.", "两次密码一致。")}</Text>
          </View>
        )}

        <Pressable
          style={styles.termsRow}
          onPress={() => setTermsAccepted((current) => !current)}
        >
          <Ionicons
            name={termsAccepted ? "checkbox-outline" : "square-outline"}
            size={23}
            color={COLORS.navy}
          />
          <Text style={styles.termsText}>
            {text("I agree to the ", "我同意")}
            <Text
              style={styles.termsLink}
              onPress={() => router.push("/terms-and-conditions")}
            >
              {text("Terms and Conditions", "《条款与条件》")}
            </Text>
            {text(" and the ", "与")}
            <Text
              style={styles.termsLink}
              onPress={() => router.push("/privacy-policy")}
            >
              {text("Privacy Policy", "《隐私政策》")}
            </Text>
            {language === "en" ? "." : "。"}
          </Text>
        </Pressable>

        <View style={styles.warningBox}>
          <Ionicons
            name="mail-outline"
            size={20}
            color={COLORS.warning}
          />
          <Text style={styles.warningText}>
            {text("After registering, check your inbox and spam/junk folder for the verification link. A .ac.uk account only receives its verified badge once you open that link — and only a confirmed Oxford or Cambridge address can publish Formal tickets.", "注册后，请在收件箱和垃圾邮件文件夹中查找验证链接。.ac.uk 账号只有在打开该链接后才会获得认证标识；且只有已确认的牛津或剑桥邮箱才能发布 Formal 票。")}
          </Text>
        </View>

        {!!formError && (
          <View style={styles.formErrorBox}>
            <Ionicons
              name="alert-circle"
              size={20}
              color={COLORS.warning}
            />
            <Text style={styles.formErrorText}>{formError}</Text>
          </View>
        )}

        <Pressable
          style={[
            styles.primaryButton,
            submitting && styles.disabledButton,
          ]}
          disabled={submitting}
          onPress={submitRegistration}
        >
          <Text style={styles.primaryButtonText}>
            {submitting
              ? text("Creating account and sending email...", "正在创建账号并发送邮件……")
              : text("Create account", "创建账号")}
          </Text>
        </Pressable>

        <Pressable
          style={styles.loginLinkButton}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.loginLinkText}>
            {text("Already registered? Log in", "已有账号？登录")}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContent: {
    minHeight: "100%",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  fullLogo: {
    width: "100%",
    maxWidth: 520,
    height: 150,
    marginBottom: 16,
  },
  card: {
    width: "100%",
    maxWidth: 580,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 30,
    padding: 26,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  successIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: COLORS.successBackground,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  kicker: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    marginTop: 6,
    color: COLORS.navy,
    fontSize: 34,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 10,
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 23,
  },
  sentEmail: {
    marginTop: 8,
    color: COLORS.navy,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "900",
  },
  sentStatusBox: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: COLORS.successBackground,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  sentStatusText: {
    flex: 1,
    color: COLORS.success,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "800",
  },
  label: {
    marginTop: 15,
    marginBottom: 8,
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "900",
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    color: COLORS.navy,
    fontSize: 15,
  },
  inputWarning: {
    borderColor: "#FDBA74",
    backgroundColor: COLORS.warningBackground,
  },
  passwordRow: {
    height: 54,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
  },
  passwordRowWarning: {
    borderColor: "#FDBA74",
    backgroundColor: COLORS.warningBackground,
  },
  passwordRowSuccess: {
    borderColor: "#86EFAC",
    backgroundColor: COLORS.successBackground,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 14,
    color: COLORS.navy,
    fontSize: 15,
  },
  eyeButton: {
    width: 52,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  inlineWarning: {
    marginTop: 7,
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: "800",
  },
  matchRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  matchText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: "800",
  },
  strengthBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    padding: 12,
  },
  strengthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  strengthLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "900",
  },
  strengthValue: {
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: "900",
  },
  strengthTrack: {
    height: 8,
    marginTop: 9,
    borderRadius: 99,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: 99,
    backgroundColor: COLORS.navy,
  },
  strengthAdvice: {
    marginTop: 8,
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  termsRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  termsText: {
    flex: 1,
    color: COLORS.navy,
    fontSize: 13,
    lineHeight: 21,
    fontWeight: "700",
  },
  termsLink: {
    fontWeight: "900",
    textDecorationLine: "underline",
  },
  warningBox: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: COLORS.warningBackground,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  warningText: {
    flex: 1,
    color: COLORS.warning,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
  },
  formErrorBox: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#FDBA74",
    borderRadius: 16,
    backgroundColor: COLORS.warningBackground,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  formErrorText: {
    flex: 1,
    color: COLORS.warning,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "800",
  },
  primaryButton: {
    marginTop: 22,
    height: 54,
    borderRadius: 18,
    backgroundColor: COLORS.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  resendButton: {
    marginTop: 16,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  resendButtonDisabled: {
    opacity: 0.7,
  },
  resendButtonText: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: "900",
  },
  resendButtonTextDisabled: {
    color: COLORS.muted,
  },
  resendSuccess: {
    marginTop: 10,
    color: COLORS.success,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  disabledButton: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  loginLinkButton: {
    marginTop: 16,
    alignItems: "center",
  },
  loginLinkText: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: "900",
  },
  verifiedHint: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: COLORS.successBackground,
    borderRadius: 12,
    padding: 10,
  },
  verifiedHintText: {
    flex: 1,
    color: COLORS.success,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },
  verifyLaterHint: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 10,
  },
  verifyLaterHintText: {
    flex: 1,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
});
