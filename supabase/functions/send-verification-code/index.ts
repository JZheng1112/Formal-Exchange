import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Issues a one-time code for a .ac.uk address the caller claims, and mails
// it there. The code never reaches the caller in the response -- only the
// inbox of the address being claimed proves ownership.
//
// Requires the RESEND_API_KEY secret:
//   npx supabase secrets set RESEND_API_KEY=re_xxx

const FROM = "Formal Exchange <noreply@formal-exchange.co.uk>";
const SUPPORT = "support@formal-exchange.co.uk";

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

    const { email } = await request.json();
    if (typeof email !== "string" || !email.includes("@")) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const target = email.trim().toLowerCase();

    // start_email_verification enforces the .ac.uk rule, the
    // already-claimed check and the hourly throttle, and raises on failure.
    const { data: code, error: rpcError } = await admin.rpc("start_email_verification", {
      p_user_id: authData.user.id,
      p_email: target,
    });

    if (rpcError) {
      return Response.json({ error: rpcError.message }, { status: 400 });
    }

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      return Response.json({ error: "Email delivery is not configured yet." }, { status: 500 });
    }

    const sent = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [target],
        subject: `${code} is your Formal Exchange verification code · 你的验证码`,
        html: emailHtml(code as string),
      }),
    });

    if (!sent.ok) {
      const detail = await sent.text();
      console.error("RESEND ERROR", sent.status, detail);
      return Response.json({ error: "Could not send the email. Please try again." }, { status: 502 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("SEND VERIFICATION ERROR", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
});

function emailHtml(code: string) {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F7F4EE;margin:0;padding:24px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'PingFang SC','Microsoft YaHei',sans-serif;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:20px;overflow:hidden;">

      <tr><td style="background:#071B3A;padding:26px 30px;">
        <div style="color:#FFFFFF;font-size:18px;font-weight:800;letter-spacing:1px;">FORMAL EXCHANGE</div>
        <div style="color:#B9C6DC;font-size:13px;margin-top:5px;">Oxford &amp; Cambridge · Formal tickets first</div>
      </td></tr>

      <tr><td style="padding:30px 30px 8px;">
        <h1 style="margin:0 0 14px;font-size:23px;line-height:1.3;color:#071B3A;font-weight:800;">Your verification code</h1>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#475569;">
          Enter this code in Formal Exchange to link this academic address to your account.
        </p>

        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
          <tr><td style="background:#F3EFE5;border:1px solid #D6C7A1;border-radius:14px;padding:18px 30px;">
            <span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:32px;font-weight:700;letter-spacing:9px;color:#071B3A;">${code}</span>
          </td></tr>
        </table>

        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#64748B;">
          The code expires in 15 minutes.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FDF2EC;border:1px solid #E9C4B0;border-radius:14px;margin:0 0 8px;">
          <tr><td style="padding:15px 17px;font-size:14px;line-height:1.6;color:#7A2E10;">
            <strong>Did not request this?</strong> Someone entered this address on Formal Exchange.
            Ignore this email — without the code nothing happens. Never share it with anyone,
            including anyone claiming to be support.
          </td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:0 30px;"><div style="border-top:1px solid #E2E8F0;margin:26px 0 0;"></div></td></tr>

      <tr><td style="padding:26px 30px 8px;">
        <h2 style="margin:0 0 14px;font-size:21px;line-height:1.35;color:#071B3A;font-weight:800;">你的验证码</h2>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.75;color:#475569;">
          请在 Formal Exchange 中输入此验证码，将该学术邮箱与你的账号关联。
        </p>

        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
          <tr><td style="background:#F3EFE5;border:1px solid #D6C7A1;border-radius:14px;padding:18px 30px;">
            <span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:32px;font-weight:700;letter-spacing:9px;color:#071B3A;">${code}</span>
          </td></tr>
        </table>

        <p style="margin:0 0 16px;font-size:14px;line-height:1.75;color:#64748B;">
          验证码 15 分钟内有效。
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FDF2EC;border:1px solid #E9C4B0;border-radius:14px;margin:0 0 8px;">
          <tr><td style="padding:15px 17px;font-size:14px;line-height:1.75;color:#7A2E10;">
            <strong>不是你本人操作？</strong>有人在 Formal Exchange 上填写了这个邮箱地址。
            请忽略本邮件，没有验证码不会发生任何事。请勿将验证码分享给任何人，包括自称是客服的人。
          </td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:26px 30px 28px;">
        <div style="border-top:1px solid #E2E8F0;padding-top:18px;font-size:12px;line-height:1.7;color:#94A3B8;">
          Formal Exchange · <a href="https://formal-exchange.co.uk" style="color:#64748B;">formal-exchange.co.uk</a><br>
          Questions / 问题咨询：<a href="mailto:${SUPPORT}" style="color:#64748B;">${SUPPORT}</a><br>
          <span style="color:#B6BECC;">We never ask for your password, ticket barcodes or bank details.<br>
          我们绝不会索取你的密码、票面条码或银行信息。</span>
        </div>
      </td></tr>

    </table>
  </td></tr>
</table>`;
}
