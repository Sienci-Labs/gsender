import mountingGcode4x8Url from "app/features/AccessoryInstaller/Wizards/vacuum-table/assets/gcode/4x8HoleMounts.gcode?url";

interface MountingGcodeAsset {
	url: string;
	name: string;
}

export const MOUNTING_GCODE_BY_SIZE: Record<string, MountingGcodeAsset> = {
	"4x8": {
		url: mountingGcode4x8Url,
		name: "gSender_Vacuum_Table_Mounting_4x8",
	},
};
