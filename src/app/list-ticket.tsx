import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import {
  College,
  ContactMethod,
  ListingCategory,
  createTicketListing,
  getCurrentUser,
  loadColleges,
  loadMyProfile,
  translateContent,
  uploadListingImage,
} from "../lib/formalApi";
import { useAppLanguage } from "../lib/language";
import { openHomeItemsMarket } from "../lib/externalLinks";

const DRAFT_KEY = "formal-exchange-listing-draft-v2";
const C = {
  bg: "#F5F1E8",
  card: "#FFFFFF",
  navy: "#071B3A",
  blue: "#123C69",
  gold: "#C8A951",
  muted: "#64748B",
  border: "#DFE5EC",
  surface: "#F8FAFC",
  danger: "#991B1B",
  dangerBg: "#FEF2F2",
  ok: "#065F46",
  okBg: "#ECFDF5",
};

type EventKind = "admission" | "airport_ride_share";
type ContactType = ContactMethod["type"];
type UnderPolicy = "face_value" | "tiered";
type Draft = {
  contentLanguage: "en" | "zh";
  category: ListingCategory;
  campus: "Oxford" | "Cambridge";
  collegeId: string;
  formalType: "Hall Formal" | "MCR Guest Dinner" | "Guest Night" | "Special Formal";
  dressCode: "Smart" | "Smart Casual" | "Casual";
  date: string;
  time: string;
  studentSeats: string;
  guestSeats: string;
  studentFace: string;
  guestFace: string;
  studentPrice: string;
  guestPrice: string;
  canSplit: boolean;
  underPolicy: UnderPolicy;
  underPrices: Record<string, string>;
  allowOutsideCollege: boolean;
  allowOutsideOxbridge: boolean;
  entryRequirements: string;
  idRequirement: string;
  needsHostEscort: boolean;
  guestNameRequired: boolean;
  guestNameDeadline: string;
  transferConfirmed: boolean;
  vegan: boolean;
  vegetarian: boolean;
  halal: boolean;
  glutenFree: boolean;
  dietaryNote: string;
  dietaryNoteEn: string;
  ticketType: "Coach" | "Train";
  origin: string;
  destination: string;
  arrivalDate: string;
  arrivalTime: string;
  operatorName: string;
  quantity: string;
  faceValue: string;
  askingPrice: string;
  eventKind: EventKind;
  eventName: string;
  eventNameEn: string;
  eventDescription: string;
  eventDescriptionEn: string;
  notes: string;
  preferredContact: "In-app message" | "Email" | "WhatsApp" | "WeChat";
  contacts: ContactMethod[];
  imageUris: string[];
  openToSwap: boolean;
};

const initialDraft: Draft = {
  contentLanguage: "en",
  category: "formal",
  campus: "Oxford",
  collegeId: "",
  formalType: "Hall Formal",
  dressCode: "Smart",
  date: "",
  time: "",
  studentSeats: "1",
  guestSeats: "0",
  studentFace: "",
  guestFace: "",
  studentPrice: "",
  guestPrice: "",
  canSplit: false,
  underPolicy: "face_value",
  underPrices: {},
  allowOutsideCollege: false,
  allowOutsideOxbridge: false,
  entryRequirements: "University or government photo ID",
  idRequirement: "University card",
  needsHostEscort: true,
  guestNameRequired: false,
  guestNameDeadline: "",
  transferConfirmed: false,
  vegan: false,
  vegetarian: false,
  halal: false,
  glutenFree: false,
  dietaryNote: "",
  dietaryNoteEn: "",
  ticketType: "Coach",
  origin: "",
  destination: "",
  arrivalDate: "",
  arrivalTime: "",
  operatorName: "",
  quantity: "1",
  faceValue: "",
  askingPrice: "",
  eventKind: "admission",
  eventName: "",
  eventNameEn: "",
  eventDescription: "",
  eventDescriptionEn: "",
  notes: "",
  preferredContact: "In-app message",
  contacts: [],
  imageUris: [],
  openToSwap: false,
};

const WebInput = "input" as any;

