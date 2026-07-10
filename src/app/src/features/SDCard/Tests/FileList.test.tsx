import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
	FileList,
	isFileATCIRelated,
} from "app/features/SDCard/components/FileList.tsx";
import { Confirm } from "app/components/ConfirmationDialog/ConfirmationDialogLib.ts";
import { validateSDFilename } from "app/features/SDCard/components/UploadModal.tsx";
import controller from "app/lib/controller.ts";
import { toast } from "app/lib/toaster";
import store from "app/store";
import reduxStore from "app/store/redux";
import { clearSDCardFiles } from "app/store/redux/slices/controller.slice.ts";
import { useSDCard } from "app/features/SDCard/hooks/useSDCard.ts";

// ---- Mocks ----

jest.mock("app/components/ConfirmationDialog/ConfirmationDialogLib.ts", () => ({
	Confirm: jest.fn(),
}));

jest.mock("app/components/shadcn/Table", () => ({
	Table: ({ children }: any) => <table>{children}</table>,
	TableBody: ({ children }: any) => <tbody>{children}</tbody>,
	TableCell: ({ children, className }: any) => (
		<td className={className}>{children}</td>
	),
	TableHead: ({ children, className }: any) => (
		<th className={className}>{children}</th>
	),
	TableHeader: ({ children }: any) => <thead>{children}</thead>,
	TableRow: ({ children, className }: any) => (
		<tr className={className}>{children}</tr>
	),
}));

jest.mock("app/features/SDCard/components/UploadModal.tsx", () => ({
	ACCEPTED_EXTENSIONS: [
		".gcode",
		".nc",
		".macro",
		".ncc",
		".ngc",
		".cnc",
		".txt",
		".text",
		".tap",
		".json",
	],
	validateSDFilename: jest.fn(),
}));

jest.mock("app/lib/controller.ts", () => ({
	__esModule: true,
	default: {
		command: jest.fn(),
	},
}));

jest.mock("app/lib/toaster", () => ({
	toast: {
		error: jest.fn(),
		success: jest.fn(),
	},
}));

jest.mock("app/store", () => ({
	__esModule: true,
	default: {
		get: jest.fn(),
	},
}));

jest.mock("app/store/redux", () => ({
	__esModule: true,
	default: {
		dispatch: jest.fn(),
	},
}));

jest.mock("app/store/redux/slices/controller.slice.ts", () => ({
	clearSDCardFiles: jest.fn((payload) => ({
		type: "clearSDCardFiles",
		payload,
	})),
}));

// Mocked via alias; FileList.tsx imports the same file with a relative path
jest.mock("app/features/SDCard/hooks/useSDCard.ts", () => ({
	useSDCard: jest.fn(),
}));

const mockUseSDCard = useSDCard as jest.Mock;
const mockValidateSDFilename = validateSDFilename as jest.Mock;
const mockStoreGet = store.get as jest.Mock;
const mockConfirm = Confirm as jest.Mock;

