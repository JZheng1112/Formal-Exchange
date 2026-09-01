import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import {
  SellerInfo,
  TicketListing,
  getCurrentUser,
  loadPublicProfile,
  isItemSaved,
  loadVisibleListingById,
  openConversation,
  toggleSavedItem,
  submitListingReport,
} from "../lib/formalApi";
import { useAppLanguage } from "../lib/language";

const C = { bg: "#F5F1E8", navy: "#071B3A", blue: "#123C69", gold: "#C8A951", muted: "#64748B", border: "#DFE5EC", danger: "#991B1B", accent: "#9A3412" };

const DEMOS = [
  { id: "reuben", college: "Reuben College", university: "Oxford", type: "Hall Formal", date: "2026-09-05", time: "19:00", price: 24, quantity: 1, image: require("../assets/demo-formal-hall.jpg"), dress: "Formal / gowns", idRule: "University card", entry: "Guest allowed with host", escort: true, dietary: ["Vegan available", "Vegetarian available"], details: "Sample listing showing the information a seller should provide before a buyer makes contact." },
  { id: "merton", college: "Merton College", university: "Oxford", type: "MCR Guest Dinner", date: "2026-09-12", time: "19:15", price: 38, quantity: 2, image: require("../assets/demo-college-quad.jpg"), dress: "Formal / gowns", idRule: "Government photo ID", entry: "Oxford or Cambridge member only", escort: true, dietary: ["Vegetarian available"], details: "Sample MCR guest-dinner listing. The seller confirms eligibility and any guest-name deadline before agreement." },
  { id: "kings", college: "King’s College", university: "Cambridge", type: "Hall Formal", date: "2026-09-19", time: "19:30", price: 28, quantity: 1, image: require("../assets/demo-college-court.jpg"), dress: "Formal / gowns", idRule: "University card", entry: "Guest allowed with host", escort: true, dietary: ["Vegan available"], details: "Sample Cambridge Formal listing with host accompaniment required." },
  { id: "st-annes", college: "St Anne’s College", university: "Oxford", type: "Hall Formal", date: "2026-09-08", time: "19:00", price: 21.5, quantity: 2, image: require("../assets/demo-oxford-evening.jpg"), dress: "Smart casual", idRule: "University card", entry: "Ask seller before purchase", escort: false, dietary: ["Vegetarian available", "Gluten-free available"], details: "Sample listing. Exact college rules must always be confirmed by the seller." },
  { id: "magdalen", college: "Magdalen College", university: "Oxford", type: "MCR Guest Dinner", date: "2026-09-15", time: "19:15", price: 42, quantity: 1, image: require("../assets/demo-oxford-night.jpg"), dress: "Formal / gowns", idRule: "Both university card and photo ID", entry: "Oxford or Cambridge member only", escort: true, dietary: ["Vegan available", "Halal available"], details: "Sample MCR dinner listing with an advance identity check." },
  { id: "pembroke", college: "Pembroke College", university: "Cambridge", type: "Hall Formal", date: "2026-09-22", time: "19:30", price: 26, quantity: 3, image: require("../assets/demo-college-roofs.jpg"), dress: "Formal / gowns", idRule: "University card", entry: "Guest allowed with host", escort: true, dietary: ["Vegetarian available"], details: "Sample multi-place listing. A real seller may allow the places to be sold separately." },
  { id: "wadham", college: "Wadham College", university: "Oxford", type: "Hall Formal", date: "2026-09-24", time: "19:00", price: 25, quantity: 1, image: require("../assets/demo-college-quad.jpg"), dress: "Formal / gowns", idRule: "University card", entry: "Ask seller before purchase", escort: true, dietary: ["Vegan available"], details: "Sample listing; contact opens a conversation with the Formal Exchange team." },
  { id: "jesus", college: "Jesus College", university: "Cambridge", type: "MCR Guest Dinner", date: "2026-09-26", time: "19:30", price: 35, quantity: 2, image: require("../assets/demo-formal-hall.jpg"), dress: "Formal / gowns", idRule: "University card", entry: "Oxford or Cambridge member only", escort: true, dietary: ["Vegetarian available"], details: "Sample Cambridge MCR listing with two places." },
  { id: "st-johns", college: "St John’s College", university: "Oxford", type: "Hall Formal", date: "2026-09-29", time: "19:15", price: 29, quantity: 1, image: require("../assets/demo-oxford-evening.jpg"), dress: "Formal / gowns", idRule: "Government photo ID", entry: "Guest allowed with host", escort: true, dietary: ["Vegan available", "Vegetarian available"], details: "Sample late-September listing. It disappears from the feed automatically after the event time." },
];

