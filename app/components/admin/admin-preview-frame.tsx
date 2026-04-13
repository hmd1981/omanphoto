"use client";

import { useState } from "react";

export type PreviewViewport = "desktop" | "mobile";

type Props = {
  placement: string;
  detail?: string;
  children: (viewport: PreviewViewport) => React.ReactNode;
  className?: string;
};

export function AdminPreviewFrame({ placement, detail, children, className = "" }: Props) {
  const [viewport, setViewport] = useState<PreviewViewport>("desktop");

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-col gap-2 border border-line/80 bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-muted">Live preview</p>
          <p className="mt-1 text-sm text-white">{placement}</p>
          {detail ? <p className="mt-0.5 text-xs text-muted">{detail}</p> : null}
        </div>
        <div className="flex gap-2" role="group" aria-label="Preview viewport">
          <button
            type="button"
            onClick={() => setViewport("desktop")}
            className={`border px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] ${
              viewport === "desktop" ? "border-white bg-white text-black" : "border-line text-muted hover:text-white"
            }`}
          >
            Desktop
          </button>
          <button
            type="button"
            onClick={() => setViewport("mobile")}
            className={`border px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] ${
              viewport === "mobile" ? "border-white bg-white text-black" : "border-line text-muted hover:text-white"
            }`}
          >
            Mobile
          </button>
        </div>
      </div>
      <div
        className={`mx-auto w-full overflow-auto rounded border border-line/60 bg-paper ${
          viewport === "mobile" ? "max-w-[390px]" : "max-w-none"
        }`}
      >
        <div className={viewport === "mobile" ? "min-w-0 px-2 py-2" : "min-w-0 px-3 py-3"}>{children(viewport)}</div>
      </div>
    </div>
  );
}
