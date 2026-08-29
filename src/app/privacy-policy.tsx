import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useAppLanguage } from "../lib/language";

const C = { bg: "#F7F4EE", card: "#fff", navy: "#071B3A", muted: "#64748B", border: "#E2E8F0", accent: "#9A3412" };

const VERSION = "2026-08-v1";
const UPDATED_EN = "Last updated 29 August 2026";
const UPDATED_ZH = "最后更新：2026 年 8 月 29 日";
const CONTACT = "support@formal-exchange.co.uk";

type Section = { title: string; body: string[] };

const EN: Section[] = [
  {
    title: "Who we are",
    body: [
      "Formal Exchange is a community marketplace for permitted Oxford and Cambridge Formal tickets, buyer requests, travel tickets, event places and airport ride-shares. This notice explains what personal data we collect, why we hold it and what you can do about it.",
      `For any privacy question, or to exercise any right described below, email ${CONTACT}.`,
    ],
  },
  {
    title: "What we collect",
    body: [
      "Account data: your email address, your display name, your university and college where you give them, and an optional profile photo.",
      "Verification data: the UK academic (.ac.uk) email you confirm, and the date you confirmed it. We store the address and the outcome, never a password or a one-time code.",
      "Content you publish: listings, buyer requests, college ratings and comments, and any photo you attach to a listing.",
      "Messages: the content of in-app conversations, so both parties can read them and so we can investigate reports.",
      "Support and reports: feedback you submit, and reports you make about a listing, a price or a college policy.",
      "Technical data: a push notification token if you enable notifications, and basic page-view counts used to understand which screens are used.",
    ],
  },
  {
    title: "What we never collect",
    body: [
      "We do not ask for and must not be sent ticket barcodes, QR codes, passports, visas or bank details. Never upload a ticket image or a personal document.",
      "We do not process payments. Money moves privately between members, so we hold no card number and no bank account number.",
      "We use no advertising network, no analytics broker and no cross-app tracking. There is no advertising identifier and nothing is sold to anyone.",
    ],
  },
  {
    title: "Why we hold it",
    body: [
      "To run your account and keep you signed in.",
      "To confirm that a Formal seller genuinely holds an Oxford or Cambridge academic address, which is the main protection against fraud on this platform.",
      "To show your listing to the audience you chose, and to let a buyer contact you.",
      "To investigate reports, moderate content and suspend accounts that break college rules.",
      "Our lawful bases under UK GDPR are performance of a contract with you, and our legitimate interest in keeping the marketplace safe.",
    ],
  },
  {
    title: "Verification and what it unlocks",
    body: [
      "Anyone may register with any email address and browse.",
      "Confirming a .ac.uk address gives you a verified badge.",
      "Only a confirmed Oxford or Cambridge address (including college and department subdomains such as reuben.ox.ac.uk or trinity.cam.ac.uk) may publish Formal tickets. Other verified .ac.uk accounts may still post buyer requests, travel tickets, events and ride-shares.",
      "A badge is granted only after you open the link we email you. Entering an address alone never verifies an account.",
    ],
  },
  {
    title: "Who can see your data",
    body: [
      "Other members see your display name, verified badge, university, optional photo and anything you publish. Your email address is shown to another member only if you choose a contact method that reveals it.",
      "Our hosting and database provider is Supabase, which stores data on servers in the United Kingdom and the European Union and processes it only on our instructions.",
      "Push notifications, when enabled, are delivered through Expo.",
      "We disclose data otherwise only where the law requires it, or where it is necessary to investigate a serious breach of college rules or a suspected fraud.",
    ],
  },
  {
    title: "How long we keep it",
    body: [
      "Listings expire automatically after the event date passes, and you may delete a listing at any time before then.",
      "Messages are kept while your account is open so that both sides keep their record of a transaction.",
      "Closing your account removes your profile, listings and buyer requests. A report you are the subject of may be retained in anonymised form where it records a safety decision.",
      `To close your account, email ${CONTACT} from the address you registered with.`,
    ],
  },
  {
    title: "Your rights",
    body: [
      "Under UK GDPR you may ask for a copy of your data, correct anything inaccurate, delete your account, restrict or object to a use, or receive your data in a portable form.",
      `Write to ${CONTACT} and we will respond within one month.`,
      "If you are not satisfied you may complain to the Information Commissioner's Office at ico.org.uk.",
    ],
  },
  {
    title: "Cookies and local storage",
    body: [
      "We use essential storage only: a session token that keeps you signed in, and your language preference. There are no advertising or third-party tracking cookies, so declining non-essential cookies changes nothing about how the app works.",
    ],
  },
  {
    title: "Children",
    body: [
      "Formal Exchange is intended for university students and staff and is not directed at anyone under 16. If you believe a child has registered, contact us and we will remove the account.",
    ],
  },
  {
    title: "Changes",
    body: [
      "If we change how data is used in a way that affects you, we will update this page and raise the version number. Continuing to use the service after a change means you accept the updated notice.",
    ],
  },
];

