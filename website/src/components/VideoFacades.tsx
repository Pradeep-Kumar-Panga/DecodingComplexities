"use client";

import { useEffect } from "react";

// Loads the YouTube player (privacy-enhanced domain) only when a preview is clicked.
export function VideoFacades() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const box = (e.target as Element).closest<HTMLElement>(".video-facade");
      const id = box?.dataset.yt;
      if (!box || !id || !(e.target as Element).closest(".video-facade-btn")) return;
      const frame = document.createElement("iframe");
      frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      frame.title = "YouTube video player";
      frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      frame.allowFullscreen = true;
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      box.replaceChildren(frame);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
