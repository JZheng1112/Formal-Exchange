import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAppLanguage } from "../lib/language";

const C={bg:"#F7F4EE",navy:"#071B3A",muted:"#475569",border:"#D9DEE7",accent:"#9A3412",link:"#174B8A"};

const tradingHome=Platform.OS==="web"?"/marketplace":"/";

export default function HowItWorks(){const {language}=useAppLanguage();if(language==="zh")return <ChineseGuide/>;return <ScrollView style={s.page} contentContainerStyle={s.content}>
  <Pressable style={s.back} onPress={()=>router.push(tradingHome)}><Ionicons name="arrow-back" size={18} color={C.navy}/><Text style={s.backText}>Back to trading home</Text></Pressable>
  <Text style={s.eyebrow}>FORMAL EXCHANGE GUIDE</Text>
  <Text style={s.title}>How Formal Exchange works</Text>
  <Text style={s.lead}>Formal Exchange helps university communities reuse college dinner places that would otherwise be wasted. This guide explains eligibility, listing visibility, direct contact, pricing, safety, completion and reporting.</Text>
  <Text style={s.updated}>Platform rules and user guide · Please read before listing or purchasing</Text>
  <Pressable style={s.swapSpotlight} onPress={()=>router.push('/marketplace?filter=swap')}><View style={s.swapSpotlightIcon}><Ionicons name="swap-horizontal" size={25} color="#fff"/></View><View style={{flex:1}}><Text style={s.swapSpotlightTitle}>Ticket Swap is a core exchange route</Text><Text style={s.swapSpotlightText}>Offer one eligible college ticket for another without requiring a cash sale. Any optional price difference is agreed privately.</Text></View><Ionicons name="chevron-forward" size={20} color="#78350F"/></Pressable>

  <Section title="Our purpose and supported tickets">
    <P>Formal Exchange exists first to prevent valid Oxford and Cambridge formal dinner places from being wasted when the original holder can no longer attend. Formal trading remains the platform’s primary service and is the default view on the buyer page.</P>
    <P>Formal places are often hard to obtain, yet a person who secured one may later be unable to attend. Some colleges do not offer refunds or an official resale channel, while cross-college and Oxford–Cambridge opportunities are scattered across many informal channels. Formal Exchange brings permitted supply and demand together without overriding any college rule.</P>
    <P>As a secondary service, members may also list coach tickets, train tickets, other event admissions and airport ride-shares. Every listing is marked Oxford or Cambridge. Journey listings state origin, destination, departure, arrival, automatically calculated duration and relevant restrictions. Event posts use only the event name, places, time and description; ride-shares use pickup, destination, time, places and fare-sharing details.</P>
    <P>Buyers may switch ticket categories, browse all categories, or see only their own city. Second-hand home items are handled by liuxuejishi.com, a dedicated marketplace for international-student moves and household reuse.</P>
  </Section>

  <Section title="Who may use the platform">
    <P>Anyone may browse active listings without creating an account. Public listing information can include the college, formal date and time, the number and type of places available, the seller’s declared prices, dietary information, transfer restrictions and seller rating.</P>
    <P>Registration is open to any email address. Users who register or verify with a UK academic <B>.ac.uk</B> email receive a verified badge visible to other users. Only verified Oxford or Cambridge accounts may publish Formal tickets — this is our core anti-fraud measure. Users who register with a non-academic email can verify later in My Profile by linking a .ac.uk email.</P>
    <P>We strongly recommend that Oxford and Cambridge students verify their accounts. The verified badge increases buyer trust and is required for Formal ticket publishing. Our verification scope will expand to enterprise and global educational emails in the future.</P>
    <P>After registration, the user must open the verification email before signing in. If it does not arrive, the user should check spam or junk and may request another message after the displayed resend countdown.</P>
  </Section>

  <Section title="Browsing and choosing a listing">
    <P>The buyer page shows Formal tickets by default. Buyers may switch to journeys, events, airport ride-shares or all tickets, then narrow results by city, college, date and maximum price. Selecting a card opens the complete listing.</P>
    <P>Before proceeding, buyers should read the complete listing rather than relying on the headline price. In particular, check whether the place is a student/member place or a guest place, whether the seller must accompany the buyer, whether a guest-name change is required, the relevant deadline, dress code, arrival time, dietary arrangements and any college restriction on transfer.</P>
  </Section>

  <Section title="College face value and normal asking prices">
    <P>Every seller must declare the college face value separately from the price they wish to receive. Student/member and guest prices are not interchangeable and must be reported separately. The old free-text price-source field has been removed to keep listing concise; misleading face values remain reportable.</P>
    <P>On the listing form, guest-specific fields are conditional. The form begins with Guest seats set to zero, so no guest-price section is shown. Once the seller enters one or more Guest seats, the form opens the fields for the college guest face value and the seller’s normal guest price. A listing with zero Guest seats does not ask for, store or display a guest price.</P>
    <P>The ordinary asking price for a full group may not exceed <B>120% of the relevant college face value</B>. For example, if a guest place costs £20 from the college, the ordinary published guest price may not exceed £24. The same calculation applies independently to student/member places.</P>
    <P>A seller-submitted college price is treated as reported information until verified. It does not automatically replace an official or administrator-verified reference price. Buyers may report an inaccurate face value, a hidden charge or a final price that differs from the terms shown in the listing.</P>
  </Section>

  <Section title="Split sales and remaining inventory">
    <P>A seller must state whether the listing may be sold to more than one buyer. If split sales are allowed, each completed transaction reduces the remaining number of student/member and guest places. The listing remains visible while at least one place is available and closes automatically when the remaining inventory reaches zero.</P>
    <P>If split sales are not allowed, the listing is treated as one group transaction. Once that transaction is confirmed, the entire listing closes even if the buyer ultimately uses fewer than the maximum number of guest places. This is why non-splittable listings may include under-occupancy prices.</P>
  </Section>

  <Section title="Under-occupancy pricing">
    <P>The under-occupancy section is also conditional. It does not appear when Guest seats is zero or one. It appears only when the seller offers more than one Guest place and states that the listing cannot be split between multiple buyers. If split sales are allowed, smaller purchases simply reduce the remaining inventory and no under-occupancy tier is needed.</P>
    <P>Under-occupancy means that a non-splittable listing offers a larger guest group than the buyer intends to use. The seller may choose to charge the college face value for every smaller group, or declare a different per-person price for each possible number of attending guests. These prices must be published before the buyer agrees to transact.</P>
    <P>The permitted ceiling changes with the number of unused guest places. The ordinary full-group price remains capped at 120% of face value. For each missing guest, the maximum for that smaller-group tier increases by no more than <B>40% of the college guest face value</B>.</P>
    <Example title="Example: three guest places with a £20 face value">
      <Text style={s.exampleLine}>Three guests attending: ordinary price, maximum £24 per person.</Text>
      <Text style={s.exampleLine}>Two guests attending: one guest missing, maximum £28 per person.</Text>
      <Text style={s.exampleLine}>One guest attending: two guests missing, maximum £36 per person.</Text>
    </Example>
    <P>The seller may choose any lower amount, including face value, but may not demand more after agreement. If the final price exceeds the published tier or its permitted ceiling, the buyer may report the transaction.</P>
  </Section>

  <Section title="Private transactions">
    <P>In a private transaction, Formal Exchange introduces the parties and provides the seller’s chosen contact methods. The buyer and seller communicate, choose a payment method and arrange transfer independently. Formal Exchange does not receive, hold or transmit money for a private transaction.</P>
    <P>Buyers should not treat a platform profile or university email as a guarantee. They should confirm the ticket details, college rules, exact amount, recipient account and transfer arrangement before paying. Sellers should retain evidence of the agreed price and delivery. The platform currently provides no payment guarantee or automatic refund.</P>
  </Section>

  <Section title="Ticket swaps">
    <P>A seller enables Ticket Swap by ticking one optional box while publishing a normal listing. The price and ordinary purchase/contact route remain available. The listing cover then shows a Supports ticket swaps badge and the distinctly coloured Ticket Swap filter can find it.</P>
    <P>The badge is an invitation to discuss, not an automatic agreement. For example, one member may offer an eligible place at College A for an eligible place at College B. Both parties must independently confirm eligibility and transfer rules. A direct exchange or any optional difference in value is agreed privately; Formal Exchange does not set, receive or protect a balancing payment.</P>
  </Section>

  <Section title="Online payment development">
    <P>Online payment is not currently available because its security, dispute handling and ticket-release safeguards are still being improved. Formal Exchange is actively researching a safer protected-payment flow, but no user should interpret a current listing as offering platform payment protection.</P>
    <P>For now, buyers and sellers contact one another directly. Confirm eligibility, college or operator rules, the final price, ticket validity and transfer method before making any payment. Keep a written record and report misleading or unsafe conduct to support.</P>
  </Section>

  <Section title="Current safety protections and their limits">
    <P>Every account must verify an institutional <B>.ac.uk</B> email. Anonymous visitors may browse seller listings, but buyer-request contact details are available only to authenticated members. Oxford and Cambridge Formal listing privileges are separated from the wider permission to list travel or event tickets.</P>
    <P>Sellers must declare face value, asking price, transfer restrictions and whether a Formal place may be transferred outside their college or outside Oxford and Cambridge. Knowingly listing a prohibited transfer, misrepresenting eligibility, duplicating a sale or failing to deliver may be reported. Confirmed serious or repeated breaches may result in listing removal, rating penalties or account suspension.</P>
    <P>Expired listings are removed from active discovery, and sellers can withdraw available listings. These controls reduce stale supply but do not prove that every ticket is genuine. Buyers should request suitable evidence, verify college, operator or venue rules, and preserve messages and payment records.</P>
    <P>Because payments are currently arranged privately, Formal Exchange does not hold the money, guarantee a refund, guarantee admission or reverse a bank transfer. Never pay under pressure. Contact <B>support@formal-exchange.co.uk</B> if a transaction appears unsafe.</P>
  </Section>

  <Section title="Completing a transaction and withdrawing a listing">
    <P>For a private non-splittable transaction, the seller selects Confirm transaction completed and confirms that the whole listing should close. For a private split sale, the seller records how many student/member and guest places were sold; the system subtracts those quantities and leaves the remaining inventory active.</P>
    <P>A seller may withdraw any available listing. After a direct transaction, a seller confirms completion; split listings subtract the sold places and non-splittable listings close in full.</P>
    <P>Listings also expire automatically after the formal date and time. Expiry removes them from public search but does not erase the underlying record, which may still be needed for transaction history, reports or disputes.</P>
  </Section>

  <Section title="Reports, evidence and seller ratings">
    <P>Users may report inaccurate face values, undisclosed charges, misleading transfer information, loss of contact, payment without delivery, duplicate sale, abusive conduct or another material problem. A report does not automatically prove wrongdoing. The platform should review the listing, communications, payment evidence and delivery record before imposing a penalty.</P>
    <P>Seller ratings begin at 5.0. A substantiated serious breach may reduce the rating or remove listing privileges. Selling a non-transferable Formal ticket, knowingly selling to an ineligible buyer, duplicate sale or deliberate non-delivery may lead to immediate removal or account suspension. Repeated or especially serious misconduct may lead to a wider restriction.</P>
    <P>Buyers must also act honestly. False payment claims, abusive contact or fabricated reports may be investigated and may result in account restrictions.</P>
  </Section>

  <Section title="College visit records">
    <P>Users who enjoy visiting different college formals can maintain a personal College visit record. The page shows visited colleges, remaining colleges and overall completion progress. Users may manually record a college attended through another route.</P>
    <P>The college saved in an Oxford or Cambridge member’s profile is counted as visited automatically. Other visits may be recorded manually or through completed activity after the event date; arranging a ticket before the event does not itself prove attendance.</P>
  </Section>

  <Section title="Dietary information and college responsibility">
    <P>Listings may indicate vegan, vegetarian, halal, gluten-free or other arrangements, but these descriptions are supplied by sellers and may change. Buyers should confirm important allergies and dietary requirements with the seller and, where necessary, directly with the college.</P>
    <P>Formal Exchange does not operate college dining halls and cannot override college booking, guest, identity, dress or transfer rules. A platform listing does not guarantee admission where the buyer or seller fails to comply with those rules.</P>
  </Section>

  <View style={s.closing}><Text style={s.closingTitle}>The central principle</Text><Text style={s.closingText}>Price, capacity, eligibility and transfer restrictions must be clear before agreement. Direct transactions remain the responsibility of the parties while payment safeguards are still being developed. When something goes wrong, preserve messages and evidence, report the listing and contact support promptly.</Text></View>
  <View style={s.links}><Pressable onPress={()=>router.push("/find-ticket")}><Text style={s.link}>Browse all tickets</Text></Pressable><Pressable onPress={()=>router.push("/list-ticket")}><Text style={s.link}>List a ticket</Text></Pressable><Pressable onPress={()=>router.push("/contact-support")}><Text style={s.link}>Contact support</Text></Pressable></View>
</ScrollView>}

