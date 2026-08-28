import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import BottomNav from "../../components/BottomNav";
import { BuyerPost, loadBuyerPosts } from "../lib/formalApi";
import { useAppLanguage } from "../lib/language";
import { openHomeItemsMarket } from "../lib/externalLinks";
export default function Seller() {
  const {language,text}=useAppLanguage();
  const [items, setItems] = useState<BuyerPost[]>([]);
  useEffect(() => {
    loadBuyerPosts()
      .then(setItems)
      .catch((e) => Alert.alert(text("Could not load requests", "无法加载买家需求"), e.message));
  }, []);
  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={s.page} contentContainerStyle={s.c}>
        <View style={s.head}>
          <View>
            <Text style={s.k}>{text("SELLER BOARD","卖家中心")}</Text>
            <Text style={s.title}>{text("Buyer requests","买家需求")}</Text>
          </View>
          <Pressable style={s.list} onPress={() => router.push("/list-ticket")}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={s.listText}>{text("List a ticket","发布票务")}</Text>
          </Pressable>
        </View>
        <Text style={s.sub}>
          {text("Find verified buyers who are already looking for a Formal, journey or event ticket.","查看正在寻找 Formal、车票或活动门票的买家需求。")}
        </Text>
        <Pressable
          style={s.rankings}
          onPress={() => router.push("/college-rankings")}
        >
          <Ionicons name="podium-outline" size={19} color="#071B3A" />
          <Text style={s.rankingsText}>{text("College Ratings & Rankings", "学院评分与排行")}</Text>
          <Ionicons name="chevron-forward" size={18} color="#071B3A" />
        </Pressable>
        <Pressable style={s.rankings} onPress={() => openHomeItemsMarket(language)}>
          <Ionicons name="home-outline" size={19} color="#071B3A" />
          <Text style={s.rankingsText}>{text("Second-hand home items (translated)", "二手家居用品（liuxuejishi.com）")}</Text>
          <Ionicons name="open-outline" size={18} color="#071B3A" />
        </Pressable>
        {items.length === 0 ? (
          <DemoRequests />
        ) : (
          items.map((x) => (
            <Pressable style={s.card} key={x.id} onPress={() => router.push(`/buyer-request-detail?id=${x.id}`)}>
              <View style={s.row}>
                <Text style={s.type} numberOfLines={1}>{localValue(x.ticket_type,language)}</Text>
                <Text style={s.badge}>{localValue(x.category,language)}</Text>
              </View>
              <Text style={s.meta}>
                {x.wanted_date || text("Flexible date", "日期灵活")}
                {x.origin_name
                  ? ` · ${x.origin_name} → ${x.destination_name}`
                  : ""}
              </Text>
              <Text style={s.price}>
                {x.budget_gbp ? text(`Up to £${x.budget_gbp}`, `最高 £${x.budget_gbp}`) : text("Budget open", "预算不限")} ·{" "}
                {text(`${x.quantity} wanted`, `需要 ${x.quantity} 张`)}
              </Text>
              {(language==="en"?(x.notes_en??x.notes):(x.notes_zh??x.notes)) && <Text style={s.note}>{language==="en"?(x.notes_en??x.notes):(x.notes_zh??x.notes)}</Text>}
              <View style={s.contact}><Text style={s.contactText}>{text("View request and contact to sell","查看需求并联系出售")}</Text></View>
            </Pressable>
          ))
        )}
      </ScrollView>
      <BottomNav active="seller" />
    </View>
  );
}
function DemoRequests() {
  const {language,text}=useAppLanguage();
  const demos = [
    { type: "Hall Formal", badge: "formal", meta: "Oxford · Wanted by 8 Sep 2026", price: "Up to £30 · 1 wanted", note: "Looking for an eligible guest place at an Oxford college.", expiresAt: "2026-09-08T23:59:59+01:00" },
    { type: "MCR Guest Dinner", badge: "formal", meta: "Cambridge · Wanted by 15 Sep 2026", price: "Budget open · 2 wanted", note: "Two verified Cambridge members looking for an eligible guest allocation.", expiresAt: "2026-09-15T23:59:59+01:00" },
    { type: "Oxford → Cambridge", badge: "train", meta: "18 Sep 2026 · after 17:00", price: "Up to £22 · 1 wanted", note: "Flexible on departure time; railcard-compatible ticket preferred.", expiresAt: "2026-09-18T23:59:59+01:00" },
  ].filter((demo) => new Date(demo.expiresAt).getTime() > Date.now());

  if (demos.length === 0) {
    return <Text style={s.empty}>{text("No active buyer requests yet.", "暂无有效买家需求。")}</Text>;
  }

  return <View><View style={s.demoNotice}><Text style={s.demoNoticeText}>{text("Demo buyer requests · examples only · enquiries go to the Formal Exchange team", "买家需求示例 · 仅供展示 · 咨询将发送给 Formal Exchange 团队")}</Text></View>{demos.map((x,index) => <Pressable style={s.card} key={x.type} onPress={()=>router.push(`/buyer-request-detail?demo=${index}`)}><View style={s.row}><Text style={s.type}>{localValue(x.type,language)}</Text><Text style={s.badge}>{localValue(x.badge,language)}</Text></View><Text style={s.meta}>{language==="zh"?demoMeta(index):x.meta}</Text><Text style={s.price}>{language==="zh"?demoPrice(index):x.price}</Text><Text style={s.note}>{language==="zh"?demoNote(index):x.note}</Text><View style={s.demoButton}><Text style={s.demoButtonText}>{text("Demo · view details", "示例 · 查看详情")}</Text></View></Pressable>)}</View>;
}
function localValue(value:string,language:"en"|"zh"){if(language==="en")return value;const map:Record<string,string>={"Hall Formal":"学院 Formal","MCR Guest Dinner":"MCR 宾客晚宴","Coach":"大巴","Train":"火车","Event admission":"活动门票","Airport ride-share":"机场拼车","formal":"Formal","coach_train":"大巴 / 火车","event":"其他门票 / 拼车","train":"火车"};return map[value]??value;}
function demoMeta(index:number){return ["牛津 · 2026 年 9 月 8 日前需要","剑桥 · 2026 年 9 月 15 日前需要","2026 年 9 月 18 日 · 17:00 后"][index]??""}
function demoPrice(index:number){return ["最高 £30 · 需要 1 张","预算不限 · 需要 2 张","最高 £22 · 需要 1 张"][index]??""}
function demoNote(index:number){return ["希望购买一个符合资格的牛津学院宾客名额。","两名已验证的剑桥成员希望购买符合资格的宾客名额。","出发时间灵活，优先考虑可配合 Railcard 使用的车票。"][index]??""}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F4EE" },
  c: {
    maxWidth: 820,
    width: "100%",
    alignSelf: "center",
    padding: 20,
    paddingTop: 36,
    paddingBottom: 100,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  k: { fontSize: 11, fontWeight: "900", letterSpacing: 1, color: "#9A3412" },
  title: { fontSize: 31, fontWeight: "900", color: "#071B3A", marginTop: 3 },
  sub: { marginTop: 8, color: "#64748B", lineHeight: 21 },
  rankings: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#D6C7A1",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  rankingsText: { flex: 1, color: "#071B3A", fontWeight: "900" },
  list: {
    backgroundColor: "#071B3A",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 6,
  },
  listText: { color: "#fff", fontWeight: "900" },
  empty: { marginTop: 24, textAlign: "center", padding: 30, color: "#64748B" },
  demoNotice:{marginTop:18,backgroundColor:"#FCF8EA",borderWidth:1,borderColor:"#D6C7A1",borderRadius:16,padding:12},
  demoNoticeText:{color:"#071B3A",fontSize:12,fontWeight:"900",textAlign:"center"},
  demoButton:{marginTop:14,backgroundColor:"#E2E8F0",borderRadius:15,padding:13,alignItems:"center"},
  demoButtonText:{color:"#64748B",fontWeight:"900"},
  card: {
    marginTop: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 22,
    padding: 18,
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  type: { fontSize: 18, fontWeight: "900", color: "#071B3A", flex: 1 },
  badge: {
    fontSize: 11,
    fontWeight: "900",
    color: "#9A3412",
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 99,
  },
  meta: { marginTop: 8, color: "#64748B", fontWeight: "700" },
  price: { marginTop: 9, color: "#071B3A", fontWeight: "900" },
  note: { marginTop: 8, color: "#475569", lineHeight: 21 },
  contact: {
    marginTop: 14,
    backgroundColor: "#071B3A",
    borderRadius: 15,
    padding: 13,
    alignItems: "center",
  },
  contactText: { color: "#fff", fontWeight: "900" },
});
