import { useSettings } from "app/features/Config/utils/SettingsContext.tsx";
import cn from "classnames";
import type React from "react";
import { type MouseEventHandler, useEffect } from "react";
import type { IconType } from "react-icons";
import type { SettingsMenuSection } from "../assets/SettingsMenu";

interface MenuProps {
	menu: SettingsMenuSection[];
	onClick?: (
		e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
		n: number,
	) => void;
	activeSection: string;
	onSubsectionClick?: (
		e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
		sectionIndex: number,
		subIndex: number,
	) => void;
	activeSubsection?: string;
}

interface MenuItemProps {
	label: string;
	active?: boolean;
	expanded?: boolean;
	onClick?: MouseEventHandler<HTMLButtonElement>;
	icon: IconType;
	available: number;
}

interface SubMenuItemProps {
	label: string;
	active?: boolean;
	onClick?: MouseEventHandler<HTMLButtonElement>;
}

export function tallySettings(settings: SettingsMenuSection) {
	return settings.settings.reduce((a, b) => a + b.settings.length, 0);
}

function MenuItem({
	label,
	active,
	expanded,
	onClick,
	icon,
	available,
}: MenuItemProps) {
	return (
		<button
			className={cn(
				"flex min-h-8 items-center justify-start gap-2 px-4 max-xl:px-1 max-xl:font-sm max-xl:gap-1 hover:text-blue-500 hover:fill-blue-500 font-sans group group-hover:text-blue-500",
				{
					"flex-1": !expanded,
					"text-blue-500 font-italic": active,
					hidden: available === 0,
				},
			)}
			onClick={onClick}
		>
			<span
				className={cn(
					"text-gray-600 text-2xl max-xl:text-xl group-hover:text-blue-500",
					{
						"text-blue-500 fill-blue-500": active,
					},
				)}
			>
				{icon({
					className: active
						? "text-blue-500"
						: "text-gray-600 group-hover:text-blue-500 hover:text-blue-500 dark:text-content-primary",
				})}
			</span>
			<span>{label}</span>
		</button>
	);
}

function SubMenuItem({ label, active, onClick }: SubMenuItemProps) {
	return (
		<button
			className={cn(
				"flex min-h-6 items-center justify-start gap-2 pl-11 pr-4 py-1 border-l-2 border-transparent hover:border-l-blue-500 hover:text-blue-500 font-sans text-sm text-gray-600 dark:text-content-primary",
				{
					"text-blue-500 font-italic bg-blue-200 bg-opacity-30 border-l-blue-400":
						active,
				},
			)}
			onClick={onClick}
		>
			{label}
		</button>
	);
}

export function Menu({
	menu,
	onClick,
	activeSection,
	onSubsectionClick,
	activeSubsection,
}: MenuProps) {
	const { settingsFilter } = useSettings();

	useEffect(() => {
		const index = Number(activeSection.split("-")[2]);
		onClick(null, index);
	}, []);

	const originalMenuLength = menu.length;

	const filteredSettings = menu.map((section) => {
		const newSection = { ...section };
		newSection.settings = section.settings.map((ss) => {
			const fs = { ...ss };
			fs.settings = fs.settings.filter((o) => settingsFilter(o));
			return fs;
		});
		return newSection;
	});

	return (
		<div
			className="flex flex-col w-1/5 border border-gray-200 border-l-0 pl-1 divide-y bg-white max-sm:hidden dark:bg-surface-raised dark:border-outline dark:text-content-primary"
			style={
				{
					"--menu-col-length": originalMenuLength,
				} as React.CSSProperties
			}
		>
			{filteredSettings.map((item, index) => {
				const availableSettings = tallySettings(item);
				const active = `h-section-${index}` === activeSection;
				const visibleSubsections = item.settings
					.map((subsection, subIndex) => ({ subsection, subIndex }))
					.filter(
						({ subsection }) =>
							subsection.label && subsection.settings.length > 0,
					);
				const expanded = active && visibleSubsections.length > 0;

				return (
					<div
						key={`menu-item-${index}`}
						className={cn(
							"flex flex-col flex-1 border-l-2 border-transparent",
							{
								"bg-blue-200 bg-opacity-30 border-l-blue-400": active,
								hidden: availableSettings === 0,
							},
						)}
					>
						<MenuItem
							available={availableSettings}
							label={item.label}
							active={active}
							expanded={expanded}
							icon={item.icon}
							onClick={(e) => onClick(e, index)}
						/>
						{visibleSubsections.length > 0 && (
							<div
								className={cn(
									"flex flex-col overflow-hidden transition-all duration-300 delay-100 ease-in-out origin-top max-xl:hidden",
									{
										"max-h-0 opacity-0 scale-y-0": !active,
										"max-h-[500px] opacity-100 scale-y-100": active,
									},
								)}
							>
								{visibleSubsections.map(({ subsection, subIndex }) => {
									const subsectionId = `section-${index}-sub-${subIndex}`;
									return (
										<SubMenuItem
											key={subsectionId}
											label={subsection.label}
											active={subsectionId === activeSubsection}
											onClick={(e) =>
												onSubsectionClick?.(e, index, subIndex)
											}
										/>
									);
								})}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
