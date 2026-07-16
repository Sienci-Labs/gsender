import get from 'lodash/get';

import { GRBLHAL } from 'app/constants';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { RootState } from 'app/store/redux';

/*
 * grblHAL clears the applied tool length offset on a cold start, but the tool table and
 * (with $485) the current tool number both survive in NVS. The controller then reports a
 * tool with a known length while G49 is active, so the work Z the DRO shows is short by
 * that tool's offset until something issues a G43. Nothing re-applies it automatically -
 * that is what a startup line ($N0=G43) or a tool change macro is for.
 */
export function useToolOffsetApplied(): boolean {
    const controllerType = useTypedSelector(
        (state: RootState) => state.controller.type,
    );
    const hasHomed = useTypedSelector(
        (state: RootState) => state.controller.hasHomed,
    );
    const tlo = useTypedSelector((state: RootState) => state.controller.modal.tlo);
    const currentTool = useTypedSelector(
        (state: RootState) => state.controller.state.status?.currentTool,
    );
    const toolTable = useTypedSelector(
        (state: RootState) => state.controller.settings.toolTable,
    );

    // Only warn on a G49 we have actually seen in a parser state report. G43.1/G43.2 apply
    // an offset the tool table knows nothing about, and an undefined tlo means no $G reply
    // has landed yet, so neither is grounds for calling the offset missing.
    if (controllerType !== GRBLHAL || !hasHomed || tlo !== 'G49') {
        return true;
    }

    if (!currentTool || currentTool <= 0) {
        return true;
    }

    const toolLength = Number(
        get(toolTable, [currentTool, 'toolOffsets', 'z'], 0),
    );

    // A zero or unreadable length gives us nothing to warn about
    return !toolLength;
}
