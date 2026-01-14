import { cn } from '@/lib/utils'
import React from 'react'
import { Card } from './card'
import { IconBox } from './icon-box'
import { type LucideIcon } from 'lucide-react'

export interface SecurityCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon
  iconVariant?: 'primary' | 'success' | 'warning' | 'destructive' | 'muted'
  value: string | number
  label: string
  description: string
}

export const SecurityCard = React.forwardRef<HTMLDivElement, SecurityCardProps>(
  ({ className, icon, iconVariant = 'primary', value, label, description, ...props }, ref) => {
    return (
      <Card ref={ref} className={cn('card-flat p-6 text-center', className)} {...props}>
        <IconBox icon={icon} variant={iconVariant} className="mx-auto mb-4" />
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      </Card>
    )
  }
)

SecurityCard.displayName = 'SecurityCard'
