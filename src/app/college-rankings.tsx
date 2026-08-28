import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import BottomNav from "../../components/BottomNav";
import { College, CollegeRating, loadCollegeRatings, loadColleges } from "../lib/formalApi";
import { useAppLanguage } from "../lib/language";

const C = { bg: "#F7F4EE", card: "#FFFFFF", navy: "#071B3A", blue: "#123C69", rust: "#9A3412", muted: "#64748B", border: "#E2E8F0", gold: "#C79A34" };

export default function CollegeRankings() {
  const { text } = useAppLanguage();
  const [colleges, setColleges] = useState<College[]>([]);
  const [ratings, setRatings] = useState<CollegeRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      setLoading(true);
      setError("");
      const [collegeRows, ratingRows] = await Promise.all([loadColleges(), loadCollegeRatings()]);
      setColleges(collegeRows);
      setRatings(ratingRows);
    } catch (e: any) {
      setError(e?.message ?? "Could not load college rankings.");
      Alert.alert("Could not load ratings", e?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  const rows = useMemo(() => colleges.map((college) => {
    const reviews = ratings.filter((rating) => rating.college_id === college.id);
    return {
      college,
      count: reviews.length,
      average: average(reviews.map((rating) => rating.score)),
      food: average(reviews.map((rating) => rating.food_score)),
      hall: average(reviews.map((rating) => rating.hall_score)),
      atmosphere: average(reviews.map((rating) => rating.atmosphere_score)),
      hospitality: average(reviews.map((rating) => rating.hospitality_score)),
      value: average(reviews.map((rating) => rating.value_score)),
      comments: reviews.filter((rating) => Boolean(rating.comment?.trim())).length,
    };
  }).sort((a, b) => b.average - a.average || b.count - a.count || a.college.name.localeCompare(b.college.name)), [colleges, ratings]);

  return <View style={s.page}>
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.topbar}>
        <Pressable style={s.back} onPress={() => router.replace("/college-info")} accessibilityLabel="Back to College">
          <Ionicons name="chevron-back" size={22} color={C.navy} />
        </Pressable>
        <View style={s.heading}>
          <Text style={s.kicker}>{text("COLLEGE EXPLORER", "学院探索")}</Text>
          <Text style={s.title}>{text("Formal ratings & rankings", "Formal 评分与排行")}</Text>
        </View>
      </View>
      <Text style={s.subtitle}>{text("Community reviews from recorded college visits—not an official university ranking. Open a college to see the full score breakdown and comments.", "评分来自已记录的学院访问，并非官方大学排名。点击学院可查看各项评分及评论。")}</Text>
      <View style={s.notice}><Ionicons name="create-outline" size={20} color={C.blue}/><Text style={s.noticeText}>{text("To add or edit a review, open My College Visits and choose Rate & review beside a visited college.", "如需新增或修改评论，请进入“我的学院访问记录”，在已访问学院旁点击“评分与评论”。")}</Text></View>
      {error ? <View style={s.error}><Text style={s.errorText}>{error}</Text><Pressable onPress={refresh}><Text style={s.retry}>{text("Try again", "重试")}</Text></Pressable></View> : null}
      {loading ? <Text style={s.loading}>{text("Loading rankings…", "正在加载排行…")}</Text> : rows.map((row, index) => (
        <Pressable key={row.college.id} style={({ pressed }) => [s.card, pressed && s.pressed]} onPress={() => router.push({ pathname: "/college-rating", params: { collegeId: row.college.id } } as any)}>
          <Text style={s.rank}>#{index + 1}</Text>
          <View style={s.cardBody}>
            <View style={s.cardTop}>
              <View style={s.cardHeading}><Text style={s.name}>{row.college.name}</Text><Text style={s.university}>{row.college.university}</Text></View>
              <View style={s.score}><Ionicons name="star" size={17} color={C.gold}/><Text style={s.scoreText}>{row.count ? row.average.toFixed(1) : "—"}</Text></View>
            </View>
            <Text style={s.meta}>{row.count ? text(`${row.count} review${row.count === 1 ? "" : "s"} · ${row.comments} written comment${row.comments === 1 ? "" : "s"}`, `${row.count} 条评分 · ${row.comments} 条文字评论`) : text("Not rated yet", "暂无评分")}</Text>
            {row.count && row.food ? <View style={s.chips}>
              <Chip label={text("Food", "餐食")} value={row.food}/><Chip label={text("Hall", "礼堂")} value={row.hall}/><Chip label={text("Atmosphere", "氛围")} value={row.atmosphere}/><Chip label={text("Hospitality", "接待")} value={row.hospitality}/><Chip label={text("Value", "性价比")} value={row.value}/>
            </View> : null}
          </View>
          <Ionicons name="chevron-forward" size={21} color={C.muted}/>
        </Pressable>
      ))}
    </ScrollView>
    <BottomNav active="college" />
  </View>;
}

