import { EEPROMSettings } from 'definitions/firmware';

export const LONGMILL_MASTER_LIST_GRBL: EEPROMSettings = {
    $0: '10',
    $1: '100',
    $2: '1',
    $4: '1',
    $5: '0',
    $6: '0',
    $10: '1',
    $11: '0.010',
    $12: '0.002',
    $13: '0',
    $20: '0',
    $21: '0',
    $22: '0',
    $23: '3',
    $24: '25.000',
    $25: '1500.000',
    $26: '250',
    $27: '1.000',
    $30: '30000',
    $31: '10000',
    $32: '0',
    $100: '200.000',
    $101: '200.000',
    $102: '200.000',
    $110: '4000.000',
    $111: '4000.000',
    $112: '3000.000',
    $120: '750.000',
    $121: '750.000',
    $122: '500.000',
};

export const LONGMILL_MK1_12x12: EEPROMSettings = {
    ...LONGMILL_MASTER_LIST_GRBL,
    $3: '5',
    $130: '285.000',
    $131: '320.000',
    $132: '110.000',
};

export const LONGMILL_MK1_12x30: EEPROMSettings = {
    ...LONGMILL_MASTER_LIST_GRBL,
    $3: '5',
    $130: '770.000',
    $131: '320.000',
    $132: '110.000',
};

export const LONGMILL_MK1_30x30: EEPROMSettings = {
    ...LONGMILL_MASTER_LIST_GRBL,
    $3: '5',
    $130: '770.000',
    $131: '820.000',
    $132: '110.000',
};

export const LONGMILL_MK1_48x30: EEPROMSettings = {
    ...LONGMILL_MASTER_LIST_GRBL,
    $3: '5',
    $130: '1230.000',
    $131: '820.000',
    $132: '110.000',
};

export const LONGMILL_MK2_12x30: EEPROMSettings = {
    ...LONGMILL_MASTER_LIST_GRBL,
    $3: '1',
    $130: '810.000',
    $131: '355.000',
    $132: '120.000',
};

export const LONGMILL_MK2_30x30: EEPROMSettings = {
    ...LONGMILL_MASTER_LIST_GRBL,
    $3: '1',
    $130: '810.000',
    $131: '855.000',
    $132: '120.000',
};

export const LONGMILL_MK2_48x30: EEPROMSettings = {
    ...LONGMILL_MASTER_LIST_GRBL,
    $3: '1',
    $130: '1270.000',
    $131: '855.000',
    $132: '120.000',
};
