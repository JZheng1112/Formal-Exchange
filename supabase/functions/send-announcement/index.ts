import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Sends an admin announcement as a push notification and records it.
//
// Only an admin may call this. The audience is resolved server-side so a
// caller cannot widen it, and Expo is given at most 100 messages per
// request, which is its documented batch limit.

const EXPO_PUSH = "https://exp.host/--/api/v2/push/send";
const BATCH = 100;

Deno.serve(async (request) => {
  try {
    const token = (request.headers.get("Authorization") ?? "").replace("Bearer ", "");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) return new Response("Unauthorized", { status: 401 });

    // is_admin() reads auth.uid(), which the service-role client does not
    // set, so check the caller's own row directly.
    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (!profile?.is_admin) return new Response("Forbidden", { status: 403 });

    const { title, body, audience = "all" } = await request.json();

    const clean = {
      title: String(title ?? "").trim(),
      body: String(body ?? "").trim(),
      audience: String(audience),
    };

    if (!clean.title || !clean.body) {
      return Response.json({ error: "A title and a message are both required." }, { status: 400 });
    }
    if (clean.title.length > 80 || clean.body.length > 400) {
      return Response.json({ error: "Title must be 80 characters or fewer, message 400 or fewer." }, { status: 400 });
    }
    if (!["all", "verified", "Oxford", "Cambridge", "Durham"].includes(clean.audience)) {
      return Response.json({ error: "Unknown audience." }, { status: 400 });
    }

    const { data: audienceRows, error: audienceError } =
      await admin.rpc("announcement_audience", { p_audience: clean.audience });
    if (audienceError) return Response.json({ error: audienceError.message }, { status: 500 });

    const userIds = (audienceRows ?? []).map((r: { user_id: string }) => r.user_id);

    let tokens: string[] = [];
    if (userIds.length) {
      const { data: tokenRows } = await admin
        .from("push_tokens")
        .select("token")
        .in("user_id", userIds);
      tokens = [...new Set((tokenRows ?? []).map((r: { token: string }) => r.token))];
    }

    let delivered = 0;
    for (let i = 0; i < tokens.length; i += BATCH) {
      const chunk = tokens.slice(i, i + BATCH).map((to) => ({
        to,
        sound: "default",
        title: clean.title,
        body: clean.body,
        data: { kind: "announcement" },
      }));

      const res = await fetch(EXPO_PUSH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chunk),
      });

      if (res.ok) {
        delivered += chunk.length;
      } else {
        console.error("EXPO PUSH FAILED", res.status, await res.text());
      }
    }

    // Recorded whatever happened to delivery, so the console shows a true
    // history rather than only the successful sends.
    const { data: saved, error: saveError } = await admin
      .from("announcements")
      .insert({
        title: clean.title,
        body: clean.body,
        audience: clean.audience,
        sent_by: authData.user.id,
        recipients: userIds.length,
        devices: delivered,
      })
      .select("id")
      .single();

    if (saveError) return Response.json({ error: saveError.message }, { status: 500 });

    return Response.json({
      id: saved.id,
      recipients: userIds.length,
      devices: delivered,
      tokensFound: tokens.length,
    });
  } catch (error) {
    console.error("SEND ANNOUNCEMENT ERROR", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
});
