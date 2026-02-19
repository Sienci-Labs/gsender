import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center border text-white rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    {
        variants: {
            variant: {
                default:
                    'border-transparent bg-blue-500 text-white',
                secondary:
                    'border-transparent bg-gray-500 text-white',
                destructive:
                    'border-transparent bg-destructive text-white',
                success:
                    'border-green-200 bg-green-50/50 border-green-200 text-green-800',
                warning: 'border-orange-200 bg-orange-50 text-orange-800',
                error: 'border-red-200 bg-red-50/50 text-red-800',
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
