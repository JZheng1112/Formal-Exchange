import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import {
  AdminSnapshot,
  adminDeleteCollegeRating,
  adminDeleteMarketplacePost,
  adminReviewItem,
  adminSetBuyerPostStatus,
  adminSetFeedbackVisibility,
  adminSetListingStatus,
  adminSetProfilePermissions,
  adminSetProfileRole,
  loadAdminDashboard,
  loadMyProfile,
} from "../lib/formalApi";

const C = {
  background: "#F7F4EE", card: "#FFFFFF", navy: "#071B3A", text: "#0F172A",
  muted: "#64748B", border: "#E2E8F0", gold: "#D6C7A1", rust: "#9A3412",
  rustBg: "#FFF7ED", green: "#166534", greenBg: "#ECFDF5", red: "#991B1B",
  redBg: "#FEF2F2", blueBg: "#EFF6FF",
};

const TABS = ["Overview", "Moderation", "Listings", "Buyer requests", "Users", "Feedback", "Colleges", "System"] as const;
type Tab = (typeof TABS)[number];
type Row = Record<string, any>;
type Run = (key: string, action: () => Promise<void>) => Promise<void>;
type ConfirmRun = (title: string, message: string, key: string, action: () => Promise<void>) => void;
type ListProps = { rows: Row[]; note: string; busy: string; run: Run };

export default function AdminDashboard() {
  const { width } = useWindowDimensions();
  const mobile = width < 720;
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState("");
  const [data, setData] = useState<AdminSnapshot | null>(null);
  const [tab, setTab] = useState<Tab>("Overview");
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const profile = await loadMyProfile();
      const ok = profile?.role === "admin";
      setAllowed(ok);
      setCurrentAdminId(profile?.id ?? "");
      if (ok) setData(await loadAdminDashboard());
    } catch (e: any) {
      setError(e?.message ?? "The admin data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function run(key: string, action: () => Promise<void>) {
    try {
      setBusy(key);
      setNotice("");
      await action();
      setNote("");
      await refresh();
      setNotice("Admin action completed successfully.");
    } catch (e: any) {
      const message = e?.message ?? "Please try again.";
      setError(message);
      Alert.alert("Admin action failed", message);
    } finally {
      setBusy("");
    }
  }

  function confirmRun(title: string, message: string, key: string, action: () => Promise<void>) {
    if (Platform.OS === "web") {
      if (globalThis.confirm(message)) void run(key, action);
      return;
    }
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: "Continue", style: "destructive", onPress: () => void run(key, action) },
    ]);
  }

  const q = search.trim().toLowerCase();
  const filter = (rows: Row[]) => !q ? rows : rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q));

  if (loading && !data) return <Centered icon="shield-checkmark-outline" title="Loading admin console…" loading />;
  if (allowed === false) return <Centered icon="lock-closed-outline" title="Admin access required" body="Log in with the designated administrator account." action="Go to login" onPress={() => router.replace("/login")} />;

  return (
    <View style={s.shell}>
      <ScrollView style={s.page} contentContainerStyle={[s.content, mobile && s.mobileContent]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={C.navy} />}>
        <View style={[s.header, mobile && s.headerMobile]}>
          <Pressable style={s.iconButton} onPress={() => router.replace("/my-profile")} accessibilityLabel="Back to profile">
            <Ionicons name="arrow-back" size={21} color={C.navy} />
          </Pressable>
          <View style={s.headerCopy}>
            <Text style={s.kicker}>FORMAL EXCHANGE ADMIN</Text>
            <Text style={[s.title, mobile && s.titleMobile]}>Operations console</Text>
            <Text style={s.subtitle}>Moderation, members, supply, buyer demand, feedback and privacy-conscious analytics.</Text>
          </View>
          <Pressable style={s.refreshButton} disabled={loading} onPress={refresh}>
            <Ionicons name="refresh-outline" size={19} color={C.navy} />
            {!mobile && <Text style={s.refreshText}>{loading ? "Refreshing…" : "Refresh"}</Text>}
          </Pressable>
        </View>

        {error ? <View style={s.errorBox}><Ionicons name="alert-circle-outline" size={20} color={C.red}/><Text style={s.errorText}>{error}</Text></View> : null}
        {notice ? <View style={s.successBox}><Ionicons name="checkmark-circle-outline" size={20} color={C.green}/><Text style={s.successText}>{notice}</Text></View> : null}

        <View style={s.tabs}>{TABS.map((item) => (
          <Pressable key={item} style={[s.tab, tab === item && s.tabOn]} onPress={() => setTab(item)}>
            <Text style={[s.tabText, tab === item && s.tabTextOn]}>{item}</Text>
          </Pressable>
        ))}</View>

        {tab !== "Overview" && tab !== "System" ? (
          <View style={[s.tools, mobile && s.toolsMobile]}>
            <View style={s.searchBox}>
              <Ionicons name="search-outline" size={18} color={C.muted}/>
              <TextInput value={search} onChangeText={setSearch} placeholder="Search this section" placeholderTextColor="#94A3B8" style={s.searchInput}/>
              {search ? <Pressable onPress={() => setSearch("")}><Ionicons name="close-circle" size={19} color={C.muted}/></Pressable> : null}
            </View>
            <TextInput value={note} onChangeText={setNote} placeholder="Admin note or suspension reason" placeholderTextColor="#94A3B8" style={s.noteInput}/>
          </View>
        ) : null}

        {data && tab === "Overview" && <Overview data={data} mobile={mobile} />}
        {data && tab === "Moderation" && <Moderation rows={filter([
          ...data.listing_reports.map((row) => ({ ...row, _table: "listing_reports", _kind: "Listing report" })),
          ...data.price_reports.map((row) => ({ ...row, _table: "price_reports", _kind: "Price report" })),
          ...data.policy_reports.map((row) => ({ ...row, _table: "college_policy_reports", _kind: "College-policy report" })),
        ])} note={note} busy={busy} run={run} confirmRun={confirmRun}/>} 
        {data && tab === "Listings" && <Listings rows={filter(data.listings)} note={note} busy={busy} run={run} confirmRun={confirmRun}/>} 
        {data && tab === "Buyer requests" && <BuyerRequests rows={filter(data.buyer_posts)} note={note} busy={busy} run={run} confirmRun={confirmRun}/>} 
        {data && tab === "Users" && <Users rows={filter(data.profiles)} note={note} busy={busy} run={run} confirmRun={confirmRun} currentAdminId={currentAdminId}/>} 
        {data && tab === "Feedback" && <Feedback rows={filter(data.feedback)} note={note} busy={busy} run={run}/>} 
        {data && tab === "Colleges" && <Colleges data={data} rows={filter(data.ratings)} busy={busy} run={run} confirmRun={confirmRun}/>} 
        {data && tab === "System" && <System data={data}/>} 

        <Text style={s.footer}>Last refreshed {formatDate(data?.generated_at)} · Pull down or tap Refresh for current production data.</Text>
      </ScrollView>
    </View>
  );
}

