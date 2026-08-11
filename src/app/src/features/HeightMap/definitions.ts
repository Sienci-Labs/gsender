/*
 * Height Map Tool Definitions
 * Types and interfaces for the Height Map feature
 */

export interface HeightMapPoint {
    x: number;
    y: number;
    z: number;
}

export interface HeightMapBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}

export interface HeightMapResolution {
    x: number;
    y: number;
}

export interface HeightMapData {
    bounds: HeightMapBounds;
    resolution: HeightMapResolution;
    points: HeightMapPoint[];
    createdAt?: string;
    units?: string;
    // Config values stored with the map
    config?: {
        gridSpacing: number;
        usePointCount: boolean;
        zClearance: number;
        probeFeedRate: number;
        maxProbeDepth: number;
        segmentLength: number;
    };
}

export interface HeightMapConfig {
    // Grid Definitions
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    gridSpacing: number; // Grid resolution in mm
    usePointCount: boolean; // Whether to use point count instead of spacing
    pointCountX: number;
    pointCountY: number;
    /**
     * Distance to pull the probe area in from the toolpath extents when
     * deriving bounds from a loaded file. Keeps probe points off the edge of
     * the stock, where a probe can miss the surface or drop off the board.
     */
    edgeInset: number;

    // Probing Safety
    zClearance: number; // Safety height to retract between probes
    probeFeedRate: number; // Speed of the probe plunge
    maxProbeDepth: number; // Max distance to travel down before alarming

    // Transformation Settings
    segmentLength: number; // Max segment length for line subdivision
}

export interface HeightMapState extends HeightMapConfig {
    mapData: HeightMapData | null;
    isProbing: boolean;
    probeProgress: number;
    totalProbePoints: number;
    currentProbeIndex: number;
    lastError: string | null;
}

export type ProbeStatus = 'idle' | 'probing' | 'complete' | 'error' | 'aborted';

export interface ProbeResult {
    success: boolean;
    point?: HeightMapPoint;
    error?: string;
}

// Default configuration values
export const DEFAULT_HEIGHT_MAP_CONFIG: HeightMapConfig = {
    minX: 0,
    maxX: 100,
    minY: 0,
    maxY: 100,
    gridSpacing: 10,
    usePointCount: false,
    pointCountX: 5,
    pointCountY: 5,
    edgeInset: 2,
    zClearance: 5,
    probeFeedRate: 100,
    maxProbeDepth: 10,
    segmentLength: 1,
};

export const DEFAULT_HEIGHT_MAP_STATE: HeightMapState = {
    ...DEFAULT_HEIGHT_MAP_CONFIG,
    mapData: null,
    isProbing: false,
    probeProgress: 0,
    totalProbePoints: 0,
    currentProbeIndex: 0,
    lastError: null,
};

/**
 * Smallest sensible value for each configurable length.
 *
 * The imperial floors are derived rather than written out, so the two systems
 * cannot drift into meaning different physical things. They had: segmentLength
 * was 0.004in against a metric 0.01mm -- ten times looser -- and probeFeedRate's
 * 1in/min matched the metric 25mm/min only by coincidence.
 */
const MIN_VALUES_METRIC = {
    gridSpacing: 1,
    edgeInset: 0,
    zClearance: 1,
    probeFeedRate: 25,
    maxProbeDepth: 0.1,
    segmentLength: 0.01,
};

const MM_PER_INCH = 25.4;

export const MIN_VALUES = {
    metric: MIN_VALUES_METRIC,
    imperial: Object.fromEntries(
        Object.entries(MIN_VALUES_METRIC).map(([key, mm]) => [key, mm / MM_PER_INCH]),
    ) as typeof MIN_VALUES_METRIC,
};
