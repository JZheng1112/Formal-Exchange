import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";

import {
  College,
  Profile,
  deleteMyAccount,
  isAcUkEmail,
  isOxbridgeEmail,
  loadColleges,
  loadMyProfile,
  signOut,
  updateMyProfile,
  uploadAvatar,
  verifyProfileWithEmail,
} from "../lib/formalApi";
import { useAppLanguage } from "../lib/language";

const C = {
  bg: "#F7F4EE",
  card: "#FFFFFF",
  navy: "#071B3A",
  muted: "#64748B",
  border: "#E2E8F0",
  gold: "#D6C7A1",
  surface: "#FAFAF8",
  text: "#0F172A",
  danger: "#991B1B",
  dangerBg: "#FEF2F2",
  successBg: "#ECFDF5",
  successText: "#065F46",
  verifiedBg: "#DBEAFE",
  verifiedText: "#1E40AF",
};

export default function MyProfileScreen() {
  const { language, setLanguage, text } = useAppLanguage();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [editing, setEditing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);

  const [fullName, setFullName] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifySending, setVerifySending] = useState(false);
  const [verifyStep, setVerifyStep] = useState<"email" | "done">("email");

  async function refresh() {
    setLoading(true);
    try {
      const [profileData, collegeData] = await Promise.all([
        loadMyProfile(),
        loadColleges(),
      ]);
      setProfile(profileData);
      setColleges(collegeData);
      setFullName(profileData?.full_name ?? "");
      setCollegeId(profileData?.college_id ?? "");
      setContactEmail(profileData?.contact_email ?? "");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function save() {
    try {
      setSaving(true);
      await updateMyProfile({
        full_name: fullName.trim() || null,
        college_id: collegeId || null,
        contact_email: contactEmail.trim() || null,
      });
      Alert.alert(text("Saved", "已保存"), text("Your profile has been updated.", "个人资料已更新。"));
      setEditing(false);
      await refresh();
    } catch (error: any) {
      Alert.alert(text("Save failed", "保存失败"), error?.message ?? text("Please try again.", "请重试。"));
    } finally {
      setSaving(false);
    }
  }

  async function pickAvatar() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      setUploadingAvatar(true);
      const url = await uploadAvatar(result.assets[0].uri);
      await updateMyProfile({ avatar_url: url });
      await refresh();
    } catch (error: any) {
      Alert.alert(text("Upload failed", "上传失败"), error?.message ?? text("Please try again.", "请重试。"));
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleVerify() {
    if (!isAcUkEmail(verifyEmail)) {
      Alert.alert(text("Invalid email", "邮箱无效"), text("Please enter a UK academic email ending in .ac.uk.", "请输入以 .ac.uk 结尾的英国高校邮箱。"));
      return;
    }
    try {
      setVerifySending(true);
      await verifyProfileWithEmail(verifyEmail);
      setVerifyStep("done");
      await refresh();
      Alert.alert(text("Verified!", "认证成功！"), text("Your account is now verified.", "你的账户已通过认证。"));
      setVerifyOpen(false);
    } catch (error: any) {
      Alert.alert(text("Verification failed", "认证失败"), error?.message ?? text("Please try again.", "请重试。"));
    } finally {
      setVerifySending(false);
    }
  }

  async function logout() {
    await signOut();
    router.replace("/");
  }

  async function removeAccount() {
    try {
      setDeleting(true);
      await deleteMyAccount();
      Alert.alert(text("Account deleted", "账户已删除"), text("Your account has been deleted.", "账户已删除。"));
      router.replace("/");
    } catch (error: any) {
      Alert.alert(text("Failed", "失败"), error?.message ?? text("Please try again.", "请重试。"));
    } finally {
      setDeleting(false);
    }
  }

  function confirmRemoveAccount() {
    const msg = text("Are you sure you want to delete your account? This action is permanent.", "确定删除账户吗？此操作不可撤销。");
    if (Platform.OS === "web") {
      if (globalThis.confirm(msg)) void removeAccount();
      return;
    }
    Alert.alert(text("Delete account?", "删除账户？"), msg, [
      { text: text("Cancel", "取消"), style: "cancel" },
      { text: text("Delete", "删除"), style: "destructive", onPress: () => void removeAccount() },
    ]);
  }

  if (loading) {
    return (
      <View style={s.loadingPage}>
        <ActivityIndicator size="large" color={C.navy} />
        <Text style={s.loadingText}>{text("Loading profile…", "正在加载…")}</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <ScrollView style={s.page} contentContainerStyle={s.centerContent}>
        <View style={s.card}>
          <Pressable style={s.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/")}>
            <Ionicons name="arrow-back" size={20} color={C.navy} />
          </Pressable>
          <Ionicons name="person-circle-outline" size={44} color={C.navy} />
          <Text style={s.title}>{text("Log in required", "请先登录")}</Text>
          <Text style={s.subtitle}>
            {text("Sign in or register with any email to access your profile. Verified .ac.uk accounts unlock the verified badge.", "使用任意邮箱登录或注册，即可使用个人资料。认证的 .ac.uk 账号可获得认证标识。")}
          </Text>
          <Pressable style={s.primaryBtn} onPress={() => router.push("/login")}>
            <Text style={s.primaryBtnText}>{text("Log in", "登录")}</Text>
          </Pressable>
          <Pressable style={s.linkBtn} onPress={() => router.push("/register")}>
            <Text style={s.linkBtnText}>{text("No account? Register", "没有账号？注册")}</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const collegeName = colleges.find((c) => c.id === collegeId)?.name;

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      {/* Top bar */}
      <View style={s.topBar}>
        <Pressable style={s.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/")}>
          <Ionicons name="arrow-back" size={20} color={C.navy} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.kicker}>{text("ACCOUNT", "账户")}</Text>
          <Text style={s.title}>{text("My Profile", "我的资料")}</Text>
        </View>
        <Pressable style={s.settingsBtn} onPress={() => setSettingsOpen(true)} accessibilityLabel={text("Settings", "设置")}>
          <Ionicons name="settings-outline" size={22} color={C.navy} />
        </Pressable>
      </View>

      {/* Avatar + Name header */}
      <View style={s.profileHeader}>
        <Pressable onPress={editing ? pickAvatar : undefined} style={s.avatarWrap} disabled={uploadingAvatar}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={s.avatar} contentFit="cover" />
          ) : (
            <View style={[s.avatar, s.avatarPlaceholder]}>
              <Ionicons name="person" size={36} color="#94A3B8" />
            </View>
          )}
          {editing && (
            <View style={s.avatarEditBadge}>
              {uploadingAvatar ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={14} color="#fff" />}
            </View>
          )}
        </Pressable>
        <View style={s.headerInfo}>
          <View style={s.nameRow}>
            <Text style={s.profileName} numberOfLines={1}>{profile.full_name || text("No name set", "未设置名称")}</Text>
            {profile.is_verified && (
              <View style={s.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={13} color={C.verifiedText} />
                <Text style={s.verifiedBadgeText}>{text("Verified", "已认证")}</Text>
              </View>
            )}
          </View>
          <Text style={s.profileEmail}>{profile.email}</Text>
          {profile.university && <Text style={s.profileUni}>{profile.university === "Oxford" ? text("University of Oxford", "牛津大学") : text("University of Cambridge", "剑桥大学")}</Text>}
        </View>
      </View>

      {/* Verification prompt for non-verified */}
      {!profile.is_verified && (
        <Pressable style={s.verifyPrompt} onPress={() => setVerifyOpen(true)}>
          <View style={s.verifyPromptIcon}><Ionicons name="shield-checkmark-outline" size={22} color="#B45309" /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.verifyPromptTitle}>{text("Get verified", "获取认证")}</Text>
            <Text style={s.verifyPromptText}>{text("Verify with a .ac.uk email to unlock the verified badge. Oxford and Cambridge emails also unlock Formal ticket publishing.", "使用 .ac.uk 邮箱认证以获取认证标识。牛津和剑桥邮箱还可解锁 Formal 票发布权限。")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#B45309" />
        </Pressable>
      )}

      {/* Profile details card */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.sectionTitle}>{text("Profile details", "个人资料")}</Text>
          {!editing && (
            <Pressable style={s.editBtn} onPress={() => setEditing(true)}>
              <Ionicons name="create-outline" size={17} color={C.navy} />
              <Text style={s.editBtnText}>{text("Edit", "编辑")}</Text>
            </Pressable>
          )}
        </View>

        <View style={s.permissionRow}>
          <View style={s.permChip}><Text style={s.permText}>{text("Account active", "账户正常")}</Text></View>
          <View style={[s.permChip, !profile.can_list_ticket && s.permChipMuted]}>
            <Text style={s.permText}>{profile.can_list_ticket ? text("Formal listing enabled", "可发布 Formal 票") : text("Other tickets only", "仅可发布其他票")}</Text>
          </View>
        </View>

        {editing ? (
          <>
            <Text style={s.label}>{text("Display name", "显示名称")}</Text>
            <TextInput value={fullName} onChangeText={setFullName} placeholder={text("Your name", "你的名字")} placeholderTextColor="#94A3B8" style={s.input} />

            <Text style={s.label}>{text("College", "学院")}</Text>
            <CollegeSelect colleges={colleges} value={collegeId} onChange={setCollegeId} />

            <Text style={s.label}>{text("Contact email (optional)", "联系邮箱（选填）")}</Text>
            <TextInput value={contactEmail} onChangeText={setContactEmail} placeholder={text("For buyers to reach you", "买家联系你的邮箱")} placeholderTextColor="#94A3B8" keyboardType="email-address" autoCapitalize="none" style={s.input} />
            <Text style={s.fieldHint}>{text("This can be different from your login email.", "可以与登录邮箱不同。")}</Text>

            <View style={s.editActions}>
              <Pressable style={s.cancelBtn} onPress={() => { setEditing(false); setFullName(profile.full_name ?? ""); setCollegeId(profile.college_id ?? ""); setContactEmail(profile.contact_email ?? ""); }}>
                <Text style={s.cancelBtnText}>{text("Cancel", "取消")}</Text>
              </Pressable>
              <Pressable style={[s.saveBtn, saving && s.disabled]} disabled={saving} onPress={save}>
                <Text style={s.saveBtnText}>{saving ? text("Saving…", "保存中…") : text("Save", "保存")}</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <DetailRow icon="person-outline" label={text("Name", "名称")} value={profile.full_name || "—"} />
            <DetailRow icon="school-outline" label={text("College", "学院")} value={collegeName || text("Not set", "未设置")} />
            <DetailRow icon="mail-outline" label={text("Contact email", "联系邮箱")} value={profile.contact_email || text("Not set", "未设置")} />
            {profile.is_verified && profile.verification_email && (
              <DetailRow icon="shield-checkmark-outline" label={text("Verified email", "认证邮箱")} value={profile.verification_email} verified />
            )}
          </>
        )}
      </View>

      {/* Quick actions */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>{text("Quick actions", "快捷操作")}</Text>
        <ActionBtn icon="storefront-outline" label={text("Browse tickets", "浏览票务")} onPress={() => router.push("/")} />
        <ActionBtn icon="pricetags-outline" label={text("My listings", "我的发布")} onPress={() => router.push("/my-listings")} />
        <ActionBtn icon="receipt-outline" label={text("My buying activity", "我的购买记录")} onPress={() => router.push("/my-activity")} />
        <ActionBtn icon="chatbubbles-outline" label={text("Messages", "消息")} onPress={() => router.push("/messages")} />
        {profile.role === "admin" && (
          <Pressable style={s.adminBtn} onPress={() => router.push("/admin-dashboard")}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
            <Text style={s.adminBtnText}>{text("Admin console", "管理后台")}</Text>
          </Pressable>
        )}
      </View>

      {/* Settings modal */}
      <Modal visible={settingsOpen} transparent animationType="slide" onRequestClose={() => setSettingsOpen(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{text("Settings", "设置")}</Text>
              <Pressable style={s.modalClose} onPress={() => setSettingsOpen(false)}>
                <Ionicons name="close" size={22} color={C.navy} />
              </Pressable>
            </View>

            <Text style={s.sectionTitle}>{text("Language", "语言")}</Text>
            <View style={s.langRow}>
              <Pressable style={[s.langBtn, language === "en" && s.langActive]} onPress={() => setLanguage("en")}>
                <Text style={[s.langText, language === "en" && s.langTextActive]}>English</Text>
              </Pressable>
              <Pressable style={[s.langBtn, language === "zh" && s.langActive]} onPress={() => setLanguage("zh")}>
                <Text style={[s.langText, language === "zh" && s.langTextActive]}>中文</Text>
              </Pressable>
            </View>

            <View style={s.settingsDivider} />

            <Pressable style={s.settingsItem} onPress={() => { setSettingsOpen(false); router.push("/about"); }}>
              <Ionicons name="information-circle-outline" size={20} color={C.navy} />
              <Text style={s.settingsItemText}>{text("About", "关于")}</Text>
              <Ionicons name="chevron-forward" size={18} color={C.muted} />
            </Pressable>
            <Pressable style={s.settingsItem} onPress={() => { setSettingsOpen(false); router.push("/terms-and-conditions"); }}>
              <Ionicons name="document-text-outline" size={20} color={C.navy} />
              <Text style={s.settingsItemText}>{text("Terms & Conditions", "条款与条件")}</Text>
              <Ionicons name="chevron-forward" size={18} color={C.muted} />
            </Pressable>
            <Pressable style={s.settingsItem} onPress={() => { setSettingsOpen(false); router.push("/privacy-policy"); }}>
              <Ionicons name="lock-closed-outline" size={20} color={C.navy} />
              <Text style={s.settingsItemText}>{text("Privacy Policy", "隐私政策")}</Text>
              <Ionicons name="chevron-forward" size={18} color={C.muted} />
            </Pressable>
            <Pressable style={s.settingsItem} onPress={() => { setSettingsOpen(false); router.push("/contact-support"); }}>
              <Ionicons name="help-circle-outline" size={20} color={C.navy} />
              <Text style={s.settingsItemText}>{text("Help & Support", "帮助与支持")}</Text>
              <Ionicons name="chevron-forward" size={18} color={C.muted} />
            </Pressable>

            <View style={s.settingsDivider} />

            <Pressable style={s.logoutBtn} onPress={() => { setSettingsOpen(false); logout(); }}>
              <Ionicons name="log-out-outline" size={20} color={C.danger} />
              <Text style={s.logoutBtnText}>{text("Log out", "退出登录")}</Text>
            </Pressable>

            <View style={s.settingsDivider} />

            <Pressable style={s.dangerItem} onPress={() => { setSettingsOpen(false); confirmRemoveAccount(); }}>
              <Ionicons name="trash-outline" size={20} color={C.danger} />
              <Text style={s.dangerItemText}>{text("Delete account", "删除账户")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Verify modal */}
      <Modal visible={verifyOpen} transparent animationType="slide" onRequestClose={() => setVerifyOpen(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{text("Verify your account", "认证你的账户")}</Text>
              <Pressable style={s.modalClose} onPress={() => setVerifyOpen(false)}>
                <Ionicons name="close" size={22} color={C.navy} />
              </Pressable>
            </View>

            <View style={s.verifyInfo}>
              <Ionicons name="shield-checkmark" size={28} color="#1E40AF" />
              <Text style={s.verifyInfoText}>
                {text("Enter your UK academic (.ac.uk) email below. Verified accounts get a badge visible to other users. Oxford and Cambridge emails also unlock Formal ticket publishing.", "请在下方输入你的英国高校 (.ac.uk) 邮箱。认证账户会显示认证标识。牛津和剑桥邮箱还可解锁 Formal 票发布权限。")}
              </Text>
            </View>

            <Text style={s.label}>{text("Academic email (.ac.uk)", "高校邮箱 (.ac.uk)")}</Text>
            <TextInput
              value={verifyEmail}
              onChangeText={setVerifyEmail}
              placeholder="name@college.ox.ac.uk"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              style={s.input}
            />

            {verifyEmail.length > 0 && isAcUkEmail(verifyEmail) && isOxbridgeEmail(verifyEmail) && (
              <View style={s.verifyHint}>
                <Ionicons name="checkmark-circle" size={16} color={C.successText} />
                <Text style={s.verifyHintText}>{text("Oxbridge email — will unlock Formal listing privileges.", "牛剑邮箱 — 将解锁 Formal 票发布权限。")}</Text>
              </View>
            )}

            <Pressable style={[s.primaryBtn, verifySending && s.disabled]} disabled={verifySending} onPress={handleVerify}>
              <Text style={s.primaryBtnText}>{verifySending ? text("Verifying…", "认证中…") : text("Verify now", "立即认证")}</Text>
            </Pressable>

            <Text style={s.verifyNote}>
              {text("We strongly recommend Oxford and Cambridge students verify their accounts. Only verified Oxbridge accounts can publish Formal tickets, and the verified badge helps build trust with buyers.", "我们强烈建议牛津和剑桥的学生进行认证。只有认证的牛剑账号才能发布 Formal 票，认证标识也有助于获得买家信任。")}
            </Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function DetailRow({ icon, label, value, verified }: { icon: string; label: string; value: string; verified?: boolean }) {
  return (
    <View style={s.detailRow}>
      <Ionicons name={icon as any} size={18} color={C.muted} />
      <View style={s.detailContent}>
        <Text style={s.detailLabel}>{label}</Text>
        <View style={s.detailValueRow}>
          <Text style={s.detailValue}>{value}</Text>
          {verified && <Ionicons name="shield-checkmark" size={14} color={C.verifiedText} style={{ marginLeft: 4 }} />}
        </View>
      </View>
    </View>
  );
}

function ActionBtn({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable style={s.actionBtn} onPress={onPress}>
      <Ionicons name={icon as any} size={19} color={C.navy} />
      <Text style={s.actionBtnText}>{label}</Text>
      <Ionicons name="chevron-forward" size={17} color={C.muted} />
    </Pressable>
  );
}

function CollegeSelect({ colleges, value, onChange }: { colleges: College[]; value: string; onChange: (v: string) => void }) {
  const { text } = useAppLanguage();
  if (Platform.OS === "web") {
    const Select = "select" as any;
    return (
      <Select value={value} onChange={(e: any) => onChange(e.target.value)} style={webSelect}>
        <option value="">{text("No college selected", "未选择学院")}</option>
        {colleges.map((c) => (
          <option key={c.id} value={c.id}>{c.name} — {c.university}</option>
        ))}
      </Select>
    );
  }
  return (
    <View style={s.mobileSelect}>
      <Text style={s.mobileSelectText}>
        {value ? colleges.find((c) => c.id === value)?.name ?? text("Selected", "已选择") : text("No college selected", "未选择学院")}
      </Text>
    </View>
  );
}

const webSelect = {
  width: "100%",
  height: 50,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: C.border,
  borderRadius: 14,
  paddingLeft: 14,
  paddingRight: 14,
  fontSize: 15,
  fontWeight: 700,
  backgroundColor: C.surface,
  color: C.text,
  outline: "none",
  boxSizing: "border-box",
  cursor: "pointer",
};

const s = StyleSheet.create({
  loadingPage: { flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, color: C.muted, fontWeight: "700" },
  page: { flex: 1, backgroundColor: C.bg },
  content: { padding: 18, paddingTop: 28, paddingBottom: 70, maxWidth: 680, width: "100%", alignSelf: "center" },
  centerContent: { minHeight: "100%", padding: 24, alignItems: "center", justifyContent: "center" },

  topBar: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  settingsBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  kicker: { fontSize: 11, fontWeight: "900", color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 },
  title: { fontSize: 28, fontWeight: "900", color: C.navy },
  subtitle: { marginTop: 8, fontSize: 15, lineHeight: 23, color: C.muted },

  profileHeader: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16, backgroundColor: C.card, borderRadius: 22, borderWidth: 1, borderColor: C.border, padding: 18 },
  avatarWrap: { position: "relative" },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#E2E8F0" },
  avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  avatarEditBadge: { position: "absolute", bottom: -2, right: -2, width: 28, height: 28, borderRadius: 14, backgroundColor: C.navy, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.card },
  headerInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  profileName: { fontSize: 20, fontWeight: "900", color: C.navy, flexShrink: 1 },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: C.verifiedBg, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  verifiedBadgeText: { color: C.verifiedText, fontSize: 11, fontWeight: "900" },
  profileEmail: { color: C.muted, fontSize: 13, fontWeight: "700", marginTop: 3 },
  profileUni: { color: C.navy, fontSize: 12, fontWeight: "800", marginTop: 2 },

  verifyPrompt: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#F59E0B", borderRadius: 18, padding: 14, marginBottom: 14 },
  verifyPromptIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FEF3C7", alignItems: "center", justifyContent: "center" },
  verifyPromptTitle: { color: "#78350F", fontSize: 14, fontWeight: "900" },
  verifyPromptText: { color: "#92400E", fontSize: 11, lineHeight: 16, marginTop: 2 },

  card: { backgroundColor: C.card, borderRadius: 22, borderWidth: 1, borderColor: C.border, padding: 18, marginBottom: 14 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: C.navy },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 },
  editBtnText: { color: C.navy, fontSize: 13, fontWeight: "900" },

  permissionRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 10 },
  permChip: { backgroundColor: "#EEF4FA", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  permChipMuted: { backgroundColor: C.surface },
  permText: { color: C.navy, fontSize: 11, fontWeight: "800" },

  label: { marginTop: 14, marginBottom: 7, fontSize: 12, fontWeight: "900", color: C.muted, textTransform: "uppercase", letterSpacing: 0.3 },
  input: { height: 50, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, paddingHorizontal: 14, color: C.text, fontSize: 15 },
  fieldHint: { marginTop: 5, color: C.muted, fontSize: 11 },

  editActions: { flexDirection: "row", gap: 10, marginTop: 18 },
  cancelBtn: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  cancelBtnText: { color: C.navy, fontSize: 14, fontWeight: "900" },
  saveBtn: { flex: 2, height: 48, borderRadius: 14, backgroundColor: C.navy, alignItems: "center", justifyContent: "center" },
  saveBtnText: { color: "#fff", fontSize: 14, fontWeight: "900" },

  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  detailContent: { flex: 1 },
  detailLabel: { color: C.muted, fontSize: 11, fontWeight: "800" },
  detailValueRow: { flexDirection: "row", alignItems: "center" },
  detailValue: { color: C.navy, fontSize: 15, fontWeight: "800", marginTop: 2 },

  actionBtn: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  actionBtnText: { flex: 1, color: C.navy, fontSize: 15, fontWeight: "800" },
  adminBtn: { marginTop: 10, height: 48, borderRadius: 14, backgroundColor: C.navy, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
  adminBtnText: { color: "#fff", fontSize: 15, fontWeight: "900" },

  mobileSelect: { height: 50, borderWidth: 1, borderColor: C.border, borderRadius: 14, backgroundColor: C.surface, paddingHorizontal: 14, justifyContent: "center" },
  mobileSelectText: { fontSize: 15, color: C.text, fontWeight: "800" },

  primaryBtn: { marginTop: 18, height: 50, borderRadius: 16, backgroundColor: C.navy, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  linkBtn: { marginTop: 14, alignItems: "center" },
  linkBtnText: { color: C.navy, fontSize: 14, fontWeight: "900" },
  disabled: { opacity: 0.55 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: C.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 40, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  modalTitle: { fontSize: 22, fontWeight: "900", color: C.navy },
  modalClose: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },

  langRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  langBtn: { flex: 1, minHeight: 46, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center", backgroundColor: C.surface },
  langActive: { backgroundColor: C.navy, borderColor: C.navy },
  langText: { color: C.navy, fontWeight: "900", fontSize: 15 },
  langTextActive: { color: "#fff" },

  settingsDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 10 },
  settingsItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14 },
  settingsItemText: { flex: 1, color: C.navy, fontSize: 15, fontWeight: "800" },
  logoutBtn: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14 },
  logoutBtnText: { color: C.danger, fontSize: 15, fontWeight: "900" },
  dangerItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14 },
  dangerItemText: { color: C.danger, fontSize: 15, fontWeight: "800" },

  verifyInfo: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: C.verifiedBg, borderRadius: 16, padding: 14, marginBottom: 10 },
  verifyInfoText: { flex: 1, color: C.verifiedText, fontSize: 13, lineHeight: 20, fontWeight: "700" },
  verifyHint: { marginTop: 7, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.successBg, borderRadius: 10, padding: 8 },
  verifyHintText: { color: C.successText, fontSize: 12, fontWeight: "800" },
  verifyNote: { marginTop: 16, color: C.muted, fontSize: 12, lineHeight: 19 },
});
