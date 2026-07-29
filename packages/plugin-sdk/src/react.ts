import {
	useCallback,
	useEffect,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";

import {
	getTopicSnapshot,
	type PluginBridgeTopic,
	subscribeTopic,
	type ViewerPickEvent,
} from "./bridge.js";
import { gsender } from "./index.js";

// --- React hooks --------------------------------------------------------------
// These run in the plugin's OWN React. They mirror gSender's `useWorkspaceState`
// and `useTypedSelector` by subscribing to snapshots pushed across the bridge.

const useTopicSnapshot = <T>(topic: PluginBridgeTopic): T | undefined => {
	const subscribe = useCallback(
		(notify: () => void) => subscribeTopic(topic, notify),
		[topic],
	);

	const getSnapshot = useCallback(
		() => getTopicSnapshot<T>(topic),
		[topic],
	);

	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

/**
 * Live gSender workspace state (units, machine profile, tools, etc.).
 * Mirrors the host `useWorkspaceState` hook.
 */
export const useWorkspaceState = <T = unknown>(): T | undefined =>
	useTopicSnapshot<T>("workspace");

/**
 * Select a slice of gSender's redux state, re-rendering when it changes.
 * Mirrors the host `useTypedSelector` hook.
 *
 * @param selector Derives the value you care about from the root redux state.
 * @param equalityFn Optional; skip re-renders when the selected value is "equal".
 */
export const useTypedSelector = <Selected, State = unknown>(
	selector: (state: State) => Selected,
	equalityFn?: (a: Selected, b: Selected) => boolean,
): Selected | undefined => {
	const root = useTopicSnapshot<State>("redux");
	const lastSelected = useRef<{ value: Selected } | null>(null);

	if (root === undefined) {
		return undefined;
	}

	const nextSelected = selector(root);

	if (lastSelected.current) {
		const prev = lastSelected.current.value;
		const isSame = equalityFn
			? equalityFn(prev, nextSelected)
			: prev === nextSelected;
		if (isSame) {
			return prev;
		}
	}

	lastSelected.current = { value: nextSelected };
	return nextSelected;
};

/**
 * Arm point-picking on the host visualizer for the lifetime of the component.
 *
 * Arms on mount (unless `opts.enabled === false`) and disarms on unmount or when
 * disabled. The latest `handler` is kept in a ref, so re-renders that only change
 * the handler don't re-arm the pick.
 *
 * @param mode `'click'` (single click) or `'hold'` (press-and-hold, which also
 *   emits `hold-progress` events).
 * @param handler Called with each `ViewerPickEvent` while armed.
 * @param opts.enabled Set `false` to keep the pick disarmed (default `true`).
 * @returns `armed` (whether the host accepted the arm) and `error` (the host's
 *   rejection message, or `null`).
 */
export const useVisualizerPick = (
	mode: "click" | "hold",
	handler: (e: ViewerPickEvent) => void,
	opts?: { enabled?: boolean },
): { armed: boolean; error: string | null } => {
	const enabled = opts?.enabled !== false;

	const [armed, setArmed] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Keep the latest handler without re-arming when it changes.
	const handlerRef = useRef(handler);
	handlerRef.current = handler;

	useEffect(() => {
		if (!enabled) {
			return;
		}

		let cancelled = false;
		let dispose: (() => void) | null = null;

		gsender.viewer
			.armPick(mode, (event) => handlerRef.current(event))
			.then((disposer) => {
				if (cancelled) {
					// Unmounted/disabled before arming resolved — tear down now.
					disposer();
					return;
				}
				dispose = disposer;
				setArmed(true);
				setError(null);
			})
			.catch((err: unknown) => {
				if (cancelled) {
					return;
				}
				setArmed(false);
				setError(err instanceof Error ? err.message : String(err));
			});

		return () => {
			cancelled = true;
			setArmed(false);
			dispose?.();
		};
	}, [mode, enabled]);

	return { armed, error };
};
