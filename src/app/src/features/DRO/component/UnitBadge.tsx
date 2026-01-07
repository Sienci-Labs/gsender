import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog';
import { RadioGroup, RadioGroupItem } from 'app/components/shadcn/RadioGroup';
import { IMPERIAL_UNITS, METRIC_UNITS } from 'app/constants';
import { UNITS_EN } from 'app/definitions/general';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import store from 'app/store';
import { useState } from 'react';

interface Props {
    isRemote: boolean;
}

export function UnitBadge({ isRemote }: Props) {
    const { units } = useWorkspaceState();
    const [showPopup, setShowPopup] = useState(false);
    const [localUnits, setLocalUnits] = useState<UNITS_EN>(units);

    const handleUnitSwap = () => {
        store.set('workspace.units', localUnits);
    };
    return (
        <>
            <div
                onPointerUp={isRemote ? () => setShowPopup(true) : () => {}}
                className="z-10 absolute -top-2 -left-1 max-xl:-top-1 max-xl:-left-1 px-2 max-xl:px-1 py-1.5 max-xl:py-1 text-xs font-semibold text-gray-600 bg-gray-300 rounded-tl items-center text-center rounded-br-lg  dark:bg-gray-700 dark:text-gray-400"
            >
                <span>
                    Units:
                    <br /> {units}
                </span>
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
                        <DialogTitle>Units</DialogTitle>
                    </DialogHeader>
                    <RadioGroup
                        name="units"
                        defaultValue={units}
                        onValueChange={(value) =>
                            setLocalUnits(value as UNITS_EN)
                        }
                    >
                        <div className="flex flex-col gap-2 mt-3">
                            <div className="flex flex-row gap-3">
                                <RadioGroupItem
                                    value={IMPERIAL_UNITS}
                                    size="lg"
                                />
                                <p>{IMPERIAL_UNITS}</p>
                            </div>
                            <div className="flex flex-row gap-3">
                                <RadioGroupItem
                                    value={METRIC_UNITS}
                                    size="lg"
                                />
                                <p>{METRIC_UNITS}</p>
                            </div>
                        </div>
                    </RadioGroup>
                </DialogContent>
            </Dialog>
        </>
    );
}
