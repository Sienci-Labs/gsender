import { useEffect, useRef, useState } from 'react';
import { Download, Table2, Upload } from 'lucide-react';
import pubsub from 'pubsub-js';
import get from 'lodash/get';

import { ToolchangeProvider, useToolChange } from 'app/features/ATC/utils/ToolChangeContext.tsx';
import { ToolDisplay } from 'app/features/ATC/components/ToolDisplay.tsx';
import { ToolTable } from 'app/features/ATC/components/ToolTable.tsx';
import { ToolTimelineItem } from 'app/features/ATC/components/ToolTimeline/components/ToolTimelineItem.tsx';
import { ToolChange } from 'app/features/ATC/components/ToolTimeline/components/types.ts';
import { ATCUnavailable } from 'app/features/ATC/components/ATCUnavailable.tsx';
import { ATCStartValidations } from 'app/features/ATC/components/ATCStartValidations.tsx';
import { ToolRemapDialog } from 'app/features/ATC/components/ToolTimeline/components/ToolRemapDialog.tsx';
import { getATCUnavailablePayload } from 'app/features/ATC/utils';
import {
    unloadTool, releaseToolFromSpindle,
    getToolpathColor, mapToolNicknamesAndStatus,
} from 'app/features/ATC/utils/ATCFunctions.ts';
import { updateToolchangeContext } from 'app/features/Helper/Wizard.tsx';
import { LongPressButton } from '@gsender/ui/primitives/LongPressButton';
import { Dialog, DialogContent } from '@gsender/ui/shadcn/Dialog.tsx';
import { DialogTitle } from '@radix-ui/react-dialog';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import { RootState } from '@gsender/controller-client/store/redux';
import controller from '@gsender/controller-client/controller';
import { WORKFLOW_STATE_IDLE } from 'app/constants';

type DrawerMode = 'closed' | 'minimal' | 'expanded';

type ToolMapping = Map<number, number>;

function buildToolArray(toolEvents: Record<string, any>, fileLength: number): ToolChange[] {
    let count = 0;
    const toolArray: ToolChange[] = [];

    Object.entries(toolEvents).forEach(([line, value]) => {
        if (Object.hasOwn(value, 'M') && Object.hasOwn(value, 'T')) {
            const legendColor = getToolpathColor(count);
            toolArray.push({
                toolNumber: value.T,
                startLine: Number(line),
                label: `T${value.T}`,
                color: `#${legendColor.getHexString()}`,
                index: count + 1,
            });
            count++;
        }
    });

    if (toolArray.length === 0) return [];
    if (toolArray.length === 1) {
        toolArray[0].endLine = fileLength;
    } else {
        toolArray[toolArray.length - 1].endLine = fileLength;
        for (let i = toolArray.length - 2; i >= 0; i--) {
            toolArray[i].endLine = toolArray[i + 1].startLine - 1;
        }
    }
    return toolArray;
}

