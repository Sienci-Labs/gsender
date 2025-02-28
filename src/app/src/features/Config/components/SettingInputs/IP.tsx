import { Input } from 'app/components/Input';

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
        <div className="flex flex-row gap-2 items-end">
            <Input
                type="number"
                className="w-[6ch] p-2 text-center"
                value={ip[0]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateIPPortion(0, e.target.value)
                }
            />
            .
            <Input
                type="number"
                className="w-[6ch] p-2 text-center"
                value={ip[1]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateIPPortion(1, e.target.value)
                }
            />
            .
            <Input
                type="number"
                className="w-[6ch] p-2 text-center"
                value={ip[2]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateIPPortion(2, e.target.value)
                }
            />
            .
            <Input
                type="number"
                className="w-[6ch] p-2 text-center"
                value={ip[3]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateIPPortion(3, e.target.value)
                }
            />
        </div>
    );
}
