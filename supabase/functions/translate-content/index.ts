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

    const url = new URL("https://translate.googleapis.com/translate_a/single");
    url.searchParams.set("client", "gtx");
    url.searchParams.set("sl", source);
    url.searchParams.set("tl", target);
    url.searchParams.set("dt", "t");
    url.searchParams.set("q", value);
    const response = await fetch(url, { headers: { "User-Agent": "Formal Exchange translation service" } });
    if (!response.ok) throw new Error(`Translation provider returned ${response.status}`);
    const result = await response.json();
    const translatedText = Array.isArray(result?.[0]) ? result[0].map((part: unknown[]) => String(part?.[0] ?? "")).join("") : "";
    if (!translatedText.trim()) throw new Error("Translation provider returned an empty result");
    return Response.json({ translatedText }, { headers: cors });
  } catch (error) {
    return Response.json({ error: `Automatic translation is temporarily unavailable: ${error instanceof Error ? error.message : String(error)}` }, { status: 502, headers: cors });
  }
});
