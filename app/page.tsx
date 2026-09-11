import Link from "next/link";
import { RedlineMark } from "./components/RedlineMark";
import { ViolationTag } from "./components/ViolationTag";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <header className={styles.siteHeader}>
        <div className={styles.wordmark}>
          <RedlineMark className={styles.wordmarkIcon} />
          <span>Redline</span>
        </div>
        <a className={styles.headerLink} href="#try">
          Try it on a document
        </a>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <h1 className={styles.h1}>
              Read what you&rsquo;re actually signing.
            </h1>
            <p className={styles.lede}>
              Paste in a lease and Redline hands back a numbered list of
              exactly which sentences to worry about. Each one comes with
              the sentence it&rsquo;s based on, word for word, so you never
              have to take its word for it.
            </p>
            <div className={styles.ctaRow}>
              <a className={styles.ctaButton} href="#try">
                Try it on a document
              </a>
              <span className={styles.ctaNote}>
                Not legal advice. Not a lawyer.
              </span>
            </div>
          </div>

          <div className={styles.heroDoc}>
            <div className={styles.leaseSheet}>
              <p className={styles.leaseKicker}>
                Residential Lease Agreement, Section 4 (example text)
              </p>

              <p className={styles.leaseP}>
                <strong>4.1 Rent and Fees.</strong> Tenant agrees to pay Base
                Rent of $1,850.00 per month, due on the first day of each
                month.{" "}
                <mark className={`${styles.flagged} ${styles.flagRemove}`}>
                  In addition to Base Rent, Tenant agrees to pay a monthly
                  amenity administration fee of $45.00, which Landlord may
                  adjust upon thirty (30) days&rsquo; written notice to
                  Tenant.
                  <sup className={styles.flagMarker}>04-01</sup>
                </mark>{" "}
                Rent and fees shall be paid by electronic transfer to the
                account designated by Landlord.
              </p>

              <p className={styles.leaseP}>
                <strong>4.4 Term and Renewal.</strong> The initial term of
                this Lease shall be twelve (12) months, commencing on the
                Commencement Date.{" "}
                <mark className={`${styles.flagged} ${styles.flagPush}`}>
                  This Lease shall automatically renew for successive
                  twelve (12) month terms unless either party provides
                  written notice of non-renewal at least sixty (60) days
                  prior to the expiration of the then-current term.
                  <sup className={styles.flagMarker}>04-04</sup>
                </mark>{" "}
                Rent for each renewal term shall be adjusted to the
                then-current market rate as determined by Landlord.
              </p>

              <p className={styles.leaseP}>
                <strong>4.7 Guests and Occupancy.</strong> Only persons
                listed on this Lease may reside in the Premises.{" "}
                <mark className={`${styles.flagged} ${styles.flagClarify}`}>
                  Tenant shall not host any guest for more than seven (7)
                  consecutive nights in any thirty (30) day period without
                  the prior written consent of Landlord.
                  <sup className={styles.flagMarker}>04-07</sup>
                </mark>{" "}
                Landlord&rsquo;s consent to a guest shall not be
                unreasonably withheld.
              </p>
            </div>

            <div className={styles.tagStack}>
              <ViolationTag
                ticketNo="04-01"
                category="Hidden fee"
                bucket="remove"
                amount={"+$45\n/MO"}
                quote="In addition to Base Rent, Tenant agrees to pay a monthly amenity administration fee of $45.00, which Landlord may adjust upon thirty (30) days' written notice to Tenant."
                rotate={-2.5}
                delay={0}
              />
              <ViolationTag
                ticketNo="04-04"
                category="Auto-renewal"
                bucket="push"
                quote="This Lease shall automatically renew for successive twelve (12) month terms unless either party provides written notice of non-renewal at least sixty (60) days prior to the expiration of the then-current term."
                rotate={2}
                delay={220}
              />
              <ViolationTag
                ticketNo="04-07"
                category="Guest policy"
                bucket="clarify"
                quote="Tenant shall not host any guest for more than seven (7) consecutive nights in any thirty (30) day period without the prior written consent of Landlord."
                rotate={-1.5}
                delay={440}
              />
            </div>
          </div>
        </section>

        <section className={styles.principle}>
          <h2 className={styles.h2}>Every flag cites itself.</h2>
          <p className={styles.principleBody}>
            Redline doesn&rsquo;t summarize your lease and ask you to trust
            it. Each flag shows the exact sentence it came from, copied
            straight out of your document, unedited. If a clause
            can&rsquo;t be quoted verbatim, it doesn&rsquo;t ship as a
            flag, no exceptions.
          </p>
        </section>

        <section className={styles.exclusions}>
          <h2 className={styles.h2}>What Redline won&rsquo;t do.</h2>
          <ul className={styles.exclusionList}>
            <li className={styles.exclusionTag}>
              No verdict on whether to sign
            </li>
            <li className={styles.exclusionTag}>Not legal advice</li>
            <li className={styles.exclusionTag}>
              Residential leases only, for now
            </li>
            <li className={styles.exclusionTag}>
              No scanned or photographed documents
            </li>
          </ul>
        </section>

        <section id="try" className={styles.finalCta}>
          <h2 className={styles.h2}>See what&rsquo;s actually in your lease.</h2>
          <Link className={styles.ctaButton} href="/app">
            Try it on a document
          </Link>
          <p className={styles.disclaimer}>
            Redline is not legal advice and not a lawyer. It cites what
            your lease says. The decision is always yours.
          </p>
        </section>
      </main>

      <footer className={styles.siteFooter}>
        <div className={styles.wordmark}>
          <RedlineMark className={styles.wordmarkIcon} />
          <span>Redline</span>
        </div>
        <p className={styles.footerNote}>
          Not legal advice. Not a lawyer.
        </p>
      </footer>
    </>
  );
}
