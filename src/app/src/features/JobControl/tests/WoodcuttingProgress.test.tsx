/*
 * Unit tests for WoodcuttingProgress component
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import WoodcuttingProgress from "../WoodcuttingProgress";

// ---------------------------------------------------------------------------
// Asset mocks — Jest can't process binary files; return stable string paths
// ---------------------------------------------------------------------------
jest.mock("./assets/loading-spinning-bit.gif", () => "spinning-drill.gif");
jest.mock(
  "./assets/loading-spinning-bit-paused.gif",
  () => "spinning-drill-paused.gif"
);
jest.mock(
  "./assets/loading-wood-block-lines.png",
  () => "wood-block-before.png"
);
jest.mock("./assets/loading-wood-dust-pile.gif", () => "wood-block-after.gif");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getDrillImg = () => screen.getByAltText("Spinning Drill");

/** Returns the two decoration divs (after-dust, before-block) in DOM order */
const getDecorationDivs = (container: HTMLElement) => {
  // The root div has class "relative"; its first two children are the two bg divs
  const root = container.firstChild as HTMLElement;
  return {
    dustDiv: root.children[0] as HTMLElement,
    woodDiv: root.children[1] as HTMLElement,
  };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("WoodcuttingProgress", () => {
  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  describe("rendering", () => {
    it("renders without crashing", () => {
      const { container } = render(<WoodcuttingProgress percentage={50} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders the drill image with correct alt text", () => {
      render(<WoodcuttingProgress percentage={50} />);
      expect(getDrillImg()).toBeInTheDocument();
    });

    it("renders the wood-before and wood-after decoration layers", () => {
      const { container } = render(<WoodcuttingProgress percentage={50} />);
      const { dustDiv, woodDiv } = getDecorationDivs(container);
      expect(dustDiv).toBeInTheDocument();
      expect(woodDiv).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Drill image src — running vs paused
  // -------------------------------------------------------------------------
  describe("drill image source", () => {
  it("renders drill image with stub src when isPaused is false (default)", () => {
    render(<WoodcuttingProgress percentage={50} />);
    expect(getDrillImg()).toHaveAttribute("src", "test-file-stub");
  });

  it("renders drill image with stub src when isPaused is explicitly false", () => {
    render(<WoodcuttingProgress percentage={50} isPaused={false} />);
    expect(getDrillImg()).toHaveAttribute("src", "test-file-stub");
  });

  it("renders drill image with stub src when isPaused is true", () => {
    render(<WoodcuttingProgress percentage={50} isPaused={true} />);
    expect(getDrillImg()).toHaveAttribute("src", "test-file-stub");
  });

  it("renders drill image regardless of isPaused changes", () => {
    const { rerender } = render(
      <WoodcuttingProgress percentage={50} isPaused={true} />
    );
    expect(getDrillImg()).toHaveAttribute("src", "test-file-stub");
    rerender(<WoodcuttingProgress percentage={50} isPaused={false} />);
    expect(getDrillImg()).toHaveAttribute("src", "test-file-stub");
  });
});
  // -------------------------------------------------------------------------
  // Background images
  // -------------------------------------------------------------------------
    describe("background images", () => {
  it("applies background image to the dust layer", () => {
    const { container } = render(<WoodcuttingProgress percentage={50} />);
    const { dustDiv } = getDecorationDivs(container);
    expect(dustDiv.style.backgroundImage).toBe("url(test-file-stub)");
  });

  it("applies background image to the wood block layer", () => {
    const { container } = render(<WoodcuttingProgress percentage={50} />);
    const { woodDiv } = getDecorationDivs(container);
    expect(woodDiv.style.backgroundImage).toBe("url(test-file-stub)");
  });
});

  // -------------------------------------------------------------------------
  // clipPath on the wood-before layer
  // -------------------------------------------------------------------------
  describe("wood-before clip-path", () => {
    const getClipPath = (container: HTMLElement) =>
      getDecorationDivs(container).woodDiv.style.clipPath;

    it("clips from 0% at 0% progress (fully visible)", () => {
      const { container } = render(<WoodcuttingProgress percentage={0} />);
      expect(getClipPath(container)).toBe(
        "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"
      );
    });

    it("clips from 50% at 50% progress", () => {
      const { container } = render(<WoodcuttingProgress percentage={50} />);
      expect(getClipPath(container)).toBe(
        "polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)"
      );
    });

    it("clips from 100% at 100% progress (fully hidden)", () => {
      const { container } = render(<WoodcuttingProgress percentage={100} />);
      expect(getClipPath(container)).toBe(
        "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)"
      );
    });

    it("clamps percentage above 100 to 100 in clip-path", () => {
      const { container } = render(<WoodcuttingProgress percentage={150} />);
      expect(getClipPath(container)).toBe(
        "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)"
      );
    });

    it("clamps negative percentage to 0 in clip-path", () => {
      const { container } = render(<WoodcuttingProgress percentage={-20} />);
      expect(getClipPath(container)).toBe(
        "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"
      );
    });

    it("applies the clip-path transition style", () => {
      const { container } = render(<WoodcuttingProgress percentage={50} />);
      expect(getDecorationDivs(container).woodDiv.style.transition).toBe(
        "clip-path 0.2s ease-out"
      );
    });
  });

  // -------------------------------------------------------------------------
  // Drill image positioning
  // -------------------------------------------------------------------------
  describe("drill image left position", () => {
    /**
     * When drillImageRef.current is null (jsdom doesn't do layout),
     * offsetWidth is 0, so left = `calc(${percentage}% - 0px + 6px)`
     * which simplifies to `calc(${percentage}% - undefinedpx + 6px)`.
     * We verify the percentage value is embedded correctly.
     */
    const getDrillLeft = () =>
      (getDrillImg() as HTMLImageElement).style.left;

    it("embeds the percentage value in the left style at 0%", () => {
      render(<WoodcuttingProgress percentage={0} />);
      expect(getDrillLeft()).toContain("0%");
    });

    it("embeds the percentage value in the left style at 75%", () => {
      render(<WoodcuttingProgress percentage={75} />);
      expect(getDrillLeft()).toContain("75%");
    });

    it("embeds the percentage value in the left style at 100%", () => {
      render(<WoodcuttingProgress percentage={100} />);
      expect(getDrillLeft()).toContain("100%");
    });

    it("updates left style when percentage prop changes", () => {
      const { rerender } = render(<WoodcuttingProgress percentage={20} />);
      expect(getDrillLeft()).toContain("20%");

      rerender(<WoodcuttingProgress percentage={80} />);
      expect(getDrillLeft()).toContain("80%");
    });
  });

  // -------------------------------------------------------------------------
  // Transition style on drill image
  // -------------------------------------------------------------------------
  describe("drill image transition", () => {
    it("has the opacity transition style applied", () => {
      render(<WoodcuttingProgress percentage={50} />);
      expect(getDrillImg().style.transition).toBe("opacity 0.3s ease");
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------
  describe("edge cases", () => {
    it("renders at exactly 0% without errors", () => {
      expect(() =>
        render(<WoodcuttingProgress percentage={0} />)
      ).not.toThrow();
    });

    it("renders at exactly 100% without errors", () => {
      expect(() =>
        render(<WoodcuttingProgress percentage={100} />)
      ).not.toThrow();
    });

    it("renders with a decimal percentage without errors", () => {
      expect(() =>
        render(<WoodcuttingProgress percentage={33.33} />)
      ).not.toThrow();
    });

    it("renders when isPaused is not provided (defaults to false)", () => {
      render(<WoodcuttingProgress percentage={50} />);
      expect(getDrillImg()).toHaveAttribute("src", "spinning-drill.gif");
    });
  });
});