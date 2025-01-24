export interface NumberSettingInputProps {
    unit?: string;
    value: number;
    index: number;
    subIndex: number;
    onChange: (value) => void;
}

export function NumberSettingInput({
    unit = null,
    value = 0,
    onChange,
}: NumberSettingInputProps) {
    return (
        <div className="ring-1 ring-gray-300 flex flex-row flex-1 rounded">
            <input
                type="number"
                value={value}
                className="flex-1 p-2 focus:outline-none"
                onChange={(e) => onChange(e.target.value)}
            />
            {unit && (
                <span className="flex items-center justify-center min-w-16 px-2 text-xs bg-gray-300 text-gray-700">
                    {unit}
                </span>
            )}
        </div>
    );
}
