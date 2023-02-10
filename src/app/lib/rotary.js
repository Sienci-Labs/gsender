import store from 'app/store';
import controller from 'app/lib/controller';
import { WORKSPACE_MODE, ROTARY_AXIS_101_VALUE } from 'app/constants';

export const updateWorkspaceMode = (mode = WORKSPACE_MODE.DEFAULT) => {
    const { DEFAULT, ROTARY } = WORKSPACE_MODE;

    store.replace('workspace.mode', mode);

    switch (mode) {
    case DEFAULT: {
        const prev101Value = store.get('workspace.rotaryAxis.prev101Value');
        store.replace('workspace.rotaryAxis.prev101Value', null);

        controller.command('gcode', `$101=${prev101Value}`);
        return;
    }

    case ROTARY: {
        store.replace('workspace.rotaryAxis.prev101Value', controller.settings.$101);
        controller.command('gcode', `$101=${ROTARY_AXIS_101_VALUE}`);
        return;
    }

    default: {
        return;
    }
    }
};
