/**
 * @jest-environment jsdom
 */

import {
    getHomingLocation,
    isBitSetInNumber,
    FRONT_RIGHT,
    FRONT_LEFT,
    BACK_RIGHT,
    BACK_LEFT,
    OTHER,
} from "app/features/DRO/utils/RapidPosition";

import {
    defaultAxes,
    defaultDROPosition,
    hasAxis,
    GoTo,
    zeroWCS,
    handleManualOffset,
} from "app/features/DRO/utils/DRO";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("app/lib/controller", () => ({
    command: jest.fn(),
    settings: { settings: {} },
    state: { status: { mpos: { z: 0 } } },
}));

jest.mock("app/store", () => ({
    get: jest.fn((key, defaultVal) => defaultVal),
    set: jest.fn(),
}));

jest.mock("app/store/redux", () => ({
    store: {
        getState: jest.fn(() => ({
            controller: {
                type: "Grbl",
                settings: { settings: { $130: "300", $131: "300" } },
                state: { axes: { axes: ["X", "Y", "Z"] } },
            },
        })),
    },
}));

jest.mock("app/lib/toaster", () => ({
    toast: {
        error: jest.fn(),
        success: jest.fn(),
    },
}));

jest.mock("app/features/ATC/utils/ATCFunctions.ts", () => ({
    isATCAvailable: jest.fn(() => false),
    sendATCHomingDialog: jest.fn(),
}));

// ─── getHomingLocation ────────────────────────────────────────────────────────

describe("getHomingLocation", () => {
    test("returns BACK_RIGHT when setting is 0", () => {
        expect(getHomingLocation("0")).toBe(BACK_RIGHT);
    });

    test("returns BACK_LEFT when setting is 1", () => {
        expect(getHomingLocation("1")).toBe(BACK_LEFT);
    });

    test("returns FRONT_RIGHT when setting is 2", () => {
        expect(getHomingLocation("2")).toBe(FRONT_RIGHT);
    });

    test("returns FRONT_LEFT when setting is 3", () => {
        expect(getHomingLocation("3")).toBe(FRONT_LEFT);
    });

    test("returns OTHER for values outside 0-3", () => {
        expect(getHomingLocation("4")).toBe(OTHER);
        expect(getHomingLocation("7")).toBe(OTHER);
    });

    test("strips A-C axes using bitmask and returns correct location", () => {
        // 8 in binary is 1000, bitmask with 7 (0111) gives 0 → BACK_RIGHT
        expect(getHomingLocation("8")).toBe(BACK_RIGHT);
        // 9 in binary is 1001, bitmask with 7 (0111) gives 1 → BACK_LEFT
        expect(getHomingLocation("9")).toBe(BACK_LEFT);
    });
});

// ─── isBitSetInNumber ─────────────────────────────────────────────────────────

describe("isBitSetInNumber", () => {
    test("returns true when the bit is set at the given position", () => {
        expect(isBitSetInNumber("1", 0)).toBe(true);  // binary: 0001, bit 0 is set
        expect(isBitSetInNumber("2", 1)).toBe(true);  // binary: 0010, bit 1 is set
        expect(isBitSetInNumber("4", 2)).toBe(true);  // binary: 0100, bit 2 is set
        expect(isBitSetInNumber("8", 3)).toBe(true);  // binary: 1000, bit 3 is set
    });

    test("returns false when the bit is not set at the given position", () => {
        expect(isBitSetInNumber("1", 1)).toBe(false); // binary: 0001, bit 1 is not set
        expect(isBitSetInNumber("2", 0)).toBe(false); // binary: 0010, bit 0 is not set
        expect(isBitSetInNumber("4", 0)).toBe(false); // binary: 0100, bit 0 is not set
    });

    test("returns false for value 0 at any bit position", () => {
        expect(isBitSetInNumber("0", 0)).toBe(false);
        expect(isBitSetInNumber("0", 3)).toBe(false);
    });
});

// ─── DRO defaults ─────────────────────────────────────────────────────────────

describe("DRO defaults", () => {
    test("defaultAxes contains X, Y and Z", () => {
        expect(defaultAxes).toEqual(["X", "Y", "Z"]);
    });

    test("defaultDROPosition has correct default values", () => {
        expect(defaultDROPosition).toEqual({
            x: "0.000",
            y: "0.000",
            z: "0.000",
            a: "0.000",
            b: "0.000",
            c: "0.000",
        });
    });
});

// ─── hasAxis ──────────────────────────────────────────────────────────────────

describe("hasAxis", () => {
    const mockState = {
        controller: {
            state: {
                axes: {
                    axes: ["X", "Y", "Z", "A"],
                },
            },
        },
    };

    test("returns true when axis exists", () => {
        expect(hasAxis(mockState, "X")).toBe(true);
        expect(hasAxis(mockState, "Y")).toBe(true);
        expect(hasAxis(mockState, "Z")).toBe(true);
        expect(hasAxis(mockState, "A")).toBe(true);
    });

    test("returns false when axis does not exist", () => {
        expect(hasAxis(mockState, "B")).toBe(false);
        expect(hasAxis(mockState, "C")).toBe(false);
    });

    test("returns false when axes list is empty", () => {
        const emptyState = { controller: { state: { axes: { axes: [] } } } };
        expect(hasAxis(emptyState, "X")).toBe(false);
    });
});

// ─── GoTo ─────────────────────────────────────────────────────────────────────

describe("GoTo", () => {
    const controller = require("app/lib/controller");

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("sends G90 command in absolute mode", () => {
        GoTo({ x: 10, y: 20, z: 5 }, false);
        expect(controller.command).toHaveBeenCalledWith(
            "gcode:safe",
            ["G90 G0 X10 Y20 Z5"],
        );
    });

    test("sends G91 command in relative mode", () => {
        GoTo({ x: 10, y: 20, z: 5 }, true);
        expect(controller.command).toHaveBeenCalledWith(
            "gcode:safe",
            ["G91 G0 X10 Y20 Z5"],
        );
    });
});

// ─── zeroWCS ──────────────────────────────────────────────────────────────────

describe("zeroWCS", () => {
    const controller = require("app/lib/controller");

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("sends correct gcode to zero an axis", () => {
        zeroWCS("x");
        expect(controller.command).toHaveBeenCalledWith(
            "gcode",
            "G10 L20 P0 X0",
        );
    });

    test("sends correct gcode with a custom value", () => {
        zeroWCS("y", 5);
        expect(controller.command).toHaveBeenCalledWith(
            "gcode",
            "G10 L20 P0 Y5",
        );
    });

    test("converts axis to uppercase", () => {
        zeroWCS("z");
        expect(controller.command).toHaveBeenCalledWith(
            "gcode",
            "G10 L20 P0 Z0",
        );
    });
});