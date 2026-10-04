import Link from "next/link";
import styles from "./shell.module.css";
import ui from "../ui.module.css";

export interface Tally {
  bucket: "remove-modify" | "push-on" | "clarify";
  label: string;
  count: number;
}

const TALLY_CLASS = {
  "remove-modify": ui.tallyRemove,
  "push-on": ui.tallyPush,
  clarify: ui.tallyClarify,
} as const;

/**
 * The frame's top strip: the screen's name on the left, and on an open report
 * that document's three bucket tallies on the right. The name is the page's
 * `h1`, so the strip is the screen's heading rather than a second one.
 */
export function TopStrip({
  name,
  back,
  tallies,
  aside,
}: {
  name: string;
  /** A link back out of this screen, shown before the name. */
  back?: { href: string; label: string };
  /** Flags by action for the open document. Omitted on screens without one. */
  tallies?: Tally[];
  /** Anything else the strip should carry at the right, such as a saved date. */
  aside?: React.ReactNode;
}) {
  return (
    <div className={styles.strip}>
      <div className={styles.stripInner}>
      <div className={styles.stripMain}>
        {back && (
          <Link href={back.href} className={styles.stripBack}>
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path
                d="M14 8H3M7.5 3.5 3 8l4.5 4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="square"
              />
            </svg>
            {back.label}
          </Link>
        )}
        <h1 className={ui.title}>{name}</h1>
      </div>
      {(tallies || aside) && (
        <div className={styles.stripAside}>
          {aside}
          {tallies && (
            <ul className={ui.tallies} aria-label="Flags by action">
              {tallies.map((t) => (
                <li
                  key={t.bucket}
                  className={`${ui.tally} ${
                    t.count === 0 ? ui.tallyEmpty : TALLY_CLASS[t.bucket]
                  }`}
                >
                  <span className={`${ui.tallyCount} tabular`}>{t.count}</span>
                  <span>{t.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
