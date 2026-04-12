"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "login" | "register";

export function AuthCard() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    setError("");

    const response = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        ...(mode === "register" ? { name } : {}),
      }),
    });

    const data = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }

    router.push("/home");
    router.refresh();
  }

  return (
    <section className="auth-card">
      <div className="brand-mark">∞</div>
      <p className="eyebrow">Personal Command Center</p>
      <h1>{mode === "login" ? "Welcome back to Loops" : "Create your Loops account"}</h1>
      <p className="muted-copy">
        Work inside threads, keep the next move visible, and trust that Later will bring things back.
      </p>

      <div className="auth-toggle">
        <button className={mode === "login" ? "is-active" : ""} onClick={() => setMode("login")} type="button">
          Sign in
        </button>
        <button className={mode === "register" ? "is-active" : ""} onClick={() => setMode("register")} type="button">
          Create account
        </button>
      </div>

      <div className="auth-form">
        {mode === "register" ? (
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ash" />
          </label>
        ) : null}

        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
          />
        </label>

        {error ? <div className="banner banner-error">{error}</div> : null}

        <button className="primary-button" disabled={pending} onClick={submit} type="button">
          {pending ? "Please wait..." : mode === "login" ? "Enter Loops" : "Create account"}
        </button>
      </div>

      <p className="helper-copy">
        After setup you can point `DATABASE_URL` at your own Postgres instance and self-host the app anywhere.
      </p>
    </section>
  );
}