export default function ListTicket() {
  const { language, text } = useAppLanguage();
  const { width } = useWindowDimensions();
  const compact = width < 700;
  const [form, setForm] = useState<Draft>(initialDraft);
  const [colleges, setColleges] = useState<College[]>([]);
  const [profileEmail, setProfileEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [draftFound, setDraftFound] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    Promise.all([loadColleges(), loadMyProfile(), AsyncStorage.getItem(DRAFT_KEY)])
      .then(([allColleges, profile, saved]) => {
        setColleges(allColleges);
        setProfileEmail(profile?.email?.toLowerCase() ?? "");
        const preferredCampus = profile?.university ?? "Oxford";
        const preferredCollege = profile?.college_id ?? allColleges.find((c) => c.university === preferredCampus)?.id ?? "";
        setForm((old) => ({ ...old, campus: preferredCampus, collegeId: preferredCollege, contentLanguage: language }));
        setDraftFound(Boolean(saved));
      })
      .catch((error) => setStatus(error?.message ?? text("Could not load this form.", "无法加载此表单。")));
  }, [language]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setForm((old) => ({ ...old, [key]: value }));
  const isOxbridge = /(^|\.)ox\.ac\.uk$|(^|\.)cam\.ac\.uk$/i.test(profileEmail.split("@")[1] ?? "");
  const campusColleges = useMemo(() => colleges.filter((c) => c.university === form.campus), [colleges, form.campus]);
  const selectedCollege = colleges.find((c) => c.id === form.collegeId);
  const guestCount = Math.max(0, Math.floor(Number(form.guestSeats) || 0));
  const underTiers = useMemo(() => Array.from({ length: Math.max(0, guestCount - 1) }, (_, i) => guestCount - 1 - i), [guestCount]);
  const duration = calculateDuration(form.date, form.time, form.arrivalDate || form.date, form.arrivalTime);

  function changeCategory(category: ListingCategory) {
    if (category === form.category) return;
    const keep = {
      campus: form.campus,
      collegeId: colleges.find((c) => c.university === form.campus)?.id ?? "",
      preferredContact: form.preferredContact,
      contacts: form.contacts,
      contentLanguage: form.contentLanguage,
    };
    setForm({ ...initialDraft, category, ...keep });
    setStatus(text("Ticket type changed. Fields that no longer apply were cleared.", "票务类型已更改，不再适用的字段已清空。"));
  }

  function changeCampus(campus: "Oxford" | "Cambridge") {
    setForm((old) => ({
      ...old,
      campus,
      collegeId: colleges.find((c) => c.university === campus)?.id ?? "",
    }));
  }

  async function chooseImages() {
    if (form.imageUris.length >= 4) return Alert.alert(text("Photo limit", "图片数量上限"), text("You can add up to four optional photos.", "最多可添加 4 张可选图片。"));
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 4 - form.imageUris.length,
      quality: 0.75,
    });
    if (!result.canceled) {
      const additions = result.assets.map((asset) => asset.uri).filter(Boolean);
      set("imageUris", [...form.imageUris, ...additions].slice(0, 4));
    }
  }

  async function saveDraft() {
    try {
      setStatus(text("Saving draft…", "正在保存草稿…"));
      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      setDraftFound(true);
      setStatus(text("Draft saved on this device.", "草稿已保存在此设备上。"));
      Alert.alert(text("Draft saved", "草稿已保存"), text("This draft is stored on this device. Photos must be selected again after restoring it.", "草稿已保存在此设备上；恢复草稿后需要重新选择图片。"));
    } catch (error: any) {
      setStatus(`${text("Could not save draft", "无法保存草稿")}: ${error?.message ?? text("Please try again.", "请重试。")}`);
    }
  }

  async function restoreDraft() {
    try {
      const saved = await AsyncStorage.getItem(DRAFT_KEY);
      if (!saved) return setDraftFound(false);
      setForm({ ...initialDraft, ...JSON.parse(saved), imageUris: [] });
      setStatus(text("Draft restored. Photos must be selected again for privacy.", "草稿已恢复。出于隐私考虑，请重新选择图片。"));
    } catch {
      setStatus(text("Could not restore draft: the saved draft is not readable.", "无法恢复草稿：保存的数据不可读取。"));
    }
  }

  function validate() {
    if (!form.date || !form.time) return text("Choose the date and time.", "请选择日期和时间。");
    if (!Number(form.quantity) || Number(form.quantity) < 1) return text("Choose at least one place.", "请至少选择 1 个名额。");
    if (form.category === "formal") {
      if (!isOxbridge) return text("Only verified Oxford or Cambridge accounts can publish Formal tickets.", "只有已验证的牛津或剑桥账号可以发布 Formal 票。");
      if (!form.collegeId) return text("Choose the college hosting the Formal.", "请选择举办 Formal 的学院。");
      if (!Number(form.studentSeats) && !Number(form.guestSeats)) return text("Add at least one member or guest place.", "请至少填写 1 个本院成员或宾客名额。");
      if (!form.studentFace || !form.studentPrice) return text("Enter the member face value and asking price.", "请填写本院成员票原价和售价。");
      if (guestCount > 0 && (!form.guestFace || !form.guestPrice)) return text("Enter the guest face value and asking price.", "请填写宾客票原价和售价。");
      if (invalidPrice(form.studentPrice, form.studentFace) || invalidPrice(form.guestPrice, form.guestFace)) return text("An asking price cannot exceed 120% of face value.", "售价不得超过原价的 120%。");
      if (form.guestNameRequired && !form.guestNameDeadline) return text("Add the deadline for submitting the guest name.", "请填写提交宾客姓名的截止日期。");
      if (!form.transferConfirmed) return text("Confirm that you checked the college transfer rules.", "请确认你已核对学院的转让规则。");
      if (!form.canSplit && form.underPolicy === "tiered") {
        for (const actual of underTiers) {
          const maximum = maxUnder(form.guestFace, guestCount, actual);
          const entered = Number(form.underPrices[String(actual)]);
          if (!entered || !maximum || entered > maximum + 0.001) return text(`Check the price for a group using ${actual} guest place${actual === 1 ? "" : "s"}.`, `请检查实际使用 ${actual} 个宾客名额时的价格。`);
        }
      }
    }
    if (form.category === "coach_train") {
      if (!form.origin.trim() || !form.destination.trim()) return text("Add the departure and arrival locations.", "请填写出发地和目的地。");
      if (!form.arrivalTime || !form.arrivalDate) return text("Choose the arrival date and time.", "请选择到达日期和时间。");
      if (!duration) return text("Arrival must be after departure.", "到达时间必须晚于出发时间。");
      if (!form.askingPrice) return text("Enter the asking price.", "请填写售价。");
      if (invalidPrice(form.askingPrice, form.faceValue)) return text("The asking price cannot exceed 120% of the original price.", "售价不得超过原价的 120%。");
    }
    if (form.category === "event") {
      if (form.eventKind === "admission" && !form.eventName.trim()) return text("Add the event name.", "请填写活动名称。");
      if (form.eventKind === "airport_ride_share" && (!form.origin.trim() || !form.destination.trim())) return text("Add the pickup and destination.", "请填写上车地点和目的地。");
    }
    return "";
  }

  async function publish() {
    if (busy) return;
    try {
      setBusy(true);
      setStatus(text("Checking your listing…", "正在检查帖子…"));
      const user = await getCurrentUser();
      if (!user) {
        setStatus(text("Please log in before publishing.", "请登录后再发布。"));
        router.push("/login");
        return;
      }
      const problem = validate();
      if (problem) {
        setStatus(`${text("Please fix this before publishing", "发布前请修正")}: ${problem}`);
        Alert.alert(text("Cannot publish yet", "暂时无法发布"), problem);
        return;
      }
      const imageUrls: string[] = [];
      for (let i = 0; i < form.imageUris.length; i += 1) {
        setStatus(text(`Uploading optional photo ${i + 1} of ${form.imageUris.length}…`, `正在上传可选图片 ${i + 1}/${form.imageUris.length}…`));
        imageUrls.push(await uploadListingImage(form.imageUris[i]));
      }
      setStatus(text("Preparing automatic translation…", "正在准备自动翻译…"));
      const fallbackCollege = selectedCollege ?? campusColleges[0] ?? colleges[0];
      if (!fallbackCollege) throw new Error(text("College directory is unavailable. Please try again.", "学院目录暂不可用，请重试。"));
      const formal = form.category === "formal";
      const transport = form.category === "coach_train";
      const rideShare = form.category === "event" && form.eventKind === "airport_ride_share";
      const memberSeats = formal ? Math.max(0, Math.floor(Number(form.studentSeats) || 0)) : Math.max(1, Math.floor(Number(form.quantity) || 1));
      const guests = formal ? guestCount : 0;
      const asking = formal ? Number(form.studentPrice) : Number(form.askingPrice || 0);
      const face = formal ? Number(form.studentFace) : Number(form.faceValue || form.askingPrice || 0);
      const eventNameOriginal = form.category === "event" ? (rideShare ? `${form.origin} → ${form.destination}` : form.eventName.trim()) : "";
      const eventDescriptionOriginal = form.category === "event" ? form.eventDescription.trim() : "";
      const dietaryOriginal = formal ? form.dietaryNote.trim() : "";
      const noteOriginal = form.notes.trim();
      const targetLanguage = language === "en" ? "zh" : "en";
      const [eventNameTranslated,eventDescriptionTranslated,dietaryTranslated,noteTranslated] = await Promise.all([
        eventNameOriginal ? translateContent(eventNameOriginal, language, targetLanguage) : "",
        eventDescriptionOriginal ? translateContent(eventDescriptionOriginal, language, targetLanguage) : "",
        dietaryOriginal ? translateContent(dietaryOriginal, language, targetLanguage) : "",
        noteOriginal && !transport ? translateContent(noteOriginal, language, targetLanguage) : "",
      ]);
      setStatus(text("Publishing listing…", "正在发布帖子…"));
      await createTicketListing({
        listing_category: form.category,
        content_language: language,
        ticket_type: formal ? form.formalType : transport ? form.ticketType : rideShare ? "Airport ride-share" : "Other event",
        campus: form.campus,
        college_id: fallbackCollege.id,
        formal_type: formal ? form.formalType : "Special Formal",
        dress_code: formal ? form.dressCode : "Casual",
        formal_date: form.date,
        formal_time: form.time,
        includes_guest: guests > 0,
        student_seats: memberSeats,
        guest_seats: guests,
        remaining_student_seats: memberSeats,
        remaining_guest_seats: guests,
        ticket_quantity: formal ? memberSeats + guests : Math.max(1, Math.floor(Number(form.quantity) || 1)),
        allow_separate_sale: formal ? form.canSplit : Number(form.quantity) > 1,
        can_split: formal ? form.canSplit : Number(form.quantity) > 1,
        student_listing_price_gbp: Number.isFinite(asking) ? asking : 0,
        guest_listing_price_gbp: formal && guests ? Number(form.guestPrice) : null,
        reference_student_price_gbp: Number.isFinite(face) ? face : 0,
        reference_guest_price_gbp: formal && guests ? Number(form.guestFace) : null,
        face_value_gbp: Number(form.faceValue || (formal ? form.studentFace : 0)) || null,
        asking_price_gbp: Number(form.askingPrice || (formal ? form.studentPrice : 0)) || 0,
        college_price_source: null,
        student_price_warning: false,
        guest_price_warning: false,
        underoccupancy_policy: formal && !form.canSplit ? form.underPolicy : "face_value",
        guest_underoccupancy_prices: formal && !form.canSplit && form.underPolicy === "tiered" ? form.underPrices : {},
        needs_host_escort: formal ? form.needsHostEscort : false,
        allow_outside_college: formal ? form.allowOutsideCollege : true,
        allow_outside_oxbridge: formal ? form.allowOutsideOxbridge : true,
        entry_requirements: formal ? form.entryRequirements : null,
        id_requirement: formal ? form.idRequirement : null,
        guest_name_required: formal ? form.guestNameRequired : false,
        guest_name_deadline: formal && form.guestNameRequired ? toIso(form.guestNameDeadline, "23:59") : null,
        transfer_confirmed: formal ? form.transferConfirmed : true,
        college_rules: formal ? form.entryRequirements : null,
        transfer_type: formal ? "Seller-confirmed transfer" : null,
        origin_name: transport || rideShare ? form.origin.trim() : null,
        destination_name: transport || rideShare ? form.destination.trim() : null,
        arrival_date: transport ? form.arrivalDate : null,
        arrival_time: transport ? form.arrivalTime : null,
        duration_minutes: transport ? duration : null,
        operator_name: transport ? form.operatorName.trim() || null : null,
        service_number: null,
        venue_name: null,
        event_kind: form.category === "event" ? form.eventKind : null,
        event_name: eventNameOriginal || null,
        event_name_en: language === "en" ? eventNameOriginal || null : eventNameTranslated || null,
        event_name_zh: language === "zh" ? eventNameOriginal || null : eventNameTranslated || null,
        event_description: eventDescriptionOriginal || null,
        event_description_en: language === "en" ? eventDescriptionOriginal || null : eventDescriptionTranslated || null,
        event_description_zh: language === "zh" ? eventDescriptionOriginal || null : eventDescriptionTranslated || null,
        notes: noteOriginal || null,
        notes_en: language === "en" ? noteOriginal || null : noteTranslated || null,
        notes_zh: language === "zh" ? noteOriginal || null : noteTranslated || null,
        hall_photo_url: imageUrls[0] ?? null,
        image_urls: imageUrls,
        preferred_contact_method: form.preferredContact,
        open_to_swap: form.openToSwap,
        private_contacts: form.contacts.filter((item) => item.value.trim()),
        vegan_available: formal ? form.vegan : false,
        vegetarian_available: formal ? form.vegetarian : false,
        halal_available: formal ? form.halal : false,
        gluten_free_available: formal ? form.glutenFree : false,
        dietary_note: dietaryOriginal || null,
        dietary_note_en: formal ? (language === "en" ? dietaryOriginal || null : dietaryTranslated || null) : null,
        dietary_note_zh: formal ? (language === "zh" ? dietaryOriginal || null : dietaryTranslated || null) : null,
        transaction_mode: "private",
        payment_method: "Private contact",
        transfer_account: null,
        transfer_reference: null,
        private_contact_type: null,
        private_contact_value: null,
        status: "active",
      });
      await AsyncStorage.removeItem(DRAFT_KEY);
      setDraftFound(false);
      setStatus(text("Published successfully.", "发布成功。"));
      setPublished(true);
    } catch (error: any) {
      const message = friendlyError(error);
      setStatus(`${text("Could not publish", "发布失败")}: ${message}`);
      Alert.alert(text("Could not publish", "发布失败"), message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
    <ScrollView style={s.page} contentContainerStyle={[s.content, compact && s.contentCompact]} keyboardShouldPersistTaps="handled">
      <View style={s.headerRow}>
        <Pressable accessibilityLabel={text("Close listing form", "关闭发布表单")} style={s.iconButton} onPress={() => router.canGoBack() ? router.back() : router.replace("/seller")}> 
          <Ionicons name="close" size={24} color={C.navy} />
        </Pressable>
        <View style={s.headerCopy}>
          <Text style={s.eyebrow}>{text("SELLER POST", "卖家发布")}</Text>
          <Text style={[s.title, compact && s.titleCompact]}>{text("List a ticket", "发布票务")}</Text>
          <Text style={s.subtitle}>{text("Choose the ticket type first. Only relevant questions will appear.", "请先选择票务类型，页面只会显示相关问题。")}</Text>
        </View>
      </View>

      {status ? <View accessibilityLiveRegion="polite" style={status.includes("success") || status.includes("saved") || status.includes("restored") ? s.ok : status.startsWith("Please") || status.startsWith("Could not") ? s.error : s.progress}><Text style={s.statusText}>{status}</Text></View> : null}
      {draftFound ? <Pressable style={s.restore} onPress={restoreDraft}><Ionicons name="document-text-outline" size={18} color={C.blue} /><Text style={s.restoreText}>{text("Restore saved draft", "恢复已保存草稿")}</Text></Pressable> : null}

      <Notice text={text("Write once in your selected app language. Optional text is translated automatically for Chinese readers, with the original still available.", "请直接使用当前界面的中文填写一次。选填文字会自动翻译给英文用户，并保留原文供查看。")}/>

      <Card title={text("1 · What are you listing?", "1 · 你要发布什么？")} hint={text("Changing the type clears fields that no longer apply.", "更改类型会清空不再适用的字段。") }>
        <Pills
          value={form.category}
          options={[
            ["formal", "Formal"],
            ["coach_train", text("Coach / train", "大巴 / 火车")],
            ["event", text("Other ticket / ride-share", "其他门票 / 拼车")],
          ]}
          onChange={(value) => changeCategory(value as ListingCategory)}
        />
        <Pressable style={s.externalMarket} onPress={() => openHomeItemsMarket(language)}><Ionicons name="home-outline" size={18} color={C.blue} /><Text style={s.externalMarketText}>{language === "zh" ? "二手家居用品（liuxuejishi.com）" : "Second-hand home items (liuxuejishi.com)"}</Text><Ionicons name="open-outline" size={17} color={C.blue} /></Pressable>
        <Label text={text("Listing city", "发布城市")} />
        <Pills value={form.campus} options={[["Oxford", text("Oxford", "牛津")], ["Cambridge", text("Cambridge", "剑桥")]]} onChange={(value) => changeCampus(value as Draft["campus"])} />
      </Card>

      {form.category === "formal" ? (
        <>
          <Card title={text("2 · Formal and places", "2 · Formal 与名额")}>
            {!isOxbridge ? <Notice text={text("You may register with any email, but only a verified Oxford or Cambridge account may publish Formal tickets. Other ticket types remain available.", "任何邮箱都可注册，但只有已验证的牛津或剑桥账号可以发布 Formal 票；其他票务类型仍可使用。") } danger /> : null}
            <Label text={text("Formal type", "Formal 类型")} />
            <Pills value={form.formalType} options={[["Hall Formal", text("Hall Formal", "学院 Formal")], ["MCR Guest Dinner", text("MCR Guest Dinner", "MCR 宾客晚宴")], ["Guest Night", text("Guest Night", "宾客之夜")], ["Special Formal", text("Other Formal", "其他 Formal")]]} onChange={(value) => set("formalType", value as Draft["formalType"])} />
            <CollegePicker colleges={campusColleges} selectedId={form.collegeId} onSelect={(id) => set("collegeId", id)} />
            <DateTimeRow compact={compact} date={form.date} time={form.time} setDate={(value) => set("date", value)} setTime={(value) => set("time", value)} />
            <View style={[s.row, compact && s.stack]}>
              <NumberField label={text("Member places", "本院成员名额")} value={form.studentSeats} setValue={(value) => set("studentSeats", value)} />
              <NumberField label={text("Guest places", "宾客名额")} value={form.guestSeats} setValue={(value) => set("guestSeats", value)} />
            </View>
          </Card>

          <Card title={text("3 · Entry and transfer rules", "3 · 入场与转让规则")} hint={text("These answers appear in the details so buyers know what to bring and whether they are eligible.", "这些答案会显示在详情页，帮助买家确认需携带的证件及购买资格。") }>
            <Label text={text("Dress code", "着装要求")} />
            <Pills value={form.dressCode} options={[["Smart", text("Formal / gowns", "正装 / 学袍")], ["Smart Casual", text("Smart casual", "商务休闲")], ["Casual", text("No dress rule", "无明确着装要求")]]} onChange={(value) => set("dressCode", value as Draft["dressCode"])} />
            <Label text={text("ID required", "所需证件")} />
            <Pills value={form.idRequirement} options={[["University card", text("University card", "大学校园卡")], ["Government photo ID", text("Photo ID", "带照片身份证件")], ["Both university card and photo ID", text("Both", "两者都要")], ["No ID stated", text("Not stated", "未说明")]]} onChange={(value) => set("idRequirement", value)} />
            <Label text={text("Entry requirement", "入场资格")} />
            <Pills value={form.entryRequirements} options={[["University or government photo ID", text("Any university / photo ID", "任一大学卡 / 身份证件")], ["Oxford or Cambridge member only", text("Oxbridge member only", "仅限牛剑成员")], ["Host college member only", text("Host college member only", "仅限举办学院成员")], ["Guest allowed with host", text("Guest with host", "由本院成员陪同的宾客")], ["Ask seller before purchase", text("Ask seller", "购买前询问卖家")]]} onChange={(value) => set("entryRequirements", value)} />
            <Toggle label={text("Seller or host must escort the guest", "卖家或本院成员必须陪同宾客")} value={form.needsHostEscort} onChange={(value) => set("needsHostEscort", value)} />
            <Toggle label={text("Guest name must be submitted in advance", "需提前提交宾客姓名")} value={form.guestNameRequired} onChange={(value) => set("guestNameRequired", value)} />
            {form.guestNameRequired ? <DateField label={text("Guest-name deadline", "宾客姓名提交截止日期")} value={form.guestNameDeadline} setValue={(value) => set("guestNameDeadline", value)} /> : null}
            <Toggle label={text("May be sold outside the host college", "允许出售给举办学院以外的用户")} value={form.allowOutsideCollege} onChange={(value) => set("allowOutsideCollege", value)} />
            <Toggle label={text("May be sold outside Oxford and Cambridge", "允许出售给牛津和剑桥以外的用户")} value={form.allowOutsideOxbridge} onChange={(value) => set("allowOutsideOxbridge", value)} />
            <Notice danger text={text("College rules come first. Sellers control the permitted audience, so different accounts may see different listings. Selling a non-transferable ticket or selling to an ineligible buyer may lead to removal of Formal-listing privileges or account suspension.", "学院规则优先。卖家可选择允许的买家范围，因此不同账号看到的帖子可能不同。出售不可转让的票，或出售给不符合资格的买家，可能导致 Formal 发布权限被取消或账号被暂停。") } />
            <Toggle label={text("I checked the college rules and confirm this ticket may be transferred as listed", "我已核对学院规则，并确认此票可按上述方式转让")} value={form.transferConfirmed} onChange={(value) => set("transferConfirmed", value)} />
          </Card>

          <Card title={text("4 · Price and sale structure", "4 · 价格与出售方式")} hint={text("Enter the college face value and your asking price.", "请填写学院原价及你的售价。") }>
            <View style={[s.row, compact && s.stack]}>
              <MoneyField label={text("Member face value", "本院成员票原价")} value={form.studentFace} setValue={(value) => set("studentFace", value)} />
              <MoneyField label={`${text("Member asking price", "本院成员票售价")}${maxNormal(form.studentFace) ? ` · ${text("max", "最高")} £${maxNormal(form.studentFace)!.toFixed(2)}` : ""}`} value={form.studentPrice} setValue={(value) => set("studentPrice", value)} warning={invalidPrice(form.studentPrice, form.studentFace)} />
            </View>
            {guestCount > 0 ? <View style={[s.row, compact && s.stack]}>
              <MoneyField label={text("Guest face value", "宾客票原价")} value={form.guestFace} setValue={(value) => set("guestFace", value)} />
              <MoneyField label={`${text("Guest asking price", "宾客票售价")}${maxNormal(form.guestFace) ? ` · ${text("max", "最高")} £${maxNormal(form.guestFace)!.toFixed(2)}` : ""}`} value={form.guestPrice} setValue={(value) => set("guestPrice", value)} warning={invalidPrice(form.guestPrice, form.guestFace)} />
            </View> : null}
            <Toggle label={text("Different buyers may buy separate places", "允许不同买家分别购买部分名额")} value={form.canSplit} onChange={(value) => set("canSplit", value)} />
            {!form.canSplit && guestCount > 1 ? <>
              <Label text={text("If fewer guests use the booking", "若实际使用的宾客名额更少")} />
              <Pills value={form.underPolicy} options={[["face_value", text("Keep face value", "保持原价")], ["tiered", text("Set group prices", "设置不同人数价格")]]} onChange={(value) => set("underPolicy", value as UnderPolicy)} />
              {form.underPolicy === "tiered" ? underTiers.map((actual) => <MoneyField key={actual} label={text(`${actual} guest${actual === 1 ? "" : "s"} use the booking · max £${maxUnder(form.guestFace, guestCount, actual)?.toFixed(2) ?? "—"} each`, `实际使用 ${actual} 个宾客名额 · 每人最高 £${maxUnder(form.guestFace, guestCount, actual)?.toFixed(2) ?? "—"}`)} value={form.underPrices[String(actual)] ?? ""} setValue={(value) => set("underPrices", { ...form.underPrices, [String(actual)]: value })} />) : null}
            </> : null}
          </Card>

          <Card title={text("5 · Dietary information", "5 · 饮食信息")} hint={text("Choose only options confirmed by the college for this booking.", "仅选择学院已为本次预订确认的选项。") }>
            <View style={s.switchGrid}>
              <Toggle label={text("Vegan", "纯素")} value={form.vegan} onChange={(value) => set("vegan", value)} />
              <Toggle label={text("Vegetarian", "素食")} value={form.vegetarian} onChange={(value) => set("vegetarian", value)} />
              <Toggle label={text("Halal", "清真")} value={form.halal} onChange={(value) => set("halal", value)} />
              <Toggle label={text("Gluten-free", "无麸质")} value={form.glutenFree} onChange={(value) => set("glutenFree", value)} />
            </View>
            <OptionalField label={text("Dietary note (optional)", "饮食备注（可选）")} value={form.dietaryNote} onChange={(value) => set("dietaryNote", value)} placeholder={text("Only add information confirmed by the college.", "仅填写学院已经确认的信息。") } />
          </Card>
        </>
      ) : null}

      {form.category === "coach_train" ? (
        <>
          <Card title={text("2 · Journey", "2 · 行程信息")}>
            <Label text={text("Ticket type", "票务类型")} />
            <Pills value={form.ticketType} options={[["Coach", text("Coach", "大巴")], ["Train", text("Train", "火车")]]} onChange={(value) => set("ticketType", value as Draft["ticketType"])} />
            <View style={[s.row, compact && s.stack]}>
              <TextField label={text("From", "出发地")} value={form.origin} setValue={(value) => set("origin", value)} placeholder="Oxford Gloucester Green" />
              <TextField label={text("To", "目的地")} value={form.destination} setValue={(value) => set("destination", value)} placeholder="London Victoria" />
            </View>
            <Text style={s.subheading}>{text("Departure", "出发")}</Text>
            <DateTimeRow compact={compact} date={form.date} time={form.time} setDate={(value) => setForm((old) => ({ ...old, date: value, arrivalDate: !old.arrivalDate || old.arrivalDate === old.date ? value : old.arrivalDate }))} setTime={(value) => set("time", value)} />
            <Text style={s.subheading}>{text("Arrival", "到达")}</Text>
            <DateTimeRow compact={compact} date={form.arrivalDate} time={form.arrivalTime} setDate={(value) => set("arrivalDate", value)} setTime={(value) => set("arrivalTime", value)} />
            <View style={duration ? s.durationOk : s.durationEmpty}>
              <Ionicons name="time-outline" size={20} color={duration ? C.ok : C.muted} />
              <Text style={duration ? s.durationOkText : s.help}>{duration ? text(`Duration calculated automatically: ${formatDuration(duration)}`, `系统自动计算时长：${formatDurationZh(duration)}`) : text("Enter departure and arrival to calculate the journey time.", "填写出发与到达时间后，系统会自动计算行程时长。")}</Text>
            </View>
            <Label text={text("Operator (optional)", "运营商（可选）")} />
            <Pills value={form.operatorName || "Other / not stated"} options={form.ticketType === "Coach" ? [["Oxford Tube", "Oxford Tube"], ["National Express", "National Express"], ["Megabus", "Megabus"], ["Other / not stated", "Other"]] : [["GWR", "GWR"], ["Chiltern Railways", "Chiltern"], ["CrossCountry", "CrossCountry"], ["Other / not stated", "Other"]]} onChange={(value) => set("operatorName", value === "Other / not stated" ? "" : value)} />
          </Card>
          <Card title={text("3 · Tickets and price", "3 · 票数与价格")}>
            <View style={[s.row, compact && s.stack]}>
              <NumberField label={text("Number of tickets", "票数")} value={form.quantity} setValue={(value) => set("quantity", value)} />
              <MoneyField label={text("Original price (optional)", "原价（可选）")} value={form.faceValue} setValue={(value) => set("faceValue", value)} />
              <MoneyField label={text("Your asking price", "你的售价")} value={form.askingPrice} setValue={(value) => set("askingPrice", value)} warning={invalidPrice(form.askingPrice, form.faceValue)} />
            </View>
            <Label text={text("Ticket conditions", "使用条件")} />
            <Pills value={form.notes || "No restriction stated"} options={[["No restriction stated", text("No restriction stated", "未说明限制")], ["Named passenger — check before purchase", text("Named passenger", "实名乘客")], ["Specific service only", text("Specific service", "仅限指定班次")], ["Railcard required", text("Railcard required", "需要 Railcard")]]} onChange={(value) => set("notes", value === "No restriction stated" ? "" : value)} />
          </Card>
        </>
      ) : null}

      {form.category === "event" ? (
        <>
          <Card title={text("2 · What is offered?", "2 · 提供什么？")}>
            <Pills value={form.eventKind} options={[["admission", text("Event admission", "活动门票")], ["airport_ride_share", text("Airport ride-share", "机场拼车")]]} onChange={(value) => setForm((old) => ({ ...old, eventKind: value as EventKind, eventName: "", eventNameEn: "", origin: "", destination: "", eventDescription: "", eventDescriptionEn: "" }))} />
            {form.eventKind === "admission" ? <TextField label={text("Event name", "活动名称")} value={form.eventName} setValue={(value) => set("eventName", value)} placeholder={text("Concert, museum, theatre or other event", "音乐会、博物馆、剧院或其他活动") } /> : <View style={[s.row, compact && s.stack]}>
              <TextField label={text("Pickup", "上车地点")} value={form.origin} setValue={(value) => set("origin", value)} placeholder={text("College or city pickup", "学院或城市上车地点") } />
              <TextField label={text("Airport / destination", "机场 / 目的地")} value={form.destination} setValue={(value) => set("destination", value)} placeholder={text("Heathrow Terminal 5", "希思罗机场 5 号航站楼") } />
            </View>}
            <DateTimeRow compact={compact} date={form.date} time={form.time} setDate={(value) => set("date", value)} setTime={(value) => set("time", value)} />
            <NumberField label={form.eventKind === "admission" ? text("Places available", "可用名额") : text("Seats to share", "可拼车名额")} value={form.quantity} setValue={(value) => set("quantity", value)} />
            <OptionalField label={text("Optional note", "可选备注")} value={form.eventDescription} onChange={(value) => set("eventDescription", value)} placeholder={form.eventKind === "admission" ? text("Optional entry detail.", "可选填写入场补充信息。") : text("Optional pickup, luggage or fare-sharing detail.", "可选填写上车点、行李或费用分摊说明。") } />
          </Card>
          <Card title={text("3 · Price", "3 · 价格")}>
            <View style={[s.row, compact && s.stack]}>
              <MoneyField label={form.eventKind === "admission" ? text("Original ticket price (optional)", "门票原价（可选）") : text("Total journey cost (optional)", "行程总费用（可选）")} value={form.faceValue} setValue={(value) => set("faceValue", value)} />
              <MoneyField label={form.eventKind === "admission" ? text("Price you want (optional)", "你的售价（可选）") : text("Amount each person pays (optional)", "每人分摊金额（可选）")} value={form.askingPrice} setValue={(value) => set("askingPrice", value)} />
            </View>
          </Card>
        </>
      ) : null}

      <Card title={text("Ticket swap (optional)", "票换票（可选）")} hint={text("This is an extra option on a normal listing, not a separate listing type. Your price and ordinary sale/contact route stay available.", "这是普通帖子上的附加选项，不是另一种发布类型。勾选后仍然保留售价和普通交易、联系流程。") }>
        <Toggle label={text("I am also open to exchanging this for another ticket", "我也愿意用这张票与别人换票")} value={form.openToSwap} onChange={(value) => set("openToSwap", value)} />
        {form.openToSwap ? <Notice text={text("The listing cover will show Supports ticket swaps and the post will appear in the Ticket Swap filter. A direct swap or any optional price difference is agreed privately. Formal Exchange does not process or protect that payment. Verify eligibility and transfer rules first, and never send QR codes or full ticket files before verifying the other person.", "帖子封面会显示“支持票换票”，并出现在票换票筛选中。直接交换或是否补差价由双方私下商定，Formal Exchange 不代收或保障这笔付款。请先核实双方资格与票务转让规则；核实对方前不要发送二维码或完整票务文件。") } /> : null}
      </Card>

      <Card title={`${form.category === "formal" ? "6" : "4"} · ${text("Photos (optional)", "图片（可选）")}`} hint={form.category === "formal" ? text("Optional photos may show the dining hall, previous dishes or the atmosphere. Never upload the ticket, QR code, barcode, booking reference or a personal document.", "可选图片可展示礼堂、以往菜品或用餐氛围。请勿上传票面、二维码、条形码、预订编号或个人证件。") : text("Photos are optional. Never upload a QR code, barcode, booking reference, ticket document or personal document.", "图片为可选。请勿上传二维码、条形码、预订编号、票务文件或个人证件。") }>
        <View style={s.photos}>
          {form.imageUris.map((uri, index) => <View key={`${uri}-${index}`} style={s.photoWrap}><Image source={{ uri }} style={s.photo} contentFit="cover" cachePolicy="memory-disk" /><Pressable accessibilityLabel={`Remove photo ${index + 1}`} style={s.removePhoto} onPress={() => set("imageUris", form.imageUris.filter((_, i) => i !== index))}><Ionicons name="close" size={17} color="#fff" /></Pressable></View>)}
          {form.imageUris.length < 4 ? <Pressable style={s.addPhoto} onPress={chooseImages}><Ionicons name="camera-outline" size={25} color={C.blue} /><Text style={s.addPhotoText}>{text("Add photos", "添加图片")}</Text><Text style={s.photoCount}>{form.imageUris.length}/4</Text></Pressable> : null}
        </View>
      </Card>

      <Card title={`${form.category === "formal" ? "7" : "5"} · ${text("Contact", "联系")}`} hint={text("In-app messages keep personal contact details private until you choose to share them.", "应用内私信可隐藏个人联系方式，直到你主动分享。") }>
        <Label text={text("Preferred first contact", "优先联系方式")} />
        <Pills value={form.preferredContact} options={[["In-app message", text("In-app message", "应用内私信")], ["Email", text("Email", "电子邮件")], ["WhatsApp", "WhatsApp"], ["WeChat", text("WeChat", "微信")]]} onChange={(value) => set("preferredContact", value as Draft["preferredContact"])} />
        {form.preferredContact !== "In-app message" ? <TextField label={text(`${form.preferredContact} detail`, `${form.preferredContact} 联系方式`)} value={form.contacts.find((item) => item.type === form.preferredContact)?.value ?? ""} setValue={(value) => set("contacts", [{ type: form.preferredContact as ContactType, value }])} placeholder={text(`Your ${form.preferredContact} contact`, `你的 ${form.preferredContact} 联系方式`) } /> : null}
        <Notice text={text("Formal Exchange does not currently process payments. Verify independently, never share passwords or verification codes, confirm the rules with the college or operator, and report suspicious behaviour.", "Formal Exchange 目前不处理在线付款。请独立核验信息，不要分享密码或验证码，并向学院或运营商确认规则；发现可疑行为请举报。") } />
      </Card>

      <View style={[s.actions, compact && s.actionsCompact]}>
        <Pressable style={({ pressed }) => [s.secondaryButton, pressed && s.pressed]} onPress={saveDraft} disabled={busy}>
          <Ionicons name="bookmark-outline" size={19} color={C.navy} /><Text style={s.secondaryButtonText}>{text("Save draft", "保存草稿")}</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [s.publishButton, (pressed || busy) && s.pressed]} onPress={publish} disabled={busy}>
          {busy ? <Ionicons name="hourglass-outline" size={19} color="#fff" /> : <Ionicons name="paper-plane-outline" size={19} color="#fff" />}
          <Text style={s.publishButtonText}>{busy ? text("Working…", "处理中…") : text("Publish", "发布")}</Text>
        </Pressable>
      </View>
      <Pressable style={s.exitButton} onPress={() => router.canGoBack() ? router.back() : router.replace("/seller")} disabled={busy}><Text style={s.exitText}>{text("Exit without publishing", "退出且不发布")}</Text></Pressable>
    </ScrollView>
    <Modal visible={published} transparent animationType="fade" onRequestClose={() => setPublished(false)}>
      <View style={s.modalShade}>
        <View style={s.successModal} accessibilityRole="alert">
          <View style={s.successIcon}><Ionicons name="checkmark" size={34} color="#fff" /></View>
          <Text style={s.successTitle}>{text("Listing published", "帖子发布成功")}</Text>
          <Text style={s.successBody}>{text("Your listing is now live. You can view it immediately or return to the marketplace.", "你的帖子已经上线；现在可以查看发布记录，或返回首页。")}</Text>
          <Pressable style={s.modalPrimary} onPress={() => router.replace("/my-listings")}><Text style={s.modalPrimaryText}>{text("View my listings", "查看我的发布")}</Text></Pressable>
          <Pressable style={s.modalSecondary} onPress={() => router.replace(Platform.OS === "web" ? "/marketplace" : "/")}><Text style={s.modalSecondaryText}>{text("Back to home", "返回首页")}</Text></Pressable>
        </View>
      </View>
    </Modal>
    </>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: any }) {
  return <View style={s.card}><Text style={s.section}>{title}</Text>{hint ? <Text style={s.help}>{hint}</Text> : null}{children}</View>;
}

