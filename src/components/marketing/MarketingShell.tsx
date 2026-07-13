import Link from "next/link";
import styles from "./marketing.module.css";

export function MarketingNav() {
  return <nav className={styles.nav} aria-label="Main navigation"><div className={styles.navInner}>
    <Link href="/" className={styles.brand}>Hippo</Link>
    <div className={styles.navLinks}>
      <Link href="/insights">Insights</Link>
      <Link href="/pricing">For programs</Link>
      <Link href="/login">Sign in</Link>
      <Link href="/signup" className={styles.primary}>Start free</Link>
    </div>
  </div></nav>;
}

export function MarketingFooter() {
  return <footer className={styles.footer}><div className={styles.footerInner}>
    <span>Hippo Medicine Inc. · Residents use Hippo free.</span>
    <div className={styles.footerLinks}>
      <Link href="/surgical-case-log">Case logging</Link>
      <Link href="/epa-tracking">EPA tracking</Link>
      <Link href="/residency-program-dashboard">Program dashboard</Link>
      <Link href="/accreditation-reporting">Accreditation</Link>
      <Link href="/legal/privacy">Privacy</Link>
    </div>
  </div></footer>;
}

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return <div className={styles.shell}><MarketingNav />{children}<MarketingFooter /></div>;
}

export { styles as marketingStyles };
