import { DEFAULT_VACUUM_TABLE_SIZE } from 'app/features/AccessoryInstaller/Wizards/vacuum-table/constants/sizes.ts';
import { createContext, type ReactNode, useContext, useState } from 'react';

const VacuumTableContext = createContext({
    tableSize: DEFAULT_VACUUM_TABLE_SIZE,
    setTableSize: (_size: string) => {},
});

export function VacuumTableProvider({ children }: { children: ReactNode }) {
    const [tableSize, setTableSize] = useState(DEFAULT_VACUUM_TABLE_SIZE);

    return (
        <VacuumTableContext.Provider value={{ tableSize, setTableSize }}>
            {children}
        </VacuumTableContext.Provider>
    );
}

export const useVacuumTable = () => useContext(VacuumTableContext);
