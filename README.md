# NexApp Portfolio (MR. ARX)

Vite + React + TypeScript + Three.js + Supabase. Shob code notun kore lekha (kono template copy na).

## Setup

1. **Supabase project** banao (supabase.com). SQL Editor e `supabase/schema.sql` run koro — **age file er `YOUR_EMAIL_HERE` nijer email diye bodlao**.
2. Supabase > Authentication > Users > "Add user" diye nijer email + password banao. Tarpor Authentication settings e **public sign-ups off** koro, jate shudhu tumi login korte paro.
3. `.env.example` copy kore `.env` banao, Project Settings > API theke URL ar anon key boshao.
4. `npm install` then `npm run dev`. Browser e `/admin` e giye login koro.

## Admin panel (`/admin`)

- **Profile & content** — naam, role, about, social, skills, journey.
- **3D character** — (1) **`.glb` 3D model upload** (Tripo / Meshy / Hunyuan3D er output): 60MB+ file o dile browser nijei weld + simplify + texture chhoto + meshopt compress kore ~1–7MB banay, upload kore, hero te real 3D model set kore (mouse follow, light). Size / rotation / upor-niche / light slider ache. (2) Alternative: photo choose korle depth-relief mode (quality kom). Default project e `public/character/model.glb` deya ache.
- **Favicon** — image choose korle `.ico`, 16/32/48, apple-touch 180, android 192/512, maskable 512 ar `site.webmanifest` auto generate + upload + site e apply.
- **Projects** — add / edit / delete / reorder, cover image upload, "featured" dile Home e dekhabe. Public list `/projects` page e.

Tip: model ta oi bhabe thikmoto face kore na thakle admin e Rotation slider diye ghurao. Adha-sharir (bust) model hole nichey auto soft fade hoy.

## Deploy (Vercel)

`vercel.json` e SPA rewrite deya ache. Vercel e `VITE_SUPABASE_URL` ar `VITE_SUPABASE_ANON_KEY` environment variable dao.

## Default content

Supabase connect na thakle `src/lib/defaults.ts` er content dekhabe. `public/character/` e default 3D model, photo ar depth map deya ache.

## Scroll animation (kon file e ki)

- `src/lib/scrollEngine.ts` — chhoto scroll engine; element er scroll progress `--p` CSS variable e boshay, smoothed scrollY `--sy` e.
- `src/components/Stage.tsx` — fixed full-screen 3D stage. Character scroll e section theke section e soray/ghuray. Proti section e `data-stage="..."` ache; position/scale/rotation er table `DESK` ar `MOB` object e (file er upore) — ekhane x/y/scale/rotation/opacity bodlale character er path bodlay.
- `src/components/Sections.tsx` — pinned About (shobdo jole), stacking skill cards, drawing timeline, horizontal Work scroll, Contact.
- `src/components/Loader.tsx`, `Cursor.tsx`, `SplitText.tsx` — preloader, custom cursor + magnetic button, text reveal.
- Hero te character drag kore ghurano jay (desktop + touch).

## Brand structure

Parent brand = **NexEris** (admin > Profile & content > "Parent brand"), sub brand = **NexApp** (admin > "Sub brands", ek line e `Name | Description | URL`). Ei duto hero lockup, nav, "The studio" section, footer ar contact badge e dekhay. Aro sub brand add korte ekta notun line dao.

## Visitor analytics (admin > Analytics)

1. Supabase SQL Editor e `supabase/analytics.sql` ekbar run koro (`schema.sql` age run kora thakte hobe).
2. Site live deploy koro. Visitor ra ashle Admin > Analytics e dekhabe: live now, page views, unique visitors, sessions, returning, time on page, scroll depth, daily chart, top pages, referrer, utm, device/browser/OS, location (timezone), clicks (email, project link, outbound), section funnel (visitor kothay porjonto scroll korlo), recent visits.
3. Privacy: cookie nai, IP save hoy na, fingerprinting nai. Bot, Do-Not-Track, localhost ar `/admin` track hoy na. Je browser e admin login korbe seta auto track bondho hoy (Analytics tab theke on/off kora jay).
4. Local e test korte URL e `?track=1` dao (e.g. `http://localhost:5173/?track=1`).
5. Visitor ra shudhu INSERT korte pare (RLS); data pora/delete shudhu tumi (admin) korte paro.

## Visitor tracking v2 + Likes — setup

**Supabase:** SQL Editor e `supabase/analytics.sql` abar run koro (purano data jay na, upgrade hoy).

**Vercel (Project > Settings > Environment Variables):**
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (age theke ache)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase > Project Settings > API > *service_role* key. **Eta secret**, shudhu Vercel e dao, kothao commit korba na, `VITE_` prefix dio na. Eta shudhu `api/like.ts` (server) e lage.
- `IP_SALT` — ekta random lomba string (e.g. 32 char). IP hash er salt.

Tarpor `npm install` ar Vercel e deploy. (Ager version e `@vercel/functions` package chhilo — ekhon lage na, server file gulo kono package chhara header theke geo/IP pay.)

