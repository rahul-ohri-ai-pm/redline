import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseDocumentStore } from "@/lib/documents/supabase-store";
import { loadReport } from "@/lib/library/load";
import { CLAUSE_LABEL, formatSavedDate } from "@/lib/library/labels";
import { createServerSupabase, requireUser } from "@/lib/supabase/server";
import { buildReportView } from "@/lib/report/view-model";
import { TopStrip } from "../../TopStrip";
import ui from "../../../ui.module.css";
import { DeleteButton } from "../DeleteButton";
import { CopyButton } from "./CopyButton";
import { QaBox } from "./QaBox";
import rs from "./report.module.css";

export const metadata: Metadata = {
  title: "Saved report - Redline",
};

const STAMP_CLASS = {
  "remove-modify": ui.stampRemove,
  "push-on": ui.stampPush,
  clarify: ui.stampClarify,
} as const;

export default async function SavedReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/library/${id}`);
  const client = await createServerSupabase();
  if (!client) notFound();

  const result = await loadReport(createSupabaseDocumentStore(client), user.id, id);
  if (!result.ok && result.reason === "not-found") notFound();

  const back = { href: "/library", label: "Back to library" };

  if (!result.ok) {
    return (
      <>
        <TopStrip name="Report not shown" back={back} />
        <div className={rs.page}>
          <div role="alert" className={`${ui.notice} ${ui.noticeAlert}`}>
            <p className={ui.noticeTitle}>
              {result.reason === "load-failed" ? "This didn't load" : "A quote no longer matches"}
            </p>
            <p>
              {result.reason === "load-failed"
                ? "Reload the page to try again."
                : "One of the sentences this report quotes is no longer in the saved text, so none of the report is shown. Nothing was changed. Analyze the document again to get a fresh report."}
            </p>
          </div>
        </div>
      </>
    );
  }

  const { document: doc, report } = result;
  const profile = doc.profileSnapshot;
  const saved = formatSavedDate(doc.createdAt);
  const view = buildReportView(report, profile);
  // The document's own identifier, so a renter and a landlord can name the
  // thing they are both looking at. Derived from the stored id, never invented.
  const fileNo = doc.id.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase();
  const redLineCount = profile?.redLines?.length ?? 0;

  // Findings are numbered in the order they are read, across all three
  // buckets, so a renter and a landlord can refer to "No. 04" and mean it.
  let ticket = 0;

  return (
    <>
      <TopStrip
        name={doc.title}
        back={back}
        tallies={view.tallies}
        aside={
          <span className="tabular">
            File {fileNo} &middot; saved {saved}
          </span>
        }
      />

      <div className={rs.page}>
        <section className={rs.verdict} aria-labelledby="summary">
          <h2 id="summary" className={rs.verdictLabel}>
            {view.verdictLabel}
          </h2>
          <p className={rs.summary}>{view.summary}</p>
          <p className={rs.leadFacts}>
            <span>{profile ? `Read against ${profile.state} rules` : "No state saved"}</span>
            <span aria-hidden="true">&middot;</span>
            <span>
              {redLineCount === 0
                ? "No red lines of your own"
                : redLineCount === 1
                  ? "1 red line of your own"
                  : `${redLineCount} red lines of your own`}
            </span>
          </p>
          <aside className={rs.disclaimer} aria-label="Not legal advice">
            <span className={rs.disclaimerLabel}>Not legal advice</span>
            <p>{view.disclaimer}</p>
          </aside>
        </section>

        <section className={ui.section} aria-labelledby="skipped">
          <h2 id="skipped" className={ui.h2}>
            Sections that weren&apos;t read
          </h2>
          {view.skipped.length === 0 ? (
            <p className={ui.body}>Every section was read.</p>
          ) : (
            <>
              <p className={ui.note}>
                Redline didn&apos;t check these, so the flags below say nothing about them.
              </p>
              <ul className={rs.skippedList}>
                {view.skipped.map((s) => (
                  <li key={s.id}>
                    <span className={rs.sectionId}>{s.id}</span> {s.reason}
                  </li>
                ))}
              </ul>
            </>
          )}
          {view.precisionNote && <p className={ui.note}>{view.precisionNote}</p>}
        </section>

        {view.groups.map((g) => (
          <section key={g.bucket} className={rs.group} aria-labelledby={`bucket-${g.bucket}`}>
            <div className={ui.sectionHead}>
              <h2 id={`bucket-${g.bucket}`} className={ui.h2}>
                {g.label}
              </h2>
              <span className={ui.count}>
                {g.flags.length === 1 ? "1 flag" : `${g.flags.length} flags`}
              </span>
            </div>
            <ol className={rs.flags}>
              {g.flags.map((f) => {
                ticket += 1;
                return (
                  <li
                    key={f.id}
                    className={`${ui.tag} ${f.deprioritized ? ui.tagQuiet : ""}`}
                  >
                    <div className={ui.tagHead}>
                      <div className={ui.tagHeadMain}>
                        <span className={ui.category}>{CLAUSE_LABEL[f.clauseType]}</span>
                        <span className={ui.ticketNo}>
                          No. {String(ticket).padStart(2, "0")}
                        </span>
                      </div>
                      <span className={`${ui.stamp} ${STAMP_CLASS[f.bucket]}`}>
                        {f.bucketLabel}
                      </span>
                    </div>
                    <p className={ui.body}>{f.summary}</p>
                    <blockquote className={ui.quote}>{f.sourceSentence}</blockquote>
                    {f.counterOffer !== undefined && (
                      <>
                        <span className={ui.label}>Counter-offer draft</span>
                        <p className={rs.counter}>{f.counterOffer}</p>
                        <CopyButton text={f.counterOffer} />
                      </>
                    )}
                    {f.deprioritized && (
                      <span className={rs.quietNote}>Less relevant to your profile</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}

        {view.suggestions.length > 0 && (
          <section className={rs.suggestions} aria-labelledby="opps">
            <h2 id="opps" className={ui.h2}>
              Suggestions
            </h2>
            <p className={ui.note}>
              Things worth asking for. Your document doesn&apos;t mention any of them, so
              there&apos;s no sentence to quote.
            </p>
            <ul className={rs.suggestionList}>
              {view.suggestions.map((o) => (
                <li key={o.id} className={rs.suggestion}>
                  <span className={rs.suggestionTag}>Suggestion</span>
                  <p>{o.suggestion}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <QaBox documentId={doc.id} />

        <section className={ui.section} aria-labelledby="profile">
          <h2 id="profile" className={ui.h2}>
            Profile this report used
          </h2>
          <dl className={rs.profileList}>
            {view.profileRows.map((r) => (
              <div key={r.label} className={rs.profileRow}>
                <dt className={ui.label}>{r.label}</dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
          <p className={ui.note}>
            Your answers as of {saved}. Changing your profile later doesn&apos;t change this
            report. Re-running replaces it.
          </p>
          <p>
            <Link href={`/profile?rerun=${doc.id}`} className={ui.link}>
              Re-run with updated profile
            </Link>
          </p>
        </section>

        <div className={rs.footRow}>
          <DeleteButton id={doc.id} title={doc.title} redirectTo="/library" />
        </div>
      </div>
    </>
  );
}
