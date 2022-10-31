import constants from 'namespace-constants';
import { createAction } from 'redux-action';

export const {
    SET_CURRENT_VISUALIZER,
    SET_LASER_MODE
} = constants('connection', [
    'SET_CURRENT_VISUALIZER',
    'SET_LASER_MODE'
]);

export const setCurrentVisualizer = createAction(SET_CURRENT_VISUALIZER);
export const setLaserMode = createAction(SET_LASER_MODE);
