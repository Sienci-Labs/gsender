import noop from 'lodash/noop';

import { Label } from 'app/components/Label';
import { Input } from 'app/components/Input';

interface JogInputProps {
    label: string;
    onClick?: () => void;
    currentValue: number | string;
}
export function JogInput({ label, currentValue }: JogInputProps) {
    return (
        <div className="flex flex-row justify-between items-center gap-2">
            <Label className="min-w-[2ch] text-right">{label}</Label>
            <Input sizing="sm" value={currentValue} onChange={noop} />
        </div>
    );
}
