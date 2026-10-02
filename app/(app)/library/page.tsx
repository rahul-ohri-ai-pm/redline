import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseDocumentStore } from "@/lib/documents/supabase-store";
import { listLibrary, type LibraryEntry } from "@/lib/library/load";
import { BUCKET_LABEL, VERDICT_LABEL, formatSavedDate } from "@/lib/library/labels";
import { createServerSupabase, requireUser } from "@/lib/supabase/server";
import styles from "./library.module.css";

export const metadata: Metadata = {
  title: "Library - Redline",
};

export default async function LibraryPage() {
  const user = await requireUser("/library");
  const client = await createServerSupabase();

  let entries: LibraryEntry[] = [];
  let loadFailed = false;
  if (client) {
    try {
      entries = await listLibrary(createSupabaseDocumentStore(client), user.id);
    } catch {
      loadFailed = true;
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>Library</h1>
      {loadFailed ? (
        <p role="alert" className={styles.error}>
          Your documents didn&apos;t load. Reload the page to try again.
        </p>
      ) : entries.length === 0 ? (
        <div className={styles.empty}>
          <p>
            Nothing here yet. Paste or upload a lease and its report will be saved to this list.
          </p>
          <Link href="/new" className={styles.cta}>
            Analyze a document
          </Link>
        </div>
      ) : (
        <ul className={styles.list}>
          {entries.map((e) => (
            <li key={e.id}>
              <Link href={`/library/${e.id}`} className={styles.row}>
                <span className={styles.rowTitle}>{e.title}</span>
                <span className={styles.rowMeta}>
                  {formatSavedDate(e.createdAt)}
                  {e.state ? ` · ${e.state}` : ""}
                </span>
                <span className={styles.chips}>
                  <span className={styles.chip}>{VERDICT_LABEL[e.verdict]}</span>
                  {e.tallies["remove-modify"] > 0 && (
                    <span className={`${styles.chip} ${styles.chipRemove}`}>
                      {e.tallies["remove-modify"]} {BUCKET_LABEL["remove-modify"]}
                    </span>
                  )}
                  {e.tallies["push-on"] > 0 && (
                    <span className={`${styles.chip} ${styles.chipPush}`}>
                      {e.tallies["push-on"]} {BUCKET_LABEL["push-on"]}
                    </span>
                  )}
                  {e.tallies.clarify > 0 && (
                    <span className={`${styles.chip} ${styles.chipClarify}`}>
                      {e.tallies.clarify} {BUCKET_LABEL.clarify}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
