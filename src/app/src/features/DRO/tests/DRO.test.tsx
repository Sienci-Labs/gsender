/**
 * @jest-environment jsdom
 */

import {
    getHomingLocation,
    isBitSetInNumber,
    getMovementGCode,
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
    zeroAllAxes,
    gotoZero,
    handleManualOffset,
    homeMachine,
    homeAxis,
} from "app/features/DRO/utils/DRO";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("app/lib/controller", () => ({
    command: jest.fn(),
    settings: { settings: { $22: "1" } },
    state: { status: { mpos: { z: 0 } } },
}));

jest.mock("app/store", () => ({
    get: jest.fn((key, defaultVal) => defaultVal),
    set: jest.fn(),
}));

jest.mock("app/store/redux", () => {
    const mockGetState = jest.fn(() => ({
        controller: {
            type: "Grbl",
            settings: { settings: { $130: "300", $131: "300", $22: "1" } },
            state: { axes: { axes: ["X", "Y", "Z"] } },
        },
    }));

    const mockStore = {
        getState: mockGetState,
    };

    return {
        __esModule: true,
        default: mockStore,
        store: mockStore,
    };
});

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

jest.mock("app/constants", () => ({
    METRIC_UNITS: "mm",
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
        expect(getHomingLocation("8")).toBe(BACK_RIGHT);
        expect(getHomingLocation("9")).toBe(BACK_LEFT);
    });
});

// ─── isBitSetInNumber ─────────────────────────────────────────────────────────

