"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKey, MoonStars, ShieldCheck, SpinnerGap } from "@phosphor-icons/react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to sign in.");

      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next && next.startsWith("/") ? next : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <div className="login-grid" />
      <div className="login-orb login-orb-one" />
      <div className="login-orb login-orb-two" />

      <section className="login-stage">
        <div className="login-brand">
          <span><MoonStars weight="fill" /></span>
          <div><b>DSA</b><small>COMMAND CENTER</small></div>
        </div>

        <div className="login-copy">
          <p className="eyebrow">PRIVATE TRAINING WORKSPACE</p>
          <h1>Access your<br/><em>practice system.</em></h1>
          <p>Your progress, notes, streaks and daily missions remain synced securely across your devices.</p>
          <div className="login-security"><ShieldCheck weight="fill"/><span>Server-protected dashboard and progress API</span></div>
        </div>
      </section>

      <section className="login-panel-wrap">
        <form className="login-panel glass" onSubmit={submit}>
          <div className="login-lock"><LockKey weight="fill" /></div>
          <p className="eyebrow">AUTHORISATION REQUIRED</p>
          <h2>Welcome back, Aakarsh.</h2>
          <p className="login-subtitle">Enter the credentials configured in your Vercel environment.</p>

          <label>
            <span>Username</span>
            <input
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter username"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              required
            />
          </label>

          {error && <div className="login-error">{error}</div>}

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? <><SpinnerGap className="spin" /> Verifying</> : "Enter command center"}
          </button>
          <small className="login-footnote">Session stays active for 30 days on this browser.</small>
        </form>
      </section>
    </main>
  );
}
