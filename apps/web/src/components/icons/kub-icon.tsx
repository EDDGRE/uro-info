export function KubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <mask id="kub-mask-l">
          <rect x="0" y="0" width="100" height="100" fill="white" />
          <circle cx="34" cy="26" r="15" fill="black" />
        </mask>
        <mask id="kub-mask-r">
          <rect x="0" y="0" width="100" height="100" fill="white" />
          <circle cx="66" cy="26" r="15" fill="black" />
        </mask>
      </defs>
      <ellipse cx="25" cy="24" rx="12" ry="24" fill="currentColor" mask="url(#kub-mask-l)" />
      <ellipse cx="75" cy="24" rx="12" ry="24" fill="currentColor" mask="url(#kub-mask-r)" />
      <path
        d="M31,42 C24,50 22,56 27,62 C32,68 36,72 38,78"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M69,42 C76,50 78,56 73,62 C68,68 64,72 62,78"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M32,78 C32,70 68,70 68,78 C68,92 58,98 50,98 C42,98 32,92 32,78 Z"
        fill="currentColor"
      />
    </svg>
  );
}
