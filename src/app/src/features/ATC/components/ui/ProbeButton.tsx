import { Button } from "app/components/Button/";
import cn from "classnames";
import { Settings } from "lucide-react";

export const ProbeButton = ({
	onProbe,
	className,
}: {
	onProbe?: () => void;
	className?: string;
}) => {
	return (
		<Button
			variant="primary"
			size="sm"
			className={cn("w-[100px] justify-center gap-2 px-2", className)}
			onClick={onProbe}
		>
			<Settings size={14} />
			Probe Tool
		</Button>
	);
};
