import { LayoutDashboard, BookOpen, Users, DollarSign, Shield, Activity,
  Database, Plane, CreditCard, Building2, Globe, PhoneCall, Tag, Settings, Search } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string; href: string; icon: LucideIcon; module?: string; action?: string; children?: NavItem[]
}
export interface NavGroup { label: string; items: NavItem[] }

export const NAV_GROUPS: NavGroup[] = [
  { label: 'Overview', items: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ]},
  { label: 'Operations', items: [
    { label: 'Bookings', href: '/bookings', icon: BookOpen },
    { label: 'Find Bookings', href: '/bookings/find', icon: Search },
    { label: 'Users', href: '/users', icon: Users },
  ]},
  { label: 'Finance', items: [
    { label: 'Revenue', href: '/revenue', icon: DollarSign, children: [
      { label: 'Dashboard', href: '/revenue', icon: LayoutDashboard },
      { label: 'Details', href: '/revenue/details', icon: Tag },
      { label: 'Reports', href: '/revenue/reports', icon: Activity },
      { label: 'MCOs', href: '/revenue/mco', icon: Tag },
      { label: 'Chargebacks', href: '/revenue/chargebacks', icon: CreditCard },
      { label: 'Refunds', href: '/revenue/refunds', icon: DollarSign },
    ]},
  ]},
  { label: 'Security', items: [
    { label: 'Security', href: '/security/ip-rules', icon: Shield, children: [
      { label: 'IP Rules', href: '/security/ip-rules', icon: Globe },
      { label: 'Security Logs', href: '/security/logs', icon: Shield },
      { label: 'Sessions', href: '/security/sessions', icon: Users },
    ]},
    { label: 'Activity', href: '/activity', icon: Activity },
  ]},
  { label: 'Configuration', items: [
    { label: 'Manage Data', href: '/manage', icon: Database, children: [
      { label: 'Overview', href: '/manage', icon: Database },
      { label: 'Airlines', href: '/manage/airlines', icon: Plane },
      { label: 'Classes', href: '/manage/classes', icon: Tag },
      { label: 'Currencies', href: '/manage/currencies', icon: Globe },
      { label: 'Card Processors', href: '/manage/card-processors', icon: CreditCard },
      { label: 'Providers', href: '/manage/providers', icon: Building2 },
      { label: 'Call Queues', href: '/manage/call-queues', icon: PhoneCall },
    ]},
  ]},
]

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: 'Settings', href: '/settings/profile', icon: Settings },
]
