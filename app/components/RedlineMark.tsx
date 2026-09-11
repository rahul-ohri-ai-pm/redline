export function RedlineMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M8 4h16.5c1.4 0 2.5 1.1 2.5 2.5v11.6c0 .7-.3 1.3-.7 1.8L16.8 29.4c-.4.5-1.2.5-1.6 0L5.7 19.9c-.4-.5-.7-1.1-.7-1.8V8.5C5 6 6.6 4 8 4z"
        fill="var(--color-violation)"
      />
      <circle cx="12.5" cy="11.5" r="2.4" fill="var(--color-paper)" />
    </svg>
  );
}
