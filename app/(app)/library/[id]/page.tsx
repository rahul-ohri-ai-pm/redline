import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseDocumentStore } from "@/lib/documents/supabase-store";
import { loadReport, unansweredProfileFields } from "@/lib/library/load";
import { formatSavedDate } from "@/lib/library/labels";
import { createServerSupabase, requireUser } from "@/lib/supabase/server";
import { buildReportView } from "@/lib/report/view-model";
import { DeleteButton } from "../DeleteButton";
import styles from "../library.module.css";
import { CopyButton } from "./CopyButton";
import rs from "./report.module.css";

export const metadata: Metadata = {
  title: "Saved report - Redline",
};

const TALLY_CLASS = {
  "remove-modify": rs.tallyRemove,
  "push-on": rs.tallyPush,
  clarify: rs.tallyClarify,
} as const;

const CHIP_CLASS = {
  "remove-modify": styles.chipRemove,
  "push-on": styles.chipPush,
  clarify: styles.chipClarify,
} as const;

export default async function SavedReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/library/${id}`);
  const client = await createServerSupabase();
  if (!client) notFound();

  const result = await loadReport(createSupabaseDocumentStore(client), user.id, id);
  if (!result.ok && result.reason === "not-found") notFound();

  const back = (
    <Link href="/library" className={styles.back}>
      Back to library
    </Link>
  );

  if (!result.ok) {
    return (
      <div className={styles.page}>
        {back}
        <h1 className={styles.h1}>Report not shown</h1>
        <p role="alert" className={styles.error}>
          {result.reason === "load-failed"
            ? "This document didn't load. Reload the page to try again."
            : "This report isn't shown because a quoted sentence no longer matches the saved text. Nothing was changed. Analyze the document again to get a fresh report."}
        </p>
      </div>
    );
  }

  const { document: doc, report } = result;
  const profile = doc.profileSnapshot;
  const unanswered = unansweredProfileFields(profile);
  const saved = formatSavedDate(doc.createdAt);

  const view = buildReportView(report);

  return (
    <div className={styles.page}>
      <ul className={rs.tallies} aria-label="Flags by action">
        {view.tallies.map((t) => (
          <li key={t.bucket} className={`${rs.tally} ${TALLY_CLASS[t.bucket]}`}>
            <span className={rs.tallyCount}>{t.count}</span>
            <span className={rs.tallyLabel}>{t.label}</span>
          </li>
        ))}
      </ul>
      {back}
      <h1 className={styles.h1}>{doc.title}</h1>
      <p className={styles.rowMeta}>
        Saved {saved} · {view.verdictLabel}
      </p>

      <section className={styles.panel} aria-labelledby="summary">
        <h2 id="summary" className={styles.h2}>
          Summary
        </h2>
        <p>{view.summary}</p>
        <p className={styles.note}>{view.disclaimer}</p>
      </section>

      <section className={styles.panel} aria-labelledby="skipped">
        <h2 id="skipped" className={styles.h2}>
          Sections that weren&apos;t read
        </h2>
        {report.skippedSections.length === 0 ? (
          <p>Every section was read.</p>
        ) : (
          <ul className={styles.bullets}>
            {report.skippedSections.map((s) => (
              <li key={s.id}>
                {s.id}: {s.reason}
              </li>
            ))}
          </ul>
        )}
        {unanswered.length > 0 && (
          <p className={styles.note}>
            No answer was saved for {unanswered.join(", ")}, so the relevance ordering is less precise.
          </p>
        )}
      </section>

      {view.groups.map((g) => (
        <section key={g.bucket} className={rs.group} aria-labelledby={`bucket-${g.bucket}`}>
          <h2 id={`bucket-${g.bucket}`} className={styles.h2}>
            {g.label} <span className={rs.groupCount}>({g.flags.length})</span>
          </h2>
          <ol className={styles.flags}>
            {g.flags.map((f) => (
              <li key={f.id} className={`${styles.flag} ${f.deprioritized ? rs.quiet : ""}`}>
                <div className={styles.flagHead}>
                  <span className={`${styles.chip} ${CHIP_CLASS[f.bucket]}`}>{f.bucketLabel}</span>
                  {f.deprioritized && <span className={styles.note}>Less relevant to your profile</span>}
                </div>
                <p>{f.summary}</p>
                <span className={styles.label}>From your document</span>
                <blockquote className={styles.quote}>{f.sourceSentence}</blockquote>
                {f.counterOffer !== undefined && (
                  <>
                    <span className={styles.label}>Counter-offer draft</span>
                    <p className={styles.counter}>{f.counterOffer}</p>
                    <CopyButton text={f.counterOffer} />
                  </>
                )}
              </li>
            ))}
          </ol>
        </section>
      ))}

      {report.opportunityFlags.length > 0 && (
        <section className={styles.panel} aria-labelledby="opps">
          <h2 id="opps" className={styles.h2}>
            Things you could ask for
          </h2>
          <p className={styles.note}>
            General suggestions about what the document leaves out. None of these quote it.
          </p>
          <ul className={styles.bullets}>
            {report.opportunityFlags.map((o) => (
              <li key={o.id}>{o.suggestion}</li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.panel} aria-labelledby="profile">
        <h2 id="profile" className={styles.h2}>
          Profile this report used
        </h2>
        <ul className={styles.bullets}>
          <li>State: {profile.state}</li>
          {profile.pets !== undefined && <li>Pets: {profile.pets ? "yes" : "no"}</li>}
          {profile.jointLease !== undefined && <li>Joint lease: {profile.jointLease ? "yes" : "no"}</li>}
          {profile.renterType !== undefined && <li>Renter type: {profile.renterType}</li>}
          {profile.redLines && profile.redLines.length > 0 && <li>Red lines: {profile.redLines.join("; ")}</li>}
        </ul>
        <p className={styles.note}>
          These are your answers as of {saved}. Changes you make to your profile later don&apos;t update this report
          unless you re-run it.
        </p>
        <p>
          <Link href={`/profile?rerun=${doc.id}`} className={styles.back}>
            Re-run with updated profile
          </Link>
        </p>
        <p className={styles.note}>A re-run replaces this report. The current one isn&apos;t kept.</p>
      </section>

      <DeleteButton id={doc.id} title={doc.title} redirectTo="/library" />
    </div>
  );
}
