import { useWorkspaceState } from "app/hooks/useWorkspaceState";
import {
	createContext,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
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
	reset?: () => void;
} = {
	status: "initial",
	selectedAxis: "x",
	markLocationCompleted: false,
	moveAxisCompleted: false,
	setTravelCompleted: false,
	moveDistance: 0,
	measuredDistance: 0,
};

export const MovementTuningContext = createContext(initialState);

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
	};

	return (
		<MovementTuningContext.Provider value={payload}>
			{children}
		</MovementTuningContext.Provider>
	);
}