function Label({ text }: { text: string }) { return <Text style={s.label}>{text}</Text>; }

function Notice({ text, danger = false }: { text: string; danger?: boolean }) {
  return <View style={[s.notice, danger && s.dangerNotice]}><Ionicons name={danger ? "warning-outline" : "shield-checkmark-outline"} size={20} color={danger ? C.danger : C.blue} /><Text style={[s.noticeText, danger && s.dangerText]}>{text}</Text></View>;
}

function Pills({ value, options, onChange }: { value: string; options: string[][]; onChange: (value: string) => void }) {
  return <View style={s.pills}>{options.map(([id, label]) => <Pressable key={id} style={({ pressed }) => [s.pill, value === id && s.pillActive, pressed && s.pressed]} onPress={() => onChange(id)}><Text style={[s.pillText, value === id && s.pillTextActive]}>{label}</Text></Pressable>)}</View>;
}

function CollegePicker({ colleges, selectedId, onSelect }: { colleges: College[]; selectedId: string; onSelect: (id: string) => void }) {
  const { text } = useAppLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = colleges.find((college) => college.id === selectedId);
  const shown = colleges.filter((college) => college.name.toLowerCase().includes(query.toLowerCase())).slice(0, 12);
  return <View><Label text={text("Host college", "举办学院")} /><Pressable style={s.selectButton} onPress={() => setOpen((value) => !value)}><Text style={s.selectButtonText}>{selected?.name ?? text("Choose college", "选择学院")}</Text><Ionicons name={open ? "chevron-up" : "chevron-down"} size={19} color={C.muted} /></Pressable>{open ? <View style={s.pickerPanel}><TextInput style={s.input} value={query} onChangeText={setQuery} placeholder={text("Search colleges", "搜索学院")} /><ScrollView nestedScrollEnabled style={s.collegeList}>{shown.map((college) => <Pressable key={college.id} style={[s.collegeOption, college.id === selectedId && s.collegeOptionActive]} onPress={() => { onSelect(college.id); setOpen(false); setQuery(""); }}><Text style={s.collegeOptionText}>{college.name}</Text></Pressable>)}</ScrollView></View> : null}</View>;
}

