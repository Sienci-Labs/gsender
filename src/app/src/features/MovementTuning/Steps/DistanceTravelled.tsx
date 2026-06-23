import { Button } from "app/components/Button";
import { ControlledInput } from "app/components/ControlledInput";
import { useWorkspaceState } from "app/hooks/useWorkspaceState";
import { FaClipboardCheck, FaClipboardList } from "react-icons/fa";
import { useMovementTuning } from "../utils/MovementTuningContext";

interface Props {
	onComplete: () => void;
}

const DistanceTravelled = ({ onComplete }: Props) => {
	const {
		setTravelCompleted,
		setSetTravelCompleted,
		measuredDistance,
		setMeasuredDistance,
	} = useMovementTuning();
	const { units } = useWorkspaceState();

	return (
		<div className="flex flex-col gap-4">
			<div className="space-y-1">
				<p className="h-20 dark:text-white">
					Lastly, measure the distance travelled between the original mark and
					the current gantry location. Take your time when entering this value,
					a more accurate measurement will give you better tuning results.
				</p>
			</div>

			<div className="space-y-6">
				<div
					className={`flex w-[450px] items-center gap-4 p-4 rounded-lg transition-colors ${
						setTravelCompleted
							? "bg-green-50 border border-green-200 bg-opacity-30"
							: "bg-blue-50 border border-blue-200 bg-opacity-40"
					}`}
				>
					<div className={`min-w-8 min-h-8 text-white`}>
						{setTravelCompleted ? (
							<FaClipboardCheck className="min-w-8 min-h-8 text-green-500 " />
						) : (
							<FaClipboardList className="min-w-8 min-h-8 text-blue-500 " />
						)}
					</div>
					<div className="flex flex-col gap-2 flex-1">
						<div className="flex items-center gap-4">
							<Button
								// disabled={setTravelCompleted}
								onClick={() => {
									setSetTravelCompleted(true);
									onComplete();
								}}
							>
								Set Distance Travelled
							</Button>

							<div className="flex items-center gap-2">
								<ControlledInput
									type="number"
									value={measuredDistance}
									onChange={(e) => setMeasuredDistance(Number(e.target.value))}
									className="w-28"
									suffix={units ?? "mm"}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default DistanceTravelled;
