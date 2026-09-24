import type { EstimatorConfig } from './MotionPlanner';

export const ATC_TOOL_CHANGE_SECONDS = 45;

// Controller settings that change the estimate - a change to any of these
// while a file is loaded should trigger a re-estimate.
export const ESTIMATE_SETTING_KEYS = [
    '$11',
    '$12',
    '$110',
    '$111',
    '$112',
    '$113',
    '$120',
    '$121',
    '$122',
    '$123',
    '$376',
    '$394',
    '$398',
    '$701',
];

interface BuildOptions {
    settings?: Record<string, string | number | undefined>;
    controllerType?: string; // 'Grbl' | 'grblHAL'
    isLaser?: boolean;
    atcEnabled?: boolean;
    useAaxisForGrbl?: boolean;
    baudrate?: number | string;
}

const num = (value: unknown): number | undefined => {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
};

/** Machine config for the time estimator, from the controller's $ settings. */
export const buildEstimatorConfig = ({
    settings = {},
    controllerType,
    isLaser = false,
    atcEnabled = false,
    useAaxisForGrbl = false,
    baudrate,
}: BuildOptions): Partial<EstimatorConfig> => {
    const isGrblHAL = controllerType === 'grblHAL';
    const plannerBlocks = num(settings.$398);
    const rotaryAxes = num(settings.$376) || 0;
    const rotaryOptions = num(settings.$701) || 0;
    const baud = num(baudrate) || 115200;

    return {
        firmware: isGrblHAL ? 'grblHAL' : 'grbl',
        maxRate: [
            num(settings.$110),
            num(settings.$111),
            num(settings.$112),
            num(settings.$113),
        ] as [number, number, number, number],
        accel: [
            num(settings.$120),
            num(settings.$121),
            num(settings.$122),
            num(settings.$123),
        ] as [number, number, number, number],
        junctionDeviation: num(settings.$11),
        arcTolerance: num(settings.$12),
        // Bf reports one block less than the configured buffer
        plannerBlocks: isGrblHAL
            ? plannerBlocks
                ? plannerBlocks - 1
                : 34
            : 15,
        aUsesYLimits: !isGrblHAL && !useAaxisForGrbl,
        rotaryFix:
            isGrblHAL && (rotaryOptions & 1) === 1 && (rotaryAxes & 1) === 1,
        rotaryRevertMetric: (rotaryOptions & 2) === 2,
        laserMode: isLaser,
        toolChangeTime: atcEnabled ? ATC_TOOL_CHANGE_SECONDS : 0,
        spindleDelay: isGrblHAL ? num(settings.$394) || 0 : 0,
        // grblHAL is typically native USB where serial speed isn't the bottleneck
        serialBytesPerSecond: isGrblHAL ? 0 : baud / 10,
    };
};
