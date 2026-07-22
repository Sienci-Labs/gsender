import get from 'lodash/get';
import reduxStore from 'app/store/redux';
import prefStore from 'app/store';
import { EEPROMSettings } from 'app/definitions/firmware.ts';
import {
    getHomingLocation,
    isBitSetInNumber,
    FRONT_RIGHT,
    FRONT_LEFT,
    BACK_RIGHT,
} from 'app/features/DRO/utils/RapidPosition.ts';

// Default tool change location: 2/3 of the way toward the front (Y),
// 1/3 of the way toward the right (X), measured from the right/back edges
// of the machine's usable travel.
const X_FRAC_FROM_RIGHT = 1 / 3;
const Y_FRAC_FROM_BACK = 2 / 3;

export function getDefaultToolChangePositionMM(): {
    x: number;
    y: number;
} | null {
    const state = reduxStore.getState();
    const settings = get(
        state,
        'controller.settings.settings',
        {},
    ) as EEPROMSettings;
    const { $23: homingSetting, $130: xMax, $131: yMax } = settings;
    if (!xMax || !yMax) return null;

    const homingPosition = getHomingLocation(homingSetting ?? '0');

    // Mirror getMovementGCode's exact zero-on-home detection.
    const controllerType = prefStore.get(
        'widgets.connection.controller.type',
        'grbl',
    );
    let homingFlag = get(state, 'controller.homingFlag', false);
    if (controllerType === 'grblHAL') {
        homingFlag = isBitSetInNumber(get(settings, '$22', '0'), 3);
    }
    // Without zero-on-home, machine coords are always negative-going —
    // same fallback getPositionMovements() uses.
    const effectiveCorner = homingFlag ? homingPosition : BACK_RIGHT;

    const isRightHome =
        effectiveCorner === FRONT_RIGHT || effectiveCorner === BACK_RIGHT;
    const isFrontHome =
        effectiveCorner === FRONT_RIGHT || effectiveCorner === FRONT_LEFT;

    const xLimit = Number(xMax);
    const yLimit = Number(yMax);

    const x = isRightHome
        ? -(xLimit * X_FRAC_FROM_RIGHT)
        : xLimit * (1 - X_FRAC_FROM_RIGHT);
    const y = isFrontHome
        ? yLimit * (1 - Y_FRAC_FROM_BACK)
        : -(yLimit * Y_FRAC_FROM_BACK);

    return { x, y };
}
