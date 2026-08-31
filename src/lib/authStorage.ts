import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

/**
 * Storage for the Supabase session.
 *
 * The client previously ran with persistSession false, so a session lived
 * only in memory: on native every cold start logged the user out, and the
 * screen after login already read null. Sessions now persist by default,
 * which is what people expect.
 *
 * "Keep me signed in" is a real choice rather than a no-op: when it is off
 * the session is held in memory only, so closing the app ends it. The
 * preference itself is always stored on the device, because it has to be
 * known before the session is read at boot.
 */

const PREF_KEY = "fx.keepSignedIn";

const memory = new Map<string, string>();

function webStorage() {
  try {
    return typeof globalThis !== "undefined" ? globalThis.localStorage ?? null : null;
  } catch {
    // Private mode and blocked-cookie settings throw on access, not on use.
    return null;
  }
}

const device = {
  async getItem(key: string) {
    if (Platform.OS === "web") {
      const store = webStorage();
      try { return store ? store.getItem(key) : null; } catch { return null; }
    }
    try { return await AsyncStorage.getItem(key); } catch { return null; }
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === "web") {
      const store = webStorage();
      try { store?.setItem(key, value); } catch {}
      return;
    }
    try { await AsyncStorage.setItem(key, value); } catch {}
  },
  async removeItem(key: string) {
    if (Platform.OS === "web") {
      const store = webStorage();
      try { store?.removeItem(key); } catch {}
      return;
    }
    try { await AsyncStorage.removeItem(key); } catch {}
  },
};

let keepSignedIn: boolean | null = null;
let loading: Promise<boolean> | null = null;

async function resolvePreference(): Promise<boolean> {
  if (keepSignedIn !== null) return keepSignedIn;
  if (!loading) {
    loading = device.getItem(PREF_KEY).then((raw) => {
      keepSignedIn = raw === null ? true : raw === "1";
      return keepSignedIn;
    });
  }
  return loading;
}

/** Called from the login screen before signing in. */
export async function setKeepSignedIn(value: boolean) {
  keepSignedIn = value;
  loading = Promise.resolve(value);
  await device.setItem(PREF_KEY, value ? "1" : "0");

  if (!value) {
    // Anything already written under the previous preference has to go,
    // or the next cold start would restore a session the user just opted out of.
    for (const key of memory.keys()) await device.removeItem(key);
  }
}

export async function getKeepSignedIn() {
  return resolvePreference();
}

export const authStorage = {
  async getItem(key: string) {
    return (await resolvePreference()) ? device.getItem(key) : memory.get(key) ?? null;
  },
  async setItem(key: string, value: string) {
    memory.set(key, value);
    if (await resolvePreference()) await device.setItem(key, value);
  },
  async removeItem(key: string) {
    memory.delete(key);
    if (await resolvePreference()) await device.removeItem(key);
  },
};
