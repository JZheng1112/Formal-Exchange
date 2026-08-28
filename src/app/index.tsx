import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import BottomNav from "../../components/BottomNav";
import {
  TicketListing,
  SellerInfo,
  loadVisibleActiveListings as loadActiveListings,
  loadSellerProfiles,
} from "../lib/formalApi";
import { useAppLanguage } from "../lib/language";
import { openHomeItemsMarket } from "../lib/externalLinks";
const F = [
  ["all", "All", "全部"],
  ["formal", "Formal", "Formal 晚宴"],
  ["hall", "Hall Formal", "学院 Formal"],
  ["mcr", "MCR Guest Dinner", "MCR 宾客晚宴"],
  ["coach", "Coach", "大巴"],
  ["train", "Train", "火车"],
  ["event", "Other events", "其他门票/拼车"],
  ["home", "Second-hand home items (liuxuejishi.com)", "二手家居用品（liuxuejishi.com）"],
];
export default function Home() {
  const { width } = useWindowDimensions();
  const [hydrated, setHydrated] = useState(Platform.OS !== "web");
  useEffect(() => setHydrated(true), []);
  if (Platform.OS === "web" && hydrated && width >= 760) return <WebLanding />;
  return <MarketplaceHome />;
}

export function MarketplaceHome() {
  const { language, text } = useAppLanguage();
  const params = useLocalSearchParams<{ filter?: string | string[] }>();
  const { width } = useWindowDimensions();
  const [hydrated, setHydrated] = useState(Platform.OS !== "web");
  const mobile = !hydrated || width < 600;
  const [items, setItems] = useState<TicketListing[]>([]);
  const [sellers, setSellers] = useState<Record<string, SellerInfo>>({});
  const [filter, setFilter] = useState("all");
  const [tradeMode, setTradeMode] = useState<"market" | "swap">("market");
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterKeyword, setFilterKeyword] = useState("");
  const [filterUni, setFilterUni] = useState<"all" | "Oxford" | "Cambridge">("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    setHydrated(true);
  }, []);
  useEffect(() => {
    const requested = Array.isArray(params.filter) ? params.filter[0] : params.filter;
    if (requested === "swap") {
      setTradeMode("swap");
      setFilter("all");
    }
  }, [params.filter]);
  useEffect(() => {
    loadActiveListings()
      .then((list) => {
        setItems(list);
        const ids = [...new Set(list.map((l) => l.seller_user_id).filter(Boolean) as string[])];
        if (ids.length) loadSellerProfiles(ids).then(setSellers);
      })
      .catch((e) => Alert.alert(text("Could not load listings", "无法加载帖子"), e.message));
  }, [language]);
  const query = searchQuery.trim().toLocaleLowerCase();
  const shown = items.filter((x) => {
    const inMode = tradeMode === "market" || Boolean(x.open_to_swap);
    const inCategory =
      filter === "all" ||
      (filter === "formal" && (x.listing_category ?? "formal") === "formal") ||
      (filter === "hall" && x.formal_type === "Hall Formal") ||
      (filter === "mcr" && x.formal_type === "MCR Guest Dinner") ||
      (filter === "coach" && ["Coach", "Coach ticket"].includes(x.ticket_type ?? "")) ||
      (filter === "train" && ["Train", "Train ticket"].includes(x.ticket_type ?? "")) ||
      (filter === "event" && x.listing_category === "event");
    const isFormal = (x.listing_category ?? "formal") === "formal";
    const uni = x.campus ?? x.colleges?.university;
    const inUni = !isFormal || filterUni === "all" || uni === filterUni;
    const kw = filterKeyword.trim().toLocaleLowerCase();
    const kwFields = [x.colleges?.name, x.colleges?.university, x.ticket_type, x.formal_type, x.origin_name, x.destination_name, x.event_name, x.event_name_en, x.event_name_zh, x.campus].filter(Boolean).join(" ").toLocaleLowerCase();
    const inKeyword = !kw || kwFields.includes(kw);
    const eventDate = x.formal_date ?? x.arrival_date ?? "";
    const inDateFrom = !filterDateFrom || eventDate >= filterDateFrom;
    const inDateTo = !filterDateTo || eventDate <= filterDateTo;
    const searchable = [
      x.colleges?.name,
      x.colleges?.university,
      x.ticket_type,
      x.formal_type,
      x.origin_name,
      x.destination_name,
      x.event_name,
      x.event_name_en,
      x.event_name_zh,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();
    return inMode && inCategory && inUni && inKeyword && inDateFrom && inDateTo && (!query || searchable.includes(query));
  });
  const chooseMode = (mode: "market" | "swap") => {
    setTradeMode(mode);
    setFilter("all");
  };
  const categoryButton = ([k, l, z]: string[], compact = false) => (
    <Pressable
      key={k}
      style={[
        compact ? s.mobileCategoryPill : s.pill,
        filter === k && s.on,
        k === "home" && s.homeCategory,
      ]}
      onPress={() => (k === "home" ? openHomeItemsMarket(language) : setFilter(k))}
    >
      <Text style={[s.pt, filter === k && k !== "home" && { color: "#fff" }]} numberOfLines={2}>
        {language === "zh" ? z : l}
      </Text>
    </Pressable>
  );
  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={s.page} contentContainerStyle={[s.c, mobile && s.cMobile]}>
        <View style={s.top}>
          <View>
            <Text style={[s.brand, mobile && s.brandMobile]}>FORMAL EXCHANGE</Text>
            <Text style={s.sub}>{text("Formal tickets first · Oxford & Cambridge", "主营 Formal 票交换 · 牛津与剑桥")}</Text>
          </View>
          <View style={s.topActions}>
            <Pressable style={s.iconButton} onPress={() => setSearchOpen((value) => !value)} accessibilityLabel={text("Search listings", "搜索帖子")}>
              <Ionicons name={searchOpen ? "close" : "search"} size={24} color="#071B3A" />
            </Pressable>
            <Pressable style={s.iconButton} onPress={() => router.push("/contact-support")} accessibilityLabel={text("Help", "帮助")}>
              <Ionicons name="help-circle-outline" size={25} color="#071B3A" />
            </Pressable>
          </View>
        </View>
        {searchOpen ? <>
          <View style={s.searchBox}>
            <Ionicons name="search" size={19} color="#64748B" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
              placeholder={text("Search tickets, help, features…", "搜索票务、帮助、功能…")}
              placeholderTextColor="#94A3B8"
              style={s.searchInput}
            />
            {searchQuery ? <Pressable onPress={() => setSearchQuery("")}><Ionicons name="close-circle" size={20} color="#94A3B8" /></Pressable> : null}
          </View>
          {query ? <SearchQuickLinks query={query} language={language} /> : null}
        </> : null}
        <View style={[s.modeBar, mobile && s.modeBarMobile]}>
          <Pressable style={[s.modeButton, s.swapModeButton, tradeMode === "swap" && s.swapModeActive]} onPress={() => chooseMode("swap")}>
            <Ionicons name="swap-horizontal" size={18} color={tradeMode === "swap" ? "#FFFFFF" : "#9A3412"} />
            <Text style={[s.modeText, s.swapModeText, tradeMode === "swap" && s.modeTextActive]}>{text("Ticket Swap", "票换票")}</Text>
          </Pressable>
          <Pressable style={[s.modeButton, tradeMode === "market" && s.marketModeActive]} onPress={() => chooseMode("market")}>
            <Ionicons name="storefront-outline" size={17} color={tradeMode === "market" ? "#FFFFFF" : "#071B3A"} />
            <Text style={[s.modeText, tradeMode === "market" && s.modeTextActive]}>{text("Marketplace", "一般交易")}</Text>
          </Pressable>
        </View>
        {!mobile ? <Pressable style={s.swapSpotlight} onPress={() => chooseMode("swap")}>
          <View style={s.swapSpotlightIcon}><Ionicons name="swap-horizontal" size={22} color="#FFFFFF" /></View>
          <View style={s.swapSpotlightCopy}>
            <Text style={s.swapSpotlightTitle}>{text("Ticket Swap · exchange tickets directly", "换票专区 · 直接用票换票")}</Text>
            <Text style={s.swapSpotlightText}>{text("Have one college ticket and want another? Find people open to a direct swap; any price difference is agreed between you.", "手里有一个学院的票、想换另一个学院？筛选愿意直接换票的用户；是否补差价由双方自行商定。")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={21} color="#9A3412" />
        </Pressable> : null}
        {mobile ? <>
          <View style={s.mobileCategoryRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.mobileCategoryScroll}>
              {F.filter(([k]) => k !== "home").map((entry) => categoryButton(entry, true))}
            </ScrollView>
            <Pressable style={s.expandButton} onPress={() => setCategoriesExpanded((value) => !value)} accessibilityLabel={text("Show all categories", "展开全部分类")}>
              <Ionicons name={categoriesExpanded ? "chevron-up" : "chevron-down"} size={22} color="#071B3A" />
            </Pressable>
          </View>
          {categoriesExpanded ? <View style={s.expandedCategories}>
            {F.map((entry) => categoryButton(entry, true))}
          </View> : null}
        </> : <View style={s.filters}>{F.map((entry) => categoryButton(entry))}</View>}
        <Text style={s.formalHint}>{text("Hall Formal and MCR Guest Dinner are types of Formal, not separate ticket categories.", "Hall Formal 和 MCR Guest Dinner 都是 Formal 的细分类，并不是与 Formal 并列的三种票。")}</Text>
        <Pressable style={s.filterToggle} onPress={() => setFiltersOpen(v => !v)}>
          <Ionicons name="options-outline" size={16} color="#071B3A" />
          <Text style={s.filterToggleText}>{text("Filters","筛选")}</Text>
          {(filterUni !== "all" || filterKeyword || filterDateFrom || filterDateTo) ? <View style={s.filterDot} /> : null}
          <Ionicons name={filtersOpen ? "chevron-up" : "chevron-down"} size={16} color="#64748B" />
        </Pressable>
        {filtersOpen ? <View style={s.filterBar}>
          <View style={s.filterRow}>
            <Text style={s.filterLabel}>{text("Keyword","关键词")}</Text>
            <View style={s.filterInputRow}>
              <Ionicons name="search-outline" size={15} color="#94A3B8" />
              <TextInput style={s.filterInput} placeholder={text("College, route, event…","学院、路线、活动…")} placeholderTextColor="#94A3B8" value={filterKeyword} onChangeText={setFilterKeyword} />
            </View>
          </View>
          {(filter === "all" || ["formal","hall","mcr"].includes(filter)) ? <View style={s.filterRow}>
            <Text style={s.filterLabel}>{text("University","大学")}</Text>
            <View style={s.filterChips}>
              {(["all","Oxford","Cambridge"] as const).map(u => <Pressable key={u} style={[s.filterChip, filterUni === u && s.filterChipOn]} onPress={() => setFilterUni(u)}><Text style={[s.filterChipText, filterUni === u && s.filterChipTextOn]}>{u === "all" ? text("All","全部") : u}</Text></Pressable>)}
            </View>
          </View> : null}
          <View style={s.filterRow}>
            <Text style={s.filterLabel}>{text("Date","日期")}</Text>
            <View style={s.filterInputRow}>
              <Ionicons name="calendar-outline" size={15} color="#94A3B8" />
              {Platform.OS === "web" ? <>
                <input type="date" value={filterDateFrom} onChange={(e: any) => setFilterDateFrom(e.target.value)} style={{flex:1,height:36,border:"1px solid #E2E8F0",borderRadius:10,paddingLeft:12,paddingRight:8,fontSize:13,color:"#071B3A",backgroundColor:"#FAFAF8",fontFamily:"inherit"} as any} />
                <Text style={{color:"#94A3B8",fontSize:13}}>–</Text>
                <input type="date" value={filterDateTo} onChange={(e: any) => setFilterDateTo(e.target.value)} style={{flex:1,height:36,border:"1px solid #E2E8F0",borderRadius:10,paddingLeft:12,paddingRight:8,fontSize:13,color:"#071B3A",backgroundColor:"#FAFAF8",fontFamily:"inherit"} as any} />
              </> : <>
                <TextInput style={s.filterInput} placeholder="YYYY-MM-DD" placeholderTextColor="#94A3B8" value={filterDateFrom} onChangeText={setFilterDateFrom} maxLength={10} />
                <Text style={{color:"#94A3B8",fontSize:13}}>–</Text>
                <TextInput style={s.filterInput} placeholder="YYYY-MM-DD" placeholderTextColor="#94A3B8" value={filterDateTo} onChangeText={setFilterDateTo} maxLength={10} />
              </>}
            </View>
          </View>
          {(filterUni !== "all" || filterKeyword || filterDateFrom || filterDateTo) ? <Pressable style={s.filterClear} onPress={() => { setFilterUni("all"); setFilterKeyword(""); setFilterDateFrom(""); setFilterDateTo(""); }}>
            <Ionicons name="close-circle-outline" size={14} color="#9A3412" />
            <Text style={s.filterClearText}>{text("Clear all filters","清除所有筛选")}</Text>
          </Pressable> : null}
        </View> : null}
        <View style={s.resultHeading}><Text style={[s.h, mobile && s.hMobile]}>{tradeMode === "swap" ? text("Tickets open to swaps", "愿意换票的帖子") : text("Latest seller listings", "最新卖家帖子")}</Text><Text style={s.resultCount}>{text(`${shown.length} listings`, `${shown.length} 条帖子`)}</Text></View>
        <View style={s.grid}>
          {shown.map((x) => (
            <Card key={x.id} x={x} mobile={mobile} language={language} seller={x.seller_user_id ? sellers[x.seller_user_id] : undefined} />
          ))}
          {items.length === 0 &&
            (filter === "all" ||
              ["formal", "hall", "mcr"].includes(filter)) && (
              <Demo filter={filter} mobile={mobile} />
            )}
        </View>
      </ScrollView>
      <BottomNav active="buyer" />
    </View>
  );
}
function WebLanding(){const {language,text}=useAppLanguage();const {width}=useWindowDimensions();const compact=width<760;return <ScrollView style={s.landing} contentContainerStyle={s.landingContent}>
  <View style={s.landingNav}><Text style={s.landingBrand}>FORMAL EXCHANGE</Text><Pressable style={s.landingNavLink} onPress={()=>router.push("/how-it-works")}><Text style={s.landingNavLinkText}>{text("How it works","使用说明")}</Text></Pressable></View>
  <View style={[s.heroLanding,compact&&s.heroLandingCompact]}><View style={s.heroCopy}><Text style={s.landingEyebrow}>{text("OXFORD · CAMBRIDGE · COMMUNITY MARKETPLACE","牛津 · 剑桥 · 校园社区平台")}</Text><Text style={[s.landingTitle,compact&&s.landingTitleCompact]}>{text("Help a hard-won Formal place find someone who can use it.","让来之不易的 Formal 名额，不再被白白浪费。")}</Text><Text style={s.landingLead}>{text("Formal tickets are scarce, yet plans change and official refund or resale routes are often limited. Formal Exchange brings permitted listings, buyer requests, travel tickets, ride-shares and college information into one clear place.","Formal 一票难求，但持票人也可能临时无法参加，而官方退款或转售渠道往往有限。Formal Exchange 将规则允许的帖子、买家需求、车票拼车与学院信息集中在一个清晰的平台中。")}</Text><Pressable style={s.landingSwapHero} onPress={()=>router.push("/marketplace?filter=swap")}><View style={s.landingSwapHeroIcon}><Ionicons name="swap-horizontal" size={23} color="#fff"/></View><View style={{flex:1}}><Text style={s.landingSwapHeroTitle}>{text("Ticket Swap is a core part of Formal Exchange","换票专区是 Formal Exchange 的核心功能")}</Text><Text style={s.landingSwapHeroText}>{text("Exchange one college ticket for another without requiring a cash sale. Any price difference remains your private decision.","不必先买卖，就能用一个学院的票直接交换另一个学院的票；是否补差价由双方自行决定。")}</Text></View><Ionicons name="arrow-forward" size={20} color="#9A3412"/></Pressable><View style={[s.landingActions,compact&&s.landingActionsCompact]}><Pressable style={s.landingPrimary} onPress={()=>router.push("/marketplace")}><Text style={s.landingPrimaryText}>{text("Enter web app","进入网页版")}</Text><Ionicons name="arrow-forward" size={19} color="#fff"/></Pressable><Pressable style={s.landingSecondary} onPress={()=>Alert.alert(text("App release in progress","APP 正在发布中"),text("The iOS and Android download links will appear here after the store builds are approved. The full web app is available now.","iOS 与 Android 商店版本通过审核后，下载链接会显示在这里；现在可以先使用完整网页版。"))}><Ionicons name="phone-portrait-outline" size={19} color="#071B3A"/><Text style={s.landingSecondaryText}>{text("Download app","下载 APP")}</Text></Pressable></View></View><View style={s.heroPanel}><View style={s.heroPanelIcon}><Ionicons name="restaurant-outline" size={34} color="#fff"/></View><Text style={s.heroPanelTitle}>{text("Formal first","主营 Formal")}</Text><Text style={s.heroPanelText}>{text("See eligibility, entry rules, dates, prices and transfer limits before making contact.","联系前即可查看资格、入场规则、日期、价格和转让限制。")}</Text><View style={s.heroSteps}>{[["1",text("Browse or request","浏览或求票")],["2",text("Check the rules","核对规则")],["3",text("Message safely","安全私信")]].map(([n,label])=><View key={n} style={s.heroStep}><Text style={s.heroStepNo}>{n}</Text><Text style={s.heroStepText}>{label}</Text></View>)}</View></View></View>
  <View style={s.landingGrid}>{[["shield-checkmark-outline",text("Verified community","认证社区"),text("Register with any email; users who verify with a UK .ac.uk academic email receive a verified badge. Only verified Oxford or Cambridge accounts can publish Formal tickets — keeping the marketplace safe and trustworthy. Our verification will expand to enterprise and global educational emails in the future.","任意邮箱即可注册；使用英国 .ac.uk 高校邮箱认证后将获得认证标识。只有认证的牛津或剑桥账号才能发布 Formal 票，保障平台安全可信。认证范围今后将扩展到企业邮箱和全球教育邮箱。")],["swap-horizontal-outline",text("Ticket swaps","换票专区"),text("Find members open to exchanging one ticket for another, with any price difference agreed privately.","寻找愿意票换票的用户；是否补差价由双方私下商定。")],["language-outline",text("Chinese or English","中英文自动适配"),text("Write once in your app language. Optional text is translated for readers using the other language, with the original available.","只需使用当前界面语言填写一次；选填文字自动翻译给另一语言用户，并保留原文。")]].map(([icon,title,body])=><View key={String(title)} style={s.landingFeature}><Ionicons name={icon as any} size={27} color="#9A3412"/><Text style={s.landingFeatureTitle}>{title}</Text><Text style={s.landingFeatureText}>{body}</Text></View>)}</View>
  <View style={s.landingFooter}><Text style={s.landingFooterBrand}>FORMAL EXCHANGE</Text><Text style={s.landingFooterText}>{text("Support: support@formal-exchange.co.uk","支持邮箱：support@formal-exchange.co.uk")}</Text></View>
</ScrollView>}
function Demo({ filter, mobile }: { filter: string; mobile: boolean }) {
  const { language, text } = useAppLanguage();
  const demos = [
    {
      id: "reuben",
      college: "Reuben College",
      type: "Hall Formal",
      university: "Oxford",
      price: "£24.00",
      quantity: 1,
      eventAt: "2026-09-05T19:00:00+01:00",
      dateLabel: "5 Sep 2026 · 19:00",
      image: require("../assets/demo-formal-hall.jpg"),
    },
    {
      id: "merton",
      college: "Merton College",
      type: "MCR Guest Dinner",
      university: "Oxford",
      price: "£38.00",
      quantity: 2,
      eventAt: "2026-09-12T19:15:00+01:00",
      dateLabel: "12 Sep 2026 · 19:15",
      image: require("../assets/demo-college-quad.jpg"),
    },
    {
      id: "kings",
      college: "King’s College",
      type: "Hall Formal",
      university: "Cambridge",
      price: "£28.00",
      quantity: 1,
      eventAt: "2026-09-19T19:30:00+01:00",
      dateLabel: "19 Sep 2026 · 19:30",
      image: require("../assets/demo-college-court.jpg"),
    },
    {
      id: "st-annes",
      college: "St Anne’s College",
      type: "Hall Formal",
      university: "Oxford",
      price: "£21.50",
      quantity: 2,
      eventAt: "2026-09-08T19:00:00+01:00",
      dateLabel: "8 Sep 2026 · 19:00",
      image: require("../assets/demo-oxford-evening.jpg"),
    },
    {
      id: "magdalen",
      college: "Magdalen College",
      type: "MCR Guest Dinner",
      university: "Oxford",
      price: "£42.00",
      quantity: 1,
      eventAt: "2026-09-15T19:15:00+01:00",
      dateLabel: "15 Sep 2026 · 19:15",
      image: require("../assets/demo-oxford-night.jpg"),
    },
    {
      id: "pembroke",
      college: "Pembroke College",
      type: "Hall Formal",
      university: "Cambridge",
      price: "£26.00",
      quantity: 3,
      eventAt: "2026-09-22T19:30:00+01:00",
      dateLabel: "22 Sep 2026 · 19:30",
      image: require("../assets/demo-college-roofs.jpg"),
    },
    {
      id: "wadham",
      college: "Wadham College",
      type: "Hall Formal",
      university: "Oxford",
      price: "£25.00",
      quantity: 1,
      eventAt: "2026-09-24T19:00:00+01:00",
      dateLabel: "24 Sep 2026 · 19:00",
      image: require("../assets/demo-college-quad.jpg"),
    },
    {
      id: "jesus",
      college: "Jesus College",
      type: "MCR Guest Dinner",
      university: "Cambridge",
      price: "£35.00",
      quantity: 2,
      eventAt: "2026-09-26T19:30:00+01:00",
      dateLabel: "26 Sep 2026 · 19:30",
      image: require("../assets/demo-formal-hall.jpg"),
    },
    {
      id: "st-johns",
      college: "St John’s College",
      type: "Hall Formal",
      university: "Oxford",
      price: "£29.00",
      quantity: 1,
      eventAt: "2026-09-29T19:15:00+01:00",
      dateLabel: "29 Sep 2026 · 19:15",
      image: require("../assets/demo-oxford-evening.jpg"),
    },
  ].filter(
    (demo) =>
      new Date(demo.eventAt).getTime() > Date.now() &&
      (filter === "all" ||
        filter === "formal" ||
        (filter === "hall" && demo.type === "Hall Formal") ||
        (filter === "mcr" && demo.type === "MCR Guest Dinner")),
  );

  const renderDemo = (demo: (typeof demos)[number], index: number) => (
        <Pressable
          style={[s.card, mobile && s.masonryCard]}
          key={demo.college}
          onPress={() => router.push(`/listing-detail?demo=${demo.id}`)}
        >
          <Image
            source={demo.image}
            style={[s.img, mobile && (index % 3 === 0 ? s.imgTall : s.imgMobile)]}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
          <Text style={[s.demo, mobile && s.demoMobile]}>{text("DEMO · NOT AVAILABLE TO BUY", "示例 · 不可购买")}</Text>
          <Text style={[s.college, mobile && s.collegeMobile]}>{demo.college}</Text>
          <Text style={[s.meta, mobile && s.metaMobile]}>
            {language === "zh" ? (demo.university === "Oxford" ? "牛津" : "剑桥") : demo.university} · {localDemoType(demo.type,language)} · {text(`${demo.quantity} left`, `剩余 ${demo.quantity} 个名额`)}
          </Text>
          <Text style={[s.meta, mobile && s.metaMobile]}>{demo.dateLabel}</Text>
          <View style={s.tags}>
            <Text style={s.tag}>{text("Vegan available", "可提供纯素餐")}</Text>
            <Text style={s.tag}>{text("Sample listing", "示例帖子")}</Text>
          </View>
          <Text style={[s.price, mobile && s.priceMobile]}>{demo.price}</Text>
          <Text style={[s.demoContact, mobile && s.demoContactMobile]}>{text("View full details →", "查看完整详情 →")}</Text>
        </Pressable>
  );

  if (mobile) {
    return (
      <View style={s.masonry}>
        <View style={s.masonryColumn}>
          {demos.filter((_, index) => index % 2 === 0).map((demo, index) => renderDemo(demo, index * 2))}
        </View>
        <View style={s.masonryColumn}>
          {demos.filter((_, index) => index % 2 === 1).map((demo, index) => renderDemo(demo, index * 2 + 1))}
        </View>
      </View>
    );
  }
  return <>{demos.map(renderDemo)}</>;
}
function localDemoType(value:string,language:"en"|"zh"){if(language==="en")return value;return ({"Hall Formal":"学院 Formal","MCR Guest Dinner":"MCR 宾客晚宴","Guest Night":"宾客之夜"} as Record<string,string>)[value]??value;}
const HELP_LINKS: { keys: string[]; en: string; zh: string; route: string; icon: string }[] = [
  { keys: ["how", "guide", "help", "使用", "帮助", "说明", "教程"], en: "How it works", zh: "使用说明", route: "/how-it-works", icon: "book-outline" },
  { keys: ["find", "browse", "buy", "ticket", "search", "买", "找", "浏览", "搜索", "票"], en: "Find tickets", zh: "找票", route: "/find-ticket", icon: "search-outline" },
  { keys: ["sell", "list", "create", "post", "publish", "发布", "卖", "帖子", "创建"], en: "List a ticket", zh: "发布帖子", route: "/list-ticket", icon: "add-circle-outline" },
  { keys: ["swap", "exchange", "换票", "交换"], en: "Ticket swaps", zh: "换票专区", route: "/marketplace?filter=swap", icon: "swap-horizontal-outline" },
  { keys: ["message", "chat", "contact", "私信", "消息", "联系", "聊天"], en: "Messages", zh: "消息", route: "/messages", icon: "chatbubbles-outline" },
  { keys: ["profile", "account", "setting", "avatar", "个人", "资料", "账号", "设置", "头像"], en: "My profile", zh: "我的资料", route: "/my-profile", icon: "person-outline" },
  { keys: ["verify", "verified", "badge", "认证", "标识", "验证"], en: "Get verified", zh: "账号认证", route: "/my-profile", icon: "shield-checkmark-outline" },
  { keys: ["activity", "history", "order", "记录", "活动", "历史"], en: "My activity", zh: "我的活动", route: "/my-activity", icon: "time-outline" },
  { keys: ["listing", "my listing", "管理", "我的帖子"], en: "My listings", zh: "我的帖子", route: "/my-listings", icon: "list-outline" },
  { keys: ["college", "rank", "rating", "学院", "排名", "评分", "评价"], en: "College rankings", zh: "学院排名", route: "/college-rankings", icon: "trophy-outline" },
  { keys: ["about", "关于", "formal exchange"], en: "About us", zh: "关于我们", route: "/about", icon: "information-circle-outline" },
  { keys: ["terms", "condition", "policy", "条款", "条件", "政策"], en: "Terms & conditions", zh: "条款", route: "/terms-and-conditions", icon: "document-text-outline" },
  { keys: ["support", "report", "problem", "客服", "举报", "问题", "反馈"], en: "Contact support", zh: "联系客服", route: "/contact-support", icon: "mail-outline" },
  { keys: ["request", "want", "buyer", "求票", "需要", "买家"], en: "Request a ticket", zh: "发布求票", route: "/request-ticket", icon: "hand-left-outline" },
  { keys: ["login", "sign in", "登录", "sign"], en: "Log in", zh: "登录", route: "/login", icon: "log-in-outline" },
  { keys: ["register", "sign up", "注册", "create account", "新账号"], en: "Register", zh: "注册", route: "/register", icon: "person-add-outline" },
];

