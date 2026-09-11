import styles from "./ViolationTag.module.css";

type Bucket = "remove" | "push" | "clarify";

const BUCKET_LABEL: Record<Bucket, string> = {
  remove: "Remove / Modify",
  push: "Push On",
  clarify: "Clarify",
};

export function ViolationTag({
  ticketNo,
  category,
  bucket,
  quote,
  amount,
  rotate = 0,
  delay = 0,
}: {
  ticketNo: string;
  category: string;
  bucket: Bucket;
  quote: string;
  amount?: string;
  rotate?: number;
  delay?: number;
}) {
  return (
    <article
      className={`${styles.tag} ${styles[bucket]}`}
      style={
        {
          "--tag-rotate": `${rotate}deg`,
          "--tag-delay": `${delay}ms`,
        } as React.CSSProperties
      }
    >
      <span className={styles.grommet} aria-hidden="true">
        <svg viewBox="0 0 28 22" className={styles.wire}>
          <path
            d="M14 2 C 4 2, 2 10, 10 13"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
        <span className={styles.hole} />
      </span>

      {amount ? (
        <span className={styles.amount}>
          {amount.split("\n").map((line, i) => (
            <span key={i} className={styles.amountLine}>
              {line}
            </span>
          ))}
        </span>
      ) : null}

      <div className={styles.tagBody}>
        <header className={styles.tagHead}>
          <span className={styles.category}>{category}</span>
          <span className={`${styles.ticketNo} tabular`}>No. {ticketNo}</span>
        </header>

        <blockquote className={styles.quote}>{quote}</blockquote>

        <footer className={styles.stampRow}>
          <span className={styles.stamp}>{BUCKET_LABEL[bucket]}</span>
        </footer>
      </div>
    </article>
  );
}
