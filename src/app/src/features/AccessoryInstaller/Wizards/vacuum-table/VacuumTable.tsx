import { useValidations } from "app/components/Wizard/hooks/UseValidations.tsx";
import type { Wizard } from "app/components/Wizard/types";
import { LoadGridFile } from "app/features/AccessoryInstaller/Wizards/vacuum-table/components/LoadGridFile.tsx";
import { LoadMountingFile } from "app/features/AccessoryInstaller/Wizards/vacuum-table/components/LoadMountingFile.tsx";
import { SelectSize } from "app/features/AccessoryInstaller/Wizards/vacuum-table/components/SelectSize.tsx";
import { ZeroPosition } from "app/features/AccessoryInstaller/Wizards/vacuum-table/components/ZeroPosition.tsx";
import { VacuumTableProvider } from "app/features/AccessoryInstaller/Wizards/vacuum-table/context/VacuumTableContext.tsx";
import { Jogging } from "app/features/Jogging";
import { Fragment, useMemo } from "react";

export function useVacuumTableWizard(): Wizard {
	const { connectionValidation, homingValidation } = useValidations();

	const validations = useMemo(
		() => [connectionValidation, homingValidation],
		[connectionValidation, homingValidation],
	);

	return useMemo<Wizard>(
		() => ({
			id: "vacuum-table",
			title: "Vacuum Table",
			validations: [...validations],
			provider: VacuumTableProvider,
			subWizards: [
				{
					id: "mounting-setup",
					title: "Mounting Setup",
					description:
						"Zero your table and carve the mounting holes for your vacuum table.",
					estimatedTime: "10 - 20 minutes",
					steps: [
						{
							id: "zero-position",
							title: "Zero Position",
							component: ZeroPosition,
							secondaryContent: [
								{
									type: "component",
									content: Jogging,
									props: {
										hideRotary: true,
									},
								},
							],
						},
						{
							id: "select-size",
							title: "Table Size",
							component: SelectSize,
							secondaryContent: [
								{
									type: "component",
									content: Fragment,
								},
							],
						},
						{
							id: "load-mounting-gcode",
							title: "Load to Carve",
							component: LoadMountingFile,
							secondaryContent: [
								{
									type: "component",
									content: Fragment,
								},
							],
						},
					],
				},
				{
					id: "grid-setup",
					title: "Grid Setup",
					description:
						"Carve an optional alignment grid onto your vacuum table.",
					estimatedTime: "5 minutes",
					steps: [
						{
							id: "load-grid-gcode",
							title: "Load Grid to Carve",
							component: LoadGridFile,
							secondaryContent: [
								{
									type: "component",
									content: Fragment,
								},
							],
						},
					],
				},
			],
		}),
		[validations],
	);
}
