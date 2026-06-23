import { Button } from "app/components/Button";
import { FaClipboardCheck, FaClipboardList } from "react-icons/fa";
import { useMovementTuning } from "../utils/MovementTuningContext";

interface Props {
	onComplete: () => void;
}

const MarkFirstLocation = ({ onComplete }: Props) => {
	const { markLocationCompleted, setMarkLocationCompleted } =
		useMovementTuning();
	return (
		<div className="flex flex-col gap-4">
			<div className="space-y-1">
				<p className="h-20 dark:text-white">
					First, mark next to the gantry in the location shown with your marker,
					pencil, or using a strip of tape.
				</p>
			</div>

			<div className="space-y-6">
				<div
					className={`flex w-80 items-center gap-4 p-4 rounded-lg transition-colors ${
						markLocationCompleted
							? "bg-green-50 border border-green-200 bg-opacity-30"
							: "bg-blue-50 border border-blue-200 bg-opacity-40"
					}`}
				>
					<div className={`min-w-8 min-h-8 text-white`}>
						{markLocationCompleted ? (
							<FaClipboardCheck className="min-w-8 min-h-8 text-green-500 " />
						) : (
							<FaClipboardList className="min-w-8 min-h-8 text-blue-500 " />
						)}
					</div>
					<div className="flex flex-col gap-2 flex-1">
						<div className="flex items-center gap-4">
							<Button
								disabled={markLocationCompleted}
								onClick={() => {
									setMarkLocationCompleted(true);
									onComplete();
								}}
								variant="secondary"
							>
								Mark First Location
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default MarkFirstLocation;
