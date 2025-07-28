import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center text-white rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    {
        variants: {
            variant: {
                default:
                    'border-transparent bg-blue-500 text-white hover:bg-blue-500/80',
                secondary:
                    'border-transparent bg-gray-500 text-white hover:bg-gray-500/80',
                destructive:
                    'border-transparent bg-destructive text-white hover:bg-destructive/80',
                success:
                    'border-transparent bg-green-500 text-white hover:bg-green-500/80',
                warning:
                    'border-transparent bg-orange-500 text-white hover:bg-warning/80',
                error: 'border-transparent bg-red-500 text-white hover:bg-error/80',
                outline: 'text-foreground',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
