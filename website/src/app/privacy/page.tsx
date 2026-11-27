import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy and cookies",
  description: "What this site collects, which cookies it uses and how to change your choice.",
  alternates: { canonical: "/privacy" },
};

const link = "text-brand-700 underline underline-offset-2 dark:text-brand-300";
const h2 = "mb-2 mt-9 text-xl font-bold";
const p = "mt-3 text-slate-700 dark:text-slate-300";

export default function Privacy() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Privacy and cookies</h1>
      <p className={p}>
        This site is run by {SITE.author}. I collect as little as I can. This page explains what happens when you visit, and how
        to change your choice.
      </p>

      <h2 className={h2}>What I collect by default</h2>
      <p className={p}>
        Nothing about you. The site has no accounts, no comments, no advertising and no forms. Like any website, the hosting
        provider (Cloudflare) handles ordinary technical data such as your IP address in order to deliver pages and protect the
        site from abuse.
      </p>

      <h2 className={h2}>Analytics, only if you accept</h2>
      <p className={p}>
        If you choose Accept on the banner, I load Google Analytics 4. It sets cookies named <code>_ga</code> and{" "}
        <code>_ga_</code> followed by an ID, and sends Google information about your visit: the pages you view, how long you stay,
        your approximate location (country, region and city), device and browser type, and the site you came from. I use it only to understand which posts
        are read. Google may process this data in countries outside the UK and the EU; see{" "}
        <a className={link} href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
          how Google uses information from sites that use its services
        </a>
        .
      </p>
      <p className={p}>
        If you choose Decline, Google Analytics is not loaded and no analytics cookies are set. Your choice is remembered in your
        browser (local storage, under the name <code>dc-analytics-consent</code>), not on a server.
      </p>
      <p className={p}>
        I rely on your consent for this. Google Analytics keeps user-level data for 14 months and detailed event data for 2
        months, then deletes it. I have not turned on Google signals or user-provided data collection.
      </p>

      <h2 className={h2}>Videos</h2>
      <p className={p}>
        Pages with videos show a preview image instead of the YouTube player. The preview is fetched through this site, not by
        your browser. The player is loaded only when you press play, from YouTube&apos;s privacy-enhanced domain, and YouTube then
        handles data as described in Google&apos;s privacy policy.
      </p>

      <h2 className={h2}>Changing your choice</h2>
      <p className={p}>
        Use <strong>Cookie settings</strong> in the footer of any page to accept or decline again. Declining also removes the
        analytics cookies this site set. You can delete cookies at any time in your browser settings.
      </p>

      <h2 className={h2}>Your rights</h2>
      <p className={p}>
        If you are in the UK or the EU you have rights under data protection law, including access to data about you, correction,
        deletion, and objecting to processing. Write to me at{" "}
        <a className={link} href={`mailto:${SITE.email}`}>
          {SITE.email}
        </a>{" "}
        and I will respond. You can also complain to your data protection authority.
      </p>

      <p className="mt-9 text-sm text-slate-500 dark:text-slate-400">
        Last updated 27 November 2026. <Link className={link} href="/about#contact">Contact</Link>
      </p>
    </div>
  );
}
