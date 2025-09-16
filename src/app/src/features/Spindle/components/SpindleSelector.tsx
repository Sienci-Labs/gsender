import Select from 'react-select';
import cx from 'classnames';

import Tooltip from 'app/components/Tooltip';

import { Spindle } from '../definitions';

type FormattedSpindle = {
    label: string;
    value: string | number;
};

type Props = {
    spindles: Spindle[];
    onChange: (selectedOption: FormattedSpindle | null) => void;
    spindle: Spindle | null;
    disabled: boolean;
};

const formatSpindles = (spindles: Spindle[] = []): FormattedSpindle[] => {
    return spindles.map((spindle) => ({
        label: `${spindle.id}: ${spindle.label} (${spindle.capabilities})`,
        value: spindle.id,
    }));
};

const SpindleSelector = ({ spindles, onChange, spindle, disabled }: Props) => {
    const spindleFormatted = { label: spindle.label, value: spindle.id };
    const formattedSpindles = formatSpindles(spindles);
    return (
        <Tooltip content="Select a spindle">
            <div
                className={cx(
                    'flex gap-1 justify-center my-2 w-full items-center',
                    {
                        'cursor-not-allowed': disabled,
                    },
                )}
            >
                <Select<FormattedSpindle>
                    options={formattedSpindles}
                    placeholder="Default Spindle"
                    value={spindleFormatted}
                    onChange={onChange}
                    className="w-full z-10"
                    menuPlacement="top"
                    isDisabled={disabled}
                />
            </div>
        </Tooltip>
    );
};

export default SpindleSelector;
