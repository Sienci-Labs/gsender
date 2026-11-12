import Tooltip from 'app/components/Tooltip';
import { useAppTranslation } from 'app/i18n';
import cx from 'classnames';
import Select from 'react-select';

import type { Spindle } from '../definitions';

type FormattedSpindle = {
    label: string;
    value: string | number;
};

type Props = {
    spindles: Spindle[];
    onChange: (selectedOption: FormattedSpindle | null) => void;
    onMenuOpen: () => void;
    spindle: Spindle | null;
    disabled: boolean;
};

const formatSpindles = (spindles: Spindle[] = []): FormattedSpindle[] => {
    return spindles.map((spindle) => ({
        label: `${spindle.label} (${spindle.capabilities})`,
        value: spindle.id,
    }));
};

const SpindleSelector = ({
    spindles,
    onChange,
    onMenuOpen,
    spindle,
    disabled,
}: Props) => {
    const { t } = useAppTranslation();
    const spindleFormatted = { label: spindle.label, value: spindle.id };
    const formattedSpindles = formatSpindles(spindles);

    return (
        <Tooltip content={t('workspace:spindle.selector.tooltip')}>
            <div
                className={cx('flex gap-1 justify-center w-full items-center', {
                    'cursor-not-allowed': disabled,
                })}
            >
                <Select<FormattedSpindle>
                    options={formattedSpindles}
                    placeholder={t('workspace:spindle.selector.defaultSpindle')}
                    value={spindleFormatted}
                    onChange={onChange}
                    onMenuOpen={onMenuOpen}
                    className="w-full z-10"
                    menuPlacement="top"
                    isDisabled={disabled}
                    aria-label={t('workspace:spindle.selector.ariaLabel')}
                />
            </div>
        </Tooltip>
    );
};

export default SpindleSelector;
