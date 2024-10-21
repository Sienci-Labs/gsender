import pubsub from 'pubsub-js';
import { Toaster, TOASTER_SUCCESS } from 'app/lib/toaster/ToasterLib';
import controller from '../lib/controller';

export const outlineResponse = ({ data }) => {
    controller.command('gcode', data.outlineGcode);
    Toaster.clear();
    Toaster.pop({
        type: TOASTER_SUCCESS,
        msg: 'Running file outline',
    });
    pubsub.publish('outline:done');
};