function Overview({ data, mobile }: { data: AdminSnapshot; mobile: boolean }) {
  const c = data.counts;
  const openCases = (c.listing_reports ?? 0) + (c.price_reports ?? 0) + (c.policy_reports ?? 0) + (c.feedback ?? 0);
  const metrics = [
    ["Page views", c.page_views, `${c.views_30d ?? 0} in the last 30 days`, "eye-outline"],
    ["Active supply", c.active_listings, `${c.listings ?? 0} listings in total`, "pricetag-outline"],
    ["Buyer demand", c.active_buyer_requests, `${c.buyer_requests ?? 0} requests in total`, "search-outline"],
    ["Members", c.profiles, `${c.suspended_profiles ?? 0} suspended`, "people-outline"],
    ["Open cases", openCases, "Reports and feedback awaiting action", "shield-outline"],
    ["Messages", c.messages, `${c.conversations ?? 0} conversations`, "chatbubbles-outline"],
  ];
  const maxViews = Math.max(1, ...data.daily_views.map((x) => Number(x.views) || 0));
  return <>
    <View style={s.metricGrid}>{metrics.map(([label,value,hint,icon]) => <Metric key={String(label)} label={String(label)} value={Number(value) || 0} hint={String(hint)} icon={String(icon) as any}/>)}</View>
    <View style={[s.twoCol, mobile && s.oneCol]}>
      <Panel title="Traffic · last 30 days" subtitle="Daily page views recorded across the app.">
        {data.daily_views.length ? data.daily_views.map((row) => <View style={s.barRow} key={String(row.day)}><Text style={s.barLabel}>{shortDate(row.day)}</Text><View style={s.barTrack}><View style={[s.barFill,{width:`${Math.max(4,(Number(row.views)||0)/maxViews*100)}%` as any}]}/></View><Text style={s.barValue}>{row.views}</Text></View>) : <Empty text="No page views have been recorded yet."/>}
      </Panel>
      <Panel title="Most visited pages" subtitle="Use this to see where users engage or drop off.">
        {data.path_views.length ? data.path_views.slice(0,12).map((row) => <View style={s.rankRow} key={String(row.path)}><Text numberOfLines={1} style={s.rankName}>{row.path}</Text><Text style={s.rankValue}>{row.views}</Text></View>) : <Empty text="No path-level activity yet."/>}
      </Panel>
    </View>
    <Panel title="Safety queue" subtitle="Every unresolved case should be reviewed before it is closed.">
      <View style={s.queueGrid}><Queue label="Listing reports" value={c.listing_reports}/><Queue label="Price reports" value={c.price_reports}/><Queue label="College-rule reports" value={c.policy_reports}/><Queue label="Support feedback" value={c.feedback}/></View>
    </Panel>
  </>;
}

