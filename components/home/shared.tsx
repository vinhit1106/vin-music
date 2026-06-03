import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

export function WaveformBars() {
  return (
    <div className="flex h-10 items-end gap-1">
      {[24, 12, 30, 16, 26, 10, 28, 18, 12, 24].map((height, index) => (
        <span
          key={index}
          className="w-1 rounded-full bg-[#292524]/30"
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
}

export function PreviewBar() {
  return (
    <div className="flex items-end gap-1">
      {[12, 18, 8, 22, 14, 26, 16, 20].map((height, index) => (
        <span
          key={index}
          className="w-1 rounded-full bg-[#292524]/25"
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
}

type SectionLabelProps = {
  children: ReactNode;
};

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5f5a65] shadow-[0_8px_18px_rgba(17,17,17,0.04)]">
      <Sparkles className="size-3.5 text-[#8a8692]" />
      <span>{children}</span>
    </div>
  );
}

type CardFrameProps = {
  children: ReactNode;
  className?: string;
};

export function CardFrame({ children, className = "" }: CardFrameProps) {
  return (
    <div
      className={`rounded-[24px] border border-border bg-white shadow-[0_12px_30px_rgba(17,17,17,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}
