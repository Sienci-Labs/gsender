/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import cx from "classnames";
import pubsub from "pubsub-js";
import { useEffect, useRef, useState } from "react";
import GcodeEditor from "./GcodeEditor";

/**
 * Fade-in/out wrapper for the gcode editor, toggled via the
 * `gcode-editor:toggle` pubsub. Extracted from the old PrimaryVisualizer so the
 * connected container can stay a class component.
 */
const GcodeEditorOverlay = () => {
	const [showEditor, setShowEditor] = useState(false);
	const [isEditorMounted, setIsEditorMounted] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		const token = pubsub.subscribe("gcode-editor:toggle", (_, isVisible) => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}

			if (isVisible) {
				setIsEditorMounted(true);
				timeoutRef.current = setTimeout(() => {
					setShowEditor(true);
					timeoutRef.current = null;
				}, 10);
			} else {
				setShowEditor(false);
				timeoutRef.current = setTimeout(() => {
					setIsEditorMounted(false);
					timeoutRef.current = null;
				}, 200);
			}
		});

		return () => {
			pubsub.unsubscribe(token);
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	if (!isEditorMounted) {
		return null;
	}

	return (
		<div
			className={cx(
				"absolute top-0 left-0 right-0 bottom-0 z-[10000] flex items-center justify-center p-4 rounded-md transition-opacity duration-200 ease-in-out",
				{
					"opacity-0 pointer-events-none bg-transparent": !showEditor,
					"opacity-100 bg-black bg-opacity-50": showEditor,
				},
			)}
		>
			<div
				className={cx(
					"w-full h-full max-w-6xl max-h-[95%] self-start transition-all duration-200 ease-in-out portrait:max-h-[85%]",
					{
						"scale-95 opacity-0": !showEditor,
						"scale-100 opacity-100": showEditor,
					},
				)}
			>
				<GcodeEditor
					onClose={() => {
						pubsub.publish("gcode-editor:toggle", false);
					}}
				/>
			</div>
		</div>
	);
};

export default GcodeEditorOverlay;
