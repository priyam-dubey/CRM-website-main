import { Link } from 'react-router-dom'
import { Plane, Tag, Globe, CreditCard, Building2, PhoneCall } from 'lucide-react'
import { PageHeader } from '@/components/app/PageHeader'

const DATA_TYPES = [
  { label: 'Airlines', href: '/manage/airlines', icon: Plane },
  { label: 'Classes', href: '/manage/classes', icon: Tag },
  { label: 'Currency', href: '/manage/currencies', icon: Globe },
  { label: 'Cards', href: '/manage/card-processors', icon: CreditCard },
  { label: 'Providers', href: '/manage/providers', icon: Building2 },
  { label: 'Call Queue', href: '/manage/call-queues', icon: PhoneCall },
]

export default function ManageOverviewPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Select Data Type to Manage" subtitle="Choose a reference-data type to view, add, or edit" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {DATA_TYPES.map(({ label, href, icon: Icon }) => (
          <Link key={href} to={href}
            className="flex flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm transition-colors hover:border-primary hover:bg-primary/5">
            <Icon className="h-8 w-8 text-primary/70" />
            <span className="font-medium text-slate-900">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
