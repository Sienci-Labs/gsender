import { createReducer } from 'redux-action';
import {
    SET_CURRENT_VISUALIZER,
    UPDATE_JOB_OVERRIDES,
} from '../actions/visualizerActions';
import { VISUALIZER_PRIMARY } from 'app/constants';

const initialState = {
    activeVisualizer: VISUALIZER_PRIMARY,
    jobOverrides: { isChecked: false, toggleStatus: 'jobStatus' },
};

const reducer = createReducer(initialState, {
    [SET_CURRENT_VISUALIZER]: (payload, state) => {
        return {
            ...state,
            activeVisualizer: payload,
        };
    },
    [UPDATE_JOB_OVERRIDES]: (payload, state) => {
        return {
            ...state,
            jobOverrides: payload,
        };
    },
});

export default reducer;
