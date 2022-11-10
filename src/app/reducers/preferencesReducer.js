import { createReducer } from 'redux-action';
import { SET_SHORTCUTS_LIST, HOLD_SHORTCUTS, UNHOLD_SHORTCUTS } from 'app/actions/preferencesActions';
import store from 'app/store';

const initialState = {
    shortcuts: {
        list: store.get('commandKeys', []).sort((a, b) => a?.category?.localeCompare(b?.category)),
        shouldHold: false,
    }
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
});

export default reducer;
