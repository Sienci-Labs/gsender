import { ConfigState } from 'app/features/ATC/components/Configuration/hooks/useConfigStore.tsx';

export interface Macro {
    name: string;
    raw: string;
    data: Blob;
    size: number;
}

export function generateP100(config: ConfigState): Macro {
    const content = [].join('\n');
    const data = new Blob([content]);

    return {
        name: 'P100.macro',
        raw: content,
        data,
        size: data.size,
    };
}

export function generateAllMacros(config: ConfigState) {
    return [];
}

export function generateATCIJSON(config: ConfigState): object {
    return {};
}
