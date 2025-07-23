import { toast } from 'app/lib/toaster';
import store from 'app/store';
import get from 'lodash/get';
import controller from 'app/lib/controller.ts';

export function unimplemented() {
    toast.info('Unimplemented :(');
}

export function lookupToolName(id: number): string {
    return store.get(`widgets.atc.toolMap.${id}`, '-');
}

export function setToolName(id, value) {
    let toolMap = store.get(`widgets.atc.toolMap`);
    toolMap = {
        ...toolMap,
        [id]: value,
    };
    store.set(`widgets.atc.toolMap`, toolMap);
}

export function getToolAxisOffset(tool, axis, table): string {
    const tableTool = get(table, `${tool}`);
    if (!tableTool) {
        return 'Empty';
    }

    return get(tableTool, `toolOffsets.${axis}`, '-');
}

export function unloadTool() {
    controller.command('gcode', ['M6T0', '$#']);
}
