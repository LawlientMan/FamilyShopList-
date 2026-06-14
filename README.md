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

## Documentation

- `REQUIREMENTS.md` — product requirements (source of truth for features).
- `DATA-MODEL.md` — Firestore collections, document shapes, join-by-code flow.
- `firestore.rules` — security rules.
- `CLAUDE.md` — conventions and commands.
