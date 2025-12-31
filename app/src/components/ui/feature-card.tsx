import { cn } from '@/lib/utils'
import React from 'react'
import { Card } from './card'
import { Badge } from './badge'
import { IconBox } from './icon-box'
import { type LucideIcon } from 'lucide-react'
import { type VariantProps, cva } from 'class-variance-authority'

const featureCardVariants = cva(
  'card-flat hover-lift transition-all relative group',
  {
    variants: {
      hoverColor: {
        primary: 'hover:border-primary/40',
        success: 'hover:border-success/40',
        warning: 'hover:border-warning/40',
        default: 'hover:border-border',
      },
      padding: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      hoverColor: 'primary',
      padding: 'lg',
    },
  }
)

export interface FeatureCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof featureCardVariants> {
  icon: LucideIcon
  iconVariant?: 'primary' | 'success' | 'warning' | 'destructive' | 'muted'
  title: string
  titleColor?: string
  description: string
  badge?: string
  badgeVariant?: 'default' | 'outline' | 'secondary' | 'destructive'
  badgeClassName?: string
  footer?: React.ReactNode
}

export const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({
    className,
    icon,
    iconVariant = 'primary',
    title,
    titleColor,
    description,
    badge,
    badgeVariant = 'outline',
    badgeClassName,
    footer,
    hoverColor,
    padding,
    ...props
  }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(featureCardVariants({ hoverColor, padding }), className)}
        {...props}
      >
        {badge && (
          <div className="absolute top-2 right-2">
            <Badge
              variant={badgeVariant}
              className={cn('text-[10px]', badgeClassName)}
            >
              {badge}
            </Badge>
          </div>
        )}

        <IconBox icon={icon} variant={iconVariant} className="mb-6" />

        <h3 className={cn('text-xl font-bold mb-3', titleColor || 'text-foreground')}>
          {title}
        </h3>

        <p className="text-muted-foreground text-pretty mb-4">
          {description}
        </p>

        {footer && (
          <div className="text-xs text-muted-foreground border-t border-border pt-3">
            {footer}
          </div>
        )}
      </Card>
    )
  }
)

FeatureCard.displayName = 'FeatureCard'
