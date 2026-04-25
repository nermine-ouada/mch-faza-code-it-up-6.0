import React from "react";
import { Link } from "react-router-dom";

const MENU = [
  {
    name: "Krabby Patty",
    emoji: "🍔",
    desc: "The legendary secret-formula burger. Still the best in the seven seas.",
    price: "$5.99",
    accent: "pineapple-card",
  },
  {
    name: "Kelp Shake",
    emoji: "🥤",
    desc: "Cold, kelpy, and refreshing. Warning: may cause spontaneous dancing.",
    price: "$3.49",
    accent: "ocean-card",
  },
  {
    name: "Coral Bits",
    emoji: "🍟",
    desc: "Crunchy coral-shaped bites — the perfect underwater sidekick.",
    price: "$2.99",
    accent: "coral-card",
  },
];

const FEATURES = [
  {
    emoji: "🧽",
    title: "Made With Love",
    desc: "Every patty is hand-flipped by SpongeBob himself (or a very committed fry cook).",
  },
  {
    emoji: "🐠",
    title: "Fresh Underwater",
    desc: "Ingredients sourced daily from the freshest reefs of Bikini Bottom.",
  },
  {
    emoji: "⭐",
    title: "Fan Favorite",
    desc: "Loved by customers and starfish alike for over 20 undersea years.",
  },
  {
    emoji: "🎺",
    title: "Live Entertainment",
    desc: "Enjoy Squidward's clarinet stylings (sometimes, reluctantly).",
  },
];

const TESTIMONIALS = [
  {
    emoji: "⭐",
    name: "Patrick Star",
    role: "Regular Customer",
    quote:
      "Is mayonnaise an instrument? I don't know, but these Krabby Patties sure are!",
  },
  {
    emoji: "🐿️",
    name: "Sandy Cheeks",
    role: "Texas Scientist",
    quote:
      "Scientifically speakin', this here patty is the tastiest thing this side of the dome.",
  },
  {
    emoji: "🐋",
    name: "Pearl Krabs",
    role: "Teen Influencer",
    quote:
      "OMG the kelp shake is literally the cutest thing ever. Ten out of ten, daddy!",
  },
];

const STATS = [
  { value: "20+", label: "Years Under the Sea" },
  { value: "1M+", label: "Patties Flipped" },
  { value: "4.9★", label: "Customer Rating" },
  { value: "24/7", label: "Open… almost" },
];

