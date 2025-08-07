import { toast } from 'app/lib/toaster';
import store from 'app/store';
import get from 'lodash/get';
import controller from 'app/lib/controller.ts';
import {
    IToolListing,
    ToolInstance,
} from 'app/features/ATC/components/ToolTable.tsx';
import { FIXED_RACK_SIZE } from 'app/features/ATC/utils/ATCiConstants.ts';

export function unimplemented() {
    toast.info('Unimplemented :(');
}

export function mapToolNicknamesAndStatus(
    tools: IToolListing,
    rackSize: number = 0,
): ToolInstance[] {
    const toolsArray: ToolInstance[] = [];

    if (!tools) {
        return [];
    }

    Object.values(tools).forEach((tool) => {
        tool = { ...tool };
        tool.nickname = lookupToolName(tool.id);
        if (tool.toolOffsets.z < 0) {
            tool.status = 'probed';
        } else {
            tool.status = 'unprobed';
        }
        if (tool.id > rackSize) {
            tool.status = 'offrack';
        }
        toolsArray.push(tool);
    });
    return toolsArray;
}

function setToolStatus(tool: ToolInstance, rackSize): ToolInstance {
    if (tool.toolOffsets.z < 0) {
        tool.status = 'probed';
    } else {
        tool.status = 'unprobed';
    }
    if (tool.id > rackSize) {
        tool.status = 'offrack';
    }
    return tool;
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

export function lookupSpecificTool(
    toolID = -1,
    toolTable = {},
    rackSize,
): ToolInstance {
    let tool = Object.values(toolTable).find((tool) => tool.id === toolID);
    if (!tool) {
        return null;
    }
    tool = { ...tool };
    tool.nickname = lookupToolName(tool.id);
    tool = setToolStatus(tool, rackSize);
    return tool;
}

export function getToolAxisOffset(tool, axis, table: ToolInstance[]): string {
    const tableTool = table.find((tool) => tool.id === tool);
    if (!tableTool) {
        return 'Empty';
    }

    return get(tableTool, `toolOffsets.${axis}`, '-') as string;
}

export function unloadTool() {
    controller.command('gcode', ['M6T0', '$#']);
}

export function releaseToolFromSpindle() {
    controller.command('gcode', ['G65 P900', '$#']);
}

export function loadTool(toolID) {
    console.log('Load called');
    controller.command('gcode', [`M6 T${toolID}`]);
}

export function loadAndSaveToRack(toolID) {
    console.log('Load and Save called');
    controller.command('gcode', [`G65 P901 Q${toolID}`, '$#']);
}

export function saveToRack(toolID) {
    console.log('Save called');
    controller.command('gcode', [`G65 P902 Q${toolID}`, '$#']);
}

export type LoadToolMode = 'load' | 'save' | 'loadAndSave';
