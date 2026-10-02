"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { Section } from "@/lib/analysis/types";
import { requestAnalysis, type AnalyzeResult } from "@/lib/documents/client";
import styles from "./AnalyzePanel.module.css";

export interface ProfileSummary {
  state: string;
  pets?: boolean;
  jointLease?: boolean;
  renterType?: string;
  redLineCount: number;
}

/** What the server could tell us about the signed-in renter's profile. */
export type ProfileStatus =
  | { kind: "signed-out" }
  | { kind: "none" }
  | { kind: "failed" }
  | { kind: "saved"; profile: ProfileSummary };

const yesNo = (v: boolean | undefined) => (v === undefined ? "not given" : v ? "yes" : "no");

function describeProfile(p: ProfileSummary): string {
  const parts = [
    `State: ${p.state}`,
    `pets: ${yesNo(p.pets)}`,
    `joint lease: ${yesNo(p.jointLease)}`,
    `renter type: ${p.renterType ?? "not given"}`,
    p.redLineCount === 1 ? "1 red line" : `${p.redLineCount} red lines`,
  ];
  return parts.join(", ");
}

/**
 * Shown once the gate has passed: title, the profile that will be used, and
 * the Analyze button. Sends only the previewed text, its sections and the
 * title.
 */
export function AnalyzePanel({
  text,
  sections,
  defaultTitle,
  profileStatus,
}: {
  text: string;
  sections: Section[];
  defaultTitle: string;
  profileStatus: ProfileStatus;
}) {
  const titleId = useId();
  const [title, setTitle] = useState(defaultTitle);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  if (profileStatus.kind === "signed-out") {
    return (
      <div className={styles.panel}>
        <p className={styles.title}>Sign in to analyze this document</p>
        <p className={styles.body}>
          Analysis and the library need an account. After you sign in, add the
          document again.
        </p>
        <Link className={styles.link} href="/sign-in?next=%2Fnew">
          Sign in
        </Link>
      </div>
    );
  }

  const saved = result?.status === "saved" ? result : null;
  const canAnalyze =
    profileStatus.kind === "saved" && title.trim() !== "" && !busy && !saved;

  async function onAnalyze() {
    setBusy(true);
    setResult(null);
    const outcome = await requestAnalysis({ text, sections, title });
    setBusy(false);
    setResult(outcome);
  }

  return (
    <div className={styles.panel}>
      <p className={styles.title}>Analyze this document</p>

      <div className={styles.field}>
        <label htmlFor={titleId} className={styles.label}>
          Title
        </label>
        <input
          id={titleId}
          className={styles.input}
          type="text"
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          disabled={busy || saved !== null}
        />
        <p className={styles.hint}>The title is the only name Redline saves.</p>
      </div>

      {profileStatus.kind === "none" && (
        <p className={styles.body}>
          You haven&rsquo;t saved a profile yet. Redline needs your state before it can
          analyze a lease. <Link className={styles.inline} href="/profile">Set up your profile</Link>,
          then come back and add the document again.
        </p>
      )}
      {profileStatus.kind === "failed" && (
        <p className={styles.body} role="alert">
          Your saved profile didn&rsquo;t load. Reload the page to try again.
        </p>
      )}
      {profileStatus.kind === "saved" && (
        <p className={styles.body}>
          {describeProfile(profileStatus.profile)}.{" "}
          <Link className={styles.inline} href="/profile">
            Edit profile
          </Link>
        </p>
      )}

      <div>
        <button type="button" className={styles.button} onClick={onAnalyze} disabled={!canAnalyze}>
          {busy ? "Analyzing…" : "Analyze"}
        </button>
      </div>

      <div aria-live="polite">
        {busy && <p className={styles.status}>This can take a minute. Keep this tab open.</p>}

        {saved && (
          <p className={styles.body} role="status">
            Saved to your library as &ldquo;{saved.title || title.trim()}&rdquo;.{" "}
            <Link className={styles.inline} href={`/library/${saved.id}`}>
              Open it
            </Link>
          </p>
        )}

        {result?.status === "signed-out" && (
          <p className={styles.error} role="alert">
            Your session ended.{" "}
            <Link className={styles.inline} href="/sign-in?next=%2Fnew">
              Sign in again
            </Link>{" "}
            and add the document again.
          </p>
        )}
        {result?.status === "no-profile" && (
          <p className={styles.error} role="alert">
            Save your profile first so Redline knows your state.{" "}
            <Link className={styles.inline} href="/profile">
              Set up your profile
            </Link>
          </p>
        )}
        {result?.status === "refused" && (
          <p className={styles.error} role="alert">
            Redline only reads residential leases for now.
          </p>
        )}
        {result?.status === "error" && (
          <p className={styles.error} role="alert">
            {result.message}
          </p>
        )}
      </div>
    </div>
  );
}
