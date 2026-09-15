type ConfigTab = "config" | "eeprom";

const scrollPositions: Record<ConfigTab, number> = { config: 0, eeprom: 0 };

export function getScrollPosition(tab: ConfigTab): number {
	return scrollPositions[tab];
}

export function setScrollPosition(tab: ConfigTab, value: number): void {
	scrollPositions[tab] = value;
}

// The most specific location (subsection id, e.g. "section-3-sub-1", or
// falling back to a section id, e.g. "section-3") the user last scrolled
// past on the "All Config" tab. Session-only: resets on app restart.
let lastViewedConfigId = "";

export function getLastViewedConfigId(): string {
	return lastViewedConfigId;
}

export function setLastViewedConfigId(id: string): void {
	lastViewedConfigId = id;
}