function TextField({ label, value, setValue, placeholder }: { label: string; value: string; setValue: (value: string) => void; placeholder?: string }) {
  return <View style={s.flexField}><Label text={label} /><TextInput style={s.input} value={value} onChangeText={setValue} placeholder={placeholder} placeholderTextColor="#94A3B8" /></View>;
}

function NumberField({ label, value, setValue }: { label: string; value: string; setValue: (value: string) => void }) {
  return <View style={s.flexField}><Label text={label} /><TextInput style={s.input} value={value} onChangeText={setValue} keyboardType="number-pad" placeholder="1" /></View>;
}

function MoneyField({ label, value, setValue, warning = false }: { label: string; value: string; setValue: (value: string) => void; warning?: boolean }) {
  return <View style={s.flexField}><Label text={label} /><View style={[s.moneyWrap, warning && s.warningInput]}><Text style={s.currency}>£</Text><TextInput style={s.moneyInput} value={value} onChangeText={setValue} keyboardType="decimal-pad" placeholder="0.00" /></View></View>;
}

function OptionalField({ label, value, onChange, placeholder, required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean }) {
  const { text } = useAppLanguage();
  return <View><Label text={`${label}${required ? ` · ${text("required", "必填")}` : ""}`} /><TextInput style={[s.input, s.textArea]} multiline value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#94A3B8" textAlignVertical="top" /></View>;
}

