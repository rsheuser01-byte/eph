export function BogoFreeBadge({
  paidQty,
  className = "",
}: {
  paidQty: number;
  className?: string;
}) {
  if (paidQty < 1) {
    return null;
  }
  const label = paidQty === 1 ? "+1 free" : `+${paidQty} free`;
  return (
    <span
      className={`inline-flex items-center border border-accent/50 bg-accent/10 px-1.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-accent ${className}`}
    >
      {label}
    </span>
  );
}
