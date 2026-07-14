import { BOARD_PROFILES, getBoardProfile } from "app/features/Config/assets/MachineDefaults/boardProfiles.ts";
import machineProfiles from "app/features/Config/assets/MachineDefaults/defaultMachineProfiles.ts";

// ---- Mocks for machineProfiles' underlying EEPROM constant modules ----
// Distinct marker objects let us verify each profile entry is wired to the
// CORRECT constant (not a copy-pasted neighbor's value) via reference
// equality - the most common bug risk in a large hand-written table.

jest.mock("app/features/Config/assets/MachineDefaults/grbl/longmill.js", () => ({
	LONGMILL_MK2_12x30: { __marker: "grbl-longmill-mk2-12x30" },
	LONGMILL_MK2_30x30: { __marker: "grbl-longmill-mk2-30x30" },
	LONGMILL_MK2_48x30: { __marker: "grbl-longmill-mk2-48x30" },
	LONGMILL_MK1_12x12: { __marker: "grbl-longmill-mk1-12x12" },
	LONGMILL_MK1_12x30: { __marker: "grbl-longmill-mk1-12x30" },
	LONGMILL_MK1_30x30: { __marker: "grbl-longmill-mk1-30x30" },
	LONGMILL_MK1_48x30: { __marker: "grbl-longmill-mk1-48x30" },
}));

jest.mock("app/features/Config/assets/MachineDefaults/grbl/millone.js", () => ({
	MILL_ONE_V1_AND_V2: { __marker: "grbl-millone-v1-v2" },
	MILL_ONE_V3: { __marker: "grbl-millone-v3" },
}));

jest.mock("app/features/Config/assets/MachineDefaults/grblHAL/Altmill.js", () => ({
	DEFAULT: { __marker: "grblhal-altmill-4x4" },
	DEFAULT_2X4: { __marker: "grblhal-altmill-2x4" },
	DEFAULT_4X8: { __marker: "grblhal-altmill-4x8" },
	ALTMILL_ORDERED: { __marker: "grblhal-altmill-ordered" },
}));

jest.mock("app/features/Config/assets/MachineDefaults/grblHAL/longmill.js", () => ({
	LONGMILL_MK3_30x30: { __marker: "grblhal-longmill-mk3-30x30" },
	LONGMILL_MK3_48x30: { __marker: "grblhal-longmill-mk3-48x30" },
	MK3_ORDERED: { __marker: "grblhal-longmill-mk3-ordered" },
	LONGMILL_MK2_12x30: { __marker: "grblhal-longmill-mk2-12x30" },
	LONGMILL_MK2_30x30: { __marker: "grblhal-longmill-mk2-30x30" },
	LONGMILL_MK2_48x30: { __marker: "grblhal-longmill-mk2-48x30" },
	LONGMILL_MK1_12x12: { __marker: "grblhal-longmill-mk1-12x12" },
	LONGMILL_MK1_12x30: { __marker: "grblhal-longmill-mk1-12x30" },
	LONGMILL_MK1_30x30: { __marker: "grblhal-longmill-mk1-30x30" },
	LONGMILL_MK1_48x30: { __marker: "grblhal-longmill-mk1-48x30" },
}));

import * as longMillGrblEEPROM from "app/features/Config/assets/MachineDefaults/grbl/longmill.js";
import * as millOneGrblEEPROM from "app/features/Config/assets/MachineDefaults/grbl/millone.js";
import * as altmillSettings from "app/features/Config/assets/MachineDefaults/grblHAL/Altmill.js";
import * as longMillGrblHALEEPROM from "app/features/Config/assets/MachineDefaults/grblHAL/longmill.js";

// =====================================================================
// BOARD_PROFILES / getBoardProfile
// =====================================================================

