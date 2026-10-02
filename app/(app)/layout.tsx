import Link from "next/link";
import { RedlineMark } from "../components/RedlineMark";
import styles from "./shell.module.css";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.rail}>
        <Link href="/new" className={styles.wordmark}>
          <RedlineMark className={styles.wordmarkIcon} />
          <span>Redline</span>
        </Link>
        <nav aria-label="Main" className={styles.nav}>
          <Link href="/new" className={styles.navItem} aria-current="page">
            New document
          </Link>
        </nav>
      </aside>
      <main className={styles.pane}>{children}</main>
    </div>
  );
}
