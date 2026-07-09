import { useCallback, useRef, useSyncExternalStore } from "react";

import {
	getTopicSnapshot,
	type PluginBridgeTopic,
	subscribeTopic,
} from "./bridge.js";

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
