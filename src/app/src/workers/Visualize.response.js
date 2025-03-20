import pubsub from 'pubsub-js';
import { store as reduxStore } from 'app/store/redux';
import _get from 'lodash/get';
import isNumber from 'lodash/isNumber';

import store from 'app/store';
import {
    LIGHTWEIGHT_OPTIONS,
    RENDER_RENDERED,
    RENDER_RENDERING,
    VISUALIZER_SECONDARY,
} from 'app/constants';
import { replaceParsedData } from '../lib/indexedDB';
import {
    updateFileInfo,
    updateFileProcessing,
    updateFileRenderState,
} from '../store/redux/slices/fileInfo.slice';

export const visualizeResponse = async ({ data }) => {
    if (isNumber(data)) {
        pubsub.publish('toolpath:progress', data);
    } else {
        const { needsVisualization, parsedData } = data;
        // Update estimate worker with values
        const estimatePayload = {
            ...data.info,
            fileProcessing: false,
        };

        if (data.visualizer !== VISUALIZER_SECONDARY) {
            reduxStore.dispatch(updateFileInfo(estimatePayload));
        }

        reduxStore.dispatch(updateFileProcessing(false));

        // if there's new parsed data, send to redux
        if (parsedData) {
            await replaceParsedData(parsedData).then(() => {
                pubsub.publish('parsedData:stored');
            });

            // reduxStore.dispatch({
            //     type: UPDATE_FILE_PARSED_DATA,
            //     payload: {
            //         value: parsedData
            //     }
            // });
        } else {
            pubsub.publish('parsedData:stored');
        }

        // Handle file load
        pubsub.publish('file:load', data);
        // Visualizer Rendering
        if (needsVisualization) {
            setTimeout(() => {
                const renderState = _get(
                    reduxStore.getState(),
                    'file.renderState',
                );
                if (renderState !== RENDER_RENDERED) {
                    reduxStore.dispatch(
                        updateFileRenderState(RENDER_RENDERING),
                    );
                }
            }, 250);
        } else {
            reduxStore.dispatch(updateFileRenderState(RENDER_RENDERED));
        }
    }
};

export const shouldVisualize = () => {
    const liteMode = store.get('widgets.visualizer.liteMode', false);
    const isDisabled = liteMode
        ? store.get(
              'widgets.visualizer.liteOption',
              LIGHTWEIGHT_OPTIONS.LIGHT,
          ) === LIGHTWEIGHT_OPTIONS.EVERYTHING
        : store.get('widgets.visualizer.disabled');
    return !isDisabled;
};

export const shouldVisualizeSVG = () => {
    const liteMode = store.get('widgets.visualizer.liteMode', false);
    const SVGEnabled =
        store.get(
            'widgets.visualizer.liteOption',
            LIGHTWEIGHT_OPTIONS.LIGHT,
        ) === LIGHTWEIGHT_OPTIONS.LIGHT;
    return liteMode && SVGEnabled;
};
