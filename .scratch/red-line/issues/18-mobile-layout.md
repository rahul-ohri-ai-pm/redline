# 18: Report screen and Q&A box at phone width

**What to build:** A renter on a call with their landlord can check a flag on a phone. The report and the Q&A box work at phone width, and the app-shell rail gets a mobile behavior (drawer or bottom nav), chosen against the real report content and recorded in the ticket comments. The three bucket tallies stay visible without crowding the verdict.

**Blocked by:** 16, 17

**Status:** done

- [x] The report and Q&A box have no horizontal scroll and no clipped text at 360px width.
- [x] The rail has a defined mobile behavior and the library, profile and new-document links stay reachable.
- [x] The choice of drawer or bottom nav and its reason are written under Comments.
- [x] Touch targets for copy, ask and retry are comfortably tappable.
- [x] Any user-facing copy has been through the humanizer skill.

## Comments

**Rail on phones: drawer, not bottom nav.** At 720px and below the rail collapses to a top bar with the wordmark and a Menu button; the button opens a panel holding New document, Library, Profile & red lines, the signed-in email and Sign out. The rail has five things in it. A bottom bar fits three links at 360px but has no room for the email and Sign out, and "Profile & red lines" would be squeezed or cut. A bottom bar would also sit on top of the Q&A box and the keyboard on a phone, and that is the screen a renter has open mid-call. The cost is one extra tap to switch screens, which is acceptable because the page you are reading is the thing you came for. The panel closes on navigation and on Escape.
