import { ATCI_SUPPORTED_VERSION } from 'app/features/ATC/utils/ATCiConstants.ts';
import { EEPROM } from 'app/definitions/firmware';

export interface GrblCoreMigration {
    cutoffSemver: number;
    keyRemaps: Record<EEPROM, EEPROM>;
    valueOverrides: Record<EEPROM, string | null>;
}

/*
EEPROM defaults missing (21):
$394, $484, $485, $538, $539, $650, $673, $675, $676,
$680, $681, $683, $684, $685, $686, $687, $709, $760, $761,
$762, $763
 */

// remap key->key
// remap key-> new value
// remap key -> null = removed in core
export const GRBLCORE_MIGRATION: GrblCoreMigration = {
    cutoffSemver: ATCI_SUPPORTED_VERSION,
    keyRemaps: {
        $450: '$590',
        $451: '$591',
        $452: '$592',
        $453: '$490',
        $454: '$491',
        $455: '$492',
        $743: '$716',
        $456: '$750',
        $457: '$751',
        $458: '$752',
        $459: '$753',
        $664: '$536',
        $665: '$537',
    },
    valueOverrides: {
        $394: '11',
        $484: '0',
        $485: '1',
        $535: '02:08:dc:cf:7b:8d',
        $538: '0',
        $539: '0',
        $650: '0',
        $668: null,
        $673: '0',
        $675: '0',
        $676: '15',
        $680: '0',
        $681: '0',
        $683: '0',
        $684: '10',
        $685: '10',
        $686: '50',
        $687: '50',
        $709: '1',
        $760: '0',
        $761: '1',
        $762: '2',
        $763: '3',
    },
};