function DateTimeRow({ compact, date, time, setDate, setTime }: { compact: boolean; date: string; time: string; setDate: (value: string) => void; setTime: (value: string) => void }) {
  const { text } = useAppLanguage();
  return <View style={[s.row, compact && s.stack]}><DateField label={text("Date", "日期")} value={date} setValue={setDate} /><TimeField label={text("Time", "时间")} value={time} setValue={setTime} /></View>;
}

function DateField({ label, value, setValue }: { label: string; value: string; setValue: (value: string) => void }) {
  return <View style={s.flexField}><Label text={label} />{Platform.OS === "web" ? <WebInput type="date" value={value} onChange={(event: any) => setValue(event.target.value)} style={webInput} /> : <TextInput style={s.input} value={value} onChangeText={setValue} placeholder="YYYY-MM-DD" />}</View>;
}

function TimeField({ label, value, setValue }: { label: string; value: string; setValue: (value: string) => void }) {
  return <View style={s.flexField}><Label text={label} />{Platform.OS === "web" ? <WebInput type="time" value={value} onChange={(event: any) => setValue(event.target.value)} style={webInput} /> : <TextInput style={s.input} value={value} onChangeText={setValue} placeholder="18:30" />}</View>;
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return <View style={s.toggle}><Text style={s.toggleText}>{label}</Text><Switch value={value} onValueChange={onChange} trackColor={{ false: "#CBD5E1", true: "#8BA6C3" }} thumbColor={value ? C.navy : "#fff"} /></View>;
}

