import React from "react";

/* Abstract, hand-drawn illustrations built from primitive SVG shapes —
   no stock imagery, styled entirely through CSS custom properties so they
   follow the app's design tokens and both color themes. */

export const HeroIllustration = () => (
  <svg viewBox="0 0 420 420" className="hero-illustration" role="img" aria-label="Illustration of an AI assistant verifying a loan document">
    <defs>
      <linearGradient id="heroCardGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="var(--primary-600)" />
        <stop offset="100%" stopColor="var(--primary-800)" />
      </linearGradient>
    </defs>

    <circle className="hero-illustration-orbit" cx="210" cy="210" r="160" />
    <circle className="hero-illustration-orbit hero-illustration-orbit--inner" cx="210" cy="210" r="118" />

    {/* floating node dots along the orbit, representing AI signals */}
    <g className="hero-illustration-nodes">
      <circle cx="210" cy="50" r="7" />
      <circle cx="368" cy="160" r="5" />
      <circle cx="352" cy="320" r="6" />
      <circle cx="88" cy="322" r="5" />
      <circle cx="54" cy="150" r="6" />
    </g>

    {/* central document card */}
    <g transform="translate(133, 96)">
      <rect x="0" y="0" width="154" height="196" rx="16" fill="url(#heroCardGrad)" />
      <rect x="20" y="34" width="90" height="10" rx="5" fill="var(--primary-200)" opacity="0.85" />
      <rect x="20" y="58" width="114" height="7" rx="3.5" fill="var(--primary-300)" opacity="0.5" />
      <rect x="20" y="74" width="114" height="7" rx="3.5" fill="var(--primary-300)" opacity="0.5" />
      <rect x="20" y="90" width="70" height="7" rx="3.5" fill="var(--primary-300)" opacity="0.5" />

      <circle cx="77" cy="150" r="34" fill="var(--success-500)" />
      <path d="M62 150l11 11 22-22" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>

    {/* small scan/AI spark accents */}
    <g className="hero-illustration-spark" transform="translate(300, 84)">
      <path d="M10 0l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="var(--secondary-500)" />
    </g>
    <g className="hero-illustration-spark hero-illustration-spark--delay" transform="translate(66, 250)">
      <path d="M8 0l2.4 5.6L16 8l-5.6 2.4L8 16l-2.4-5.6L0 8l5.6-2.4z" fill="var(--accent-500)" />
    </g>
  </svg>
);

export const FlowIllustration = () => (
  <svg viewBox="0 0 320 120" className="flow-illustration" role="img" aria-label="Diagram: you provide details, AI assists, you receive a decision">
    <path
      d="M46 60 C 100 10, 220 110, 274 60"
      className="flow-illustration-path"
      fill="none"
      strokeDasharray="6 8"
    />
    <g transform="translate(6, 30)">
      <circle r="34" cx="34" cy="30" className="flow-illustration-node flow-illustration-node--start" />
      <path d="M34 20a8 8 0 100 16 8 8 0 000-16zm0 20c-8 0-16 4-16 10v2h32v-2c0-6-8-10-16-10z" fill="currentColor" transform="translate(0,-2)" />
    </g>
    <g transform="translate(126, 30)">
      <circle r="34" cx="34" cy="30" className="flow-illustration-node flow-illustration-node--mid" />
      <path d="M34 14l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="currentColor" />
    </g>
    <g transform="translate(246, 30)">
      <circle r="34" cx="34" cy="30" className="flow-illustration-node flow-illustration-node--end" />
      <path d="M22 30l8 8 16-16" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <text x="34" y="112" textAnchor="middle" className="flow-illustration-label">You</text>
    <text x="160" y="112" textAnchor="middle" className="flow-illustration-label">AI Assistant</text>
    <text x="280" y="112" textAnchor="middle" className="flow-illustration-label">Decision</text>
  </svg>
);

export const AadhaarIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="8" cy="11" r="2.4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5 16.5c0-1.8 1.5-3 3-3s3 1.2 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M14 9.5h5M14 12.5h5M14 15.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const PanIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="2" y="5" width="20" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
    <rect x="2" y="9" width="20" height="2.6" fill="currentColor" opacity="0.5" />
    <circle cx="7.5" cy="15" r="1.6" stroke="currentColor" strokeWidth="1.4" />
    <path d="M12 15h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const SalarySlipIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 2h9l4 4v16H6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M15 2v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M9 11h6M9 14h6M9 17h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const BankStatementIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2l9 5H3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M3 20.5h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
