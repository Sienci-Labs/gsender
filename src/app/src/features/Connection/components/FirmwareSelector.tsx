import cn from 'classnames';
import { FirmwareFlavour } from 'app/features/Connection';

interface FirmwareSelectButtonProps {
    label: string;
    active?: boolean;
    onClick?: () => void;
}

function FirmwareSelectButton({
    label,
    active,
    onClick,
}: FirmwareSelectButtonProps) {
    return (
        <button
            className={cn('text-sm px-2 py-1 rounded', {
                'bg-blue-400 bg-opacity-30': active,
            })}
            onClick={onClick}
        >
            {label}
        </button>
    );
}

interface FirmwareSelectorProps {
    onClick: (type: FirmwareFlavour) => void;
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
            <div className="flex flex-row justify-around bg-white rounded-md border-solid border border-gray-300 p-[2px]">
                <FirmwareSelectButton
                    active={grblActive}
                    label="Grbl"
                    onClick={() => onClick('Grbl')}
                />
                <FirmwareSelectButton
                    active={halActive}
                    label="grblHal"
                    onClick={() => onClick('grblHAL')}
                />
            </div>
        </div>
    );
}
