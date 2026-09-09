import { useAutoSpinWizard } from "app/features/AccessoryInstaller/Wizards/autospin/AutoSpin.tsx";
import { useSienciATCWizard } from "app/features/AccessoryInstaller/Wizards/atc/ATC.tsx";
import { useSienciSpindle } from "app/features/AccessoryInstaller/Wizards/spindle/Spindle.tsx";
import { useSienciTLSWizard } from "app/features/AccessoryInstaller/Wizards/tls/TLS.tsx";
import { useMemo } from "react";

export function useAllWizards() {
	const atc = useSienciATCWizard();
	const spindle = useSienciSpindle();
	const tls = useSienciTLSWizard();
	const autospin = useAutoSpinWizard();
	return useMemo(
		() => [atc, spindle, tls, autospin],
		[atc, spindle, tls, autospin],
	);
}