**Kon file ki kore**
- `api/geo.ts` — visitor er desh/shohor (Vercel er IP-geo) + IP er salted hash. Raw IP save hoy na.
- `middleware.ts` — non-JS bot (Googlebot, GPTBot, curl, scanner…) server e dhore `bot_hits` e likhe. Manush der track kore na. Error hole site atkabe na.
- `api/like.ts` — login chhara like. Ek jon, 7 diner moddhe, target prati ekbar. Limit server e: browser id (localStorage) **ba** hash(IP + User-Agent) mile gele block. Extra guard: same-origin only, bot block, honeypot, page khulei 1.2s er moddhe like reject.
- `src/lib/bots.ts` — bot name/category list (Googlebot, GPTBot, ClaudeBot, AhrefsBot, WhatsApp preview, curl, scanner…). Notun bot add korte ekhane ekta line dao.
- Admin > Analytics: Overview / Visitors (filter + detail + CSV) / Bots / Tracking links.

**Limit (likes):** kono login chhara system 100% thik na. Same device e storage clear korle ba same network+browser e abar dile block hoy; kintu VPN/phone-data change kore + incognito dile bypass kora jay. Office/hostel er shared wifi te alada device (alada browser) ke block kore na.

Local dev e `/api/*` ar middleware cholbe na (Vite `/api` ke 404 JSON dey, terminal e error ashe na), tai like button lukano thakbe ar location ashbe na — Vercel e deploy kore dekho. `vercel dev` diye local e o chalano jay.

## Raw IP + Inquiries ("Start a project" form)

- **Raw IP (optional):** default e IP save hoy na (shudhu salted hash + country/city). Vercel env e `STORE_RAW_IP=1` dile `visits` ar `bot_hits` e IP save hoy, ar site er footer e auto likha thake "IP address stored for up to 90 days". Admin > Analytics > Overview > Privacy e "90 diner purano IP muchho" / "Shob IP muchho" button ache. Auto-cleanup er jonno `analytics.sql` e pg_cron er commented snippet ache.
- **Naam:** web e naam automatically jana jay na. Naam pawar legit upay: (1) Contact section er "Start a project" form (naam, email, ki dorkar, budget, timeline, message) — admin > **Inquiries** e ashe, saathe oi manush ta kon page/section dekhlo, kothay theke ashlo; (2) **Tracking links** (`?v=code`) — je link ta tumi nijei pathao; (3) Inquiry dile Visitors list e oi visitor er naam/email dekhay.
- Form er spam guard: same-origin, bot block, honeypot, minimum fill time, ek network theke 24h e max 3 ta.
- Notun SQL ache: `analytics.sql` abar run koro.

## ⚠️ Server file (middleware.ts + api/*) er niyom — kono `import` nai!

Vercel `middleware.ts` ar `api/*.ts` prottek file ke **alada alada compile kore, bundle kore na**. Tai oi file gulo theke onno folder er TypeScript (`../src/lib/bots` ityadi) import korle build pass kore, kintu **runtime e file khuje pay na** → pura site `500 MIDDLEWARE_INVOCATION_FAILED` hoye jay. Tai ei file gulo ekdom self-contained.

- Edit korte hole `server-src/` e koro (`server-src/middleware.ts`, `server-src/api/*.ts`, ar shared `server-src/_parts/*`), tarpor `npm run sync:server` — eta bot list (`src/lib/bots.ts`), inquiry option (`src/lib/inquiry.ts`) ar helper gulo inline kore root `middleware.ts` ar `api/*.ts` generate kore. Generated file gulo commit koro.
- `sync:server` import paile fail kore, jate bhul kore abar import dhukiye ne dite na paro.
- **Notun middleware/api change deploy korar age Preview e test koro:** nijer branch e push → Vercel er Preview URL e site khule dekho → thik thakle main e merge.
- Jodi kokhono middleware error dey: root theke `middleware.ts` delete kore push koro, site sathe sathe ferot ashbe (shudhu non-JS bot logging bondho thakbe).

## Telegram alert (optional)
Vercel env: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` dile (1) notun inquiry ashle, (2) tomar dewa tracking link (`?v=code`) keu prothom khulle Telegram e message jabe. Na dile kichu hoy na.

## "What brings you here?" poll
Visitor ke 25s ba 50% scroll por ek-tap poll dekhay (Hire a developer / Need an app built / Just browsing / …). Naam-email lage na. Result Admin > Analytics > Overview > Clicks e `intent · …` hishebe dekhay. Kon project card visitor 1.2s+ dhore dekhlo seta `project view · …` hishebe.

## Scrollbar + polish
- Scrollbar site er vibe e style kora (dark track, amber thumb): `src/styles.css` er sheshe "scrollbar" block. Chrome/Edge/Safari `::-webkit-scrollbar`, Firefox `scrollbar-color`. Rang bodlate `#e0ab68 / #8a6234` (thumb) ar `#0c0b0a` (track) bodlao.
- `SectionRail` (dan pashe dot nav + back-to-top), route fade, button shine, animated underline, giant footer wordmark, 404 page, text selection / focus ring amber.
