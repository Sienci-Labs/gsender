import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { UploadProgressBar } from "app/features/SDCard/components/UploadProgressBar.tsx";

jest.mock("lucide-react", () => ({
	CheckCircle2: () => <svg data-testid="icon-checkcircle2" />,
}));

describe("UploadProgressBar", () => {
	// ---- Idle state ----

	it("renders nothing when uploadState is idle", () => {
		const { container } = render(
			<UploadProgressBar uploadState="idle" uploadProgress={0} />,
		);
		expect(container).toBeEmptyDOMElement();
	});

	it("renders nothing for idle state regardless of uploadProgress value", () => {
		const { container } = render(
			<UploadProgressBar uploadState="idle" uploadProgress={75} />,
		);
		expect(container).toBeEmptyDOMElement();
	});

	// ---- Uploading state ----

	describe("uploading state", () => {
		it("shows the 'Uploading...' label", () => {
			render(<UploadProgressBar uploadState="uploading" uploadProgress={40} />);
			expect(screen.getByText("Uploading...")).toBeInTheDocument();
		});

		it("displays the rounded percentage", () => {
			render(
				<UploadProgressBar uploadState="uploading" uploadProgress={42.7} />,
			);
			expect(screen.getByText("43%")).toBeInTheDocument();
		});

		it("rounds down when appropriate", () => {
			render(
				<UploadProgressBar uploadState="uploading" uploadProgress={42.2} />,
			);
			expect(screen.getByText("42%")).toBeInTheDocument();
		});

		it("sets the progress bar fill width to match uploadProgress", () => {
			const { container } = render(
				<UploadProgressBar uploadState="uploading" uploadProgress={65} />,
			);
			const fill = container.querySelector(".bg-blue-500") as HTMLElement;
			expect(fill).toHaveStyle({ width: "65%" });
		});

		it("handles 0% progress", () => {
			render(<UploadProgressBar uploadState="uploading" uploadProgress={0} />);
			expect(screen.getByText("0%")).toBeInTheDocument();
		});

		it("handles 100% progress", () => {
			render(
				<UploadProgressBar uploadState="uploading" uploadProgress={100} />,
			);
			expect(screen.getByText("100%")).toBeInTheDocument();
		});

		it("does not show the complete message while uploading", () => {
			render(<UploadProgressBar uploadState="uploading" uploadProgress={50} />);
			expect(screen.queryByText("Upload complete!")).not.toBeInTheDocument();
		});
	});

	// ---- Complete state ----

	describe("complete state", () => {
		it("shows the 'Upload complete!' message and icon", () => {
			render(<UploadProgressBar uploadState="complete" uploadProgress={100} />);
			expect(screen.getByText("Upload complete!")).toBeInTheDocument();
			expect(screen.getByTestId("icon-checkcircle2")).toBeInTheDocument();
		});

		it("does not show the uploading progress UI while complete", () => {
			render(<UploadProgressBar uploadState="complete" uploadProgress={100} />);
			expect(screen.queryByText("Uploading...")).not.toBeInTheDocument();
			expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
		});
	});

	// ---- className merging ----

	it("merges a custom className with the default classes", () => {
		const { container } = render(
			<UploadProgressBar
				uploadState="uploading"
				uploadProgress={10}
				className="custom-class"
			/>,
		);
		const root = container.firstChild as HTMLElement;
		expect(root).toHaveClass("w-full", "max-w-md", "mx-auto", "custom-class");
	});
});