describe("BOARD_PROFILES / getBoardProfile", () => {
	describe("getBoardProfile", () => {
		it("returns undefined when boardId is undefined", () => {
			expect(getBoardProfile(undefined)).toBeUndefined();
		});

		it("returns undefined when boardId is an empty string", () => {
			expect(getBoardProfile("")).toBeUndefined();
		});

		it("returns the matching profile for an exact boardId match", () => {
			const profile = getBoardProfile("SLB Lite");
			expect(profile).toEqual({
				boardId: "SLB Lite",
				skipGrblCoreMigration: true,
			});
		});

		it("returns undefined for a boardId that does not exist in the list", () => {
			expect(getBoardProfile("Unknown Board")).toBeUndefined();
		});

		it("is case-sensitive, since board IDs are exact firmware strings", () => {
			expect(getBoardProfile("slb lite")).toBeUndefined();
			expect(getBoardProfile("SLB LITE")).toBeUndefined();
			expect(getBoardProfile("Slb Lite")).toBeUndefined();
		});

		it("does not match on partial/substring board IDs", () => {
			expect(getBoardProfile("SLB")).toBeUndefined();
			expect(getBoardProfile("SLB Lite Pro")).toBeUndefined();
		});

		it("is not tripped up by leading/trailing whitespace differences", () => {
			expect(getBoardProfile(" SLB Lite")).toBeUndefined();
			expect(getBoardProfile("SLB Lite ")).toBeUndefined();
		});
	});

	describe("BOARD_PROFILES", () => {
		it("contains the SLB Lite entry with skipGrblCoreMigration set to true", () => {
			const slbLite = BOARD_PROFILES.find((b) => b.boardId === "SLB Lite");
			expect(slbLite).toBeDefined();
			expect(slbLite?.skipGrblCoreMigration).toBe(true);
		});

		it("has no duplicate boardId entries", () => {
			const ids = BOARD_PROFILES.map((b) => b.boardId);
			const uniqueIds = new Set(ids);
			expect(uniqueIds.size).toBe(ids.length);
		});

		it("every entry has a non-empty boardId and a boolean skipGrblCoreMigration flag", () => {
			for (const profile of BOARD_PROFILES) {
				expect(typeof profile.boardId).toBe("string");
				expect(profile.boardId.length).toBeGreaterThan(0);
				expect(typeof profile.skipGrblCoreMigration).toBe("boolean");
			}
		});
	});
});

// =====================================================================
// machineProfiles
// =====================================================================

