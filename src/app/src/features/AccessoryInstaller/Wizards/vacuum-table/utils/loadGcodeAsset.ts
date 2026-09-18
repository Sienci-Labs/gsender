import { VISUALIZER_PRIMARY } from "app/constants";
import controller from "app/lib/controller";
import { uploadGcodeFileToServer } from "app/lib/fileupload";

export async function loadBundledGcodeToVisualizer(
	assetUrl: string,
	name: string,
) {
	const response = await fetch(assetUrl);
	const gcode = await response.text();
	const file = new File([gcode], name);
	await uploadGcodeFileToServer(file, controller.port, VISUALIZER_PRIMARY);
}
