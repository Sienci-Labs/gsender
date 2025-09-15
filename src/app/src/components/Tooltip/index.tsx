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
        <TooltipProvider delayDuration={1500}>
            <TooltipWrapper>
                <TooltipTrigger asChild>{children}</TooltipTrigger>
                <TooltipContent side={side}>{content}</TooltipContent>
            </TooltipWrapper>
        </TooltipProvider>
    );
}

export default Tooltip;