describe("FileList", () => {
	const runSDFile = jest.fn();
	const uploadFileToSDCard = jest.fn().mockResolvedValue(undefined);

	const baseFile = (overrides = {}) => ({
		name: "part1.gcode",
		size: 500,
		unusable: false,
		...overrides,
	});

	const setup = (overrides = {}) => {
		mockUseSDCard.mockReturnValue({
			files: [],
			isLoading: false,
			runSDFile,
			uploadFileToSDCard,
			isConnected: true,
			isRunningSDFile: false,
			firmwareType: "grblHAL",
			hasFTP: true,
			hasYM: false,
			isWorkflowIdle: true,
			...overrides,
		});
		return render(<FileList />);
	};

	beforeEach(() => {
		jest.clearAllMocks();
		mockStoreGet.mockReturnValue({});
		mockValidateSDFilename.mockReturnValue(null);
	});

	// ---- Guard clauses ----

	describe("guard states", () => {
		it("shows connection message when not connected", () => {
			setup({ isConnected: false });
			expect(
				screen.getByText("Must be connected to use SD card functionality."),
			).toBeInTheDocument();
		});

		it("shows grblHAL-only message when firmware is not grblHAL", () => {
			setup({ firmwareType: "grbl" });
			expect(
				screen.getByText("SD card tools are only available for grblHAL devices."),
			).toBeInTheDocument();
		});

		it("shows enable FTP/YMODEM message when neither is available", () => {
			setup({ hasFTP: false, hasYM: false });
			expect(
				screen.getByText("Enable FTP or YMODEM in firmware to use SD card tools."),
			).toBeInTheDocument();
		});

		it("does not show the FTP/YMODEM message when hasYM is true", () => {
			setup({ hasFTP: false, hasYM: true, files: [baseFile()] });
			expect(
				screen.queryByText("Enable FTP or YMODEM in firmware to use SD card tools."),
			).not.toBeInTheDocument();
		});

		it("shows empty state when there are no files", () => {
			setup({ files: [] });
			expect(screen.getByText("No files found")).toBeInTheDocument();
			expect(
				screen.getByText("Upload files or refresh to see SD card contents"),
			).toBeInTheDocument();
		});
	});

	// ---- Rendering file rows ----

	describe("file list rendering", () => {
		it("renders the file count header", () => {
			setup({ files: [baseFile({ name: "a.gcode" }), baseFile({ name: "b.gcode" })] });
			expect(screen.getByText("Files (2)")).toBeInTheDocument();
		});

		it("renders each file's name", () => {
			setup({ files: [baseFile({ name: "job.nc" })] });
			expect(screen.getByText("job.nc")).toBeInTheDocument();
		});

		it.each([
			[500, "500 B"],
			[2048, "2.0 KB"],
			[5 * 1024 * 1024, "5.0 MB"],
			[3 * 1024 * 1024 * 1024, "3.0 GB"],
		])("formats file size %d bytes as %s", (size, expected) => {
			setup({ files: [baseFile({ size })] });
			expect(screen.getByText(expected)).toBeInTheDocument();
		});

		it("marks a file as unusable and shows the reason as a title attribute", () => {
			mockValidateSDFilename.mockReturnValue("Filename contains illegal characters");
			setup({ files: [baseFile({ name: "bad name.gcode", unusable: true })] });
			const badge = screen.getByText("Unusable");
			expect(badge).toHaveAttribute(
				"title",
				"Filename contains illegal characters",
			);
		});

		it("falls back to a generic unusable reason when validateSDFilename returns null", () => {
			mockValidateSDFilename.mockReturnValue(null);
			setup({ files: [baseFile({ name: "weird.gcode", unusable: true })] });
			const badge = screen.getByText("Unusable");
			expect(badge).toHaveAttribute(
				"title",
				"File flagged as unusable by firmware",
			);
		});

		it("labels ATC macro files", () => {
			setup({ files: [baseFile({ name: "P100.macro" })] });
			expect(screen.getByText("ATC Macro")).toBeInTheDocument();
		});

		it("does not label a normal gcode file as an ATC macro", () => {
			setup({ files: [baseFile({ name: "part1.gcode" })] });
			expect(screen.queryByText("ATC Macro")).not.toBeInTheDocument();
		});
	});

	// ---- isFileATCIRelated (exported pure function) ----

	describe("isFileATCIRelated", () => {
		it("returns true for ATCI.macro", () => {
			expect(isFileATCIRelated("ATCI.macro", {})).toBe(true);
		});

		it("returns true for P100.macro", () => {
			expect(isFileATCIRelated("P100.macro", {})).toBe(true);
		});

		it("returns true when the filename matches a macro name in atciMacros", () => {
			const macros = { 0: { name: "custom-tool-change.macro" } };
			expect(isFileATCIRelated("custom-tool-change.macro", macros)).toBe(true);
		});

		it("returns false when the filename does not match anything", () => {
			const macros = { 0: { name: "custom-tool-change.macro" } };
			expect(isFileATCIRelated("part1.gcode", macros)).toBe(false);
		});

		it("returns false for an empty atciMacros object and non-special filename", () => {
			expect(isFileATCIRelated("part1.gcode", {})).toBe(false);
		});
	});

	// ---- Run button ----

	describe("Run button", () => {
		it("calls runSDFile with the file name when clicked", () => {
			setup({ files: [baseFile({ name: "job.gcode" })] });
			fireEvent.click(screen.getByText("Run"));
			expect(runSDFile).toHaveBeenCalledWith("job.gcode");
		});

		it("is disabled when isRunningSDFile is true", () => {
			setup({ files: [baseFile()], isRunningSDFile: true });
			expect(screen.getByText("Run").closest("button")).toBeDisabled();
		});

		it("is disabled when isWorkflowIdle is false", () => {
			setup({ files: [baseFile()], isWorkflowIdle: false });
			expect(screen.getByText("Run").closest("button")).toBeDisabled();
		});

		it("is disabled when isLoading is true", () => {
			setup({ files: [baseFile()], isLoading: true });
			expect(screen.getByText("Run").closest("button")).toBeDisabled();
		});

		it("is disabled for ATCI-related files", () => {
			setup({ files: [baseFile({ name: "ATCI.macro" })] });
			expect(screen.getByText("Run").closest("button")).toBeDisabled();
		});

		it("is disabled for unusable files", () => {
			setup({ files: [baseFile({ unusable: true })] });
			expect(screen.getByText("Run").closest("button")).toBeDisabled();
		});

		it("is enabled when none of the disabling conditions apply", () => {
			setup({ files: [baseFile()] });
			expect(screen.getByText("Run").closest("button")).not.toBeDisabled();
		});
	});

	// ---- Delete button ----

	describe("Delete button", () => {
		it("opens a confirmation dialog when clicked", () => {
			setup({ files: [baseFile({ name: "job.gcode" })] });
			fireEvent.click(screen.getByText("Delete"));
			expect(mockConfirm).toHaveBeenCalledTimes(1);
			expect(mockConfirm.mock.calls[0][0]).toMatchObject({
				title: "Delete File",
				content: "Are you sure you want to delete job.gcode?",
			});
		});

		it("deletes the file via controller and dispatches clearSDCardFiles on confirm", () => {
			setup({ files: [baseFile({ name: "job.gcode" })] });
			fireEvent.click(screen.getByText("Delete"));

			const { onConfirm } = mockConfirm.mock.calls[0][0];
			onConfirm();

			expect(controller.command).toHaveBeenCalledWith(
				"sdcard:delete",
				"job.gcode",
			);
			expect(clearSDCardFiles).toHaveBeenCalledWith({ path: "job.gcode" });
			expect(reduxStore.dispatch).toHaveBeenCalled();
		});

		it("is disabled when isRunningSDFile is true", () => {
			setup({ files: [baseFile()], isRunningSDFile: true });
			expect(screen.getByText("Delete").closest("button")).toBeDisabled();
		});

		it("is disabled when isWorkflowIdle is false", () => {
			setup({ files: [baseFile()], isWorkflowIdle: false });
			expect(screen.getByText("Delete").closest("button")).toBeDisabled();
		});

		it("is disabled when isLoading is true", () => {
			setup({ files: [baseFile()], isLoading: true });
			expect(screen.getByText("Delete").closest("button")).toBeDisabled();
		});

		it("is NOT disabled for ATCI or unusable files (only run is restricted)", () => {
			setup({ files: [baseFile({ name: "ATCI.macro", unusable: true })] });
			expect(screen.getByText("Delete").closest("button")).not.toBeDisabled();
		});
	});

	// ---- Drag and drop / file input (empty state) ----

	describe("drag and drop - empty state", () => {
		it("applies drag-over styling while dragging over the empty state", () => {
			const { container } = setup({ files: [] });
			const dropZone = container.querySelector(".flex-1") as HTMLElement;

			fireEvent.dragOver(dropZone);
			expect(dropZone).toHaveClass("border-blue-400", "bg-blue-50");

			fireEvent.dragLeave(dropZone);
			expect(dropZone).toHaveClass("border-gray-300");
		});

		it("rejects files with disallowed extensions on drop and shows a toast", () => {
			const { container } = setup({ files: [] });
			const dropZone = container.querySelector(".flex-1") as HTMLElement;

			const badFile = new File(["content"], "malware.exe", {
				type: "application/octet-stream",
			});

			fireEvent.drop(dropZone, {
				dataTransfer: { files: [badFile] },
			});

			expect(toast.error).toHaveBeenCalledWith(
				expect.stringContaining("malware.exe: Invalid file type"),
			);
			expect(uploadFileToSDCard).not.toHaveBeenCalled();
		});

		it("rejects files that fail filename validation and shows a toast", () => {
			mockValidateSDFilename.mockReturnValue("Filename too long");
			const { container } = setup({ files: [] });
			const dropZone = container.querySelector(".flex-1") as HTMLElement;

			const badFile = new File(["content"], "toolongname.gcode", {
				type: "text/plain",
			});

			fireEvent.drop(dropZone, {
				dataTransfer: { files: [badFile] },
			});

			expect(toast.error).toHaveBeenCalledWith(
				expect.stringContaining("toolongname.gcode: Filename too long"),
			);
			expect(uploadFileToSDCard).not.toHaveBeenCalled();
		});

		it("uploads valid files on drop", async () => {
			const { container } = setup({ files: [] });
			const dropZone = container.querySelector(".flex-1") as HTMLElement;

			const goodFile = new File(["G0 X0 Y0"], "job.gcode", {
				type: "text/plain",
			});

			fireEvent.drop(dropZone, {
				dataTransfer: { files: [goodFile] },
			});

			await waitFor(() => expect(uploadFileToSDCard).toHaveBeenCalledTimes(1));
			const uploadedArg = uploadFileToSDCard.mock.calls[0][0];
			expect(uploadedArg).toHaveLength(1);
			expect(uploadedArg[0]).toMatchObject({ name: "job.gcode" });
		});
	});
});