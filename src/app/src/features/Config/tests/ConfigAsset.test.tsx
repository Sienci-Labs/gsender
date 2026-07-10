import { BOARD_PROFILES, getBoardProfile } from "app/definitions/BoardProfiles.ts";

// NOTE: adjust the import path above to match wherever this file actually
// lives in the project (e.g. app/features/Config/assets/BoardProfiles.ts).

describe("BOARD_PROFILES / getBoardProfile", () => {
	// ---- getBoardProfile ----

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

	// ---- BOARD_PROFILES data integrity ----

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