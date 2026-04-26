import React, { useEffect, useState } from "react";
import { FormEvent, ReactNode } from "react";
import PageHeader from "../components/PageHeader";
import Icon from "../components/Icon";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { apiJson } from "../lib/api";

const ACCENT_OPTIONS = [
  { id: "sand", label: "Sandy Yellow", color: "from-sand-300 to-sand-500" },
  { id: "ocean", label: "Ocean Blue", color: "from-ocean-300 to-ocean-500" },
  { id: "coral", label: "Coral Pink", color: "from-coral-300 to-coral-500" },
  { id: "seaweed", label: "Seaweed", color: "from-seaweed-400 to-seaweed-600" },
];

const AVATARS = ["🧽", "⭐", "🐿️", "🎷", "🦀", "🐋", "🐡", "🐌"];

type PrefKey =
  | "notifOrders"
  | "notifCrew"
  | "notifWeekly"
  | "soundFx"
  | "reduceMotion";

type ManagedUser = {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
};

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [accent, setAccent] = useState("sand");
  const [avatar, setAvatar] = useState("🐿️");
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "",
    bio: "Treedome research notes, karate breaks, and science-first documentation.",
  });

  useEffect(() => {
    if (!user) return;
    setProfile((p) => ({
      ...p,
      name: user.full_name || user.email.split("@")[0] || "Scientist",
      email: user.email,
      role: user.role,
    }));
  }, [user]);
  const [prefs, setPrefs] = useState({
    notifOrders: true,
    notifCrew: true,
    notifWeekly: false,
    soundFx: true,
    reduceMotion: false,
  });
  const [saved, setSaved] = useState(false);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [usersBusy, setUsersBusy] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    email: "",
    full_name: "",
    role: "viewer",
    password: "",
  });

  const togglePref = (key: PrefKey) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const handleSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void (async () => {
      try {
        await apiJson("/api/users/me", {
          method: "PATCH",
          body: JSON.stringify({ full_name: profile.name }),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (e: unknown) {
        setUsersError(e instanceof Error ? e.message : "Failed to update profile");
      }
    })();
  };

  const loadUsers = async () => {
    if (user?.role !== "admin") return;
    setUsersError(null);
    try {
      const rows = await apiJson<ManagedUser[]>("/api/users");
      setUsers(rows);
    } catch (e: unknown) {
      setUsersError(e instanceof Error ? e.message : "Failed to load users");
    }
  };

  useEffect(() => {
    void loadUsers();
  }, [user?.role]);

  const createUser = async () => {
    if (!newUser.email.trim() || !newUser.password.trim()) return;
    setUsersBusy(true);
    setUsersError(null);
    try {
      await apiJson("/api/users", {
        method: "POST",
        body: JSON.stringify(newUser),
      });
      setNewUser({ email: "", full_name: "", role: "viewer", password: "" });
      await loadUsers();
    } catch (e: unknown) {
      setUsersError(e instanceof Error ? e.message : "Failed to create user");
    } finally {
      setUsersBusy(false);
    }
  };

  const updateRole = async (u: ManagedUser, role: string) => {
    setUsersBusy(true);
    setUsersError(null);
    try {
      await apiJson(`/api/users/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      await loadUsers();
    } catch (e: unknown) {
      setUsersError(e instanceof Error ? e.message : "Failed to update role");
    } finally {
      setUsersBusy(false);
    }
  };

  const deleteUser = async (u: ManagedUser) => {
    if (!window.confirm(`Delete user ${u.email}?`)) return;
    setUsersBusy(true);
    setUsersError(null);
    try {
      await apiJson(`/api/users/${u.id}`, { method: "DELETE" });
      await loadUsers();
    } catch (e: unknown) {
      setUsersError(e instanceof Error ? e.message : "Failed to delete user");
    } finally {
      setUsersBusy(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <PageHeader
        emoji="⚙️"
        title="Settings"
        subtitle="Treedome preferences. Profile fields mirror your signed-in lab account (API)."
        actions={
          <>
            <button type="submit" className="btn-primary">
              {saved ? "Saved!" : "Save Changes"}
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Profile card */}
        <section className="glass-card p-5 sm:p-6 xl:col-span-1">
          <h3 className="font-heading text-xl text-ocean-800 dark:text-sand-200">
            Profile
          </h3>
          <p className="text-xs font-semibold uppercase tracking-widest text-coral-500">
            Who you are
          </p>

          <div className="mt-6 flex flex-col items-center text-center">
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-sand-200 to-sand-400 text-6xl shadow-bubble animate-bobble dark:border-white/30">
                {avatar}
              </div>
              <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-seaweed-500" />
            </div>
            <p className="mt-4 font-heading text-xl text-ocean-800 dark:text-sand-200">
              {profile.name}
            </p>
            <p className="text-xs font-bold uppercase tracking-widest text-coral-500">
              {profile.role}
            </p>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-ocean-700 dark:text-ocean-100/80">
              Pick an avatar
            </p>
            <div className="grid grid-cols-4 gap-2">
              {AVATARS.map((a) => (
                <button
                  type="button"
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`flex h-12 w-full items-center justify-center rounded-2xl border-2 text-2xl transition hover:-translate-y-0.5 ${
                    avatar === a
                      ? "border-coral-500 bg-coral-100/70 shadow-coral"
                      : "border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/5"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Profile form */}
        <section className="glass-card p-5 sm:p-6 xl:col-span-2">
          <h3 className="font-heading text-xl text-ocean-800 dark:text-sand-200">
            Personal information
          </h3>
          <p className="text-xs font-semibold uppercase tracking-widest text-coral-500">
            Update your details
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Email (from account)">
              <input type="email" value={profile.email} readOnly className="input opacity-80" />
            </Field>
            <Field label="Role" className="sm:col-span-2">
              <input type="text" value={profile.role} readOnly className="input opacity-80" />
            </Field>
            <Field label="Bio" className="sm:col-span-2">
              <textarea
                rows={4}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="input resize-none"
              />
            </Field>
          </div>
        </section>

        {/* Theme */}
        <section className="glass-card p-5 sm:p-6 xl:col-span-2">
          <h3 className="font-heading text-xl text-ocean-800 dark:text-sand-200">
            Appearance
          </h3>
          <p className="text-xs font-semibold uppercase tracking-widest text-coral-500">
            Daytime or Bikini Bottom Night
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`relative overflow-hidden rounded-3xl border-2 p-6 text-left transition hover:-translate-y-1 ${
                theme === "light"
                  ? "border-coral-500 shadow-coral"
                  : "border-white/60 dark:border-white/10"
              }`}
              style={{
                background:
                  "linear-gradient(180deg, #eaf8ff 0%, #cdeeff 55%, #9bdcff 100%)",
              }}
            >
              <div className="flex items-center gap-3">
                <Icon name="sun" className="h-6 w-6 text-sand-600" />
                <p className="font-heading text-xl text-ocean-900">Daytime</p>
              </div>
              <p className="mt-2 text-sm font-semibold text-ocean-800/80">
                Sunny surface-water vibes.
              </p>
              <div className="mt-4 flex gap-2">
                <span className="h-6 w-6 rounded-full bg-sand-400 shadow-soft" />
                <span className="h-6 w-6 rounded-full bg-ocean-400 shadow-soft" />
                <span className="h-6 w-6 rounded-full bg-coral-400 shadow-soft" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`relative overflow-hidden rounded-3xl border-2 p-6 text-left text-ocean-100 transition hover:-translate-y-1 ${
                theme === "dark"
                  ? "border-sand-400 shadow-sun"
                  : "border-white/60 dark:border-white/10"
              }`}
              style={{
                background:
                  "linear-gradient(180deg, #03132a 0%, #061e44 55%, #0a2d63 100%)",
              }}
            >
              <div className="flex items-center gap-3">
                <Icon name="moon" className="h-6 w-6 text-sand-300" />
                <p className="font-heading text-xl text-sand-200">
                  Bikini Bottom Night
                </p>
              </div>
              <p className="mt-2 text-sm font-semibold text-ocean-100/80">
                Deep-sea glow. Perfect for night shifts.
              </p>
              <div className="mt-4 flex gap-2">
                <span className="h-6 w-6 rounded-full bg-night-700 shadow-soft" />
                <span className="h-6 w-6 rounded-full bg-ocean-500 shadow-soft" />
                <span className="h-6 w-6 rounded-full bg-sand-400 shadow-soft" />
              </div>
            </button>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-ocean-700 dark:text-ocean-100/80">
              Accent color
            </p>
            <div className="flex flex-wrap gap-3">
              {ACCENT_OPTIONS.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => setAccent(a.id)}
                  className={`flex items-center gap-3 rounded-full border-2 bg-white/70 py-2 pl-2 pr-4 text-sm font-bold text-ocean-800 transition hover:-translate-y-0.5 dark:bg-white/5 dark:text-ocean-100 ${
                    accent === a.id
                      ? "border-coral-500 shadow-coral"
                      : "border-white/60 dark:border-white/10"
                  }`}
                >
                  <span
                    className={`h-6 w-6 rounded-full bg-gradient-to-br ${a.color} shadow-soft`}
                  />
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="glass-card p-5 sm:p-6 xl:col-span-1">
          <h3 className="font-heading text-xl text-ocean-800 dark:text-sand-200">
            Preferences
          </h3>
          <p className="text-xs font-semibold uppercase tracking-widest text-coral-500">
            Notifications &amp; behavior
          </p>

          <ul className="mt-5 space-y-3">
            <Toggle
              label="Order notifications"
              hint="Ping me when new orders come in."
              checked={prefs.notifOrders}
              onChange={() => togglePref("notifOrders")}
            />
            <Toggle
              label="Crew updates"
              hint="Get notified about team activity."
              checked={prefs.notifCrew}
              onChange={() => togglePref("notifCrew")}
            />
            <Toggle
              label="Weekly digest"
              hint="A Monday-morning recap of the reef."
              checked={prefs.notifWeekly}
              onChange={() => togglePref("notifWeekly")}
            />
            <Toggle
              label="Sound effects"
              hint="Bubble pops and patty flips."
              checked={prefs.soundFx}
              onChange={() => togglePref("soundFx")}
            />
            <Toggle
              label="Reduce motion"
              hint="Tone down bobbing and floating animations."
              checked={prefs.reduceMotion}
              onChange={() => togglePref("reduceMotion")}
            />
          </ul>
        </section>

        {user?.role === "admin" && (
          <section className="glass-card p-5 sm:p-6 xl:col-span-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-heading text-xl text-ocean-800 dark:text-sand-200">Manage users</h3>
                <p className="text-xs font-semibold uppercase tracking-widest text-coral-500">Admin only</p>
              </div>
              <button type="button" className="btn-ghost" onClick={() => void loadUsers()} disabled={usersBusy}>
                Refresh users
              </button>
            </div>

            {usersError && (
              <div className="mt-3 rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-900 dark:border-coral-500/30 dark:bg-coral-900/20 dark:text-coral-100">
                {usersError}
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
              <input
                className="input"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Full name"
                value={newUser.full_name}
                onChange={(e) => setNewUser((p) => ({ ...p, full_name: e.target.value }))}
              />
              <select
                className="input"
                value={newUser.role}
                onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))}
              >
                <option value="admin">admin</option>
                <option value="researcher">researcher</option>
                <option value="inventory">inventory</option>
                <option value="viewer">viewer</option>
              </select>
              <input
                className="input"
                type="password"
                placeholder="Temporary password"
                value={newUser.password}
                onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
              />
            </div>
            <div className="mt-3">
              <button type="button" className="btn-primary" onClick={() => void createUser()} disabled={usersBusy}>
                Create user
              </button>
            </div>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-white/50 dark:border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-white/50 bg-white/60 text-xs font-black uppercase tracking-widest text-ocean-600 dark:border-white/10 dark:bg-white/5 dark:text-ocean-200/80">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-white/40 dark:border-white/5">
                      <td className="px-4 py-3 font-bold">{u.id}</td>
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">{u.full_name || "—"}</td>
                      <td className="px-4 py-3">
                        <select
                          className="input !py-1"
                          value={u.role}
                          onChange={(e) => void updateRole(u, e.target.value)}
                          disabled={usersBusy}
                        >
                          <option value="admin">admin</option>
                          <option value="researcher">researcher</option>
                          <option value="inventory">inventory</option>
                          <option value="viewer">viewer</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="rounded-full bg-coral-500/90 px-3 py-1 text-sm font-bold text-white shadow-coral"
                          disabled={usersBusy || u.id === user.id}
                          onClick={() => void deleteUser(u)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

    </form>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-ocean-700 dark:text-ocean-100/80">
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-2xl border border-white/60 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="min-w-0">
        <p className="font-bold text-ocean-900 dark:text-ocean-50">{label}</p>
        <p className="text-xs font-semibold text-ocean-700/70 dark:text-ocean-100/70">
          {hint}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-7 w-12 flex-none items-center rounded-full transition ${
          checked
            ? "bg-gradient-to-r from-sand-400 to-coral-400 shadow-sun"
            : "bg-ocean-200 dark:bg-white/10"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-soft transition ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </li>
  );
}