export default function ListingDetail() {
  const { language, text } = useAppLanguage();
  const { width } = useWindowDimensions();
  const compact = width < 720;
  // contentCompact pads 12 each side, so a photo spans the rest of the viewport.
  const heroWidth = Math.max(0, width - 24);
  const params = useLocalSearchParams<{ id?: string; demo?: string }>();
  const [hydrated, setHydrated] = useState(Platform.OS !== "web");
  const demo = useMemo(() => DEMOS.find((item) => item.id === params.demo), [params.demo]);
  const [listing, setListing] = useState<TicketListing | null>(null);
  const [loading, setLoading] = useState(Boolean(params.id));
  const [showContacts, setShowContacts] = useState(false);
  const [contacting, setContacting] = useState(false);
  const [contactStatus, setContactStatus] = useState("");
  const [showOriginal, setShowOriginal] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<SellerInfo | null>(null);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    loadVisibleListingById(params.id)
      .then((l) => {
        setListing(l);
        if (l?.seller_user_id) loadPublicProfile(l.seller_user_id).then(setSellerProfile);
      })
      .catch((error) => Alert.alert(text("Could not load listing", "无法加载帖子"), error.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  const formal = listing ? (listing.listing_category ?? "formal") === "formal" : Boolean(demo);
  const transport = listing?.listing_category === "coach_train";
  const event = listing?.listing_category === "event";
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (listing?.id) isItemSaved("listing", listing.id).then(setSaved).catch(() => {}); }, [listing?.id]);
  const images = listing ? ([...(listing.image_urls ?? []), ...(listing.hall_photo_url ? [listing.hall_photo_url] : [])].filter((value, index, all) => Boolean(value) && all.indexOf(value) === index)) : [];
  const title = demo?.college ?? (transport ? `${listing?.origin_name ?? ""} → ${listing?.destination_name ?? ""}` : event ? localContent(listing?.event_name, listing?.event_name_en, listing?.event_name_zh, listing?.content_language, language, showOriginal) || text("Event listing", "活动门票") : listing?.colleges?.name ?? text("Ticket listing", "票务帖子"));
  const type = localValue(demo?.type ?? listing?.ticket_type ?? listing?.formal_type ?? "Ticket", language);
  const campus = demo?.university ?? listing?.campus ?? listing?.colleges?.university;
  const date = demo?.date ?? listing?.formal_date;
  const time = demo?.time ?? String(listing?.formal_time ?? "").slice(0, 5);
  const price = demo?.price ?? Number(listing?.asking_price_gbp ?? listing?.student_listing_price_gbp ?? 0);
  const quantity = demo?.quantity ?? listing?.ticket_quantity ?? ((listing?.remaining_student_seats ?? listing?.student_seats ?? 0) + (listing?.remaining_guest_seats ?? listing?.guest_seats ?? 0));
  const expiredDemo = demo ? new Date(`${demo.date}T${demo.time}:00+01:00`).getTime() <= Date.now() : false;

  async function contact() {
    if (expiredDemo) return Alert.alert(text("Sample expired", "示例已过期"), text("This sample listing has passed and is no longer contactable.", "此示例帖子已过期，无法再联系。"));
    try {
      setContacting(true);
      setContactStatus(text("Checking your account…", "正在检查账号…"));
      const user = await getCurrentUser();
      if (!user) {
        setContactStatus(text("Log in to start this conversation.", "请登录后开始对话。"));
        router.push("/login");
        return;
      }
      setContactStatus(text("Opening your conversation…", "正在打开对话…"));
      const conversation = await openConversation({
        listingId: listing?.id ?? null,
        subject: `${demo ? text("Demo enquiry", "示例咨询") : text("Ticket enquiry", "票务咨询")} · ${title}`,
        sellerUserId: listing?.seller_user_id ?? null,
        sellerEmail: demo ? "support@formal-exchange.co.uk" : listing?.seller_contact_email ?? "support@formal-exchange.co.uk",
        isDemo: Boolean(demo),
      });
      setContactStatus(text("Conversation opened.", "对话已打开。"));
      router.replace(`/messages?conversationId=${conversation.id}`);
    } catch (error: any) {
      const message = error?.message ?? text("Please try again.", "请重试。");
      setContactStatus(`${text("Could not start conversation", "无法开始对话")}: ${message}`);
      Alert.alert(text("Could not start conversation", "无法开始对话"), message);
    } finally {
      setContacting(false);
    }
  }

  async function toggleSave() {
    if (!listing) return;
    try {
      setSaved(await toggleSavedItem("listing", listing.id));
    } catch (error: any) {
      Alert.alert(text("Could not save", "收藏失败"), error?.message ?? text("Please log in first.", "请先登录。"));
    }
  }

  async function report() {
    if (!listing) return router.push("/contact-support");
    try {
      await submitListingReport({ listing_id: listing.id, report_type: "Other", message: "Please review this listing for accuracy, eligibility or safety." });
      Alert.alert(text("Report received", "举报已收到"), text("The support team will review this listing.", "支持团队将审核此帖子。"));
    } catch (error: any) {
      Alert.alert(text("Could not send report", "无法提交举报"), error.message);
    }
  }

  if (!hydrated) return <View style={s.center} />;
  if (loading) return <View style={s.center}><Text style={s.loading}>{text("Loading ticket…", "正在加载票务…")}</Text></View>;
  if (!listing && !demo) return <View style={s.center}><Ionicons name="ticket-outline" size={40} color={C.muted} /><Text style={s.missingTitle}>{text("Listing unavailable", "帖子不可用")}</Text><Text style={s.missing}>{text("It may have expired, been withdrawn, sold, or be restricted to a different buyer group.", "帖子可能已过期、撤下、售出，或仅对其他买家群体可见。")}</Text><Pressable style={({pressed}) => [s.primary, pressed && s.pressed]} onPress={() => router.replace("/")}><Text style={s.primaryText}>{text("Back to listings", "返回帖子列表")}</Text></Pressable></View>;

  return <ScrollView style={s.page} contentContainerStyle={[s.content, compact && s.contentCompact]}>
    <View style={s.topbar}>
      <Pressable style={({pressed}) => [s.iconButton, pressed && s.pressed]} onPress={() => router.canGoBack()?router.back():router.replace("/")}><Ionicons name="chevron-back" size={23} color={C.navy} /></Pressable>
      <Text style={s.topTitle}>{text("Ticket details", "票务详情")}</Text>
      {/*
       * A lone flag in the corner read as "bookmark", so people pressed it
       * expecting to save the ticket and instead filed a report. Saving now
       * has its own button and the flag only means report.
       */}
      <View style={s.topActions}>
        <Pressable
          style={s.iconButton}
          onPress={toggleSave}
          accessibilityLabel={saved ? text("Remove from saved", "取消收藏") : text("Save this ticket", "收藏此票")}
        >
          <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={20} color={saved ? C.accent : C.navy} />
        </Pressable>
        <Pressable style={({pressed}) => [s.iconButton, pressed && s.pressed]} onPress={report} accessibilityLabel={text("Report this listing", "举报此帖")}>
          <Ionicons name="flag-outline" size={20} color={C.navy} />
        </Pressable>
      </View>
    </View>

    {demo ? <View style={s.demoBanner}><Ionicons name="information-circle-outline" size={19} color="#92400E" /><Text style={s.demoText}>{text("DEMO · This sample is not a real ticket. Contact opens a conversation with the Formal Exchange team.", "示例 · 这不是真实票务。点击联系会与 Formal Exchange 团队开始对话。")}</Text></View> : null}
    {expiredDemo ? <View style={s.expired}><Text style={s.expiredText}>{text("This sample has expired and is no longer available.", "此示例已过期，不再可用。")}</Text></View> : null}

    {/*
     * heroCompact used width "100%". Inside a horizontal ScrollView there is
     * no parent width for a percentage to resolve against, so each photo
     * collapsed and the gallery rendered as a tall empty band. Pages are sized
     * in real pixels from the viewport instead.
     */}
    {demo ? <Image source={demo.image} style={[s.hero, compact && { ...s.heroCompact, width: heroWidth }]} contentFit="cover" cachePolicy="memory-disk" /> : images.length ? <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={s.gallery}>{images.map((uri) => <Image key={uri} source={{ uri }} style={[s.hero, compact && { ...s.heroCompact, width: heroWidth }]} contentFit="cover" cachePolicy="memory-disk" transition={150} />)}</ScrollView> : <View style={[s.hero, s.placeholder, compact && { ...s.heroCompact, width: heroWidth }]}><Ionicons name={transport ? "train-outline" : event ? "calendar-outline" : "restaurant-outline"} size={50} color="#8BA6C3" /></View>}

    <View style={s.summaryCard}>
      <View style={s.badges}><Badge text={localValue(campus ?? "University", language)} /><Badge text={type} />{listing?.open_to_swap?<View style={s.swapBadge}><Ionicons name="swap-horizontal" size={14} color="#78350F"/><Text style={s.swapBadgeText}>{text("Supports ticket swaps","支持票换票")}</Text></View>:null}</View>
      <Text style={[s.title, compact && s.titleCompact]}>{title}</Text>
      <Text style={s.date}>{date} · {time}</Text>
      <View style={s.priceRow}><Text style={s.price}>£{price.toFixed(2)}</Text><Text style={s.quantity}>{text(`${quantity} ${quantity === 1 ? "place" : "places"} available`, `剩余 ${quantity} 个名额`)}</Text></View>
      {!demo && sellerProfile?.full_name ? <View style={s.sellerRow}><Ionicons name="person-circle-outline" size={20} color={C.muted} /><Text style={s.sellerName}>{sellerProfile.full_name}</Text>{sellerProfile.is_verified ? <View style={s.verifiedBadge}><Ionicons name="checkmark-circle" size={15} color="#047857" /><Text style={s.verifiedText}>{text("Verified","已认证")}</Text></View> : null}</View> : null}
      {!demo && listing?.content_language && listing.content_language !== language ? <Pressable style={({pressed}) => [s.originalButton, pressed && s.pressed]} onPress={()=>setShowOriginal(value=>!value)}><Ionicons name="language-outline" size={17} color={C.blue}/><Text style={s.originalText}>{showOriginal?text("Show translation","显示译文"):text("View original","查看原文")}</Text></Pressable>:null}
    </View>

    {transport ? <Section title={text("Journey", "行程")}>
      <RouteRow from={listing?.origin_name ?? "—"} to={listing?.destination_name ?? "—"} />
      <InfoRow icon="time-outline" label={text("Departure", "出发")} value={`${listing?.formal_date} · ${String(listing?.formal_time ?? "").slice(0, 5)}`} />
      <InfoRow icon="flag-outline" label={text("Arrival", "到达")} value={`${listing?.arrival_date ?? listing?.formal_date} · ${String(listing?.arrival_time ?? "").slice(0, 5)}`} />
      <InfoRow icon="hourglass-outline" label={text("Duration", "时长")} value={formatDuration(listing?.duration_minutes, language)} />
      {listing?.operator_name ? <InfoRow icon="business-outline" label={text("Operator", "运营商")} value={listing.operator_name} /> : null}
      {listing?.notes ? <InfoRow icon="alert-circle-outline" label={text("Conditions", "使用条件")} value={localValue(listing.notes, language)} /> : null}
    </Section> : null}

    {event ? <Section title={listing?.event_kind === "airport_ride_share" ? text("Ride-share details", "拼车详情") : text("Event details", "活动详情")}>
      {listing?.event_kind === "airport_ride_share" ? <RouteRow from={listing?.origin_name ?? "—"} to={listing?.destination_name ?? "—"} /> : null}
      <InfoRow icon="people-outline" label={text("Places", "名额")} value={String(quantity)} />
      <InfoRow icon="document-text-outline" label={text("Optional note", "可选备注")} value={localContent(listing?.event_description,listing?.event_description_en,listing?.event_description_zh,listing?.content_language,language,showOriginal)||text("No additional note.","没有补充备注。")} />
    </Section> : null}

    {listing?.open_to_swap ? <Section title={text("Ticket swap", "票换票")}><View style={s.safety}><Ionicons name="swap-horizontal" size={24} color="#92400E"/><Text style={s.safetyText}>{text("This remains a normal listing: you may still contact the seller about an ordinary purchase. The badge also means the seller is open to exchanging this ticket for another eligible ticket. A direct swap or any optional price difference is discussed privately in messages; Formal Exchange does not process or protect that payment. Both sides must verify eligibility and transfer rules before exchanging.", "这仍然是普通交易帖子，你可以照常联系卖家购买；该标记同时表示卖家愿意与其他符合资格的票进行交换。直接换票或是否补差价由双方在私信中自行商定，Formal Exchange 不代收或保障这笔付款。交换前双方都必须核实入场资格与转让规则。")}</Text></View></Section> : null}

    {formal ? <>
      <Section title={text("Entry requirements", "入场要求")}>
        <InfoRow icon="shirt-outline" label={text("Dress code", "着装要求")} value={localValue(demo?.dress ?? listing?.dress_code ?? "Ask seller", language)} />
        <InfoRow icon="card-outline" label={text("ID to bring", "需携带证件")} value={localValue(demo?.idRule ?? listing?.id_requirement ?? "Ask seller", language)} />
        <InfoRow icon="enter-outline" label={text("Who may attend", "参与资格")} value={localValue(demo?.entry ?? listing?.entry_requirements ?? listing?.college_rules ?? "Ask seller before agreeing", language)} />
        <InfoRow icon="person-add-outline" label={text("Host escort", "本院成员陪同")} value={(demo?.escort ?? listing?.needs_host_escort) ? text("Required", "需要") : text("Not stated as required", "未说明必须陪同")} />
        {listing?.guest_name_required ? <InfoRow icon="create-outline" label={text("Guest name", "宾客姓名")} value={listing.guest_name_deadline ? text(`Required by ${new Date(listing.guest_name_deadline).toLocaleDateString()}`, `须在 ${new Date(listing.guest_name_deadline).toLocaleDateString()} 前提交`) : text("Required in advance", "需提前提交")} /> : null}
      </Section>
      <Section title={text("Eligibility and college rules", "资格与学院规则")}>
        <Rule ok={Boolean(demo || listing?.allow_outside_college)} text={demo ? text("Sample audience only", "仅为示例受众") : listing?.allow_outside_college ? text("Seller allows buyers from outside the host college", "卖家允许举办学院以外的买家购买") : text("Restricted to the host college", "仅限举办学院成员")} />
        {!demo ? <Rule ok={Boolean(listing?.allow_outside_oxbridge)} text={listing?.allow_outside_oxbridge ? text("Seller allows eligible buyers from outside Oxford and Cambridge", "卖家允许符合资格的牛津和剑桥以外用户购买") : text("Not available outside Oxford and Cambridge", "不向牛津和剑桥以外用户开放")} /> : null}
        <Rule ok={Boolean(demo || listing?.transfer_confirmed)} text={demo ? text("Sample transfer confirmation", "示例转让确认") : listing?.transfer_confirmed ? text("Seller confirms they checked the transfer rules", "卖家确认已核对转让规则") : text("Transfer confirmation not supplied", "卖家未提供转让确认")} />
        <Text style={s.ruleHelp}>{text("The seller controls visibility according to college rules, so different accounts may see different Formal listings. Report a listing if the ticket is not transferable or the buyer is ineligible.", "卖家会依据学院规则控制可见范围，因此不同账号看到的 Formal 帖子可能不同。如票务不可转让或买家不符合资格，请举报该帖子。")}</Text>
      </Section>
      <Section title={text("Dietary information", "饮食信息")}>
        <View style={s.dietary}>{(demo?.dietary ?? dietaryLabels(listing)).length ? (demo?.dietary ?? dietaryLabels(listing)).map((label) => <Badge key={label} text={localValue(label,language)} />) : <Text style={s.muted}>{text("No dietary option has been confirmed.", "尚未确认任何饮食选项。")}</Text>}</View>
        {localContent(listing?.dietary_note,listing?.dietary_note_en,listing?.dietary_note_zh,listing?.content_language,language,showOriginal) ? <Text style={s.note}>{localContent(listing?.dietary_note,listing?.dietary_note_en,listing?.dietary_note_zh,listing?.content_language,language,showOriginal)}</Text> : null}
      </Section>
      {demo?.details || (!transport && listing?.notes) ? <Section title={text("Seller note", "卖家备注")}><Text style={s.note}>{demo ? demoDetail(demo.id,language) : localContent(listing?.notes,listing?.notes_en,listing?.notes_zh,listing?.content_language,language,showOriginal)}</Text></Section> : null}
    </> : null}

    <Section title={text("Payment and safety", "付款与安全")}>
      <View style={s.safety}><Ionicons name="shield-checkmark-outline" size={24} color={C.blue} /><Text style={s.safetyText}>{text("Formal Exchange does not process online payments yet. Confirm identity and ticket rules independently, never share passwords or verification codes, and do not send money until you understand how the ticket will be transferred.", "Formal Exchange 尚未提供在线付款。请独立核验身份与票务规则，绝不要分享密码或验证码；在明确票务如何转让前不要付款。")}</Text></View>
    </Section>

    {showContacts && !demo && listing?.private_contacts?.length ? <Section title={text("Seller’s chosen contact details", "卖家选择的联系方式")}>{listing.private_contacts.map((contact, index) => <InfoRow key={`${contact.type}-${index}`} icon="at-outline" label={localValue(contact.type,language)} value={contact.value} />)}</Section> : null}

    <View style={[s.actions, compact && s.actionsCompact]}>
      <Pressable style={({ pressed }) => [s.primary, (pressed || contacting || expiredDemo) && s.pressed]} onPress={contact} disabled={contacting || expiredDemo}><Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" /><Text style={s.primaryText}>{contacting ? text("Opening messages…", "正在打开私信…") : text("Contact to buy", "联系购买")}</Text></Pressable>
      {!demo && listing?.private_contacts?.length ? <Pressable style={({ pressed }) => [s.secondary, pressed && s.pressed]} onPress={() => setShowContacts((value) => !value)}><Text style={s.secondaryText}>{showContacts ? text("Hide external contact", "隐藏外部联系方式") : text("Show external contact", "显示外部联系方式")}</Text></Pressable> : null}
    </View>
    {contactStatus ? <Text style={[s.contactStatus, contactStatus.startsWith("Could not") && s.contactError]}>{contactStatus}</Text> : null}
    <Pressable style={({pressed}) => [s.report, pressed && s.pressed]} onPress={report}><Ionicons name="flag-outline" size={16} color={C.danger} /><Text style={s.reportText}>{text("Report eligibility, safety or listing issue", "举报资格、安全或帖子问题")}</Text></Pressable>
  </ScrollView>;
}

