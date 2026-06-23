import { useEffect, useMemo, useState } from "react";

export function useWizardGridPage<T>(
  items: T[],
  pageSize: number,
  resetKey: string,
): {
  page: number;
  setPage: (page: number) => void;
  pagedItems: T[];
  totalCount: number;
} {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );

  return {
    page: safePage,
    setPage,
    pagedItems,
    totalCount,
  };
}