function ChineseGuide(){return <ScrollView style={s.page} contentContainerStyle={s.content}>
  <Pressable style={s.back} onPress={()=>router.push(tradingHome)}><Ionicons name="arrow-back" size={18} color={C.navy}/><Text style={s.backText}>返回交易首页</Text></Pressable>
  <Text style={s.eyebrow}>FORMAL EXCHANGE 指南</Text><Text style={s.title}>Formal Exchange 使用方法</Text>
  <Text style={s.lead}>Formal Exchange 帮助大学社区重新利用原本会被浪费的学院晚宴名额。以下说明涵盖资格、帖子可见范围、直接联系、定价、安全、完成交易与举报。</Text>
  <Text style={s.updated}>平台规则与用户指南 · 发布或购买前请阅读</Text>
  <Pressable style={s.swapSpotlight} onPress={()=>router.push('/marketplace?filter=swap')}><View style={s.swapSpotlightIcon}><Ionicons name="swap-horizontal" size={25} color="#fff"/></View><View style={{flex:1}}><Text style={s.swapSpotlightTitle}>换票专区是核心交换方式</Text><Text style={s.swapSpotlightText}>可以用一张符合转让规则的学院票直接交换另一张票，不必先进行现金买卖；是否补差价由双方私下决定。</Text></View><Ionicons name="chevron-forward" size={20} color="#78350F"/></Pressable>
  <Section title="平台目的与支持的票务"><P>我们的首要目标，是在原持票人无法参加时，避免有效的牛津和剑桥 Formal 晚宴名额被浪费。Formal 交换始终是主营功能，也是买家页的默认内容。</P><P>Formal 经常一票难求，但抢到票的人可能临时无法参加。部分学院不提供退款或官方转售渠道，跨学院及牛津—剑桥之间的机会又分散在多个非正式渠道。平台只撮合学院规则允许的供需，不会凌驾于学院规则之上。</P><P>辅助功能包括大巴票、火车票、其他活动门票和机场拼车。所有帖子标明牛津或剑桥；行程票展示出发地、目的地、出发与到达时间、自动计算的时长及限制。</P></Section>
  <Section title="账号与认证"><P>使用任意邮箱即可注册。使用英国 .ac.uk 高校邮箱注册或认证后将获得认证标识，其他用户可以看到。只有认证的牛津或剑桥账号才能发布 Formal 票——这是我们防止诈骗的核心措施。使用普通邮箱注册的用户可以稍后在「我的资料」中关联 .ac.uk 邮箱进行认证。</P><P>我们强烈建议牛津和剑桥的学生进行认证。认证标识能增加买家信任，也是发布 Formal 票的必要条件。我们的认证范围今后将扩展到企业和全球教育邮箱，目前服务英国高校。</P><P>买家必须先登录才能联系卖家、查看受保护联系方式、保存学院访问记录或举报。</P></Section>
  <Section title="语言与自动翻译"><P>应用设置的语言就是发布时的填写语言，不需要选择“帖子语言”，也不需要再手工填写英文副本。你只需填写一次可选备注，系统会自动为使用另一种语言的用户生成译文，并提供“查看原文”。</P><P>机器翻译可能存在误差，因此票种、资格、学院、日期、时间、路线、人数和价格尽量使用结构化选项。涉及入场资格或转让规则时，请同时向卖家和学院确认。</P></Section>
  <Section title="Formal 可见范围与学院规则"><P>卖家有权根据学院规则选择是否向举办学院以外、牛津和剑桥以外的用户出售。本院学生也经常抢不到票，因此扩大可见范围不是自动的；不同账号看到的帖子可能不同。</P><P>卖家必须确认票务可按所选范围转让。禁止转让的票不得发布或出售；向不符合资格的买家出售，举报核实后可能导致帖子立即下架、Formal 发布权限被取消或账号暂停。</P></Section>
  <Section title="价格、拆分出售与剩余名额"><P>卖家分别填写本院成员票和宾客票的学院原价及售价。普通售价不得超过相应原价的 120%。宾客票为零时不会出现宾客价格问题。</P><P>若允许拆分出售，每次完成交易会扣减相应名额，剩余名额继续显示；若不允许拆分，确认完成后整组帖子关闭。多人宾客预订可预先声明人数不足时的价格，最终不得临时加价。</P></Section>
  <Section title="图片"><P>所有图片均为可选。Formal 图片用于展示用餐礼堂、以前的菜品或氛围；活动或行程图片用于辅助识别。绝不要上传票面、二维码、条形码、预订编号、付款凭证或个人证件。</P></Section>
  <Section title="票换票专区"><P>卖家在发布普通帖子时，只需勾选一个可选项即可开启票换票。原有售价、普通购买和联系流程全部保留；帖子封面会显示“支持票换票”，并能被颜色醒目的“票换票”筛选找到。</P><P>该标记只是邀请双方进一步沟通，并不代表自动达成交换。例如，用户可以用 A 学院的合资格名额交换 B 学院的合资格名额。双方仍须独立确认资格和转让规则。直接交换或是否补差价完全自愿并由双方私下决定；Formal Exchange 不定价、不代收，也不保障这笔补差价付款。</P></Section>
  <Section title="付款与安全保护"><P>在线付款功能正在完善安全、争议处理和放票机制，目前不可用。Formal Exchange 不收取或托管资金、不保证入场、不提供自动退款，也无法撤销私人转账。</P><P>平台采用机构邮箱验证、Formal 发布权限隔离、受众可见范围控制、到期自动下架、卖家主动撤帖、举报、管理审核、账号暂停和应用内私信等措施。它们可以降低风险，但不能证明每张票真实有效。</P><P>付款前请核验身份、票务证据、学院或运营商规则、准确价格和转让方式。不要分享密码或验证码，不要在压力下付款，保留聊天与付款记录。遇到问题请联系 support@formal-exchange.co.uk。</P></Section>
  <Section title="私信、完成交易与撤帖"><P>点击“联系购买”或“联系出售”会建立应用内对话。消息页先显示联系人列表，再进入具体聊天；启用系统通知后可收到新消息提醒。</P><P>卖家可撤下有效帖子。交易完成后，拆分帖子扣减已售名额；不可拆分帖子整体关闭。所有帖子会在活动或行程时间后自动从公开列表消失，但记录可保留用于举报或争议处理。</P></Section>
  <Section title="学院访问与多维评分"><P>个人资料中的所属学院会自动计入已访问。参加其他学院的 Formal 后，可在“学院—我的学院访问记录”中标记已访问，并从餐食、礼堂与环境、氛围、接待体验及性价比五个维度评分，还可添加一条可选评论。</P></Section>
  <View style={s.closing}><Text style={s.closingTitle}>核心原则</Text><Text style={s.closingText}>在达成交易前，价格、名额、资格和转让限制必须清晰。私人交易由双方负责；如有异常，请保留消息和证据、举报帖子并尽快联系支持团队。</Text></View>
  <View style={s.links}><Pressable onPress={()=>router.push("/find-ticket")}><Text style={s.link}>浏览所有票务</Text></Pressable><Pressable onPress={()=>router.push("/list-ticket")}><Text style={s.link}>发布票务</Text></Pressable><Pressable onPress={()=>router.push("/contact-support")}><Text style={s.link}>联系支持团队</Text></Pressable></View>
</ScrollView>}

