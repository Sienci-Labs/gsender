/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
/** biome-ignore-all lint/suspicious/noExplicitAny: <todo: we need to add a context bridge to expose the ipcrenderer> */
import Button from "app/components/Button";
import isElectron from "is-electron";
import { useEffect } from "react";
import { FaFolderOpen } from "react-icons/fa";

interface Props {
	value: string;
	index: number;
	onChange: (value: string) => void;
}

const PathSelection = ({ value, onChange }: Props) => {
	useEffect(() => {
		if (isElectron()) {
			(window as any).ipcRenderer.on(
				"returned-directory-dialog-data",
				(_: any, directory: string) => {
					console.log(directory);
					onChange(directory);
				},
			);
		}
	}, []);

	const handleClickLoadFile = () => {
		if (isElectron()) {
			(window as any).ipcRenderer?.send("open-directory-dialog");
		}
	};

	return (
		<div className="flex flex-col w-full justify-stretch items-start gap-2">
			<Button
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
