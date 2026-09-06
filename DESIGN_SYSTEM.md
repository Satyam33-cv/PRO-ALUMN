# PRO ALUMN DESIGN SYSTEM ARCHITECTURE

## 1. Overview & Architectural Philosophy

PRO ALUMN operates on a **Deliberate Two-Tier Visual Architecture**. Rather than imposing cosmetic visual styles uniformly across fundamentally different use cases, the platform enforces an intentional split between **Member-Facing Community Surfaces** and **Administrative High-Density Operational Planes**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PRO ALUMN DESIGN ARCHITECTURE MATRIX                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ TIER 1: MEMBER & PUBLIC EXPERIENCE         │ TIER 2: ADMINISTRATIVE COCKPIT  │
│ (Neo-Brutalist Academic Architecture)       │ (High-Density Operational Plane)│
├─────────────────────────────────────────────┼─────────────────────────────────┤
│ • Canvas: #F7F4EE (Warm Cream Paper)        │ • Canvas: Slate / Dark Slate    │
│ • Borders: 2px / 4px Solid Black (#000000)  │ • Borders: 1px High-Density Grid│
│ • Shadows: Hard 4px / 6px (Zero Blur)       │ • Shadows: Subtle / Flat        │
│ • Accents: #CCFF00 (Lime), #FF5500 (Orange) │ • Accents: Emerald / Rose / Cyan│
│ • Corners: Sharp (rounded-none / rounded-sm)│ • Corners: rounded-lg / rounded │
│ • Typography: Space Grotesk + JetBrains Mono│ • Typography: Dense Monospace   │
│ • Routes: /, /dashboard, /directory, /jobs, │ • Routes: /admin (10 tabs, CSV, │
│   /events, /stories, /mentorship, /chat,    │   moderation, Redis telemetry,  │
│   /wallet, /rewards, /matching, /requests,  │   SQL health, raw data audit)   │
│   /login, /register, /privacy, /terms       │                                 │
└─────────────────────────────────────────────┴─────────────────────────────────┘
```

---

## 2. Tier 1: Neo-Brutalist Academic Blueprint

### Design Tokens

| Token | CSS / Value | Tailwind / Usage | Description |
|---|---|---|---|
| Canvas Background | `#F7F4EE` | `bg-[#F7F4EE]` | Warm, tactile architectural parchment |
| Ingress Pure White | `#FFFFFF` | `bg-white` | Primary content card surface |
| Primary Ink Border | `#000000` | `border-black`, `border-2`, `border-4` | Uncompromising structural outlines |
| Primary Drop Shadow | `4px 4px 0px #000000` | `shadow-[4px_4px_0px_#000000]` | Hard offset elevation; zero blur radius |
| Hero Drop Shadow | `6px 6px 0px #000000` | `shadow-[6px_6px_0px_#000000]` | Authoritative container elevation |
| Accent Lime | `#CCFF00` | `bg-[#CCFF00]`, `text-[#CCFF00]` | High-voltage action points, verified tags |
| Accent Safety Orange | `#FF5500` | `bg-[#FF5500]`, `text-[#FF5500]` | Critical calls-to-action, alerts, deadlines |
| Typography Headline | Space Grotesk | `font-display`, `font-headline` | Technical, high-character display lettering |
| Typography Telemetry | JetBrains Mono | `font-mono` | Dossier tags, vector coordinates, timestamps |

### Component Directives (Tier 1)
1. **Zero Unnecessary Radius**: Avoid `rounded-2xl`, `rounded-3xl`, or pill-shaped cards. Containers must be rectangular (`rounded-none` or subtle `rounded-sm`).
2. **Zero Floating Blur Blobs**: Ban `blur-3xl`, floating ambient gradient orbs, and generic purple-to-blue gradients (`from-blue-600 to-indigo-600`).
3. **Hard Tactical Feedback**: Interactive elements depress directly into the page upon click (`active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`).
4. **Institutional Metadata**: Every view exposes structured dossier telemetry (`NODE REF //`, `VECTOR SIMILARITY`, `COHORT ID`).

---

## 3. Tier 2: Administrative Operational Cockpit

### Design Directives
1. **Data Density First**: The `/admin` surface manages 10 operational tabs, CSV mass-imports, user presence WebSockets, and real-time SQL latency pings. Data density must not be sacrificed for decorative styling.
2. **Tabular Efficiency**: Tables display 15–20 rows per fold with compact column widths, crisp inline status dots, and minimal padding.
3. **Intentional Framing**: The administrative cockpit is explicitly wrapped inside a Tier 1 Neo-Brutalist Console Frame (`[ ROOT // COMMAND ENCLAVE & PLATFORM TELEMETRY ]`), ensuring administrators recognize the visual shift as an intentional security boundary rather than an incomplete design.

---

## 4. Route Classification Registry

| Route | Visual Tier | Layout Component | Primary Elevation |
|---|---|---|---|
| `/` | Tier 1 | `PreLoginNav` + Hero | `border-4 border-black shadow-[6px_6px_0px_#000000]` |
| `/dashboard` | Tier 1 | `DashboardContent` | `border-4 border-black shadow-[6px_6px_0px_#000000]` |
| `/directory` | Tier 1 | `DirectoryContent` | `border-4 border-black shadow-[6px_6px_0px_#000000]` |
| `/directory/[id]` | Tier 1 | `AlumniProfileContent` | `border-4 border-black shadow-[6px_6px_0px_#000000]` |
| `/jobs` | Tier 1 | `JobListContent` | `border-4 border-black shadow-[6px_6px_0px_#000000]` |
| `/jobs/[id]` | Tier 1 | `JobDetailContent` | `border-4 border-black shadow-[6px_6px_0px_#000000]` |
| `/events` | Tier 1 | `EventListContent` | `border-4 border-black shadow-[6px_6px_0px_#000000]` |
| `/events/[id]` | Tier 1 | `EventDetailContent` | `border-4 border-black shadow-[6px_6px_0px_#000000]` |
| `/stories` | Tier 1 | `StoriesContent` | `border-4 border-black shadow-[6px_6px_0px_#000000]` |
| `/mentorship` | Tier 1 | `MentorshipContent` | `border-4 border-black shadow-[6px_6px_0px_#000000]` |
| `/chat` | Tier 1 | `ChatContent` | `border-4 border-black shadow-[6px_6px_0px_#000000]` |
| `/wallet` | Tier 1 | `WalletContent` | `border-4 border-black shadow-[6px_6px_0px_#000000]` |
| `/rewards` | Tier 1 | `RewardsContent` | `border-4 border-black shadow-[6px_6px_0px_#000000]` |
| `/requests` | Tier 1 | `RequestsContent` | `border-2 border-black shadow-[4px_4px_0px_#000000]` |
| `/privacy`, `/terms` | Tier 1 | Legal Shell | `border-4 border-black shadow-[6px_6px_0px_#000000]` |
| `/admin` | Tier 2 | `AdminContent` | Brutalist Enclave Banner + High-Density Slate Grid |
