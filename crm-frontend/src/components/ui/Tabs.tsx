import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export const Tabs = TabsPrimitive.Root
export const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.List ref={ref} className={cn('inline-flex items-center border-b border-slate-200 w-full', className)} {...props} />
  )
)
TabsList.displayName = 'TabsList'
export const TabsTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger ref={ref} className={cn(
      'px-4 py-2.5 text-sm font-medium text-slate-500 border-b-2 border-transparent -mb-px transition-colors',
      'hover:text-slate-900 data-[state=active]:text-blue-600 data-[state=active]:border-blue-600', className,
    )} {...props} />
  )
)
TabsTrigger.displayName = 'TabsTrigger'
export const TabsContent = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.Content ref={ref} className={cn('mt-4', className)} {...props} />
  )
)
TabsContent.displayName = 'TabsContent'
