import Link from "next/link";
import { RedlineMark } from "../components/RedlineMark";
import { getServerUser } from "@/lib/supabase/server";
import { signOut } from "./sign-out";
import styles from "./shell.module.css";

export const dynamic = "force-dynamic";

export default async function AppShellLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();
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
        {user && (
          <form action={signOut} className={styles.account}>
            <p className={styles.accountEmail}>Signed in as {user.email}</p>
            <button type="submit" className={styles.signOut}>
              Sign out
            </button>
          </form>
        )}
      </aside>
      <main className={styles.pane}>{children}</main>
    </div>
  );
}
