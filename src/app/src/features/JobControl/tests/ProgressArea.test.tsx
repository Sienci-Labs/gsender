/*
 * Unit tests for ProgressArea component
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProgressArea from "./ProgressArea";
import { WORKFLOW_STATE_PAUSED } from "../../constants";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock("moment", () => {
  const mockMoment = () => ({
    add: jest.fn().mockReturnThis(),
    format: jest.fn().mockReturnValue("3:45pm"),
  });
  return mockMoment;
});

jest.mock("app/lib/datetime", () => ({
  convertMillisecondsToTimeStamp: jest.fn(
    (ms: number) => `${Math.floor(ms / 60000)}:00`
  ),
  convertSecondsToDHMS: jest.fn((seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [d, h, m, s] as [number, number, number, number];
  }),
}));

jest.mock("../WoodcuttingProgress", () =>
  ({ percentage, isPaused }: { percentage: number; isPaused: boolean }) => (
    <div
      data-testid="woodcutting-progress"
      data-percentage={percentage}
      data-is-paused={String(isPaused)}
    />
  )
);

jest.mock("app/components/shadcn/Tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
  TooltipProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  TooltipTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => <>{children}</>,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultSenderStatus = {
  total: 100,
  currentLineRunning: 50,
  elapsedTime: 120000, // 2 min in ms
  remainingTime: 300,  // 5 min in seconds
  startTime: 1000,
};

const renderProgressArea = (
  overrides: Partial<typeof defaultSenderStatus> = {},
  workflowState?: string
) => {
  const senderStatus = { ...defaultSenderStatus, ...overrides };
  return render(
    <ProgressArea senderStatus={senderStatus} workflowState={workflowState} />
  );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ProgressArea", () => {
  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  describe("rendering", () => {
    it("renders without crashing", () => {
      renderProgressArea();
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    it("sets correct ARIA attributes on the progressbar", () => {
      renderProgressArea({ currentLineRunning: 50, total: 100 });
      const bar = screen.getByRole("progressbar");
      expect(bar).toHaveAttribute("aria-valuenow", "50");
      expect(bar).toHaveAttribute("aria-valuemin", "0");
      expect(bar).toHaveAttribute("aria-valuemax", "100");
      expect(bar).toHaveAttribute("aria-label", "Job Progress");
    });

    it("renders the WoodcuttingProgress sub-component", () => {
      renderProgressArea();
      expect(screen.getByTestId("woodcutting-progress")).toBeInTheDocument();
    });

    it("shows line count text", () => {
      renderProgressArea({ currentLineRunning: 42, total: 200 });
      expect(screen.getByText("42 / 200 Lines")).toBeInTheDocument();
    });

    it("shows elapsed cutting time", () => {
      // convertMillisecondsToTimeStamp mock returns `${floor(ms/60000)}:00`
      renderProgressArea({ elapsedTime: 120000 });
      expect(screen.getByText(/2:00 cutting/)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Percentage calculation
  // -------------------------------------------------------------------------
  describe("percentage display", () => {
    it("displays 0% when no lines have run", () => {
      renderProgressArea({ currentLineRunning: 0, total: 100 });
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("displays 50% when halfway done", () => {
      renderProgressArea({ currentLineRunning: 50, total: 100 });
      expect(screen.getByText("50")).toBeInTheDocument();
    });

    it("displays 100% when all lines are done", () => {
      renderProgressArea({ currentLineRunning: 100, total: 100 });
      expect(screen.getByText("100")).toBeInTheDocument();
    });

    it("clamps percentage to 100 even if currentLine exceeds total", () => {
      renderProgressArea({ currentLineRunning: 150, total: 100 });
      expect(screen.getByText("100")).toBeInTheDocument();
    });

    it("shows 0% when total is 0 (NaN guard)", () => {
      renderProgressArea({ currentLineRunning: 0, total: 0 });
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Remaining time display
  // -------------------------------------------------------------------------
  describe("remaining time display", () => {
    it("shows seconds only when remaining time < 60s", () => {
      // convertSecondsToDHMS(45) → [0, 0, 0, 45]
      renderProgressArea({ remainingTime: 45 });
      expect(screen.getByText("45")).toBeInTheDocument();
      expect(screen.getByText("s")).toBeInTheDocument();
    });

    it("shows minutes and seconds when remaining time is 1–59 minutes", () => {
      // convertSecondsToDHMS(125) → [0, 0, 2, 5]
      renderProgressArea({ remainingTime: 125 });
      expect(screen.getByText("02")).toBeInTheDocument(); // minutes
      expect(screen.getByText("m")).toBeInTheDocument();
      expect(screen.getByText("05")).toBeInTheDocument(); // seconds
      expect(screen.getByText("s")).toBeInTheDocument();
    });

    it("shows hours and minutes when remaining time is >= 1 hour", () => {
      // convertSecondsToDHMS(3660) → [0, 1, 1, 0]
      renderProgressArea({ remainingTime: 3660 });
      expect(screen.getByText("01")).toBeInTheDocument(); // hours
      expect(screen.getByText("hr")).toBeInTheDocument();
      expect(screen.getByText("01")).toBeInTheDocument(); // minutes
      expect(screen.getByText("m")).toBeInTheDocument();
    });

    it("shows days and hours when remaining time is >= 1 day", () => {
      // convertSecondsToDHMS(90000) → [1, 1, 0, 0]
      renderProgressArea({ remainingTime: 90000 });
      expect(screen.getByText("01")).toBeInTheDocument(); // days
      expect(screen.getByText("d")).toBeInTheDocument();
      expect(screen.getByText("hr")).toBeInTheDocument();
    });

    it("shows 'remaining' label when not finalizing", () => {
      renderProgressArea({ currentLineRunning: 50, total: 100, remainingTime: 60 });
      expect(screen.getByText("remaining")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Finalizing state
  // -------------------------------------------------------------------------
  describe("finalizing state", () => {
    it("shows 'Finalizing' when percentage >= 100 but remainingTime > 0", () => {
      renderProgressArea({
        currentLineRunning: 100,
        total: 100,
        remainingTime: 30,
      });
      expect(screen.getByText("Finalizing")).toBeInTheDocument();
      expect(screen.queryByText("remaining")).not.toBeInTheDocument();
    });

    it("does not show 'Finalizing' when remainingTime is 0", () => {
      renderProgressArea({
        currentLineRunning: 100,
        total: 100,
        remainingTime: 0,
      });
      expect(screen.queryByText("Finalizing")).not.toBeInTheDocument();
    });

    it("does not show 'Finalizing' when percentage < 100", () => {
      renderProgressArea({
        currentLineRunning: 80,
        total: 100,
        remainingTime: 60,
      });
      expect(screen.queryByText("Finalizing")).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Finish time tooltip
  // -------------------------------------------------------------------------
  describe("finish time tooltip", () => {
    it("shows estimated finish time in tooltip", () => {
      renderProgressArea({ startTime: 1000, remainingTime: 300 });
      // moment mock always returns "3:45pm"
      expect(screen.getByTestId("tooltip-content")).toHaveTextContent("3:45pm");
    });

    it("shows '-' in tooltip when startTime is 0", () => {
      renderProgressArea({ startTime: 0, remainingTime: 300 });
      expect(screen.getByTestId("tooltip-content")).toHaveTextContent("-");
    });

    it("shows '-' in tooltip when remainingTime is 0", () => {
      renderProgressArea({ startTime: 1000, remainingTime: 0 });
      expect(screen.getByTestId("tooltip-content")).toHaveTextContent("-");
    });

    it("shows '-' in tooltip when remainingTime is negative", () => {
      renderProgressArea({ startTime: 1000, remainingTime: -1 });
      expect(screen.getByTestId("tooltip-content")).toHaveTextContent("-");
    });
  });

  // -------------------------------------------------------------------------
  // Paused state
  // -------------------------------------------------------------------------
  describe("paused state", () => {
    it("passes isPaused=true to WoodcuttingProgress when workflow is paused", () => {
      renderProgressArea({}, WORKFLOW_STATE_PAUSED);
      expect(screen.getByTestId("woodcutting-progress")).toHaveAttribute(
        "data-is-paused",
        "true"
      );
    });

    it("passes isPaused=false to WoodcuttingProgress when workflow is not paused", () => {
      renderProgressArea({}, "running");
      expect(screen.getByTestId("woodcutting-progress")).toHaveAttribute(
        "data-is-paused",
        "false"
      );
    });

    it("passes isPaused=false when workflowState is undefined", () => {
      renderProgressArea();
      expect(screen.getByTestId("woodcutting-progress")).toHaveAttribute(
        "data-is-paused",
        "false"
      );
    });
  });

  // -------------------------------------------------------------------------
  // WoodcuttingProgress percentage passthrough
  // -------------------------------------------------------------------------
  describe("WoodcuttingProgress percentage passthrough", () => {
    it("passes the raw (unflored) percentage to WoodcuttingProgress", () => {
      renderProgressArea({ currentLineRunning: 1, total: 3 });
      const el = screen.getByTestId("woodcutting-progress");
      // 1/3 * 100 ≈ 33.333…
      expect(Number(el.getAttribute("data-percentage"))).toBeCloseTo(33.33, 1);
    });

    it("passes 0 when total is 0", () => {
      renderProgressArea({ currentLineRunning: 0, total: 0 });
      expect(
        Number(
          screen.getByTestId("woodcutting-progress").getAttribute("data-percentage")
        )
      ).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Null / missing senderStatus guard
  // -------------------------------------------------------------------------
  describe("null senderStatus", () => {
    it("renders without crashing when senderStatus is null/undefined", () => {
      // @ts-expect-error intentional bad prop for resilience test
      render(<ProgressArea senderStatus={null} />);
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });
  });
});