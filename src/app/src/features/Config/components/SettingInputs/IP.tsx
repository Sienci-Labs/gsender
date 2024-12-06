interface IPSettingInputsProps {
    ip: number[];
    index: number;
    subIndex: number;
    onChange: (value) => void;
}

export function IPSettingInput({ ip = [], onChange }: IPSettingInputsProps) {
    function updateIPPortion(index, v) {
        const newIP = [...ip];
        console.log(newIP);
        console.log(v);
        newIP[index] = Number(v);
        console.log(newIP);
        onChange(newIP);
    }
    return (
        <div className="flex flex-row gap-2 items-end">
            <input
                type="number"
                className="w-[6ch] p-2 text-center box-border border border-solid border-gray-300 rounded-sm focus:outline-none"
                value={ip[0]}
                onChange={(e) => updateIPPortion(0, e.target.value)}
            />
            .
            <input
                type="number"
                className="w-[6ch] p-2 text-center box-border border border-solid border-gray-300 rounded-sm focus:outline-none"
                value={ip[1]}
                onChange={(e) => updateIPPortion(1, e.target.value)}
            />
            .
            <input
                type="number"
                className="w-[6ch] p-2 text-center box-border border border-solid border-gray-300 rounded-sm focus:outline-none"
                value={ip[2]}
                onChange={(e) => updateIPPortion(2, e.target.value)}
            />
            .
            <input
                type="number"
                className="w-[6ch] p-2 text-center box-border border border-solid border-gray-300 rounded-sm focus:outline-none"
                value={ip[3]}
                onChange={(e) => updateIPPortion(3, e.target.value)}
            />
        </div>
    );
}
