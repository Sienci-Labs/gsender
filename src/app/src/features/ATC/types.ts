export type ToolProbeState = 'probed' | 'unprobed';

export interface ToolFlags {
    probeState: ToolProbeState;
    isManual: boolean;
}

export interface RackConfig {
    rackSize: number;
    toolTableSize: number;
    hasToolTable: boolean;
}
