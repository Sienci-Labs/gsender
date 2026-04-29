import pubsub from 'pubsub-js';
import { toast } from 'app/lib/toaster';
import controller from '@gsender/controller-client/controller';

export const outlineResponse = ({ data }) => {
    controller.command('gcode', data.outlineGcode, controller.context);
    toast.success('Running file outline', { position: 'bottom-right' });
    pubsub.publish('outline:done');
};
