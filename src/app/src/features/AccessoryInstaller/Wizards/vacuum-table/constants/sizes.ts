export interface VacuumTableSize {
    value: string;
    label: string;
    description: string;
}

export const VACUUM_TABLE_SIZES: VacuumTableSize[] = [
    {
        value: '4x8',
        label: "4' x 8' Vacuum Table",
        description: 'Standard full-sheet size',
    },
];

export const DEFAULT_VACUUM_TABLE_SIZE = VACUUM_TABLE_SIZES[0].value;
