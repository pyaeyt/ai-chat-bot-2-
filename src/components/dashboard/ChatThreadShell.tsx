'use client'

import { cn } from '@/lib/utils'

/**
 * Full-height chat / DM column. Dashboard layout main is a flex column with flex-1 min-h-0 so this fills the viewport.
 */
export default function ChatThreadShell({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'flex flex-col flex-1 min-h-0',
        '-mx-4 -mt-4 -mb-4 sm:-mx-6 sm:-mt-6 sm:-mb-6',
        className
      )}
    >
      {children}
    </div>
  )
}
