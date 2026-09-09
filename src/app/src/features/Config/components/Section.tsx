import type {
	gSenderEEEPROMSettings,
	gSenderSettings,
	gSenderSubSection,
} from "app/features/Config/assets/SettingsMenu.ts";
import { SettingSection } from "app/features/Config/components/SettingSection.tsx";
import { useSettings } from "app/features/Config/utils/SettingsContext.tsx";
import cn from "classnames";
import React, { useMemo } from "react";
import { InView } from "react-intersection-observer";

interface SectionProps {
	title: string;
	children?: React.ReactNode;
	activeSection?: number;
	key: string;
	connected?: boolean;
	id: string;
	index: number;
	settings: gSenderSettings[];
	eeprom?: gSenderEEEPROMSettings;
	wizard?: () => JSX.Element;
	showEEPROMOnly?: boolean;
	onSubsectionInView?: (id: string) => void;
}

export const Section = React.forwardRef(
	(
		{
			title,
			id,
			settings,
			connected = false,
			wizard = null,
			showEEPROMOnly,
			onSubsectionInView,
		}: SectionProps,
		ref,
	) => {
		const { settingsFilter } = useSettings();

		// Must be capitalized so React treats it as a component (gives it its own
		// fiber/hook registry). Calling wizard() inline would attribute any hooks
		// inside the wizard to Section, causing conditional-hook violations.
		const Wizard = wizard;

		const filteredSettings = useMemo(
			() =>
				settings.map((s: gSenderSubSection) => ({
					...s,
					settings: s.settings.filter((o) => settingsFilter(o)),
				})),
			[settings, settingsFilter],
		);

		const settingsAvailable = filteredSettings.reduce(
			(a, b) => a + b.settings.length,
			0,
		);
		return showEEPROMOnly ? (
			filteredSettings.length > 0 &&
				filteredSettings.map((setting: gSenderSubSection, index) => {
					return (
						<div
							key={setting.label ?? index}
							className="bg-gray-100 rounded-xl shadow p-6 max-xl:p-3 flex flex-col gap-6 dark:bg-surface-raised dark:text-content-primary"
						>
							<SettingSection
								connected={connected}
								settings={setting.settings}
								label={setting.label}
								wizard={setting.wizard}
								showEEPROMOnly={true}
							/>
						</div>
					);
				})
		) : (
			<div
				id={id}
				className={cn({
					hidden: settingsAvailable === 0,
				})}
			>
				<div className="flex flex-row gap-8 py-2">
					<h1
						className="mb-2 text-3xl ml-4 font-sans dark:text-content-primary"
						id={`h-${id}`}
						ref={ref}
					>
						{title}
					</h1>
					{connected && Wizard && <Wizard />}
				</div>
				<div className="bg-gray-100 rounded-xl shadow p-6 max-xl:p-3 flex flex-col gap-6 dark:bg-surface-raised dark:text-content-primary">
					{filteredSettings.map((setting: gSenderSubSection, index) => {
						if (!setting.label) {
							return (
								<SettingSection
									key={index}
									connected={connected}
									settings={setting.settings}
									label={setting.label}
									wizard={setting.wizard}
								/>
							);
						}

						const subsectionId = `${id}-sub-${index}`;

						return (
							<InView
								key={subsectionId}
								onChange={(inView) => {
									if (inView) {
										onSubsectionInView?.(subsectionId);
									}
								}}
								threshold={0}
								rootMargin="0px 0px -75% 0px"
							>
								{({ ref: subsectionRef }) => (
									<SettingSection
										id={subsectionId}
										ref={subsectionRef}
										connected={connected}
										settings={setting.settings}
										label={setting.label}
										wizard={setting.wizard}
									/>
								)}
							</InView>
						);
					})}
				</div>
			</div>
		);
	},
);