function Section({title,children}:{title:string;children:any}){return <View style={s.section}><Text style={s.heading}>{title}</Text>{children}</View>}
function P({children}:{children:any}){return <Text style={s.paragraph}>{children}</Text>}
function B({children}:{children:any}){return <Text style={s.bold}>{children}</Text>}
function Example({title,children}:{title:string;children:any}){return <View style={s.example}><Text style={s.exampleTitle}>{title}</Text>{children}</View>}

const s=StyleSheet.create({page:{flex:1,backgroundColor:C.bg},content:{maxWidth:820,width:"100%",alignSelf:"center",paddingHorizontal:26,paddingTop:44,paddingBottom:90},back:{alignSelf:"flex-start",flexDirection:"row",alignItems:"center",gap:8,paddingVertical:8,marginBottom:28},backText:{color:C.navy,fontSize:14,fontWeight:"800"},eyebrow:{color:C.accent,fontSize:12,fontWeight:"900",letterSpacing:1.2},title:{marginTop:10,color:C.navy,fontSize:42,lineHeight:49,fontWeight:"900"},lead:{marginTop:18,color:C.navy,fontSize:19,lineHeight:31,fontWeight:"600"},updated:{marginTop:18,paddingBottom:26,borderBottomWidth:1,borderBottomColor:C.border,color:C.muted,fontSize:13,fontWeight:"700"},swapSpotlight:{marginTop:22,flexDirection:"row",alignItems:"center",gap:12,backgroundColor:'#FFFBEB',borderWidth:1,borderColor:'#F59E0B',borderRadius:20,padding:16},swapSpotlightIcon:{width:46,height:46,borderRadius:15,backgroundColor:'#B45309',alignItems:'center',justifyContent:'center'},swapSpotlightTitle:{fontSize:17,fontWeight:'900',color:'#78350F'},swapSpotlightText:{color:'#92400E',lineHeight:21,marginTop:5},section:{paddingTop:31},heading:{color:C.navy,fontSize:25,lineHeight:32,fontWeight:"900",marginBottom:7},paragraph:{marginTop:13,color:C.muted,fontSize:16,lineHeight:27},bold:{color:C.navy,fontWeight:"900"},example:{marginTop:18,borderLeftWidth:4,borderLeftColor:C.navy,paddingLeft:17,paddingVertical:3},exampleTitle:{color:C.navy,fontSize:16,fontWeight:"900",marginBottom:6},exampleLine:{marginTop:6,color:C.muted,fontSize:15,lineHeight:23},closing:{marginTop:38,paddingTop:25,borderTopWidth:2,borderTopColor:C.navy},closingTitle:{color:C.navy,fontSize:24,fontWeight:"900"},closingText:{marginTop:12,color:C.navy,fontSize:17,lineHeight:29,fontWeight:"600"},links:{marginTop:30,paddingTop:22,borderTopWidth:1,borderTopColor:C.border,flexDirection:"row",gap:22,flexWrap:"wrap"},link:{color:C.link,fontSize:15,fontWeight:"900",textDecorationLine:"underline"}});