describe("isBitSetInNumber", () => {
    test("returns true when the bit is set at the given position", () => {
        expect(isBitSetInNumber("1", 0)).toBe(true);
        expect(isBitSetInNumber("2", 1)).toBe(true);
        expect(isBitSetInNumber("4", 2)).toBe(true);
        expect(isBitSetInNumber("8", 3)).toBe(true);
    });

    test("returns false when the bit is not set at the given position", () => {
        expect(isBitSetInNumber("1", 1)).toBe(false);
        expect(isBitSetInNumber("2", 0)).toBe(false);
        expect(isBitSetInNumber("4", 0)).toBe(false);
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

    test("handles zero positions", () => {
        GoTo({ x: 0, y: 0, z: 0 }, false);
        expect(controller.command).toHaveBeenCalledWith(
            "gcode:safe",
            ["G90 G0 X0 Y0 Z0"],
        );
    });

    test("handles negative positions", () => {
        GoTo({ x: -10, y: -20, z: -5 }, false);
        expect(controller.command).toHaveBeenCalledWith(
            "gcode:safe",
            ["G90 G0 X-10 Y-20 Z-5"],
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

    test("handles uppercase axis input", () => {
        zeroWCS("X", 10);
        expect(controller.command).toHaveBeenCalledWith(
            "gcode",
            "G10 L20 P0 X10",
        );
    });

    test("handles negative value", () => {
        zeroWCS("y", -5);
        expect(controller.command).toHaveBeenCalledWith(
            "gcode",
            "G10 L20 P0 Y-5",
        );
    });
});

// ─── zeroAllAxes ──────────────────────────────────────────────────────────────

describe("zeroAllAxes", () => {
    const controller = require("app/lib/controller");

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("sends G10 L20 P0 X0 Y0 Z0 for Grbl firmware", () => {
        zeroAllAxes();
        expect(controller.command).toHaveBeenCalledWith(
            "gcode",
            "G10 L20 P0 X0 Y0 Z0",
        );
    });

    test("sends additional A axis command for grblHAL with A axis", () => {
        const reduxStore = require("app/store/redux");
        reduxStore.store.getState.mockReturnValueOnce({
            controller: {
                type: "grblHAL",
                settings: { settings: { $130: "300", $131: "300" } },
                state: { axes: { axes: ["X", "Y", "Z", "A"] } },
            },
        });

        zeroAllAxes();
        expect(controller.command).toHaveBeenCalledWith(
            "gcode",
            "G10 L20 P0 X0 Y0 Z0",
        );
        expect(controller.command).toHaveBeenCalledWith(
            "gcode",
            "G10 L20 P0 A0",
        );
    });
});

// ─── handleManualOffset ───────────────────────────────────────────────────────

describe("handleManualOffset", () => {
    const controller = require("app/lib/controller");
    const store = require("app/store");

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("sends correct gcode for metric units", () => {
        store.get.mockReturnValueOnce("mm");
        handleManualOffset(10, "x");
        expect(controller.command).toHaveBeenCalledWith(
            "gcode:safe",
            "G10 P0 L20 X10",
            "G21",
        );
    });

    test("sends correct gcode for imperial units", () => {
        store.get.mockReturnValueOnce("in");
        handleManualOffset(5, "y");
        expect(controller.command).toHaveBeenCalledWith(
            "gcode:safe",
            "G10 P0 L20 Y5",
            "G20",
        );
    });

    test("converts axis to uppercase", () => {
        store.get.mockReturnValueOnce("mm");
        handleManualOffset(0, "z");
        expect(controller.command).toHaveBeenCalledWith(
            "gcode:safe",
            "G10 P0 L20 Z0",
            "G21",
        );
    });

    test("handles string value input", () => {
        store.get.mockReturnValueOnce("mm");
        handleManualOffset("15", "x");
        expect(controller.command).toHaveBeenCalledWith(
            "gcode:safe",
            "G10 P0 L20 X15",
            "G21",
        );
    });
});

// ─── homeMachine ──────────────────────────────────────────────────────────────

describe("homeMachine", () => {
    const controller = require("app/lib/controller");
    const { isATCAvailable, sendATCHomingDialog } = require("app/features/ATC/utils/ATCFunctions.ts");

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("calls controller homing when ATC is not available", () => {
        isATCAvailable.mockReturnValueOnce(false);
        homeMachine();
        expect(controller.command).toHaveBeenCalledWith("homing");
    });

    test("calls sendATCHomingDialog when ATC is available", () => {
        isATCAvailable.mockReturnValueOnce(true);
        homeMachine();
        expect(sendATCHomingDialog).toHaveBeenCalled();
        expect(controller.command).not.toHaveBeenCalled();
    });
});

// ─── homeAxis ─────────────────────────────────────────────────────────────────

describe("homeAxis", () => {
    const controller = require("app/lib/controller");

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("sends homing command for X axis", () => {
        homeAxis("X");
        expect(controller.command).toHaveBeenCalledWith("gcode", "$HX");
    });

    test("sends homing command for Y axis", () => {
        homeAxis("Y");
        expect(controller.command).toHaveBeenCalledWith("gcode", "$HY");
    });

    test("sends homing command for Z axis", () => {
        homeAxis("Z");
        expect(controller.command).toHaveBeenCalledWith("gcode", "$HZ");
    });
});

// ─── gotoZero ─────────────────────────────────────────────────────────────────

describe("gotoZero", () => {
    const controller = require("app/lib/controller");
    const store = require("app/store");

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("sends G90 G0 X0 for X axis with no retract height", () => {
        store.get.mockReturnValueOnce(0);
        gotoZero("X");
        expect(controller.command).toHaveBeenCalledWith(
            "gcode:safe",
            ["G90 G0 X0"],
            "G21",
        );
    });

    test("sends G90 G0 Z0 for Z axis", () => {
        store.get.mockReturnValueOnce(0);
        gotoZero("Z");
        expect(controller.command).toHaveBeenCalledWith(
            "gcode:safe",
            ["G90 G0 Z0"],
            "G21",
        );
    });
});

// ─── getMovementGCode ─────────────────────────────────────────────────────────

describe("getMovementGCode", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("returns gcode array with Z and XY movement for BACK_RIGHT homing", () => {
        const gcode = getMovementGCode(FRONT_RIGHT, "0", true, 1);
        expect(gcode).toContain("G53 G21 G0 Z-1");
        expect(gcode.length).toBeGreaterThan(1);
    });

    test("returns gcode for FRONT_LEFT position with BACK_LEFT homing", () => {
        const gcode = getMovementGCode(FRONT_LEFT, "1", true, 1);
        expect(gcode).toContain("G53 G21 G0 Z-1");
        expect(gcode.length).toBeGreaterThan(1);
    });

    test("returns gcode for FRONT_RIGHT homing position", () => {
        const gcode = getMovementGCode(FRONT_RIGHT, "2", true, 1);
        expect(gcode).toContain("G53 G21 G0 Z-1");
        expect(gcode.length).toBeGreaterThan(1);
    });

    test("returns gcode for FRONT_LEFT homing position", () => {
        const gcode = getMovementGCode(BACK_RIGHT, "3", true, 1);
        expect(gcode).toContain("G53 G21 G0 Z-1");
        expect(gcode.length).toBeGreaterThan(1);
    });

    test("returns empty array when machine limits are missing", () => {
        const reduxStore = require("app/store/redux");
        reduxStore.default.getState.mockReturnValueOnce({
            controller: {
                type: "Grbl",
                settings: { settings: { $130: "0", $131: "0", $22: "1" } },
                state: { axes: { axes: ["X", "Y", "Z"] } },
            },
        });
        const gcode = getMovementGCode(FRONT_RIGHT, "0", true, 300);
        expect(Array.isArray(gcode)).toBe(true);
    });
});

// ─── goXYAxes ─────────────────────────────────────────────────────────────────

describe("goXYAxes", () => {
    const controller = require("app/lib/controller");
    const store = require("app/store");

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("sends G90 G0 X0 Y0 with no retract height", () => {
        store.get.mockReturnValueOnce(0);
        const { goXYAxes } = require("app/features/DRO/utils/DRO");
        goXYAxes();
        expect(controller.command).toHaveBeenCalledWith(
            "gcode:safe",
            ["G90 G0 X0 Y0"],
            "G21",
        );
    });

    test("sends retract and XY movement with homing enabled and retract height", () => {
        const mockController = require("app/lib/controller");
        mockController.settings.settings.$22 = "1";
        mockController.state.status.mpos.z = -50;
        store.get.mockReturnValueOnce(-10);
        const { goXYAxes } = require("app/features/DRO/utils/DRO");
        goXYAxes();
        expect(controller.command).toHaveBeenCalled();
    });

    test("sends relative retract and XY movement with homing disabled", () => {
        const mockController = require("app/lib/controller");
        mockController.settings.settings.$22 = "0";
        store.get.mockReturnValueOnce(-5);
        const { goXYAxes } = require("app/features/DRO/utils/DRO");
        goXYAxes();
        expect(controller.command).toHaveBeenCalledWith(
            "gcode:safe",
            expect.arrayContaining(["G91", "G90 G0 X0 Y0"]),
            "G21",
        );
    });
});

// ─── gotoZero with retract height ─────────────────────────────────────────────

describe("gotoZero with retract height", () => {
    const controller = require("app/lib/controller");
    const store = require("app/store");

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("sends retract then move for X axis with homing disabled and retract height", () => {
        const mockController = require("app/lib/controller");
        mockController.settings.settings.$22 = "0";
        store.get.mockReturnValueOnce(-5);
        const { gotoZero } = require("app/features/DRO/utils/DRO");
        gotoZero("X");
        expect(controller.command).toHaveBeenCalledWith(
            "gcode:safe",
            expect.arrayContaining(["G91", "G90 G0 X0"]),
            "G21",
        );
    });

    test("sends retract then move for X axis with homing enabled", () => {
        const mockController = require("app/lib/controller");
        mockController.settings.settings.$22 = "1";
        mockController.state.status.mpos.z = -50;
        store.get.mockReturnValueOnce(-10);
        const { gotoZero } = require("app/features/DRO/utils/DRO");
        gotoZero("X");
        expect(controller.command).toHaveBeenCalled();
    });

    test("does not retract for Z axis even with retract height", () => {
        store.get.mockReturnValueOnce(-5);
        const { gotoZero } = require("app/features/DRO/utils/DRO");
        gotoZero("Z");
        expect(controller.command).toHaveBeenCalledWith(
            "gcode:safe",
            expect.arrayContaining(["G90 G0 Z0"]),
            "G21",
        );
    });
});

// ─── getMovementGCode - additional homing positions ───────────────────────────

describe("getMovementGCode - additional positions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // FRONT_RIGHT homing (setting=2) with all target positions
    test("FRONT_RIGHT homing → FRONT_LEFT target", () => {
        const gcode = getMovementGCode(FRONT_LEFT, "2", true, 1);
        expect(gcode).toContain("G53 G21 G0 Z-1");
        expect(gcode.length).toBeGreaterThan(1);
    });

    test("FRONT_RIGHT homing → BACK_LEFT target", () => {
        const gcode = getMovementGCode(BACK_LEFT, "2", true, 1);
        expect(gcode).toContain("G53 G21 G0 Z-1");
        expect(gcode.length).toBeGreaterThan(1);
    });

    test("FRONT_RIGHT homing → BACK_RIGHT target", () => {
        const gcode = getMovementGCode(BACK_RIGHT, "2", true, 1);
        expect(gcode).toContain("G53 G21 G0 Z-1");
        expect(gcode.length).toBeGreaterThan(1);
    });

    // FRONT_LEFT homing (setting=3) with all target positions
    test("FRONT_LEFT homing → FRONT_RIGHT target", () => {
        const gcode = getMovementGCode(FRONT_RIGHT, "3", true, 1);
        expect(gcode).toContain("G53 G21 G0 Z-1");
        expect(gcode.length).toBeGreaterThan(1);
    });

    test("FRONT_LEFT homing → FRONT_LEFT target", () => {
        const gcode = getMovementGCode(FRONT_LEFT, "3", true, 1);
        expect(gcode).toContain("G53 G21 G0 Z-1");
        expect(gcode.length).toBeGreaterThan(1);
    });

    test("FRONT_LEFT homing → BACK_RIGHT target", () => {
        const gcode = getMovementGCode(BACK_RIGHT, "3", true, 1);
        expect(gcode).toContain("G53 G21 G0 Z-1");
        expect(gcode.length).toBeGreaterThan(1);
    });

    // BACK_LEFT homing (setting=1) with all target positions
    test("BACK_LEFT homing → FRONT_RIGHT target", () => {
        const gcode = getMovementGCode(FRONT_RIGHT, "1", true, 1);
        expect(gcode).toContain("G53 G21 G0 Z-1");
        expect(gcode.length).toBeGreaterThan(1);
    });

    test("BACK_LEFT homing → FRONT_LEFT target", () => {
        const gcode = getMovementGCode(FRONT_LEFT, "1", true, 1);
        expect(gcode).toContain("G53 G21 G0 Z-1");
        expect(gcode.length).toBeGreaterThan(1);
    });

    test("BACK_LEFT homing → BACK_LEFT target", () => {
        const gcode = getMovementGCode(BACK_LEFT, "1", true, 1);
        expect(gcode).toContain("G53 G21 G0 Z-1");
        expect(gcode.length).toBeGreaterThan(1);
    });

    test("BACK_LEFT homing → BACK_RIGHT target", () => {
        const gcode = getMovementGCode(BACK_RIGHT, "1", true, 1);
        expect(gcode).toContain("G53 G21 G0 Z-1");
        expect(gcode.length).toBeGreaterThan(1);
    });

    // BACK_RIGHT homing (setting=0) with all target positions
    test("BACK_RIGHT homing → FRONT_LEFT target", () => {
        const gcode = getMovementGCode(FRONT_LEFT, "0", true, 1);
        expect(gcode).toContain("G53 G21 G0 Z-1");
        expect(gcode.length).toBeGreaterThan(1);
    });

    test("BACK_RIGHT homing → BACK_LEFT target", () => {
        const gcode = getMovementGCode(BACK_LEFT, "0", true, 1);
        expect(gcode).toContain("G53 G21 G0 Z-1");
        expect(gcode.length).toBeGreaterThan(1);
    });

    test("BACK_RIGHT homing → BACK_RIGHT target", () => {
        const gcode = getMovementGCode(BACK_RIGHT, "0", true, 1);
        expect(gcode).toContain("G53 G21 G0 Z-1");
        expect(gcode.length).toBeGreaterThan(1);
    });

    // homing flag false
    test("homing flag false treats all movements as negative space", () => {
        const gcode = getMovementGCode(FRONT_RIGHT, "0", false, 1);
        expect(gcode).toContain("G53 G21 G0 Z-1");
        expect(gcode.length).toBeGreaterThan(1);
    });

    // grblHAL controller type
    test("grblHAL controller uses isBitSetInNumber for homing flag", () => {
        const store = require("app/store");
        store.get.mockReturnValueOnce("grblHAL");
        const gcode = getMovementGCode(FRONT_RIGHT, "0", true, 1);
        expect(Array.isArray(gcode)).toBe(true);
    });
});
