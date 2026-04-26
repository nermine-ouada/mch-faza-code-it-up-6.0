import React, { FormEvent, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

export default function Login() {
  const { user, login, register } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/dashboard";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password, fullName || undefined);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Request failed";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-ocean-50 via-sand-100 to-coral-100 px-4 py-12 dark:from-night-900 dark:via-night-800 dark:to-night-900">
      <div className="absolute inset-0 opacity-40 dark:opacity-20">
        <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-ocean-200 blur-3xl" />
        <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-sand-300 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md rounded-3xl border border-white/60 bg-white/80 p-8 shadow-bubble backdrop-blur-xl dark:border-white/10 dark:bg-night-800/80">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="animate-bobble">
            <Logo size={56} />
          </div>
          <h1 className="mt-3 font-heading text-2xl text-ocean-900 dark:text-sand-100">
            Sandy&apos;s Treedome Lab
          </h1>
          <p className="mt-1 text-sm font-semibold text-ocean-700/80 dark:text-ocean-100/70">
            Sign in to manage projects, inventory, and experiments.
          </p>
        </div>

        <div className="mb-4 flex rounded-full bg-white/70 p-1 dark:bg-white/5">
          <button
            type="button"
            className={`flex-1 rounded-full py-2 text-sm font-bold transition ${
              mode === "login"
                ? "bg-gradient-to-r from-sand-300 to-sand-500 text-ocean-900 shadow-sun"
                : "text-ocean-600 dark:text-ocean-200"
            }`}
            onClick={() => setMode("login")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`flex-1 rounded-full py-2 text-sm font-bold transition ${
              mode === "register"
                ? "bg-gradient-to-r from-sand-300 to-sand-500 text-ocean-900 shadow-sun"
                : "text-ocean-600 dark:text-ocean-200"
            }`}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === "register" && (
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-ocean-700 dark:text-ocean-200/80">
                Full name
              </span>
              <input
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Sandy Cheeks"
              />
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-ocean-700 dark:text-ocean-200/80">
              Email
            </span>
            <input
              className="input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-ocean-700 dark:text-ocean-200/80">
              Password
            </span>
            <input
              className="input"
              type="password"
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && (
            <p className="rounded-2xl border border-coral-200 bg-coral-50 px-3 py-2 text-sm font-semibold text-coral-800 dark:border-coral-500/40 dark:bg-coral-900/30 dark:text-coral-100">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full !py-3" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Enter lab" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs font-semibold text-ocean-600 dark:text-ocean-200/70">
          First registration becomes <strong>admin</strong> so you can seed the lab.
        </p>

        <Link
          to="/"
          className="mt-4 block text-center text-sm font-bold text-ocean-700 underline-offset-4 hover:underline dark:text-sand-200"
        >
          ← Back to landing
        </Link>
      </div>
    </div>
  );
}
