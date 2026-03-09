import { useSienciATCWizard } from 'app/features/AccessoryInstaller/Wizards/atc/ATC.tsx';
import { useMemo } from 'react';

export function useAllWizards() {
    const atc = useSienciATCWizard();
    return useMemo(() => [atc], [atc]);
}
