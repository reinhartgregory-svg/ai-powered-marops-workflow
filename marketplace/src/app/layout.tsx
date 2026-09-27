import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { FlashNotice } from "@/components/layout/flash-notice";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ToastProvider } from "@/components/ui/toast";
import { APP_NAME } from "@/lib/constants";
import "./globals.css";

// Every page depends on the signed-in user and live marketplace data.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Hire freelancers and find work`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Find skilled freelancers, post projects, and review proposals — all in one place.",
};

export const viewport: Viewport = {
  themeColor: "#0e665e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-white px-4 py-2 text-sm font-medium text-brand-800 shadow focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to main content
        </a>
        <ToastProvider>
          <SiteHeader />
          <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <SiteFooter />
          <Suspense fallback={null}>
            <FlashNotice />
          </Suspense>
        </ToastProvider>
      </body>
    </html>
  );
}
