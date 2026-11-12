import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog';
import { RadioGroup, RadioGroupItem } from 'app/components/shadcn/RadioGroup';
import { IMPERIAL_UNITS, METRIC_UNITS } from 'app/constants';
import type { UNITS_EN } from 'app/definitions/general';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { useAppTranslation } from 'app/i18n';
import store from 'app/store';
import { useState } from 'react';

interface Props {
    isRemote: boolean;
}

export function UnitBadge({ isRemote }: Props) {
    const { t } = useAppTranslation();
    const { units } = useWorkspaceState();
    const [showPopup, setShowPopup] = useState(false);
    const [localUnits, setLocalUnits] = useState<UNITS_EN>(units);

    const handleUnitSwap = () => {
        store.set('workspace.units', localUnits);
    };

    const unitLabel =
        units == METRIC_UNITS ? 'mm' : t('workspace:dro.units.inch');
    return (
        <>
            <div
                onPointerUp={isRemote ? () => setShowPopup(true) : () => {}}
                className="z-10 absolute -top-2 -left-1 max-xl:-top-1 max-xl:-left-1 px-2 max-xl:px-1 py-1.5 max-xl:py-1 text-xs font-semibold text-gray-600 bg-gray-300 rounded-tl items-center text-center rounded-br-lg  dark:bg-surface-elevated dark:text-content-muted cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={t('workspace:dro.units.currentAriaLabel', {
                    units,
                })}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (isRemote) setShowPopup(true);
                    }
                }}
            >
                <div className="max-xl:hidden">
                    {t('workspace:dro.units.label')}
                    <br /> {units}
                </div>
                <div className={'max-xl:block hidden px-1 py-1.5'}>
                    {unitLabel}
                </div>
            </div>
            <Dialog
                open={showPopup}
                onOpenChange={(open) => {
                    if (!open) handleUnitSwap();
                    setShowPopup(open);
                }}
            >
                <DialogContent className="bg-gray-100 w-36 flex flex-col justify-center">
                    <DialogHeader className="flex justify-start">
                        <DialogTitle>
                            {t('workspace:dro.units.title')}
                        </DialogTitle>
                    </DialogHeader>
                    <RadioGroup
                        name="units"
                        defaultValue={units}
                        onValueChange={(value) =>
                            setLocalUnits(value as UNITS_EN)
                        }
                        aria-label={t('workspace:dro.units.selectAriaLabel')}
                    >
                        <div className="flex flex-col gap-2 mt-3">
                            <div className="flex flex-row gap-3 items-center">
                                <RadioGroupItem
                                    value={IMPERIAL_UNITS}
                                    size="lg"
                                    id="units-imperial"
                                    aria-label={t('workspace:dro.units.inches')}
                                />
                                <label
                                    htmlFor="units-imperial"
                                    className="cursor-pointer"
                                >
                                    {IMPERIAL_UNITS}
                                </label>
                            </div>
                            <div className="flex flex-row gap-3 items-center">
                                <RadioGroupItem
                                    value={METRIC_UNITS}
                                    size="lg"
                                    id="units-metric"
                                    aria-label={t(
                                        'workspace:dro.units.millimeters',
                                    )}
                                />
                                <label
                                    htmlFor="units-metric"
                                    className="cursor-pointer"
                                >
                                    {METRIC_UNITS}
                                </label>
                            </div>
                        </div>
                    </RadioGroup>
                </DialogContent>
            </Dialog>
        </>
    );
}
