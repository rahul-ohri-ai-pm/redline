"use client";

import { useState } from "react";
import styles from "./report.module.css";

type State = "idle" | "copied" | "failed";

export function CopyButton({ text, label = "Copy counter-offer" }: { text: string; label?: string }) {
  const [state, setState] = useState<State>("idle");

  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("no clipboard");
      await navigator.clipboard.writeText(text);
      setState("copied");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("failed");
    }
  }

  return (
    <div className={styles.copyBox}>
      <button type="button" className={styles.copyBtn} onClick={copy}>
        {state === "copied" ? "Copied" : label}
      </button>
      <span role="status" className={styles.copyNote}>
        {state === "failed" ? "Copying didn't work. Select the text above and copy it by hand." : ""}
      </span>
    </div>
  );
}
