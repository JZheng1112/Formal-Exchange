# Formal Exchange

A marketplace for Oxford and Cambridge Formal dinner tickets, plus travel
tickets, event places and airport ride-shares.

**Live at [formal-exchange.co.uk](https://formal-exchange.co.uk)** · iOS app in
App Store review · Android build available on request

---

## The problem

A Formal ticket can take weeks to secure. Then a deadline moves or a train is
cancelled, and because most colleges have no refund route and no official
resale, that place simply goes empty — while someone a college away would have
taken it gladly. The two of them have no way to find each other: permitted
spare places and demand are scattered across disconnected group chats.

Formal Exchange brings that supply and demand into one place, without becoming
a party to the transaction.

## How it works

**Anyone can browse.** Listings are public. Contacting a seller, publishing
anything, or reporting requires an account.

**Publishing a Formal ticket requires a confirmed Oxford or Cambridge academic
email.** This is the platform's main protection against fraud, and it is
enforced in the database rather than the client:

| Account | Verified badge | May publish Formal | Everything else |
|---|:--:|:--:|:--:|
| Any email | — | — | ✓ |
| Confirmed `*.ac.uk` | ✓ | — | ✓ |
| Confirmed `*.ox.ac.uk` / `*.cam.ac.uk` | ✓ | ✓ | ✓ |

Verification always requires opening a one-time code emailed to the address
being claimed. Entering an address you do not own grants nothing. College and
department subdomains (`reuben.ox.ac.uk`, `medsci.ndm.ox.ac.uk`,
`trinity.cam.ac.uk`) resolve correctly; lookalikes such as `fakeox.ac.uk` do
not.

**Sellers control who sees a listing**, following their own college's rules —
host college only, any Oxbridge college, or wider where permitted. Two accounts
therefore see different Formal listings, by design.

**Ticket Swap** lets a member offer an eligible ticket at one college for an
eligible ticket at another, with no cash sale required. Any price difference is
agreed privately.

**No money moves through the platform.** There is no checkout and no in-app
purchase. Formal Exchange publishes information and carries messages; the
contract for a ticket exists only between the two members.

## Safety

- One-time code verification for academic email
- Seller-set audience per listing
- Automatic expiry once the event date passes
- Reporting on every listing and conversation
- User blocking, enforced by a database trigger and row-level security, so an
  out-of-date client cannot route around it
- Human moderation through an admin console, with account suspension
- Private in-app messaging; contact details are never exposed by default

## Built with

| | |
|---|---|
| App | Expo SDK 56, React Native, expo-router, TypeScript |
| Web | The same codebase, exported with React Native Web |
| Backend | Supabase — Postgres, Auth, Storage, Edge Functions |
| Access control | Postgres row-level security on every table |
| Email | Resend |
| Distribution | EAS Build and Update; GitHub Pages for the website |

One codebase serves iOS, Android and the web.

## Running it locally

```bash
npm install
```

Create `.env` in the project root:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
```

Then:

```bash
npx expo start          # choose iOS, Android or web from the prompt
npx expo start --web    # web only
```

Both keys are publishable and reach the browser by design; every table is
protected by row-level security, so the anon key alone grants nothing beyond
what a signed-out visitor should see.

### Database

Migrations live in `supabase/migrations`, applied in filename order:

```bash
npx supabase link --project-ref <your-ref>
npx supabase db push
```

`supabase/functions` holds the Edge Functions, including the one that issues
academic verification codes.

## Layout

```
src/app/           screens (expo-router file-based routing)
src/lib/           Supabase client, API layer, auth storage, i18n
components/        shared UI
supabase/
  migrations/      schema and row-level security
  functions/       Edge Functions
  email-templates/ bilingual auth emails
```

## Languages

The interface is English and Chinese. A member writes in their own language and
optional text is translated for readers using the other, with the original
always available.

## Contact

[support@formal-exchange.co.uk](mailto:support@formal-exchange.co.uk)

## Licence

See [LICENSE](LICENSE).
