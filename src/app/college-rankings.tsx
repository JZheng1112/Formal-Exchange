import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import BottomNav from "../../components/BottomNav";
import { College, CollegeRating, University, loadCollegeRatings, loadColleges } from "../lib/formalApi";
import { useAppLanguage } from "../lib/language";

const C = { bg: "#F7F4EE", card: "#FFFFFF", navy: "#071B3A", blue: "#123C69", rust: "#9A3412", muted: "#64748B", border: "#E2E8F0", gold: "#C79A34" };

const UNIVERSITIES: University[] = ["Oxford", "Cambridge", "Durham"];

/** Which colleges are in view. "oxbridge" is Oxford and Cambridge together. */
type Scope = "all" | "oxbridge" | University;

/** Which score the list is ordered by. "average" is the headline overall score. */
type Metric = "average" | "food" | "hall" | "atmosphere" | "hospitality" | "value";

const METRICS: Metric[] = ["average", "food", "hall", "atmosphere", "hospitality", "value"];

type Row = {
  college: College;
  count: number;
  comments: number;
} & Record<Metric, number>;

export default function CollegeRankings() {
  const { text } = useAppLanguage();
  const [colleges, setColleges] = useState<College[]>([]);
  const [ratings, setRatings] = useState<CollegeRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const [metric, setMetric] = useState<Metric>("average");

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

  const inScope = (university: University) =>
    scope === "all" || (scope === "oxbridge" ? university === "Oxford" || university === "Cambridge" : university === scope);

  // Every college scored once; scope and metric only filter and reorder it.
  const allRows = useMemo<Row[]>(() => colleges.map((college) => {
    const reviews = ratings.filter((rating) => rating.college_id === college.id);
    return {
      college,
      count: reviews.length,
      comments: reviews.filter((rating) => Boolean(rating.comment?.trim())).length,
      average: average(reviews.map((rating) => rating.score)),
      food: average(reviews.map((rating) => rating.food_score)),
      hall: average(reviews.map((rating) => rating.hall_score)),
      atmosphere: average(reviews.map((rating) => rating.atmosphere_score)),
      hospitality: average(reviews.map((rating) => rating.hospitality_score)),
      value: average(reviews.map((rating) => rating.value_score)),
    };
  }), [colleges, ratings]);

  const rows = useMemo(() =>
    allRows
      .filter((row) => inScope(row.college.university))
      .sort((a, b) => b[metric] - a[metric] || b.count - a.count || a.college.name.localeCompare(b.college.name)),
    [allRows, scope, metric]);

  // Per-university summary. Averaged over reviews rather than over college
  // averages, so a university's figure reflects how its Formals were actually
  // rated, not how many colleges happen to have one review each.
  const summary = useMemo(() => UNIVERSITIES.filter(inScope).map((university) => {
    const ids = new Set(colleges.filter((c) => c.university === university).map((c) => c.id));
    const reviews = ratings.filter((rating) => ids.has(rating.college_id));
    const rated = new Set(reviews.map((rating) => rating.college_id)).size;
    return {
      university,
      colleges: ids.size,
      rated,
      count: reviews.length,
      average: average(reviews.map((rating) => rating.score)),
      food: average(reviews.map((rating) => rating.food_score)),
      hall: average(reviews.map((rating) => rating.hall_score)),
      atmosphere: average(reviews.map((rating) => rating.atmosphere_score)),
      hospitality: average(reviews.map((rating) => rating.hospitality_score)),
      value: average(reviews.map((rating) => rating.value_score)),
    };
  }).sort((a, b) => b[metric] - a[metric] || b.count - a.count), [colleges, ratings, scope, metric]);

  const metricLabel = (m: Metric) => ({
    average: text("Overall", "综合"),
    food: text("Food", "餐食"),
    hall: text("Hall", "礼堂"),
    atmosphere: text("Atmosphere", "氛围"),
    hospitality: text("Hospitality", "接待"),
    value: text("Value", "性价比"),
  })[m];

  const universityLabel = (u: University) => ({ Oxford: text("Oxford", "牛津"), Cambridge: text("Cambridge", "剑桥"), Durham: text("Durham", "杜伦") })[u];

  const scopeOptions: Array<[Scope, string]> = [
    ["all", text("All", "全部")],
    ["oxbridge", text("Oxbridge", "牛剑")],
    ...UNIVERSITIES.map((u): [Scope, string] => [u, universityLabel(u)]),
  ];

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

      <Text style={s.filterLabel}>{text("Show", "范围")}</Text>
      <View style={s.chipRow}>
        {scopeOptions.map(([value, label]) => (
          <Pressable key={value} style={[s.filterChip, scope === value && s.filterChipOn]} onPress={() => setScope(value)}>
            <Text style={[s.filterChipText, scope === value && s.filterChipTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.filterLabel}>{text("Rank by", "排序依据")}</Text>
      <View style={s.chipRow}>
        {METRICS.map((m) => (
          <Pressable key={m} style={[s.filterChip, metric === m && s.filterChipOn]} onPress={() => setMetric(m)}>
            <Text style={[s.filterChipText, metric === m && s.filterChipTextOn]}>{metricLabel(m)}</Text>
          </Pressable>
        ))}
      </View>

      {/* University comparison — only meaningful when more than one is in view */}
      {!loading && summary.length > 1 ? (
        <View style={s.summary}>
          <Text style={s.summaryTitle}>{text(`By university · ${metricLabel(metric)}`, `按学校 · ${metricLabel(metric)}`)}</Text>
          {summary.map((u, index) => (
            <View key={u.university} style={[s.summaryRow, index > 0 && s.summaryRowDivider]}>
              <Text style={s.summaryRank}>#{index + 1}</Text>
              <View style={s.summaryBody}>
                <Text style={s.summaryName}>{universityLabel(u.university)}</Text>
                <Text style={s.summaryMeta}>
                  {u.count
                    ? text(`${u.count} review${u.count === 1 ? "" : "s"} across ${u.rated} of ${u.colleges} colleges`, `${u.count} 条评分 · 覆盖 ${u.colleges} 所学院中的 ${u.rated} 所`)
                    : text(`${u.colleges} colleges · not rated yet`, `${u.colleges} 所学院 · 暂无评分`)}
                </Text>
              </View>
              <View style={s.score}><Ionicons name="star" size={15} color={C.gold} /><Text style={s.scoreText}>{u.count && u[metric] ? u[metric].toFixed(1) : "—"}</Text></View>
            </View>
          ))}
        </View>
      ) : null}

      <View style={s.notice}><Ionicons name="create-outline" size={20} color={C.blue}/><Text style={s.noticeText}>{text("To add or edit a review, open My College Visits and choose Rate & review beside a visited college.", "如需新增或修改评论，请进入“我的学院访问记录”，在已访问学院旁点击“评分与评论”。")}</Text></View>
      {error ? <View style={s.error}><Text style={s.errorText}>{error}</Text><Pressable onPress={refresh}><Text style={s.retry}>{text("Try again", "重试")}</Text></Pressable></View> : null}

      {loading ? <Text style={s.loading}>{text("Loading rankings…", "正在加载排行…")}</Text> : rows.map((row, index) => (
        <Pressable key={row.college.id} style={({ pressed }) => [s.card, pressed && s.pressed]} onPress={() => router.push({ pathname: "/college-rating", params: { collegeId: row.college.id } } as any)}>
          <Text style={s.rank}>#{index + 1}</Text>
          <View style={s.cardBody}>
            <View style={s.cardTop}>
              <View style={s.cardHeading}><Text style={s.name}>{row.college.name}</Text><Text style={s.university}>{universityLabel(row.college.university)}</Text></View>
              <View style={s.score}>
                <Ionicons name="star" size={17} color={C.gold}/>
                <Text style={s.scoreText}>{row.count && row[metric] ? row[metric].toFixed(1) : "—"}</Text>
                {metric !== "average" ? <Text style={s.scoreMetric}>{metricLabel(metric)}</Text> : null}
              </View>
            </View>
            <Text style={s.meta}>{row.count ? text(`${row.count} review${row.count === 1 ? "" : "s"} · ${row.comments} written comment${row.comments === 1 ? "" : "s"}`, `${row.count} 条评分 · ${row.comments} 条文字评论`) : text("Not rated yet", "暂无评分")}</Text>
            {row.count && row.food ? <View style={s.chips}>
              <Chip label={text("Food", "餐食")} value={row.food} active={metric === "food"}/><Chip label={text("Hall", "礼堂")} value={row.hall} active={metric === "hall"}/><Chip label={text("Atmosphere", "氛围")} value={row.atmosphere} active={metric === "atmosphere"}/><Chip label={text("Hospitality", "接待")} value={row.hospitality} active={metric === "hospitality"}/><Chip label={text("Value", "性价比")} value={row.value} active={metric === "value"}/>
            </View> : null}
          </View>
          <Ionicons name="chevron-forward" size={21} color={C.muted}/>
        </Pressable>
      ))}
      {!loading && rows.length === 0 ? <Text style={s.loading}>{text("No colleges in this view.", "此范围内暂无学院。")}</Text> : null}
    </ScrollView>
    <BottomNav active="college" />
  </View>;
}

function Chip({ label, value, active }: { label: string; value: number; active?: boolean }) {
  return <View style={[s.chip, active && s.chipActive]}><Text style={[s.chipLabel, active && s.chipLabelActive]}>{label}</Text><Text style={[s.chipValue, active && s.chipValueActive]}>{value ? value.toFixed(1) : "—"}</Text></View>;
}
function average(values: Array<number | null | undefined>) { const present = values.map(Number).filter((value) => Number.isFinite(value) && value > 0); return present.length ? present.reduce((sum, value) => sum + value, 0) / present.length : 0; }

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg }, content: { boxSizing: "border-box", maxWidth: 900, width: "100%", alignSelf: "center", padding: 18, paddingTop: 24, paddingBottom: 112 },
  topbar: { flexDirection: "row", alignItems: "center", gap: 12 }, back: { width: 44, height: 44, borderRadius: 15, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" }, heading: { flex: 1, minWidth: 0 }, kicker: { color: C.rust, fontSize: 10, fontWeight: "900", letterSpacing: 1 }, title: { color: C.navy, fontSize: 29, lineHeight: 34, fontWeight: "900", marginTop: 3 }, subtitle: { color: C.muted, fontSize: 14, lineHeight: 21, marginTop: 11 },
  filterLabel: { color: C.muted, fontSize: 11, fontWeight: "900", letterSpacing: .6, textTransform: "uppercase", marginTop: 16, marginBottom: 7 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  filterChip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.card }, filterChipOn: { backgroundColor: C.navy, borderColor: C.navy }, filterChipText: { color: C.navy, fontSize: 12, fontWeight: "800" }, filterChipTextOn: { color: "#fff" },
  summary: { marginTop: 16, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 14 }, summaryTitle: { color: C.navy, fontSize: 13, fontWeight: "900", marginBottom: 4 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 }, summaryRowDivider: { borderTopWidth: 1, borderTopColor: C.border }, summaryRank: { width: 30, color: C.rust, fontSize: 15, fontWeight: "900" }, summaryBody: { flex: 1, minWidth: 0 }, summaryName: { color: C.navy, fontSize: 15, fontWeight: "900" }, summaryMeta: { color: C.muted, fontSize: 11, marginTop: 2 },
  notice: { flexDirection: "row", gap: 9, alignItems: "flex-start", backgroundColor: "#EEF4FA", borderRadius: 16, padding: 13, marginTop: 15 }, noticeText: { flex: 1, color: C.blue, fontSize: 12, lineHeight: 18, fontWeight: "700" }, error: { backgroundColor: "#FEF2F2", borderRadius: 16, padding: 13, marginTop: 14 }, errorText: { color: "#991B1B", fontWeight: "800" }, retry: { color: C.navy, fontWeight: "900", marginTop: 8 }, loading: { color: C.muted, textAlign: "center", marginTop: 35 },
  card: { flexDirection: "row", alignItems: "center", gap: 11, marginTop: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 15 }, pressed: { opacity: .65 }, rank: { width: 39, color: C.rust, fontSize: 19, fontWeight: "900" }, cardBody: { flex: 1, minWidth: 0 }, cardTop: { flexDirection: "row", alignItems: "center", gap: 10 }, cardHeading: { flex: 1, minWidth: 0 }, name: { color: C.navy, fontSize: 16, fontWeight: "900" }, university: { color: C.muted, fontSize: 11, marginTop: 2, fontWeight: "700" },
  score: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FFFBEB", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 99 }, scoreText: { color: C.rust, fontWeight: "900" }, scoreMetric: { color: C.muted, fontSize: 9, fontWeight: "800", marginLeft: 2 },
  meta: { color: C.muted, fontSize: 11, marginTop: 6 }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 9 },
  chip: { flexDirection: "row", gap: 4, backgroundColor: "#F8FAFC", borderRadius: 9, paddingHorizontal: 7, paddingVertical: 5 }, chipActive: { backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: C.gold }, chipLabel: { color: C.muted, fontSize: 9, fontWeight: "800" }, chipLabelActive: { color: C.rust }, chipValue: { color: C.navy, fontSize: 9, fontWeight: "900" }, chipValueActive: { color: C.rust },
});
