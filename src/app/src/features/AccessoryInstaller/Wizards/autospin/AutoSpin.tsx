import { useValidations } from "app/components/Wizard/hooks/UseValidations.tsx";
import PlaceholderImage from "app/components/Wizard/assets/placeholder.png";
import type { Wizard } from "app/components/Wizard/types";
import AutoSpinIcon from "app/features/Config/assets/images/autospin.svg";
import { AutoSpinCompletion } from "app/features/AccessoryInstaller/Wizards/autospin/components/Completion.tsx";
import { AutoSpinGcodePreview } from "app/features/AccessoryInstaller/Wizards/autospin/components/AutoSpinGcodePreview.tsx";
import { EepromConfig } from "app/features/AccessoryInstaller/Wizards/autospin/components/EepromConfig.tsx";
import { TestAutoSpin } from "app/features/AccessoryInstaller/Wizards/autospin/components/TestAutoSpin.tsx";
import { useMemo } from "react";

export function useAutoSpinWizard() {
	const { connectionValidation } = useValidations();

	const validations = useMemo(
		() => [connectionValidation],
		[connectionValidation],
	);

	return useMemo<Wizard>(
		() => ({
			id: "autospin",
			title: "AutoSpin",
			image: AutoSpinIcon,
			validations: [...validations],
			helpUrl: "https://resources.sienci.com/view/as-er-collets/",
			subWizards: [
				{
					id: "autospin-config",
					title: "AutoSpin Setup",
					description: "Configure your AutoSpin for first time use",
					estimatedTime: "5 - 15 minutes",
					configVersion: "1.0",
					completionPage: AutoSpinCompletion,
					steps: [
						{
							id: "eeprom-config",
							title: "AutoSpin EEPROM Configuration",
							component: EepromConfig,
							secondaryContent: [
								{
									type: "component",
									content: AutoSpinGcodePreview,
									title: "Commands to be sent",
									fill: true,
								},
								{
									type: "link",
									title: "Need help?",
									content: "Follow along in our",
									url: "https://resources.sienci.com/view/as-er-collets/",
								},
							],
						},
						{
							id: "test",
							title: "Test AutoSpin",
							component: TestAutoSpin,
							secondaryContent: [
								{
									type: "image",
									content: PlaceholderImage,
									title: "AutoSpin Dial",
								},
								{
									type: "link",
									title: "Need help?",
									content: "Follow along in our",
									url: "https://resources.sienci.com/view/as-er-collets/",
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
