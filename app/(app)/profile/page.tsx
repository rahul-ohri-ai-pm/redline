import type { Metadata } from "next";
import { requireUser, createServerSupabase } from "@/lib/supabase/server";
import { createSupabaseProfileStore } from "@/lib/profile/supabase-store";
import { coveredStates, RENTER_TYPES, MAX_RED_LINES } from "@/lib/profile/validate";
import { parseRerunTarget } from "@/lib/documents/client";
import { TopStrip } from "../TopStrip";
import ui from "../../ui.module.css";
import { ProfileForm } from "./ProfileForm";
import styles from "./profile.module.css";

export const metadata: Metadata = {
  title: "Profile and red lines - Redline",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ rerun?: string | string[] }>;
}) {
  const rerunId = parseRerunTarget((await searchParams).rerun);
  // Signed-out visitors, and deployments without Supabase, are sent to /sign-in.
  const user = await requireUser(rerunId ? `/profile?rerun=${rerunId}` : "/profile");
  const client = await createServerSupabase();

  let saved = null;
  let loadFailed = false;
  if (client) {
    try {
      saved = await createSupabaseProfileStore(client).load(user.id);
    } catch {
      loadFailed = true;
    }
  }

  return (
    <>
      <TopStrip name="Profile & red lines" />
      <div className={styles.page}>
        <p className={styles.lede}>
          Your answers and red lines are saved to your account and used for every document
          you analyze. Change only what&apos;s different this time.
        </p>
        {rerunId && (
          <p className={styles.lede}>
            Saving here also re-runs your saved document with these answers and replaces its
            report.
          </p>
        )}
        {loadFailed ? (
          <div role="alert" className={`${ui.notice} ${ui.noticeAlert}`}>
            <p className={ui.noticeTitle}>Your saved answers didn&apos;t load</p>
            <p>Reload the page to try again.</p>
          </div>
        ) : (
          <ProfileForm
            states={coveredStates()}
            renterTypes={[...RENTER_TYPES]}
            maxRedLines={MAX_RED_LINES}
            initial={saved}
            rerunId={rerunId}
          />
        )}
      </div>
    </>
  );
}
