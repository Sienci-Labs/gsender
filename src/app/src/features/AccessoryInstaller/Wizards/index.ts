import { useSienciATCWizard } from 'app/features/AccessoryInstaller/Wizards/atc/ATC.tsx';
import { useMemo } from 'react';

export function useAllWizards() {
    const atc = useSienciATCWizard();
    console.log('connected:', atc.validations[0]());
    return useMemo(() => [atc], [atc]);
}
