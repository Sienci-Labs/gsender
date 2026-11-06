export interface VacuumTableSize {
    value: string;
    label: string;
    description: string;
}

export const VACUUM_TABLE_SIZES: VacuumTableSize[] = [
    {
        value: 'full',
        label: 'Full Table',
        description: "Full 4' x 8' table",
    },
    {
        value: 'joinery',
        label: 'Joinery Table',
        description: 'Table with joinery section',
    },
];

export const DEFAULT_VACUUM_TABLE_SIZE = VACUUM_TABLE_SIZES[0].value;
