import type { ApiListResponse } from "@/services/apiClient";

const DEFAULT_PAGE_SIZE = 500;

export async function fetchAllPages<T>(
  fetchPage: (page: number, pageSize: number) => Promise<ApiListResponse<T>>,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<T[]> {
  const all: T[] = [];
  let page = 1;

  while (true) {
    const data = await fetchPage(page, pageSize);
    all.push(...data.results);
    if (!data.next) {
      break;
    }
    page += 1;
  }

  return all;
}
