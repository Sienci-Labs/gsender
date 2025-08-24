import { ControlledInput } from 'app/components/ControlledInput';

interface IPSettingInputsProps {
    ip: number[];
    index: number;
    subIndex: number;
    onChange: (value) => void;
}

export function IPSettingInput({ ip = [], onChange }: IPSettingInputsProps) {
    function updateIPPortion(index, v) {
        const newIP = [...ip];
        newIP[index] = Number(v);
        onChange(newIP);
    }
    return (
        <div className="flex flex-row gap-1 items-end justify-center">
            <ControlledInput
                type="number"
                className="w-[4ch] px-0 text-center ring-1 ring-gray-300 rounded-md"
                value={ip[0]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateIPPortion(0, e.target.value)
                }
            />
            .
            <ControlledInput
                type="number"
                className="w-[4ch] px-0 text-center ring-1 ring-gray-300 rounded-md"
                value={ip[1]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateIPPortion(1, e.target.value)
                }
            />
            .
            <ControlledInput
                type="number"
                className="w-[4ch] px-0 text-center ring-1 ring-gray-300 rounded-md"
                value={ip[2]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateIPPortion(2, e.target.value)
                }
            />
            .
            <ControlledInput
                type="number"
                className="w-[4ch] px-0 text-center ring-1 ring-gray-300 rounded-md"
                value={ip[3]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateIPPortion(3, e.target.value)
                }
            />
        </div>
    );
}
