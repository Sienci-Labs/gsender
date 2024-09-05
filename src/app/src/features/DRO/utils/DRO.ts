import controller from "app/lib/controller";
import store from 'app/store';
import get from 'lodash/get';
export type Axis = 'A' | 'B' | 'C' | 'X' | 'Y' | 'Z' | 'a' | 'b' | 'c' | 'x' | 'y' | 'z';
export type AxesArray = Axis[]


export const defaultAxes: AxesArray = ['X', 'Y', 'Z'];

export interface DROPosition {
    x: number | string;
    y: number | string;
    z: number | string;
    a?: number | string;
    b?: number | string;
    c?: number | string;
}

export const defaultDROPosition = {
    x: "0.00",
    y: "0.00",
    z: "0.00",
    a: "0.00",
    b: "0.00",
    c: "0.00"
}

export function zeroWCS (axis: Axis, value: number = 0) {
    let axisCode = axis.toUpperCase();
    controller.command('gcode', `G10 L20 P0 ${axisCode}${value}`);
}

export function gotoZero(axis: Axis) {
    const commands: string[] = []
    const settings = get(controller.settings, 'settings', {});
    const homingSetting = Number(get(settings, '$22', 0));
    const homingEnabled = homingSetting !== 0;

    const retractHeight = Number(store.get('workspace.safeRetractHeight', -1));
    console.log(retractHeight);
    console.log(homingSetting);

    if (retractHeight !== 0 && axis !== 'Z') {
        if (homingEnabled) {
            // TODO:  Replace this with machine Z pos
            const currentZ = Number(0);
            const retract = (Math.abs(retractHeight) * -1);
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
