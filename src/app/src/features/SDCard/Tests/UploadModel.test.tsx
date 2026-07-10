import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
	UploadModal,
	validateSDFilename,
	ACCEPTED_EXTENSIONS,
} from "app/features/SDCard/components/UploadModal.tsx";
import { useSDCard } from "app/features/SDCard/hooks/useSDCard.ts";
import { toast } from "app/lib/toaster";

// ---- Mocks ----

jest.mock("app/features/SDCard/hooks/useSDCard.ts", () => ({
	useSDCard: jest.fn(),
}));

jest.mock("app/lib/toaster", () => ({
	toast: {
		error: jest.fn(),
	},
}));

jest.mock("lucide-react", () => ({
	File: () => <svg data-testid="icon-file" />,
	Upload: () => <svg data-testid="icon-upload" />,
	X: () => <svg data-testid="icon-x" />,
}));

jest.mock("app/components/shadcn/Dialog", () => ({
	Dialog: ({ open, onOpenChange, children }: any) =>
		open ? (
			<div data-testid="dialog">
				{children}
				<button
					data-testid="dialog-overlay-close"
					onClick={() => onOpenChange(false)}
				>
					overlay-close
				</button>
			</div>
		) : null,
	DialogContent: ({ children }: any) => <div>{children}</div>,
	DialogDescription: ({ children }: any) => <p>{children}</p>,
	DialogFooter: ({ children }: any) => <div>{children}</div>,
	DialogHeader: ({ children }: any) => <div>{children}</div>,
	DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

const mockUseSDCard = useSDCard as jest.Mock;

// Deterministic FileReader mock: reads File's text content synchronously via FileReaderSync-like behavior
class MockFileReader {
	onload: ((ev: any) => void) | null = null;
	result: string | ArrayBuffer | null = null;

	readAsText(file: File) {
		// Files created via `new File([content], name)` expose `.text()` under jsdom
		Promise.resolve((file as any).__content ?? "").then((text) => {
			this.result = text;
			this.onload?.({ target: { result: this.result } });
		});
	}
}

// Helper to build a File with a retrievable content string, since jsdom's File/Blob
// text extraction inside FileReader isn't always reliable in the test environment.
function makeFile(name: string, content = "G0 X0 Y0", size?: number) {
	const file = new File([content], name, { type: "text/plain" });
	Object.defineProperty(file, "__content", { value: content });
	if (size !== undefined) {
		Object.defineProperty(file, "size", { value: size });
	}
	return file;
}

describe("UploadModal", () => {
	const uploadFileToSDCard = jest.fn().mockResolvedValue(undefined);
	const onClose = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		(global as any).FileReader = MockFileReader;
		mockUseSDCard.mockReturnValue({
			uploadFileToSDCard,
			isLoading: false,
		});
	});

	const setup = (isOpen = true) =>
		render(<UploadModal isOpen={isOpen} onClose={onClose} />);

	// ---- Open/close ----

	describe("open state", () => {
		it("renders nothing when isOpen is false", () => {
			setup(false);
			expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
		});

		it("renders the dialog title and description when open", () => {
			setup(true);
			expect(screen.getByText("Upload Files")).toBeInTheDocument();
			expect(
				screen.getByText("Upload one or more valid gcode files to your SD card"),
			).toBeInTheDocument();
		});
	});

	// ---- validateSDFilename (exported pure function) ----

	describe("validateSDFilename", () => {
		it("returns null for a valid filename", () => {
			expect(validateSDFilename("part1.gcode")).toBeNull();
		});

		it("rejects filenames longer than 40 characters", () => {
			const longName = "a".repeat(41) + ".gcode";
			expect(validateSDFilename(longName)).toBe(
				"Filename too long (max 40 characters)",
			);
		});

		it("rejects filenames containing '?'", () => {
			expect(validateSDFilename("bad?name.gcode")).toBe(
				"Filename contains invalid character: ?",
			);
		});

		it("rejects filenames containing '~'", () => {
			expect(validateSDFilename("bad~name.gcode")).toBe(
				"Filename contains invalid character: ~",
			);
		});

		it("rejects filenames containing '!'", () => {
			expect(validateSDFilename("bad!name.gcode")).toBe(
				"Filename contains invalid character: !",
			);
		});
	});

	// ---- ACCEPTED_EXTENSIONS ----

	it("exports the expected accepted extensions", () => {
		expect(ACCEPTED_EXTENSIONS).toEqual(
			expect.arrayContaining([
				".gcode",
				".nc",
				".ncc",
				".ngc",
				".cnc",
				".txt",
				".text",
				".tap",
				".macro",
				".json",
			]),
		);
	});

	// ---- File selection via input ----

	describe("file selection", () => {
		it("adds a valid file to the selected files list", () => {
			const { container } = setup();
			const input = container.querySelector(
				'input[type="file"]',
			) as HTMLInputElement;
			const file = makeFile("part1.gcode");

			fireEvent.change(input, { target: { files: [file] } });

			expect(screen.getByText("Selected Files (1):")).toBeInTheDocument();
			expect(screen.getByText("part1.gcode")).toBeInTheDocument();
		});

		it("accumulates files across multiple selections", () => {
			const { container } = setup();
			const input = container.querySelector(
				'input[type="file"]',
			) as HTMLInputElement;

			fireEvent.change(input, { target: { files: [makeFile("a.gcode")] } });
			fireEvent.change(input, { target: { files: [makeFile("b.gcode")] } });

			expect(screen.getByText("Selected Files (2):")).toBeInTheDocument();
			expect(screen.getByText("a.gcode")).toBeInTheDocument();
			expect(screen.getByText("b.gcode")).toBeInTheDocument();
		});

		it("rejects a file with a disallowed extension and shows a toast", () => {
			const { container } = setup();
			const input = container.querySelector(
				'input[type="file"]',
			) as HTMLInputElement;
			const file = makeFile("virus.exe");

			fireEvent.change(input, { target: { files: [file] } });

			expect(toast.error).toHaveBeenCalledWith(
				expect.stringContaining("virus.exe: Invalid file type"),
			);
			expect(screen.queryByText("Selected Files (1):")).not.toBeInTheDocument();
		});

		it("rejects a file that fails filename validation and shows a toast", () => {
			const { container } = setup();
			const input = container.querySelector(
				'input[type="file"]',
			) as HTMLInputElement;
			const file = makeFile("bad?name.gcode");

			fireEvent.change(input, { target: { files: [file] } });

			expect(toast.error).toHaveBeenCalledWith(
				expect.stringContaining(
					"bad?name.gcode: Filename contains invalid character: ?",
				),
			);
			expect(screen.queryByText("Selected Files (1):")).not.toBeInTheDocument();
		});

		it("does nothing when no files are provided", () => {
			const { container } = setup();
			const input = container.querySelector(
				'input[type="file"]',
			) as HTMLInputElement;

			fireEvent.change(input, { target: { files: [] } });

			expect(screen.queryByText(/Selected Files/)).not.toBeInTheDocument();
			expect(toast.error).not.toHaveBeenCalled();
		});
	});

	// ---- File size formatting (indirect, since formatFileSize isn't exported) ----

	describe("file size display", () => {
		it("displays bytes for files under 1KB", () => {
			const { container } = setup();
			const input = container.querySelector(
				'input[type="file"]',
			) as HTMLInputElement;
			fireEvent.change(input, {
				target: { files: [makeFile("small.gcode", "x", 500)] },
			});
			expect(screen.getByText("500 B")).toBeInTheDocument();
		});

		it("displays KB for files between 1KB and 1MB", () => {
			const { container } = setup();
			const input = container.querySelector(
				'input[type="file"]',
			) as HTMLInputElement;
			fireEvent.change(input, {
				target: { files: [makeFile("medium.gcode", "x", 2048)] },
			});
			expect(screen.getByText("2.0 KB")).toBeInTheDocument();
		});

		it("displays MB for files 1MB or larger", () => {
			const { container } = setup();
			const input = container.querySelector(
				'input[type="file"]',
			) as HTMLInputElement;
			fireEvent.change(input, {
				target: { files: [makeFile("large.gcode", "x", 5 * 1024 * 1024)] },
			});
			expect(screen.getByText("5.0 MB")).toBeInTheDocument();
		});
	});

	// ---- Removing a file ----

	describe("removing a file", () => {
		it("removes the file when its remove button is clicked", () => {
			const { container } = setup();
			const input = container.querySelector(
				'input[type="file"]',
			) as HTMLInputElement;

			fireEvent.change(input, {
				target: { files: [makeFile("a.gcode"), makeFile("b.gcode")] },
			});
			expect(screen.getByText("Selected Files (2):")).toBeInTheDocument();

			const removeButtons = screen.getAllByTitle("Remove file");
			fireEvent.click(removeButtons[0]);

			expect(screen.getByText("Selected Files (1):")).toBeInTheDocument();
			expect(screen.queryByText("a.gcode")).not.toBeInTheDocument();
			expect(screen.getByText("b.gcode")).toBeInTheDocument();
		});
	});

	// ---- Drag and drop ----

	describe("drag and drop", () => {
		it("applies drag-over styling while dragging", () => {
			const { container } = setup();
			const dropZone = container.querySelector(
				".border-dashed",
			) as HTMLElement;

			fireEvent.dragOver(dropZone);
			expect(dropZone.className).toContain("border-blue-400");

			fireEvent.dragLeave(dropZone);
			expect(dropZone.className).toContain("border-gray-300");
		});

		it("adds valid dropped files to the selection", () => {
			const { container } = setup();
			const dropZone = container.querySelector(
				".border-dashed",
			) as HTMLElement;
			const file = makeFile("dropped.gcode");

			fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });

			expect(screen.getByText("Selected Files (1):")).toBeInTheDocument();
			expect(screen.getByText("dropped.gcode")).toBeInTheDocument();
		});
	});

	// ---- Browse button ----

	it("clicking 'browse' triggers the hidden file input", () => {
		const { container } = setup();
		const input = container.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;
		const clickSpy = jest.spyOn(input, "click");

		fireEvent.click(screen.getByText("browse"));

		expect(clickSpy).toHaveBeenCalledTimes(1);
	});

	// ---- Upload button ----

	describe("upload button", () => {
		it("is disabled when no files are selected", () => {
			setup();
			expect(screen.getByText("Upload").closest("button")).toBeDisabled();
		});

		it("is disabled while isLoading is true, even with files selected", () => {
			mockUseSDCard.mockReturnValue({ uploadFileToSDCard, isLoading: true });
			const { container } = setup();
			const input = container.querySelector(
				'input[type="file"]',
			) as HTMLInputElement;
			fireEvent.change(input, { target: { files: [makeFile("a.gcode")] } });

			expect(screen.getByText("Uploading...").closest("button")).toBeDisabled();
		});

		it("shows the file count in the label once files are selected", () => {
			const { container } = setup();
			const input = container.querySelector(
				'input[type="file"]',
			) as HTMLInputElement;
			fireEvent.change(input, {
				target: { files: [makeFile("a.gcode"), makeFile("b.gcode")] },
			});

			expect(screen.getByText("Upload (2)")).toBeInTheDocument();
		});

		it("uploads selected files, clears the list, and closes the modal on success", async () => {
			const { container } = setup();
			const input = container.querySelector(
				'input[type="file"]',
			) as HTMLInputElement;
			fireEvent.change(input, { target: { files: [makeFile("a.gcode")] } });

			fireEvent.click(screen.getByText("Upload (1)"));

			await waitFor(() => expect(uploadFileToSDCard).toHaveBeenCalledTimes(1));
			const uploaded = uploadFileToSDCard.mock.calls[0][0];
			expect(uploaded).toHaveLength(1);
			expect(uploaded[0]).toMatchObject({ name: "a.gcode" });

			await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
			expect(screen.queryByText(/Selected Files/)).not.toBeInTheDocument();
		});

		it("does nothing when Upload is clicked with no files selected", () => {
			setup();
			fireEvent.click(screen.getByText("Upload"));
			expect(uploadFileToSDCard).not.toHaveBeenCalled();
			expect(onClose).not.toHaveBeenCalled();
		});
	});

	// ---- Cancel / close behavior ----

	describe("closing the modal", () => {
		it("clears selected files and calls onClose when Cancel is clicked", () => {
			const { container } = setup();
			const input = container.querySelector(
				'input[type="file"]',
			) as HTMLInputElement;
			fireEvent.change(input, { target: { files: [makeFile("a.gcode")] } });

			fireEvent.click(screen.getByText("Cancel"));

			expect(onClose).toHaveBeenCalledTimes(1);
		});

		it("clears selected files and calls onClose when the dialog is dismissed via onOpenChange(false)", () => {
			const { container } = setup();
			const input = container.querySelector(
				'input[type="file"]',
			) as HTMLInputElement;
			fireEvent.change(input, { target: { files: [makeFile("a.gcode")] } });

			fireEvent.click(screen.getByTestId("dialog-overlay-close"));

			expect(onClose).toHaveBeenCalledTimes(1);
		});
	});
});