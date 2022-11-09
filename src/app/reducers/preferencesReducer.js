import { createReducer } from 'redux-action';
import { SET_SHORTCUTS_LIST, HOLD_SHORTCUTS, UNHOLD_SHORTCUTS } from 'app/actions/visualizerActions';
import store from 'app/store';

const initialState = {
    shortcuts: {
        list: store.get('commandKeys'),
        shouldHold: false,
    }
};

const reducer = createReducer(initialState, {
    [SET_SHORTCUTS_LIST]: (payload, state) => {
        return {
            ...state,
            list: payload,
        };
    },
    [HOLD_SHORTCUTS]: (payload, state) => {
        return {
            ...state,
            shouldHold: true,
        };
    },
    [UNHOLD_SHORTCUTS]: (payload, state) => {
        return {
            ...state,
            shouldHold: false,
        };
    },
});

export default reducer;
