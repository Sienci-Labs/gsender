import controller from 'app/lib/controller';
import store from 'app/store';
import get from 'lodash/get';
import { METRIC_UNITS } from 'app/constants';
export type Axis =
    | 'A'
    | 'B'
    | 'C'
    | 'X'
    | 'Y'
    | 'Z'
    | 'a'
    | 'b'
    | 'c'
    | 'x'
    | 'y'
    | 'z';
export type AxesArray = Axis[];

export const defaultAxes: AxesArray = ['X', 'Y', 'Z'];

export type MovementModal = 'G90' | 'G91';

export interface DROPosition {
    x: number | string;
    y: number | string;
    z: number | string;
    a?: number | string;
    b?: number | string;
    c?: number | string;
}

export const defaultDROPosition = {
    x: '0.000',
    y: '0.000',
    z: '0.000',
    a: '0.000',
    b: '0.000',
    c: '0.000',
};

export function zeroWCS(axis: string, value: number = 0) {
    let axisCode = axis.toUpperCase();
    controller.command('gcode', `G10 L20 P0 ${axisCode}${value}`);
}

export function zeroAllAxes() {
    const firmware = store.get('widgets.connection.controller.type', 'Grbl');
    controller.command('gcode', `G10 L20 P0 X0 Y0 Z0`);
    if (firmware === 'grblHAL') {
        controller.command('gcode', 'G10 L20 P0 A0');
    }
}

export function goXYAxes() {
    const commands: string[] = [];
    const settings = get(controller.settings, 'settings', {});
    const homingSetting = Number(get(settings, '$22', 0));
    const homingEnabled = homingSetting !== 0;

    const retractHeight = Number(store.get('workspace.safeRetractHeight', -1));

    if (retractHeight !== 0) {
        if (homingEnabled) {
            const currentZ = Number(get(controller, 'state.status.mpos.z', 0));
            const retract = Math.abs(retractHeight) * -1;
            // only move Z if it is less than Z0-SafeHeight
            if (currentZ < retract) {
                commands.push(`G53 G0 Z${retract}`);
            }
        } else {
            commands.push('G91');
            commands.push(`G0Z${retractHeight}`);
        }
    }

    commands.push(`G90 G0 X0 Y0`);

    if (retractHeight !== 0 && !homingEnabled) {
        commands.push(`G91 G0 Z${retractHeight * -1}`);
        commands.push('G90');
    }

    controller.command('gcode:safe', commands);
}

export function gotoZero(axis: string) {
    const commands: string[] = [];
    const settings = get(controller.settings, 'settings', {});
    const homingSetting = Number(get(settings, '$22', 0));
    const homingEnabled = homingSetting !== 0;

    const retractHeight = Number(store.get('workspace.safeRetractHeight', -1));

    if (retractHeight !== 0 && axis !== 'Z') {
        if (homingEnabled) {
            const currentZ = Number(get(controller, 'state.status.mpos.z', 0));
            const retract = Math.abs(retractHeight) * -1;
            // only move Z if it is less than Z0-SafeHeight
            if (currentZ < retract) {
                commands.push(`G53 G0 Z${retract}`);
            }
        } else {
            commands.push('G91');
            commands.push(`G0Z${retractHeight}`);
        }
    }

    commands.push(`G90 G0 ${axis}0`);

    if (retractHeight !== 0 && axis !== 'Z' && !homingEnabled) {
        commands.push(`G91 G0 Z${retractHeight * -1}`);
        commands.push('G90');
    }

    controller.command('gcode:safe', commands);
}

export function GoTo(pos: DROPosition, isG91: boolean) {
    const code = [];
    const mode = isG91 ? 'G91' : 'G90';
    code.push(`${mode} G0 X${pos.x} Y${pos.y} Z${pos.z}`);
    controller.command('gcode:safe', code);
}

export function handleManualOffset(value: string | number, axis: Axis) {
    const offset = Number(value);
    const units = store.get('workspace.units');
    const modal = units === METRIC_UNITS ? 'G21' : 'G20';

    const command = `G10 P0 L20 ${axis.toUpperCase()}${offset}`;
    controller.command('gcode:safe', command, modal);
}

export function homeMachine() {
    controller.command('gcode', '$H');
}

export function homeAxis(axis: string) {
    controller.command('gcode', `$H${axis}`);
}