function SearchQuickLinks({ query, language }: { query: string; language: "en" | "zh" }) {
  const matches = HELP_LINKS.filter((link) => link.keys.some((k) => query.includes(k) || k.includes(query)));
  if (!matches.length) return null;
  return (
    <View style={s.quickLinks}>
      <Text style={s.quickLinksTitle}>{language === "zh" ? "快速导航" : "Quick links"}</Text>
      {matches.slice(0, 5).map((link) => (
        <Pressable key={link.route + link.en} style={s.quickLink} onPress={() => router.push(link.route as any)}>
          <Ionicons name={link.icon as any} size={18} color="#123C69" />
          <Text style={s.quickLinkText}>{language === "zh" ? link.zh : link.en}</Text>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
        </Pressable>
      ))}
    </View>
  );
}

function Card({ x, mobile, language, seller }: { x: TicketListing; mobile: boolean; language:"en"|"zh"; seller?: SellerInfo }) {
  const travel = x.listing_category === "coach_train";
  const event = x.listing_category === "event";
  const image = x.image_urls?.[0] ?? x.hall_photo_url;
  return (
    <Pressable style={[s.card, mobile && s.cardMobile]} onPress={() => router.push(`/listing-detail?id=${x.id}`)}>
      {image ? <View style={{ position: "relative" }}>
        <Image source={{ uri: image }} style={[s.img, mobile && s.imgMobile]} contentFit="cover" cachePolicy="memory-disk" transition={120} />
        {x.open_to_swap ? <View style={s.swapBadgeOverlay}><Ionicons name="swap-horizontal" size={11} color="#78350F"/><Text style={s.swapBadgeText}>{language==="zh"?"换票":"SWAP"}</Text></View> : null}
      </View> : null}
      {!image && x.open_to_swap ? <View style={s.swapBadgeInline}><Ionicons name="swap-horizontal" size={11} color="#78350F"/><Text style={s.swapBadgeText}>{language==="zh"?"支持换票":"OPEN TO SWAP"}</Text></View> : null}
      <Text style={[s.cardLabel, mobile && s.cardLabelMobile]} numberOfLines={1}>
        {x.ticket_type ?? x.formal_type} · {x.campus ?? x.colleges.university}
      </Text>
      {travel ? (
        <>
          <Text style={[s.college, mobile && s.collegeMobile]} numberOfLines={2}>
            {x.origin_name} → {x.destination_name}
          </Text>
          <Text style={[s.meta, mobile && s.metaMobile]} numberOfLines={2}>
            {x.formal_date} · {String(x.formal_time).slice(0, 5)} → {x.arrival_date && x.arrival_date !== x.formal_date ? `${x.arrival_date} · ` : ""}
            {String(x.arrival_time ?? "").slice(0, 5)} · {formatDuration(x.duration_minutes)}
          </Text>
        </>
      ) : event ? (
        <>
          <Text style={[s.college, mobile && s.collegeMobile]} numberOfLines={2}>{language==="en"?(x.event_name_en??x.event_name??"Other event"):(x.event_name??x.event_name_en??"其他活动")}</Text>
          <Text style={[s.meta, mobile && s.metaMobile]}>{x.formal_date} · {String(x.formal_time).slice(0, 5)} · {x.ticket_quantity ?? 1} {language==="zh"?"个名额":"places"}</Text>
        </>
      ) : (
        <>
          <Text style={[s.college, mobile && s.collegeMobile]} numberOfLines={1}>{x.colleges.name}</Text>
          <Text style={[s.meta, mobile && s.metaMobile]}>
            {x.formal_date} · {String(x.formal_time).slice(0, 5)} · {x.remaining_student_seats ?? x.student_seats} {language==="zh"?"剩余":"left"}
          </Text>
        </>
      )}
      {seller?.is_verified ? <View style={s.sellerVerified}><Ionicons name="checkmark-circle" size={13} color="#047857" /><Text style={s.sellerVerifiedText}>{seller.full_name ?? (language==="zh"?"已认证":"Verified")}</Text></View> : null}
      <View style={s.cardFooter}>
        <Text style={[s.price, mobile && s.priceMobile]}>
          £{Number(x.asking_price_gbp ?? x.student_listing_price_gbp).toFixed(2)}
        </Text>
        <Text style={[s.demoContact, mobile && s.demoContactMobile]}>{language==="zh"?"详情 →":"Details →"}</Text>
      </View>
    </Pressable>
  );
}
function formatDuration(minutes?:number|null){if(!minutes)return "Duration not stated";const h=Math.floor(minutes/60),m=minutes%60;return `${h} hr${h===1?"":"s"}${m?` ${m} min`:""}`;}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F4EE" },
  c: {
    boxSizing: "border-box",
    maxWidth: 1050,
    width: "100%",
    alignSelf: "center",
    padding: 17,
    paddingTop: 30,
    paddingBottom: 105,
  },
  cMobile: { padding: 12, paddingTop: 18, paddingBottom: 108 },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: { fontSize: 22, fontWeight: "900", color: "#071B3A" },
  brandMobile: { fontSize: 19 },
  sub: { fontSize: 12, color: "#64748B", marginTop: 3 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 2 },
  iconButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  searchBox: { marginTop: 11, minHeight: 48, flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 16, borderWidth: 1, borderColor: "#CBD5E1", backgroundColor: "#FFFFFF", paddingHorizontal: 13 },
  searchInput: { flex: 1, minWidth: 0, color: "#071B3A", fontSize: 14, paddingVertical: 11, outlineStyle: "none" } as any,
  quickLinks: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 14, padding: 10, marginBottom: 8 }, quickLinksTitle: { color: "#64748B", fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, paddingHorizontal: 6 }, quickLink: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9, paddingHorizontal: 6, borderRadius: 10 }, quickLinkText: { flex: 1, color: "#071B3A", fontWeight: "800", fontSize: 14 },
  modeBar: { marginTop: 14, flexDirection: "row", alignSelf: "flex-start", gap: 6, padding: 4, borderRadius: 16, backgroundColor: "#E9EEF5" },
  modeBarMobile: { alignSelf: "stretch", gap: 4 },
  modeButton: { minHeight: 40, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6 },
  swapModeButton: { borderWidth: 1, borderColor: "#F59E0B", backgroundColor: "#FFFBEB" },
  swapModeActive: { flex: 1, backgroundColor: "#B45309", borderColor: "#B45309" },
  marketModeActive: { flex: 1, backgroundColor: "#071B3A" },
  modeText: { color: "#071B3A", fontSize: 13, fontWeight: "900" },
  swapModeText: { color: "#9A3412" },
  modeTextActive: { color: "#FFFFFF" },
  swapSpotlight: { marginTop: 15, flexDirection: "row", alignItems: "center", gap: 11, borderRadius: 18, borderWidth: 1, borderColor: "#F59E0B", backgroundColor: "#FFFBEB", padding: 12 },
  swapSpotlightIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#B45309", alignItems: "center", justifyContent: "center" },
  swapSpotlightCopy: { flex: 1 },
  swapSpotlightTitle: { color: "#78350F", fontSize: 14, fontWeight: "900" },
  swapSpotlightText: { color: "#92400E", fontSize: 11, lineHeight: 16, marginTop: 3 },
  filters: { gap: 7, paddingVertical: 15, flexDirection: "row", flexWrap: "wrap" },
  mobileCategoryRow: { marginTop: 10, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  mobileCategoryScroll: { gap: 4, paddingRight: 5 },
  mobileCategoryPill: { minHeight: 42, minWidth: 62, maxWidth: 150, paddingHorizontal: 13, paddingVertical: 8, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  expandButton: { width: 42, height: 42, marginLeft: 3, borderLeftWidth: 1, borderLeftColor: "#E2E8F0", backgroundColor: "#F7F4EE", alignItems: "center", justifyContent: "center" },
  expandedCategories: { flexDirection: "row", flexWrap: "wrap", gap: 7, padding: 10, marginTop: 4, backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  homeCategory: { borderWidth: 1, borderColor: "#D6C7A1", backgroundColor: "#FFFBEB", maxWidth: 260 },
  pill: {
    borderWidth: 1,
    borderColor: "#D6C7A1",
    backgroundColor: "#fff",
    borderRadius: 99,
    paddingHorizontal: 13,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  on: { backgroundColor: "#071B3A" },
  pt: { fontSize: 12, lineHeight: 15, textAlign: "center", fontWeight: "900", color: "#071B3A" },
  formalHint: { marginTop: 6, marginBottom: 8, color: "#64748B", fontSize: 11, lineHeight: 16 },
  filterToggle: { flexDirection: "row", alignItems: "center", gap: 7, alignSelf: "flex-start", paddingVertical: 9, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#fff", marginBottom: 10 },
  filterToggleText: { fontSize: 13, fontWeight: "800", color: "#071B3A" },
  filterDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#9A3412" },
  filterBar: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 16, padding: 16, marginBottom: 12, gap: 14 },
  filterRow: { gap: 7 },
  filterLabel: { fontSize: 11, fontWeight: "900", color: "#64748B", letterSpacing: 0.6, textTransform: "uppercase" as const, marginBottom: 1 },
  filterChips: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#F7F4EE" },
  filterChipOn: { backgroundColor: "#071B3A", borderColor: "#071B3A" },
  filterChipText: { fontSize: 12, fontWeight: "800", color: "#071B3A" },
  filterChipTextOn: { color: "#fff" },
  filterInputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  filterInput: { flex: 1, height: 38, borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 10, paddingHorizontal: 12, fontSize: 13, color: "#071B3A", backgroundColor: "#FAFAF8" },
  filterClear: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingVertical: 6, paddingHorizontal: 2 },
  filterClearText: { fontSize: 12, fontWeight: "800", color: "#9A3412" },
  h: { fontSize: 27, fontWeight: "900", color: "#071B3A" },
  hMobile: { fontSize: 23, marginTop: 3 },
  resultHeading: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginTop: 20, marginBottom: 10 },
  resultCount: { color: "#64748B", fontSize: 11, fontWeight: "800" },
  grid: { marginTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "48%",
    minWidth: 280,
    flexGrow: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 22,
    padding: 16,
  },
  cardMobile: { width: "48%", minWidth: 0, borderRadius: 18, padding: 11 },
  masonry: { width: "100%", flexDirection: "row", alignItems: "flex-start", gap: 9 },
  masonryColumn: { flex: 1, gap: 9 },
  masonryCard: { width: "100%", minWidth: 0, borderRadius: 18, padding: 9 },
  img: { width: "100%", height: 170, borderRadius: 15, marginBottom: 12 },
  imgMobile: { height: 150, borderRadius: 12, marginBottom: 9 },
  imgTall: { height: 205, borderRadius: 12, marginBottom: 9 },
  demo: { fontSize: 11, fontWeight: "900", color: "#9A3412" },
  demoMobile: { fontSize: 9, lineHeight: 12 },
  cardLabel: { fontSize: 11, fontWeight: "900", color: "#9A3412", marginTop: 2 },
  cardLabelMobile: { fontSize: 10, lineHeight: 13 },
  college: { fontSize: 19, fontWeight: "900", color: "#071B3A", marginTop: 6 },
  collegeMobile: { fontSize: 15, lineHeight: 19, marginTop: 4 },
  meta: { marginTop: 5, color: "#64748B", fontWeight: "700", fontSize: 12 },
  metaMobile: { fontSize: 11, lineHeight: 15, marginTop: 4 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 8 },
  tag: {
    fontSize: 10,
    fontWeight: "800",
    backgroundColor: "#EEF2F7",
    padding: 6,
    borderRadius: 99,
    color: "#29466F",
  },
  sellerVerified: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }, sellerVerifiedText: { color: "#047857", fontSize: 11, fontWeight: "800" },
  cardFooter: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: 10, gap: 8 },
  price: { fontSize: 18, fontWeight: "900", color: "#071B3A" },
  priceMobile: { fontSize: 16 },
  demoContact: { color: "#065F46", fontWeight: "900", fontSize: 12 },
  demoContactMobile: { fontSize: 11 },
  swapBadgeOverlay: { position: "absolute", zIndex: 3, top: 8, left: 8, flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 99, backgroundColor: "#FEF3C7", paddingHorizontal: 7, paddingVertical: 4 },
  swapBadgeInline: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 99, backgroundColor: "#FEF3C7", paddingHorizontal: 7, paddingVertical: 4, marginBottom: 4 },
  swapBadgeText: { color: "#78350F", fontSize: 9, fontWeight: "900" },
  landing:{flex:1,backgroundColor:"#F5F1E8"},landingContent:{width:"100%",maxWidth:1240,alignSelf:"center",padding:28,paddingBottom:55},landingNav:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingVertical:8},landingBrand:{color:"#071B3A",fontSize:19,fontWeight:"900",letterSpacing:.6},landingNavLink:{paddingHorizontal:14,paddingVertical:10},landingNavLinkText:{color:"#071B3A",fontWeight:"900"},heroLanding:{marginTop:42,flexDirection:"row",gap:28,alignItems:"stretch"},heroLandingCompact:{flexDirection:"column",marginTop:24},heroCopy:{flex:1.2,justifyContent:"center",paddingVertical:26},landingEyebrow:{color:"#9A3412",fontSize:11,fontWeight:"900",letterSpacing:1.4},landingTitle:{color:"#071B3A",fontSize:54,lineHeight:61,fontWeight:"900",marginTop:14},landingTitleCompact:{fontSize:38,lineHeight:44},landingLead:{color:"#526278",fontSize:18,lineHeight:29,marginTop:19,maxWidth:720},landingSwapHero:{marginTop:20,flexDirection:"row",alignItems:"center",gap:12,borderWidth:1,borderColor:"#F59E0B",backgroundColor:"#FFFBEB",borderRadius:19,padding:14,maxWidth:720},landingSwapHeroIcon:{width:45,height:45,borderRadius:14,backgroundColor:"#B45309",alignItems:"center",justifyContent:"center"},landingSwapHeroTitle:{color:"#78350F",fontSize:15,fontWeight:"900"},landingSwapHeroText:{color:"#92400E",fontSize:12,lineHeight:18,marginTop:3},landingActions:{flexDirection:"row",gap:11,marginTop:22},landingActionsCompact:{flexDirection:"column"},landingPrimary:{minHeight:56,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9,backgroundColor:"#071B3A",borderRadius:17,paddingHorizontal:22},landingPrimaryText:{color:"#fff",fontWeight:"900",fontSize:15},landingSecondary:{minHeight:56,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9,backgroundColor:"#fff",borderWidth:1,borderColor:"#D6C7A1",borderRadius:17,paddingHorizontal:22},landingSecondaryText:{color:"#071B3A",fontWeight:"900",fontSize:15},heroPanel:{flex:1,backgroundColor:"#071B3A",borderRadius:30,padding:28,minHeight:390,justifyContent:"center"},heroPanelIcon:{width:60,height:60,borderRadius:20,backgroundColor:"#9A3412",alignItems:"center",justifyContent:"center"},heroPanelTitle:{color:"#fff",fontSize:30,fontWeight:"900",marginTop:23},heroPanelText:{color:"#D5DFEB",fontSize:15,lineHeight:24,marginTop:9},heroSteps:{marginTop:24,gap:10},heroStep:{flexDirection:"row",alignItems:"center",gap:10},heroStepNo:{width:28,height:28,borderRadius:14,backgroundColor:"#fff",color:"#071B3A",fontWeight:"900",textAlign:"center",lineHeight:28},heroStepText:{color:"#fff",fontWeight:"800"},landingGrid:{flexDirection:"row",flexWrap:"wrap",gap:14,marginTop:50},landingFeature:{flex:1,minWidth:260,backgroundColor:"#fff",borderWidth:1,borderColor:"#E2E8F0",borderRadius:23,padding:22},landingFeatureTitle:{color:"#071B3A",fontSize:19,fontWeight:"900",marginTop:13},landingFeatureText:{color:"#64748B",lineHeight:22,marginTop:7},landingFooter:{marginTop:45,paddingTop:24,borderTopWidth:1,borderTopColor:"#D6C7A1",flexDirection:"row",justifyContent:"space-between",gap:12,flexWrap:"wrap"},landingFooterBrand:{color:"#071B3A",fontWeight:"900"},landingFooterText:{color:"#64748B"},
});
