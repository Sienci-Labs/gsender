import constants from 'namespace-constants';
import { createAction } from 'redux-action';

export const {
    SET_CURRENT_VISUALIZER
} = constants('connection', [
    'SET_CURRENT_VISUALIZER',
]);

export const setCurrentVisualizer = createAction(SET_CURRENT_VISUALIZER);
