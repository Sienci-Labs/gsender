import fullGridUrl from 'app/features/AccessoryInstaller/Wizards/vacuum-table/assets/gcode/Full Table Grid Cutout 0.375in.gcode?url';
import fullMountingUrl from 'app/features/AccessoryInstaller/Wizards/vacuum-table/assets/gcode/Full Table Hole Mounts 0.375in.gcode?url';
import joineryGridUrl from 'app/features/AccessoryInstaller/Wizards/vacuum-table/assets/gcode/Joinery Grid Cutout 0.375in.gcode?url';
import joineryMountingUrl from 'app/features/AccessoryInstaller/Wizards/vacuum-table/assets/gcode/Joinery Hole Mounts 0.375in.gcode?url';
import { DEFAULT_VACUUM_TABLE_SIZE } from 'app/features/AccessoryInstaller/Wizards/vacuum-table/constants/sizes.ts';

export interface GcodeAsset {
    url: string;
    name: string;
}

export const MOUNTING_GCODE_BY_SIZE: Record<string, GcodeAsset> = {
    full: {
        url: fullMountingUrl,
        name: 'gSender_Vacuum_Table_Mounting_Full',
    },
    joinery: {
        url: joineryMountingUrl,
        name: 'gSender_Vacuum_Table_Mounting_Joinery',
    },
};

export const GRID_GCODE_BY_SIZE: Record<string, GcodeAsset> = {
    full: {
        url: fullGridUrl,
        name: 'gSender_Vacuum_Table_Grid_Full',
    },
    joinery: {
        url: joineryGridUrl,
        name: 'gSender_Vacuum_Table_Grid_Joinery',
    },
};

export function getGcodeAsset(
    map: Record<string, GcodeAsset>,
    size: string,
): GcodeAsset {
    return map[size] ?? map[DEFAULT_VACUUM_TABLE_SIZE];
}
