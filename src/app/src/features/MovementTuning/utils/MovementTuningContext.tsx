import { useWorkspaceState } from "app/hooks/useWorkspaceState";
import { noop } from "lodash";
import {
	createContext,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
	useContext,
	useState,
} from "react";

const initialState: {
	status: "initial" | "started";
	selectedAxis: "x" | "y" | "z";
	markLocationCompleted: boolean;
	moveAxisCompleted: boolean;
	setTravelCompleted: boolean;
	moveDistance: number;
	measuredDistance: number;
	setStatus?: Dispatch<SetStateAction<"initial" | "started">>;
	setSelectedAxis?: Dispatch<SetStateAction<"x" | "y" | "z">>;
	setMarkLocationCompleted?: Dispatch<SetStateAction<boolean>>;
	setMoveAxisCompleted?: Dispatch<SetStateAction<boolean>>;
	setSetTravelCompleted?: Dispatch<SetStateAction<boolean>>;
	setMoveDistance?: Dispatch<SetStateAction<number>>;
	setMeasuredDistance?: Dispatch<SetStateAction<number>>;
	reset: () => void;
	onNext: () => void;
	onPrevious: () => void;
	getItemParams: () => string;
} = {
	status: "initial",
	selectedAxis: "x",
	markLocationCompleted: false,
	moveAxisCompleted: false,
	setTravelCompleted: false,
	moveDistance: 0,
	measuredDistance: 0,
	reset: noop,
	onNext: noop,
	onPrevious: noop,
	getItemParams: () => {
		return "";
	},
};

const MovementTuningContext = createContext(initialState);

export function MovementTuningProvider({ children }: { children: ReactNode }) {
	const [status, setStatus] = useState<"initial" | "started">("initial");
	const [selectedAxis, setSelectedAxis] = useState<"x" | "y" | "z">("x");
	const [markLocationCompleted, setMarkLocationCompleted] = useState(false);
	const [moveAxisCompleted, setMoveAxisCompleted] = useState(false);
	const [setTravelCompleted, setSetTravelCompleted] = useState(false);
	const { units } = useWorkspaceState();
	const [moveDistance, setMoveDistance] = useState(units === "mm" ? 100 : 4);
	const [measuredDistance, setMeasuredDistance] = useState(
		units === "mm" ? 100 : 4,
	);

	const reset = () => {
		setStatus("initial");
		setSelectedAxis("x");
		setMarkLocationCompleted(false);
		setMoveAxisCompleted(false);
		setSetTravelCompleted(false);
		setMoveDistance(units === "mm" ? 100 : 4);
		setMeasuredDistance(units === "mm" ? 100 : 4);
	};

	const onNext = noop;

	const onPrevious = () => {
		if (moveAxisCompleted) {
			setMoveAxisCompleted(false);
			return;
		}
		if (markLocationCompleted) {
			setMarkLocationCompleted(false);
		}
	};

	const getItemParams = () => {
		return selectedAxis;
	};

	const payload = {
		status,
		selectedAxis,
		markLocationCompleted,
		moveAxisCompleted,
		setTravelCompleted,
		moveDistance,
		measuredDistance,
		reset,
		setStatus,
		setSelectedAxis,
		setMarkLocationCompleted,
		setMoveAxisCompleted,
		setSetTravelCompleted,
		setMoveDistance,
		setMeasuredDistance,
		onNext,
		onPrevious,
		getItemParams,
	};

	return (
		<MovementTuningContext.Provider value={payload}>
			{children}
		</MovementTuningContext.Provider>
	);
}

export const useMovementTuning = () => {
	const context = useContext(MovementTuningContext);
	if (context === undefined) {
		throw new Error("useSquaring must be used within a SquaringProvider");
	}
	return context;
};
