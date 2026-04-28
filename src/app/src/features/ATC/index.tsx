import { ATC } from "app/features/ATC/ATC.tsx";
import { ToolchangeProvider } from "app/features/ATC/utils/ToolChangeContext.tsx";

export function ATCWidget() {
	return (
		<ToolchangeProvider>
			<ATC />
		</ToolchangeProvider>
	);
}
