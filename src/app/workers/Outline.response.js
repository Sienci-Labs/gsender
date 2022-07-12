import controller from '../lib/controller';

export const outlineResponse = ({ data }) => {
    controller.command('outline:start');
    controller.command('gcode', data.outlineGcode, 500);
};
