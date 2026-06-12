/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
/** biome-ignore-all lint/a11y/noLabelWithoutControl: <> */
import { GRBL_ACTIVE_STATE_IDLE, GRBL_ACTIVE_STATE_JOG } from "app/constants";
import { useTypedSelector } from "app/hooks/useTypedSelector";
import { useWorkspaceState } from "app/hooks/useWorkspaceState";
import { useContext, useEffect } from "react";
import Select from "react-select";
import { MovementTuningContext } from "../utils/MovementTuningContext";

interface Props {
	onComplete: () => void;
}

const AxisSelection = ({ onComplete }: Props) => {
	const {
		selectedAxis,
		setSelectedAxis,
		setMoveDistance,
		setMeasuredDistance,
	} = useContext(MovementTuningContext);
	const { units } = useWorkspaceState();
	const isConnected = useTypedSelector((state) => state.connection.isConnected);
	const controllerStatus = useTypedSelector(
		(state) => state?.controller.state?.status,
	);

	const isDisabled =
		!isConnected ||
		(controllerStatus?.activeState !== GRBL_ACTIVE_STATE_IDLE &&
			controllerStatus?.activeState !== GRBL_ACTIVE_STATE_JOG);

	useEffect(() => {
		if (!isDisabled) {
			onComplete();
		}
	}, [isDisabled]);

	return (
		<div className="flex flex-col gap-4 xl:gap-0">
			{/* <div className="max-w-7xl w-full grid gap-4 grid-cols-1 lg:grid-cols-[3fr_2fr]"> */}
			<div className="space-y-12 text-sm xl:text-base font-normal">
				<p className="font-bold">
					Whichever axis you'll be tuning, please place it in an initial
					location so that it'll have space to move to the right (for X),
					backwards (for Y), and downwards (for Z).
				</p>

				<div className="flex gap-2 items-center">
					<label className="min-w-24 font-bold dark:text-white">
						Axis to Tune
					</label>
					<Select
						options={[
							{
								label: "X-Axis",
								value: "x",
							},
							{
								label: "Y-Axis",
								value: "y",
							},
							{
								label: "Z-Axis",
								value: "z",
							},
						]}
						onChange={(data: { label: string; value: typeof selectedAxis }) => {
							setSelectedAxis(data.value);
							if (data.value === "z") {
								setMoveDistance(units === "mm" ? -50 : -2);
								setMeasuredDistance(units === "mm" ? -50 : -2);
							} else {
								setMoveDistance(units === "mm" ? 100 : 4);
								setMeasuredDistance(units === "mm" ? 100 : 4);
							}
						}}
						value={{
							label: `${selectedAxis.toUpperCase()}-Axis`,
							value: selectedAxis,
						}}
						placeholder="Select Axis"
						className="w-full"
					/>
				</div>

				{/* <div className="flex justify-center items-center">
						<div className="w-full max-w-96">
							<Jogging />
						</div>
					</div> */}

				{!isConnected && (
					<div className="text-yellow-800 bg-yellow-100 p-4 xl:p-2 rounded-lg border flex flex-col gap-4 justify-center items-center text-center">
						<p>
							Please connect to a device before starting the movement tuning
							wizard.
						</p>
					</div>
				)}
			</div>
			{/* <div className="flex flex-col gap-4 items-center">
                <img
                    src={starterImage}
                    alt="Movement Tuning Example"
                    className="w-[440px] h-auto border border-gray-200 rounded-lg"
                />

                <p className="text-gray-600 font-bold dark:text-white">
                    Whichever axis you'll be tuning, please place it in an initial
                    location so that it'll have space to move to the right (for X),
                    backwards (for Y), and downwards (for Z).
                </p>
            </div> */}
			{/* </div> */}

			{/* <div className="flex gap-4 shrink-0">
            <Button
                onClick={() => setStatus("started")}
                variant="outline"
                disabled={isDisabled}
            >
                Start Movement Tuning
            </Button>
        </div> */}
		</div>
	);
};

export default AxisSelection;
