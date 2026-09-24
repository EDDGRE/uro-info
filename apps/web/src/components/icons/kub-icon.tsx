export function KubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <mask id="kub-mask-l">
          <rect x="0" y="0" width="100" height="100" fill="white" />
          <circle cx="34" cy="24" r="9" fill="black" />
        </mask>
        <mask id="kub-mask-r">
          <rect x="0" y="0" width="100" height="100" fill="white" />
          <circle cx="66" cy="24" r="9" fill="black" />
        </mask>
      </defs>
      <ellipse cx="25" cy="24" rx="13" ry="17" fill="currentColor" mask="url(#kub-mask-l)" />
      <ellipse cx="75" cy="24" rx="13" ry="17" fill="currentColor" mask="url(#kub-mask-r)" />
      <path d="M33,63 Q33,55 50,55 Q67,55 67,63 Q67,76 50,90 Q33,76 33,63 Z" fill="currentColor" />
      <path
        d="M29,36 C25,46 27,54 38,62"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M71,36 C75,46 73,54 62,62"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
