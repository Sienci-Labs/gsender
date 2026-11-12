import type { FIRMWARE_TYPES_T } from 'app/definitions/firmware';
import type { BasicPosition, UNITS_EN } from 'app/definitions/general';
import { tk } from 'app/i18n';
import type { PROBE_TYPES, TOUCHPLATE_TYPES } from 'app/lib/constants';
import type { probeDirections } from 'app/lib/Probing';

// Types

export type PROBE_DIRECTIONS =
    (typeof probeDirections)[keyof typeof probeDirections];

export type PROBE_TYPES_T = (typeof PROBE_TYPES)[keyof typeof PROBE_TYPES];

export type TOUCHPLATE_TYPES_T =
    (typeof TOUCHPLATE_TYPES)[keyof typeof TOUCHPLATE_TYPES];

// Display labels for stored/compared values. Values without an entry
// (product names such as AutoZero and BitZero) are shown as-is.

export const TOUCHPLATE_TYPE_LABELS: Record<string, string> = {
    'Standard Block': tk('probe:touchplateTypes.standardBlock'),
    'Z Probe': tk('probe:touchplateTypes.zProbe'),
    '3D Probe': tk('probe:touchplateTypes.probe3D'),
};

export const PROBE_ROUTINE_LABELS: Record<string, string> = {
    'X Touch': tk('probe:routines.xTouch'),
    'Y Touch': tk('probe:routines.yTouch'),
    'XY Touch': tk('probe:routines.xyTouch'),
    'Z Touch': tk('probe:routines.zTouch'),
    'XYZ Touch': tk('probe:routines.xyzTouch'),
};

// Indexed by probe direction (0-3).
export const PROBE_DIRECTION_LABELS = [
    tk('probe:run.directions.bottomLeft'),
    tk('probe:run.directions.topLeft'),
    tk('probe:run.directions.topRight'),
    tk('probe:run.directions.bottomRight'),
];

// Interfaces

export interface ProbeProfile {
    xyThickness: number;
    zThickness: {
        standardBlock: number;
        autoZero: number;
        zProbe: number;
        probe3D: number;
        bitZero: number;
        bitZeroZOnly: number;
    };
    plateWidth: number;
    plateLength: number;
    functions: {
        x: boolean;
        y: boolean;
        z: boolean;
    };
    touchplateType: TOUCHPLATE_TYPES_T;
}

export interface ProbeCommand {
    id: string;
    safe: boolean;
    tool: boolean;
    axes: {
        x: boolean;
        y: boolean;
        z: boolean;
    };
}

export interface ProbingOptions {
    modal: string;
    units: UNITS_EN;
    toolDiameter: number;
    tipDiameter3D: number;
    xRetractModifier?: number;
    yRetractModifier?: number;
    xRetract?: number;
    yRetract?: number;
    zRetract?: number;
    zRetractNormal: number;
    zRetractAuto: number;
    xyRetract3D?: number;
    retract: number;
    axes: {
        x: boolean;
        y: boolean;
        z: boolean;
    };
    xProbeDistance?: number;
    yProbeDistance?: number;
    zProbeDistance?: number;
    probeDistances: BasicPosition;
    probeFast: number;
    probeSlow: number;
    zThickness: {
        standardBlock: number;
        autoZero: number;
        zProbe: number;
        probe3D: number;
        bitZero: number;
        bitZeroZOnly: number;
    };
    xThickness?: number;
    yThickness?: number;
    xyThickness?: number;
    probeMovementSpeed?: number;
    // AutoZero routines always run in mm (forced G21) regardless of display units,
    // so they need the raw mm/min value rather than the unit-converted one above.
    probeMovementSpeedAuto?: number;
    firmware?: FIRMWARE_TYPES_T;
    xyPositionAdjust?: number;
    zPositionAdjust?: number;
    direction?: PROBE_DIRECTIONS;
    $13: string;
    plateType: TOUCHPLATE_TYPES_T;
    probeType: PROBE_TYPES_T;
    homingEnabled: boolean;
}

export interface ProbeWidgetSettings {
    slowSpeed: number;
    fastSpeed: number;
    retract: number;
    zProbeDistance: number;
    zProbeThickness: number;
}

export interface Probe {
    minimized: boolean;
    probeCommand: string;
    connectivityTest: boolean;
    useTLO: boolean;
    probeDepth: number;
    probeFeedrate: number;
    probeFastFeedrate: number;
    retractionDistance: number;
    zRetractNormal: number;
    zRetractAuto: number;
    zProbeDistance: number;
    touchPlateHeight: number;
    probeType: string;
    touchplateTypeSwitcher: boolean;
    probeAxis: string;
    direction: number;
    tipDiameter3D: number;
    xyRetract3D: number;
    probeMovementSpeed: number;
}

export interface Actions {
    startConnectivityTest: () => void;
    setProbeConnectivity: (connectionMade: boolean) => void;
    onOpenChange: (isOpen: boolean) => void;
    changeProbeCommand: (value: string) => void;
    changeTouchPlateType: (value: TOUCHPLATE_TYPES_T) => void;
    toggleUseTLO: () => void;
    handleProbeDepthChange: (event: Event) => void;
    handleProbeFeedrateChange: (event: Event) => void;
    handleRetractionDistanceChange: (event: Event) => void;
    handleZRetractDistanceChange: (event: Event) => void;
    handleZRetractDistanceAutoChange: (event: Event) => void;
    handleProbeCommandChange: (index: number) => void;
    handleSafeProbeToggle: () => void;
    generatePossibleProbeCommands: () => ProbeCommand[];
    generateProbeCommands: () => string[];
    runProbeCommands: (commands: string[]) => void;
    returnProbeConnectivity: () => boolean;
    _setToolDiameter: (selection: { value: number }) => void;
    nextProbeDirection: () => void;
    _setProbeType: (value: string) => void;
    _setCurrentTool: (tool: AvailableTool) => void;
}

export interface AvailableTool {
    metricDiameter: number;
    imperialDiameter: number;
    type: string;
}

export interface State {
    connectionMade: boolean;
    connectionMadeRef: React.MutableRefObject<boolean>;
    canClick: boolean;
    show: boolean;
    availableProbeCommands: ProbeCommand[];
    selectedProbeCommand: number;
    touchplate: ProbeProfile;
    touchplateTypeSwitcher: boolean;
    toolDiameter: number;
    availableTools: AvailableTool[];
    units: UNITS_EN;
    direction: number;
    probeType: PROBE_TYPES_T;
    connectivityTest: boolean;
}
