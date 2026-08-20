import type { JSX } from "react";

export type IconName =
  | "plus" | "minus" | "x" | "check" | "search" | "chevron-left" | "chevron-right"
  | "trash" | "pencil" | "download" | "copy" | "arrow-up" | "arrow-down"
  | "wallet" | "calendar" | "sparkle" | "undo" | "github" | "coffee" | "info"
  | "basket" | "utensils" | "bus" | "home" | "bolt" | "film" | "pulse" | "bag"
  | "plane" | "dots" | "briefcase" | "laptop" | "trend" | "gift";

const P: Record<IconName, JSX.Element> = {
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 13l4 4L19 7" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20.3 20.3L16.4 16.4" />
    </>
  ),
  "chevron-left": <path d="M15 5l-7 7 7 7" />,
  "chevron-right": <path d="M9 5l7 7-7 7" />,
  trash: (
    <>
      <path d="M4 7h16M10 11.5v5.5M14 11.5v5.5" />
      <path d="M6.2 7l.9 12.1a1.8 1.8 0 001.8 1.9h6.2a1.8 1.8 0 001.8-1.9L17.8 7" />
      <path d="M9.2 7V5a2 2 0 012-2h1.6a2 2 0 012 2v2" />
    </>
  ),
  pencil: <path d="M4.5 19.5l.9-3.6L16.7 4.6a2.05 2.05 0 012.9 2.9L8.3 18.8l-3.8.7z" />,
  download: <path d="M12 3.5V15M7.5 10.5L12 15l4.5-4.5M4.5 20h15" />,
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 14.5V6a2 2 0 012-2h8.5" />
    </>
  ),
  "arrow-up": <path d="M7 17L17 7M9.5 7H17v7.5" />,
  "arrow-down": <path d="M7 7l10 10M17 9.5V17H9.5" />,
  wallet: (
    <>
      <path d="M4 7.5A2.5 2.5 0 016.5 5H18a2 2 0 012 2v1" />
      <path d="M4 7.5V17a2.5 2.5 0 002.5 2.5H20V8H6.5A2.5 2.5 0 014 7.5z" />
      <path d="M15.8 13.5h.7" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </>
  ),
  sparkle: (
    <path d="M12 3.5l1.9 5.4 5.4 1.9-5.4 1.9L12 18.1l-1.9-5.4-5.4-1.9 5.4-1.9L12 3.5zM18.5 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" />
  ),
  undo: (
    <>
      <path d="M3.5 4.5v5.5H9" />
      <path d="M4.4 13.5a8 8 0 102-7.6L3.5 8.6" />
    </>
  ),
  github: (
    <path
      fill="currentColor"
      stroke="none"
      d="M12 2.2a10 10 0 00-3.16 19.5c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.1.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.56 9.56 0 015 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85V21.2c0 .27.18.58.69.48A10 10 0 0012 2.2z"
    />
  ),
  coffee: (
    <>
      <path d="M4.5 9h11v5.5a4.5 4.5 0 01-4.5 4.5H9a4.5 4.5 0 01-4.5-4.5V9z" />
      <path d="M15.5 10h1.4a2.3 2.3 0 010 4.6h-1.6M7 3.5v2M10 3.5v2M13 3.5v2" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 7.8h.01" />
    </>
  ),
  basket: (
    <>
      <path d="M5 9.5L6.6 5M19 9.5L17.4 5" />
      <path d="M3.5 9.5h17l-1.5 8.9a2 2 0 01-2 1.6H7a2 2 0 01-2-1.6L3.5 9.5z" />
      <path d="M9.2 13v3.2M12 13v3.2M14.8 13v3.2" />
    </>
  ),
  utensils: (
    <>
      <path d="M6.5 3v18M4 3v4.6a2.5 2.5 0 005 0V3" />
      <path d="M18.5 3v18M18.5 3c-2.7 1.8-3.7 5.6-2.6 8.5h2.6" />
    </>
  ),
  bus: (
    <>
      <rect x="4.5" y="4" width="15" height="13" rx="2.2" />
      <path d="M4.5 10.5h15M8 14.5h.01M16 14.5h.01M7 17v2.5M17 17v2.5" />
    </>
  ),
  home: (
    <>
      <path d="M4 10.8L12 4l8 6.8" />
      <path d="M6 9.5V20h12V9.5" />
      <path d="M10 20v-5.5h4V20" />
    </>
  ),
  bolt: <path d="M13 3L5.2 13.2h4.6L11 21l7.8-10.2h-4.6L13 3z" />,
  film: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7.2 5v14M16.8 5v14M3 9.7h4.2M3 14.3h4.2M16.8 9.7H21M16.8 14.3H21" />
    </>
  ),
  pulse: <path d="M3 12.5h3.6l2.4-6 4.6 11 2.4-5H21" />,
  bag: (
    <>
      <path d="M5 8h14l-.9 11.1a2 2 0 01-2 1.9H7.9a2 2 0 01-2-1.9L5 8z" />
      <path d="M9 8V6.2a3 3 0 016 0V8" />
    </>
  ),
  plane: (
    <>
      <path d="M21 3.5L3.4 10.7l6.9 2.6 2.7 7L21 3.5z" />
      <path d="M10.3 13.3L21 3.5" />
    </>
  ),
  dots: (
    <>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7.5" width="18" height="12.5" rx="2" />
      <path d="M9 7.5V6a2 2 0 012-2h2a2 2 0 012 2v1.5M3 12.5h18" />
    </>
  ),
  laptop: (
    <>
      <rect x="4.5" y="5" width="15" height="10.5" rx="1.6" />
      <path d="M2.5 19h19" />
    </>
  ),
  trend: (
    <>
      <path d="M3.5 16.5l5.5-5.5 3.8 3.8 7.2-8.3" />
      <path d="M14.5 6.5H20V12" />
    </>
  ),
  gift: (
    <>
      <rect x="4" y="9" width="16" height="11" rx="1.6" />
      <path d="M12 9v11M4 13.5h16" />
      <path d="M12 9s-3.8.2-4.8-1.8c-.8-1.7.9-3.3 2.6-2.6C11.6 5.3 12 9 12 9zM12 9s3.8.2 4.8-1.8c.8-1.7-.9-3.3-2.6-2.6C12.4 5.3 12 9 12 9z" />
    </>
  ),
};

export function Icon({
  name,
  size = 18,
  className,
  strokeWidth = 1.7,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {P[name]}
    </svg>
  );
}

export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="15" fill="#c0ef5e" />
      <rect x="14" y="40" width="36" height="6.5" rx="3.25" fill="#0d1410" />
      <rect x="14" y="28.5" width="26" height="6.5" rx="3.25" fill="#0d1410" />
      <rect x="14" y="17" width="16" height="6.5" rx="3.25" fill="#0d1410" />
    </svg>
  );
}
