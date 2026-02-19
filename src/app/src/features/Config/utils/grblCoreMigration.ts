import { EEPROM, EEPROMSettings } from 'app/definitions/firmware';
import {
    GRBLCORE_MIGRATION,
    GrblCoreMigration,
} from 'app/features/Config/assets/MachineDefaults/grblCore.ts';

export interface ResolveDefaultsOptions {
    firmwareSemver: number | undefined;
    baseDefaults: EEPROMSettings;
    orderedSettings?: Map<EEPROM, string>;
}

export interface ResolvedDefaults {
    defaults: EEPROMSettings;
    ordered?: Map<EEPROM, string>;
    remappedFrom?: Record<EEPROM, EEPROM>;
    usesGrblCoreMigration: boolean;
}

export function usesGrblCoreMigration(
    firmwareSemver: number | undefined,
    migration: GrblCoreMigration = GRBLCORE_MIGRATION,
): boolean {
    if (firmwareSemver === undefined || firmwareSemver === null) {
        return false;
    }
    const numericSemver = Number(firmwareSemver);
    if (Number.isNaN(numericSemver)) {
        return false;
    }
    return numericSemver >= migration.cutoffSemver;
}

export function translateGrblCoreKey(
    key: EEPROM,
    firmwareSemver: number | undefined,
    migration: GrblCoreMigration = GRBLCORE_MIGRATION,
): EEPROM {
    if (!usesGrblCoreMigration(firmwareSemver, migration)) {
        return key;
    }
    return migration.keyRemaps[key] ?? key;
}

export function translateGrblCoreDefaults(
    baseDefaults: EEPROMSettings,
    firmwareSemver: number | undefined,
    migration: GrblCoreMigration = GRBLCORE_MIGRATION,
): EEPROMSettings {
    if (!usesGrblCoreMigration(firmwareSemver, migration)) {
        return baseDefaults;
    }

    const translated: EEPROMSettings = { ...baseDefaults };

    Object.entries(migration.keyRemaps).forEach(([oldKey, newKey]) => {
        if (Object.hasOwn(baseDefaults, oldKey as EEPROM)) {
            const value = baseDefaults[oldKey as EEPROM];
            delete translated[oldKey as EEPROM];
            translated[newKey as EEPROM] = value;
        }
    });

    Object.entries(migration.valueOverrides).forEach(([key, value]) => {
        if (value === null) {
            delete translated[key as EEPROM];
            return;
        }
        translated[key as EEPROM] = value;
    });

    return translated;
}

export function translateGrblCoreOrderedSettings(
    ordered: Map<EEPROM, string> | undefined,
    firmwareSemver: number | undefined,
    migration: GrblCoreMigration = GRBLCORE_MIGRATION,
): Map<EEPROM, string> | undefined {
    if (!ordered || !usesGrblCoreMigration(firmwareSemver, migration)) {
        return ordered;
    }

    const translated = new Map<EEPROM, string>();
    const removedKeys = new Set(
        Object.entries(migration.valueOverrides)
            .filter(([, value]) => value === null)
            .map(([key]) => key as EEPROM),
    );

    for (const [key, value] of ordered) {
        const newKey = migration.keyRemaps[key] ?? key;
        if (removedKeys.has(newKey)) {
            continue;
        }
        if (translated.has(newKey)) {
            translated.delete(newKey);
        }
        translated.set(newKey, value);
    }

    return translated;
}

export function resolveGrblCoreDefaults(
    opts: ResolveDefaultsOptions,
    migration: GrblCoreMigration = GRBLCORE_MIGRATION,
): ResolvedDefaults {
    const usesMigration = usesGrblCoreMigration(opts.firmwareSemver, migration);

    if (!usesMigration) {
        return {
            defaults: opts.baseDefaults,
            ordered: opts.orderedSettings,
            usesGrblCoreMigration: false,
        };
    }

    const remappedFrom = Object.entries(migration.keyRemaps).reduce(
        (acc, [oldKey, newKey]) => {
            acc[newKey as EEPROM] = oldKey as EEPROM;
            return acc;
        },
        {} as Record<EEPROM, EEPROM>,
    );

    return {
        defaults: translateGrblCoreDefaults(
            opts.baseDefaults,
            opts.firmwareSemver,
            migration,
        ),
        ordered: translateGrblCoreOrderedSettings(
            opts.orderedSettings,
            opts.firmwareSemver,
            migration,
        ),
        remappedFrom,
        usesGrblCoreMigration: true,
    };
}