function Chip({ label, value }: { label: string; value: number }) { return <View style={s.chip}><Text style={s.chipLabel}>{label}</Text><Text style={s.chipValue}>{value ? value.toFixed(1) : "—"}</Text></View>; }
function average(values: Array<number | null | undefined>) { const present = values.map(Number).filter((value) => Number.isFinite(value) && value > 0); return present.length ? present.reduce((sum, value) => sum + value, 0) / present.length : 0; }

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg }, content: { boxSizing: "border-box", maxWidth: 900, width: "100%", alignSelf: "center", padding: 18, paddingTop: 24, paddingBottom: 112 },
  topbar: { flexDirection: "row", alignItems: "center", gap: 12 }, back: { width: 44, height: 44, borderRadius: 15, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" }, heading: { flex: 1, minWidth: 0 }, kicker: { color: C.rust, fontSize: 10, fontWeight: "900", letterSpacing: 1 }, title: { color: C.navy, fontSize: 29, lineHeight: 34, fontWeight: "900", marginTop: 3 }, subtitle: { color: C.muted, fontSize: 14, lineHeight: 21, marginTop: 11 },
  notice: { flexDirection: "row", gap: 9, alignItems: "flex-start", backgroundColor: "#EEF4FA", borderRadius: 16, padding: 13, marginTop: 15 }, noticeText: { flex: 1, color: C.blue, fontSize: 12, lineHeight: 18, fontWeight: "700" }, error: { backgroundColor: "#FEF2F2", borderRadius: 16, padding: 13, marginTop: 14 }, errorText: { color: "#991B1B", fontWeight: "800" }, retry: { color: C.navy, fontWeight: "900", marginTop: 8 }, loading: { color: C.muted, textAlign: "center", marginTop: 35 },
  card: { flexDirection: "row", alignItems: "center", gap: 11, marginTop: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 15 }, pressed: { opacity: .65 }, rank: { width: 39, color: C.rust, fontSize: 19, fontWeight: "900" }, cardBody: { flex: 1, minWidth: 0 }, cardTop: { flexDirection: "row", alignItems: "center", gap: 10 }, cardHeading: { flex: 1, minWidth: 0 }, name: { color: C.navy, fontSize: 16, fontWeight: "900" }, university: { color: C.muted, fontSize: 11, marginTop: 2, fontWeight: "700" }, score: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FFFBEB", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 99 }, scoreText: { color: C.rust, fontWeight: "900" }, meta: { color: C.muted, fontSize: 11, marginTop: 6 }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 9 }, chip: { flexDirection: "row", gap: 4, backgroundColor: "#F8FAFC", borderRadius: 9, paddingHorizontal: 7, paddingVertical: 5 }, chipLabel: { color: C.muted, fontSize: 9, fontWeight: "800" }, chipValue: { color: C.navy, fontSize: 9, fontWeight: "900" },
});