describe("machineProfiles", () => {
	describe("structural integrity", () => {
		it("is a non-empty array", () => {
			expect(Array.isArray(machineProfiles)).toBe(true);
			expect(machineProfiles.length).toBeGreaterThan(0);
		});

		it("has a unique id for every profile", () => {
			const ids = machineProfiles.map((p: any) => p.id);
			const uniqueIds = new Set(ids);
			expect(uniqueIds.size).toBe(ids.length);
		});

		it("every profile has the required string fields", () => {
			for (const profile of machineProfiles as any[]) {
				expect(typeof profile.company).toBe("string");
				expect(typeof profile.name).toBe("string");
				expect(typeof profile.type).toBe("string");
				expect(typeof profile.version).toBe("string");
				expect(profile.name.length).toBeGreaterThan(0);
			}
		});

		it("every profile has valid positive mm dimensions", () => {
			for (const profile of machineProfiles as any[]) {
				expect(profile.mm).toBeDefined();
				expect(typeof profile.mm.width).toBe("number");
				expect(typeof profile.mm.depth).toBe("number");
				expect(typeof profile.mm.height).toBe("number");
				expect(profile.mm.width).toBeGreaterThan(0);
				expect(profile.mm.depth).toBeGreaterThan(0);
				expect(profile.mm.height).toBeGreaterThan(0);
			}
		});
	});

	describe("Sienci Labs machine EEPROM wiring", () => {
		const byId = (id: number) =>
			(machineProfiles as any[]).find((p) => p.id === id);

		it("AltMill 4x4 (id 0) uses the AltMill 4x4 default settings for both grbl fields and the shared ordered settings", () => {
			const profile = byId(0);
			expect(profile.name).toBe("AltMill 4X4");
			expect(profile.eepromSettings).toBe(altmillSettings.DEFAULT);
			expect(profile.grblHALeepromSettings).toBe(altmillSettings.DEFAULT);
			expect(profile.orderedSettings).toBe(altmillSettings.ALTMILL_ORDERED);
		});

		it("AltMill 2x4 (id 2) uses the DEFAULT_2X4 settings, not the 4x4 or 4x8 variants", () => {
			const profile = byId(2);
			expect(profile.eepromSettings).toBe(altmillSettings.DEFAULT_2X4);
			expect(profile.grblHALeepromSettings).toBe(altmillSettings.DEFAULT_2X4);
			expect(profile.eepromSettings).not.toBe(altmillSettings.DEFAULT);
		});

		it("AltMill 4x8 (id 4) uses the DEFAULT_4X8 settings", () => {
			const profile = byId(4);
			expect(profile.eepromSettings).toBe(altmillSettings.DEFAULT_4X8);
			expect(profile.grblHALeepromSettings).toBe(altmillSettings.DEFAULT_4X8);
		});

		it("LongMill MK3 30x30 (id 18) uses the grblHAL MK3 30x30 settings and MK3 ordered settings", () => {
			const profile = byId(18);
			expect(profile.eepromSettings).toBe(
				longMillGrblHALEEPROM.LONGMILL_MK3_30x30,
			);
			expect(profile.grblHALeepromSettings).toBe(
				longMillGrblHALEEPROM.LONGMILL_MK3_30x30,
			);
			expect(profile.orderedSettings).toBe(longMillGrblHALEEPROM.MK3_ORDERED);
		});

		it("LongMill MK3 48x30 (id 19) uses the 48x30 settings, not the 30x30 settings", () => {
			const profile = byId(19);
			expect(profile.eepromSettings).toBe(
				longMillGrblHALEEPROM.LONGMILL_MK3_48x30,
			);
			expect(profile.eepromSettings).not.toBe(
				longMillGrblHALEEPROM.LONGMILL_MK3_30x30,
			);
		});

		it("LongMill MK2 entries use grbl settings for eepromSettings and grblHAL settings for grblHALeepromSettings (dual-firmware support)", () => {
			const mk2_12x30 = byId(5);
			expect(mk2_12x30.eepromSettings).toBe(
				longMillGrblEEPROM.LONGMILL_MK2_12x30,
			);
			expect(mk2_12x30.grblHALeepromSettings).toBe(
				longMillGrblHALEEPROM.LONGMILL_MK2_12x30,
			);

			const mk2_30x30 = byId(6);
			expect(mk2_30x30.eepromSettings).toBe(
				longMillGrblEEPROM.LONGMILL_MK2_30x30,
			);
			expect(mk2_30x30.grblHALeepromSettings).toBe(
				longMillGrblHALEEPROM.LONGMILL_MK2_30x30,
			);

			const mk2_48x30 = byId(7);
			expect(mk2_48x30.eepromSettings).toBe(
				longMillGrblEEPROM.LONGMILL_MK2_48x30,
			);
			expect(mk2_48x30.grblHALeepromSettings).toBe(
				longMillGrblHALEEPROM.LONGMILL_MK2_48x30,
			);
		});

		it("LongMill MK1 entries (ids 10,11,12,13) are each wired to their own matching size variant", () => {
			const cases: [number, any, any][] = [
				[10, longMillGrblEEPROM.LONGMILL_MK1_12x12, longMillGrblHALEEPROM.LONGMILL_MK1_12x12],
				[11, longMillGrblEEPROM.LONGMILL_MK1_12x30, longMillGrblHALEEPROM.LONGMILL_MK1_12x30],
				[12, longMillGrblEEPROM.LONGMILL_MK1_30x30, longMillGrblHALEEPROM.LONGMILL_MK1_30x30],
				[13, longMillGrblEEPROM.LONGMILL_MK1_48x30, longMillGrblHALEEPROM.LONGMILL_MK1_48x30],
			];

			for (const [id, grbl, grblHAL] of cases) {
				const profile = byId(id);
				expect(profile.eepromSettings).toBe(grbl);
				expect(profile.grblHALeepromSettings).toBe(grblHAL);
			}
		});

		it("Mill One V1 and V2 (ids 15,16) share the same combined EEPROM settings", () => {
			const v1 = byId(15);
			const v2 = byId(16);
			expect(v1.eepromSettings).toBe(millOneGrblEEPROM.MILL_ONE_V1_AND_V2);
			expect(v2.eepromSettings).toBe(millOneGrblEEPROM.MILL_ONE_V1_AND_V2);
		});

		it("Mill One V3 (id 17) uses its own distinct EEPROM settings", () => {
			const v3 = byId(17);
			expect(v3.eepromSettings).toBe(millOneGrblEEPROM.MILL_ONE_V3);
			expect(v3.eepromSettings).not.toBe(millOneGrblEEPROM.MILL_ONE_V1_AND_V2);
		});

		it("Mill One profiles do not define grblHALeepromSettings (grbl-only machine)", () => {
			expect(byId(15).grblHALeepromSettings).toBeUndefined();
			expect(byId(16).grblHALeepromSettings).toBeUndefined();
			expect(byId(17).grblHALeepromSettings).toBeUndefined();
		});
	});

	describe("third-party and generic machines", () => {
		const thirdPartyNames = [
			"Generic CNC",
			"Shapeoko",
			"X-Carve",
			"Nomad",
			"Onefinity",
			"OpenBuilds",
			"Ooznest",
			"MillRight",
			"CNC4newbie",
			"BobsCNC",
			"YoraHome",
			"SainSmart",
			"WhittleCNC",
			"Evo-One",
		];

		it("has an entry for every expected third-party machine name", () => {
			const names = (machineProfiles as any[]).map((p) => p.name);
			for (const name of thirdPartyNames) {
				expect(names).toContain(name);
			}
		});

		it("third-party machines have an empty company field (not attributed to Sienci Labs)", () => {
			for (const name of thirdPartyNames) {
				const profile = (machineProfiles as any[]).find(
					(p) => p.name === name,
				);
				expect(profile.company).toBe("");
			}
		});

		it("third-party machines do not define eepromSettings", () => {
			for (const name of thirdPartyNames) {
				const profile = (machineProfiles as any[]).find(
					(p) => p.name === name,
				);
				expect(profile.eepromSettings).toBeUndefined();
			}
		});
	});

	it("all Sienci-designed machines (AltMill, LongMill, Mill One) are attributed to Sienci Labs", () => {
		const sienciNames = ["AltMill", "LongMill", "Mill One"];
		for (const profile of machineProfiles as any[]) {
			if (sienciNames.some((n) => profile.name.startsWith(n))) {
				expect(profile.company).toBe("Sienci Labs");
			}
		}
	});
});