function Moderation({ rows, note, busy, run, confirmRun }: ListProps & { confirmRun: ConfirmRun }) {
  return <Panel title="Moderation queue" subtitle="Review reports, record the outcome and remove unsafe listings when necessary.">
    {!rows.length ? <Empty text="No reports match this search."/> : rows.map((row) => {
      const table = row._table as "listing_reports" | "price_reports" | "college_policy_reports";
      const id = String(row.id);
      return <AdminCard key={`${table}-${id}`}>
        <View style={s.rowHead}><View style={s.rowHeadCopy}><Text style={s.cardTitle}>{row._kind}</Text><Text style={s.cardMeta}>{formatDate(row.created_at)} · {row.reporter_email ?? "Signed-in reporter"}</Text></View><Badge value={row.status ?? "new"}/></View>
        <DetailGrid rows={reportDetails(row)}/>
        <Actions>
          <Action label="Reviewing" icon="time-outline" disabled={!!busy} onPress={() => run(`${table}-${id}-reviewing`, () => adminReviewItem(table,id,"reviewing",note))}/>
          <Action label="Resolve" icon="checkmark-circle-outline" tone="good" disabled={!!busy} onPress={() => run(`${table}-${id}-resolved`, () => adminReviewItem(table,id,"resolved",note))}/>
          <Action label="Dismiss" icon="close-circle-outline" disabled={!!busy} onPress={() => run(`${table}-${id}-dismissed`, () => adminReviewItem(table,id,"dismissed",note))}/>
          {row.listing_id ? <Action label="Remove listing" icon="trash-outline" tone="danger" disabled={!!busy} onPress={() => confirmRun("Remove listing?","This removes the reported listing from discovery and records the action.",`listing-${row.listing_id}-removed`,() => adminSetListingStatus(String(row.listing_id),"removed",note || `Removed after ${row._kind.toLowerCase()}`))}/> : null}
        </Actions>
      </AdminCard>;
    })}
  </Panel>;
}

function Listings({ rows, note, busy, run, confirmRun }: ListProps & { confirmRun: ConfirmRun }) {
  return <Panel title="Seller listings" subtitle="All statuses are shown, including sold and withdrawn supply.">
    {!rows.length ? <Empty text="No listings match this search."/> : rows.map((row) => <AdminCard key={row.id}>
      <View style={s.rowHead}><View style={s.rowHeadCopy}><Text style={s.cardTitle}>{listingTitle(row)}</Text><Text style={s.cardMeta}>{row.seller_contact_email} · {formatDate(row.created_at)}</Text></View><Badge value={row.status}/></View>
      <DetailGrid rows={[["Category",row.listing_category],["Date",row.formal_date],["Inventory",`${row.student_seats ?? 0} member · ${row.guest_seats ?? 0} guest`],["Price",listingPrice(row)],["Moderation note",row.moderation_note]]}/>
      <Actions>
        {row.status === "active" ? <Action label="Open details" icon="open-outline" onPress={() => router.push(`/listing-detail?id=${row.id}` as any)}/> : null}
        <Action label="Activate" icon="checkmark-circle-outline" tone="good" disabled={!!busy || row.status === "active"} onPress={() => run(`listing-${row.id}-active`,()=>adminSetListingStatus(row.id,"active",note))}/>
        <Action label="Mark sold" icon="bag-check-outline" disabled={!!busy || row.status === "sold"} onPress={() => run(`listing-${row.id}-sold`,()=>adminSetListingStatus(row.id,"sold",note))}/>
        <Action label="Remove from market" icon="eye-off-outline" tone="danger" disabled={!!busy || row.status === "removed"} onPress={() => confirmRun("Remove listing from market?","The listing will disappear from buyer discovery but remain available to administrators.",`listing-${row.id}-removed`,()=>adminSetListingStatus(row.id,"removed",note))}/>
        <Action label="Delete permanently" icon="trash-outline" tone="danger" disabled={!!busy} onPress={() => confirmRun("Permanently delete listing?","This cannot be undone. The listing will be deleted from the database; its audit copy and existing conversation history will be retained.",`listing-${row.id}-delete`,()=>adminDeleteMarketplacePost("ticket_listing",row.id))}/>
        {row.seller_contact_email ? <Action label="Email seller" icon="mail-outline" onPress={() => Linking.openURL(`mailto:${row.seller_contact_email}`)}/> : null}
      </Actions>
    </AdminCard>)}
  </Panel>;
}

