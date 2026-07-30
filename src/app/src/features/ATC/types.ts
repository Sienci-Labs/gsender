export type ToolProbeState = 'probed' | 'unprobed';

export interface ToolFlags {
    probeState: ToolProbeState;
    isManual: boolean;
}
