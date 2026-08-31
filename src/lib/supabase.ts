import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
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
    // Sessions were previously not persisted and tokens were never
    // refreshed, so the screen rendered immediately after login already
    // read null and native cold starts always landed on "Log in required".
    storage: authStorage,
    persistSession: true,
    autoRefreshToken: true,
    // Password-reset and email-confirmation links carry their token in the
    // URL, which only a browser ever sees. Leaving this off meant the
    // recovery token was never consumed and reset links could not work.
    detectSessionInUrl: Platform.OS === "web",
  },
});
