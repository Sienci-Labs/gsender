import { createReducer } from 'redux-action';
import { SET_SHORTCUTS_LIST, HOLD_SHORTCUTS, UNHOLD_SHORTCUTS, SET_IP_LIST } from 'app/actions/preferencesActions';
import store from 'app/store';

const initialState = {
    shortcuts: {
        list: store.get('commandKeys', {}),
        shouldHold: false,
    },
    ipList: [],
};

const reducer = createReducer(initialState, {
    [SET_SHORTCUTS_LIST]: (payload, state) => {
        return {
            ...state,
            shortcuts: {
                ...state.shortcuts,
                list: payload,
            }
        };
    },
    [HOLD_SHORTCUTS]: (payload, state) => {
        return {
            ...state,
            shortcuts: {
                ...state.shortcuts,
                shouldHold: true,
            }
        };
    },
    [UNHOLD_SHORTCUTS]: (payload, state) => {
        return {
            ...state,
            shortcuts: {
                ...state.shortcuts,
                shouldHold: false,
            }
        };
    },
    [SET_IP_LIST]: (payload, state) => {
        return {
            ...state,
            ipList: payload,
        };
    }
});

export default reducer;
