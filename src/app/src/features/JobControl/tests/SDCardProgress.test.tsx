/*
 * Unit tests for SDCardProgress component
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SDCardProgress } from "../SDCardProgress";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

// Capture the selector fn so individual tests can control the returned value
let mockSDCardProgress: { name: string | null; percentage: number } | undefined;

jest.mock("app/hooks/useTypedSelector.ts", () => ({
  useTypedSelector: (selector: (state: unknown) => unknown) =>
    selector({
      controller: {
        state: {
          status: {
            SD: mockSDCardProgress,
          },
        },
      },
    }),
}));

jest.mock("app/features/JobControl/WoodcuttingProgress.tsx", () =>
  ({ percentage, isPaused }: { percentage: number; isPaused: boolean }) => (
    <div
      data-testid="woodcutting-progress"
      data-percentage={percentage}
      data-is-paused={String(isPaused)}
    />
  )
);

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const renderSDCardProgress = (
  sdState?: { name: string | null; percentage: number }
) => {
  mockSDCardProgress = sdState;
  return render(<SDCardProgress />);
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SDCardProgress", () => {
  beforeEach(() => {
    mockSDCardProgress = undefined;
  });

  // -------------------------------------------------------------------------
  // Visibility gating
  // -------------------------------------------------------------------------
  describe("visibility gating", () => {
    it("renders nothing when sdCardProgress is undefined", () => {
      const { container } = renderSDCardProgress(undefined);
      // Only an empty fragment — no visible content
      expect(container.firstChild).toBeNull();
    });

    it("renders nothing when sdCardProgress is null", () => {
      mockSDCardProgress = null as unknown as undefined;
      const { container } = render(<SDCardProgress />);
      expect(container.firstChild).toBeNull();
    });

    it("renders nothing when progress.name is null", () => {
      const { container } = renderSDCardProgress({ name: null, percentage: 50 });
      expect(container.firstChild).toBeNull();
    });

    it("renders the progress UI when progress.name is set", () => {
      renderSDCardProgress({ name: "model.gcode", percentage: 50 });
      expect(screen.getByText("model.gcode")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // File name display
  // -------------------------------------------------------------------------
  describe("file name display", () => {
    it("displays the SD card file name", () => {
      renderSDCardProgress({ name: "rocket.gcode", percentage: 25 });
      expect(screen.getByText("rocket.gcode")).toBeInTheDocument();
    });

    it("displays a name that contains spaces or special characters", () => {
      renderSDCardProgress({ name: "my file (1).gcode", percentage: 10 });
      expect(screen.getByText("my file (1).gcode")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Percentage display
  // -------------------------------------------------------------------------
  describe("percentage display", () => {
    it("shows 0% when percentage is 0", () => {
      renderSDCardProgress({ name: "file.gcode", percentage: 0 });
      expect(screen.getByText("0")).toBeInTheDocument();
      expect(screen.getByText("%")).toBeInTheDocument();
    });

    it("shows floored integer percentage", () => {
      renderSDCardProgress({ name: "file.gcode", percentage: 66.9 });
      // Math.floor(66.9) = 66
      expect(screen.getByText("66")).toBeInTheDocument();
    });

    it("shows 100% when complete", () => {
      renderSDCardProgress({ name: "file.gcode", percentage: 100 });
      expect(screen.getByText("100")).toBeInTheDocument();
    });

    it("does NOT round up — shows floor value", () => {
      renderSDCardProgress({ name: "file.gcode", percentage: 99.99 });
      expect(screen.getByText("99")).toBeInTheDocument();
      expect(screen.queryByText("100")).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // translationNumber / label positioning
  // -------------------------------------------------------------------------
  describe("percentage label translation", () => {
    const getTransform = (container: HTMLElement) => {
      // The translated div is the one with the transition-transform class
      const el = container.querySelector(".transition-transform") as HTMLElement;
      return el?.style?.transform ?? "";
    };

    it("uses fixed '55px' translation when percentage <= 35", () => {
      const { container } = renderSDCardProgress({
        name: "f.gcode",
        percentage: 20,
      });
      expect(getTransform(container)).toBe("translate(55px, 16px)");
    });

    it("uses fixed '55px' translation when percentage is exactly 35", () => {
      const { container } = renderSDCardProgress({
        name: "f.gcode",
        percentage: 35,
      });
      expect(getTransform(container)).toBe("translate(55px, 16px)");
    });

    it("uses percentage translation when percentage is between 35 and 50 (exclusive)", () => {
      const { container } = renderSDCardProgress({
        name: "f.gcode",
        percentage: 40,
      });
      expect(getTransform(container)).toBe("translate(40%, 16px)");
    });

    it("uses percentage translation when percentage is exactly 50", () => {
      const { container } = renderSDCardProgress({
        name: "f.gcode",
        percentage: 50,
      });
      expect(getTransform(container)).toBe("translate(50%, 16px)");
    });

    it("uses (percentage - 40)% translation when percentage is between 50 and 75 (exclusive)", () => {
      const { container } = renderSDCardProgress({
        name: "f.gcode",
        percentage: 60,
      });
      // 60 - 40 = 20%
      expect(getTransform(container)).toBe("translate(20%, 16px)");
    });

    it("uses fixed '55px' translation when percentage >= 75", () => {
      const { container } = renderSDCardProgress({
        name: "f.gcode",
        percentage: 80,
      });
      expect(getTransform(container)).toBe("translate(55px, 16px)");
    });
  });

  // -------------------------------------------------------------------------
  // WoodcuttingProgress passthrough
  // -------------------------------------------------------------------------
  describe("WoodcuttingProgress passthrough", () => {
    it("renders the WoodcuttingProgress sub-component", () => {
      renderSDCardProgress({ name: "file.gcode", percentage: 50 });
      expect(screen.getByTestId("woodcutting-progress")).toBeInTheDocument();
    });

    it("passes the raw percentage to WoodcuttingProgress", () => {
      renderSDCardProgress({ name: "file.gcode", percentage: 42.5 });
      expect(
        screen.getByTestId("woodcutting-progress")
      ).toHaveAttribute("data-percentage", "42.5");
    });

    it("always passes isPaused=false to WoodcuttingProgress", () => {
      renderSDCardProgress({ name: "file.gcode", percentage: 50 });
      expect(
        screen.getByTestId("woodcutting-progress")
      ).toHaveAttribute("data-is-paused", "false");
    });

    it("does not render WoodcuttingProgress when name is null", () => {
      renderSDCardProgress({ name: null, percentage: 50 });
      expect(screen.queryByTestId("woodcutting-progress")).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Redux state transitions (useEffect)
  // -------------------------------------------------------------------------
  describe("redux state transitions", () => {
    it("resets to 0% / hidden when sdCardProgress becomes undefined after being set", () => {
      const { rerender } = render(<SDCardProgress />);

      // First render: active SD card job
      mockSDCardProgress = { name: "job.gcode", percentage: 70 };
      rerender(<SDCardProgress />);
      expect(screen.getByText("job.gcode")).toBeInTheDocument();

      // Second render: SD card state disappears
      mockSDCardProgress = undefined;
      rerender(<SDCardProgress />);
      expect(screen.queryByText("job.gcode")).not.toBeInTheDocument();
    });

    it("updates displayed name and percentage when sdCardProgress changes", () => {
      const { rerender } = render(<SDCardProgress />);

      mockSDCardProgress = { name: "first.gcode", percentage: 30 };
      rerender(<SDCardProgress />);
      expect(screen.getByText("first.gcode")).toBeInTheDocument();
      expect(screen.getByText("30")).toBeInTheDocument();

      mockSDCardProgress = { name: "second.gcode", percentage: 80 };
      rerender(<SDCardProgress />);
      expect(screen.getByText("second.gcode")).toBeInTheDocument();
      expect(screen.getByText("80")).toBeInTheDocument();
      expect(screen.queryByText("first.gcode")).not.toBeInTheDocument();
    });
  });
});