function Section({ title, children }: { title: string; children: any }) { return <View style={s.section}><Text style={s.sectionTitle}>{title}</Text>{children}</View>; }
function Badge({ text }: { text: string }) { return <View style={s.badge}><Text style={s.badgeText}>{text}</Text></View>; }
function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) { return <View style={s.infoRow}><View style={s.infoIcon}><Ionicons name={icon} size={19} color={C.blue} /></View><View style={s.infoCopy}><Text style={s.infoLabel}>{label}</Text><Text style={s.infoValue}>{value}</Text></View></View>; }
function RouteRow({ from, to }: { from: string; to: string }) { return <View style={s.route}><View style={s.routeNode}><View style={s.dot} /><Text style={s.routeText}>{from}</Text></View><View style={s.routeLine} /><View style={s.routeNode}><View style={[s.dot, s.dotEnd]} /><Text style={s.routeText}>{to}</Text></View></View>; }
function Rule({ ok, text }: { ok: boolean; text: string }) { return <View style={s.rule}><Ionicons name={ok ? "checkmark-circle" : "close-circle"} size={21} color={ok ? "#047857" : C.danger} /><Text style={s.ruleText}>{text}</Text></View>; }
function formatDuration(minutes: number | null | undefined, language: "en"|"zh") { if (!minutes) return language==="zh"?"未说明":"Not stated"; const h = Math.floor(minutes / 60); const m = minutes % 60; return language==="zh"?`${h?`${h} 小时`:""}${m?` ${m} 分钟`:""}`.trim():`${h} hr${h === 1 ? "" : "s"}${m ? ` ${m} min` : ""}`; }
function dietaryLabels(listing: TicketListing | null) { if (!listing) return []; return [[listing.vegan_available, "Vegan available"], [listing.vegetarian_available, "Vegetarian available"], [listing.halal_available, "Halal available"], [listing.gluten_free_available, "Gluten-free available"]].filter(([on]) => on).map(([, label]) => label as string); }

