# 🍍 Bikini Bottom Dashboard

A **SpongeBob SquarePants-inspired** modern dashboard template built with **React.js** and **Tailwind CSS**.
Features a public-facing landing site, a full internal admin dashboard, floating bubble animations,
underwater flower patterns, glassmorphism cards, and a cozy "Bikini Bottom Night" dark mode.

> Who lives in a pineapple under the sea? Your dashboard does, now.

---

## ✨ Features

- ⚛️ **React 18 + TypeScript** powered by **Vite**
- 🎨 **Tailwind CSS** with a custom SpongeBob palette (ocean blue, sandy yellow, coral pink, seaweed green)
- 🧩 **shadcn/ui** foundation (via `components.json`, `cn()` utilities, and reusable UI primitives)
- 🧭 **React Router DOM v6** with a **public site** (`/`) and a **separate admin dashboard** (`/dashboard`)
- 📊 **Recharts** analytics: weekly sales, hourly traffic, and menu mix
- 🫧 Animated **floating bubbles** and underwater **flower patterns** in the background
- 🍍 Pineapple / coral reef inspired cards, widgets, and buttons
- 🌙 Optional **Bikini Bottom Night** dark mode (persisted in `localStorage`)
- 📱 **Fully responsive** layout for desktop, tablet, and mobile
- 🧱 Clean, reusable component structure

---

## 🗺️ Pages & Routes

| Route         | Layout         | Purpose                                                 |
| ------------- | -------------- | ------------------------------------------------------- |
| `/`           | `PublicLayout` | **Home** — public landing page (hero, menu, reviews)    |
| `/dashboard`  | `Layout`       | **Dashboard** — internal admin overview                 |
| `/projects`   | `Layout`       | Project cards with progress bars & status badges        |
| `/team`       | `Layout`       | Team member cards with avatars, roles, and skills       |
| `/calendar`   | `Layout`       | Monthly schedule and upcoming events                    |
| `/settings`   | `Layout`       | Profile, theme, accent color, and notification settings |

> The **Home page** is a public-facing website with a top navbar and footer only (no sidebar, no
> analytics widgets). The **Dashboard area** uses a separate admin layout with a sidebar, top
> navbar with search/profile/notifications, stats, charts, and activity widgets. You can move
> between them via the **"Enter Dashboard"** button on Home and the **"Back to site"** button
> in the sidebar.

---

## 📁 Folder Structure

```text
spongebob/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── assets/            # (reserved for images/svgs if needed)
│   ├── components/
│   │   ├── ActivityFeed.js
│   │   ├── Badge.js
│   │   ├── Bubbles.js
│   │   ├── CalendarView.js
│   │   ├── ChartCard.js
│   │   ├── FlowerPattern.js
│   │   ├── Icon.js
│   │   ├── Layout.js          # Admin layout (sidebar + navbar)
│   │   ├── Logo.js
│   │   ├── Navbar.js          # Admin navbar
│   │   ├── PageHeader.js
│   │   ├── ProgressBar.js
│   │   ├── ProjectCard.js
│   │   ├── PublicFooter.js
│   │   ├── PublicLayout.js    # Public landing layout
│   │   ├── PublicNavbar.js    # Public top navbar
│   │   ├── Sidebar.js
│   │   ├── StatCard.js
│   │   ├── TaskList.js
│   │   └── TeamMemberCard.js
│   ├── context/
│   │   └── ThemeContext.js    # Light / "Bikini Bottom Night"
│   ├── data/
│   │   ├── activities.js
│   │   ├── chartData.js
│   │   ├── events.js
│   │   ├── navItems.js
│   │   ├── projects.js
│   │   ├── stats.js
│   │   ├── tasks.js
│   │   └── team.js
│   ├── pages/
│   │   ├── Calendar.js
│   │   ├── Dashboard.js
│   │   ├── Home.js
│   │   ├── Projects.js
│   │   ├── Settings.js
│   │   └── Team.js
│   ├── App.js
│   ├── index.css
│   └── index.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 16
- **npm** ≥ 8 (or yarn / pnpm)

### Installation

```bash
# from the project root
npm install
```

### Run the dev server

```bash
npm run dev
```

Then open <http://localhost:3000>.

### Build for production

```bash
npm run build
```

The optimized output is written to the `build/` folder.

---

## 🎨 Theming

### Color palette

| Token     | Use case              | Example        |
| --------- | --------------------- | -------------- |
| `ocean`   | Primary / backgrounds | `#0a8fd8`      |
| `sand`    | Pineapples / accents  | `#f5b301`      |
| `coral`   | Alerts / highlights   | `#f73d66`      |
| `seaweed` | Positive / progress   | `#1fbf6b`      |
| `night`   | Dark-mode backgrounds | `#03132a`      |

Tokens are defined in [`tailwind.config.js`](./tailwind.config.js) — swap the hex codes there to
restyle the whole app.

### Typography

Fonts are loaded from **Google Fonts** in `public/index.html`:

- **Headings / Logo:** `"Bowlby One SC"` + `"Chewy"` + `"Luckiest Guy"` — a playful, rounded,
  SpongeBob-title-card vibe reminiscent of the "Krabby Patty" font.
- **Body:** `"Nunito"` (with `"Poppins"` and `"Comic Neue"` as fallbacks) — clean, friendly, readable.

Tailwind exposes these as:

```js
font-display   // Bowlby One SC (logo)
font-heading   // Chewy (section titles, stat values)
font-body      // Nunito (paragraphs, UI text)
```

### Dark mode — "Bikini Bottom Night" 🌙

- Toggle from the navbar (both public and admin).
- Persisted in `localStorage` via `src/context/ThemeContext.js`.
- Tailwind is configured with `darkMode: "class"`, so any component can opt in with the
  `dark:` prefix.

---

## 🧩 Reusable Components

- **`StatCard`** — big number KPI with delta and accent color.
- **`ChartCard`** — standardized wrapper around any Recharts chart.
- **`ProgressBar`** — gradient bar with tone variants (`ocean`, `sand`, `coral`, `seaweed`).
- **`Badge`** — status chip (`in-progress`, `review`, `blocked`, `done`, `online`, …).
- **`ProjectCard`**, **`TeamMemberCard`**, **`CalendarView`** — feature-rich cards per page.
- **`Bubbles`** — animated SVG bubbles floating from the sea floor.
- **`FlowerPattern`** — classic SpongeBob-intro underwater-flower SVG tile as a subtle bg.
- **`Sidebar`** + **`Navbar`** — admin navigation and top bar.
- **`PublicNavbar`** + **`PublicFooter`** — separate public-site navigation.

All mock data lives in `src/data/*.js` — swap it with your own API responses when you're ready.

---

## 📜 License

MIT. Use it, remix it, ship it — just don't let Plankton near the secret formula.
