import { FIRMWARE_TYPES_T } from 'app/definitions/firmware';
import { UNITS_EN, BasicPosition } from 'app/definitions/general';
import { PROBE_TYPES, TOUCHPLATE_TYPES } from 'app/lib/constants';
import { probeDirections } from 'app/lib/Probing';

// Types

export type PROBE_DIRECTIONS =
    (typeof probeDirections)[keyof typeof probeDirections];

export type PROBE_TYPES_T = (typeof PROBE_TYPES)[keyof typeof PROBE_TYPES];

export type TOUCHPLATE_TYPES_T =
    (typeof TOUCHPLATE_TYPES)[keyof typeof TOUCHPLATE_TYPES];

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
    zProbeDistance: number;
    touchPlateHeight: number;
    probeType: string;
    probeAxis: string;
    direction: number;
    tipDiameter3D: number;
    xyRetract3D: number;
}

export interface Actions {
    startConnectivityTest: () => void;
    setProbeConnectivity: (connectionMade: boolean) => void;
    onOpenChange: (isOpen: boolean) => void;
    changeProbeCommand: (value: string) => void;
    toggleUseTLO: () => void;
    handleProbeDepthChange: (event: Event) => void;
    handleProbeFeedrateChange: (event: Event) => void;
    handleRetractionDistanceChange: (event: Event) => void;
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
    toolDiameter: number;
    availableTools: AvailableTool[];
    units: UNITS_EN;
    direction: number;
    probeType: PROBE_TYPES_T;
    connectivityTest: boolean;
}
