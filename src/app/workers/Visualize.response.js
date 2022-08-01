import pubsub from 'pubsub-js';
import reduxStore from 'app/store/redux';
import * as fileActions from 'app/actions/fileInfoActions';
import store from 'app/store';
import { RENDER_RENDERING } from 'app/constants';

export const visualizeResponse = ({ data }) => {
    pubsub.publish('file:load', data);
    // Visualizer Rendering
    reduxStore.dispatch({
        type: fileActions.UPDATE_FILE_RENDER_STATE,
        payload: {
            state: RENDER_RENDERING
        }
    });
};


export const shouldVisualize = () => {
    const liteMode = store.get('widgets.visualizer.liteMode', false);
    const isDisabled = (liteMode) ? store.get('widgets.visualizer.disabledLite') : store.get('widgets.visualizer.disabled');
    return !isDisabled;
};

export const isLiteMode = () => {
    const liteMode = store.get('widgets.visualizer.liteMode', false);
    return liteMode;
};
