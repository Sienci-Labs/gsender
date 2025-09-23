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
        const digitCount = Math.floor(currentValue).toString().length; // number of whole digits
        const split = currentValue.toString().split('.');
        const digitCountDecimal = split[1] ? split[1].length : 0; // number of digits after the decimal point
        const x = Number('1'.padEnd(digitCount, '0')); // ex. currentValue = 234, x = 100
        const y = Number('1'.padEnd(digitCount - 1, '0')); // ex. currentValue = 234, y = 10
        const xD = Number('0.' + '1'.padStart(digitCountDecimal, '0')); // ex. currentValue = 0.02, x = 0.01
        const yD = Number('0.' + '1'.padStart(digitCountDecimal + 1, '0')); // ex. currentValue = 0.02, x = 0.001

        if (currentValue === 0) {
            if (!increment) {
                return 0; // don't decrease less than 0
            }
            return 0.1; // add 0.1
        } else if (currentValue < 1 || (!increment && currentValue === 1)) {
            if (!increment && currentValue - xD < xD) {
                // ex. 0.01 - 0.01 < 0.01
                step = yD; // ex. currentValue = 0.01, step = 0.001
            } else {
                step = xD; // ex. currentValue = 0.02, step = 0.01
            }
        } else {
            if (!increment && currentValue - x < x) {
                // ex. 110 - 100 < 100
                step = y; // ex. currentValue = 110, step = 10
            } else {
                step = x; // ex. currentValue = 210, step = 100
            }
        }

        if (step < 0.001) {
            return 0; // make sure it can't go lower than 0.001
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
                // ex. >= 100 && < 200
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
            <div className="grid grid-cols-[1fr_5fr_1fr] max-w-28 items-center gap-0 rounded-full dark:bg-dark shadow-inner">
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
