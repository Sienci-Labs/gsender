import { Label } from 'app/components/Label';

interface JogInputProps {
    label: string;
    onClick?: () => void;
    currentValue: number | string;
}
export function JogInput({ label, currentValue }: JogInputProps) {
    return (
        <div className="flex flex-row justify-between gap-4">
            <Label className="text-right">{label}</Label>
            <input
                className="w-[8ch] border border-gray-200 rounded px-2 text-gray-500"
                value={currentValue}
            />
        </div>
    );
}
