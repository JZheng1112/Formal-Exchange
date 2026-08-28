import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useAppLanguage } from "../src/lib/language";

const NAVY = "#071B3A";
const GOLD = "#D6C7A1";
type NavKey = "buyer" | "seller" | "college" | "messages" | "about" | "me";

export default function BottomNav({ active }: { active: NavKey }) {
  const { text } = useAppLanguage();
  const { width } = useWindowDimensions();
  const [hydrated, setHydrated] = useState(Platform.OS !== "web");
  const [railCollapsed, setRailCollapsed] = useState(false);
  useEffect(() => {
    setHydrated(true);
    if (Platform.OS === "web" && typeof window !== "undefined") {
      setRailCollapsed(window.localStorage.getItem("formal-exchange-desktop-rail") === "collapsed");
    }
  }, []);
  const desktop = hydrated && Platform.OS === "web" && width >= 980;
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const body = document.body;
    body.style.boxSizing = "border-box";
    body.style.transition = "padding-left 180ms ease";
    body.style.paddingLeft = desktop && !railCollapsed ? "208px" : "0px";
    return () => {
      body.style.paddingLeft = "0px";
    };
  }, [desktop, railCollapsed]);
  const item = (key: NavKey, label: string, icon: any, path: string) => (
    <Pressable style={[s.item, desktop && s.railItem, active === key && desktop && s.railItemOn]} onPress={() => router.push(path as any)}>
      <Ionicons
        name={icon}
        size={22}
        color={active === key ? NAVY : "#718096"}
      />
      <Text style={[s.label, active === key && s.on]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );

  const buyerPath = Platform.OS === "web" ? "/marketplace" : "/";
  const aboutPath = Platform.OS === "web" ? "/how-it-works" : "/about";
  const toggleRail = () => setRailCollapsed((current) => {
    const next = !current;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage.setItem("formal-exchange-desktop-rail", next ? "collapsed" : "open");
    }
    return next;
  });

  if (desktop && railCollapsed) return <View style={[s.rail as any, s.railCollapsed]}>
    <Pressable accessibilityLabel={text("Open navigation", "展开导航")} style={s.railToggle} onPress={toggleRail}>
      <Ionicons name="menu" size={27} color={NAVY}/>
    </Pressable>
  </View>;

  if (desktop) return <View style={s.rail as any}>
    <View style={s.railHeader}>
      <View style={s.railBrand}><Text style={s.railBrandTop}>FORMAL</Text><Text style={s.railBrandBottom}>EXCHANGE</Text></View>
      <Pressable accessibilityLabel={text("Collapse navigation", "折叠导航")} style={s.railToggle} onPress={toggleRail}>
        <Ionicons name="menu" size={25} color={NAVY}/>
      </Pressable>
    </View>
    {item("buyer", text("Buyer", "买票"), "search-outline", buyerPath)}
    {item("seller", text("Seller", "卖票"), "pricetag-outline", "/seller")}
    {item("college", text("College", "学院"), "school-outline", "/college-info")}
    <Pressable style={s.railCreate} onPress={() => router.push("/create-post")}><Ionicons name="add" size={24} color="#fff"/><Text style={s.railCreateText}>{text("Create", "发布")}</Text></Pressable>
    {item("messages", text("Messages", "消息"), "chatbubble-ellipses-outline", "/messages?view=inbox")}
    {item("about", text("How it works", "使用说明"), "information-circle-outline", aboutPath)}
    {item("me", text("Me", "我的"), "person-outline", "/my-profile")}
  </View>;

  return (
    <View style={s.bar}>
      <View style={s.group}>
        {item("buyer", text("Buyer", "买票"), "search-outline", buyerPath)}
        {item("seller", text("Seller", "卖票"), "pricetag-outline", "/seller")}
        {item("college", text("College", "学院"), "school-outline", "/college-info")}
      </View>
      <View style={s.plusSpace} />
      <View style={s.group}>
        {item("messages", text("Messages", "消息"), "chatbubble-ellipses-outline", "/messages?view=inbox")}
        {item("about", text("About", "关于"), "information-circle-outline", aboutPath)}
        {item("me", text("Me", "我的"), "person-outline", "/my-profile")}
      </View>
      <Pressable style={s.plus} onPress={() => router.push("/create-post")}>
        <Ionicons name="add" size={35} color="#fff" />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    boxSizing: "border-box",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 78,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 3,
    zIndex: 100,
  },
  group: { flex: 1, flexDirection: "row", alignItems: "center" },
  plusSpace: { width: 52 },
  item: { flex: 1, minWidth: 43, alignItems: "center", gap: 3 },
  label: { fontSize: 10, fontWeight: "800", color: "#718096" },
  on: { color: NAVY },
  plus: {
    position: "absolute",
    left: "50%",
    top: -27,
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 21,
    backgroundColor: NAVY,
    borderWidth: 3,
    borderColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },
  rail: { position: "fixed" as any, left: 18, top: 18, width: 172, zIndex: 200, borderRadius: 24, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#fff", padding: 12, shadowColor: "#071B3A", shadowOpacity: .12, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } },
  railCollapsed: { width: 58, borderRadius: 18, padding: 7 },
  railHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4, marginBottom: 4 },
  railToggle: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#F4F7FA" },
  railBrand: { paddingLeft: 10, paddingVertical: 10 },
  railBrandTop: { color: "#9A3412", fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  railBrandBottom: { color: NAVY, fontSize: 18, fontWeight: "900", letterSpacing: .4 },
  railItem: { flex: 0, minHeight: 48, width: "100%", flexDirection: "row", justifyContent: "flex-start", paddingHorizontal: 12, borderRadius: 14, gap: 10 },
  railItemOn: { backgroundColor: "#EEF4FA" },
  railCreate: { minHeight: 48, width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: NAVY, borderRadius: 14, marginVertical: 7 },
  railCreateText: { color: "#fff", fontWeight: "900", fontSize: 13 },
});
