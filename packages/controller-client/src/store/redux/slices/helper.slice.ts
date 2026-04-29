import { HelperState } from 'app/store/definitions.ts';
import { createSlice } from '@reduxjs/toolkit';

const initialState: HelperState = {
    wizardActive: false,
    infoHelperActive: false,
    wizardMinimized: true,
    infoHelperMinimized: true,
    title: 'Helper',
    metadata: {},
};

const HelperStateSlice = createSlice({
    name: 'helperInfo',
    initialState,
    reducers: {
        unloadHelperInfo: () => {
            return initialState;
        },
        toggleWizardVisibility: (state) => {
            state.wizardMinimized = !state.wizardMinimized;
            return state;
        },
        toggleInfoHelperVisibility: (state) => {
            state.infoHelperMinimized = !state.infoHelperMinimized;
            return state;
        },
        // updateHelperState: (state, payload) => {
        //     const { active, metadata } = payload;
        //     state.wizardActive = active;
        //     state.metadata = metadata;
        //     state.minimized = false;
        //     return state;
        // },
        enableWizard: (state) => {
            state.wizardActive = true;
            state.wizardMinimized = false;
            return state;
        },
        enableInfoHelper: (state) => {
            state.infoHelperActive = true;
            state.infoHelperMinimized = false;
            return state;
        },
        disableWizard: (state) => {
            state.wizardActive = false;
            state.wizardMinimized = true;
        },
        disableInfoHelper: (state) => {
            state.infoHelperActive = false;
            state.infoHelperMinimized = true;
            return state;
        },
    },
});

export const {
    enableWizard,
    enableInfoHelper,
    disableWizard,
    disableInfoHelper,
    // updateHelperState,
    unloadHelperInfo,
    toggleWizardVisibility,
    toggleInfoHelperVisibility,
} = HelperStateSlice.actions;

export default HelperStateSlice.reducer;
