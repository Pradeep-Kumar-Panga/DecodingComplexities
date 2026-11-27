import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "About", alternates: { canonical: "/about" } };

const steps = ["Take the complex thing", "Break it into pieces", "Understand each piece", "Connect it back to the whole"];

const spaces = [
  { name: "Learning", text: "Coursework (M.Tech), Kaggle and hands-on experiments. This is where observations are born." },
  { name: "Thinking", text: "This blog. Observations become written thought." },
  { name: "Teaching", text: "The YouTube channel. The reasoning is visible in motion." },
];

const link = "text-brand-700 underline underline-offset-2 dark:text-brand-300";

export default function About() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <div className="mb-6 flex items-center gap-4">
        <Image
          src="/brand/dc-logo.png"
          alt="Decoding Complexities logo"
          width={72}
          height={72}
          className="rounded-xl bg-white ring-1 ring-slate-200 dark:ring-slate-700"
        />
        <h1 className="text-3xl font-bold tracking-tight">About</h1>
      </div>
      <p className="text-lg">
        I&apos;m {SITE.author}. {SITE.tagline} I&apos;m currently pursuing an M.Tech in AI/ML.
      </p>
      <p className="mt-4 text-slate-600 dark:text-slate-400">
        I write about the things ML practitioners use confidently but understand incompletely, and I try to show how to
        think about them, not just what they are.
      </p>

      <h2 className="mb-3 mt-10 text-xl font-bold">How every post works</h2>
      <ol className="list-decimal space-y-1 pl-6 text-slate-700 dark:text-slate-300">
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>

      <h2 className="mb-3 mt-10 text-xl font-bold">Where things happen</h2>
      <ul className="space-y-3">
        {spaces.map((s) => (
          <li key={s.name} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <div className="font-semibold">{s.name}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{s.text}</div>
          </li>
        ))}
      </ul>

      <h2 id="contact" className="mb-3 mt-10 scroll-mt-24 text-xl font-bold">Get in touch</h2>
      <p className="mb-3 text-slate-600 dark:text-slate-400">
        Questions about a post, a correction, or a topic you would like decoded? Reach me here. I come from an IBM i and
        Python background, so you are welcome to get in touch about those too, even though they are not the main focus here.
      </p>
      <ul className="space-y-1">
        {SITE.email && (
          <li>
            <a className={link} href={`mailto:${SITE.email}`}>
              Email: {SITE.email}
            </a>
          </li>
        )}
        {SITE.linkedin && (
          <li>
            <a className={link} href={SITE.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          </li>
        )}
        <li>
          <a className={link} href={SITE.youtube} target="_blank" rel="noopener noreferrer">
            YouTube: @DecodingComplexities
          </a>
        </li>
        <li>
          <a className={link} href={SITE.instagram} target="_blank" rel="noopener noreferrer">
            Instagram: @decoding.complexities
          </a>
        </li>
        <li>
          <Link className={link} href="/feed.xml">
            RSS feed
          </Link>
        </li>
      </ul>
    </div>
  );
}
