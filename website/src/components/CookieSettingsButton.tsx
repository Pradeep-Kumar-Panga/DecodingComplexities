"use client";

export function CookieSettingsButton() {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event("dc-open-consent"))} className="hover:text-brand-700">
      Cookie settings
    </button>
  );
}
