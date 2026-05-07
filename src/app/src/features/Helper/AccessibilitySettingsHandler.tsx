import { useTypedSelector } from "app/hooks/useTypedSelector";
import type { RootState } from "app/store/redux";
import type React from "react";
import { useEffect } from "react";

export const AccessibilitySettingsHandler: React.FC = () => {
	const { focusRings } = useTypedSelector(
		(state: RootState) => state.preferences.accessibility,
	);

	useEffect(() => {
		if (focusRings) {
			document.body.classList.add("focus-rings-enabled");
		} else {
			document.body.classList.remove("focus-rings-enabled");
		}
	}, [focusRings]);

	return null;
};
