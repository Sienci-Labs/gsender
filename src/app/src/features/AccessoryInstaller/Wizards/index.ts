import { useSienciATCWizard } from 'app/features/AccessoryInstaller/Wizards/atc/ATC.tsx';
import { useMemo } from 'react';
import {useSienciSpindle} from "app/features/AccessoryInstaller/Wizards/spindle/Spindle.tsx";

export function useAllWizards() {
    const atc = useSienciATCWizard();
    const spindle = useSienciSpindle();
    return useMemo(() => [atc, spindle], [atc, spindle]);
}
