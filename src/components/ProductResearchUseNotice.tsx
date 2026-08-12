import {
  productRuoHeadline,
  productRuoNotForUse,
  productRuoNotIntended,
} from "@/data/site";

type ProductResearchUseNoticeProps = {
  className?: string;
};

/**
 * Compact product-level RUO notice — shown near title / purchase controls,
 * not only in the site footer.
 */
export function ProductResearchUseNotice({
  className = "",
}: ProductResearchUseNoticeProps) {
  return (
    <aside
      className={`border border-line bg-bg-elevated px-4 py-3 ${className}`.trim()}
      aria-label="Research use only notice"
    >
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink">
        {productRuoHeadline}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
        {productRuoNotForUse} {productRuoNotIntended}
      </p>
    </aside>
  );
}
