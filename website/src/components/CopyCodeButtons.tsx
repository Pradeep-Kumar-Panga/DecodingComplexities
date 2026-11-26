"use client";

import { useEffect } from "react";

// Adds a Copy button to each code block inside .post-body; output blocks are skipped.
export function CopyCodeButtons() {
  useEffect(() => {
    const timers: number[] = [];
    document.querySelectorAll<HTMLPreElement>(".post-body pre").forEach((pre) => {
      if (pre.dataset.role === "output" || pre.parentElement?.classList.contains("code-wrap")) return;
      const wrap = document.createElement("div");
      wrap.className = "code-wrap";
      pre.replaceWith(wrap);
      wrap.appendChild(pre);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "copy-btn";
      button.textContent = "Copy";
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(pre.textContent ?? "");
          button.textContent = "Copied";
        } catch {
          button.textContent = "Press Ctrl+C";
        }
        timers.push(window.setTimeout(() => (button.textContent = "Copy"), 1600));
      });
      wrap.appendChild(button);
    });
    return () => timers.forEach(clearTimeout);
  }, []);
  return null;
}
