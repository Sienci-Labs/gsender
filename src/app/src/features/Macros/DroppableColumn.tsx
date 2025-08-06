import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';

import MacroItem from './MacroItem';

type Macro = {
    id: string;
    name: string;
    description: string;
    column: string;
};

export type Actions = {
    runMacro: (id: string, options: { name: string }) => void;
    openEditMacroModal: (id: string) => void;
    deleteMacro: (id: string) => void;
};

type DroppableColumnProps = {
    droppableId: string;
    macros: Macro[];
    actions: Actions;
    disabled: boolean;
};

const SortableMacroItem = ({
    macro,
    actions,
    disabled,
}: {
    macro: Macro;
    actions: Actions;
    disabled: boolean;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: macro.id, data: { column: macro.column } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative' as const,
    };

    const handleRunMacro = () => {
        if (disabled) {
            return;
        }

        const { id, name } = macro;
        actions.runMacro(id, { name });
    };

    const handleEditMacro = () => {
        actions.openEditMacroModal(macro.id);
    };

    const handleDeleteMacro = () => {
        actions.deleteMacro(macro.id);
    };

    const onDeleteClick = () => {
        Confirm({
            title: 'Delete Macro',
            content: (
                <>
                    <p>Are you sure you want to delete this macro?</p>
                    <p>
                        <strong>{macro.name}</strong>
                    </p>
                </>
            ),
            confirmLabel: 'Delete',
            onConfirm: handleDeleteMacro,
        });
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <MacroItem
                key={macro.id}
                macro={macro}
                onRun={handleRunMacro}
                onEdit={handleEditMacro}
                onDelete={onDeleteClick}
                disabled={disabled}
            />
        </div>
    );
};

const DroppableColumn = ({
    droppableId,
    macros,
    actions,
    disabled,
}: DroppableColumnProps) => {
    const { setNodeRef } = useDroppable({
        id: droppableId,
        data: { column: droppableId },
    });

    return (
        <div
            ref={setNodeRef}
            className="w-full grid gap-1"
            style={{ gridAutoRows: 'min-content' }}
        >
            {macros.map((macro) => (
                <SortableMacroItem
                    key={macro.id}
                    macro={macro}
                    actions={actions}
                    disabled={disabled}
                />
            ))}
        </div>
    );
};

export default DroppableColumn;
