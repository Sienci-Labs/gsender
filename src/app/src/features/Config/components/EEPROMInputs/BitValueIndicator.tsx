import {
    Tooltip as TooltipWrapper,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from 'app/components/shadcn/Tooltip';
import { Badge } from 'app/components/shadcn/Badge';
import { getBitfieldArr } from './utils.ts';

interface BitValueIndicatorProps {
    value: string | number;
    format: string[];
    bits?: Record<number, string>;
    numBits?: number;
}

function toBinary(value: number, numBits = 8): string {
    return '0b' + value.toString(2).padStart(numBits, '0');
}

export function BitValueIndicator({ value, format, bits, numBits = 8 }: BitValueIndicatorProps) {
    const numericValue = Number(value);
    if (isNaN(numericValue)) return null;

    const bitArr = getBitfieldArr(numericValue);

    // Resolve labels: externalFormat/info.format > info.bits
    let labels: string[] = format;
    if (labels.length === 0 && bits) {
        const maxIndex = Math.max(...Object.keys(bits).map(Number));
        labels = Array.from({ length: maxIndex + 1 }, (_, i) => bits[i] ?? '');
    }

    const totalBits = Math.max(numBits, labels.length, 8);
    const binaryStr = toBinary(numericValue, totalBits);

    const tooltipContent = (
        <div className="text-xs font-mono space-y-1 min-w-[180px]">
            <div className="font-semibold mb-1">
                Value: {numericValue} ({binaryStr})
            </div>
            <hr className="border-slate-600" />
            {labels.map((label, i) => {
                if (!label || label === 'N/A') return null;
                const on = bitArr[i] === 1;
                return (
                    <div key={i} className="flex items-center gap-1.5">
                        <span className={on ? 'text-green-400' : 'text-slate-400'}>
                            {on ? '✓' : ' '}
                        </span>
                        <span className={on ? 'text-white' : 'text-slate-400'}>
                            Bit {i}: {label}
                        </span>
                    </div>
                );
            })}
        </div>
    );

    return (
        <TooltipProvider delayDuration={300}>
            <TooltipWrapper>
                <TooltipTrigger asChild>
                    <span className="cursor-default w-fit inline-flex items-center gap-1.5">
                        <span className="text-xs text-slate-400 font-medium">Value:</span>
                        <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300 font-semibold text-sm px-2.5 py-0.5 rounded-full">
                            {numericValue}
                        </Badge>
                    </span>
                </TooltipTrigger>
                <TooltipContent side="right">{tooltipContent}</TooltipContent>
            </TooltipWrapper>
        </TooltipProvider>
    );
}

export default BitValueIndicator;
