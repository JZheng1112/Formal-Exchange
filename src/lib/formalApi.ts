import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as ImageManipulator from "expo-image-manipulator";
import { Platform } from "react-native";
import { authStorage } from "./authStorage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL");
}

if (!supabaseAnonKey) {
  throw new Error("Missing EXPO_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // The previous adapter only ever reached globalThis.localStorage, which
    // does not exist on React Native, so every read and write was swallowed
    // by its own try/catch. persistSession was already true, but there was
    // nowhere to persist to: the screen after login read null and the app
    // showed "Log in required". authStorage uses AsyncStorage on device and
    // localStorage on web, and honours the keep-signed-in preference.
    storage: authStorage,
    persistSession: true,
    autoRefreshToken: true,
    // Only a browser ever sees the token fragment on a confirmation or
    // password-reset link.
    detectSessionInUrl: Platform.OS === "web",
  },
});

export type University = "Oxford" | "Cambridge";

export type College = {
  id: string;
  name: string;
  university: University;
  institution_type: "college" | "pph";
  website_url: string | null;
  crest_url: string | null;
  active?: boolean;
};

export type FormalType =
  | "Hall Formal"
  | "MCR Guest Dinner"
  | "Guest Night"
  | "Special Formal";

export type ListingCategory = "formal" | "coach_train" | "event";

export type DressCode = "Smart" | "Smart Casual" | "Casual";

export type PaymentMethod =
  | "Pay via platform"
  | "Direct bank transfer"
  | "Private contact";

export type ContactMethod = {
  type:
    | "WeChat"
    | "WhatsApp"
    | "Email"
    | "Instagram"
    | "Telegram"
    | "Phone"
    | "Other";
  value: string;
};

export type PriceReference = {
  id: string;
  formal_type: FormalType;
  student_price_gbp: number | null;
  guest_price_gbp: number | null;
  discounted_guest_price_gbp: number | null;
  other_guest_price_gbp: number | null;
  price_notes: string | null;
  source_url: string | null;
  source_status: string;
};

export type TicketListing = {
  id: string;
  college_id: string;
  seller_user_id?: string | null;
  seller_contact_email: string | null;
  formal_type: FormalType;
  dress_code: DressCode;
  formal_date: string;
  formal_time: string;
  includes_guest: boolean;
  student_seats: number;
  guest_seats: number;
  allow_separate_sale: boolean;
  student_listing_price_gbp: number;
  guest_listing_price_gbp: number | null;
  reference_student_price_gbp: number | null;
  reference_guest_price_gbp: number | null;
  student_price_warning: boolean;
  guest_price_warning: boolean;
  needs_host_escort: boolean;
  notes: string | null;
  notes_en?: string | null;
  notes_zh?: string | null;
  hall_photo_url: string | null;
  private_contacts?: ContactMethod[];
  delivery_image_url?: string | null;
  delivery_instructions?: string | null;
  delivery_released_after_payment?: boolean;
  payment_method: PaymentMethod;
  transfer_account: string | null;
  transfer_reference: string | null;
  private_contact_type: string | null;
  private_contact_value: string | null;
  status: string;
  transaction_mode?: "private" | "protected";
  can_split?: boolean;
  remaining_student_seats?: number | null;
  remaining_guest_seats?: number | null;
  created_at: string;
  colleges: College;
  listing_category?: ListingCategory;
  content_language?: "en" | "zh";
  ticket_type?: string | null;
  campus?: University | null;
  origin_name?: string | null;
  destination_name?: string | null;
  arrival_time?: string | null;
  duration_minutes?: number | null;
  operator_name?: string | null;
  service_number?: string | null;
  venue_name?: string | null;
  ticket_quantity?: number | null;
  face_value_gbp?: number | null;
  asking_price_gbp?: number | null;
  transfer_deadline?: string | null;
  image_urls?: string[];
  arrival_date?: string | null;
  event_name?: string | null;
  event_name_en?: string | null;
  event_name_zh?: string | null;
  event_description?: string | null;
  event_description_en?: string | null;
  event_description_zh?: string | null;
  event_kind?: "admission" | "airport_ride_share" | null;
  entry_requirements?: string | null;
  id_requirement?: string | null;
  guest_name_required?: boolean;
  guest_name_deadline?: string | null;
  transfer_confirmed?: boolean;
  college_rules?: string | null;
  transfer_type?: string | null;
  underoccupancy_policy?: string | null;
  guest_underoccupancy_prices?: Record<string, string | number> | null;
  vegan_available?: boolean;
  vegetarian_available?: boolean;
  halal_available?: boolean;
  gluten_free_available?: boolean;
  dietary_note?: string | null;
  dietary_note_en?: string | null;
  dietary_note_zh?: string | null;
  allow_outside_college?: boolean;
  allow_outside_oxbridge?: boolean;
  preferred_contact_method?: string | null;
  seller_rating_at_listing?: number | null;
  open_to_swap?: boolean;
};

