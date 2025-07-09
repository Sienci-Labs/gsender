import { Label } from 'app/components/Label';
import { ControlledInput } from 'app/components/ControlledInput';
import { FaMinus, FaPlus } from 'react-icons/fa';
import { IMPERIAL_UNITS, METRIC_UNITS } from 'app/constants';
import store from 'app/store';
import Button from 'app/components/Button';

interface JogInputProps {
    label: string;
    onChange: (step: number) => void;
    currentValue: number;
}

export const JogInput = ({ label, currentValue, onChange }: JogInputProps) => {
    const units = store.get('workspace.units', METRIC_UNITS);
    const getStep = (increment = false) => {
        let step;

        if (currentValue === 0) {
            return 0.1;
        }
        if (currentValue < 0.1) {
            step = 0.01;
        } else if (currentValue < 1) {
            step = 0.1;
        } else if (currentValue < 10) {
            step = 1;
        } else if (currentValue < 100) {
            step = 10;
        } else if (currentValue < 1000) {
            step = 100;
        } else if (currentValue < 10000) {
            step = 1000;
        } else {
            step = 10000;
        }

        if (!increment && step !== 0.001 && currentValue - step === 0) {
            step /= 10;
        }
        return step;
    };

    const formatNewValue = (newValue: number) => {
        if (units === IMPERIAL_UNITS) {
            return Number(newValue.toFixed(3));
        } else {
            return Number(newValue.toFixed(2));
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
                        onChange(formatNewValue(currentValue + getStep(true)));
                    }}
                    size="mini"
                    icon={<FaPlus />}
                />
            </div>
        </div>
    );
};
