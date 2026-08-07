import { useLocation } from 'react-router-dom'
const LABELS: Record<string,string> = {
  dashboard:'Dashboard', bookings:'Bookings', new:'New', users:'Users', revenue:'Revenue',
  reports:'Reports', mco:'MCOs', chargebacks:'Chargebacks', refunds:'Refunds', security:'Security',
  'ip-rules':'IP Rules', logs:'Logs', sessions:'Sessions', activity:'Activity', manage:'Manage Data',
  airlines:'Airlines', classes:'Classes', currencies:'Currencies', 'card-processors':'Card Processors',
  providers:'Providers', 'call-queues':'Call Queues', settings:'Settings', profile:'Profile',
  notifications:'Notifications', company:'Company', edit:'Edit',
}
export function useBreadcrumbs() {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)
  let path = ''
  return parts.map(part => {
    path += '/' + part
    return { label: LABELS[part] ?? (part.length === 36 ? 'Detail' : part), href: path }
  })
}
