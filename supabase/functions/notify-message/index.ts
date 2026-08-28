import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (request) => {
  try {
    const authHeader = request.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) return new Response("Unauthorized", { status: 401 });
    const { conversationId } = await request.json();
    const { data: conversation, error } = await admin.from("conversations").select("*").eq("id", conversationId).single();
    if (error || !conversation) return new Response("Conversation not found", { status: 404 });
    const sender = authData.user;
    const senderEmail = (sender.email ?? "").toLowerCase();
    const participant = conversation.buyer_user_id === sender.id || conversation.seller_user_id === sender.id || conversation.seller_email.toLowerCase() === senderEmail;
    if (!participant) return new Response("Forbidden", { status: 403 });
    let recipientId = conversation.buyer_user_id === sender.id ? conversation.seller_user_id : conversation.buyer_user_id;
    if (!recipientId && conversation.buyer_user_id === sender.id) {
      const { data: recipient } = await admin.from("profiles").select("id").ilike("email", conversation.seller_email).maybeSingle();
      recipientId = recipient?.id ?? null;
    }
    if (!recipientId) return Response.json({ sent: 0 });
    const { data: tokens } = await admin.from("push_tokens").select("token").eq("user_id", recipientId);
    if (!tokens?.length) return Response.json({ sent: 0 });
    const payload = tokens.map(({ token }) => ({ to: token, sound: "default", title: "Formal Exchange", body: "You have a new message.", data: { conversationId } }));
    await fetch("https://exp.host/--/api/v2/push/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    return Response.json({ sent: payload.length });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
});