function BuyerRequests({ rows, note, busy, run, confirmRun }: ListProps & { confirmRun: ConfirmRun }) {
  return <Panel title="Buyer requests" subtitle="Manage demand posts independently from seller listings.">
    {!rows.length ? <Empty text="No buyer requests match this search."/> : rows.map((row) => <AdminCard key={row.id}>
      <View style={s.rowHead}><View style={s.rowHeadCopy}><Text style={s.cardTitle}>{row.ticket_type || row.category}</Text><Text style={s.cardMeta}>{row.buyer_email} · expires {formatDate(row.expires_at)}</Text></View><Badge value={row.status}/></View>
      <DetailGrid rows={[["Wanted",row.wanted_date],["Route",routeText(row)],["Quantity",row.quantity],["Budget",money(row.budget_gbp)],["Notes",row.notes],["Moderation note",row.moderation_note]]}/>
      <Actions>
        <Action label="Activate" icon="checkmark-circle-outline" tone="good" disabled={!!busy || row.status === "active"} onPress={() => run(`post-${row.id}-active`,()=>adminSetBuyerPostStatus(row.id,"active",note))}/>
        <Action label="Withdraw" icon="remove-circle-outline" disabled={!!busy || row.status === "withdrawn"} onPress={() => run(`post-${row.id}-withdrawn`,()=>adminSetBuyerPostStatus(row.id,"withdrawn",note))}/>
        <Action label="Remove from market" icon="eye-off-outline" tone="danger" disabled={!!busy || row.status === "removed"} onPress={() => confirmRun("Remove buyer request from market?","The request will disappear from seller discovery but remain available to administrators.",`post-${row.id}-removed`,()=>adminSetBuyerPostStatus(row.id,"removed",note))}/>
        <Action label="Delete permanently" icon="trash-outline" tone="danger" disabled={!!busy} onPress={() => confirmRun("Permanently delete buyer request?","This cannot be undone. The buyer request will be deleted from the database and an audit copy will be retained.",`post-${row.id}-delete`,()=>adminDeleteMarketplacePost("buyer_post",row.id))}/>
        {row.buyer_email ? <Action label="Email buyer" icon="mail-outline" onPress={() => Linking.openURL(`mailto:${row.buyer_email}`)}/> : null}
      </Actions>
    </AdminCard>)}
  </Panel>;
}

function Users({ rows, note, busy, run, confirmRun, currentAdminId }: ListProps & { confirmRun: ConfirmRun; currentAdminId: string }) {
  return <Panel title="Members, administrators and permissions" subtitle="Promote only trusted registered members. Administrator role changes, suspensions and Formal privileges are all audited.">
    {!rows.length ? <Empty text="No profiles match this search."/> : rows.map((row) => {
      const suspended = row.account_status === "suspended";
      return <AdminCard key={row.id}>
        <View style={s.rowHead}><View style={s.rowHeadCopy}><Text style={s.cardTitle}>{row.full_name || row.email || "Unnamed profile"}</Text><Text style={s.cardMeta}>{row.email} · joined {formatDate(row.created_at)}</Text></View><Badge value={row.role === "admin" ? "admin" : suspended ? "suspended" : "active"}/></View>
        <DetailGrid rows={[["Institution",[row.university,row.college_name].filter(Boolean).join(" · ")],["Formal-listing privilege",row.can_list_ticket ? "Enabled" : "Restricted"],["Member-price flags",row.overpricing_student_flags],["Guest-price flags",row.overpricing_guest_flags],["Suspension reason",row.suspension_reason]]}/>
        <Actions>
          {row.role === "admin" ? (
            <Action label={row.id === currentAdminId || String(row.email).toLowerCase() === "jiacheng.zheng@reuben.ox.ac.uk" ? "Protected admin" : "Remove admin"} icon="shield-outline" tone="danger" disabled={!!busy || row.id === currentAdminId || String(row.email).toLowerCase() === "jiacheng.zheng@reuben.ox.ac.uk"} onPress={() => confirmRun("Remove administrator?","This member will immediately lose access to all administration and moderation tools.",`profile-${row.id}-role-user`,()=>adminSetProfileRole(row.id,"user"))}/>
          ) : (
            <Action label="Make administrator" icon="shield-checkmark-outline" tone="good" disabled={!!busy} onPress={() => confirmRun("Grant administrator access?","This member will be able to view operational data, moderate content, suspend accounts and appoint other administrators.",`profile-${row.id}-role-admin`,()=>adminSetProfileRole(row.id,"admin"))}/>
          )}
          <Action label={row.can_list_ticket ? "Restrict Formal" : "Allow Formal"} icon={row.can_list_ticket ? "remove-circle-outline" : "checkmark-circle-outline"} disabled={!!busy} onPress={() => run(`profile-${row.id}-listing`,()=>adminSetProfilePermissions(row.id,!row.can_list_ticket,suspended?"suspended":"active",note || row.suspension_reason || ""))}/>
          {suspended ? <Action label="Restore account" icon="person-add-outline" tone="good" disabled={!!busy} onPress={() => run(`profile-${row.id}-restore`,()=>adminSetProfilePermissions(row.id,Boolean(row.can_list_ticket),"active",note))}/> : <Action label="Suspend account" icon="ban-outline" tone="danger" disabled={!!busy || row.role === "admin"} onPress={() => confirmRun("Suspend account?","The member will be blocked from publishing, requesting and messaging. Add the reason in Admin note first.",`profile-${row.id}-suspend`,()=>adminSetProfilePermissions(row.id,false,"suspended",note || "Safety review"))}/>}
          {row.email ? <Action label="Email member" icon="mail-outline" onPress={() => Linking.openURL(`mailto:${row.email}`)}/> : null}
        </Actions>
      </AdminCard>;
    })}
  </Panel>;
}

