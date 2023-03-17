import store from 'app/store';
import controller from 'app/lib/controller';
import reduxStore from 'app/store/redux';
import get from 'lodash/get';
import { WORKSPACE_MODE, ROTARY_AXIS_101_VALUE,
    ROTARY_AXIS_103_VALUE,
    ROTARY_AXIS_113_VALUE,
    ROTARY_AXIS_123_VALUE } from 'app/constants';

export const updateWorkspaceMode = (mode = WORKSPACE_MODE.DEFAULT) => {
    const { DEFAULT, ROTARY } = WORKSPACE_MODE;
    const firmwareType = get(reduxStore.getState(), 'controller.type');

    store.replace('workspace.mode', mode);

    switch (mode) {
    case DEFAULT: {
        const prev101Value = store.get('workspace.rotaryAxis.prev101Value');
        store.replace('workspace.rotaryAxis.prev101Value', null);

        controller.command('gcode', `$101=${prev101Value}`);
        return;
    }

    case ROTARY: {
        const prev101Value = controller.settings.settings.$101;
        store.replace('workspace.rotaryAxis.prev101Value', prev101Value);
        controller.command('gcode', `$101=${ROTARY_AXIS_101_VALUE}`);

        if (firmwareType === 'Grbl') {
            controller.command('gcode', [`$103=${ROTARY_AXIS_103_VALUE}`, `$113=${ROTARY_AXIS_113_VALUE}`, `$123=${ROTARY_AXIS_123_VALUE}`]);
        }

        return;
    }

    default: {
        return;
    }
    }
};
