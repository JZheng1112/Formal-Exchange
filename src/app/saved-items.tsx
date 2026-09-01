import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { SavedEntry, loadSavedItems, toggleSavedItem } from "../lib/formalApi";
import { useAppLanguage } from "../lib/language";

const C = {
  bg: "#F7F4EE",
  card: "#FFFFFF",
  navy: "#071B3A",
  muted: "#64748B",
  border: "#E2E8F0",
  accent: "#9A3412",
};

export default function SavedItems() {
  const { language, text } = useAppLanguage();
  const [entries, setEntries] = useState<SavedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    setError("");
    try {
      setEntries(await loadSavedItems());
    } catch (e: any) {
      setError(e?.message ?? text("Could not load your saved items.", "无法加载收藏内容。"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function remove(entry: SavedEntry) {
    const id = entry.kind === "listing" ? entry.listing.id : entry.post.id;
    try {
      await toggleSavedItem(entry.kind, id);
      await refresh();
    } catch {}
  }

  const dateFmt = (value: string) =>
    new Date(value).toLocaleDateString(language === "zh" ? "zh-CN" : "en-GB", {
      year: "numeric", month: "short", day: "numeric",
    });

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.topBar}>
        <Pressable
          style={({ pressed }) => [s.back, pressed && s.pressed]}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/my-profile"))}
        >
          <Ionicons name="arrow-back" size={20} color={C.navy} />
        </Pressable>
        <View style={s.headings}>
          <Text style={s.kicker}>{text("SAVED", "收藏")}</Text>
          <Text style={s.title}>{text("Saved items", "我的收藏")}</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.stateBox}>
          <ActivityIndicator color={C.navy} />
          <Text style={s.stateText}>{text("Loading…", "正在加载…")}</Text>
        </View>
      ) : error ? (
        <View style={s.stateBox}>
          <Ionicons name="alert-circle-outline" size={34} color={C.accent} />
          <Text style={s.stateText}>{error}</Text>
          <Pressable style={({ pressed }) => [s.retry, pressed && s.pressed]} onPress={() => { setLoading(true); refresh(); }}>
            <Text style={s.retryText}>{text("Try again", "重试")}</Text>
          </Pressable>
        </View>
      ) : entries.length === 0 ? (
        <View style={s.stateBox}>
          <Ionicons name="bookmark-outline" size={38} color="#94A3B8" />
          <Text style={s.emptyTitle}>{text("Nothing saved yet", "还没有收藏")}</Text>
          <Text style={s.stateText}>
            {text("Tap the bookmark on a ticket or a buyer request to keep it here.", "在票务帖或买家需求页点击书签图标，即可收藏到这里。")}
          </Text>
          <Pressable style={({ pressed }) => [s.retry, pressed && s.pressed]} onPress={() => router.replace("/marketplace")}>
            <Text style={s.retryText}>{text("Browse tickets", "浏览票务")}</Text>
          </Pressable>
        </View>
      ) : (
        entries.map((entry) => {
          const isListing = entry.kind === "listing";
          const listing = isListing ? entry.listing : null;
          const post = isListing ? null : entry.post;

          const heading = isListing
            ? listing!.listing_category === "coach_train"
              ? `${listing!.origin_name ?? ""} → ${listing!.destination_name ?? ""}`
              : listing!.event_name ?? listing!.colleges?.name ?? text("Ticket", "票务")
            : post!.ticket_type;

          const sub = isListing
            ? `${listing!.formal_date ?? ""} · ${String(listing!.formal_time ?? "").slice(0, 5)}`
            : `${post!.university ?? text("Any city", "任意城市")} · ${post!.wanted_date ?? text("Flexible", "灵活")}`;

          const price = isListing
            ? `£${Number(listing!.asking_price_gbp ?? listing!.student_listing_price_gbp ?? 0).toFixed(2)}`
            : post!.budget_gbp
              ? text(`Up to £${Number(post!.budget_gbp).toFixed(2)}`, `最高 £${Number(post!.budget_gbp).toFixed(2)}`)
              : text("Budget open", "预算不限");

          return (
            <Pressable
              key={`${entry.kind}-${isListing ? listing!.id : post!.id}`}
              style={({ pressed }) => [s.item, pressed && s.pressed]}
              onPress={() =>
                router.push(
                  isListing
                    ? `/listing-detail?id=${listing!.id}`
                    : `/buyer-request-detail?id=${post!.id}`
                )
              }
            >
              <View style={s.itemBody}>
                <Text style={s.itemKind}>
                  {isListing ? text("Ticket listing", "票务帖") : text("Buyer request", "买家需求")}
                </Text>
                <Text style={s.itemTitle} numberOfLines={2}>{heading}</Text>
                <Text style={s.itemMeta}>{sub}</Text>
                <View style={s.itemFooter}>
                  <Text style={s.itemPrice}>{price}</Text>
                  <Text style={s.itemSaved}>{text(`Saved ${dateFmt(entry.savedAt)}`, `收藏于 ${dateFmt(entry.savedAt)}`)}</Text>
                </View>
              </View>
              <Pressable
                style={({ pressed }) => [s.removeBtn, pressed && s.pressed]}
                onPress={() => remove(entry)}
                accessibilityLabel={text("Remove from saved", "取消收藏")}
              >
                <Ionicons name="bookmark" size={19} color={C.accent} />
              </Pressable>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  content: { maxWidth: 900, width: "100%", alignSelf: "center", padding: 18, paddingTop: 32, paddingBottom: 80 },
  topBar: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  back: { width: 44, height: 44, borderRadius: 16, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  headings: { flex: 1, minWidth: 0 },
  kicker: { fontSize: 11, fontWeight: "900", color: C.accent, letterSpacing: 1 },
  title: { marginTop: 3, fontSize: 30, fontWeight: "900", color: C.navy },
  stateBox: { alignItems: "center", padding: 30, backgroundColor: C.card, borderRadius: 22, borderWidth: 1, borderColor: C.border, gap: 8 },
  stateText: { color: C.muted, textAlign: "center", lineHeight: 21 },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: C.navy, marginTop: 4 },
  retry: { marginTop: 10, backgroundColor: C.navy, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12 },
  retryText: { color: "#fff", fontWeight: "900" },
  item: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 10 },
  itemBody: { flex: 1, minWidth: 0 },
  itemKind: { color: C.accent, fontSize: 10, fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase" },
  itemTitle: { marginTop: 4, color: C.navy, fontSize: 17, fontWeight: "900", lineHeight: 23 },
  itemMeta: { marginTop: 4, color: C.muted, fontSize: 13, fontWeight: "700" },
  itemFooter: { marginTop: 10, flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" },
  itemPrice: { color: C.accent, fontSize: 17, fontWeight: "900" },
  itemSaved: { color: "#94A3B8", fontSize: 11, fontWeight: "700" },
  removeBtn: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#FDF2EC" },
  pressed: { opacity: 0.62 },
});
