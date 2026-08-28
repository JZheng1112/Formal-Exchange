import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image } from "expo-image";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { College, ListingCategory, SellerInfo, TicketListing, loadColleges, loadMyProfile, loadSellerProfiles, loadVisibleActiveListings } from "../lib/formalApi";
import { useAppLanguage } from "../lib/language";
import { openHomeItemsMarket } from "../lib/externalLinks";

const C={bg:"#F5F1E8",card:"#fff",navy:"#071B3A",blue:"#123C69",muted:"#64748B",border:"#E2E8F0"};
const Select="select" as any,Input="input" as any;
type Category=ListingCategory|"all"|"swap";

export default function FindTicket(){
  const {language,text}=useAppLanguage();
  const {width}=useWindowDimensions(),mobile=width<700;
  const params=useLocalSearchParams<{collegeId?:string;date?:string}>();
  const [colleges,setColleges]=useState<College[]>([]);
  const [listings,setListings]=useState<TicketListing[]>([]);
  const [sellers,setSellers]=useState<Record<string,SellerInfo>>({});
  const [category,setCategory]=useState<Category>("formal");
  const [sameCity,setSameCity]=useState(false);
  const [myCity,setMyCity]=useState<"Oxford"|"Cambridge">("Oxford");
  const [collegeId,setCollegeId]=useState(params.collegeId??"all");
  const [date,setDate]=useState(params.date??"");
  const [budget,setBudget]=useState("");
  const [filtersOpen,setFiltersOpen]=useState(true);
  const [collegeSearch,setCollegeSearch]=useState("");

  useEffect(()=>{
    Promise.all([loadColleges(),loadVisibleActiveListings(),loadMyProfile()]).then(([collegeRows,listingRows,profile])=>{
      setColleges(collegeRows);
      setListings(listingRows);
      if(profile?.university)setMyCity(profile.university);
      const ids=[...new Set(listingRows.map(l=>l.seller_user_id).filter(Boolean) as string[])];
      if(ids.length)loadSellerProfiles(ids).then(setSellers);
    }).catch(error=>Alert.alert(text("Could not load tickets","无法加载票务"),error.message));
  },[]);

  const filteredColleges = useMemo(() => {
    if (!collegeSearch.trim()) return colleges;
    const q = collegeSearch.trim().toLowerCase();
    return colleges.filter(c => c.name.toLowerCase().includes(q) || c.university.toLowerCase().includes(q));
  }, [colleges, collegeSearch]);

  const filtered=useMemo(()=>listings.filter(item=>{
    const itemCategory=item.listing_category??"formal";
    const price=Number(item.asking_price_gbp??item.student_listing_price_gbp??0);
    return (category==="all"||category==="swap"?category!=="swap"||item.open_to_swap===true:itemCategory===category)
      &&(!sameCity||(item.campus??item.colleges.university)===myCity)
      &&(collegeId==="all"||item.college_id===collegeId)
      &&(!date||item.formal_date===date)
      &&(!Number(budget)||price<=Number(budget));
  }),[listings,category,sameCity,myCity,collegeId,date,budget]);

  function reset(){setCategory("formal");setSameCity(false);setCollegeId("all");setDate("");setBudget("");setCollegeSearch("");}

  return <ScrollView style={s.page} contentContainerStyle={[s.content,mobile&&s.contentMobile]}>
    {/* Header */}
    <View style={s.top}>
      <Pressable style={s.back} onPress={()=>router.canGoBack()?router.back():router.replace("/")}>
        <Ionicons name="chevron-back" size={22} color={C.navy}/>
      </Pressable>
      <View style={s.titleCopy}>
        <Text style={s.eyebrow}>{text("BUYER","买家")}</Text>
        <Text style={[s.title,mobile&&s.titleMobile]}>{text("Browse tickets","浏览票务")}</Text>
      </View>
      <Pressable style={s.filterToggle} onPress={()=>setFiltersOpen(v=>!v)}>
        <Ionicons name={filtersOpen?"options":"options-outline"} size={20} color={C.navy}/>
      </Pressable>
    </View>

    {/* Category pills - always visible */}
    <View style={s.pills}>
      {([["formal","Formal","Formal"],["coach_train","Coach / Train","大巴 / 火车"],["event","Other","其他"],["all","All","全部"],["swap","Swaps","换票"]] as const).map(([id,en,zh])=>
        <Pressable key={id} style={[s.pill,id==="swap"&&s.swapPill,category===id&&s.pillOn,category===id&&id==="swap"&&s.swapOn]} onPress={()=>setCategory(id as Category)}>
          <Text style={[s.pillText,category===id&&s.pillTextOn]}>{language==="zh"?zh:en}</Text>
        </Pressable>
      )}
      <Pressable style={s.pill} onPress={()=>openHomeItemsMarket(language)}>
        <Text style={s.pillText}>{language === "zh" ? "二手 ↗" : "Home items ↗"}</Text>
      </Pressable>
    </View>

    {/* Expandable filter panel */}
    {filtersOpen && <View style={s.filterPanel}>
      <View style={[s.filterGrid,mobile&&s.filterStack]}>
        {/* City filter */}
        <View style={s.field}>
          <Text style={s.label}>{text("City","城市")}</Text>
          <View style={s.cityRow}>
            <Pressable style={[s.sameCity,sameCity&&s.sameCityOn]} onPress={()=>setSameCity(v=>!v)}>
              <Ionicons name={sameCity?"checkmark-circle":"ellipse-outline"} size={18} color={sameCity?"#fff":C.blue}/>
              <Text style={[s.sameCityText,sameCity&&s.sameCityTextOn]}>{text("My city only","只看同城")}</Text>
            </Pressable>
            <View style={s.cityPills}>
              {(["Oxford","Cambridge"] as const).map(city=>
                <Pressable key={city} style={[s.city,city===myCity&&s.cityOn]} onPress={()=>setMyCity(city)}>
                  <Text style={[s.cityText,city===myCity&&s.cityTextOn]}>{language==="zh"?(city==="Oxford"?"牛津":"剑桥"):city}</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* College filter with search */}
        {(category==="formal"||category==="all") && <View style={s.field}>
          <Text style={s.label}>{text("College","学院")}</Text>
          {Platform.OS==="web" ? <>
            <TextInput
              value={collegeSearch}
              onChangeText={setCollegeSearch}
              placeholder={text("Search colleges...","搜索学院...")}
              placeholderTextColor="#94A3B8"
              style={s.searchInput}
            />
            <Select value={collegeId} onChange={(e:any)=>setCollegeId(e.target.value)} style={web}>
              <option value="all">{text("All colleges","所有学院")}</option>
              {filteredColleges.map(c=><option key={c.id} value={c.id}>{c.name} — {c.university}</option>)}
            </Select>
          </> : <>
            <TextInput
              value={collegeSearch}
              onChangeText={setCollegeSearch}
              placeholder={text("Search colleges...","搜索学院...")}
              placeholderTextColor="#94A3B8"
              style={s.searchInput}
            />
            {collegeSearch.trim() ? <ScrollView style={s.collegeList} nestedScrollEnabled>
              <Pressable style={s.collegeItem} onPress={()=>{setCollegeId("all");setCollegeSearch("");}}>
                <Text style={s.collegeItemText}>{text("All colleges","所有学院")}</Text>
              </Pressable>
              {filteredColleges.map(c=>
                <Pressable key={c.id} style={[s.collegeItem,collegeId===c.id&&s.collegeItemActive]} onPress={()=>{setCollegeId(c.id);setCollegeSearch(c.name);}}>
                  <Text style={[s.collegeItemText,collegeId===c.id&&s.collegeItemTextActive]}>{c.name} — {c.university}</Text>
                </Pressable>
              )}
            </ScrollView> : null}
          </>}
        </View>}

        {/* Date filter */}
        <View style={s.field}>
          <Text style={s.label}>{text("Date","日期")}</Text>
          {Platform.OS==="web"
            ? <Input type="date" value={date} onChange={(e:any)=>setDate(e.target.value)} style={web}/>
            : <TextInput style={s.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor="#94A3B8"/>}
        </View>

        {/* Budget filter */}
        <View style={s.field}>
          <Text style={s.label}>{text("Max price","最高价格")}</Text>
          <View style={s.money}>
            <Text style={s.currency}>£</Text>
            <TextInput style={s.moneyInput} value={budget} onChangeText={setBudget} keyboardType="decimal-pad" placeholder={text("No limit","不限")} placeholderTextColor="#94A3B8"/>
          </View>
        </View>
      </View>
      <Pressable style={s.reset} onPress={reset}>
        <Ionicons name="refresh-outline" size={16} color={C.blue}/>
        <Text style={s.resetText}>{text("Reset filters","重置筛选")}</Text>
      </Pressable>
    </View>}

    {/* Results */}
    <View style={s.resultHead}>
      <Text style={s.resultTitle}>{text(`${filtered.length} listing${filtered.length===1?"":"s"}`,`${filtered.length} 条帖子`)}</Text>
      <Text style={s.resultHint}>{text("Listings disappear after their event time.","帖子会在活动时间后自动消失。")}</Text>
    </View>

    {filtered.length===0 ? <View style={s.empty}>
      <Ionicons name="search-outline" size={36} color="#94A3B8"/>
      <Text style={s.emptyTitle}>{text("No matching tickets","没有符合条件的票务")}</Text>
      <Text style={s.emptyText}>{text("Try a different date, city or price, or reset the filters.","请尝试其他日期、城市或价格，或重置筛选条件。")}</Text>
    </View> : <View style={[s.grid,mobile&&s.gridMobile]}>
      {filtered.map(item=><ListingCard key={item.id} item={item} mobile={mobile} seller={item.seller_user_id?sellers[item.seller_user_id]:undefined}/>)}
    </View>}
  </ScrollView>;
}

function ListingCard({item,mobile,seller}:{item:TicketListing;mobile:boolean;seller?:SellerInfo}){
  const {language,text}=useAppLanguage();
  const category=item.listing_category??"formal";
  const image=item.image_urls?.[0]??item.hall_photo_url;
  const title=category==="coach_train"
    ?`${item.origin_name??""} → ${item.destination_name??""}`
    :category==="event"
      ?(language==="zh"?(item.event_name_zh??item.event_name):(item.event_name_en??item.event_name))??text("Other event","其他活动")
      :item.colleges.name;
  const subtitle=category==="coach_train"
    ?`${item.formal_date} · ${String(item.formal_time).slice(0,5)} → ${item.arrival_date&&item.arrival_date!==item.formal_date?`${item.arrival_date} · `:""}${String(item.arrival_time??"").slice(0,5)} · ${formatDuration(item.duration_minutes,language)}`
    :`${item.formal_date} · ${String(item.formal_time).slice(0,5)}`;

  return <Pressable style={({pressed})=>[s.card,mobile&&s.cardMobile,pressed&&s.pressed]} onPress={()=>router.push(`/listing-detail?id=${item.id}`)}>
    {image ? <Image source={{uri:image}} style={s.image} contentFit="cover" cachePolicy="memory-disk" transition={120}/>
      : <View style={[s.image,s.imageEmpty]}><Ionicons name={category==="coach_train"?"train-outline":category==="event"?"calendar-outline":"restaurant-outline"} size={34} color="#8BA6C3"/></View>}
    <View style={s.cardBody}>
      {item.open_to_swap ? <View style={s.swapBadge}><Ionicons name="swap-horizontal" size={11} color="#78350F"/><Text style={s.swapBadgeText}>{text("SWAP","换票")}</Text></View> : null}
      <Text style={s.cardType} numberOfLines={1}>{localValue(item.campus??item.colleges.university,language)} · {localValue(item.ticket_type??item.formal_type,language)}</Text>
      <Text style={s.cardTitle} numberOfLines={2}>{title}</Text>
      <Text style={s.cardMeta} numberOfLines={2}>{subtitle}</Text>
      {seller?.is_verified ? <View style={s.verifiedRow}><Ionicons name="checkmark-circle" size={13} color="#047857"/><Text style={s.verifiedName}>{seller.full_name??(language==="zh"?"已认证卖家":"Verified seller")}</Text></View> : null}
      <View style={s.cardBottom}>
        <Text style={s.cardPrice}>£{Number(item.asking_price_gbp??item.student_listing_price_gbp??0).toFixed(2)}</Text>
        <Text style={s.details}>{text("Details →","详情 →")}</Text>
      </View>
    </View>
  </Pressable>;
}

function formatDuration(minutes:number|null|undefined,language:"en"|"zh"){if(!minutes)return language==="zh"?"未说明时长":"Duration N/A";const h=Math.floor(minutes/60),m=minutes%60;return language==="zh"?`${h}h${m?` ${m}m`:""}`:`${h}h${m?` ${m}m`:""}`;}
function localValue(value:string|null|undefined,language:"en"|"zh"){if(!value||language==="en")return value??"";const map:Record<string,string>={Oxford:"牛津",Cambridge:"剑桥","Hall Formal":"学院 Formal","MCR Guest Dinner":"MCR 宾客晚宴","Guest Night":"宾客之夜","Special Formal":"特别 Formal",Coach:"大巴",Train:"火车","Airport ride-share":"机场拼车","Other event":"其他活动"};return map[value]??value;}

const web={width:"100%",height:46,border:`1px solid ${C.border}`,borderRadius:12,padding:"0 12px",backgroundColor:"#F8FAFC",boxSizing:"border-box",color:C.navy,fontSize:14};
const s=StyleSheet.create({
  page:{flex:1,backgroundColor:C.bg},
  content:{width:"100%",maxWidth:1050,alignSelf:"center",padding:20,paddingTop:26,paddingBottom:80},
  contentMobile:{padding:12,paddingTop:16},

  top:{flexDirection:"row",alignItems:"center",gap:10,marginBottom:12},
  back:{width:40,height:40,borderRadius:20,backgroundColor:"#fff",borderWidth:1,borderColor:C.border,alignItems:"center",justifyContent:"center"},
  titleCopy:{flex:1,minWidth:0},
  eyebrow:{color:"#9A3412",fontSize:11,fontWeight:"900",letterSpacing:1},
  title:{color:C.navy,fontSize:28,fontWeight:"900"},
  titleMobile:{fontSize:24},
  filterToggle:{width:40,height:40,borderRadius:20,backgroundColor:"#fff",borderWidth:1,borderColor:C.border,alignItems:"center",justifyContent:"center"},

  pills:{flexDirection:"row",flexWrap:"wrap",gap:6,marginBottom:10},
  pill:{borderWidth:1,borderColor:C.border,borderRadius:99,paddingHorizontal:12,paddingVertical:8,backgroundColor:"#F8FAFC"},
  pillOn:{backgroundColor:C.navy,borderColor:C.navy},
  swapPill:{borderColor:"#F59E0B",backgroundColor:"#FFFBEB"},
  swapOn:{backgroundColor:"#B45309",borderColor:"#B45309"},
  pillText:{color:C.blue,fontSize:12,fontWeight:"900"},
  pillTextOn:{color:"#fff"},

  filterPanel:{backgroundColor:"#fff",borderWidth:1,borderColor:C.border,borderRadius:18,padding:14,marginBottom:12},
  filterGrid:{flexDirection:"row",flexWrap:"wrap",gap:10},
  filterStack:{flexDirection:"column"},
  field:{flex:1,minWidth:200,marginBottom:6},
  label:{color:C.muted,fontSize:11,fontWeight:"900",marginBottom:6,textTransform:"uppercase",letterSpacing:.4},
  input:{height:46,borderWidth:1,borderColor:C.border,borderRadius:12,backgroundColor:"#F8FAFC",paddingHorizontal:12,color:C.navy,fontSize:14},
  searchInput:{height:42,borderWidth:1,borderColor:C.border,borderRadius:10,backgroundColor:"#F8FAFC",paddingHorizontal:10,color:C.navy,fontSize:13,marginBottom:6},

  collegeList:{maxHeight:150,borderWidth:1,borderColor:C.border,borderRadius:10,backgroundColor:"#fff",marginBottom:6},
  collegeItem:{paddingHorizontal:12,paddingVertical:10,borderBottomWidth:1,borderBottomColor:"#F1F5F9"},
  collegeItemActive:{backgroundColor:"#EEF4FA"},
  collegeItemText:{color:C.navy,fontSize:13,fontWeight:"700"},
  collegeItemTextActive:{fontWeight:"900"},

  cityRow:{gap:6},
  sameCity:{height:44,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:6,borderWidth:1,borderColor:C.border,borderRadius:12,backgroundColor:"#F8FAFC"},
  sameCityOn:{backgroundColor:C.navy,borderColor:C.navy},
  sameCityText:{color:C.blue,fontSize:12,fontWeight:"900"},
  sameCityTextOn:{color:"#fff"},
  cityPills:{flexDirection:"row",gap:6,marginTop:4},
  city:{flex:1,alignItems:"center",padding:8,borderRadius:10,backgroundColor:"#F8FAFC"},
  cityOn:{backgroundColor:"#E8EEF4"},
  cityText:{color:C.muted,fontSize:11,fontWeight:"800"},
  cityTextOn:{color:C.navy},
  money:{height:46,flexDirection:"row",alignItems:"center",borderWidth:1,borderColor:C.border,borderRadius:12,backgroundColor:"#F8FAFC",paddingHorizontal:12},
  currency:{color:C.navy,fontWeight:"900"},
  moneyInput:{flex:1,minWidth:0,paddingHorizontal:6,color:C.navy,fontSize:14},
  reset:{alignSelf:"flex-end",flexDirection:"row",alignItems:"center",gap:5,marginTop:8,padding:6},
  resetText:{color:C.blue,fontSize:12,fontWeight:"900"},

  resultHead:{flexDirection:"row",justifyContent:"space-between",alignItems:"baseline",gap:10,flexWrap:"wrap",marginBottom:8},
  resultTitle:{color:C.navy,fontSize:17,fontWeight:"900"},
  resultHint:{color:C.muted,fontSize:11},

  grid:{flexDirection:"row",flexWrap:"wrap",gap:12},
  gridMobile:{gap:9},
  card:{width:"31.5%",minWidth:240,backgroundColor:"#fff",borderWidth:1,borderColor:C.border,borderRadius:18,overflow:"hidden"},
  cardMobile:{width:"48%",minWidth:0},
  pressed:{opacity:.65},
  image:{width:"100%",height:155,backgroundColor:"#E8EEF4"},
  imageEmpty:{alignItems:"center",justifyContent:"center"},
  cardBody:{padding:12},
  swapBadge:{alignSelf:"flex-start",flexDirection:"row",alignItems:"center",gap:3,backgroundColor:"#FEF3C7",borderRadius:99,paddingHorizontal:7,paddingVertical:3,marginBottom:5},
  swapBadgeText:{color:"#78350F",fontSize:9,fontWeight:"900"},
  cardType:{color:"#9A3412",fontSize:10,fontWeight:"900",textTransform:"uppercase",letterSpacing:.3},
  cardTitle:{color:C.navy,fontSize:15,lineHeight:19,fontWeight:"900",marginTop:4},
  cardMeta:{color:C.muted,fontSize:11,lineHeight:15,marginTop:4},
  verifiedRow:{flexDirection:"row",alignItems:"center",gap:4,marginTop:4},verifiedName:{color:"#047857",fontSize:11,fontWeight:"800"},
  cardBottom:{flexDirection:"row",alignItems:"baseline",justifyContent:"space-between",gap:6,marginTop:8},
  cardPrice:{color:"#9A3412",fontSize:17,fontWeight:"900"},
  details:{color:C.blue,fontSize:11,fontWeight:"900"},

  empty:{marginTop:12,backgroundColor:"#fff",borderRadius:18,borderWidth:1,borderColor:C.border,padding:36,alignItems:"center"},
  emptyTitle:{color:C.navy,fontSize:17,fontWeight:"900",marginTop:10},
  emptyText:{color:C.muted,marginTop:5,textAlign:"center"},
});
