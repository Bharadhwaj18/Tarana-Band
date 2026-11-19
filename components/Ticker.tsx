interface TickerProps {
  words: string[];
  className?: string;
}

// Scrolling poster strip. Decorative, so screen readers skip it.
export default function Ticker({ words, className = '' }: TickerProps) {
  const line = words.join(' ✶ ') + ' ✶ ';
  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden whitespace-nowrap bg-ink text-paper py-4 font-poster uppercase text-xl sm:text-[28px] ${className}`}
    >
      <span className="gp-tick">
        {line.repeat(4)}
        {line.repeat(4)}
      </span>
    </div>
  );
}
