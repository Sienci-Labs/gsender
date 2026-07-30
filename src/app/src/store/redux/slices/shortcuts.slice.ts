import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ShortcutSliceState } from "app/store/definitions.ts";

const initialState: ShortcutSliceState = {
	isFinished: false,
};

const shortcutsSlice = createSlice({
	name: "gSenderInfo",
	initialState,
	reducers: {
		updateShuttleStatus: (
			state: ShortcutSliceState,
			action: PayloadAction<{ isFinished: boolean }>,
		) => {
			state.isFinished = action.payload.isFinished;
		},
	},
});

export const { updateShuttleStatus } = shortcutsSlice.actions;

export default shortcutsSlice.reducer;
