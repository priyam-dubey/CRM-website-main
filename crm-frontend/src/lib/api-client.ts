import axios from 'axios'
import { env } from '@/config/env'

let accessToken: string | null = null
export const tokenStore = { get: () => accessToken, set: (t: string|null) => { accessToken = t }, clear: () => { accessToken = null } }

export const apiClient = axios.create({ baseURL: env.API_BASE_URL, withCredentials: true, timeout: 30_000 })

apiClient.interceptors.request.use(config => {
  if (accessToken && config.headers) config.headers.Authorization = "Bearer " + accessToken
  return config
})

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) return error.response?.data?.message ?? error.message
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred'
}
