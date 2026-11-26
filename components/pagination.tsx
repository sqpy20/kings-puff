"use client";

export type PaginatedResult<T> = {
  items: T[];
  safePage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
};

/**
 * Slices `items` for the requested 1-based page and clamps out-of-range page numbers.
 */
export function paginateItems<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  const safePageSize = Number.isFinite(pageSize)
    ? Math.max(1, Math.floor(pageSize))
    : 1;
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const normalizedPage = Number.isFinite(page) ? Math.floor(page) : 1;
  const safePage = Math.min(Math.max(1, normalizedPage), totalPages);
  const startIndex = (safePage - 1) * safePageSize;
  const endIndex = Math.min(totalItems, startIndex + safePageSize);

  return {
    items: items.slice(startIndex, endIndex),
    safePage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
  };
}

/**
 * Builds an ordered page list with `"ellipsis"` gaps when total pages exceed 7.
 */
export function buildPageList(
  current: number,
  total: number,
): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, idx) => idx + 1);
  }

  const wanted = new Set<number>([1, total, current - 1, current, current + 1]);
  if (current <= 3) {
    wanted.add(2);
    wanted.add(3);
    wanted.add(4);
  }
  if (current >= total - 2) {
    wanted.add(total - 3);
    wanted.add(total - 2);
    wanted.add(total - 1);
  }

  const sorted = [...wanted]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const result: Array<number | "ellipsis"> = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const page = sorted[i];
    const prev = sorted[i - 1];
    if (prev !== undefined && page - prev > 1) {
      result.push("ellipsis");
    }
    result.push(page);
  }
  return result;
}

export type PaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  itemLabel?: string;
  pageSizeOptions?: number[];
  onPageChange: (nextPage: number) => void;
  onPageSizeChange?: (nextSize: number) => void;
  variant?: "storefront" | "admin";
  compact?: boolean;
  className?: string;
};

export default function Pagination({
  page,
  pageSize,
  totalItems,
  itemLabel = "items",
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  variant = "admin",
  compact = false,
  className = "",
}: PaginationProps) {
  if (totalItems === 0) return null;

  const safePageSize = Number.isFinite(pageSize)
    ? Math.max(1, Math.floor(pageSize))
    : 1;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const safePage = Math.min(
    Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1),
    totalPages,
  );
  const start = (safePage - 1) * safePageSize + 1;
  const end = Math.min(totalItems, safePage * safePageSize);
  const pageList = buildPageList(safePage, totalPages);

  const isStorefront = variant === "storefront";
  const btnHeight = compact
    ? "h-8 px-2.5 text-xs"
    : isStorefront
      ? "h-10 px-4 text-sm"
      : "h-8 px-3 text-xs sm:h-9";
  const pageBtnSize = isStorefront
    ? "size-10 text-sm"
    : "size-8 text-xs sm:size-9";
  const selectHeight = isStorefront ? "h-9 px-3 text-xs" : "h-8 px-2.5 text-xs";

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 ${
        isStorefront ? "flex-col sm:flex-row" : ""
      } ${className}`.trim()}
    >
      <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-ink/75 sm:text-sm">
        <p aria-live="polite">
          Showing <strong className="font-extrabold text-ink">{start}</strong>
          &ndash;
          <strong className="font-extrabold text-ink">{end}</strong> of{" "}
          <strong className="font-extrabold text-ink">{totalItems}</strong>{" "}
          {itemLabel}
        </p>

        {!compact &&
          onPageSizeChange &&
          pageSizeOptions &&
          pageSizeOptions.length > 0 && (
            <label className="inline-flex items-center gap-1.5 text-xs font-bold text-ink">
              <span className="text-ink/65">Per page</span>
              <select
                aria-label="Items per page"
                value={safePageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className={`${selectHeight} cursor-pointer rounded-full border-2 border-ink bg-white font-bold text-ink`}
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          )}
      </div>

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="flex flex-wrap items-center justify-center gap-1.5"
        >
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            aria-label="Previous page"
            className={`inline-flex cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-white font-extrabold text-ink transition hover:bg-lime disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white ${btnHeight}`}
          >
            &larr; Prev
          </button>

          {compact ? (
            <span className="px-2 text-xs font-extrabold text-ink">
              {safePage} / {totalPages}
            </span>
          ) : (
            <>
              <span className="px-2 text-xs font-extrabold text-ink sm:hidden">
                Page {safePage} of {totalPages}
              </span>

              <div className="hidden items-center gap-1.5 sm:inline-flex">
                {pageList.map((item, idx) =>
                  item === "ellipsis" ? (
                    <span
                      key={`ellipsis-${idx}`}
                      aria-hidden="true"
                      className="px-1 text-xs font-bold text-ink/55"
                    >
                      &hellip;
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => onPageChange(item)}
                      aria-label={`Page ${item}`}
                      aria-current={item === safePage ? "page" : undefined}
                      className={`inline-flex cursor-pointer items-center justify-center rounded-full border-2 border-ink font-extrabold transition ${pageBtnSize} ${
                        item === safePage
                          ? "bg-ink text-cream"
                          : "bg-white text-ink hover:bg-lime"
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>
            </>
          )}

          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            aria-label="Next page"
            className={`inline-flex cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-white font-extrabold text-ink transition hover:bg-lime disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white ${btnHeight}`}
          >
            Next &rarr;
          </button>
        </nav>
      )}
    </div>
  );
}
