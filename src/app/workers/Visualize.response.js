import pubsub from 'pubsub-js';
import reduxStore from 'app/store/redux';
import * as fileActions from 'app/actions/fileInfoActions';
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
