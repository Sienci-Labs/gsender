import pubsub from 'pubsub-js';
import { toast } from 'app/lib/toaster';
import controller from '../lib/controller';

export const outlineResponse = ({ data }) => {
    controller.command('gcode', data.outlineGcode);
    toast.info('Running file outline', { position: 'bottom-right' });
    pubsub.publish('outline:done');
};
