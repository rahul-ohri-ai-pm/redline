"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import { requestRerun } from "@/lib/documents/client";
import { saveProfile, type ProfileFormState } from "./actions";
import { skippedFields } from "@/lib/profile/skipped";
import type { ProfileAnswers, SavedProfile } from "@/lib/profile/types";
import styles from "./profile.module.css";

const OTHER = "OTHER";

// Display names only. Which states are offered comes from the state-standard data.
const STATE_NAMES: Record<string, string> = {
  CA: "California",
  NY: "New York",
  TX: "Texas",
};

const triToValue = (v: boolean | undefined) => (v === undefined ? "" : v ? "yes" : "no");
const valueToTri = (v: string): boolean | undefined =>
  v === "yes" ? true : v === "no" ? false : undefined;

interface Line {
  key: string;
  id: string | null;
  text: string;
}

let counter = 0;
const nextKey = () => `line-${++counter}`;

export function ProfileForm({
  states,
  renterTypes,
  maxRedLines,
  initial,
  rerunId = null,
}: {
  states: string[];
  renterTypes: string[];
  maxRedLines: number;
  initial: SavedProfile | null;
  /** A saved document to re-run once the profile is saved. */
  rerunId?: string | null;
}) {
  const router = useRouter();
  const [rerun, setRerun] = useState<"idle" | "running" | { error: string }>("idle");
  const [result, formAction, pending] = useActionState<ProfileFormState, FormData>(saveProfile, {
    status: "idle",
  });

  const [state, setState] = useState(initial?.answers.state ?? "");
  const [pets, setPets] = useState(triToValue(initial?.answers.pets));
  const [joint, setJoint] = useState(triToValue(initial?.answers.jointLease));
  const [renterType, setRenterType] = useState(initial?.answers.renterType ?? "");
  const [lines, setLines] = useState<Line[]>(
    (initial?.redLines ?? []).map((l) => ({ key: nextKey(), id: l.id, text: l.text })),
  );

  useEffect(() => {
    if (!rerunId || result.status !== "saved") return;
    let cancelled = false;
    setRerun("running");
    requestRerun(rerunId).then((r) => {
      if (cancelled) return;
      if (r.status === "done") {
        router.push(`/library/${r.id}`);
        router.refresh();
      } else if (r.status === "signed-out") {
        router.push("/sign-in");
      } else {
        setRerun({
          error:
            r.status === "no-profile"
              ? "Save your profile first so Redline knows your state."
              : r.message,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [result, rerunId, router]);

  const uncovered = state === OTHER;
  const skipped = useMemo(() => {
    const a: ProfileAnswers = { state };
    const p = valueToTri(pets);
    const j = valueToTri(joint);
    if (p !== undefined) a.pets = p;
    if (j !== undefined) a.jointLease = j;
    if (renterType) a.renterType = renterType;
    return skippedFields(a);
  }, [state, pets, joint, renterType]);

  const errors = result.status === "error" ? result.errors : {};

  function move(index: number, delta: number) {
    setLines((cur) => {
      const target = index + delta;
      if (target < 0 || target >= cur.length) return cur;
      const copy = [...cur];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  const payload = JSON.stringify(lines.map((l) => ({ id: l.id, text: l.text })));

  return (
    <form action={formAction} className={styles.form} noValidate>
      <fieldset className={styles.group}>
        <legend className={styles.legend}>About you</legend>

        <div className={styles.field}>
          <label htmlFor="state" className={styles.label}>
            State (required)
          </label>
          <select
            id="state"
            name="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className={styles.select}
            aria-describedby="state-note"
            required
          >
            <option value="">Choose your state</option>
            {states.map((code) => (
              <option key={code} value={code}>
                {STATE_NAMES[code] ?? code}
              </option>
            ))}
            <option value={OTHER}>My state isn&apos;t listed</option>
          </select>
          <div id="state-note" aria-live="polite">
            {uncovered && (
              <p className={styles.blocker}>
                Redline has no rules for your state yet, so it can&apos;t analyze a lease there.
                You can&apos;t continue.</p>
            )}
            {errors.state && !uncovered && <p className={styles.error}>{errors.state}</p>}
          </div>
        </div>

        <div className={styles.row}>
          <TriField id="pets" label="Pets" value={pets} onChange={setPets} error={errors.pets} />
          <TriField
            id="jointLease"
            label="Joint lease"
            value={joint}
            onChange={setJoint}
            error={errors.jointLease}
          />
          <div className={styles.field}>
            <label htmlFor="renterType" className={styles.label}>
              Renter type
            </label>
            <select
              id="renterType"
              name="renterType"
              value={renterType}
              onChange={(e) => setRenterType(e.target.value)}
              className={styles.select}
            >
              <option value="">Skip</option>
              {renterTypes.map((t) => (
                <option key={t} value={t}>
                  {t[0].toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
            {errors.renterType && <p className={styles.error}>{errors.renterType}</p>}
          </div>
        </div>

        {skipped.length > 0 && (
          <p className={styles.warning} role="status">
            Skipped: {skipped.join(", ")}. Flags that depend on{" "}
            {skipped.length === 1 ? "it" : "these"} will be less precise. Skipped questions are
            saved as not provided.</p>
        )}
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Your red lines</legend>
        <p className={styles.hint}>
          Terms you won&apos;t accept, in your own words. Put the ones that matter most first.
        </p>

        {lines.length === 0 ? (
          <p className={styles.empty}>No red lines yet. Add the first term you refuse to sign.</p>
        ) : (
          <ol className={styles.lines}>
            {lines.map((line, i) => (
              <li key={line.key} className={styles.line}>
                <label htmlFor={line.key} className={styles.srOnly}>
                  Red line {i + 1}
                </label>
                <input
                  id={line.key}
                  type="text"
                  value={line.text}
                  maxLength={300}
                  onChange={(e) =>
                    setLines((cur) =>
                      cur.map((l) => (l.key === line.key ? { ...l, text: e.target.value } : l)),
                    )
                  }
                  className={styles.input}
                />
                <div className={styles.lineActions}>
                  <button
                    type="button"
                    className={styles.small}
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move red line ${i + 1} up`}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className={styles.small}
                    onClick={() => move(i, 1)}
                    disabled={i === lines.length - 1}
                    aria-label={`Move red line ${i + 1} down`}
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    className={styles.small}
                    onClick={() => setLines((cur) => cur.filter((l) => l.key !== line.key))}
                    aria-label={`Remove red line ${i + 1}`}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
        {errors.redLines && <p className={styles.error}>{errors.redLines}</p>}
        <button
          type="button"
          className={styles.secondary}
          disabled={lines.length >= maxRedLines}
          onClick={() => setLines((cur) => [...cur, { key: nextKey(), id: null, text: "" }])}
        >
          Add a red line
        </button>
        <input type="hidden" name="redLines" value={payload} />
      </fieldset>

      <div className={styles.submitRow}>
        <button type="submit" className={styles.button} disabled={pending || rerun === "running" || uncovered || !state}>
          {rerun === "running"
            ? "Re-running"
            : pending
              ? "Saving"
              : rerunId
                ? "Save and re-run"
                : "Save profile"}
        </button>
        <div aria-live="polite">
          {result.status === "saved" && <p className={styles.saved}>Saved.</p>}
          {typeof rerun === "object" && (
            <p role="alert" className={styles.error}>
              {rerun.error} Your profile is saved. Use Save and re-run to try again.
            </p>
          )}
          {errors.form && (
            <p role="alert" className={styles.error}>
              {errors.form}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}

function TriField({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.select}
      >
        <option value="">Skip</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