export default function Home() {
  return (
    <div>
      {/* ---------- HERO ---------- */}
      <section id="home" className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-24">
          <div className="relative">
            <span className="chip bg-white/80 !px-4 !py-1.5 text-coral-600 shadow-soft dark:bg-white/10">
              🍍 Welcome to Bikini Bottom
            </span>

            <h1 className="mt-5 font-heading text-5xl leading-[1.05] text-ocean-800 sm:text-6xl lg:text-7xl dark:text-sand-200">
              Who lives in a{" "}
              <span className="text-coral-500">pineapple</span> <br />
              under the <span className="text-sand-500">sea?</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg font-semibold text-ocean-800/80 dark:text-ocean-100/80">
              Dive into the friendliest underwater hangout on the internet. Order
              a Krabby Patty, meet the crew, and manage your crew from our
              all-new{" "}
              <Link
                to="/dashboard"
                className="font-heading text-coral-500 underline decoration-wavy underline-offset-4 hover:text-coral-600"
              >
                Bikini Bottom Dashboard
              </Link>
              .
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/dashboard" className="btn-primary !text-lg">
                Enter Dashboard →
              </Link>
              <a href="#menu" className="btn-ghost !text-base">
                View Menu
              </a>
            </div>

            {/* Stats */}
            <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="glass-card px-4 py-3 text-center"
                >
                  <dt className="font-heading text-2xl text-ocean-800 dark:text-sand-200">
                    {s.value}
                  </dt>
                  <dd className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-coral-500">
                    {s.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Hero visual */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-sand-300/70 blur-xl" />
            <div className="absolute -right-8 bottom-8 h-32 w-32 rounded-full bg-coral-300/60 blur-xl" />

            <div className="glass-card relative overflow-hidden p-8 sm:p-10">
              {/* Big cartoon pineapple */}
              <div className="relative mx-auto flex h-72 w-72 items-center justify-center rounded-full bg-gradient-to-br from-sand-200 via-sand-300 to-sand-500 shadow-sun animate-bobble sm:h-80 sm:w-80">
                <div className="absolute -top-10 text-7xl animate-sway origin-bottom">
                  🌿
                </div>
                <span className="text-[10rem] leading-none drop-shadow-md">
                  🍍
                </span>
              </div>

              <div className="mt-8 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-3xl shadow-soft dark:bg-white/10">
                    🧽
                  </div>
                  <div>
                    <p className="font-heading text-lg text-ocean-800 dark:text-sand-200">
                      Chef SpongeBob
                    </p>
                    <p className="text-xs font-bold uppercase tracking-widest text-coral-500">
                      On duty today
                    </p>
                  </div>
                </div>
                <span className="chip bg-seaweed-400/30 text-seaweed-600">
                  ● Open
                </span>
              </div>
            </div>

            {/* Floating tags */}
            <div className="absolute -left-6 top-24 hidden rotate-[-8deg] rounded-2xl border border-white/60 bg-white/80 px-3 py-2 text-sm font-bold text-ocean-800 shadow-soft backdrop-blur sm:block dark:border-white/10 dark:bg-white/10 dark:text-ocean-100">
              🍔 Best Burger 2024
            </div>
            <div className="absolute -right-4 top-48 hidden rotate-[6deg] rounded-2xl border border-white/60 bg-white/80 px-3 py-2 text-sm font-bold text-ocean-800 shadow-soft backdrop-blur sm:block dark:border-white/10 dark:bg-white/10 dark:text-ocean-100">
              ⭐ 4.9 rating
            </div>
          </div>
        </div>
      </section>

      {/* ---------- MENU ---------- */}
      <section id="menu" className="relative">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-coral-500">
              Today's Specials
            </p>
            <h2 className="mt-2 font-heading text-4xl text-ocean-800 sm:text-5xl dark:text-sand-200">
              Straight from the Krusty Krab kitchen
            </h2>
            <p className="mt-3 text-base font-semibold text-ocean-700/80 dark:text-ocean-100/70">
              A handcrafted menu of underwater classics — made daily by a fry
              cook who really, really loves his job.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {MENU.map((item) => (
              <article
                key={item.name}
                className={`${item.accent} flex h-full flex-col p-6`}
              >
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/40 blur-md dark:bg-white/10" />
                <div className="relative flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 text-3xl shadow-soft animate-bobble dark:bg-white/10">
                    {item.emoji}
                  </div>
                  <span className="font-heading text-2xl">{item.price}</span>
                </div>

                <h3 className="relative mt-4 font-heading text-2xl leading-tight">
                  {item.name}
                </h3>
                <p className="relative mt-2 text-sm font-semibold opacity-80">
                  {item.desc}
                </p>

                <button className="relative mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/70 bg-white/80 py-2.5 font-heading text-lg text-ocean-900 shadow-soft transition hover:-translate-y-0.5 hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-ocean-50">
                  Order Now
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section id="features" className="relative">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="glass-card relative overflow-hidden p-8 sm:p-12">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-coral-500">
                Why Bikini Bottom?
              </p>
              <h2 className="mt-2 font-heading text-4xl text-ocean-800 sm:text-5xl dark:text-sand-200">
                More than just a restaurant
              </h2>
              <p className="mt-3 text-base font-semibold text-ocean-700/80 dark:text-ocean-100/70">
                We're a whole underwater experience. Good food, great vibes, and
                the occasional karate demonstration.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-3xl border border-white/60 bg-white/70 p-5 text-center transition hover:-translate-y-1 hover:shadow-bubble dark:border-white/10 dark:bg-white/5"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sand-200 to-sand-400 text-3xl shadow-sun animate-bobble">
                    {f.emoji}
                  </div>
                  <h3 className="mt-4 font-heading text-xl text-ocean-800 dark:text-sand-200">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm font-semibold text-ocean-700/80 dark:text-ocean-100/70">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- TESTIMONIALS ---------- */}
      <section id="reviews" className="relative">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-coral-500">
              Word from the Reef
            </p>
            <h2 className="mt-2 font-heading text-4xl text-ocean-800 sm:text-5xl dark:text-sand-200">
              What our customers say
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.name}
                className="glass-card relative flex h-full flex-col p-6"
              >
                <div className="pointer-events-none absolute -right-2 -top-6 font-heading text-7xl leading-none text-coral-300/60">
                  ,,
                </div>
                <blockquote className="relative text-ocean-800 dark:text-ocean-50">
                  <p className="text-base font-semibold leading-relaxed">
                    “{t.quote}”
                  </p>
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-ocean-200 to-ocean-400 text-2xl shadow-soft">
                    {t.emoji}
                  </div>
                  <div>
                    <p className="font-heading text-lg text-ocean-800 dark:text-sand-200">
                      {t.name}
                    </p>
                    <p className="text-xs font-bold uppercase tracking-widest text-coral-500">
                      {t.role}
                    </p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA BANNER ---------- */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="coral-card flex flex-col items-center justify-between gap-6 p-8 text-center sm:p-12 lg:flex-row lg:text-left">
            <div>
              <span className="chip bg-white/70 text-coral-700">
                🐙 For Crew Members
              </span>
              <h2 className="mt-3 font-heading text-3xl leading-tight sm:text-4xl">
                Running a Krusty Krab of your own?
              </h2>
              <p className="mt-2 max-w-2xl text-base font-semibold opacity-80">
                Our dashboard helps you track sales, manage your crew, schedule
                events, and keep Plankton far, far away.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/dashboard" className="btn-primary !text-lg">
                Go to Dashboard
              </Link>
              <a href="#menu" className="btn-ghost !text-base">
                Explore Menu
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
