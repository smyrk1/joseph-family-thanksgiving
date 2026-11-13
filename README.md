# Joseph Family Thanksgiving — fixed Vite project

This project includes the missing `src/main.jsx` entry point and a complete Vite/React folder layout. Netlify builds the app with `npm run build` and publishes `dist`.

## 1. Run locally
```bash
npm install
npm run dev
```

## 2. Connect Supabase for a shared family list
1. Create a Supabase project.
2. In Supabase, open **SQL Editor** and run `supabase/schema.sql`.
3. In Project Settings → API, copy the Project URL and anon/public key.
4. In the Netlify site, open **Site configuration → Environment variables** and add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Trigger a new deploy.

The app works in local-demo mode without Supabase, but those sign-ups are stored only in that browser. Supabase is required for all family members to see the same list.

## 3. Deploy to Netlify
- Push the contents of this folder to the root of your GitHub repository.
- In Netlify set **Build command** to `npm run build`.
- Set **Publish directory** to `dist`.
- Deploy.

Do not commit `.env` files or service-role keys. The browser app should use only the Supabase anon/public key with the supplied row-level security policies.

## Project structure
```text
joseph-family-thanksgiving/
├── index.html
├── package.json
├── vite.config.js
├── netlify.toml
├── .env.example
├── supabase/
│   └── schema.sql
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── supabase.js
    └── index.css
```
