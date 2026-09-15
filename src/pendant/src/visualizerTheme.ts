import {
    G0_PART,
    G1_PART,
    G2_PART,
    G3_PART,
} from 'app/features/Visualizer/constants';
import { getVisualizerTheme } from 'app/lib/getVisualizerTheme';

// Aligned to the Tailwind config's configured scales (blue.500, green.500,
// outline.strong) rather than one-off hex — see apps/desktop/tailwind.config.ts.
export const PENDANT_CUT_COLOR = '#3F85C7'; // blue.500
export const PENDANT_RAPID_COLOR = '#059669'; // green.500
export const PENDANT_BOUNDS_COLOR = '#72849D'; // outline.strong
// Raised from ~6% — rapid moves were nearly invisible on low-quality
// pendant displays.
export const PENDANT_RAPID_OPACITY = 0.35;

export const getPendantWorkerTheme = () => {
    const theme = new Map(getVisualizerTheme());

    theme.set(G0_PART, PENDANT_RAPID_COLOR);
    theme.set(G1_PART, PENDANT_CUT_COLOR);
    theme.set(G2_PART, PENDANT_CUT_COLOR);
    theme.set(G3_PART, PENDANT_CUT_COLOR);

    return theme;
};
