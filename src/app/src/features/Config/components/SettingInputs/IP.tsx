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
    const [first, second, third, fourth] = ip;

    return (
        <div className="flex flex-row gap-2 items-end">
            <input
                type="number"
                className="w-[6ch] p-2 text-center box-border border border-solid border-gray-300 rounded-sm focus:outline-none"
                value={first}
                onChange={(e) => updateIPPortion(0, e.target.value)}
            />
            .
            <input
                type="number"
                className="w-[6ch] p-2 text-center box-border border border-solid border-gray-300 rounded-sm focus:outline-none"
                value={second}
                onChange={(e) => updateIPPortion(1, e.target.value)}
            />
            .
            <input
                type="number"
                className="w-[6ch] p-2 text-center box-border border border-solid border-gray-300 rounded-sm focus:outline-none"
                value={third}
                onChange={(e) => updateIPPortion(2, e.target.value)}
            />
            .
            <input
                type="number"
                className="w-[6ch] p-2 text-center box-border border border-solid border-gray-300 rounded-sm focus:outline-none"
                value={fourth}
                onChange={(e) => updateIPPortion(3, e.target.value)}
            />
        </div>
    );
}
