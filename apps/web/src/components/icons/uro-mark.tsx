import { useId } from "react";

export function UroMark({ className }: { className?: string }) {
  const halfId = useId();
  return (
    <svg
      viewBox="0 0 240 230"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g id={halfId}>
        <path
          transform="translate(9,10.8) scale(0.85)"
          d="M56,10 C27,10 8,38 8,72 C8,106 27,134 56,134 C79,134 94,121 94,106 C94,92 77,88 77,72 C77,56 94,52 94,38 C94,23 79,10 56,10 Z"
        />
        <path
          d="M68,72 C96,72 102,98 102,124 L103,154"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
        />
      </g>
      <use href={`#${halfId}`} transform="translate(240,0) scale(-1,1)" />
      <path
        transform="translate(-30,-56) scale(1.25)"
        d="M120,156 C145,156 160,168 158,184 C156,200 136,208 129,224 L111,224 C104,208 84,200 82,184 C80,168 95,156 120,156 Z"
      />
    </svg>
  );
}
