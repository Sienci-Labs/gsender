import pubsub from 'pubsub-js';
import reduxStore from 'app/store/redux';
import _get from 'lodash/get';
import * as fileActions from 'app/actions/fileInfoActions';
import { UPDATE_FILE_INFO, UPDATE_FILE_PROCESSING } from 'app/actions/fileInfoActions';
import store from 'app/store';
import { RENDER_RENDERING, RENDER_RENDERED } from 'app/constants';
import { isNumber } from 'lodash';

export const visualizeResponse = ({ data }) => {
    if (isNumber(data)) {
        pubsub.publish('toolpath:progress', data);
    } else {
        // Update estimate worker with values
        const estimatePayload = {
            ...data.info,
            fileProcessing: false
        };
        reduxStore.dispatch({
            type: UPDATE_FILE_INFO,
            payload: estimatePayload
        });
        reduxStore.dispatch({
            type: UPDATE_FILE_PROCESSING,
            payload: {
                value: false
            }
        });

        // Handle file load
        pubsub.publish('file:load', data);
        // Visualizer Rendering
        setTimeout(() => {
            const renderState = _get(reduxStore.getState(), 'file.renderState');
            if (renderState !== RENDER_RENDERED) {
                reduxStore.dispatch({
                    type: fileActions.UPDATE_FILE_RENDER_STATE,
                    payload: {
                        state: RENDER_RENDERING
                    }
                });
            }
        }, 1000);
    }
};


export const shouldVisualize = () => {
    const liteMode = store.get('widgets.visualizer.liteMode', false);
    const isDisabled = (liteMode) ? store.get('widgets.visualizer.disabledLite') : store.get('widgets.visualizer.disabled');
    return !isDisabled;
};

export const shouldVisualizeSVG = () => {
    const liteMode = store.get('widgets.visualizer.liteMode', false);
    const SVGEnabled = store.get('widgets.visualizer.SVGEnabled', false);
    return liteMode && SVGEnabled;
};
