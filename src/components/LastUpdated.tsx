import { formatUpdatedOn } from "@/lib/dates/formatUpdatedOn";

type LastUpdatedProps = {
  date: string;
  /** Visible label before the date. */
  label?: string;
  className?: string;
};

export function LastUpdated({
  date,
  label = "Last updated",
  className = "",
}: LastUpdatedProps) {
  return (
    <p
      className={`text-xs font-medium uppercase tracking-[0.14em] text-ink-soft ${className}`.trim()}
    >
      {label}:{" "}
      <time dateTime={date}>{formatUpdatedOn(date)}</time>
    </p>
  );
}