function Feedback({ rows, note, busy, run }: ListProps) {
  return <Panel title="Support and feedback" subtitle="Private reports remain private. Public comments can be hidden without deleting the record.">
    {!rows.length ? <Empty text="No feedback matches this search."/> : rows.map((row) => <AdminCard key={row.id}>
      <View style={s.rowHead}><View style={s.rowHeadCopy}><Text style={s.cardTitle}>{row.category || "Feedback"}</Text><Text style={s.cardMeta}>{row.name || "Anonymous"} · {row.email || "No email"} · {formatDate(row.created_at)}</Text></View><Badge value={row.status ?? "new"}/></View>
      <Text style={s.message}>{row.message}</Text>
      <DetailGrid rows={[["Page",row.page],["Visibility",row.is_public ? "Public" : "Private"],["Admin note",row.admin_note]]}/>
      <Actions>
        <Action label={row.is_public ? "Hide publicly" : "Publish comment"} icon={row.is_public ? "eye-off-outline" : "eye-outline"} disabled={!!busy} onPress={() => run(`feedback-${row.id}-visibility`,()=>adminSetFeedbackVisibility(row.id,!row.is_public))}/>
        <Action label="Reviewing" icon="time-outline" disabled={!!busy} onPress={() => run(`feedback-${row.id}-reviewing`,()=>adminReviewItem("feedbacks",row.id,"reviewing",note))}/>
        <Action label="Resolve" icon="checkmark-circle-outline" tone="good" disabled={!!busy} onPress={() => run(`feedback-${row.id}-resolved`,()=>adminReviewItem("feedbacks",row.id,"resolved",note))}/>
        {row.email ? <Action label="Reply by email" icon="mail-outline" onPress={() => Linking.openURL(`mailto:${row.email}`)}/> : null}
      </Actions>
    </AdminCard>)}
  </Panel>;
}

function Colleges({ data, rows, busy, run, confirmRun }: { data: AdminSnapshot; rows: Row[]; busy: string; run: Run; confirmRun: ConfirmRun }) {
  return <>
    <View style={[s.twoCol, s.alignStart]}>
      <Panel title="College ratings" subtitle="Aggregated student ratings, not an official university ranking.">
        {data.rating_summary.length ? data.rating_summary.map((row) => <View style={s.rankRow} key={row.college_id}><View style={s.rankName}><Text style={s.rankTitle}>{row.college_name}</Text><Text style={s.cardMeta}>{row.university} · {row.rating_count} ratings</Text></View><Text style={s.starValue}>★ {row.average_score}</Text></View>) : <Empty text="No college ratings yet."/>}
      </Panel>
      <Panel title="Recorded visits" subtitle="Counts include automatic completed-formal visits and manual records.">
        {data.visit_summary.length ? data.visit_summary.map((row) => <View style={s.rankRow} key={row.college_id}><Text style={s.rankName}>{row.college_name}</Text><Text style={s.rankValue}>{row.visit_count}</Text></View>) : <Empty text="No college visits recorded yet."/>}
      </Panel>
    </View>
    <Panel title="Rating moderation" subtitle="Remove abusive or irrelevant comments; the deletion is written to the audit log.">
      {!rows.length ? <Empty text="No ratings match this search."/> : rows.map((row) => <AdminCard key={row.id}>
        <View style={s.rowHead}><View style={s.rowHeadCopy}><Text style={s.cardTitle}>{row.college_name}</Text><Text style={s.cardMeta}>{row.university} · {formatDate(row.created_at)}</Text></View><Text style={s.starValue}>★ {row.score}</Text></View>
        {row.comment ? <Text style={s.message}>{row.comment}</Text> : <Text style={s.cardMeta}>No written comment.</Text>}
        <Actions><Action label="Delete rating" icon="trash-outline" tone="danger" disabled={!!busy} onPress={() => confirmRun("Delete rating?","Delete this rating and preserve a copy in the admin audit log.",`rating-${row.id}-delete`,()=>adminDeleteCollegeRating(row.id))}/></Actions>
      </AdminCard>)}
    </Panel>
  </>;
}

