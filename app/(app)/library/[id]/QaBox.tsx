"use client";

import { useRef, useState } from "react";
import { MAX_QUESTION_CHARS } from "@/lib/ask/limits";
import { requestAnswer, type AskResult } from "@/lib/ask/client";
import styles from "./qa.module.css";

type Entry = {
  key: number;
  question: string;
  /** null while waiting for the server. */
  outcome: Exclude<AskResult, { status: "signed-out" }> | null;
};

const GROUNDING_LABEL = {
  document: "From your document",
  "state-standard": "From state data",
  both: "From your document and state data",
} as const;

function refusalLabel(reason: string): string {
  return reason === "general-advice-not-grounded" ? "Advice, not a fact" : "Not in your document or state data";
}

/**
 * Ask a question about this saved document. History lives in component
 * state only: newest question first, gone on reload, never stored.
 */
export function QaBox({ documentId }: { documentId: string }) {
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const nextKey = useRef(1);
  const waiting = entries.some((e) => e.outcome === null);

  async function run(key: number, question: string) {
    const result = await requestAnswer(documentId, question);
    const outcome: Entry["outcome"] =
      result.status === "signed-out"
        ? { status: "error", message: "You're signed out. Sign in again, then ask." }
        : result;
    setEntries((list) => list.map((e) => (e.key === key ? { ...e, outcome } : e)));
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const question = text.trim();
    if (waiting) return;
    if (question === "") {
      setFormError("Type a question first.");
      return;
    }
    if (question.length > MAX_QUESTION_CHARS) {
      setFormError(`Keep it under ${MAX_QUESTION_CHARS} characters.`);
      return;
    }
    setFormError(null);
    const key = nextKey.current++;
    setEntries((list) => [{ key, question, outcome: null }, ...list]);
    setText("");
    void run(key, question);
  }

  function retry(key: number, question: string) {
    if (waiting) return;
    setEntries((list) => list.map((e) => (e.key === key ? { ...e, outcome: null } : e)));
    void run(key, question);
  }

  return (
    <section className={styles.box} aria-labelledby="qa-heading">
      <h2 id="qa-heading" className={styles.h2}>
        Ask about this document
      </h2>
      <p className={styles.note}>
        Answers come from your lease text or your state&apos;s reference data. Anything else gets a refusal. This list
        clears when you leave the page.
      </p>
      <form onSubmit={submit} className={styles.form}>
        <label htmlFor="qa-input" className={styles.label}>
          Your question
        </label>
        <textarea
          id="qa-input"
          className={styles.input}
          rows={2}
          value={text}
          maxLength={MAX_QUESTION_CHARS}
          onChange={(e) => setText(e.target.value)}
          aria-describedby={formError ? "qa-form-error" : undefined}
        />
        {formError && (
          <p id="qa-form-error" role="alert" className={styles.formError}>
            {formError}
          </p>
        )}
        <div>
          <button type="submit" className={styles.submit} disabled={waiting}>
            {waiting ? "Asking..." : "Ask"}
          </button>
        </div>
      </form>

      {entries.length === 0 ? (
        <p className={styles.note}>No questions yet.</p>
      ) : (
        <ol className={styles.history} aria-live="polite">
          {entries.map((e) => (
            <li key={e.key} className={styles.entry}>
              <span className={styles.label}>You asked</span>
              <p className={styles.question}>{e.question}</p>
              {e.outcome === null && (
                <p role="status" className={styles.wait}>
                  Checking your document...
                </p>
              )}
              {e.outcome?.status === "answer" && (
                <div className={styles.answer}>
                  <span className={styles.chip}>{GROUNDING_LABEL[e.outcome.groundedIn]}</span>
                  <p>{e.outcome.text}</p>
                  {e.outcome.sourceSentences.length > 0 && (
                    <>
                      <span className={styles.label}>Quoted from your document</span>
                      {e.outcome.sourceSentences.map((s, i) => (
                        <blockquote key={i} className={styles.quote}>
                          {s}
                        </blockquote>
                      ))}
                    </>
                  )}
                </div>
              )}
              {e.outcome?.status === "refusal" && (
                <div className={styles.refusal}>
                  <span className={styles.refusalChip}>{refusalLabel(e.outcome.reason)}</span>
                  <p>{e.outcome.text}</p>
                </div>
              )}
              {e.outcome?.status === "error" && (
                <div role="alert" className={styles.error}>
                  <p>{e.outcome.message}</p>
                  <button type="button" className={styles.retry} disabled={waiting} onClick={() => retry(e.key, e.question)}>
                    Retry
                  </button>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
