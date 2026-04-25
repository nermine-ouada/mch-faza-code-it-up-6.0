import React from "react";
import Badge from "./Badge";
import Icon from "./Icon";

const STATUS_DOT = {
  online: "bg-seaweed-500",
  away: "bg-sand-500",
  busy: "bg-coral-500",
  offline: "bg-ocean-400",
};

export default function TeamMemberCard({ member }) {
  return (
    <article className="glass-card group relative overflow-hidden p-6 text-center transition hover:-translate-y-1 hover:shadow-bubble">
      {/* Decorative top wave */}
      <div
        className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${member.bg}`}
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 top-[84px] h-10"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-white text-5xl shadow-bubble animate-bobble dark:border-white/30 dark:bg-white/10">
          {member.emoji}
        </div>
        <span
          className={`absolute bottom-1 left-1/2 h-4 w-4 -translate-x-1/2 translate-x-[22px] rounded-full border-2 border-white ${
            STATUS_DOT[member.status] || STATUS_DOT.offline
          }`}
          aria-label={`${member.status} status`}
        />
      </div>

      <h3 className="mt-4 font-heading text-xl text-ocean-800 dark:text-sand-200">
        {member.name}
      </h3>
      <p className="text-xs font-bold uppercase tracking-widest text-coral-500">
        {member.role}
      </p>

      <div className="mt-3 flex justify-center">
        <Badge status={member.status} />
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {member.skills.map((s) => (
          <span
            key={s}
            className="chip bg-white/80 text-ocean-700 dark:bg-white/10 dark:text-ocean-100"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="mt-5 flex justify-center gap-2">
        <button
          className="btn-ghost !px-3 !py-2"
          aria-label={`Email ${member.name}`}
          title={member.email}
        >
          <Icon name="mail" className="h-4 w-4" />
        </button>
        <button
          className="btn-ghost !px-3 !py-2"
          aria-label={`Call ${member.name}`}
          title={member.phone}
        >
          <Icon name="phone" className="h-4 w-4" />
        </button>
        <button className="btn-ghost !px-3 !py-2" aria-label={`Chat with ${member.name}`}>
          <Icon name="chat" className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
