export const env = {
  API_BASE_URL: (import.meta as any).env?.VITE_API_BASE_URL ?? '/api/v1',
  isDev: (import.meta as any).env?.DEV ?? true,
}
