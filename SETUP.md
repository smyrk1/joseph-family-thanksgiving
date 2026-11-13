# Joseph Family Thanksgiving 2026 — publish guide

This is a Vite + React app intended for Netlify hosting and Supabase shared data.
Guests do not need accounts. Anyone with the public URL can see the RSVP list and dish claims.

## 1. Create the shared database in Supabase

1. Create a project at https://supabase.com/.
2. Open **SQL Editor** in the Supabase dashboard.
3. Open `supabase/schema.sql` from this project, copy its entire contents, paste into SQL Editor, and run it.
4. In **Project Settings → API** (or **Connect**), copy:
   - Project URL
   - Publishable key (preferred) or legacy anon/public key
5. Never use the `service_role` or secret key in this website.

The SQL creates the menu, RSVPs, claims, public read/submit permissions, and an atomic claim function that prevents two people claiming the same dish.

## 2. Connect the app to Supabase

1. Copy `.env.example` to a new file named `.env`.
2. Set:
   - `VITE_SUPABASE_URL` to your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` to the Supabase publishable/anon public key
3. Save the file.

For local testing:
```bash
npm install
npm run dev
```

## 3. Publish with Netlify

Recommended: use GitHub connected to Netlify so future changes deploy automatically.

1. Create a GitHub repository and upload the contents of this project folder.
2. Open https://app.netlify.com/start and choose **Import from Git**.
3. Connect GitHub and select this repository.
4. Set build command to `npm run build` and publish directory to `dist`.
5. In Netlify: **Site configuration → Environment variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Deploy the site. Netlify will provide a public `*.netlify.app` URL.
7. Test RSVP and dish claims from two different devices before sharing the link.

The included `netlify.toml` already sets the build command and publish directory.

## 4. Public-link behavior and privacy

- No guest login is required.
- Anyone with the link can view the guest RSVP names and dish claims.
- Anyone with the link can submit an RSVP and claim one currently unclaimed dish.
- The database prevents two guests from claiming the same dish at the same time.
- Public visitors cannot edit or delete existing claims or RSVPs.
- Manage or correct records through the Supabase dashboard.
- Because this is a public no-login app, the URL can be forwarded and public submissions can be abused. Share it with the family rather than posting it widely. For stronger protection, add CAPTCHA or require a family invite code before accepting submissions.

## 5. Menu and event details

Event: Tuesday, November 24, 2026  
Address: 880 Hwy 6 South, Houston, TX 77079

The starter menu omits items previously removed from the family list (turkey, ham, corn, coleslaw, casserole, sweet fruit punch, black-eyed peas, and cornbread).

## Troubleshooting

- If the app says Preview mode, the two Vite environment variables are missing or incorrect.
- If the page loads but the menu is empty, confirm the SQL script ran successfully.
- If claims do not update on another phone, check that `dish_claims` and `rsvps` are enabled in the `supabase_realtime` publication.
- If you change Netlify environment variables, trigger a new deploy so Vite rebuilds the frontend.