const ZH: Section[] = [
  {
    title: "我们是谁",
    body: [
      "Formal Exchange 是面向牛津与剑桥的社区市场，涵盖学院允许转让的 Formal 票、求票需求、车票、活动名额与机场拼车。本声明说明我们收集哪些个人数据、为什么保存，以及你可以如何处理这些数据。",
      `如有任何隐私问题，或希望行使下述任何权利，请发送邮件至 ${CONTACT}。`,
    ],
  },
  {
    title: "我们收集什么",
    body: [
      "账号数据：邮箱地址、显示名称，以及你主动填写的大学与学院、可选的头像。",
      "验证数据：你确认的英国学术邮箱（.ac.uk）及确认时间。我们只保存地址与验证结果，绝不保存密码或验证码。",
      "你发布的内容：帖子、求票需求、学院评分与评论，以及你为帖子添加的照片。",
      "私信：应用内会话内容，以便双方查阅，并在收到举报时用于调查。",
      "支持与举报：你提交的反馈，以及你对帖子、价格或学院政策提出的举报。",
      "技术数据：如你开启通知，则包含推送令牌；以及用于了解各页面使用情况的基础访问计数。",
    ],
  },
  {
    title: "我们绝不收集什么",
    body: [
      "我们不会索取、也请勿上传票面条码、二维码、护照、签证或银行信息。任何情况下都不要上传票据图片或身份证件。",
      "我们不处理付款。资金在成员之间私下往来，因此我们不持有任何卡号或银行账号。",
      "我们不使用广告网络、数据分析中介或跨应用追踪，没有广告标识符，也不会将任何数据出售给任何人。",
    ],
  },
  {
    title: "为什么保存",
    body: [
      "维持你的账号与登录状态。",
      "确认 Formal 卖家确实拥有牛津或剑桥的学术邮箱——这是本平台防范欺诈的核心保护。",
      "按你选择的可见范围展示帖子，并让买家能够联系你。",
      "调查举报、审核内容，并暂停违反学院规则的账号。",
      "依据英国 GDPR，我们的合法依据是履行与你之间的合同，以及维护市场安全的正当利益。",
    ],
  },
  {
    title: "验证及其对应权限",
    body: [
      "任何人都可以使用任意邮箱注册并浏览。",
      "确认 .ac.uk 邮箱后可获得验证徽章。",
      "只有已确认的牛津或剑桥邮箱（包括学院与院系子域名，如 reuben.ox.ac.uk 或 trinity.cam.ac.uk）才能发布 Formal 票。其他已验证的 .ac.uk 账号仍可发布求票需求、车票、活动票与拼车。",
      "徽章只有在你打开我们发送的邮件链接之后才会授予。仅填写邮箱地址永远不会完成验证。",
    ],
  },
  {
    title: "谁能看到你的数据",
    body: [
      "其他成员可以看到你的显示名称、验证徽章、大学、可选头像以及你发布的内容。只有当你选择会公开邮箱的联系方式时，其他成员才会看到你的邮箱。",
      "我们的托管与数据库服务商为 Supabase，数据存储于英国与欧盟境内的服务器，且仅按我们的指示处理。",
      "如你开启推送通知，通知通过 Expo 送达。",
      "除法律要求，或为调查严重违反学院规则及疑似欺诈所必需外，我们不会向其他方披露数据。",
    ],
  },
  {
    title: "保存多久",
    body: [
      "帖子在活动日期过后自动下架，你也可以随时在此之前删除帖子。",
      "私信在账号存续期间保留，以便双方保有交易记录。",
      "注销账号会删除你的个人资料、帖子与求票需求。若某项举报记录了安全处置决定，可能以匿名形式保留。",
      `如需注销账号，请使用注册邮箱发送邮件至 ${CONTACT}。`,
    ],
  },
  {
    title: "你的权利",
    body: [
      "依据英国 GDPR，你可以要求获取数据副本、更正不准确的信息、注销账号、限制或反对某项使用，或以可携形式接收你的数据。",
      `请发送邮件至 ${CONTACT}，我们将在一个月内回复。`,
      "如你对处理结果不满意，可向英国信息专员办公室（ico.org.uk）投诉。",
    ],
  },
  {
    title: "Cookie 与本地存储",
    body: [
      "我们只使用必要存储：维持登录状态的会话令牌，以及你的语言偏好。不存在广告或第三方追踪 Cookie，因此拒绝非必要 Cookie 不会影响应用的任何功能。",
    ],
  },
  {
    title: "未成年人",
    body: [
      "Formal Exchange 面向高校学生与教职员工，并非面向 16 岁以下人士。如你认为有未成年人注册，请联系我们，我们会删除该账号。",
    ],
  },
  {
    title: "变更",
    body: [
      "如果我们以影响到你的方式改变数据用途，我们会更新本页面并提升版本号。变更后继续使用服务即表示你接受更新后的声明。",
    ],
  },
];

