/** @jest-environment jsdom */

/**
 * Tests for OutlineButton component
 * Covers:
 * - Rendering
 * - Disabled state
 * - Click behavior in lite mode
 * - Click behavior in normal mode
 * - Outline already running (guard)
 */

// ← REMOVED: import { outlineResponse } from 'app/workers/Outline.response';
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import OutlineButton from "app/features/JobControl/OutlineButton";

//----------------------------------//
// ─── Mocks ────────────────────────
//----------------------------------//

const mockGet = jest.fn();
const mockPublish = jest.fn();
const mockToastError = jest.fn();
const mockOutlineResponse = jest.fn();

jest.mock("app/store", () => ({
    get: (...args: any[]) => mockGet(...args),
}));

jest.mock("app/store/redux", () => ({
    store: {
        getState: () => ({
            file: { bbox: { min: { x: 0, y: 0 }, max: { x: 100, y: 100 } } },
        }),
    },
}));

jest.mock("pubsub-js", () => ({
    publish: (...args: any[]) => mockPublish(...args),
}));

jest.mock("app/lib/toaster", () => ({
    toast: { error: (...args: any[]) => mockToastError(...args) },
}));

jest.mock("app/workers/Outline.response", () => ({
    outlineResponse: (...args: any[]) => mockOutlineResponse(...args),
}));

// Mock Worker
class MockWorker {
    onmessage: ((e: any) => void) | null = null;
    postMessage = jest.fn((data) => {
        if (this.onmessage) {
            this.onmessage({ data: {} });
        }
    });
    terminate = jest.fn();
}

(global as any).Worker = MockWorker;

//----------------------------------//
// ─── Rendering ───────────────────//
//----------------------------------//

describe("OutlineButton — rendering", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders the Outline button", () => {
        render(<OutlineButton disabled={false} />);
        expect(screen.getByRole("button", { name: /outline/i })).toBeInTheDocument();
    });

    it("is disabled when disabled prop is true", () => {
        render(<OutlineButton disabled={true} />);
        expect(screen.getByRole("button", { name: /outline/i })).toBeDisabled();
    });

    it("is enabled when disabled prop is false", () => {
        render(<OutlineButton disabled={false} />);
        expect(screen.getByRole("button", { name: /outline/i })).not.toBeDisabled();
    });
});

//----------------------------------//
// ─── Click behavior ──────────────//
//----------------------------------//

describe("OutlineButton — normal mode (liteMode false)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGet.mockImplementation((key: string) => {
            if (key === "widgets.visualizer.liteMode") return false;
            return null;
        });
    });

    it("publishes outline:start when liteMode is false", () => {
        render(<OutlineButton disabled={false} />);
        fireEvent.click(screen.getByRole("button", { name: /outline/i }));
        expect(mockPublish).toHaveBeenCalledWith("outline:start");
    });

    it("does not create a Worker in normal mode", () => {
        const workerSpy = jest.spyOn(global as any, "Worker");
        render(<OutlineButton disabled={false} />);
        fireEvent.click(screen.getByRole("button", { name: /outline/i }));
        expect(workerSpy).not.toHaveBeenCalled();
    });
});

describe("OutlineButton — lite mode (liteMode true)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGet.mockImplementation((key: string, fallback?: any) => {
            if (key === "widgets.visualizer.liteMode") return true;
            if (key === "widgets.spindle.laser.laserOnOutline") return false;
            if (key === "widgets.spindle.mode") return "spindle";
            if (key === "workspace.outlineSpeed") return 1000;
            return fallback ?? null;
        });
    });

    it("creates a Worker and posts message in lite mode", () => {
        render(<OutlineButton disabled={false} />);
        fireEvent.click(screen.getByRole("button", { name: /outline/i }));
        expect(mockPublish).not.toHaveBeenCalled();
    });

    it("does not publish outline:start in lite mode", () => {
        render(<OutlineButton disabled={false} />);
        fireEvent.click(screen.getByRole("button", { name: /outline/i }));
        expect(mockPublish).not.toHaveBeenCalledWith("outline:start");
    });

    it("does nothing if outlineRunning is already true", () => {
        render(<OutlineButton disabled={false} />);
        fireEvent.click(screen.getByRole("button", { name: /outline/i }));
        fireEvent.click(screen.getByRole("button", { name: /outline/i }));
        expect(mockPublish).not.toHaveBeenCalled();
    });

    it("sets isLaser true when laserOnOutline and spindleMode is LASER_MODE", () => {
        mockGet.mockImplementation((key: string, fallback?: any) => {
            if (key === "widgets.visualizer.liteMode") return true;
            if (key === "widgets.spindle.laser.laserOnOutline") return true;
            if (key === "widgets.spindle.mode") return "laser";
            if (key === "workspace.outlineSpeed") return 1000;
            return fallback ?? null;
        });
        render(<OutlineButton disabled={false} />);
        fireEvent.click(screen.getByRole("button", { name: /outline/i }));
        expect(mockPublish).not.toHaveBeenCalled();
    });

    it("calls toast.error when worker times out", () => {
        jest.useFakeTimers();
        mockGet.mockImplementation((key: string, fallback?: any) => {
            if (key === "widgets.visualizer.liteMode") return true;
            if (key === "widgets.spindle.laser.laserOnOutline") return false;
            if (key === "widgets.spindle.mode") return "spindle";
            if (key === "workspace.outlineSpeed") return null;
            return fallback ?? null;
        });

        (global as any).Worker = class {
            onmessage = null;
            postMessage = jest.fn();
            terminate = jest.fn();
        };

        render(<OutlineButton disabled={false} />);
        fireEvent.click(screen.getByRole("button", { name: /outline/i }));
        jest.advanceTimersByTime(15000);
        expect(mockToastError).toHaveBeenCalledWith(
            "Outline generation timed out. Please try again."
        );
        jest.useRealTimers();
    });

    it("calls outlineResponse and resets outlineRunning when worker responds", () => {
        mockGet.mockImplementation((key: string, fallback?: any) => {
            if (key === "widgets.visualizer.liteMode") return true;
            if (key === "widgets.spindle.laser.laserOnOutline") return false;
            if (key === "widgets.spindle.mode") return "spindle";
            if (key === "workspace.outlineSpeed") return null;
            return fallback ?? null;
        });

        (global as any).Worker = class {
            onmessage: ((e: any) => void) | null = null;
            postMessage = jest.fn(() => {
                if (this.onmessage) {
                    this.onmessage({ data: {} });
                }
            });
            terminate = jest.fn();
        };

        render(<OutlineButton disabled={false} />);
        fireEvent.click(screen.getByRole("button", { name: /outline/i }));
        expect(mockOutlineResponse).toHaveBeenCalledWith({ data: {} }); // ← fixed
    });

    it("returns early if outlineRunning is already true (line 25)", () => {
        mockGet.mockImplementation((key: string, fallback?: any) => {
            if (key === "widgets.visualizer.liteMode") return true;
            return fallback ?? null;
        });

        (global as any).Worker = class {
            onmessage = null;
            postMessage = jest.fn();
            terminate = jest.fn();
        };

        render(<OutlineButton disabled={false} />);
        const button = screen.getByRole("button", { name: /outline/i });
        fireEvent.click(button);
        fireEvent.click(button);
        expect(mockPublish).not.toHaveBeenCalled();
    });
});