function calculateDuration(departureDate: string, departureTime: string, arrivalDate: string, arrivalTime: string) {
  if (!departureDate || !departureTime || !arrivalDate || !arrivalTime) return null;
  const departure = new Date(`${departureDate}T${departureTime}:00`);
  const arrival = new Date(`${arrivalDate}T${arrivalTime}:00`);
  const minutes = Math.round((arrival.getTime() - departure.getTime()) / 60000);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : null;
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours} hr${hours === 1 ? "" : "s"}${remainder ? ` ${remainder} min` : ""}`;
}
function formatDurationZh(minutes: number) { const hours = Math.floor(minutes / 60); const remainder = minutes % 60; return `${hours ? `${hours} 小时` : ""}${remainder ? ` ${remainder} 分钟` : ""}`.trim(); }

function maxNormal(face: string) { return Number(face) > 0 ? Number(face) * 1.2 : null; }
function maxUnder(face: string, total: number, actual: number) { return Number(face) > 0 ? Number(face) * (1 + (total - actual) * 0.4) : null; }
function invalidPrice(price: string, face: string) { return Boolean(price && face && Number(face) > 0 && Number(price) > Number(face) * 1.2 + 0.001); }
function toIso(date: string, time: string) { return date ? new Date(`${date}T${time}:00`).toISOString() : null; }
function friendlyError(error: any) {
  const text = error?.message ?? "Please try again.";
  if (/row-level security/i.test(text)) return "Your session or listing permission could not be verified. Log out, log in again and retry.";
  if (/column .* does not exist/i.test(text)) return "The listing service is being updated. Please retry in a moment.";
  return text;
}

const webInput = { width: "100%", height: 52, border: `1px solid ${C.border}`, borderRadius: 14, padding: "0 14px", backgroundColor: C.surface, boxSizing: "border-box", color: C.navy, fontSize: 16 };

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  content: { boxSizing: "border-box", width: "100%", maxWidth: 920, alignSelf: "center", padding: 24, paddingTop: 34, paddingBottom: 80 },
  contentCompact: { paddingHorizontal: 14, paddingTop: 18 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 13 },
  headerCopy: { flex: 1 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff", borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  eyebrow: { color: "#8A4B22", fontSize: 12, fontWeight: "900", letterSpacing: 1.3 },
  title: { color: C.navy, fontSize: 34, lineHeight: 40, fontWeight: "900", marginTop: 2 },
  titleCompact: { fontSize: 28, lineHeight: 33 },
  subtitle: { color: C.muted, fontSize: 14, lineHeight: 21, marginTop: 4, maxWidth: 640 },
  progress: { marginTop: 14, backgroundColor: "#EFF6FF", borderRadius: 14, padding: 12 },
  ok: { marginTop: 14, backgroundColor: C.okBg, borderRadius: 14, padding: 12 },
  error: { marginTop: 14, backgroundColor: C.dangerBg, borderWidth: 1, borderColor: "#FCA5A5", borderRadius: 14, padding: 12 },
  statusText: { color: C.navy, fontWeight: "800" },
  restore: { marginTop: 12, flexDirection: "row", gap: 8, alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 13, paddingVertical: 10, borderRadius: 14, backgroundColor: "#fff", borderWidth: 1, borderColor: C.border },
  restoreText: { color: C.blue, fontWeight: "900" },
  externalMarket: { marginTop: 11, minHeight: 48, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, paddingHorizontal: 12 },
  externalMarketText: { flex: 1, minWidth: 0, color: C.blue, fontSize: 13, lineHeight: 18, fontWeight: "900" },
  card: { marginTop: 15, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 22, padding: 17, overflow: "hidden" },
  section: { color: C.navy, fontSize: 20, lineHeight: 25, fontWeight: "900" },
  subheading: { color: C.navy, fontSize: 15, fontWeight: "900", marginTop: 17 },
  help: { color: C.muted, fontSize: 13, lineHeight: 19, marginTop: 4, flexShrink: 1 },
  label: { color: "#526278", fontSize: 12, lineHeight: 17, fontWeight: "900", marginTop: 15, marginBottom: 7 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  pill: { maxWidth: "100%", paddingHorizontal: 13, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  pillActive: { borderColor: C.navy, backgroundColor: C.navy },
  pillText: { color: C.blue, fontSize: 13, lineHeight: 17, fontWeight: "800", flexShrink: 1 },
  pillTextActive: { color: "#fff" },
  pressed: { opacity: 0.66, transform: [{ scale: 0.99 }] },
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  stack: { flexDirection: "column", gap: 0 },
  flexField: { flex: 1, minWidth: 0, width: "100%" },
  input: { minHeight: 52, width: "100%", borderWidth: 1, borderColor: C.border, borderRadius: 14, backgroundColor: C.surface, paddingHorizontal: 13, color: C.navy, fontSize: 16 },
  textArea: { minHeight: 94, paddingTop: 12, paddingBottom: 12 },
  moneyWrap: { minHeight: 52, width: "100%", flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: C.border, borderRadius: 14, backgroundColor: C.surface, paddingHorizontal: 13 },
  warningInput: { borderColor: "#F97316", backgroundColor: "#FFF7ED" },
  currency: { color: C.navy, fontSize: 16, fontWeight: "900", marginRight: 5 },
  moneyInput: { flex: 1, minWidth: 0, paddingVertical: 13, color: C.navy, fontSize: 16 },
  selectButton: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, borderWidth: 1, borderColor: C.border, borderRadius: 14, backgroundColor: C.surface, paddingHorizontal: 13 },
  selectButtonText: { color: C.navy, fontSize: 15, fontWeight: "800", flex: 1 },
  pickerPanel: { marginTop: 7, padding: 8, borderRadius: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: C.border },
  collegeList: { maxHeight: 230, marginTop: 6 },
  collegeOption: { paddingHorizontal: 12, paddingVertical: 12, borderRadius: 11 },
  collegeOptionActive: { backgroundColor: "#EEF4FA" },
  collegeOptionText: { color: C.navy, fontWeight: "800" },
  toggle: { width: "100%", minHeight: 49, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  toggleText: { color: C.navy, fontSize: 14, lineHeight: 20, fontWeight: "800", flex: 1, flexShrink: 1 },
  switchGrid: { marginTop: 6 },
  notice: { marginTop: 14, flexDirection: "row", alignItems: "flex-start", gap: 9, backgroundColor: "#EFF6FF", borderRadius: 14, padding: 12 },
  dangerNotice: { backgroundColor: C.dangerBg },
  noticeText: { color: C.blue, fontSize: 13, lineHeight: 20, fontWeight: "700", flex: 1 },
  dangerText: { color: C.danger },
  durationOk: { marginTop: 13, flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: C.okBg, padding: 12, borderRadius: 14 },
  durationEmpty: { marginTop: 13, flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: C.surface, padding: 12, borderRadius: 14 },
  durationOkText: { color: C.ok, fontWeight: "900", flex: 1 },
  photos: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 13 },
  photoWrap: { width: 105, height: 105, borderRadius: 15, overflow: "hidden", backgroundColor: C.surface },
  photo: { width: "100%", height: "100%", resizeMode: "cover" },
  removePhoto: { position: "absolute", top: 6, right: 6, width: 25, height: 25, borderRadius: 13, backgroundColor: "rgba(7,27,58,.86)", alignItems: "center", justifyContent: "center" },
  addPhoto: { width: 105, height: 105, borderRadius: 15, borderWidth: 1, borderStyle: "dashed", borderColor: "#8BA6C3", backgroundColor: "#F7FAFC", alignItems: "center", justifyContent: "center", gap: 3 },
  addPhotoText: { color: C.blue, fontSize: 12, fontWeight: "900" },
  photoCount: { color: C.muted, fontSize: 11 },
  actions: { marginTop: 18, flexDirection: "row", gap: 11 },
  actionsCompact: { flexDirection: "column" },
  secondaryButton: { flex: 1, minHeight: 55, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderRadius: 16, borderWidth: 1, borderColor: C.navy, backgroundColor: "#fff" },
  secondaryButtonText: { color: C.navy, fontSize: 15, fontWeight: "900" },
  publishButton: { flex: 1.3, minHeight: 55, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: C.navy },
  publishButtonText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  exitButton: { marginTop: 10, minHeight: 45, alignItems: "center", justifyContent: "center" },
  exitText: { color: C.muted, fontWeight: "800" },
  modalShade: { flex: 1, backgroundColor: "rgba(7,27,58,.48)", alignItems: "center", justifyContent: "center", padding: 22 },
  successModal: { width: "100%", maxWidth: 430, backgroundColor: "#fff", borderRadius: 24, padding: 24, alignItems: "center", shadowColor: "#000", shadowOpacity: .2, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 14 },
  successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.ok, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  successTitle: { color: C.navy, fontSize: 24, lineHeight: 30, fontWeight: "900", textAlign: "center" },
  successBody: { color: C.muted, fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 8, marginBottom: 18 },
  modalPrimary: { width: "100%", minHeight: 52, borderRadius: 15, backgroundColor: C.navy, alignItems: "center", justifyContent: "center" },
  modalPrimaryText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  modalSecondary: { width: "100%", minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 5 },
  modalSecondaryText: { color: C.blue, fontSize: 14, fontWeight: "900" },
});