export default function PrivacyPolicy() {
  const { language, text } = useAppLanguage();
  const sections = language === "zh" ? ZH : EN;

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Text style={s.kicker}>{text("PRIVACY", "隐私")}</Text>
      <Text style={s.title}>{text("Privacy Policy", "隐私政策")}</Text>
      <Text style={s.subtitle}>
        {text(`Version ${VERSION} · ${UPDATED_EN}`, `版本 ${VERSION} · ${UPDATED_ZH}`)}
      </Text>

      <View style={s.lead}>
        <Text style={s.leadText}>
          {text(
            "Formal Exchange takes no payment, runs no advertising and tracks nobody across apps. We hold the minimum needed to verify academic accounts and let members contact each other safely.",
            "Formal Exchange 不收取任何款项、不投放广告、不进行跨应用追踪。我们只保存验证学术账号与保障成员安全联系所必需的最少信息。"
          )}
        </Text>
      </View>

      {sections.map((section, i) => (
        <View key={i} style={s.card}>
          <Text style={s.sectionTitle}>{section.title}</Text>
          {section.body.map((paragraph, j) => (
            <Text key={j} style={s.text}>
              {paragraph}
            </Text>
          ))}
        </View>
      ))}

      <Text style={s.footer}>
        {text(`Questions: ${CONTACT}`, `问题咨询：${CONTACT}`)}
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  content: { maxWidth: 900, width: "100%", alignSelf: "center", padding: 24, paddingTop: 48, paddingBottom: 70 },
  kicker: { fontSize: 13, fontWeight: "900", color: C.accent, letterSpacing: 0.8 },
  title: { marginTop: 4, fontSize: 34, fontWeight: "900", color: C.navy },
  subtitle: { marginTop: 6, color: C.muted, fontWeight: "700" },
  lead: { marginTop: 18, backgroundColor: "#FCF8EA", borderWidth: 1, borderColor: "#D6C7A1", borderRadius: 20, padding: 16 },
  leadText: { color: C.navy, lineHeight: 22, fontWeight: "700" },
  card: { marginTop: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 18 },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: C.navy, marginBottom: 4 },
  text: { marginTop: 8, color: C.muted, lineHeight: 22 },
  footer: { marginTop: 20, textAlign: "center", color: C.muted, fontWeight: "800" },
});
