/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "app/components/shadcn/Select";
import type { StepProps } from "app/components/Wizard/types";
import { VACUUM_TABLE_SIZES } from "app/features/AccessoryInstaller/Wizards/vacuum-table/constants/sizes.ts";
import { useVacuumTable } from "app/features/AccessoryInstaller/Wizards/vacuum-table/context/VacuumTableContext.tsx";
import { useEffect } from "react";

export function SelectSize({ onComplete }: StepProps) {
	const { tableSize, setTableSize } = useVacuumTable();

	useEffect(() => {
		onComplete();
	}, []);

	return (
		<div className="flex flex-col gap-5 justify-start">
			<p className="dark:text-content-primary">
				Choose the size of your vacuum table.
			</p>
			<Select value={tableSize} onValueChange={setTableSize}>
				<SelectTrigger>
					<SelectValue className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-surface-raised dark:border-gray-600 dark:text-content-primary" />
				</SelectTrigger>
				<SelectContent className="w-full flex-1 bg-white z-[10000]">
					{VACUUM_TABLE_SIZES.map((size) => (
						<SelectItem key={size.value} value={size.value}>
							{size.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
