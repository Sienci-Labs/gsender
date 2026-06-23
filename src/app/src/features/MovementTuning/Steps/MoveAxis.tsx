import { Button } from "app/components/Button";
import { ControlledInput } from "app/components/ControlledInput";
import { jogAxis } from "app/features/Jogging/utils/Jogging";
import { useWorkspaceState } from "app/hooks/useWorkspaceState";
import { FaClipboardCheck, FaClipboardList } from "react-icons/fa";
import { useMovementTuning } from "../utils/MovementTuningContext";

interface Props {
	onComplete: () => void;
}

const MoveAxis = ({ onComplete }: Props) => {
	const {
		moveAxisCompleted,
		setMoveAxisCompleted,
		selectedAxis,
		moveDistance,
		setMoveDistance,
	} = useMovementTuning();
	const { units } = useWorkspaceState();

	return (
		<div className="flex flex-col gap-4">
			<div className="space-y-1">
				<p className="h-20 dark:text-white">
					Now move any distance you wish. A larger value will better tune your
					movement, just make sure you don't hit your machine limits. Once you
					are ready, clicked the Move Axis Button.
				</p>
			</div>

			<div className="space-y-6">
				<div
					className={`flex w-96 items-center gap-4 p-4 rounded-lg transition-colors dark:bg-dark dark:border-gray-700 dark:text-white ${
						moveAxisCompleted
							? "bg-green-50 border border-green-200 bg-opacity-30"
							: "bg-blue-50 border border-blue-200 bg-opacity-40"
					}`}
				>
					<div className={`min-w-8 min-h-8 text-white`}>
						{moveAxisCompleted ? (
							<FaClipboardCheck className="min-w-8 min-h-8 text-green-500 " />
						) : (
							<FaClipboardList className="min-w-8 min-h-8 text-blue-500 " />
						)}
					</div>
					<div className="flex flex-col gap-2 flex-1">
						<div className="flex items-center gap-4">
							<Button
								disabled={moveAxisCompleted}
								onClick={() => {
									jogAxis(
										{
											[selectedAxis.toUpperCase()]: moveDistance,
										},
										1000,
									);
									setMoveAxisCompleted(true);
									onComplete();
								}}
								variant="alt"
							>
								Move {selectedAxis.toUpperCase()}
								-axis
							</Button>

							<div className="flex items-center gap-2">
								<ControlledInput
									type="number"
									value={moveDistance}
									onChange={(e) => setMoveDistance(Number(e.target.value))}
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

export default MoveAxis;
