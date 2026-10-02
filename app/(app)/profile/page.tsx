import type { Metadata } from "next";
import { requireUser, createServerSupabase } from "@/lib/supabase/server";
import { createSupabaseProfileStore } from "@/lib/profile/supabase-store";
import { coveredStates, RENTER_TYPES, MAX_RED_LINES } from "@/lib/profile/validate";
import { ProfileForm } from "./ProfileForm";
import styles from "./profile.module.css";

export const metadata: Metadata = {
  title: "Profile and red lines - Redline",
};

export default async function ProfilePage() {
  // Signed-out visitors, and deployments without Supabase, are sent to /sign-in.
  const user = await requireUser("/profile");
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
    <div className={styles.page}>
      <h1 className={styles.h1}>Profile and red lines</h1>
      <p className={styles.lede}>
        Your answers and red lines are saved to your account and used for every document you
        analyze. Change only what&apos;s different this time.
      </p>
      {loadFailed ? (
        <p role="alert" className={styles.error}>
          Your saved answers didn&apos;t load. Reload the page to try again.
        </p>
      ) : (
        <ProfileForm
          states={coveredStates()}
          renterTypes={[...RENTER_TYPES]}
          maxRedLines={MAX_RED_LINES}
          initial={saved}
        />
      )}
    </div>
  );
}
