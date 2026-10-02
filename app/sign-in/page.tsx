import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RedlineMark } from "../components/RedlineMark";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getServerUser } from "@/lib/supabase/server";
import { safeNext } from "@/lib/supabase/auth";
import { SignInForm } from "./SignInForm";
import styles from "./sign-in.module.css";

export const metadata: Metadata = {
  title: "Sign in - Redline",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const configured = isSupabaseConfigured();

  if (configured) {
    const user = await getServerUser();
    if (user) redirect(safeNext(next));
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <Link href="/" className={styles.wordmark}>
          <RedlineMark className={styles.mark} />
          <span>Redline</span>
        </Link>
        <h1 className={styles.title}>Sign in</h1>
        {configured ? (
          <>
            <p className={styles.lede}>
              Enter your email and we&apos;ll send you a link. Open it in this browser and
              you&apos;re signed in. There&apos;s no password.
            </p>
            {error === "link" && (
              <p role="alert" className={styles.error}>
                That link has expired or was already used. Send yourself a new one.
              </p>
            )}
            <SignInForm next={next ?? null} />
          </>
        ) : (
          <div className={styles.notice}>
            <p>
              Sign-in isn&apos;t set up on this deployment, so there are no accounts here.
              You can still paste or upload a lease on the{" "}
              <Link href="/new">New document</Link> page.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
