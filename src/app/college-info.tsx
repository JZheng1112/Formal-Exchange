import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import BottomNav from "../../components/BottomNav";
import { useAppLanguage } from "../lib/language";

export default function CollegeInfo() {
  const {text}=useAppLanguage();
  return (
    <View style={s.page}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.kicker}>{text("COLLEGE EXPLORER","学院探索")}</Text>
        <Text style={s.title}>{text("College","学院")}</Text>
        <Text style={s.lead}>
          {text("Keep track of the colleges you have visited and explore community ratings across Oxford and Cambridge.","记录你访问过的学院，并查看牛津与剑桥社区的 Formal 评分。")}
        </Text>
        <View style={s.grid}>
          <Card
            icon="checkmark-circle-outline"
            title={text("My College Visits","我的学院访问记录")}
            text={text("Your own college is included automatically. Record other colleges after attending a Formal, then rate and review them.","所属学院会自动计入。参加其他学院的 Formal 后可记录访问，并进行评分与评论。")}
            button={text("Open visit record","打开访问记录")}
            onPress={() => router.push("/college-record")}
          />
          <Card
            icon="podium-outline"
            title={text("College Ratings & Rankings","学院评分与排行")}
            text={text("Compare five rating dimensions and read comments from recorded visitors.","比较五个评分维度，并阅读已记录访客的评论。")}
            button={text("View ratings & rankings","查看评分与排行")}
            onPress={() => router.push("/college-rankings")}
          />
        </View>
      </ScrollView>
      <BottomNav active="college" />
    </View>
  );
}

function Card({ icon, title, text, button, onPress }: { icon: any; title: string; text: string; button: string; onPress: () => void }) {
  return (
    <View style={s.card}>
      <View style={s.icon}>
        <Ionicons name={icon} size={27} color="#fff" />
      </View>
      <Text style={s.cardTitle}>{title}</Text>
      <Text style={s.cardText}>{text}</Text>
      <Pressable style={s.button} onPress={onPress}>
        <Text style={s.buttonText}>{button}</Text>
        <Ionicons name="chevron-forward" size={18} color="#fff" />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F4EE" },
  content: { maxWidth: 900, width: "100%", alignSelf: "center", padding: 22, paddingTop: 42, paddingBottom: 115 },
  kicker: { color: "#9A3412", fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: "#071B3A", fontSize: 38, fontWeight: "900", marginTop: 7 },
  lead: { color: "#64748B", fontSize: 16, lineHeight: 25, marginTop: 10, maxWidth: 680 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 25 },
  card: { flex: 1, minWidth: 280, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 24, padding: 20 },
  icon: { width: 52, height: 52, borderRadius: 17, backgroundColor: "#071B3A", alignItems: "center", justifyContent: "center" },
  cardTitle: { color: "#071B3A", fontSize: 22, fontWeight: "900", marginTop: 16 },
  cardText: { color: "#64748B", lineHeight: 23, marginTop: 8, flex: 1 },
  button: { marginTop: 20, minHeight: 50, borderRadius: 16, paddingHorizontal: 16, backgroundColor: "#071B3A", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  buttonText: { color: "#fff", fontWeight: "900" },
});
