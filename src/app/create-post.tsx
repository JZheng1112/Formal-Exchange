import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { openHomeItemsMarket } from "../lib/externalLinks";
import { useAppLanguage } from "../lib/language";

export default function CreatePost() {
  const { language, text } = useAppLanguage();
  return <ScrollView style={s.page} contentContainerStyle={s.content}>
    <Text style={s.k}>{text("CREATE A POST", "发布帖子")}</Text>
    <Text style={s.title}>{text("What would you like to publish?", "你想发布什么？")}</Text>
    <Choice icon="search-outline" title={text("Post a buyer request", "发布求票需求")} description={text("Choose the ticket you need. Add only one optional note.", "选择所需票种，只需按需填写一条可选备注。")} go={() => router.push("/request-ticket")}/>
    <Choice icon="ticket-outline" title={text("List a ticket as a seller", "作为卖家发布票务")} description={text("Publish a Formal, journey, event or airport ride-share.", "发布 Formal、车票、活动门票或机场拼车。") } go={() => router.push("/list-ticket")}/>
    <Choice icon="home-outline" title={text("Second-hand home items", "二手家居用品")} description={text("Opens liuxuejishi.com, a partner site for UK students. The site is in Chinese.", "前往 liuxuejishi.com 留学集市。") } go={() => openHomeItemsMarket(language)}/>
    <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/")}><Text style={s.cancel}>{text("Cancel", "取消")}</Text></Pressable>
  </ScrollView>;
}

function Choice({ icon, title, description, go }: { icon: any; title: string; description: string; go: () => void }) {
  return <Pressable style={({ pressed }) => [s.card, pressed && s.pressed]} onPress={go}><View style={s.icon}><Ionicons name={icon} size={28} color="#fff"/></View><View style={s.copy}><Text style={s.ct}>{title}</Text><Text style={s.tx}>{description}</Text></View><Ionicons name="chevron-forward" size={22} color="#071B3A"/></Pressable>;
}

const s = StyleSheet.create({ page:{flex:1,backgroundColor:"#F7F4EE"},content:{padding:24,paddingTop:70,paddingBottom:60},k:{color:"#9A3412",fontWeight:"900",letterSpacing:1},title:{fontSize:34,lineHeight:41,fontWeight:"900",color:"#071B3A",marginTop:8,marginBottom:22},card:{backgroundColor:"#fff",borderWidth:1,borderColor:"#D6C7A1",borderRadius:25,padding:18,marginBottom:14,flexDirection:"row",alignItems:"center",gap:14},pressed:{opacity:.65},icon:{width:52,height:52,borderRadius:18,backgroundColor:"#071B3A",alignItems:"center",justifyContent:"center"},copy:{flex:1,minWidth:0},ct:{fontSize:18,fontWeight:"900",color:"#071B3A"},tx:{marginTop:5,color:"#64748B",lineHeight:20},cancel:{textAlign:"center",marginTop:16,color:"#64748B",fontWeight:"900"} });
