import { TooltipContentProps } from '@radix-ui/react-tooltip';

import {
    Tooltip as TooltipWrapper,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from 'app/components/shadcn/Tooltip';

export interface TooltipProps {
    children?: React.ReactNode;
    content?: string;
    side?: TooltipContentProps['side'];
}

export function Tooltip({ children, content, side }: TooltipProps) {
    return (
        <TooltipProvider>
            <TooltipWrapper>
                <TooltipTrigger asChild>{children}</TooltipTrigger>
                <TooltipContent side={side}>{content}</TooltipContent>
            </TooltipWrapper>
        </TooltipProvider>
    );
}

export default Tooltip;
