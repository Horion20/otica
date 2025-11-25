import React from 'react';

const commonProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.5",
  strokeLinecap: "round" as "round",
  strokeLinejoin: "round" as "round"
};

export const LensWidthIcon = ({ className }: { className?: string }) => (
  <svg {...commonProps} className={className}>
    {/* Glasses */}
    <circle cx="6" cy="12" r="4.5" />
    <circle cx="18" cy="12" r="4.5" />
    <path d="M10.5 12h3" />
    {/* Measurement Arrow inside left lens */}
    <path d="M2.5 12h7" />
    <path d="M2.5 12l2 -2" />
    <path d="M2.5 12l2 2" />
    <path d="M9.5 12l-2 -2" />
    <path d="M9.5 12l-2 2" />
  </svg>
);

export const LensHeightIcon = ({ className }: { className?: string }) => (
  <svg {...commonProps} className={className}>
    {/* Glasses */}
    <circle cx="6" cy="12" r="4.5" />
    <circle cx="18" cy="12" r="4.5" />
    <path d="M10.5 12h3" />
    {/* Measurement Arrow vertical inside left lens */}
    <path d="M6 8v8" />
    <path d="M6 8l-2 2" />
    <path d="M6 8l2 2" />
    <path d="M6 16l-2 -2" />
    <path d="M6 16l2 -2" />
  </svg>
);

export const BridgeIcon = ({ className }: { className?: string }) => (
  <svg {...commonProps} className={className}>
    {/* Glasses */}
    <circle cx="6" cy="14" r="4.5" />
    <circle cx="18" cy="14" r="4.5" />
    <path d="M10.5 14h3" />
    {/* Measurement Arrow above bridge */}
    <path d="M10 9h4" />
    <path d="M10 9l1.5 -1.5" />
    <path d="M10 9l1.5 1.5" />
    <path d="M14 9l-1.5 -1.5" />
    <path d="M14 9l-1.5 1.5" />
  </svg>
);

export const TempleIcon = ({ className }: { className?: string }) => (
  <svg {...commonProps} className={className}>
    {/* Side view frame */}
    <path d="M3 14v-2.5a2 2 0 0 1 2 -2h14a1 1 0 0 1 1 1v1.5" />
    <path d="M3 14a2 2 0 1 0 0 3" />
    {/* Measurement Arrow above temple */}
    <path d="M5 6h14" />
    <path d="M5 6l2 -2" />
    <path d="M5 6l2 2" />
    <path d="M19 6l-2 -2" />
    <path d="M19 6l-2 2" />
  </svg>
);