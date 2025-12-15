import { useSienciATCWizard } from 'app/features/AccessoryInstaller/Wizards/atc/ATC.tsx';

export function useAllWizards() {
    const atc = useSienciATCWizard();
    return [atc];
}
