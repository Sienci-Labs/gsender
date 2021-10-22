import { createReducer } from 'redux-action';
import { SET_CURRENT_VISUALIZER } from 'app/actions/visualizerActions';
import { VISUALIZER_PRIMARY } from 'app/constants';

const initialState = {
    activeVisualizer: VISUALIZER_PRIMARY
};

const reducer = createReducer(initialState, {
    [SET_CURRENT_VISUALIZER]: (payload, state) => {
        return {
            ...state,
            activeVisualizer: payload
        };
    },
});

export default reducer;
