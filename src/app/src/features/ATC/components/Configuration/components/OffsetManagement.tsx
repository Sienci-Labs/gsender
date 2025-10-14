import { useState } from 'react';

import { Switch } from 'app/components/shadcn/Switch';

interface OffsetManagementWidgetProps {
    value?: number;
    onChange?: (value: number) => void;
    defaultValue?: number;
}

export default function OffsetManagementWidget({
    value = 0,
    onChange,
    defaultValue = 0,
}: OffsetManagementWidgetProps) {
    const [internalValue, setInternalValue] = useState(value);

    const currentValue = onChange ? value : internalValue;
    const isDefault = currentValue === defaultValue;

    const isUseToolTable = currentValue === 1 || currentValue === 2;
    const isVerifyEnabled = currentValue === 2;

    const handleOffsetModeChange = (useToolTable: boolean) => {
        const newValue = useToolTable ? 1 : 0;
        if (onChange) {
            onChange(newValue);
        } else {
            setInternalValue(newValue);
        }
    };

    const handleVerifyToggle = () => {
        const newValue = isVerifyEnabled ? 1 : 2;
        if (onChange) {
            onChange(newValue);
        } else {
            setInternalValue(newValue);
        }
    };

    return (
        <div
            className={` transition-colors ${
                isDefault ? 'bg-none' : 'bg-yellow-50'
            }`}
        >
            <div className="space-y-2">
                <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            checked={!isUseToolTable}
                            onChange={() => handleOffsetModeChange(false)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                            Probe New Offset when Tool Changing
                        </span>
                    </label>

                    <div className="space-y-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                checked={isUseToolTable}
                                onChange={() => handleOffsetModeChange(true)}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                                Use Tool Table Offset
                            </span>
                        </label>

                        <div className="ml-6 pl-2">
                            <label className="flex items-center justify-between cursor-pointer">
                                <span
                                    className={`text-sm ${
                                        isUseToolTable
                                            ? 'text-gray-700'
                                            : 'text-gray-400'
                                    }`}
                                >
                                    Verify tool length changes
                                </span>
                                <Switch
                                    checked={isVerifyEnabled}
                                    onCheckedChange={handleVerifyToggle}
                                    disabled={!isUseToolTable}
                                />
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
