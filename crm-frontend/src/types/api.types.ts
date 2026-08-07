export interface PaginationMeta {
  page: number; per_page: number; total_count: number; total_pages: number; has_next: boolean; has_prev: boolean
}
export interface PaginatedResponse<T> { data: T[]; meta: PaginationMeta }
export interface ApiError { statusCode: number; error: string; message: string; code: string; timestamp: string; path: string }
export interface PaginationParams { page?: number; per_page?: number; sort_by?: string; sort_dir?: 'asc'|'desc' }

export interface CursorPaginatedResponse<T> {
  data:        T[]
  next_cursor: string | null
  has_more:    boolean
}
