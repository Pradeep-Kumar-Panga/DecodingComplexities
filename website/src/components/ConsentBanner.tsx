"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState, useSyncExternalStore } from "react";

const KEY = "dc-analytics-consent";
const CHANGED = "dc-consent-changed";
const OPEN = "dc-open-consent";

const subscribe = (notify: () => void) => {
  window.addEventListener("storage", notify);
  window.addEventListener(CHANGED, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(CHANGED, notify);
  };
};
const read = () => localStorage.getItem(KEY) ?? "";

function clearAnalyticsCookies(gaId: string) {
  (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = true;
  const parent = `.${location.hostname.replace(/^www\./, "")}`;
  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0].trim();
    if (name !== "_ga" && !name.startsWith("_ga_")) continue;
    for (const domain of [location.hostname, parent]) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`;
    }
  }
}

// Google Analytics is only loaded after the visitor accepts; declining loads nothing.
export function ConsentBanner({ gaId }: { gaId: string }) {
  const stored = useSyncExternalStore(subscribe, read, () => "loading");
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    const reopen = () => setReopened(true);
    window.addEventListener(OPEN, reopen);
    return () => window.removeEventListener(OPEN, reopen);
  }, []);

  const decide = (choice: "granted" | "denied") => {
    localStorage.setItem(KEY, choice);
    if (choice === "denied") clearAnalyticsCookies(gaId);
    setReopened(false);
    window.dispatchEvent(new Event(CHANGED));
  };

  const showBanner = stored !== "loading" && (stored === "" || reopened);
  const analyticsOn = stored === "granted" && process.env.NODE_ENV === "production";

  return (
    <>
      {analyticsOn && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');`}
          </Script>
        </>
      )}
      {showBanner && (
        <section
          aria-label="Cookie consent"
          className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-xl border border-slate-300 bg-white p-4 text-sm shadow-xl sm:p-5 dark:border-slate-700 dark:bg-slate-900"
        >
          <p className="text-slate-700 dark:text-slate-300">
            May I use Google Analytics to count visits and see which posts are read? It sets cookies on your device only if you
            accept. Declining does not change how the site works.{" "}
            <Link href="/privacy" className="font-medium text-brand-700 underline underline-offset-2 dark:text-brand-300">
              Privacy and cookies
            </Link>
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => decide("granted")}
              className="flex-1 rounded-full border border-brand-600 bg-brand-600 px-5 py-2 font-semibold text-white hover:bg-brand-700 sm:flex-none"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => decide("denied")}
              className="flex-1 rounded-full border border-slate-400 px-5 py-2 font-semibold hover:border-brand-500 sm:flex-none dark:border-slate-500"
            >
              Decline
            </button>
          </div>
        </section>
      )}
    </>
  );
}
