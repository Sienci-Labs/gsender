import { EEPROMSettings } from 'app/definitions/firmware';

export interface BoardProfile {
    boardId: string;
    skipGrblCoreMigration: boolean;
    eepromSettings?: EEPROMSettings;
    grblHALeepromSettings?: EEPROMSettings;
}

// Board IDs are exact strings from firmware [BOARD:...] response — casing matters
export const BOARD_PROFILES: BoardProfile[] = [
    { boardId: 'SLB-Lite', skipGrblCoreMigration: true },
    { boardId: 'SLB_EXT2', skipGrblCoreMigration: true },
];

export function getBoardProfile(boardId: string | undefined): BoardProfile | undefined {
    if (!boardId) return undefined;
    return BOARD_PROFILES.find((b) => b.boardId === boardId);
}
