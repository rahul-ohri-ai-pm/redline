import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseDocumentStore } from "@/lib/documents/supabase-store";
import { listLibrary, type LibraryEntry } from "@/lib/library/load";
import { BUCKET_LABEL, VERDICT_LABEL, formatSavedDate } from "@/lib/library/labels";
import { createServerSupabase, requireUser } from "@/lib/supabase/server";
import { TopStrip } from "../TopStrip";
import ui from "../../ui.module.css";
import { DeleteButton } from "./DeleteButton";
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
    <>
      <TopStrip
        name="Library"
        aside={
          entries.length > 0 ? (
            <span>{entries.length === 1 ? "1 document" : `${entries.length} documents`}</span>
          ) : undefined
        }
      />
      <div className={styles.page}>
        {loadFailed ? (
          <div role="alert" className={`${ui.notice} ${ui.noticeAlert}`}>
            <p className={ui.noticeTitle}>Your documents didn&apos;t load</p>
            <p>Reload the page to try again.</p>
          </div>
        ) : entries.length === 0 ? (
          <div className={`${styles.sheet} ${styles.empty}`}>
            <p>
              Nothing saved yet. Add a lease and its report stays here, along with the text
              it was read from.
            </p>
            <Link href="/new" className={styles.cta}>
              Add a document
            </Link>
          </div>
        ) : (
          <ul className={styles.list}>
            {entries.map((e) => (
              <li key={e.id} className={styles.rowItem}>
                <Link href={`/library/${e.id}`} className={styles.row}>
                  <span className={styles.rowTitle}>{e.title}</span>
                  <span className={styles.rowMeta}>
                    {VERDICT_LABEL[e.verdict]} &middot; {formatSavedDate(e.createdAt)}
                    {e.state ? ` · ${e.state}` : ""}
                  </span>
                  <span className={styles.chips}>
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
                <DeleteButton id={e.id} title={e.title} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
