import { useSienciATCWizard } from 'app/features/AccessoryInstaller/Wizards/atc/ATC.tsx';
import { useMemo } from 'react';
import {useSienciSpindle} from "app/features/AccessoryInstaller/Wizards/spindle/Spindle.tsx";
import { useSienciTLSWizard } from 'app/features/AccessoryInstaller/Wizards/tls/TLS.tsx';

export function useAllWizards() {
    const atc = useSienciATCWizard();
    const spindle = useSienciSpindle();
    const tls = useSienciTLSWizard();
    return useMemo(() => [atc, spindle, tls], [atc, spindle, tls]);
}
