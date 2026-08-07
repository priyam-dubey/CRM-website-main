export type DateRangePreset = "today" | "last_30_days" | "this_month" | "last_12_months" | "this_year"

/**
 * Resolves the dashboard/revenue date-range presets shown in the client CRM
 * (Today / Last 30 Days / This Month / Last 12 Months / This Year), or an
 * explicit custom date_from/date_to pair when provided (custom takes
 * priority over preset).
 */
export function resolveDateRange(
  preset?: string,
  dateFrom?: string,
  dateTo?: string,
): { since: Date; until: Date } {
  if (dateFrom || dateTo) {
    return {
      since: dateFrom ? new Date(dateFrom) : new Date(0),
      until: dateTo ? new Date(dateTo) : new Date(),
    }
  }

  const now = new Date()
  const until = now

  switch (preset) {
    case "today": {
      const since = new Date(now); since.setHours(0, 0, 0, 0)
      return { since, until }
    }
    case "this_month": {
      const since = new Date(now.getFullYear(), now.getMonth(), 1)
      return { since, until }
    }
    case "last_12_months": {
      const since = new Date(now); since.setFullYear(since.getFullYear() - 1)
      return { since, until }
    }
    case "this_year": {
      const since = new Date(now.getFullYear(), 0, 1)
      return { since, until }
    }
    case "last_30_days":
    default: {
      const since = new Date(now.getTime() - 30 * 86_400_000)
      return { since, until }
    }
  }
}
