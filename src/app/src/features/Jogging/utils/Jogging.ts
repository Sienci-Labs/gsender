import controller from 'app/lib/controller';
import map from 'lodash/map';

export interface JogSpeeds {
    aStep: number;
    zStep: number;
    xyStep: number;
    feedrate: number;
}

export type JoggingSpeedOptions = 'Rapid' | 'Normal' | 'Precise';

export function jogAxis(params: JogDistances, feedrate: number) {
    const modal = 'G21';
    const s = map(
        params,
        (value, letter) => '' + letter.toUpperCase() + value,
    ).join(' ');
    const commands = [`$J=${modal} G91 ` + s + ` F${feedrate}`];
    controller.command('gcode', commands);
}

export function continuousJogAxis(axes: JogDistances, feedrate: number) {
    const units = 'G21';
    controller.command('jog:start', axes, feedrate, units);
}

export function stopContinuousJog() {
    controller.command('jog:stop');
}

export interface JogDistances {
    X?: number;
    Y?: number;
    Z?: number;
    A?: number;
    B?: number;
    C?: number;
}

export interface JoggerProps {
    distance: number;
    feedrate: number;
    canClick?: boolean;
}

export function cancelJog() {
    controller.command('jog:cancel');
}

export function startJogCommand(
    axes: JogDistances,
    feed: number,
    continuous: boolean,
) {
    if (continuous) {
        continuousJogAxis(axes, feed);
    } else {
        jogAxis(axes, feed);
    }
}

export function xPlusJog(
    distance: number,
    feed: number,
    continuous: boolean = false,
) {
    startJogCommand({ X: distance }, feed, continuous);
}

export function xMinusJog(
    distance: number,
    feed: number,
    continuous: boolean = false,
) {
    startJogCommand({ X: distance * -1 }, feed, continuous);
}

export function yPlusJog(
    distance: number,
    feed: number,
    continuous: boolean = false,
) {
    startJogCommand({ Y: distance }, feed, continuous);
}

export function yMinusJog(
    distance: number,
    feed: number,
    continuous: boolean = false,
) {
    startJogCommand({ Y: distance * -1 }, feed, continuous);
}

export function zPlusJog(
    distance: number,
    feed: number,
    continuous: boolean = false,
) {
    startJogCommand({ Z: distance }, feed, continuous);
}

export function zMinusJog(
    distance: number,
    feed: number,
    continuous: boolean = false,
) {
    startJogCommand({ Z: distance * -1 }, feed, continuous);
}

export function aPlusJog(
    distance: number,
    feed: number,
    continuous: boolean = false,
) {
    startJogCommand({ A: distance }, feed, continuous);
}

export function aMinusJog(
    distance: number,
    feed: number,
    continuous: boolean = false,
) {
    startJogCommand({ A: distance * -1 }, feed, continuous);
}

export function xPlusYPlus(
    distance: number,
    feed: number,
    continuous: boolean = false,
) {
    startJogCommand({ X: distance, Y: distance }, feed, continuous);
}
export function xPlusYMinus(
    distance: number,
    feed: number,
    continuous: boolean = false,
) {
    startJogCommand({ X: distance, Y: distance * -1 }, feed, continuous);
}
export function xMinusYPlus(
    distance: number,
    feed: number,
    continuous: boolean = false,
) {
    startJogCommand({ X: distance * -1, Y: distance }, feed, continuous);
}
export function xMinusYMinus(
    distance: number,
    feed: number,
    continuous: boolean = false,
) {
    startJogCommand({ X: distance * -1, Y: distance * -1 }, feed, continuous);
}
