import { ConfigState } from 'app/features/ATC/components/Configuration/hooks/useConfigStore.tsx';

export interface Macro {
    name: string;
    raw: string;
    data: Blob;
    size: number;
}

function calculateOffsetValue(data: Partial<ConfigState>) {}

export function generateP100(config: ConfigState): Macro {
    const content = [
        `#<_tc_slots> = ${config.toolRack.numberOfSlots}`,
        `#<_tc_rack_enable> = ${config.toolRack.enabled}`,
        `#<_tc_pres_sense> = ${config.advanced.checkPressure}`,
        `#<_tc_holder_sense> = ${config.advanced.checkToolPresence}`,
        `#<_passthrough_offset_setting> = ${config.toolRack.retainToolSettings}`,
        `#<_ort_offset_mode> = `,
        `#<_irt_offset_mode> = `,
        `(msg, atci:rack_size:${config.toolRack.numberOfSlots})`,
    ].join('\n');
    const data = new Blob([content]);

    return {
        name: 'P100.macro',
        raw: content,
        data,
        size: data.size,
    };
}

export function generateAllMacros(config: ConfigState) {
    const macros: Macro[] = [];
    macros.push(generateP100(config));
    return macros;
}

export function generateATCIJSON(config: ConfigState): object {
    return {};
}
