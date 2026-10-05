import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const token = (request.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) return Response.json({ error: "Please log in before translating content." }, { status: 401, headers: cors });

    const body = await request.json();
    const source = body.source === "zh" ? "zh-CN" : "en";
    const target = body.target === "zh" ? "zh-CN" : "en";
    const value = String(body.text ?? "").trim();
    if (!value) return Response.json({ translatedText: "" }, { headers: cors });
    if (value.length > 2400) return Response.json({ error: "Text must be 2,400 characters or fewer." }, { status: 400, headers: cors });
    if (source === target) return Response.json({ translatedText: value }, { headers: cors });

    // The keyless Google endpoint often refuses requests from cloud servers,
    // so fall back to MyMemory before giving up.
    const errors: string[] = [];
    for (const provider of [google, myMemory]) {
      try {
        const translatedText = (await provider(value, source, target)).trim();
        if (translatedText) return Response.json({ translatedText }, { headers: cors });
        errors.push(`${provider.name}: empty result`);
      } catch (error) {
        errors.push(`${provider.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    console.error("TRANSLATION FAILED", errors.join("; "));
    throw new Error(errors.join("; "));
  } catch (error) {
    return Response.json({ error: `Automatic translation is temporarily unavailable: ${error instanceof Error ? error.message : String(error)}` }, { status: 502, headers: cors });
  }
});

async function google(value: string, source: string, target: string) {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", source);
  url.searchParams.set("tl", target);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", value);
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const result = await response.json();
  return Array.isArray(result?.[0]) ? result[0].map((part: unknown[]) => String(part?.[0] ?? "")).join("") : "";
}

// MyMemory caps a request at 500 bytes, so long text goes in sentence-sized pieces.
async function myMemory(value: string, source: string, target: string) {
  const pieces = value.match(/[^.!?。！？\n]+[.!?。！？\n]*/g) ?? [value];
  const out: string[] = [];
  for (const piece of pieces) {
    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", piece.slice(0, 450));
    url.searchParams.set("langpair", `${source}|${target}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    if (result?.responseStatus && Number(result.responseStatus) !== 200) throw new Error(String(result.responseDetails ?? result.responseStatus));
    out.push(String(result?.responseData?.translatedText ?? ""));
  }
  return out.join(target === "zh-CN" ? "" : " ");
}
