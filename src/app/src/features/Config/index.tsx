import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "app/components/shadcn/Tabs";
import { WORKFLOW_STATE_IDLE } from "app/constants";
import { ApplicationPreferences } from "app/features/Config/components/ApplicationPreferences.tsx";
import { EEPROMNotConnectedWarning } from "app/features/Config/components/EEPROMNotConnectedWarning.tsx";
import { FilterDefaultToggle } from "app/features/Config/components/FilterDefaultToggle.tsx";
import { ProfileBar } from "app/features/Config/components/ProfileBar.tsx";
import { Search } from "app/features/Config/components/Search.tsx";
import { useSettings } from "app/features/Config/utils/SettingsContext";
import { useTypedSelector } from "app/hooks/useTypedSelector.ts";
import controller from "app/lib/controller.ts";
import store from "app/store";
import type { RootState } from "app/store/redux";
import { updateAccessibility } from "app/store/redux/slices/preferences.slice";
import pubsub from "pubsub-js";
import React, { useEffect, useMemo } from "react";
import { InView, useInView } from "react-intersection-observer";
import { useDispatch } from "react-redux";
import type {
	gSenderSetting,
	SettingsMenuSection,
} from "./assets/SettingsMenu";
import { Menu } from "./components/Menu";
import { Section } from "./components/Section";
import { getScrollPosition, setScrollPosition } from "./utils/scrollMemory";

