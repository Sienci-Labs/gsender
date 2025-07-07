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
    const getStep = () => {
        if (label === 'at') {
            return 1000; // feedrate should change by 1000
        } else if (units === IMPERIAL_UNITS) {
            return 0.1; // smaller increments for inches
        } else {
            return 1;
        }
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
            <Label className="min-w-[3ch] text-right whitespace-nowrap">
                {label}
            </Label>
            <div className="flex flex-row justify-between items-center gap-2 rounded-full bg-gray-200 shadow-inner">
                <Button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        onChange(formatNewValue(currentValue - getStep()));
                    }}
                    size="xs"
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
                        onChange(formatNewValue(currentValue + getStep()));
                    }}
                    size="xs"
                    icon={<FaPlus />}
                />
            </div>
        </div>
    );
};
