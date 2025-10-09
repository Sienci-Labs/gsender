import {
    ConfigState,
    OffsetManagement,
} from 'app/features/ATC/components/Configuration/hooks/useConfigStore.tsx';
import store from 'app/store';
import {
    ATCIJSON,
    ATCIMacroConfig,
} from 'app/features/ATC/assets/defaultATCIMacros.ts';

export interface Macro {
    name: string;
    data: Blob;
    size: number;
    content?: string;
}

function calculateOffsetValue(data: OffsetManagement): number {
    let count = 0;
    if (data.probeNewOffset) {
        count++;
    }
    if (data.verifyToolLength) {
        count++;
    }
    return count;
}

export function generateP100(config: ConfigState): Macro {
    const content = [
        `#<_tc_slots> = ${config.toolRack.numberOfSlots}`,
        `#<_tc_rack_enable> = ${config.toolRack.enabled}`,
        `#<_pres_sense> = ${config.advanced.checkPressure}`,
        `#<_holder_sense> = ${config.advanced.checkToolPresence}`,
        `#<_tc_slot_offset> = ${config.toolRack.slotOffset}`,
        `#<_passthrough_offset_setting> = ${config.toolRack.retainToolSettings}`,
        `#<_ort_offset_mode> = ${calculateOffsetValue(config.offsetManagement)}`,
        `#<_irt_offset_mode> = ${calculateOffsetValue(config.toolRack)}`,
        `(msg, ATCI|rack_size:${config.toolRack.numberOfSlots})`,
    ].join('\n');
    const data = new Blob([content]);

    return {
        name: 'P100.macro',
        data,
        content,
        size: data.size,
    };
}

export function getTemplateMacros(): Macro[] {
    const macros = store.get('widgets.atc.templates.macros', []);
    const blobs: Macro[] = [];
    macros.forEach((macro: Macro) => {
        let data: Macro = {
            name: '',
            data: new Blob([]),
            size: 0,
        };

        data.name = macro.name;
        data.data = new Blob([macro.content]);
        data.size = data.data.size;
        blobs.push(data);
    });
    return blobs;
}

export function generateAllMacros(config: ConfigState) {
    const macros: Macro[] = [];

    const atciContent = generateATCIJSON(config);

    macros.push(generateP100(config));
    macros.push(...getTemplateMacros());
    macros.push(writeableATCIConfig(atciContent));

    return macros;
}

export function writeableATCIConfig(json: ATCIJSON): Macro {
    const data = new Blob([JSON.stringify(json) + '\n']);
    return {
        name: 'ATCI.json',
        data,
        size: data.size,
    };
}

export function populateATCIVariables(variables, config: ConfigState) {
    const populatedVariables = { ...variables };

    console.log(populatedVariables);
    // Grab values from config
    populatedVariables._tc_slots.value = config.toolRack.numberOfSlots;
    populatedVariables._tc_rack_enable.value = config.toolRack.enabled;
    populatedVariables._pres_sense.value = config.advanced.checkPressure;
    populatedVariables._holder_sense.value = config.advanced.checkToolPresence;
    populatedVariables._tc_slot_offset.value = config.toolRack.slotOffset;
    populatedVariables._tc_rack_enable.value = config.toolRack.enabled;
    populatedVariables._passthrough_offset_setting.value =
        config.toolRack.retainToolSettings;

    populatedVariables._irt_offset_mode.value = calculateOffsetValue(
        config.toolRack,
    );
    populatedVariables._ort_offset_mode.value = calculateOffsetValue(
        config.offsetManagement,
    );
    return populatedVariables;
}

export function generateATCIJSON(config: ConfigState): ATCIJSON {
    const templateConfig: ATCIMacroConfig = store.get(
        'widgets.atc.templates',
        {},
    );

    console.log('OG', templateConfig);

    let variables = populateATCIVariables(templateConfig.variables, config);

    const files = templateConfig.macros.map((macro) => macro.name);

    return {
        version: templateConfig.version,
        variableFile: 'P100.macro',
        variables,
        files,
    };
}
