"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteDocumentAction } from "./actions";
import styles from "./library.module.css";

export function DeleteButton({
  id,
  title,
  redirectTo,
}: {
  id: string;
  title: string;
  /** Where to go after deleting. Omit to stay on the page and refresh it. */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    setError(null);
    startTransition(async () => {
      let result;
      try {
        result = await deleteDocumentAction(id);
      } catch {
        setError("Couldn't delete this document. It's still in your library. Try again.");
        return;
      }
      if (result.ok || result.reason === "not-found") {
        if (redirectTo) router.push(redirectTo);
        router.refresh();
        return;
      }
      setError(result.message);
    });
  }

  if (!confirming) {
    return (
      <div className={styles.deleteBox}>
        <button
          type="button"
          className={styles.deleteBtn}
          aria-label={`Delete ${title}`}
          onClick={() => setConfirming(true)}
        >
          Delete
        </button>
      </div>
    );
  }

  return (
    <div className={styles.deleteBox} role="group" aria-label={`Confirm deleting ${title}`}>
      <p className={styles.deleteWarn}>
        Delete this document and its report? The saved text is removed for good.
      </p>
      <div className={styles.deleteActions}>
        <button type="button" className={styles.deleteConfirm} onClick={confirm} disabled={pending}>
          {pending ? "Deleting" : "Yes, delete it"}
        </button>
        <button
          type="button"
          className={styles.deleteBtn}
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          disabled={pending}
        >
          Keep it
        </button>
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
