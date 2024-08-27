import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { VISUALIZER_PRIMARY } from 'app/constants';

interface VisualizerState {
    activeVisualizer: string;
    jobOverrides: {
        isChecked: boolean;
        toggleStatus: string;
    };
}

const initialState: VisualizerState = {
    activeVisualizer: VISUALIZER_PRIMARY,
    jobOverrides: { isChecked: false, toggleStatus: 'jobStatus' },
};

const visualizerSlice = createSlice({
    name: 'visualizer',
    initialState,
    reducers: {
        setCurrentVisualizer: (state, action: PayloadAction<string>) => {
            state.activeVisualizer = action.payload;
        },
        updateJobOverrides: (
            state,
            action: PayloadAction<VisualizerState['jobOverrides']>,
        ) => {
            state.jobOverrides = action.payload;
        },
    },
});

export const { setCurrentVisualizer, updateJobOverrides } =
    visualizerSlice.actions;

export default visualizerSlice.reducer;