function localContent(original:string|null|undefined,en:string|null|undefined,zh:string|null|undefined,source:"en"|"zh"|undefined,viewer:"en"|"zh",showOriginal:boolean){if(showOriginal)return original??(source==="zh"?zh:en)??"";return viewer==="zh"?(zh??original??en??""):(en??original??zh??"");}
function localValue(value:string,language:"en"|"zh"){if(language==="en")return value;const values:Record<string,string>={"Ticket":"票务","University":"大学","Oxford":"牛津","Cambridge":"剑桥","Hall Formal":"学院 Formal","MCR Guest Dinner":"MCR 宾客晚宴","Guest Night":"宾客之夜","Special Formal":"特别 Formal","Other Formal":"其他 Formal","Coach":"大巴","Train":"火车","Airport ride-share":"机场拼车","Other event":"其他活动","Formal / gowns":"正装 / 学袍","Smart":"正装 / 学袍","Smart casual":"商务休闲","Smart Casual":"商务休闲","No dress rule":"无明确着装要求","Casual":"无明确着装要求","University card":"大学校园卡","Government photo ID":"带照片身份证件","Both university card and photo ID":"大学校园卡和带照片身份证件","No ID stated":"未说明证件要求","Oxford or Cambridge member only":"仅限牛津或剑桥成员","Host college member only":"仅限举办学院成员","Guest allowed with host":"允许由本院成员陪同的宾客","Ask seller before purchase":"购买前询问卖家","Ask seller before agreeing":"达成交易前询问卖家","Ask seller":"询问卖家","University or government photo ID":"大学校园卡或政府签发的带照片身份证件","Vegan available":"可提供纯素","Vegetarian available":"可提供素食","Halal available":"可提供清真餐","Gluten-free available":"可提供无麸质餐","Email":"电子邮件","WeChat":"微信","In-app message":"应用内私信","Named passenger — check before purchase":"实名乘客票，购买前确认","Specific service only":"仅限指定班次","Railcard required":"需要 Railcard","No restriction stated":"未说明限制"};return values[value]??value;}
function demoDetail(id:string,language:"en"|"zh"){if(language==="en")return DEMOS.find(item=>item.id===id)?.details??"";const values:Record<string,string>={reuben:"示例帖子展示卖家在买家联系前应提供的信息。",merton:"MCR 宾客晚宴示例。卖家会在达成交易前确认买家资格及宾客姓名提交截止日期。",kings:"剑桥 Formal 示例，需要本院成员陪同。","st-annes":"示例帖子。实际交易前必须由卖家确认学院的具体规则。",magdalen:"MCR 晚宴示例，需要提前核验身份。",pembroke:"多个名额的示例帖子；实际卖家可允许分开出售。",wadham:"示例帖子；点击联系会与 Formal Exchange 团队开始对话。",jesus:"剑桥 MCR 晚宴示例，提供两个名额。","st-johns":"九月末的示例帖子，会在活动时间后自动从信息流中消失。"};return values[id]??"示例帖子。";}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg }, content: { boxSizing: "border-box", width: "100%", maxWidth: 900, alignSelf: "center", padding: 22, paddingTop: 22, paddingBottom: 80 }, contentCompact: { padding: 12, paddingTop: 12 },
  center: { flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", padding: 30 }, loading: { color: C.navy, fontWeight: "900" }, missingTitle: { color: C.navy, fontSize: 24, fontWeight: "900", marginTop: 12 }, missing: { color: C.muted, textAlign: "center", lineHeight: 21, maxWidth: 430, marginTop: 7 },
  topActions: { flexDirection: "row", gap: 8 },
  topbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }, iconButton: { width: 43, height: 43, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: C.border }, topTitle: { color: C.navy, fontSize: 17, fontWeight: "900" },
  demoBanner: { flexDirection: "row", gap: 8, backgroundColor: "#FFFBEB", borderRadius: 14, padding: 11, marginBottom: 10 }, demoText: { color: "#92400E", fontSize: 12, lineHeight: 18, fontWeight: "800", flex: 1 }, expired: { backgroundColor: "#FEF2F2", borderRadius: 13, padding: 11, marginBottom: 10 }, expiredText: { color: C.danger, fontWeight: "900" },
  gallery: { width: "100%", borderRadius: 22 }, hero: { width: 856, height: 430, borderRadius: 22, backgroundColor: "#E8EEF4" }, heroCompact: { width: "100%", height: 300, borderRadius: 18 }, placeholder: { alignItems: "center", justifyContent: "center" },
  summaryCard: { backgroundColor: "#fff", borderWidth: 1, borderColor: C.border, borderRadius: 22, padding: 18, marginTop: 12 }, badges: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, badge: { backgroundColor: "#EEF4FA", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }, badgeText: { color: C.blue, fontSize: 12, fontWeight: "900" }, swapBadge:{flexDirection:"row",alignItems:"center",gap:5,backgroundColor:"#FEF3C7",borderRadius:999,paddingHorizontal:10,paddingVertical:6},swapBadgeText:{color:"#78350F",fontSize:12,fontWeight:"900"}, title: { color: C.navy, fontSize: 30, lineHeight: 37, fontWeight: "900", marginTop: 10 }, titleCompact: { fontSize: 25, lineHeight: 31 }, date: { color: C.muted, fontWeight: "700", marginTop: 5 }, priceRow: { marginTop: 14, flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }, price: { color: "#9A3412", fontSize: 27, fontWeight: "900" }, quantity: { color: C.blue, fontWeight: "900" },
  sellerRow:{flexDirection:"row",alignItems:"center",gap:6,marginTop:10},sellerName:{color:C.navy,fontWeight:"800",fontSize:14},verifiedBadge:{flexDirection:"row",alignItems:"center",gap:3,backgroundColor:"#ECFDF5",borderRadius:999,paddingHorizontal:8,paddingVertical:3},verifiedText:{color:"#047857",fontSize:11,fontWeight:"900"},
  originalButton:{marginTop:12,alignSelf:"flex-start",flexDirection:"row",alignItems:"center",gap:6,borderWidth:1,borderColor:C.border,borderRadius:12,paddingHorizontal:11,paddingVertical:8,backgroundColor:"#F8FAFC"},originalText:{color:C.blue,fontSize:12,fontWeight:"900"},
  section: { marginTop: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: C.border, borderRadius: 22, padding: 17 }, sectionTitle: { color: C.navy, fontSize: 19, fontWeight: "900", marginBottom: 7 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 11, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border }, infoIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#EEF4FA" }, infoCopy: { flex: 1, minWidth: 0 }, infoLabel: { color: C.muted, fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: .6 }, infoValue: { color: C.navy, lineHeight: 20, fontWeight: "800", marginTop: 2 },
  route: { paddingVertical: 7 }, routeNode: { flexDirection: "row", alignItems: "center", gap: 10 }, dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#047857" }, dotEnd: { backgroundColor: "#9A3412" }, routeLine: { height: 28, width: 2, backgroundColor: "#CBD5E1", marginLeft: 5 }, routeText: { color: C.navy, fontSize: 17, fontWeight: "900", flex: 1 },
  rule: { flexDirection: "row", alignItems: "flex-start", gap: 9, paddingVertical: 8 }, ruleText: { color: C.navy, fontWeight: "800", lineHeight: 20, flex: 1 }, ruleHelp: { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 6 }, dietary: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, muted: { color: C.muted }, note: { color: C.navy, lineHeight: 21, marginTop: 4 },
  safety: { flexDirection: "row", alignItems: "flex-start", gap: 11, backgroundColor: "#EFF6FF", padding: 13, borderRadius: 15 }, safetyText: { color: C.blue, lineHeight: 20, fontWeight: "700", flex: 1 },
  actions: { flexDirection: "row", gap: 10, marginTop: 15 }, actionsCompact: { flexDirection: "column" }, primary: { minHeight: 54, flex: 1.3, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.navy, borderRadius: 16, paddingHorizontal: 18 }, primaryText: { color: "#fff", fontWeight: "900", fontSize: 15 }, secondary: { minHeight: 54, flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: C.navy, borderRadius: 16, paddingHorizontal: 15 }, secondaryText: { color: C.navy, fontWeight: "900", textAlign: "center" }, pressed: { opacity: .62 }, contactStatus: { color: C.blue, fontSize: 12, lineHeight: 18, fontWeight: "800", textAlign: "center", marginTop: 9 }, contactError: { color: C.danger }, report: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 8 }, reportText: { color: C.danger, fontSize: 12, fontWeight: "800" },
});
