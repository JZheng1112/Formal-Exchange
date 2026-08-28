import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { College, CollegeRating, deleteMyCollegeRating, getCurrentUser, loadCollegeRatings, loadColleges, loadMyCollegeVisits, loadMyProfile, saveCollegeReview, translateContent } from "../lib/formalApi";
import { useAppLanguage } from "../lib/language";

const C = { bg: "#F7F4EE", card: "#FFFFFF", navy: "#071B3A", blue: "#123C69", rust: "#9A3412", muted: "#64748B", border: "#E2E8F0", gold: "#C79A34", green: "#166534", red: "#991B1B" };
type Scores = { food: number; hall: number; atmosphere: number; hospitality: number; value: number };
const emptyScores: Scores = { food: 0, hall: 0, atmosphere: 0, hospitality: 0, value: 0 };

export default function CollegeRatingDetail() {
  const { language, text } = useAppLanguage();
  const params = useLocalSearchParams<{ collegeId?: string }>();
  const collegeId = typeof params.collegeId === "string" ? params.collegeId : "";
  const [college, setCollege] = useState<College | null>(null);
  const [reviews, setReviews] = useState<CollegeRating[]>([]);
  const [userId, setUserId] = useState("");
  const [eligible, setEligible] = useState(false);
  const [scores, setScores] = useState<Scores>(emptyScores);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [showOriginal, setShowOriginal] = useState(false);

  async function refresh() {
    try {
      setLoading(true);
      setStatus("");
      const [colleges, ratingRows, user] = await Promise.all([loadColleges(), loadCollegeRatings(collegeId || undefined), getCurrentUser()]);
      setCollege(colleges.find((item) => item.id === collegeId) ?? null);
      setReviews(ratingRows);
      setUserId(user?.id ?? "");
      if (user) {
        const [visits, profile] = await Promise.all([loadMyCollegeVisits(), loadMyProfile()]);
        setEligible(profile?.college_id === collegeId || visits.some((visit: any) => visit.college_id === collegeId));
        const mine = ratingRows.find((rating) => rating.user_id === user.id);
        if (mine) {
          const fallback = Number(mine.score) || 0;
          setScores({ food: mine.food_score ?? fallback, hall: mine.hall_score ?? fallback, atmosphere: mine.atmosphere_score ?? fallback, hospitality: mine.hospitality_score ?? fallback, value: mine.value_score ?? fallback });
          setComment(mine.comment ?? "");
        }
      }
    } catch (e: any) {
      setStatus(e?.message ?? text("Could not load this college.", "无法加载该学院。"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (collegeId) void refresh(); else setLoading(false); }, [collegeId]);

  const mine = reviews.find((review) => review.user_id === userId);
  const overall = average(reviews.map((review) => review.score));
  const breakdown = useMemo(() => [
    [text("Food", "餐食"), average(reviews.map((review) => review.food_score))],
    [text("Hall & setting", "礼堂与环境"), average(reviews.map((review) => review.hall_score))],
    [text("Atmosphere", "氛围"), average(reviews.map((review) => review.atmosphere_score))],
    [text("Hospitality", "接待体验"), average(reviews.map((review) => review.hospitality_score))],
    [text("Value for money", "性价比"), average(reviews.map((review) => review.value_score))],
  ] as Array<[string, number]>, [reviews, text]);

  async function save() {
    if (!userId) return router.push("/login");
    if (!eligible) return setStatus(text("Add this college to your Visiting Record before reviewing it.", "请先把该学院加入访问记录，再进行评分。"));
    if (Object.values(scores).some((value) => value < 1)) return setStatus(text("Please rate all five areas.", "请完成全部五项评分。"));
    try {
      setBusy(true);
      setStatus(text("Saving your review…", "正在保存评论…"));
      const translated = comment.trim() ? await translateContent(comment, language, language === "en" ? "zh" : "en") : "";
      await saveCollegeReview(collegeId, scores, comment, language, translated);
      await refresh();
      setStatus(text("Your review has been saved.", "你的评分与评论已保存。"));
    } catch (e: any) {
      setStatus(e?.message ?? text("Could not save your review.", "无法保存评论。"));
    } finally { setBusy(false); }
  }

  function removeMine() {
    if (!mine || busy) return;
    const proceed = () => void (async () => {
      try { setBusy(true); await deleteMyCollegeRating(mine.id); setScores(emptyScores); setComment(""); await refresh(); setStatus(text("Your review was deleted.", "你的评论已删除。")); }
      catch (e: any) { setStatus(e?.message ?? text("Could not delete your review.", "无法删除评论。")); }
      finally { setBusy(false); }
    })();
    if (Platform.OS === "web") { if (globalThis.confirm(text("Delete your rating and comment?", "确定删除你的评分和评论吗？"))) proceed(); }
    else Alert.alert(text("Delete review?", "删除评论？"), text("This removes your rating and comment.", "这将删除你的评分和文字评论。"), [{ text: text("Cancel", "取消"), style: "cancel" }, { text: text("Delete", "删除"), style: "destructive", onPress: proceed }]);
  }

  if (loading) return <View style={s.center}><Text style={s.loading}>{text("Loading college…", "正在加载学院…")}</Text></View>;
  if (!college) return <View style={s.center}><Text style={s.title}>{text("College unavailable", "学院信息不可用")}</Text><Pressable style={s.primary} onPress={() => router.replace("/college-rankings")}><Text style={s.primaryText}>{text("Back to rankings", "返回排行")}</Text></Pressable></View>;

  return <ScrollView style={s.page} contentContainerStyle={s.content}>
    <View style={s.topbar}><Pressable style={s.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/college-rankings")}><Ionicons name="chevron-back" size={22} color={C.navy}/></Pressable><View style={s.heading}><Text style={s.kicker}>{college.university.toUpperCase()} · FORMAL</Text><Text style={s.title}>{college.name}</Text></View></View>
    <View style={s.summary}>
      <View style={s.overall}><Text style={s.overallValue}>{reviews.length ? overall.toFixed(1) : "—"}</Text><StarsDisplay value={overall}/><Text style={s.overallMeta}>{reviews.length ? text(`${reviews.length} community review${reviews.length === 1 ? "" : "s"}`, `${reviews.length} 条社区评分`) : text("No reviews yet", "暂无评论")}</Text></View>
      <View style={s.breakdown}>{breakdown.map(([label, value]) => <View style={s.breakdownRow} key={label}><Text style={s.breakdownLabel}>{label}</Text><View style={s.breakdownTrack}><View style={[s.breakdownFill, { width: `${value / 5 * 100}%` as any }]}/></View><Text style={s.breakdownValue}>{value ? value.toFixed(1) : "—"}</Text></View>)}</View>
    </View>

    <View style={s.card}>
      <Text style={s.section}>{mine ? text("Edit your review", "修改你的评论") : text("Rate this Formal experience", "评价这次 Formal 体验")}</Text>
      {!userId ? <View style={s.info}><Text style={s.infoText}>{text("Log in, then add the college to your Visiting Record before reviewing.", "请先登录，并把学院加入访问记录后再评分。")}</Text><Pressable style={s.secondary} onPress={() => router.push("/login")}><Text style={s.secondaryText}>{text("Log in", "登录")}</Text></Pressable></View> : !eligible ? <View style={s.info}><Text style={s.infoText}>{text("Reviews are linked to your Visiting Record. Add this college there first.", "评分与访问记录关联，请先在访问记录中添加该学院。")}</Text><Pressable style={s.secondary} onPress={() => router.push("/college-record")}><Text style={s.secondaryText}>{text("Open Visiting Record", "打开访问记录")}</Text></Pressable></View> : <>
        <RatingRow label={text("Food", "餐食")} help={text("Quality and variety", "菜品质量与丰富度")} value={scores.food} onChange={(food) => setScores((old) => ({ ...old, food }))}/>
        <RatingRow label={text("Hall & setting", "礼堂与环境")} help={text("Dining hall and surroundings", "用餐礼堂及周边环境")} value={scores.hall} onChange={(hall) => setScores((old) => ({ ...old, hall }))}/>
        <RatingRow label={text("Atmosphere", "氛围")} help={text("The overall Formal atmosphere", "Formal 的整体氛围")} value={scores.atmosphere} onChange={(atmosphere) => setScores((old) => ({ ...old, atmosphere }))}/>
        <RatingRow label={text("Hospitality", "接待体验")} help={text("Welcome, organisation and service", "欢迎、组织与服务")} value={scores.hospitality} onChange={(hospitality) => setScores((old) => ({ ...old, hospitality }))}/>
        <RatingRow label={text("Value for money", "性价比")} help={text("Experience compared with price", "体验与价格是否相符")} value={scores.value} onChange={(value) => setScores((old) => ({ ...old, value }))}/>
        <Text style={s.label}>{text("Comment (optional)", "评论（可选）")}</Text>
        <TextInput style={s.input} value={comment} onChangeText={setComment} multiline maxLength={1200} textAlignVertical="top" placeholder={text("What should future visitors know? Do not include personal information.", "你希望未来访客了解什么？请勿填写个人信息。")}/>
        <Text style={s.privacy}>{text("Write once in your app language. Your optional comment is translated automatically, and your account identity is not shown publicly.", "只需使用当前界面语言填写一次；可选评论会自动翻译，公开页面不会展示你的账号身份。")}</Text>
        <View style={s.actions}><Pressable style={[s.primary, busy && s.dim]} disabled={busy} onPress={save}><Text style={s.primaryText}>{busy ? text("Saving…", "保存中…") : mine ? text("Update review", "更新评论") : text("Publish review", "发布评论")}</Text></Pressable>{mine ? <Pressable style={[s.delete, busy && s.dim]} disabled={busy} onPress={removeMine}><Ionicons name="trash-outline" size={18} color={C.red}/><Text style={s.deleteText}>{text("Delete", "删除")}</Text></Pressable> : null}</View>
      </>}
      {status ? <Text style={[s.status, /Could not|无法|Please|请先|请完成/.test(status) && s.statusError]}>{status}</Text> : null}
    </View>

    <View style={s.commentsHeader}><Text style={s.commentsTitle}>{text("Community comments", "社区评论")}</Text><Pressable style={s.original} onPress={()=>setShowOriginal(value=>!value)}><Ionicons name="language-outline" size={16} color={C.blue}/><Text style={s.originalText}>{showOriginal?text("Show translation","显示译文"):text("View original","查看原文")}</Text></Pressable></View>
    {reviews.filter((review) => Boolean(review.comment?.trim())).length ? reviews.filter((review) => Boolean(review.comment?.trim())).map((review) => <View style={s.review} key={review.id}><View style={s.reviewTop}><View style={s.avatar}><Ionicons name="person" size={18} color="#fff"/></View><View style={s.reviewHeading}><Text style={s.reviewAuthor}>{text("Verified college visitor", "已记录学院访客")}</Text><Text style={s.reviewDate}>{new Date(review.updated_at ?? review.created_at).toLocaleDateString()}</Text></View><View style={s.reviewScore}><Ionicons name="star" size={14} color={C.gold}/><Text style={s.reviewScoreText}>{Number(review.score || 0).toFixed(1)}</Text></View></View><Text style={s.reviewComment}>{showOriginal?review.comment:(language==="zh"?(review.comment_zh??review.comment):(review.comment_en??review.comment))}</Text><View style={s.reviewDims}><SmallScore label={text("Food", "餐食")} value={review.food_score}/><SmallScore label={text("Hall", "礼堂")} value={review.hall_score}/><SmallScore label={text("Atmosphere", "氛围")} value={review.atmosphere_score}/><SmallScore label={text("Hospitality", "接待")} value={review.hospitality_score}/><SmallScore label={text("Value", "性价比")} value={review.value_score}/></View></View>) : <View style={s.empty}><Ionicons name="chatbubble-outline" size={30} color="#94A3B8"/><Text style={s.emptyText}>{text("No written comments yet.", "暂无文字评论。")}</Text></View>}
  </ScrollView>;
}

function RatingRow({ label, help, value, onChange }: { label: string; help: string; value: number; onChange: (value: number) => void }) { return <View style={s.ratingRow}><View style={s.ratingCopy}><Text style={s.ratingLabel}>{label}</Text><Text style={s.ratingHelp}>{help}</Text></View><View style={s.ratingStars}>{[1,2,3,4,5].map((star) => <Pressable key={star} accessibilityLabel={`${label} ${star} out of 5`} hitSlop={5} onPress={() => onChange(star)}><Ionicons name={star <= value ? "star" : "star-outline"} size={25} color={C.gold}/></Pressable>)}</View></View>; }
function StarsDisplay({ value }: { value: number }) { return <View style={s.starsDisplay}>{[1,2,3,4,5].map((star) => <Ionicons key={star} name={star <= Math.round(value) ? "star" : "star-outline"} size={16} color={C.gold}/>)}</View>; }
function SmallScore({ label, value }: { label: string; value: number | null }) { return value ? <View style={s.smallScore}><Text style={s.smallLabel}>{label}</Text><Text style={s.smallValue}>{value}</Text></View> : null; }
function average(values: Array<number | null | undefined>) { const present = values.map(Number).filter((value) => Number.isFinite(value) && value > 0); return present.length ? present.reduce((sum, value) => sum + value, 0) / present.length : 0; }

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg }, content: { boxSizing: "border-box", maxWidth: 860, width: "100%", alignSelf: "center", padding: 18, paddingTop: 24, paddingBottom: 80 }, center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg, padding: 24 }, loading: { color: C.muted, fontWeight: "800" },
  topbar: { flexDirection: "row", alignItems: "center", gap: 12 }, back: { width: 44, height: 44, borderRadius: 15, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" }, heading: { flex: 1, minWidth: 0 }, kicker: { color: C.rust, fontSize: 10, fontWeight: "900", letterSpacing: 1 }, title: { color: C.navy, fontSize: 28, lineHeight: 33, fontWeight: "900", marginTop: 3 },
  summary: { marginTop: 17, backgroundColor: C.card, borderRadius: 22, borderWidth: 1, borderColor: C.border, padding: 17, flexDirection: "row", flexWrap: "wrap", gap: 22 }, overall: { minWidth: 150, alignItems: "center", justifyContent: "center" }, overallValue: { color: C.navy, fontSize: 42, fontWeight: "900" }, starsDisplay: { flexDirection: "row", gap: 2, marginTop: 4 }, overallMeta: { color: C.muted, fontSize: 11, fontWeight: "700", marginTop: 7, textAlign: "center" }, breakdown: { flex: 1, minWidth: 240 }, breakdownRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 9 }, breakdownLabel: { width: 104, color: C.muted, fontSize: 10, fontWeight: "800" }, breakdownTrack: { flex: 1, height: 8, borderRadius: 99, backgroundColor: "#EEF2F6", overflow: "hidden" }, breakdownFill: { height: "100%", backgroundColor: C.gold }, breakdownValue: { width: 27, color: C.navy, fontSize: 10, fontWeight: "900", textAlign: "right" },
  card: { marginTop: 15, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 22, padding: 17 }, section: { color: C.navy, fontSize: 21, fontWeight: "900", marginBottom: 8 }, info: { backgroundColor: "#EEF4FA", borderRadius: 15, padding: 13 }, infoText: { color: C.blue, fontSize: 12, lineHeight: 18, fontWeight: "700" }, secondary: { alignSelf: "flex-start", marginTop: 11, borderWidth: 1, borderColor: C.navy, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 }, secondaryText: { color: C.navy, fontWeight: "900" },
  ratingRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10, minHeight: 61, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border, paddingVertical: 8 }, ratingCopy: { flex: 1, minWidth: 170 }, ratingLabel: { color: C.navy, fontSize: 14, fontWeight: "900" }, ratingHelp: { color: C.muted, fontSize: 10, marginTop: 2 }, ratingStars: { flexDirection: "row", gap: 5 }, label: { color: C.muted, fontSize: 11, fontWeight: "900", textTransform: "uppercase", marginTop: 15, marginBottom: 7 }, input: { minHeight: 105, borderWidth: 1, borderColor: C.border, borderRadius: 15, padding: 13, color: C.navy, backgroundColor: "#F8FAFC" }, privacy: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 7 }, actions: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 15 }, primary: { flex: 1, minWidth: 180, minHeight: 49, borderRadius: 15, backgroundColor: C.navy, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }, primaryText: { color: "#fff", fontWeight: "900" }, delete: { minHeight: 49, borderRadius: 15, borderWidth: 1, borderColor: "#FECACA", backgroundColor: "#FEF2F2", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 16 }, deleteText: { color: C.red, fontWeight: "900" }, dim: { opacity: .5 }, status: { color: C.green, fontSize: 12, lineHeight: 18, fontWeight: "800", marginTop: 11 }, statusError: { color: C.red },
  commentsHeader:{marginTop:24,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"},commentsTitle: { color: C.navy, fontSize: 21, fontWeight: "900" },original:{flexDirection:"row",alignItems:"center",gap:5,borderWidth:1,borderColor:C.border,borderRadius:11,paddingHorizontal:10,paddingVertical:7,backgroundColor:"#fff"},originalText:{color:C.blue,fontSize:11,fontWeight:"900"}, review: { marginTop: 11, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 19, padding: 15 }, reviewTop: { flexDirection: "row", alignItems: "center", gap: 9 }, avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.blue, alignItems: "center", justifyContent: "center" }, reviewHeading: { flex: 1 }, reviewAuthor: { color: C.navy, fontSize: 12, fontWeight: "900" }, reviewDate: { color: C.muted, fontSize: 9, marginTop: 2 }, reviewScore: { flexDirection: "row", gap: 3, alignItems: "center" }, reviewScoreText: { color: C.rust, fontWeight: "900" }, reviewComment: { color: C.navy, fontSize: 14, lineHeight: 21, marginTop: 12 }, reviewDims: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 11 }, smallScore: { flexDirection: "row", gap: 4, backgroundColor: "#F8FAFC", borderRadius: 9, paddingHorizontal: 7, paddingVertical: 5 }, smallLabel: { color: C.muted, fontSize: 9, fontWeight: "800" }, smallValue: { color: C.navy, fontSize: 9, fontWeight: "900" }, empty: { alignItems: "center", padding: 30 }, emptyText: { color: C.muted, marginTop: 8 },
});
