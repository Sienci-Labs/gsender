import {
    G0_PART,
    G1_PART,
    G2_PART,
    G3_PART,
} from 'app/features/Visualizer/constants';
import { getVisualizerTheme } from 'app/lib/getVisualizerTheme';

export const PENDANT_CUT_COLOR = '#3e85c7';
export const PENDANT_RAPID_COLOR = '#0ef6ae';
export const PENDANT_BOUNDS_COLOR = '#9ca3af';
export const PENDANT_RAPID_OPACITY = 0x0F / 0xFF;

export const getPendantWorkerTheme = () => {
    const theme = new Map(getVisualizerTheme());

    theme.set(G0_PART, PENDANT_RAPID_COLOR);
    theme.set(G1_PART, PENDANT_CUT_COLOR);
    theme.set(G2_PART, PENDANT_CUT_COLOR);
    theme.set(G3_PART, PENDANT_CUT_COLOR);

    return theme;
};
