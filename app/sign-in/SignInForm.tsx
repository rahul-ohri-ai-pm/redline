"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { sendMagicLink } from "@/lib/supabase/auth";
import styles from "./sign-in.module.css";

const MESSAGES = {
  not_configured: "Sign-in isn't set up on this deployment, so there are no accounts here.",
  invalid_email: "That doesn't look like an email address.",
  send_failed: "We couldn't send the link. Try again in a minute.",
} as const;

export function SignInForm({ next }: { next: string | null }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "sending" }
    | { kind: "sent"; email: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "sending" });
    const result = await sendMagicLink(
      createBrowserSupabase(),
      email,
      window.location.origin,
      next,
    );
    setState(
      result.ok
        ? { kind: "sent", email: result.email }
        : { kind: "error", message: MESSAGES[result.reason] },
    );
  }

  return (
    <form onSubmit={onSubmit} className={styles.form} noValidate>
      <label htmlFor="email" className={styles.label}>
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={styles.input}
        aria-describedby="sign-in-status"
      />
      <button type="submit" className={styles.button} disabled={state.kind === "sending"}>
        {state.kind === "sending" ? "Sending" : "Send the link"}
      </button>
      <div id="sign-in-status" aria-live="polite">
        {state.kind === "sent" && (
          <p className={styles.sent}>
            We sent a link to {state.email}. It can take a minute. If it isn&apos;t in your
            inbox, check spam.
          </p>
        )}
        {state.kind === "error" && <p className={styles.error}>{state.message}</p>}
      </div>
    </form>
  );
}
