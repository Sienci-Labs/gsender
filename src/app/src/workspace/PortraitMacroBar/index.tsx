import { useState, useEffect, useCallback } from 'react';
import { useMediaQuery } from 'react-responsive';
import cx from 'classnames';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaGripVertical } from 'react-icons/fa';

import api from 'app/api';
import controller from 'app/lib/controller';
import { toast } from 'app/lib/toaster';
import { WORKFLOW_STATE_IDLE, WORKFLOW_STATE_PAUSED } from 'app/constants';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';

type MacroItem = {
    id: string;
    name: string;
    description: string;
};

function MacroButtonInner({
    macro,
    canRun,
    onClick,
    className,
}: {
    macro: MacroItem;
    canRun: boolean;
    onClick?: () => void;
    className?: string;
}) {
    return (
        <button
            onClick={onClick}
            disabled={!canRun}
            className={cx(
                'w-full px-4 py-3 rounded-lg text-base font-semibold h-14 line-clamp-2',
                'border-2 transition-colors duration-150',
                canRun
                    ? 'bg-white dark:bg-dark-lighter border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-200 dark:bg-dark-lighter border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed',
                className,
            )}
        >
            {macro.name}
        </button>
    );
}

function SortableMacroButton({
    macro,
    canRun,
    onRun,
    isDragging,
}: {
    macro: MacroItem;
    canRun: boolean;
    onRun: (macro: MacroItem) => void;
    isDragging?: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: macro.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cx('relative w-full', isDragging && 'invisible')}
        >
            <MacroButtonInner macro={macro} canRun={canRun} onClick={() => onRun(macro)} />
            <div
                {...attributes}
                {...listeners}
                className={cx(
                    'absolute top-1 left-1 p-1 rounded cursor-grab active:cursor-grabbing',
                    'text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400',
                    'touch-none',
                )}
                title="Drag to reorder"
            >
                <FaGripVertical className="w-4 h-4" />
            </div>
        </div>
    );
}

export const PortraitMacroBar = () => {
    const isPortrait = useMediaQuery({ query: '(orientation: portrait)' });
    const { portraitMacroBar: enabled = false } = useWorkspaceState();
    const isConnected = useTypedSelector(
        (state) => state.connection.isConnected,
    );
    const workflow = useTypedSelector(
        (state) => state.controller.workflow,
    );
    const [macros, setMacros] = useState<MacroItem[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    );

    useEffect(() => {
        if (!isPortrait || !enabled) return;

        const fetchMacros = async () => {
            try {
                const res = await api.macros.fetch();
                const records = res?.data?.records ?? [];
                setMacros(records);
            } catch {
                // silently ignore
            }
        };

        fetchMacros();

        const interval = setInterval(fetchMacros, 3000);
        return () => clearInterval(interval);
    }, [isPortrait, enabled]);

    const canRun = isConnected && (workflow.state === WORKFLOW_STATE_IDLE || workflow.state === WORKFLOW_STATE_PAUSED);

    const handleRun = useCallback(
        (macro: MacroItem) => {
            if (!canRun) return;
            controller.command('macro:run', macro.id, controller.context, (err: Error | null) => {
                if (err) {
                    toast.error(`Failed to run macro "${macro.name}"`, { position: 'bottom-right' });
                    return;
                }
                toast.info(`Started running macro "${macro.name}"!`, { position: 'bottom-right' });
            });
        },
        [canRun],
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id);
    }, []);

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            setActiveId(null);
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            setMacros((items) => {
                const oldIndex = items.findIndex((m) => m.id === active.id);
                const newIndex = items.findIndex((m) => m.id === over.id);
                const reordered = arrayMove(items, oldIndex, newIndex);

                // persist new order to server
                reordered.forEach((macro, index) => {
                    api.macros.update(macro.id, { rowIndex: index });
                });

                return reordered;
            });
        },
        [],
    );

    const handleDragCancel = useCallback(() => {
        setActiveId(null);
    }, []);

    if (!isPortrait || !enabled || macros.length === 0) return null;

    const activeMacro = activeId ? macros.find((m) => m.id === activeId) : null;

    return (
        <div className="z-50 border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-dark px-2 py-2 max-xl:px-1 max-xl:py-1 overflow-y-auto max-h-[160px] rounded-lg">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <SortableContext items={macros.map((m) => m.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-5 gap-2">
                        {macros.map((macro) => (
                            <SortableMacroButton
                                key={macro.id}
                                macro={macro}
                                canRun={canRun}
                                onRun={handleRun}
                                isDragging={macro.id === activeId}
                            />
                        ))}
                    </div>
                </SortableContext>
                <DragOverlay>
                    {activeMacro ? (
                        <MacroButtonInner macro={activeMacro} canRun={canRun} />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};
