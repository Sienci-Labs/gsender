import { i18n } from 'app/i18n';
import { toast } from 'app/lib/toaster';
import pubsub from 'pubsub-js';
import controller from '../lib/controller';

export const outlineResponse = ({ data }) => {
    controller.command('gcode', data.outlineGcode, controller.context);
    toast.success(i18n.t('notifications:jobControl.outlineRunning'), {
        position: 'bottom-right',
    });
    pubsub.publish('outline:done');
};
