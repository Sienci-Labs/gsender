import {
    Tooltip as TooltipWrapper,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from 'app/components/shadcn/Tooltip';

export interface TooltipProps {
    children?: React.ReactNode;
    content?: string;
    location?: string;
}

export function Tooltip(props: TooltipProps) {
    return (
        <TooltipProvider>
            <TooltipWrapper>
                <TooltipTrigger className="w-full" asChild>
                    {props.children}
                </TooltipTrigger>
                <TooltipContent>{props.content}</TooltipContent>
            </TooltipWrapper>
        </TooltipProvider>
    );
}

export default Tooltip;
