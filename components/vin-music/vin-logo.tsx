"use client";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// VinMark — Raw SVG paths only. No background, no container.
// Parent element provides context (color, size container).
// Inherit color via `currentColor`.
// Design: Sliced Vinyl Waveform (concentric vinyl split by horizontal waveform).
// ---------------------------------------------------------------------------
export function VinMark({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Top half of vinyl record */}
      <path
        d="M 3 10.5 A 9 9 0 0 1 21 10.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 6.5 10.5 A 5.5 5.5 0 0 1 17.5 10.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Bottom half of vinyl record */}
      <path
        d="M 3 13.5 A 9 9 0 0 0 21 13.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 6.5 13.5 A 5.5 5.5 0 0 0 17.5 13.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Center horizontal channel waveform (5 vertical bars) */}
      <path
        d="M 7.5 10 V 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 9.75 9 V 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 12 8 V 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 14.25 9 V 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 16.5 10 V 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// VinIcon — Self-contained brand icon.
// Rounded square container (bg-primary) + VinMark (text-primary-foreground).
// Adapts automatically to light / dark mode via Tailwind theme tokens.
// Use this anywhere a standalone square icon is needed.
// ---------------------------------------------------------------------------
export function VinIcon({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const innerSize = Math.round(size * 0.62);

  return (
    <span
      aria-label="Vin Music"
      role="img"
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-[22%] bg-primary text-primary-foreground",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <VinMark size={innerSize} />
    </span>
  );
}

// ---------------------------------------------------------------------------
// VinWordmark — Full navbar / sidebar lockup.
// VinIcon + "Vin Music" text + optional tagline.
// ---------------------------------------------------------------------------
export function VinWordmark({
  iconSize = 28,
  showTagline = true,
  className,
}: {
  iconSize?: number;
  showTagline?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <VinIcon size={iconSize} />
      <span className="flex flex-col justify-center">
        <span className="font-heading text-[13.5px] font-bold leading-none tracking-tight text-foreground">
          Vin Music
        </span>
        {showTagline && (
          <span className="mt-0.5 text-[9px] font-semibold leading-none tracking-wide text-muted-foreground">
            Discover TikTok Sounds
          </span>
        )}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// VinFaviconSVG — Self-contained inline SVG for favicon / og-image use.
// Hard-coded colors: dark square, white mark. No CSS variables needed.
// Suitable for embedding in <head> or exporting as .svg.
// ---------------------------------------------------------------------------
export function VinFaviconSVG({
  size = 32,
  bg = "#111111",
  fg = "#ffffff",
}: {
  size?: number;
  bg?: string;
  fg?: string;
}) {
  const r = Math.round(size * 0.208); // ~22% radius for rounded square
  const s = size / 24; // scale factor from 24-unit viewbox

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background rounded square */}
      <rect width="24" height="24" rx={r / s} fill={bg} />
      
      {/* Top half of vinyl record */}
      <path
        d="M 3 10.5 A 9 9 0 0 1 21 10.5"
        stroke={fg}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 6.5 10.5 A 5.5 5.5 0 0 1 17.5 10.5"
        stroke={fg}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Bottom half of vinyl record */}
      <path
        d="M 3 13.5 A 9 9 0 0 0 21 13.5"
        stroke={fg}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 6.5 13.5 A 5.5 5.5 0 0 0 17.5 13.5"
        stroke={fg}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Center horizontal channel waveform */}
      <path
        d="M 7.5 10 V 14"
        stroke={fg}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 9.75 9 V 15"
        stroke={fg}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 12 8 V 16"
        stroke={fg}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 14.25 9 V 15"
        stroke={fg}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 16.5 10 V 14"
        stroke={fg}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