export async function loadMyCollegeVisits() {
  await supabase.rpc("sync_my_completed_college_visits");
  const { data, error } = await supabase.from("buyer_college_visits").select("college_id,visited_at,source");
  if (error) throw error;
  return data ?? [];
}

export async function setCollegeVisited(collegeId: string, visited: boolean) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please log in first.");
  if (!visited) {
    const { error } = await supabase.from("buyer_college_visits").delete().eq("user_id",user.id).eq("college_id",collegeId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("buyer_college_visits").upsert({user_id:user.id,college_id:collegeId,visited_at:new Date().toISOString().slice(0,10),source:"manual"},{onConflict:"user_id,college_id"});
  if (error) throw error;
}

export type CollegeRating = {
  id: string;
  college_id: string;
  user_id: string;
  score: number | null;
  food_score: number | null;
  hall_score: number | null;
  atmosphere_score: number | null;
  hospitality_score: number | null;
  value_score: number | null;
  comment: string | null;
  comment_language?: "en" | "zh";
  comment_en?: string | null;
  comment_zh?: string | null;
  created_at: string;
  updated_at: string;
};

export async function loadCollegeRatings(collegeId?: string) {
  let query = supabase
    .from("college_ratings")
    .select("id,college_id,user_id,score,food_score,hall_score,atmosphere_score,hospitality_score,value_score,comment,comment_language,comment_en,comment_zh,created_at,updated_at")
    .order("updated_at", { ascending: false });
  if (collegeId) query = query.eq("college_id", collegeId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CollegeRating[];
}

export async function saveCollegeReview(collegeId: string, scores: {
  food: number;
  hall: number;
  atmosphere: number;
  hospitality: number;
  value: number;
}, comment = "", commentLanguage: "en"|"zh" = "en", translatedComment = "") {
  const { error } = await supabase.rpc("save_college_review", {
    p_college_id: collegeId,
    p_food_score: scores.food,
    p_hall_score: scores.hall,
    p_atmosphere_score: scores.atmosphere,
    p_hospitality_score: scores.hospitality,
    p_value_score: scores.value,
    p_comment: comment,
    p_comment_language: commentLanguage,
    p_comment_en: commentLanguage === "en" ? comment : translatedComment,
    p_comment_zh: commentLanguage === "zh" ? comment : translatedComment,
  });
  if (error) throw error;
}

export async function deleteMyCollegeRating(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please log in first.");
  const { error } = await supabase.from("college_ratings").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
}

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  university: University | null;
  college_id: string | null;
  role: "user" | "admin";
  can_list_ticket: boolean;
  is_verified: boolean;
  verified_at: string | null;
  verification_email: string | null;
  contact_email: string | null;
  avatar_url: string | null;
  overpricing_student_flags: number;
  overpricing_guest_flags: number;
  account_status?: "active" | "suspended";
  suspension_reason?: string | null;
  suspended_at?: string | null;
  created_at: string;
  updated_at: string;
  colleges?: College | null;
};

export type PublicFeedbackComment = {
  id: string;
  name: string;
  category: string;
  message: string;
  created_at: string;
};

export type ListingReport = {
  id: string;
  listing_id: string | null;
  reporter_user_id: string | null;
  reporter_email: string | null;
  report_type:
    | "Price issue"
    | "Student/member price issue"
    | "Guest price issue"
    | "Seller contact issue"
    | "Payment issue"
    | "Private transaction issue"
    | "Other";
  reported_student_price_gbp: number | null;
  reported_guest_price_gbp: number | null;
  message: string | null;
  status: string;
  created_at: string;
};

export function isOxbridgeEmail(email: string) {
  const domain = email.trim().toLowerCase().split("@")[1] ?? "";
  return (
    domain === "ox.ac.uk" ||
    domain.endsWith(".ox.ac.uk") ||
    domain === "cam.ac.uk" ||
    domain.endsWith(".cam.ac.uk")
  );
}

export function isAcUkEmail(email: string) {
  const domain = email.trim().toLowerCase().split("@")[1] ?? "";
  return domain === "ac.uk" || domain.endsWith(".ac.uk");
}

export function inferUniversityFromEmail(email: string): University | null {
  const domain = email.trim().toLowerCase().split("@")[1] ?? "";
  if (domain === "ox.ac.uk" || domain.endsWith(".ox.ac.uk")) return "Oxford";
  if (domain === "cam.ac.uk" || domain.endsWith(".cam.ac.uk")) return "Cambridge";
  return null;
}

export function getAuthRedirectUrl(path = "/verify-success") {
  try {
    if (typeof globalThis !== "undefined" && "location" in globalThis) {
      return `${globalThis.location.origin}${path}`;
    }
  } catch {}
  return `http://localhost:8081${path}`;
}

export function passwordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score, label: "Weak", advice: "Use at least 8 characters with mixed character types." };
  if (score <= 3) return { score, label: "Medium", advice: "Add length, numbers, and symbols for a stronger password." };
  return { score, label: "Strong", advice: "Good password strength." };
}

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }

  const { data, error } = await supabase.auth.signUp({
    email: trimmed,
    password,
    options: {
      emailRedirectTo: getAuthRedirectUrl("/verify-success"),
      data: {
        full_name: fullName.trim(),
        university: inferUniversityFromEmail(email),
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function resendVerificationEmail(email: string) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }

  const { data, error } = await supabase.auth.resend({
    type: "signup",
    email: trimmed,
    options: {
      emailRedirectTo: getAuthRedirectUrl("/verify-success"),
    },
  });

  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: trimmed,
    password,
  });

  if (error) throw error;
  return data;
}