function System({ data }: { data: AdminSnapshot }) {
  return <>
    <Panel title="Messaging health" subtitle="Only conversation metadata is shown here; ordinary message bodies are not exposed in the admin console.">
      {!data.conversations.length ? <Empty text="No conversations yet."/> : data.conversations.map((row) => <View style={s.systemRow} key={row.id}><View style={s.systemIcon}><Ionicons name={row.is_demo?"flask-outline":"chatbubble-outline"} size={19} color={C.navy}/></View><View style={s.systemCopy}><Text style={s.rankTitle}>{row.subject}</Text><Text style={s.cardMeta}>{row.buyer_email} → {row.seller_email} · {row.message_count} messages · {row.unread_count} unread</Text></View><Text style={s.cardMeta}>{shortDate(row.updated_at)}</Text></View>)}
    </Panel>
    <Panel title="Admin audit log" subtitle="Every moderation and permission change is retained for accountability.">
      {!data.audit_log.length ? <Empty text="No admin actions recorded yet."/> : data.audit_log.map((row) => <View style={s.systemRow} key={String(row.id)}><View style={s.systemIcon}><Ionicons name="document-text-outline" size={19} color={C.navy}/></View><View style={s.systemCopy}><Text style={s.rankTitle}>{row.action} · {row.entity_type}</Text><Text style={s.cardMeta}>{row.entity_id || "—"} · {formatDate(row.created_at)}</Text></View></View>)}
    </Panel>
    <View style={s.privacyBox}><Ionicons name="shield-checkmark-outline" size={25} color={C.green}/><View style={s.privacyCopy}><Text style={s.privacyTitle}>Safety and privacy boundary</Text><Text style={s.privacyText}>The console exposes operational data only to authenticated administrators. It does not reveal ticket documents or ordinary message contents. Reports, suspensions and deletions are auditable.</Text></View></View>
  </>;
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: any }) { return <View style={s.panel}><Text style={s.panelTitle}>{title}</Text>{subtitle?<Text style={s.panelSub}>{subtitle}</Text>:null}<View style={s.panelBody}>{children}</View></View>; }
function AdminCard({ children }: { children: any }) { return <View style={s.adminCard}>{children}</View>; }
function Actions({ children }: { children: any }) { return <View style={s.actions}>{children}</View>; }
function Action({ label, icon, tone="normal", disabled=false, onPress }: { label:string; icon:any; tone?:"normal"|"good"|"danger"; disabled?:boolean; onPress:()=>void }) { return <Pressable disabled={disabled} onPress={onPress} style={({pressed})=>[s.action,tone==="good"&&s.actionGood,tone==="danger"&&s.actionDanger,(pressed||disabled)&&s.dim]}><Ionicons name={icon} size={16} color={tone==="danger"?C.red:tone==="good"?C.green:C.navy}/><Text style={[s.actionText,tone==="good"&&s.actionGoodText,tone==="danger"&&s.actionDangerText]}>{label}</Text></Pressable>; }
function Metric({ label, value, hint, icon }: { label:string; value:number; hint:string; icon:any }) { return <View style={s.metric}><View style={s.metricIcon}><Ionicons name={icon} size={21} color={C.navy}/></View><Text style={s.metricValue}>{value}</Text><Text style={s.metricLabel}>{label}</Text><Text style={s.metricHint}>{hint}</Text></View>; }
function Queue({label,value}:{label:string;value:any}) { return <View style={s.queue}><Text style={s.queueValue}>{Number(value)||0}</Text><Text style={s.queueLabel}>{label}</Text></View>; }
function Empty({ text }: { text:string }) { return <View style={s.empty}><Ionicons name="file-tray-outline" size={24} color={C.muted}/><Text style={s.emptyText}>{text}</Text></View>; }
function Badge({ value }: { value:any }) { const text=String(value??"unknown"); const good=["active","resolved","admin"].includes(text); const bad=["removed","suspended","dismissed"].includes(text); return <View style={[s.badge,good&&s.badgeGood,bad&&s.badgeBad]}><Text style={[s.badgeText,good&&s.badgeTextGood,bad&&s.badgeTextBad]}>{text.replaceAll("_"," ")}</Text></View>; }
function DetailGrid({rows}:{rows:any[][]}) { return <View style={s.detailGrid}>{rows.filter(([,v])=>v!==null&&v!==undefined&&String(v)!=="").map(([label,value])=><View style={s.detail} key={String(label)}><Text style={s.detailLabel}>{label}</Text><Text style={s.detailValue}>{String(value)}</Text></View>)}</View>; }
function Centered({icon,title,body,loading,action,onPress}:{icon:any;title:string;body?:string;loading?:boolean;action?:string;onPress?:()=>void}) { return <View style={s.center}><Ionicons name={icon} size={44} color={C.navy}/>{loading?<ActivityIndicator color={C.navy} style={{marginTop:14}}/>:null}<Text style={s.centerTitle}>{title}</Text>{body?<Text style={s.centerText}>{body}</Text>:null}{action?<Pressable style={s.centerButton} onPress={onPress}><Text style={s.centerButtonText}>{action}</Text></Pressable>:null}</View>; }

