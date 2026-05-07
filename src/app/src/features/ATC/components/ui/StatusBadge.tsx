import type { ToolStatus } from "app/features/ATC/components/ToolTable.tsx";
import { Badge } from "app/features/ATC/components/ui/Badge";
import {
	getToolStateClasses,
	toolStateThemes,
} from "app/features/ATC/utils/ATCiConstants.ts";
import cn from "classnames";

export const StatusBadge = ({ status }: { status: ToolStatus }) => {
	const config = toolStateThemes[status];
	const IconComponent = config.icon;
	return (
		<Badge
			className={cn(
				"gap-1 min-w-[110px] justify-center",
				getToolStateClasses(status),
			)}
		>
			<IconComponent size={16} />
			{config.label}
		</Badge>
	);
};
