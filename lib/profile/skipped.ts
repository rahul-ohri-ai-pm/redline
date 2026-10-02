import type { ProfileAnswers } from "./types";

/** Optional questions left unanswered, named for the precision warning. */
export function skippedFields(a: ProfileAnswers): string[] {
  const out: string[] = [];
  if (a.pets === undefined) out.push("pets");
  if (a.jointLease === undefined) out.push("joint lease");
  if (a.renterType === undefined) out.push("renter type");
  return out;
}
