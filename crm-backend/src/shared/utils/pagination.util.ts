import type { PaginationMeta } from '../types/pagination.types'

export function buildPaginationMeta(
  page: number,
  perPage: number,
  totalCount: number,
): PaginationMeta {
  const totalPages = Math.ceil(totalCount / perPage) || 1
  return {
    page,
    per_page:    perPage,
    total_count: totalCount,
    total_pages: totalPages,
    has_next:    page < totalPages,
    has_prev:    page > 1,
  }
}

export function getPaginationSkip(page: number, perPage: number): number {
  return (page - 1) * perPage
}
