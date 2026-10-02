"use client";

import { useId, useState } from "react";
import {
  availableFileTypeLabels,
  parseFile,
  parsePastedText,
  type ParseOutcome,
} from "@/lib/parse";
import styles from "./UploadPreview.module.css";

/**
 * Picks a file or takes pasted text, runs it through the `parseFile` seam,
 * and shows the extracted text. Everything here happens in the browser: no
 * fetch, no form post. The previewed string is the frozen string that later
 * steps will receive.
 */
export function UploadPreview() {
  const fileId = useId();
  const pasteId = useId();
  const [source, setSource] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<ParseOutcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [pasted, setPasted] = useState("");

  const supported = availableFileTypeLabels().join(", ");

  async function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setSource(file.name);
    setOutcome(await parseFile(file));
    setBusy(false);
    // Let the same file be picked again after a change on disk.
    event.target.value = "";
  }

  function onPreviewPasted() {
    setSource("Pasted text");
    setOutcome(parsePastedText(pasted));
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
    <div className={styles.page}>
      <h1 className={styles.h1}>Add a document</h1>
      <p className={styles.lede}>
        Redline reads your file in this browser and doesn&rsquo;t upload it. Later
        steps send only the extracted text. File types it can read: {supported}.
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
  );
}
