import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function SiteFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-bg">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="text-lg font-medium tracking-tight no-underline">
            Relay
          </Link>
          <nav className="flex items-center gap-5 text-base text-muted" aria-label="Main">
            <a href="/#share" className="no-underline hover:text-ink">
              Share
            </a>
            <a href="/#faq" className="no-underline hover:text-ink">
              FAQ
            </a>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-10 pb-16 sm:px-6 sm:pt-16">
        {children}
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-6 text-center text-sm text-faint sm:px-6">
          <p>Independent pool. Not affiliated with or endorsed by Meta.</p>
          <p>
            <Link to="/privacy" className="text-muted no-underline hover:text-ink">
              Privacy
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
