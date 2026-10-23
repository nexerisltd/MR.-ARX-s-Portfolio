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