function reportDetails(row: Row) { return [["Type",row.report_type||row.policy_type||row.issue_type],["Message",row.message||row.evidence||row.description],["Listing",row.listing_id],["College",row.college_id],["Reported member price",money(row.reported_student_price_gbp)],["Reported guest price",money(row.reported_guest_price_gbp)],["Admin note",row.admin_note]]; }
function listingTitle(row: Row) { if(row.listing_category==="formal") return `${row.college_name||row.college_university||"Formal"} · ${row.formal_type||row.ticket_type||"Formal"}`; if(row.origin_name||row.destination_name) return `${row.origin_name||"Origin"} → ${row.destination_name||"Destination"}`; return row.ticket_type||"Event ticket"; }
function listingPrice(row: Row) { if(row.listing_category==="formal") return [row.student_listing_price_gbp!=null?`Member ${money(row.student_listing_price_gbp)}`:null,row.guest_listing_price_gbp!=null?`Guest ${money(row.guest_listing_price_gbp)}`:null].filter(Boolean).join(" · "); return money(row.asking_price_gbp); }
function routeText(row: Row) { return row.origin_name||row.destination_name ? `${row.origin_name||"Origin"} → ${row.destination_name||"Destination"}` : row.college_name||row.university||"—"; }
function money(value:any) { const n=Number(value); return Number.isFinite(n)?`£${n.toFixed(2)}`:"—"; }
function formatDate(value:any) { if(!value)return "—"; const d=new Date(value); return Number.isNaN(d.getTime())?String(value):d.toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short"}); }
function shortDate(value:any) { if(!value)return "—"; const d=new Date(value); return Number.isNaN(d.getTime())?String(value):d.toLocaleDateString("en-GB",{day:"2-digit",month:"short"}); }

const s=StyleSheet.create({
  shell:{flex:1,backgroundColor:C.background},page:{flex:1},content:{width:"100%",maxWidth:1220,alignSelf:"center",padding:28,paddingBottom:80},mobileContent:{padding:14,paddingTop:20},
  header:{flexDirection:"row",alignItems:"flex-start",gap:14,marginBottom:20},headerMobile:{flexWrap:"wrap"},iconButton:{width:44,height:44,borderRadius:15,backgroundColor:C.card,borderWidth:1,borderColor:C.border,alignItems:"center",justifyContent:"center"},headerCopy:{flex:1,minWidth:210},kicker:{fontSize:12,fontWeight:"900",color:C.rust,letterSpacing:1.2},title:{fontSize:38,lineHeight:43,fontWeight:"900",color:C.navy,marginTop:4},titleMobile:{fontSize:30,lineHeight:35},subtitle:{fontSize:15,lineHeight:22,color:C.muted,marginTop:6,maxWidth:760},refreshButton:{minHeight:44,paddingHorizontal:15,borderRadius:15,borderWidth:1,borderColor:C.gold,backgroundColor:C.card,flexDirection:"row",gap:7,alignItems:"center",justifyContent:"center"},refreshText:{fontWeight:"900",color:C.navy},
  errorBox:{flexDirection:"row",gap:9,alignItems:"center",padding:13,borderRadius:15,backgroundColor:C.redBg,borderWidth:1,borderColor:"#FCA5A5",marginBottom:14},errorText:{flex:1,color:C.red,fontWeight:"800"},successBox:{flexDirection:"row",gap:9,alignItems:"center",padding:13,borderRadius:15,backgroundColor:C.greenBg,borderWidth:1,borderColor:"#A7F3D0",marginBottom:14},successText:{flex:1,color:C.green,fontWeight:"800"},
  tabs:{flexDirection:"row",flexWrap:"wrap",gap:8,marginBottom:18},tab:{minHeight:42,paddingHorizontal:14,borderRadius:14,borderWidth:1,borderColor:C.gold,backgroundColor:C.card,alignItems:"center",justifyContent:"center"},tabOn:{backgroundColor:C.navy,borderColor:C.navy},tabText:{fontSize:13,fontWeight:"900",color:C.navy},tabTextOn:{color:"#FFF"},
  tools:{flexDirection:"row",gap:10,marginBottom:14},toolsMobile:{flexDirection:"column"},searchBox:{flex:1,minHeight:48,borderRadius:15,borderWidth:1,borderColor:C.border,backgroundColor:C.card,flexDirection:"row",alignItems:"center",gap:8,paddingHorizontal:13},searchInput:{flex:1,minWidth:0,color:C.text,fontSize:14,outlineStyle:"none" as any},noteInput:{flex:1,minHeight:48,borderRadius:15,borderWidth:1,borderColor:C.border,backgroundColor:C.card,paddingHorizontal:13,color:C.text,fontSize:14,outlineStyle:"none" as any},
  metricGrid:{flexDirection:"row",flexWrap:"wrap",gap:12,marginBottom:14},metric:{flexGrow:1,flexBasis:180,minWidth:160,backgroundColor:C.card,borderRadius:22,borderWidth:1,borderColor:C.gold,padding:18},metricIcon:{width:38,height:38,borderRadius:13,backgroundColor:C.blueBg,alignItems:"center",justifyContent:"center",marginBottom:10},metricValue:{fontSize:34,fontWeight:"900",color:C.navy},metricLabel:{fontSize:15,fontWeight:"900",color:C.text,marginTop:2},metricHint:{fontSize:12,lineHeight:17,color:C.muted,marginTop:4},
  twoCol:{flexDirection:"row",gap:14},oneCol:{flexDirection:"column"},alignStart:{alignItems:"flex-start"},panel:{flex:1,minWidth:0,backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:24,padding:18,marginBottom:14},panelTitle:{fontSize:21,fontWeight:"900",color:C.navy},panelSub:{fontSize:13,lineHeight:19,color:C.muted,marginTop:5},panelBody:{marginTop:15},
  barRow:{flexDirection:"row",alignItems:"center",gap:8,marginBottom:9},barLabel:{width:50,fontSize:11,fontWeight:"800",color:C.muted},barTrack:{flex:1,height:9,borderRadius:99,backgroundColor:"#E9EEF5",overflow:"hidden"},barFill:{height:"100%",backgroundColor:C.navy,borderRadius:99},barValue:{width:30,textAlign:"right",fontSize:12,fontWeight:"900",color:C.navy},rankRow:{flexDirection:"row",alignItems:"center",gap:10,paddingVertical:10,borderBottomWidth:1,borderBottomColor:"#EEF2F6"},rankName:{flex:1,color:C.text,fontWeight:"800"},rankTitle:{fontSize:14,fontWeight:"900",color:C.text},rankValue:{minWidth:32,textAlign:"right",fontSize:17,fontWeight:"900",color:C.navy},starValue:{fontSize:17,fontWeight:"900",color:C.rust},
  queueGrid:{flexDirection:"row",flexWrap:"wrap",gap:10},queue:{flexGrow:1,flexBasis:170,minWidth:140,backgroundColor:C.rustBg,borderRadius:17,padding:14},queueValue:{fontSize:25,fontWeight:"900",color:C.rust},queueLabel:{fontSize:12,fontWeight:"900",color:C.rust,marginTop:2},
  adminCard:{borderWidth:1,borderColor:C.border,borderRadius:19,padding:15,marginBottom:11,backgroundColor:"#FFFEFC"},rowHead:{flexDirection:"row",alignItems:"flex-start",gap:10},rowHeadCopy:{flex:1,minWidth:0},cardTitle:{fontSize:16,fontWeight:"900",color:C.navy},cardMeta:{fontSize:12,lineHeight:18,color:C.muted,marginTop:3},badge:{paddingHorizontal:9,paddingVertical:5,borderRadius:99,backgroundColor:C.rustBg},badgeGood:{backgroundColor:C.greenBg},badgeBad:{backgroundColor:C.redBg},badgeText:{fontSize:10,fontWeight:"900",color:C.rust,textTransform:"uppercase"},badgeTextGood:{color:C.green},badgeTextBad:{color:C.red},message:{fontSize:14,lineHeight:21,color:C.text,marginTop:12,padding:12,borderRadius:13,backgroundColor:"#F8FAFC"},
  detailGrid:{flexDirection:"row",flexWrap:"wrap",gap:8,marginTop:12},detail:{minWidth:130,flexGrow:1,flexBasis:180,padding:10,borderRadius:12,backgroundColor:"#F8FAFC"},detailLabel:{fontSize:10,fontWeight:"900",color:C.muted,textTransform:"uppercase",letterSpacing:.4},detailValue:{fontSize:13,lineHeight:18,fontWeight:"700",color:C.text,marginTop:3},actions:{flexDirection:"row",flexWrap:"wrap",gap:7,marginTop:13},action:{minHeight:39,paddingHorizontal:11,borderRadius:12,borderWidth:1,borderColor:C.gold,backgroundColor:C.card,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:5},actionGood:{backgroundColor:C.greenBg,borderColor:"#A7F3D0"},actionDanger:{backgroundColor:C.redBg,borderColor:"#FECACA"},actionText:{fontSize:12,fontWeight:"900",color:C.navy},actionGoodText:{color:C.green},actionDangerText:{color:C.red},dim:{opacity:.5},
  systemRow:{flexDirection:"row",alignItems:"center",gap:10,paddingVertical:10,borderBottomWidth:1,borderBottomColor:"#EEF2F6"},systemIcon:{width:36,height:36,borderRadius:12,backgroundColor:C.blueBg,alignItems:"center",justifyContent:"center"},systemCopy:{flex:1,minWidth:0},privacyBox:{flexDirection:"row",alignItems:"flex-start",gap:12,backgroundColor:C.greenBg,borderWidth:1,borderColor:"#A7F3D0",borderRadius:20,padding:16},privacyCopy:{flex:1},privacyTitle:{fontSize:16,fontWeight:"900",color:C.green},privacyText:{fontSize:13,lineHeight:20,fontWeight:"700",color:C.green,marginTop:4},
  empty:{alignItems:"center",justifyContent:"center",paddingVertical:28,gap:8},emptyText:{textAlign:"center",color:C.muted,fontWeight:"700"},footer:{textAlign:"center",color:C.muted,fontSize:11,marginTop:8},
  center:{flex:1,minHeight:"100%",backgroundColor:C.background,alignItems:"center",justifyContent:"center",padding:24},centerTitle:{fontSize:27,fontWeight:"900",color:C.navy,marginTop:12,textAlign:"center"},centerText:{fontSize:14,lineHeight:21,color:C.muted,marginTop:7,textAlign:"center",maxWidth:480},centerButton:{marginTop:18,minHeight:48,paddingHorizontal:24,borderRadius:15,backgroundColor:C.navy,alignItems:"center",justifyContent:"center"},centerButtonText:{color:"#FFF",fontWeight:"900"},
});
