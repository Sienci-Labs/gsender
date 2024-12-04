interface IPSettingInputsProps {
    ip: number[];
    index: number;
    subIndex: number;
}

export function IPSettingInput({ ip = [] }: IPSettingInputsProps) {
    console.log(ip);
    return (
        <div className="flex flex-row gap-2 items-end">
            <input
                type="number"
                className="w-[6ch] p-2 text-center box-border border border-solid border-gray-300 rounded-sm focus:outline-none"
                value={ip[0]}
            />
            .
            <input
                type="number"
                className="w-[6ch] p-2 text-center box-border border border-solid border-gray-300 rounded-sm focus:outline-none"
                value={ip[1]}
            />
            .
            <input
                type="number"
                className="w-[6ch] p-2 text-center box-border border border-solid border-gray-300 rounded-sm focus:outline-none"
                value={ip[2]}
            />
            .
            <input
                type="number"
                className="w-[6ch] p-2 text-center box-border border border-solid border-gray-300 rounded-sm focus:outline-none"
                value={ip[3]}
            />
        </div>
    );
}