function ATCContent({ mode }: { mode: DrawerMode }) {
    const {
        atcAvailable, connected, disabled, tools,
        showTable, setShowTable,
        setLoadToolMode, setLoadToolOpen,
        rackSize,
    } = useToolChange();

    const [showValidator, setShowValidator] = useState(false);
    const [validationPayload, setValidationPayload] = useState({});
    const [timelineTools, setTimelineTools] = useState<ToolChange[]>([]);
    const [activeToolIndex, setActiveToolIndex] = useState(0);
    const [mappings, setMappings] = useState<ToolMapping>(new Map());
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedTool, setSelectedTool] = useState<number>(0);
    const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

    const isHomed = useTypedSelector((s: RootState) => s.controller.hasHomed);
    const fileLoaded = useTypedSelector((s: RootState) => s.file.fileLoaded);
    const linesReceived = useTypedSelector((s: RootState) => get(s, 'controller.sender.status.received', 0));
    const workflowState = useTypedSelector((s: RootState) => s.controller.workflow.state);
    const toolTableData = useTypedSelector((s: RootState) => s.controller.settings.toolTable);
    const settings = useTypedSelector((s: RootState) => s.controller.settings);
    const reportedRackSize = Number(get(settings, 'atci.rack_size', -1));
    const effectiveRackSize = reportedRackSize > 0 ? reportedRackSize : Object.values(toolTableData || {}).length;
    const toolTable = mapToolNicknamesAndStatus(toolTableData, effectiveRackSize);
    const remapDisabled = workflowState !== WORKFLOW_STATE_IDLE;
    const allowManualBadge = connected && atcAvailable;

    useEffect(() => {
        const token = pubsub.subscribe('atc_validator', (_k, payload) => {
            setValidationPayload(payload);
            setShowValidator(true);
        });
        return () => { pubsub.unsubscribe(token); };
    }, []);

    useEffect(() => {
        const token = pubsub.subscribe('file:toolchanges', (_k, { toolEvents, total }) => {
            const arr = buildToolArray(toolEvents, total);
            setTimelineTools(arr);
            setActiveToolIndex(0);
            setMappings(new Map());
        });
        const onJobStop = () => setActiveToolIndex(0);
        controller.addListener('job:stop', onJobStop);
        return () => {
            pubsub.unsubscribe(token);
            controller.removeListener('job:stop', onJobStop);
        };
    }, []);

    useEffect(() => {
        if (!fileLoaded) {
            setTimelineTools([]);
            setActiveToolIndex(0);
        }
    }, [fileLoaded]);

    useEffect(() => {
        if (timelineTools.length === 0) return;
        const active = timelineTools[activeToolIndex];
        if (active && linesReceived > active.endLine) {
            setActiveToolIndex((i) => Math.min(i + 1, timelineTools.length - 1));
        }
    }, [linesReceived]);

    // Scroll active item into view when expanded
    useEffect(() => {
        if (mode !== 'expanded') return;
        itemRefs.current[activeToolIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [activeToolIndex, mode]);

    const handleRemapClick = (toolNumber: number) => {
        setSelectedTool(toolNumber);
        setDialogOpen(true);
    };

    const handleConfirmRemap = (fromTool: number, toTool: number) => {
        setMappings((prev) => {
            const next = new Map(prev);
            if (fromTool === toTool) { next.delete(fromTool); } else { next.set(fromTool, toTool); }
            updateToolchangeContext(next);
            return next;
        });
    };

    const openToolTable = () => {
        if (!connected) return;
        controller.command('gcode', ['$#']);
        setShowTable(true);
    };

    const unavailablePayload = getATCUnavailablePayload({
        isConnected: connected,
        isATCAvailable: atcAvailable,
        isHomed,
    });

    if (unavailablePayload !== null) {
        return <ATCUnavailable payload={unavailablePayload} />;
    }

    const handleLoad = () => { setLoadToolMode('load'); setLoadToolOpen(true); };
    const handleManualLoad = () => { setLoadToolMode('manual'); setLoadToolOpen(true); };

    return (
        <div className={`flex flex-col gap-3 px-3 py-2 h-full min-h-0 ${mode === 'minimal' ? 'justify-center' : ''}`}>
            <ATCStartValidations show={showValidator} setShow={setShowValidator} payload={validationPayload} />

            {/* Tool Table dialog — controlled by context showTable */}
            <Dialog open={showTable} onOpenChange={(open) => { if (!open) setShowTable(false); }}>
                <DialogTitle className="sr-only">Tool Table</DialogTitle>
                <DialogContent className="overflow-hidden p-0 shadow-lg w-3/5 portrait:w-4/5">
                    <div className="flex flex-col bg-white dark:bg-dark-darker overflow-y-auto h-full p-4 gap-4">
                        <ToolTable tools={tools} disabled={disabled} />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Remap dialog */}
            <ToolRemapDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                originalTool={selectedTool}
                allTools={toolTable}
                onConfirm={handleConfirmRemap}
            />

            {/* Top row: tool info (flex-1) + Tools button */}
            <div className="flex gap-3 shrink-0">
                <div className="flex-1 min-w-0">
                    <ToolDisplay />
                </div>
                <button
                    type="button"
                    onClick={openToolTable}
                    disabled={disabled}
                    className="w-48 shrink-0 flex flex-col items-center justify-center gap-1.5 rounded-xl border border-gray-300 dark:border-dark-lighter bg-gray-50 dark:bg-dark text-gray-600 dark:text-gray-300 text-xs font-medium disabled:opacity-40 disabled:cursor-default transition-colors hover:bg-gray-100 dark:hover:bg-dark-lighter"
                >
                    <Table2 className="w-5 h-5" />
                    <span>Tools</span>
                </button>
            </div>

            {/* Expanded: Load/Unload + tool timeline */}
            {mode === 'expanded' && (
                <>
                    <div className="grid grid-cols-2 gap-2 shrink-0">
                        <LongPressButton
                            disabled={disabled}
                            label="Load"
                            icon={<Download className="h-5 w-5" />}
                            onClick={handleLoad}
                            onLongPress={handleManualLoad}
                        />
                        <LongPressButton
                            disabled={disabled}
                            label="Unload"
                            icon={<Upload className="h-5 w-5" />}
                            onClick={unloadTool}
                            onLongPress={releaseToolFromSpindle}
                        />
                    </div>

                    <div className="border-t border-gray-200 dark:border-dark-lighter shrink-0" />

                    <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide shrink-0">
                        Tool Timeline
                    </p>

                    {timelineTools.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-gray-500">No tool changes in loaded file.</p>
                    ) : (
                        <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
                            {timelineTools.map((tool, index) => {
                                const isRemapped = mappings.has(tool.toolNumber);
                                const remapValue = mappings.get(tool.toolNumber);
                                const lookupId = isRemapped && remapValue !== undefined ? remapValue : tool.toolNumber;
                                const toolInfo = toolTable.find((t) => t.id === lookupId);
                                const probeState = toolInfo?.status ?? 'unprobed';
                                const isManual = allowManualBadge
                                    ? toolInfo?.isManual ?? (effectiveRackSize > 0 ? lookupId > effectiveRackSize : false)
                                    : false;
                                return (
                                    <div key={`${tool.index}-${tool.toolNumber}-${tool.startLine ?? index}`} ref={(el) => { itemRefs.current[index] = el; }}>
                                        <ToolTimelineItem
                                            tool={tool}
                                            isActive={index === activeToolIndex}
                                            isLast={index === timelineTools.length - 1}
                                            progress={index === activeToolIndex ? 0 : 0}
                                            handleRemap={() => handleRemapClick(tool.toolNumber)}
                                            isRemapped={isRemapped}
                                            remapValue={remapValue}
                                            isManual={isManual}
                                            probeState={probeState}
                                            canRemap={allowManualBadge}
                                            remapDisabled={remapDisabled}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default function ATCPanel({ mode }: { mode: DrawerMode }) {
    return (
        <ToolchangeProvider>
            <ATCContent mode={mode} />
        </ToolchangeProvider>
    );
}
