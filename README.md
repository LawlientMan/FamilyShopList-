# FamilyShopList

A family shopping-list + wishlist PWA. React 19 + TypeScript + Vite +
Tailwind v3 + vite-plugin-pwa + Firebase (Firestore + Auth).

Fully free on the Firebase Spark plan — no Cloud Functions. All logic is
client-side and secured by `firestore.rules`.

## Setup

```bash
npm install
cp .env.example .env   # fill in your Firebase web config
npm run dev            # http://localhost:5173
```

## Scripts

- `npm run dev` — dev server
- `npm run build` — typecheck + production build
- `npm run preview` — preview the production build
- `npm run emulators` — start the Firebase Local Emulator Suite (Auth + Firestore + UI)
- `npm run dev:emulate` — run emulators **and** Vite together (via `concurrently`)

## Local emulators

For local development against the Firebase Local Emulator Suite:

1. **Install Java JDK** — the Firestore emulator requires Java (JDK 11+).
   Verify with `java -version`.
2. Set `VITE_USE_EMULATOR=true` in `.env`. When `import.meta.env.DEV` and this
   flag is `true`, `src/lib/firebase.ts` connects Auth to `127.0.0.1:9099` and
   Firestore to `127.0.0.1:8080`.
3. Run `npm run dev:emulate` (or `npm run emulators` in a separate terminal).
   The Emulator UI is available at the URL printed on startup.

Emulator ports and config live in `firebase.json`. Security rules
(`firestore.rules`) and indexes (`firestore.indexes.json`) are loaded
automatically by the emulator and used on deploy.

> The emulator does **not** require the `.env` values to be real — any
> placeholder Firebase config works while `VITE_USE_EMULATOR=true`.

## Deploy

The app is fully client-side (no Cloud Functions — Spark plan). Deploys go to
Firebase Hosting, and the Firestore security rules and indexes are deployed
separately.

```bash
npm run build                       # produce dist/

# One-time: log in and select the project
npx firebase login
npx firebase use <your-project-id>

# Deploy Firestore security rules and composite indexes
npx firebase deploy --only firestore:rules
npx firebase deploy --only firestore:indexes

# Deploy the built app to Hosting (add a "hosting" block to firebase.json first)
npx firebase deploy --only hosting
```

- **Rules** (`firestore.rules`) are the only security barrier — deploy them
  before exposing the app.
- **Indexes** (`firestore.indexes.json`) back the composite queries (the
  `members` collection-group lookup and the active/bought item queries on
  `quickItems` and list `items`). Deploy them so those queries don't fail with
  `failed-precondition` in production. Building new composite indexes can take a
  few minutes; the Firestore console shows progress.

## Documentation

- `REQUIREMENTS.md` — product requirements (source of truth for features).
- `DATA-MODEL.md` — Firestore collections, document shapes, join-by-code flow.
- `firestore.rules` — security rules.
- `CLAUDE.md` — conventions and commands.
