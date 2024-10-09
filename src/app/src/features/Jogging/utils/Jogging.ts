import controller from 'app/lib/controller';
import map from 'lodash/map';

export interface JogSpeeds {
    aStep: number;
    zStep: number;
    xyStep: number;
    feedrate: number;
}

function jogAxis(params: JogDistances, feedrate: number) {
    const modal = 'G21';
    const s = map(
        params,
        (value, letter) => '' + letter.toUpperCase() + value,
    ).join(' ');
    const commands = [`$J=${modal} G91 ` + s + ` F${feedrate}`];
    controller.command('gcode', commands);
}

function continuousJogAxis() {}

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

export function startJogCommand(
    axes: JogDistances,
    feed: number,
    continuous: boolean,
) {
    if (continuous) {
        controller.command();
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
    startJogCommand({ X: distance * -1 }, feed, continuous);
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
    startJogCommand({ X: distance * -1 }, feed, continuous);
}
