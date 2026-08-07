export interface PaginationMeta {
  page:        number
  per_page:    number
  total_count: number
  total_pages: number
  has_next:    boolean
  has_prev:    boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface CursorPaginatedResponse<T> {
  data:        T[]
  next_cursor: string | null
  has_more:    boolean
}