export async function resetPasswordForEmail(email: string) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }
  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo: getAuthRedirectUrl("/login"),
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
}

export async function loadMyProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
      *,
      colleges (
        id,
        name,
        university,
        institution_type,
        website_url,
        crest_url
      )
    `
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export type SellerInfo = { full_name: string | null; is_verified: boolean; avatar_url: string | null; university: University | null };

export async function loadPublicProfile(userId: string): Promise<SellerInfo | null> {
  const { data, error } = await supabase.rpc("get_seller_profile", { p_user_id: userId });
  if (error || !data?.length) return null;
  return data[0] as SellerInfo;
}

export async function loadSellerProfiles(userIds: string[]): Promise<Record<string, SellerInfo>> {
  if (!userIds.length) return {};
  const { data, error } = await supabase.rpc("get_seller_profiles", { p_user_ids: userIds });
  if (error || !data) return {};
  const map: Record<string, SellerInfo> = {};
  for (const row of data as any[]) map[row.id] = row;
  return map;
}

export async function updateMyProfile(payload: {
  full_name?: string | null;
  college_id?: string | null;
  contact_email?: string | null;
  avatar_url?: string | null;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please log in first.");

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function uploadAvatar(uri: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Please log in before uploading a photo.");
  const response = await fetch(await downscale(uri, 512, 0.85));
  if (!response.ok) throw new Error("The selected photo could not be read.");
  const blob = await response.blob();
  const contentType = blob.type || "image/jpeg";
  const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const path = `${user.id}/avatar-${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from("avatars").upload(path, await blob.arrayBuffer(), {
    contentType,
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Step 1 of academic-email verification: ask the backend to mail a
 * one-time code to the address being claimed. The code is never returned
 * here — receiving it in that inbox is the proof of ownership.
 */
export async function sendVerificationCode(email: string) {
  const { data, error } = await supabase.functions.invoke("send-verification-code", {
    body: { email: email.trim().toLowerCase() },
  });
  if (error) {
    // Edge function errors carry the useful message in the response body.
    const detail = await readFunctionError(error);
    throw new Error(detail ?? error.message);
  }
  if (data?.error) throw new Error(data.error);
}

/** Step 2: redeem the code. Grants the badge, and Formal rights for Oxbridge. */
export async function confirmVerificationCode(email: string, code: string) {
  const { error } = await supabase.rpc("confirm_email_verification", {
    p_email: email.trim().toLowerCase(),
    p_code: code.trim(),
  });
  if (error) throw error;
}

async function readFunctionError(error: unknown): Promise<string | null> {
  const response = (error as { context?: Response })?.context;
  if (!response || typeof response.json !== "function") return null;
  try {
    const body = await response.json();
    return typeof body?.error === "string" ? body.error : null;
  } catch {
    return null;
  }
}


export async function deleteMyAccount() {
  const { error } = await supabase.functions.invoke("delete-account", {
    body: { confirm: true },
  });

  if (error) throw error;
  await signOut();
}

export async function loadColleges() {
  const { data, error } = await supabase
    .from("colleges")
    .select("id, name, university, institution_type, website_url, crest_url, active")
    .order("university", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  return ((data ?? []).filter((college: any) => college.active === true)) as College[];
}

export async function loadPriceReference(collegeId: string, formalType: FormalType) {
  const { data, error } = await supabase
    .from("formal_price_reference")
    .select(
      "id, formal_type, student_price_gbp, guest_price_gbp, discounted_guest_price_gbp, other_guest_price_gbp, price_notes, source_url, source_status"
    )
    .eq("college_id", collegeId)
    .eq("formal_type", formalType)
    .in("source_status", ["official_public", "admin_verified"])
    .order("source_checked_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as PriceReference | null;
}

export async function loadPeerPriceStats(collegeId: string, formalType: FormalType) {
  const { data, error } = await supabase
    .from("ticket_listings")
    .select("student_listing_price_gbp, guest_listing_price_gbp, includes_guest")
    .eq("college_id", collegeId)
    .eq("formal_type", formalType)
    .eq("status", "active")
    .limit(100);

  if (error) throw error;

  const studentPrices = (data ?? [])
    .map((row: any) => Number(row.student_listing_price_gbp))
    .filter((value: number) => Number.isFinite(value) && value > 0);

  const guestPrices = (data ?? [])
    .map((row: any) => row.guest_listing_price_gbp === null ? null : Number(row.guest_listing_price_gbp))
    .filter((value: number | null) => value !== null && Number.isFinite(value) && value > 0) as number[];

  return {
    studentMedian: median(studentPrices),
    guestMedian: median(guestPrices),
    studentCount: studentPrices.length,
    guestCount: guestPrices.length,
  };
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[middle];
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

export async function loadActiveListings() {
  const { data, error } = await supabase
    .from("ticket_listings")
    .select(
      `
      id,
      college_id,
      seller_user_id,
      seller_contact_email,
      formal_type,
      dress_code,
      formal_date,
      formal_time,
      includes_guest,
      student_seats,
      guest_seats,
      allow_separate_sale,
      student_listing_price_gbp,
      guest_listing_price_gbp,
      reference_student_price_gbp,
      reference_guest_price_gbp,
      student_price_warning,
      guest_price_warning,
      needs_host_escort,
      notes,
      hall_photo_url,
      payment_method,
      transfer_account,
      transfer_reference,
      private_contact_type,
      private_contact_value,
      private_contacts,
      listing_category,
      content_language,
      ticket_type,
      campus,
      origin_name,
      destination_name,
      arrival_time,
      duration_minutes,
      operator_name,
      service_number,
      venue_name,
      ticket_quantity,
      face_value_gbp,
      asking_price_gbp,
      transfer_deadline,
      image_urls,
      arrival_date,
      event_name,
      event_name_en,
      event_description,
      event_description_en,
      event_kind,
      entry_requirements,
      id_requirement,
      guest_name_required,
      guest_name_deadline,
      transfer_confirmed,
      college_rules,
      transfer_type,
      underoccupancy_policy,
      guest_underoccupancy_prices,
      vegan_available,
      vegetarian_available,
      halal_available,
      gluten_free_available,
      dietary_note,
      dietary_note_en,
      allow_outside_college,
      allow_outside_oxbridge,
      preferred_contact_method,
      open_to_swap,
      status,
      created_at,
      colleges (
        id,
        name,
        university,
        institution_type,
        website_url,
        crest_url
      )
    `
    )
    .eq("status", "active")
    .order("formal_date", { ascending: true })
    .order("formal_time", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as TicketListing[];
}

export async function loadVisibleActiveListings(){
  const [listings,profile]=await Promise.all([loadActiveListings(),loadMyProfile()]);
  return listings.filter((listing)=>{
    if((listing.listing_category??"formal")!=="formal") return true;
    if(profile?.college_id&&profile.college_id===listing.college_id) return true;
    const isOxbridge=profile?.university==="Oxford"||profile?.university==="Cambridge";
    return isOxbridge?Boolean(listing.allow_outside_college):Boolean(listing.allow_outside_oxbridge);
  });
}

export async function loadVisibleListingById(id:string){
  const listings=await loadVisibleActiveListings();
  return listings.find((listing)=>listing.id===id)??null;
}

export async function createTicketListing(payload: Record<string, unknown>) {
  const user = await getCurrentUser();

  if (!user?.id || !user.email) {
    throw new Error("Please log in with your verified .ac.uk email before listing. Formal tickets require an Oxford or Cambridge account.");
  }

  const { data, error } = await supabase
    .from("ticket_listings")
    .insert({
      ...payload,
      seller_user_id: user.id,
      seller_contact_email: user.email,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function uploadPrivateTicketDocument(file: Blob, originalName: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Please log in before uploading ticket documents.");
  const safeName = originalName.replace(/[^A-Za-z0-9._-]/g, "-");
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
  const { error } = await supabase.storage.from("ticket-documents").upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function createProtectedTicketAssets(
  listingId: string,
  assets: Array<{ storage_path: string; original_name: string; ticket_kind: "student" | "guest" | "booking_confirmation" }>
) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Please log in first.");
  const { error } = await supabase.from("ticket_assets").insert(
    assets.map((asset) => ({ ...asset, listing_id: listingId, seller_user_id: user.id }))
  );
  if (error) throw error;
}

export async function submitCollegeSplitPolicyReport(payload: {
  college_id: string;
  listing_id: string;
  reported_value: "allowed" | "not_allowed" | "unknown";
  evidence?: string | null;
}) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Please log in first.");
  const { error } = await supabase.from("college_policy_reports").insert({
    ...payload,
    reporter_user_id: user.id,
    policy_type: "split_sales",
  });
  if (error) throw error;
}

export async function createPriceReport(payload: Record<string, unknown>) {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("price_reports")
    .insert({
      ...payload,
      reporter_user_id: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function submitListingReport(payload: {
  listing_id?: string | null;
  reporter_email?: string;
  report_type:
    | "Price issue"
    | "Student/member price issue"
    | "Guest price issue"
    | "Seller contact issue"
    | "Payment issue"
    | "Private transaction issue"
    | "Other";
  reported_student_price_gbp?: number | null;
  reported_guest_price_gbp?: number | null;
  message?: string;
}) {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("listing_reports")
    .insert({
      listing_id: payload.listing_id ?? null,
      reporter_user_id: user?.id ?? null,
      reporter_email: payload.reporter_email?.trim() || user?.email || null,
      report_type: payload.report_type,
      reported_student_price_gbp: payload.reported_student_price_gbp ?? null,
      reported_guest_price_gbp: payload.reported_guest_price_gbp ?? null,
      message: payload.message?.trim() || null,
      status: "new",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function submitFeedback(payload: {
  name?: string;
  email?: string;
  category: string;
  message: string;
  page?: string;
  is_public?: boolean;
}) {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("feedbacks")
    .insert({
      user_id: user?.id ?? null,
      name: payload.name?.trim() || null,
      email: payload.email?.trim() || user?.email || null,
      category: payload.category,
      message: payload.message.trim(),
      page: payload.page ?? "support",
      is_public: payload.is_public ?? true,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function loadPublicFeedbackComments() {
  const { data, error } = await supabase
    .from("public_feedback_comments")
    .select("id, name, category, message, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw error;
  return (data ?? []) as PublicFeedbackComment[];
}

export async function uploadListingImage(uri: string) {
  return uploadImageToBucket(uri, "listing-images", "public");
}

/**
 * Photos came straight off the camera roll at full resolution — a recent
 * iPhone shot is around 4200x5700 and several megabytes — and were uploaded
 * untouched, so listing cards were fetching multi-megabyte originals to fill a
 * 260px thumbnail. Seeded listings looked fast only because their images were
 * already small.
 *
 * Downscaling to 1600px on the long edge keeps a listing photo sharp on any
 * phone while cutting a typical upload by well over an order of magnitude.
 * Failure is not fatal: a photo that cannot be processed is uploaded as-is.
 */
async function downscale(uri: string, maxEdge = 1600, compress = 0.8) {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxEdge } }],
      { compress, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch {
    return uri;
  }
}

async function uploadImageToBucket(uri: string, bucket: string, folder: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Please log in before uploading photos.");
  const response = await fetch(await downscale(uri));
  if (!response.ok) throw new Error("The selected photo could not be read. Please choose it again.");
  const blob = await response.blob();

  const contentType = blob.type || (uri.toLowerCase().includes(".png") ? "image/png" : "image/jpeg");
  const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const path = `${folder}/${user.id}/${fileName}`;
  const body = await blob.arrayBuffer();

  const { error } = await supabase.storage.from(bucket).upload(path, body, {
    contentType,
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function isMoreThanTenPercentAbove(
  listingPrice: number | null,
  referencePrice: number | null
) {
  if (listingPrice === null || referencePrice === null) return false;
  return listingPrice > referencePrice * 1.1;
}

export function toPositiveNumber(value: string) {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) return null;
  return parsed;
}

export async function loadMyListings() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Please log in to manage your listings.");
  const { data, error } = await supabase
    .from("ticket_listings")
    .select(`*, colleges (id,name,university,institution_type,website_url,crest_url)`)
    .eq("seller_user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as TicketListing[];
}

export async function markListingSold(listingId: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Please log in first.");
  const { data, error } = await supabase.from("ticket_listings")
    .update({ status: "sold", updated_at: new Date().toISOString() })
    .eq("id", listingId).eq("seller_user_id", user.id).select("id").single();
  if (error) throw error;
  return data;
}

export async function removeMyListing(listingId: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Please log in first.");
  const { data, error } = await supabase.from("ticket_listings")
    .update({ status: "removed", updated_at: new Date().toISOString() })
    .eq("id", listingId).eq("seller_user_id", user.id).select("id").single();
  if (error) throw error;
  return data;
}

export async function completePrivateListingSale(listingId: string, studentSold=0, guestSold=0) {
  const { data, error } = await supabase.rpc("complete_private_listing_sale", {p_listing_id:listingId,p_student_sold:studentSold,p_guest_sold:guestSold});
  if (error) throw error;
  return data;
}

export async function withdrawMyListingSafely(listingId: string) {
  const { error } = await supabase.rpc("withdraw_my_listing", {p_listing_id:listingId});
  if (error) throw error;
}

export type BuyerPost = {id:string;buyer_user_id:string;buyer_email:string;category:ListingCategory;ticket_type:string;university:string|null;college_id:string|null;wanted_date:string|null;origin_name:string|null;destination_name:string|null;budget_gbp:number|null;quantity:number;content_language?:"en"|"zh";notes:string|null;notes_en?:string|null;notes_zh?:string|null;preferred_contact_method:string;contact_value:string|null;status:string;created_at:string;colleges?:College|null};

export async function loadBuyerPosts(){const {data,error}=await supabase.from("buyer_posts").select("*, colleges(id,name,university,institution_type,website_url,crest_url)").eq("status","active").gt("expires_at",new Date().toISOString()).order("created_at",{ascending:false});if(error)throw error;return (data??[]) as unknown as BuyerPost[];}
export async function createBuyerPost(payload:Record<string,unknown>){const user=await getCurrentUser();if(!user?.id||!user.email)throw new Error("Please log in first.");const {data,error}=await supabase.from("buyer_posts").insert({...payload,buyer_user_id:user.id,buyer_email:user.email}).select("id").single();if(error)throw error;return data;}

export async function translateContent(value: string, source: "en" | "zh", target: "en" | "zh") {
  const text = value.trim();
  if (!text || source === target) return text;
  const { data, error } = await supabase.functions.invoke("translate-content", {
    body: { text, source, target },
  });
  if (error) throw new Error(error.message || "Automatic translation is unavailable.");
  if (data?.error) throw new Error(data.error);
  const translated = String(data?.translatedText ?? "").trim();
  if (!translated) throw new Error("Automatic translation returned no text.");
  return translated;
}
export async function withdrawBuyerPost(id:string){const user=await getCurrentUser();if(!user)throw new Error("Please log in first.");const {error}=await supabase.from("buyer_posts").update({status:"withdrawn"}).eq("id",id).eq("buyer_user_id",user.id);if(error)throw error;}
export async function recordPageView(path:string){const user=await getCurrentUser();await supabase.from("page_views").insert({path,user_id:user?.id??null});}
export type AdminSnapshot = {
  generated_at: string;
  counts: Record<string, number>;
  daily_views: Record<string, any>[];
  path_views: Record<string, any>[];
  profiles: Record<string, any>[];
  listings: Record<string, any>[];
  buyer_posts: Record<string, any>[];
  listing_reports: Record<string, any>[];
  price_reports: Record<string, any>[];
  policy_reports: Record<string, any>[];
  feedback: Record<string, any>[];
  conversations: Record<string, any>[];
  ratings: Record<string, any>[];
  rating_summary: Record<string, any>[];
  visit_summary: Record<string, any>[];
  audit_log: Record<string, any>[];
};

export async function loadAdminDashboard() {
  const { data, error } = await supabase.rpc("admin_dashboard_snapshot");
  if (error) throw error;
  return data as AdminSnapshot;
}

export async function loadAdminStats() {
  const snapshot = await loadAdminDashboard();
  return {
    listings: snapshot.counts.listings ?? 0,
    requests: snapshot.counts.buyer_requests ?? 0,
    views: snapshot.counts.page_views ?? 0,
    profiles: snapshot.counts.profiles ?? 0,
  };
}

export async function adminSetListingStatus(id: string, status: "active" | "removed" | "sold", note = "") {
  const { error } = await supabase.rpc("admin_set_listing_status", { p_listing_id: id, p_status: status, p_note: note });
  if (error) throw error;
}

export async function adminSetBuyerPostStatus(id: string, status: "active" | "withdrawn" | "removed", note = "") {
  const { error } = await supabase.rpc("admin_set_buyer_post_status", { p_post_id: id, p_status: status, p_note: note });
  if (error) throw error;
}

export async function adminReviewItem(table: "listing_reports" | "price_reports" | "college_policy_reports" | "feedbacks", id: string, status: "new" | "reviewing" | "resolved" | "dismissed", note = "") {
  const { error } = await supabase.rpc("admin_review_item", { p_table: table, p_id: id, p_status: status, p_note: note });
  if (error) throw error;
}

export async function adminSetProfilePermissions(id: string, canListTicket: boolean, accountStatus: "active" | "suspended", reason = "") {
  const { error } = await supabase.rpc("admin_set_profile_permissions", { p_profile_id: id, p_can_list_ticket: canListTicket, p_account_status: accountStatus, p_reason: reason });
  if (error) throw error;
}

export async function adminSetProfileRole(id: string, role: "user" | "admin") {
  const { error } = await supabase.rpc("admin_set_profile_role", { p_profile_id: id, p_role: role });
  if (error) throw error;
}

export async function adminSetFeedbackVisibility(id: string, isPublic: boolean) {
  const { error } = await supabase.rpc("admin_set_feedback_visibility", { p_feedback_id: id, p_is_public: isPublic });
  if (error) throw error;
}

export async function adminDeleteCollegeRating(id: string) {
  const { error } = await supabase.rpc("admin_delete_college_rating", { p_rating_id: id });
  if (error) throw error;
}

export async function adminDeleteMarketplacePost(type: "ticket_listing" | "buyer_post", id: string) {
  const { error } = await supabase.rpc("admin_delete_marketplace_post", { p_post_type: type, p_post_id: id });
  if (error) throw error;
}

export type Conversation={id:string;listing_id:string|null;subject:string;buyer_user_id:string;buyer_email:string;seller_user_id:string|null;seller_email:string;is_demo:boolean;created_at:string;updated_at:string};
export type ChatMessage={id:string;conversation_id:string;sender_user_id:string;sender_email:string;body:string;image_path:string|null;image_mime_type:string|null;image_url?:string|null;read_at:string|null;created_at:string};
export async function openConversation(input:{listingId?:string|null;subject:string;sellerUserId?:string|null;sellerEmail:string;isDemo?:boolean}){const user=await getCurrentUser();if(!user?.id||!user.email)throw new Error("Please log in first.");let query=supabase.from("conversations").select("*").eq("buyer_user_id",user.id);query=input.listingId?query.eq("listing_id",input.listingId):query.is("listing_id",null).eq("subject",input.subject);const {data:existing,error:findError}=await query.limit(1).maybeSingle();if(findError)throw findError;if(existing)return existing as Conversation;const {data,error}=await supabase.from("conversations").insert({listing_id:input.listingId??null,subject:input.subject,buyer_user_id:user.id,buyer_email:user.email,seller_user_id:input.sellerUserId??null,seller_email:input.sellerEmail,is_demo:Boolean(input.isDemo)}).select("*").single();if(error)throw error;return data as Conversation;}
export async function loadMyConversations(){const {data,error}=await supabase.from("conversations").select("*").order("updated_at",{ascending:false});if(error)throw error;return (data??[]) as Conversation[];}

export type BlockedUser={id:string;blocked_id:string;reason:string|null;created_at:string;profiles?:{full_name:string|null;email:string|null}|null};

/**
 * Blocking is one-directional as an action but mutual in effect: once
 * either side blocks, neither can message the other and each disappears
 * from the other's listings and conversations. Enforcement lives in the
 * database, so an older client cannot route around it.
 */
export async function blockUser(blockedUserId:string,reason?:string){
  const {error}=await supabase.rpc("block_user",{p_blocked_id:blockedUserId,p_reason:reason??null});
  if(error)throw error;
}

export async function unblockUser(blockedUserId:string){
  const {error}=await supabase.rpc("unblock_user",{p_blocked_id:blockedUserId});
  if(error)throw error;
}

export async function loadBlockedUsers(){
  const {data,error}=await supabase.from("blocked_users").select("id,blocked_id,reason,created_at").order("created_at",{ascending:false});
  if(error)throw error;
  const rows=(data??[]) as BlockedUser[];
  if(!rows.length)return rows;
  const {data:people}=await supabase.from("profiles").select("id,full_name,email").in("id",rows.map(r=>r.blocked_id));
  const byId=new Map((people??[]).map((p:any)=>[p.id,p]));
  return rows.map(row=>({...row,profiles:byId.get(row.blocked_id)??null}));
}

/** The other participant in a conversation, or null for a demo thread. */
export function conversationCounterpartId(conversation:Conversation,myUserId:string){
  if(conversation.buyer_user_id===myUserId)return conversation.seller_user_id;
  if(conversation.seller_user_id===myUserId)return conversation.buyer_user_id;
  return null;
}
export async function loadConversationMessages(conversationId:string){const {data,error}=await supabase.from("messages").select("*").eq("conversation_id",conversationId).order("created_at",{ascending:true});if(error)throw error;const rows=(data??[]) as ChatMessage[];return Promise.all(rows.map(async message=>{if(!message.image_path)return message;const {data:signed,error:signedError}=await supabase.storage.from("message-images").createSignedUrl(message.image_path,86400);return {...message,image_url:signedError?null:signed.signedUrl};}));}
export async function markConversationRead(conversationId:string){const user=await getCurrentUser();if(!user?.id||!user.email)return;const {error}=await supabase.from("messages").update({read_at:new Date().toISOString()}).eq("conversation_id",conversationId).neq("sender_user_id",user.id).is("read_at",null);if(error)throw error;}
export async function sendConversationMessage(conversationId:string,body:string,imagePath?:string|null,imageMimeType?:string|null){const user=await getCurrentUser();if(!user?.id||!user.email)throw new Error("Please log in first.");const clean=body.trim();if(!clean&&!imagePath)throw new Error("Write a message or add a photo first.");const {error}=await supabase.from("messages").insert({conversation_id:conversationId,sender_user_id:user.id,sender_email:user.email,body:clean||"Photo",image_path:imagePath??null,image_mime_type:imageMimeType??null});if(error)throw error;await supabase.from("conversations").update({updated_at:new Date().toISOString()}).eq("id",conversationId);supabase.functions.invoke("notify-message",{body:{conversationId}}).catch(()=>{});}
export async function uploadMessageImage(uri:string,originalName:string){const user=await getCurrentUser();if(!user?.id)throw new Error("Please log in before attaching a photo.");const response=await fetch(uri);if(!response.ok)throw new Error("The selected photo could not be read.");const blob=await response.blob();const mimeType=blob.type||"image/jpeg";const extension=mimeType.includes("png")?"png":mimeType.includes("webp")?"webp":"jpg";const safeName=originalName.replace(/[^A-Za-z0-9._-]/g,"-").slice(-80);const path=`${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName||`photo.${extension}`}`;const {error}=await supabase.storage.from("message-images").upload(path,await blob.arrayBuffer(),{contentType:mimeType,upsert:false});if(error)throw error;return path;}
export async function uploadMessageFile(file:Blob,originalName:string){const user=await getCurrentUser();if(!user?.id)throw new Error("Please log in before attaching a file.");const mimeType=file.type||"application/octet-stream";const safeName=originalName.replace(/[^A-Za-z0-9._-]/g,"-").slice(-100)||"attachment";const path=`${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;const {error}=await supabase.storage.from("message-images").upload(path,await file.arrayBuffer(),{contentType:mimeType,upsert:false});if(error)throw error;return path;}
export async function savePushToken(token:string,platform:string){const user=await getCurrentUser();if(!user?.id)return;const {error}=await supabase.from("push_tokens").upsert({user_id:user.id,token,platform,updated_at:new Date().toISOString()},{onConflict:"user_id,token"});if(error)throw error;}
