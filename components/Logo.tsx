/** Wordmark: thin caps name with a handwritten "konoba" laid across it, and the sea-stone mark. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex flex-col items-center leading-none ${className}`}>
      <span className="caps text-[1.35rem] tracking-[0.12em] md:text-[1.6rem]">Plavi Kamen</span>
      <span className="script -mt-1.5 text-[1.05rem] md:text-[1.25rem]">konoba</span>
    </span>
  );
}
