import controller from 'app/lib/controller';

export function startMist() {
    controller.command('gcode', 'M7');
}

export function startFlood() {
    controller.command('gcode', 'M8');
}

export function stopCoolant() {
    controller.command('gcode', 'M9');
}
