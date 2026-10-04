"use client";

import { useId, useRef, useState } from "react";
import { titleFromFileName } from "@/lib/documents/client";
import { requestGate } from "@/lib/gate/client";
import type { GateOutcome } from "@/lib/gate/types";
import {
  availableFileTypeLabels,
  parseFile,
  parsePastedText,
  type ParseOutcome,
} from "@/lib/parse";
import { TopStrip } from "../TopStrip";
import { AnalyzePanel, type ProfileStatus } from "./AnalyzePanel";
import styles from "./UploadPreview.module.css";

const REFUSED_LABEL = {
  "freelance-agreement": "a freelance agreement",
  "terms-of-service": "Terms of Service",
  other: "something other than a lease",
} as const;

/**
 * Picks a file or takes pasted text, runs it through the `parseFile` seam,
 * and shows the extracted text. Everything here happens in the browser: no
 * fetch, no form post. The previewed string is the frozen string that later
 * steps will receive.
 */
export function UploadPreview({ profileStatus }: { profileStatus: ProfileStatus }) {
  const fileId = useId();
  const pasteId = useId();
  const [source, setSource] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<ParseOutcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [pasted, setPasted] = useState("");
  const [gate, setGate] = useState<GateOutcome | "checking" | null>(null);
  // Only the latest check may set state; an older answer for replaced text is dropped.
  const gateRun = useRef(0);

  async function runGate(text: string) {
    const run = ++gateRun.current;
    setGate("checking");
    const result = await requestGate(text);
    if (run === gateRun.current) setGate(result);
  }

  function handleOutcome(next: ParseOutcome) {
    setOutcome(next);
    if (next.ok) void runGate(next.text);
    else {
      gateRun.current++;
      setGate(null);
    }
  }

  const supported = availableFileTypeLabels().join(", ");

  async function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setSource(file.name);
    gateRun.current++;
    setGate(null);
    const parsed = await parseFile(file);
    setBusy(false);
    handleOutcome(parsed);
    // Let the same file be picked again after a change on disk.
    event.target.value = "";
  }

  function onPreviewPasted() {
    setSource("Pasted text");
    handleOutcome(parsePastedText(pasted));
  }

  const skipped =
    outcome?.ok === true ? outcome.sections.filter((s) => !s.readable) : [];
  // PDF sections are pages, DOCX sections are paragraphs, text sections are paragraphs of pasted text.
  const unit =
    skipped.length > 0 && skipped.every((s) => s.id.startsWith("page-"))
      ? "page"
      : skipped.length > 0 && skipped.every((s) => s.id.startsWith("block-"))
        ? "paragraph"
        : "section";

  return (
    <>
      <TopStrip
        name="Add a document"
        aside={source && outcome?.ok ? <span>{source}</span> : undefined}
      />
      <div className={styles.page}>
        <p className={styles.lede}>
          Redline reads your file in this browser and never uploads it. Only the
          extracted text is sent to the server, to check what kind of document it
          is and, once you analyze it, to run the analysis. File types it can read: {supported}.
        </p>

        <div className={styles.inputs}>
          <div className={styles.field}>
            <label htmlFor={fileId} className={styles.label}>
              Pick a file
            </label>
            <input
              id={fileId}
              type="file"
              className={styles.file}
              onChange={onPickFile}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor={pasteId} className={styles.label}>
              Or paste the text
            </label>
            <textarea
              id={pasteId}
              className={styles.textarea}
              rows={6}
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
            />
            <button
              type="button"
              className={styles.button}
              onClick={onPreviewPasted}
              disabled={pasted.trim() === ""}
            >
              Show the text
            </button>
          </div>
        </div>

        <div aria-live="polite" className={styles.result}>
          {busy && <p className={styles.status}>Reading the file&hellip;</p>}

          {!busy && outcome && !outcome.ok && (
            <div className={styles.refusal} role="alert">
              <p className={styles.noticeTitle}>
                {source === "Pasted text" ? "Couldn’t read that text" : `Couldn’t read ${source}`}
              </p>
              <p>{outcome.reason}</p>
            </div>
          )}

          {!busy && outcome?.ok && (
            <>
              {skipped.length > 0 && (
                <div className={styles.skipped} role="status">
                  <p className={styles.noticeTitle}>
                    {skipped.length === 1
                      ? `1 ${unit} couldn’t be read`
                      : `${skipped.length} ${unit}s couldn’t be read`}
                  </p>
                  <p>
                    Redline leaves these out and says nothing about them. Check
                    them yourself.
                  </p>
                  <ul className={styles.skippedList}>
                    {skipped.map((s) => (
                      <li key={s.id}>
                        <span className={styles.sectionId}>
                          {s.id.replace(/^block-/, "paragraph ").replace("-", " ")}
                        </span>
                        {!s.readable && ` ${s.reason}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {gate === "checking" && (
                <p className={styles.status}>Checking what kind of document this is&hellip;</p>
              )}

              {gate && gate !== "checking" && gate.status === "pass" && (
                <div className={styles.pass} role="status">
                  <p className={styles.noticeTitle}>This looks like a residential lease</p>
                  <p>Redline reads documents like this one.</p>
                </div>
              )}

              {gate && gate !== "checking" && gate.status === "pass" && (
                <AnalyzePanel
                  key={`${source}:${outcome.text.length}:${outcome.text.slice(0, 40)}`}
                  text={outcome.text}
                  sections={outcome.sections}
                  defaultTitle={source === "Pasted text" ? "" : titleFromFileName(source)}
                  profileStatus={profileStatus}
                />
              )}

              {gate && gate !== "checking" && gate.status === "refused" && (
                <div className={styles.refusal} role="alert">
                  <p className={styles.noticeTitle}>
                    Redline doesn&rsquo;t read this type of document yet
                  </p>
                  <p>
                    This looks like {REFUSED_LABEL[gate.documentType]}. Redline only
                    reads residential leases for now.
                  </p>
                </div>
              )}

              {gate && gate !== "checking" && gate.status === "error" && (
                <div className={styles.refusal} role="alert">
                  <p className={styles.noticeTitle}>Couldn&rsquo;t check the document type</p>
                  <p>{gate.message}</p>
                  <button
                    type="button"
                    className={styles.button}
                    onClick={() => void runGate(outcome.text)}
                  >
                    Retry
                  </button>
                </div>
              )}

              <h2 className={styles.h2}>Text from {source}</h2>
              <p className={styles.hint}>
                Redline will work from exactly this text. Check it against your
                document.
              </p>
              <pre className={styles.preview} tabIndex={0} aria-label="Extracted text">
                {outcome.text}
              </pre>
            </>
          )}
        </div>
      </div>
    </>
  );
}