export function Config() {
	const dispatch = useDispatch();
	// const [activeSection, setActiveSection] = React.useState<number>(0);
	// const [showFlashDialog, setShowFlashDialog] = React.useState(false);
	const { ref: inViewRef } = useInView({
		threshold: 0.2,
	});

	const configScrollRef = React.useRef<HTMLDivElement | null>(null);
	const eepromScrollRef = React.useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const token = pubsub.subscribe("accessibility:update", () => {
			const accessibility = store.get("workspace.accessibility");
			if (accessibility) {
				dispatch(updateAccessibility(accessibility));
			}
		});
		return () => {
			pubsub.unsubscribe(token);
		};
	}, [dispatch]);

	const connected = useTypedSelector(
		(state: RootState) => state.connection.isConnected,
	);

	const workflowState = useTypedSelector(
		(state: RootState) => state.controller.workflow.state,
	);

	const [visibleSection, setVisibleSection] = React.useState<string>(
		`h-section-${store.get("workspace.lastViewedConfigLocation")}`,
	);

	const [activeTab, setActiveTab] = React.useState("config");

	const [visibleSubsection, setVisibleSubsection] = React.useState<string>("");

	function setInView(inView: any, entry: any) {
		if (inView) {
			store.set(
				"workspace.lastViewedConfigLocation",
				entry.target.getAttribute("id").split("-")[2],
			);
			setVisibleSection(entry.target.getAttribute("id"));
		}
	}

	useEffect(() => {
		if (connected && workflowState === WORKFLOW_STATE_IDLE) {
			controller.command("gcode", ["$$"]);
		}
	}, []);

	useEffect(() => {
		const container =
			activeTab === "config" ? configScrollRef.current : eepromScrollRef.current;
		if (!container) {
			return;
		}
		const timeoutId = setTimeout(() => {
			container.scrollTop = getScrollPosition(activeTab as "config" | "eeprom");
		}, 50);
		return () => clearTimeout(timeoutId);
	}, [activeTab]);

	const { settings, EEPROM } = useSettings();

	// lets extract all the eeprom settingsd
	const allEEPROM: gSenderSetting[] = useMemo(
		() =>
			EEPROM.map((filtered) => ({
				type: "eeprom" as const,
				description: filtered.description,
				unit: filtered.unit,
				eID: filtered.setting,
				globalIndex: filtered.globalIndex,
				value: filtered.value,
				defaultValue: filtered.defaultValue,
			})),
		[EEPROM],
	);
	const eepromSettings: SettingsMenuSection[] = useMemo(
		() => [
			{
				label: "",
				icon: null,
				settings: [
					{
						label: "",
						settings: allEEPROM,
					},
				],
			},
		],
		[allEEPROM],
	);

	function navigateToSection(
		_e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
		index: number,
	) {
		const sectionElement = document.getElementById(`section-${index}`);

		if (!sectionElement) {
			return;
		}

		sectionElement.scrollIntoView({ behavior: "instant" });

		setTimeout(() => {
			setVisibleSection(`h-section-${index}`);
		}, 50);
	}

	function navigateToSubsection(
		_e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
		sectionIndex: number,
		subIndex: number,
	) {
		const subsectionId = `section-${sectionIndex}-sub-${subIndex}`;
		const subsectionElement = document.getElementById(subsectionId);

		if (!subsectionElement) {
			return;
		}

		subsectionElement.scrollIntoView({ behavior: "instant" });

		setTimeout(() => {
			setVisibleSubsection(subsectionId);
		}, 50);
	}

	return (
		<div className="w-full flex flex-grow-0 shadow bg-white overflow-y-hidden box-border no-scrollbar dark:bg-surface-raised">
			{activeTab === "config" ? (
				<Menu
					menu={settings}
					onClick={navigateToSection}
					activeSection={visibleSection}
					onSubsectionClick={navigateToSubsection}
					activeSubsection={visibleSubsection}
				/>
			) : (
				<div className="flex flex-col w-1/5 border border-gray-200 border-l-0 pl-1 divide-y bg-white dark:bg-surface-raised dark:border-outline dark:text-content-primary max-sm:hidden" />
			)}
			<div className="flex flex-col fixed-content-area w-full">
				<div className="min-h-1/5 bg-white border border-bottom border-gray-200 flex flex-row justify-between gap-2 items-center pl-24 max-xl:pl-5 max-sm:p-3 dark:bg-surface-raised dark:border-outline">
					<Search />
					<FilterDefaultToggle />
					<ApplicationPreferences />
				</div>
				<Tabs defaultValue="config">
					<TabsList className="w-full pb-0 border-b rounded-b-none">
						<TabsTrigger
							value="config"
							className="w-full dark:text-content-primary"
							onClick={() => setActiveTab("config")}
						>
							All Config
						</TabsTrigger>
						<TabsTrigger
							value="eeprom"
							className="w-full dark:text-content-primary"
							onClick={() => setActiveTab("eeprom")}
						>
							EEPROM
						</TabsTrigger>
					</TabsList>
					<TabsContent
						value="config"
						className="flex flex-col fixed-config-area"
					>
						<div
							className="px-10 max-xl:px-2 gap-8 pt-4 mb-24 box-border flex flex-col overflow-y-scroll relative"
							ref={(node) => {
								configScrollRef.current = node;
								inViewRef(node);
							}}
							onScroll={(e) =>
								setScrollPosition("config", e.currentTarget.scrollTop)
							}
						>
							<EEPROMNotConnectedWarning connected={connected} />
							{settings.map((item, index) => {
								return (
									<InView
										key={`IV-section-${index}`}
										onChange={setInView}
										threshold={0}
										rootMargin="0px 0px -75% 0px"
										className={"bg-red-500"}
									>
										{({ ref }) => {
											return (
												<Section
													title={item.label}
													key={`section-${index}`}
													id={`section-${index}`}
													index={index}
													settings={item.settings}
													eeprom={item.eeprom}
													ref={ref}
													connected={connected}
													wizard={item.wizard}
													onSubsectionInView={setVisibleSubsection}
												/>
											);
										}}
									</InView>
								);
							})}
						</div>
					</TabsContent>
					<TabsContent
						value="eeprom"
						className="flex flex-col fixed-config-area"
					>
						<div
							className="px-10 max-xl:px-2 gap-8 pt-4 mb-24 box-border flex flex-col overflow-y-scroll relative"
							ref={(node) => {
								eepromScrollRef.current = node;
								inViewRef(node);
							}}
							onScroll={(e) =>
								setScrollPosition("eeprom", e.currentTarget.scrollTop)
							}
						>
							<EEPROMNotConnectedWarning connected={connected} />
							{eepromSettings.map((item, index) => {
								return (
									<InView
										key={`IV-section-${index}`}
										onChange={setInView}
										threshold={0}
										rootMargin="0px 0px -75% 0px"
										className={"bg-red-500"}
									>
										{({ ref }) => {
											return (
												<Section
													title={item.label}
													key={`section-${index}`}
													id={`section-${index}`}
													index={index}
													settings={item.settings}
													eeprom={item.eeprom}
													connected={connected}
													wizard={item.wizard}
													showEEPROMOnly={true}
													ref={ref}
												/>
											);
										}}
									</InView>
								);
							})}
						</div>
					</TabsContent>
				</Tabs>
				<ProfileBar />
			</div>
		</div>
	);
}
