import cn from 'classnames';

interface FirmwareSelectButtonProps {
    label: string;
    active?: boolean;
    onClick?: () => void;
}

function FirmwareSelectButton({ label, active }: FirmwareSelectButtonProps) {
    return (
        <button
            className={cn('text-sm px-2 py-1 rounded', {
                'bg-blue-400 bg-opacity-30': active,
            })}
        >
            {label}
        </button>
    );
}

interface FirmwareSelectorProps {
    onClick: (type: string) => void;
    selectedFirmware: string;
}

export function FirmwareSelector({
    onClick,
    selectedFirmware,
}: FirmwareSelectorProps) {
    const grblActive = selectedFirmware === 'Grbl';
    const halActive = selectedFirmware === 'grblHAL';

    return (
        <div className="mt-4 p-2">
            <div className="flex flex-row justify-around bg-white rounded-md border-solid border-[1px] border-gray-300 p-[2px]">
                <FirmwareSelectButton
                    active={grblActive}
                    label="Grbl"
                    onClick={() => onClick('Grbl')}
                />
                <FirmwareSelectButton
                    active={halActive}
                    label="grblHal"
                    onClick={() => onClick('grblHal')}
                />
            </div>
        </div>
    );
}
