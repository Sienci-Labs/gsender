import { Button } from "app/components/Button";
import autoSpinIcon from "app/features/Config/assets/images/autospin.svg";
import controller from "app/lib/controller.ts";
import type { RootState } from "app/store/redux";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";

function startSpindle() {
	controller.command("gcode", "M3 S1000");
}
function startSpindleCCW() {
	controller.command("gcode", "M4 S1000");
}
function stopSpindle() {
	controller.command("gcode", "M5 S0");
}

function AutoSpinIcon() {
	return (
		<img
			src={autoSpinIcon}
			alt="AutoSpin Icon"
			className="h-7 w-7 text-blue-500 fill-blue-500"
		/>
	);
}

export function SpindleWizard() {
	const connected = useSelector(
		(state: RootState) => state.connection.isConnected,
	);
	const navigate = useNavigate();

	return (
		<div className="flex flex-row gap-2 items-center">
			<Button variant="primary" onClick={startSpindle}>
				For
			</Button>
			<Button variant="primary" onClick={startSpindleCCW}>
				Rev
			</Button>
			<Button variant="primary" onClick={stopSpindle}>
				Stop
			</Button>
			|
			<Button
				onClick={() => navigate("/tools/accessoryInstall/autospin/autospin-config")}
				className={"flex flex-row justify-start"}
				disabled={!connected}
			>
				<AutoSpinIcon />
				Setup AutoSpin
			</Button>
		</div>
	);
}
