# Auth email templates

Bilingual (EN + ZH) replacements for Supabase's default plain-text auth emails.
Both languages appear in every email, because Supabase renders the template
before it knows which language the recipient uses in the app.

## Where each file goes

Supabase Dashboard → **Authentication → Emails → Templates**

| File | Template | Suggested subject |
|---|---|---|
| `confirm-signup.html` | Confirm signup | `Confirm your Formal Exchange account · 确认你的 Formal Exchange 账号` |
| `reset-password.html` | Reset password | `Reset your Formal Exchange password · 重置你的 Formal Exchange 密码` |
| `change-email.html` | Change Email Address | `Confirm your new Formal Exchange email · 确认你的新 Formal Exchange 邮箱` |

Paste the file contents into the template body, set the subject, save.
Strip the leading HTML comment if you prefer — it is only a note to whoever edits it.

## Template variables used

Supabase substitutes these server-side. Do not rename them.

- `{{ .ConfirmationURL }}` — the action link (all three templates)
- `{{ .Email }}` — current address (reset, change-email)
- `{{ .NewEmail }}` — requested address (change-email only)

## Why the signup email says what it says

Verification is the only route to a Formal-listing permission, so the signup
email is the real conversion point for seller supply. It states plainly that
the badge arrives only after the link is opened, and that Oxford or Cambridge
confirmation is what unlocks Formal — see
`migrations/20260829090000_verify_only_after_email_confirmation.sql`.

## Delivery

These templates do not fix deliverability on their own. Supabase's built-in
SMTP is rate-limited to a few messages per hour and lands in spam often.
Before launch, set a custom SMTP provider under
**Authentication → Emails → SMTP Settings**, and raise
**Authentication → Rate Limits → "Rate limit for sending emails"**, which stays
low even after custom SMTP is configured.

## Constraints followed

Table-based layout, inline styles only, no external stylesheets, no remote
images, no web fonts — the combination Gmail, Outlook and Apple Mail all render
consistently. Max width 600px, and the CJK font stack falls back to
PingFang SC / Microsoft YaHei so Chinese text is not rendered in a serif default.
