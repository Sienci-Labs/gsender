/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
/** biome-ignore-all lint/suspicious/noExplicitAny: <todo: we need to add a context bridge to expose the ipcrenderer> */
import Button from "app/components/Button";
import isElectron from "is-electron";
import { useEffect, useRef, useState } from "react";
import { FaFolderOpen } from "react-icons/fa";

interface Props {
	value: string;
	index: number;
	onChange: (value: string) => void;
}

const PathSelection = ({ value, index, onChange }: Props) => {
	const [waiting, setWaiting] = useState(false); // only recieve dialog data if we sent a request
	const waitingRef = useRef(waiting);
	waitingRef.current = waiting;

	useEffect(() => {
		if (!isElectron() || !(window as any).ipcRenderer) {
			return;
		}

		const handleReturnedDirectory = (_: any, directory: string) => {
			if (!waitingRef.current) {
				return;
			}
			setWaiting(false);
			if (directory) {
				onChange(directory);
			}
		};

		(window as any).ipcRenderer.on(
			"returned-directory-dialog-data",
			handleReturnedDirectory,
		);

		return () => {
			(window as any).ipcRenderer.removeListener(
				"returned-directory-dialog-data",
				handleReturnedDirectory,
			);
		};
	}, []);

	const handleClickLoadFile = () => {
		if (isElectron()) {
			setWaiting(true);
			(window as any).ipcRenderer?.send("open-directory-dialog");
		}
	};

	return (
		<div className="flex flex-col w-full justify-stretch items-start gap-2">
			<Button
				id={`${index}`}
				onClick={handleClickLoadFile}
				icon={<FaFolderOpen className="w-5 h-5" />}
				text="Choose Folder"
				variant="secondary"
			/>
			<div className="break-words w-full">{value}</div>
		</div>
	);
};

export default PathSelection;
