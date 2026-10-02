import Link from "next/link";
import { RedlineMark } from "../components/RedlineMark";
import { getServerUser } from "@/lib/supabase/server";
import { NavLinks } from "./NavLinks";
import { RailMenu } from "./RailMenu";
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
        <RailMenu>
          <NavLinks />
          {user && (
            <form action={signOut} className={styles.account}>
              <p className={styles.accountEmail}>Signed in as {user.email}</p>
              <button type="submit" className={styles.signOut}>
                Sign out
              </button>
            </form>
          )}
        </RailMenu>
      </aside>
      <main className={styles.pane}>{children}</main>
    </div>
  );
}
