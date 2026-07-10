import controller from 'app/lib/controller';
import store from 'app/store';
import get from 'lodash/get';

/**
 * Build the gcode lines required to retract Z to the user's configured safe
 * height before performing a rapid XY move.
 *
 * Mirrors the retract logic used by "Go To Location" so the two features stay
 * consistent:
 *  - When homing is enabled, retract in machine space (G53) but only if the
 *    spindle is currently below the safe height.
 *  - When homing is disabled, retract incrementally (G91). Callers are
 *    responsible for re-establishing their desired modal state afterwards.
 *
 * Returns an empty array when no retract height is configured.
 */
export function getSafeRetractCode(): string[] {
    const code: string[] = [];
    const retractHeight = Number(store.get('workspace.safeRetractHeight', -1));

    if (retractHeight === 0) {
        return code;
    }

    const settings = get(controller.settings, 'settings', {});
    const homingEnabled = Number(get(settings, '$22', 0)) !== 0;

    if (homingEnabled) {
        const currentZ = Number(get(controller, 'state.status.mpos.z', 0));
        const retract = Math.abs(retractHeight) * -1;
        if (currentZ < retract) {
            code.push(`G53 G0 Z${retract}`);
        }
    } else {
        code.push('G91');
        code.push(`G0Z${retractHeight}`);
    }

    return code;
}

/**
 * Build a "retract to safe Z, then rapid to absolute work XY" gcode sequence.
 *
 * The spindle is left parked at the safe height over the target — it is never
 * plunged back down. Coordinates are absolute work coordinates in millimetres.
 */
export function getSafeXYMoveCode(x: number, y: number): string[] {
    const code = getSafeRetractCode();
    code.push('G90', `G0 X${x} Y${y}`);
    return code;
}
