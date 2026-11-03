import type { ReactNode } from "react";

import Navbar from "../Navbar";
import Footer from "../Footer";

/*
 * Standard storefront page frame: navbar, main content, footer.
 * `container` wraps children in the standard max-width + gutters.
 */
export default function StoreShell({
  children,
  container = true,
  stickyCta = false,
  className = "",
}: {
  children: ReactNode;
  container?: boolean;
  /** page renders a <StickyWhatsAppBar> — reserve room for it below the footer on mobile */
  stickyCta?: boolean;
  className?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      <Navbar />
      <main className={`flex-1 ${className}`}>
        {container ? <Container>{children}</Container> : children}
      </main>
      <Footer />
      {stickyCta && <div className="sticky-cta-spacer" aria-hidden />}
    </div>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}
