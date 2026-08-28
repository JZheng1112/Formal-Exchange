import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import {
  PublicFeedbackComment,
  getCurrentUser,
  loadPublicFeedbackComments,
  submitFeedback,
} from "../lib/formalApi";
import { useAppLanguage } from "../lib/language";

const COLORS = {
  background: "#F7F4EE",
  card: "#FFFFFF",
  navy: "#071B3A",
  muted: "#64748B",
  border: "#E2E8F0",
  surface: "#FAFAF8",
  text: "#0F172A",
  successBg: "#ECFDF5",
  successText: "#065F46",
  warningBg: "#FFF7ED",
  warningText: "#9A3412",
};

const CATEGORIES = [
  "General feedback",
  "Bug report",
  "College price issue",
  "Listing safety",
  "Account support",
];

const ADMIN_EMAIL = "support@formal-exchange.co.uk";

export default function ContactSupportScreen() {
  const { language, text } = useAppLanguage();
  const { width } = useWindowDimensions();
  const mobile = width < 600;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState<PublicFeedbackComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);

  async function refreshComments() {
    setLoadingComments(true);
    try {
      setComments(await loadPublicFeedbackComments());
    } catch (error) {
      console.log("LOAD COMMENTS ERROR", error);
    } finally {
      setLoadingComments(false);
    }
  }

  useEffect(() => {
    async function run() {
      const user = await getCurrentUser();
      if (user?.email) setEmail(user.email);
      refreshComments();
    }
    run();
  }, []);

  async function sendFeedback() {
    if (message.trim().length < 3) {
      Alert.alert(text("Message too short", "内容太短"), text("Please write a short message before submitting.", "请填写简短说明后再提交。"));
      return;
    }

    try {
      setSubmitting(true);
      await submitFeedback({
        name,
        email,
        category,
        message,
        page: "contact-support",
        is_public: isPublic,
      });

      setMessage("");
      Alert.alert(text("Feedback submitted", "反馈已提交"), text("Thank you. The support team has received it.", "感谢反馈，支持团队已经收到。"));
      await refreshComments();
    } catch (error: any) {
      Alert.alert(text("Submission failed", "提交失败"), error?.message ?? text("Please try again.", "请重试。"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, mobile && styles.contentMobile]}>
      <View style={[styles.topBar, mobile && styles.topBarMobile]}>
        <Pressable style={styles.backButton} onPress={() => router.canGoBack() ? router.back() : router.replace("/about")}>
          <Ionicons name="arrow-back" size={20} color={COLORS.navy} />
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.kicker}>{text("SUPPORT", "支持")}</Text>
          <Text style={[styles.title, mobile && styles.titleMobile]}>{text("Contact & Support", "联系与帮助")}</Text>
        </View>
      </View>

      <View style={styles.noticeBox}>
        <Ionicons name="mail-outline" size={22} color={COLORS.navy} />
        <View style={styles.noticeTextBlock}>
          <Text style={styles.noticeTitle}>{text("Support email", "支持邮箱")}</Text>
          <Text style={styles.noticeText}>
            {text(`You can also email the support team directly at ${ADMIN_EMAIL}.`, `你也可以直接发送邮件至 ${ADMIN_EMAIL} 联系支持团队。`)}
          </Text>
        </View>
      </View>

      <View style={[styles.grid, mobile && styles.gridMobile]}>
        <View style={[styles.formCard, mobile && styles.cardMobile]}>
          <Text style={styles.sectionTitle}>{text("Submit feedback", "提交反馈")}</Text>
          <Text style={styles.sectionSubtitle}>
            {text("Tell us about a problem or suggestion. Keep it private if it should only be seen by the support team.", "请告诉我们遇到的问题或建议；如只希望支持团队查看，请设为私密。")}
          </Text>

          <Text style={styles.label}>{text("Name", "称呼")}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={text("Optional", "选填")}
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />

          <Text style={styles.label}>{text("Email", "邮箱")}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder={text("Optional", "选填")}
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />

          <Text style={styles.label}>{text("Category", "问题类型")}</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((item) => (
              <Pressable
                key={item}
                style={[styles.categoryPill, category === item && styles.categoryPillSelected]}
                onPress={() => setCategory(item)}
              >
                <Text style={[styles.categoryText, category === item && styles.categoryTextSelected]}>
                  {categoryLabel(item, language)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{text("Message", "内容")}</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder={text("Tell us what happened or what should be improved.", "请说明发生了什么，或你希望我们改进什么。")}
            placeholderTextColor="#94A3B8"
            multiline
            style={[styles.input, styles.textArea]}
          />

          <Pressable style={styles.publicToggle} onPress={() => setIsPublic(!isPublic)}>
            <Ionicons
              name={isPublic ? "checkbox-outline" : "square-outline"}
              size={22}
              color={COLORS.navy}
            />
            <Text style={styles.publicToggleText}>
              {text("Show this in the public comment area", "在公开反馈区显示")}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.primaryButton, submitting && styles.disabled]}
            disabled={submitting}
            onPress={sendFeedback}
          >
            <Text style={styles.primaryButtonText}>
              {submitting ? text("Submitting...", "正在提交……") : text("Submit feedback", "提交反馈")}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.commentsCard, mobile && styles.cardMobile]}>
          <View style={styles.commentsHeader}>
            <Text style={styles.sectionTitle}>{text("Public feedback", "公开反馈")}</Text>
            <Pressable style={styles.refreshButton} onPress={refreshComments}>
              <Ionicons name="refresh-outline" size={16} color={COLORS.navy} />
              <Text style={styles.refreshButtonText}>{text("Refresh", "刷新")}</Text>
            </Pressable>
          </View>

          {loadingComments ? (
            <View style={styles.loadingComments}>
              <ActivityIndicator color={COLORS.navy} />
              <Text style={styles.loadingText}>{text("Loading feedback...", "正在加载反馈……")}</Text>
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="chatbox-outline" size={34} color={COLORS.navy} />
              <Text style={styles.emptyTitle}>{text("No public feedback yet", "暂无公开反馈")}</Text>
              <Text style={styles.emptyText}>{text("Public feedback will appear here.", "公开反馈会显示在这里。")}</Text>
            </View>
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentName}>{comment.name}</Text>
                  <Text style={styles.commentCategory}>{categoryLabel(comment.category, language)}</Text>
                </View>
                <Text style={styles.commentMessage}>{comment.message}</Text>
                <Text style={styles.commentDate}>
                  {new Date(comment.created_at).toLocaleDateString(language === "zh" ? "zh-CN" : "en-GB", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function categoryLabel(category: string, language: "en" | "zh") {
  if (language === "en") return category;
  return ({
    "General feedback": "一般反馈",
    "Bug report": "故障报告",
    "College price issue": "学院票价问题",
    "Listing safety": "帖子安全问题",
    "Account support": "账号帮助",
  } as Record<string, string>)[category] ?? category;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingTop: 48, paddingBottom: 70, maxWidth: 1180, width: "100%", alignSelf: "center" },
  contentMobile: { padding: 12, paddingTop: 18, paddingBottom: 40 },
  topBar: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 },
  topBarMobile: { gap: 10, marginBottom: 14 },
  titleBlock: { flex: 1, minWidth: 0 },
  backButton: { width: 44, height: 44, borderRadius: 16, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  kicker: { fontSize: 13, fontWeight: "900", color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.8 },
  title: { marginTop: 2, fontSize: 34, fontWeight: "900", color: COLORS.navy },
  titleMobile: { fontSize: 27, lineHeight: 32 },
  noticeBox: { flexDirection: "row", gap: 12, alignItems: "flex-start", backgroundColor: "#FCF8EA", borderWidth: 1, borderColor: "#D6C7A1", borderRadius: 22, padding: 16, marginBottom: 18 },
  noticeTextBlock: { flex: 1 },
  noticeTitle: { fontSize: 15, fontWeight: "900", color: COLORS.navy },
  noticeText: { marginTop: 4, fontSize: 14, lineHeight: 22, color: COLORS.muted, fontWeight: "700" },
  grid: { gap: 18, flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" },
  gridMobile: { flexDirection: "column", gap: 12 },
  formCard: { flex: 1, minWidth: 340, backgroundColor: COLORS.card, borderRadius: 30, borderWidth: 1, borderColor: COLORS.border, padding: 24 },
  commentsCard: { flex: 1, minWidth: 340, backgroundColor: COLORS.card, borderRadius: 30, borderWidth: 1, borderColor: COLORS.border, padding: 24 },
  cardMobile: { flex: 0, width: "100%", minWidth: 0, borderRadius: 20, padding: 16 },
  sectionTitle: { fontSize: 22, fontWeight: "900", color: COLORS.navy },
  sectionSubtitle: { marginTop: 6, marginBottom: 14, fontSize: 14, lineHeight: 22, color: COLORS.muted },
  label: { marginTop: 14, marginBottom: 8, fontSize: 13, fontWeight: "900", color: COLORS.muted },
  input: { minHeight: 54, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, paddingHorizontal: 14, color: COLORS.text, fontSize: 15 },
  textArea: { minHeight: 130, paddingTop: 14, textAlignVertical: "top" },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryPill: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, backgroundColor: COLORS.surface, paddingHorizontal: 12, paddingVertical: 9 },
  categoryPillSelected: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  categoryText: { color: COLORS.text, fontSize: 12, fontWeight: "800" },
  categoryTextSelected: { color: "#FFFFFF" },
  publicToggle: { marginTop: 14, flexDirection: "row", alignItems: "center", gap: 8 },
  publicToggleText: { color: COLORS.navy, fontSize: 13, fontWeight: "800" },
  primaryButton: { marginTop: 20, height: 54, borderRadius: 18, backgroundColor: COLORS.navy, alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  disabled: { opacity: 0.55 },
  commentsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 },
  refreshButton: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.surface },
  refreshButtonText: { color: COLORS.navy, fontSize: 12, fontWeight: "900" },
  loadingComments: { padding: 30, alignItems: "center" },
  loadingText: { marginTop: 10, color: COLORS.muted, fontWeight: "700" },
  emptyBox: { padding: 34, alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border },
  emptyTitle: { marginTop: 10, fontSize: 18, fontWeight: "900", color: COLORS.navy },
  emptyText: { marginTop: 6, color: COLORS.muted },
  commentItem: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, borderRadius: 20, padding: 16, marginBottom: 12 },
  commentHeader: { flexDirection: "row", justifyContent: "space-between", gap: 10, alignItems: "center" },
  commentName: { flex: 1, fontSize: 15, color: COLORS.navy, fontWeight: "900" },
  commentCategory: { fontSize: 11, color: COLORS.navy, fontWeight: "900", backgroundColor: "#F3EFE5", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  commentMessage: { marginTop: 10, fontSize: 14, lineHeight: 22, color: COLORS.text },
  commentDate: { marginTop: 10, fontSize: 12, color: COLORS.muted, fontWeight: "800" },
});
