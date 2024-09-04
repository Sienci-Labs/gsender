import controller from "app/lib/controller.ts";

export type Axis = 'A' | 'B' | 'C' | 'X' | 'Y' | 'Z';
export type AxesArray = Axis[]


export function zeroWCS (axis: Axis, value: number = 0) {
    controller.command('gcode', `G10 L20 P0 ${axis}${value}`);
}

export function gotoZero(axis: Axis) {

}
