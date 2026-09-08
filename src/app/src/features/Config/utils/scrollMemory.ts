type ConfigTab = "config" | "eeprom";

const scrollPositions: Record<ConfigTab, number> = { config: 0, eeprom: 0 };

export function getScrollPosition(tab: ConfigTab): number {
	return scrollPositions[tab];
}

export function setScrollPosition(tab: ConfigTab, value: number): void {
	scrollPositions[tab] = value;
}
