import { Label } from 'app/components/Label';
import { ControlledInput } from 'app/components/ControlledInput';
import { FaMinus, FaPlus } from 'react-icons/fa';
import Button from 'app/components/Button';
import { toFixedIfNecessary } from 'app/lib/rounding';

interface JogInputProps {
    label: string;
    onChange: (step: number) => void;
    currentValue: number;
}

export const JogInput = ({ label, currentValue, onChange }: JogInputProps) => {
    const getStep = (increment = false) => {
        let step;

        if (currentValue === 0) {
            if (!increment) {
                return 0;
            }
            return 0.1;
        }
        if (currentValue < 0.01) {
            step = 0.001;
        } else if (currentValue < 0.1) {
            step = 0.01;
        } else if (currentValue < 1) {
            step = 0.1;
        } else if (currentValue < 10 || (!increment && currentValue - 10 < 1)) {
            step = 1;
        } else if (
            currentValue < 100 ||
            (!increment && currentValue - 100 < 100)
        ) {
            step = 10;
        } else if (
            currentValue < 1000 ||
            (!increment && currentValue - 1000 < 1000)
        ) {
            step = 100;
        } else if (
            currentValue < 10000 ||
            (!increment && currentValue - 10000 < 10000)
        ) {
            step = 1000;
        } else {
            step = 10000;
        }

        if (!increment && currentValue - step <= 0) {
            if (step > 0.001) {
                step /= 10;
            } else {
                return 0;
            }
        }
        return step;
    };

    // rounds the values
    const formatNewValue = (newValue: number, increment = false) => {
        // sometimes js math messes up the value. ex. 0.7 when pressing + will give you 0.799999999.
        // this causes problems for this rounding scheme.
        // so we need to round to 4 decimal places first to get rid of any infinite decimals.
        // I chose 4 because it's 1 more than our max decimal places, so it shouldn't affect the number we want to display.
        newValue = Number(newValue.toFixed(4));
        console.log(newValue);
        if (newValue < 1) {
            return toFixedIfNecessary(newValue, 3); // round to max 3 decimal places
        } else if (newValue < 10) {
            return toFixedIfNecessary(newValue, 2); // round to max 2 decimal places
        } else {
            const digitCount = newValue.toFixed(0).length;
            const x = Number('1'.padEnd(digitCount - 1, '0')); // ex. newValue = 100, x = 10
            const lower = Number('1'.padEnd(digitCount, '0')); // 10, 100, 1000, etc
            const higher = Number('2'.padEnd(digitCount, '0')); // 20, 200, 2000, etc

            if (newValue >= lower && newValue < higher) {
                // ex. >= 10 && < 20
                return increment
                    ? Math.floor(newValue / x) * x // ex. 115->120
                    : Math.ceil(newValue / x) * x; // ex. 115->110
            } else {
                // ex. increment: 45.1->55, 45.5->56
                // ex. decrement: 45.1->35, 45.5->36
                return Math.round(newValue / x) * x;
            }
        }
    };

    return (
        <div className="flex flex-row justify-end items-center gap-2">
            <Label className="min-w-[2ch] text-right whitespace-nowrap">
                {label}
            </Label>
            <div className="grid grid-cols-[1fr_5fr_1fr] max-w-28 items-center gap-0 rounded-full bg-gray-200 shadow-inner">
                <Button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        onChange(formatNewValue(currentValue - getStep()));
                    }}
                    size="mini"
                    icon={<FaMinus />}
                />
                <ControlledInput
                    sizing="xs"
                    type="number"
                    value={currentValue}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="flex-1"
                />
                <Button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        onChange(
                            formatNewValue(currentValue + getStep(true), true),
                        );
                    }}
                    size="mini"
                    icon={<FaPlus />}
                />
            </div>
        </div>
    );
};
