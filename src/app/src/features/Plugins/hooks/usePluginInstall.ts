import api from "app/api";
import isElectron from "is-electron";
import { useCallback, useEffect, useReducer, useRef } from "react";
import type {
	PluginInstallCommitResponse,
	PluginInstallLogEntry,
	PluginInstallPlan,
	PluginInstallPrepareResponse,
	PluginSourceMode,
} from "../types";

export type InstallStep = "source" | "review" | "installing" | "done" | "error";

type State = {
	step: InstallStep;
	// Set while the native picker is open or a request is in flight.
	busy: boolean;
	sessionId: string | null;
	plan: PluginInstallPlan | null;
	log: PluginInstallLogEntry[];
	error: string | null;
	// Manifest problems get their own list so the review step can show them
	// as a checklist rather than one run-on message.
	manifestErrors: string[];
	// True when an install failed but the previously installed version was
	// successfully restored.
	restored: boolean;
	result: PluginInstallCommitResponse | null;
};

type Action =
	| { type: "reset" }
	| { type: "picking" }
	| { type: "picker-cancelled" }
	| { type: "preparing" }
	| {
			type: "prepared";
			sessionId: string;
			plan: PluginInstallPlan;
			log: PluginInstallLogEntry[];
	  }
	| { type: "installing" }
	| { type: "installed"; result: PluginInstallCommitResponse }
	| {
			type: "failed";
			error: string;
			log?: PluginInstallLogEntry[];
			manifestErrors?: string[];
			// Set when a failed swap put the previous version back.
			restored?: boolean;
	  }
	| { type: "back-to-source" };

const initialState: State = {
	step: "source",
	busy: false,
	sessionId: null,
	plan: null,
	log: [],
	error: null,
	manifestErrors: [],
	restored: false,
	result: null,
};

const reducer = (state: State, action: Action): State => {
	switch (action.type) {
		case "reset":
			return initialState;
		case "picking":
		case "preparing":
			return { ...state, busy: true, error: null, manifestErrors: [] };
		case "picker-cancelled":
			return { ...state, busy: false };
		case "prepared":
			return {
				...state,
				step: "review",
				busy: false,
				sessionId: action.sessionId,
				plan: action.plan,
				log: action.log,
				error: null,
				manifestErrors: [],
			};
		case "installing":
			return { ...state, step: "installing", busy: true, error: null };
		case "installed":
			return {
				...state,
				step: "done",
				busy: false,
				sessionId: null,
				result: action.result,
				log: [...state.log, ...(action.result.log ?? [])],
			};
		case "failed":
			return {
				...state,
				step: "error",
				busy: false,
				// The server drops the staged copy on any failure, so there is
				// no session left to commit or cancel.
				sessionId: null,
				error: action.error,
				manifestErrors: action.manifestErrors ?? [],
				restored: Boolean(action.restored),
				log: [...state.log, ...(action.log ?? [])],
			};
		case "back-to-source":
			return { ...initialState, step: "source" };
		default:
			return state;
	}
};

// Pulls a useful message out of an axios failure. The server sends
// { error } on every install route, so prefer that over the HTTP status.
const messageFromError = (err: unknown, fallback: string): string => {
	const data = (err as { response?: { data?: { error?: string } } })?.response
		?.data;
	if (data?.error) {
		return data.error;
	}
	return err instanceof Error ? err.message : fallback;
};

/**
 * Drives the guided install: pick a source, stage and review it, then commit.
 *
 * The transactional state lives on the server behind `sessionId` — this hook
 * only tracks which step is on screen.
 */
export const usePluginInstall = ({
	onInstalled,
}: {
	onInstalled?: () => void;
} = {}) => {
	const [state, dispatch] = useReducer(reducer, initialState);

	// Read inside the IPC listener, which is registered once.
	const busyRef = useRef(false);
	busyRef.current = state.busy;

	const prepare = useCallback(async (sourcePath: string) => {
		dispatch({ type: "preparing" });
		try {
			const { data } = await api.plugins.installPrepare(sourcePath);
			const response = data as PluginInstallPrepareResponse;
			dispatch({
				type: "prepared",
				sessionId: response.sessionId as string,
				plan: response.plan as PluginInstallPlan,
				log: response.log ?? [],
			});
		} catch (err) {
			const data = (
				err as { response?: { data?: PluginInstallPrepareResponse } }
			)?.response?.data;
			dispatch({
				type: "failed",
				error: messageFromError(err, "Could not read that plugin"),
				log: data?.log,
				manifestErrors: data?.manifestErrors,
			});
		}
	}, []);

	// The native picker lives in the main process; it always replies, including
	// on cancel, so the wizard never sits waiting on a message that never comes.
	useEffect(() => {
		if (!isElectron()) {
			return;
		}

		const ipcRenderer = (window as unknown as { ipcRenderer?: any })
			.ipcRenderer;
		if (!ipcRenderer) {
			return;
		}

		const onSource = (
			_event: unknown,
			payload: { path?: string; canceled?: boolean; error?: string },
		) => {
			if (!busyRef.current) {
				return;
			}
			if (payload?.canceled) {
				dispatch({ type: "picker-cancelled" });
				return;
			}
			if (payload?.error || !payload?.path) {
				dispatch({
					type: "failed",
					error: payload?.error || "Could not open the file picker",
				});
				return;
			}
			prepare(payload.path);
		};

		ipcRenderer.on("returned-plugin-source", onSource);
		return () => {
			ipcRenderer.removeListener?.("returned-plugin-source", onSource);
		};
	}, [prepare]);

	const chooseSource = useCallback((mode: PluginSourceMode) => {
		if (!isElectron()) {
			dispatch({
				type: "failed",
				error:
					"Installing plugins from a file needs the gSender desktop app. Copy the plugin folder into the plugins directory instead.",
			});
			return;
		}
		dispatch({ type: "picking" });
		(window as unknown as { ipcRenderer?: any }).ipcRenderer?.send(
			"open-plugin-source-dialog",
			mode,
		);
	}, []);

	const install = useCallback(async () => {
		if (!state.sessionId) {
			return;
		}
		dispatch({ type: "installing" });
		try {
			const { data } = await api.plugins.installCommit(state.sessionId);
			dispatch({
				type: "installed",
				result: data as PluginInstallCommitResponse,
			});
			onInstalled?.();
		} catch (err) {
			const data = (
				err as { response?: { data?: PluginInstallCommitResponse } }
			)?.response?.data;
			dispatch({
				type: "failed",
				error: messageFromError(err, "The install did not complete"),
				log: data?.log,
				restored: data?.restored,
			});
			// A failed commit still changes what is on disk in the rollback
			// case, so let the caller refresh either way.
			onInstalled?.();
		}
	}, [state.sessionId, onInstalled]);

	// Drop the staged copy when the user backs out or closes the wizard.
	const discard = useCallback(() => {
		if (state.sessionId) {
			api.plugins.installCancel(state.sessionId).catch(() => {
				// Best effort: the server sweeps abandoned staging anyway.
			});
		}
	}, [state.sessionId]);

	const startOver = useCallback(() => {
		discard();
		dispatch({ type: "back-to-source" });
	}, [discard]);

	const reset = useCallback(() => {
		discard();
		dispatch({ type: "reset" });
	}, [discard]);

	return {
		...state,
		chooseSource,
		prepare,
		install,
		startOver,
		reset,
		discard,
	};
};
