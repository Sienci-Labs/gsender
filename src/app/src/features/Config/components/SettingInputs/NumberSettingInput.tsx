export interface NumberSettingInputProps {
    unit?: string;
}

export function NumberSettingInput({ unit = null }: NumberSettingInputProps) {
    return (
        <div className="ring-1 ring-gray-300 flex flex-row flex-1 rounded">
            <input type="number" className="flex-1 p-2 focus:outline-none" />
            {unit && (
                <span className="flex items-center justify-center min-w-16 px-2 text-base bg-gray-300 text-gray-700">
                    {unit}
                </span>
            )}
        </div>
    );
}
