export interface Rotary {
    stockTurning: {
        options: {
            stockLength: number;
            stepdown: number;
            bitDiameter: number;
            spindleRPM: number;
            feedrate: number;
            stepover: number;
            startHeight: number;
            finalHeight: number;
            enableRehoming: boolean;
            shouldDwell: boolean;
        };
    };
    tab: {
        show: boolean;
    };
}

export type RotarySurfacingOptions = Rotary['stockTurning']['options'];
export interface RotarySettings {
    $101: string;
    $111: string;
    $20: string;
    $21: string;
}
