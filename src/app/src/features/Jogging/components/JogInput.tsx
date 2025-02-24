import { Label } from 'app/components/Label';
import noop from 'lodash/noop';

interface JogInputProps {
    label: string;
    onClick?: () => void;
    currentValue: number | string;
}
export function JogInput({ label, currentValue }: JogInputProps) {
    return (
        <div className="flex flex-row justify-between items-center gap-4">
            <Label className="text-right">{label}</Label>
            <input
                className="w-[8ch] border border-gray-200 rounded px-2 text-gray-500"
                value={currentValue}
                onChange={noop}
            />
        </div>
    );
}
