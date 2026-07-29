import Button from "app/components/Button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "app/components/shadcn/Popover";
import { Jogging } from "app/features/Jogging";

const ShowJogControls = () => {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline">Show Jog Controls</Button>
			</PopoverTrigger>
			<PopoverContent className="w-96 bg-white">
				<div className="w-full">
					<Jogging />
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default ShowJogControls;
