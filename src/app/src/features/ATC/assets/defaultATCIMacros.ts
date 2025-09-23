export type Macro = {
    name: string;
    content: string;
};

const defaultMacros: Macro[] = [];

export const defaultATCIMacros = {
    version: 20250909,
    variables: {
        _ort_offset_mode: {},
        _irt_offset_mode: {},
        _tc_rack_enable: {},
        _tc_slots: {},
        _passthrough_offset_setting: {},
        _pres_sense: {},
        _holder_sense: {},
    },
    variableFile: 'P100.macro',
    macros: defaultMacros,
};
