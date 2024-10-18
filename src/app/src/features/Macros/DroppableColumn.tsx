import {
    Droppable,
    Draggable,
    DroppableProvided,
    DroppableStateSnapshot,
    DraggableProvided,
    DraggableStateSnapshot,
} from 'react-beautiful-dnd';

import Tooltip from 'app/components/ToolTip';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';

import MacroItem from './MacroItem';

interface Macro {
    id: string;
    name: string;
    description: string;
}

interface Actions {
    runMacro: (id: string, options: { name: string }) => void;
    openEditMacroModal: (id: string) => void;
    deleteMacro: (id: string) => void;
}

interface DroppableColumnProps {
    droppableId: string;
    macros: Macro[];
    actions: Actions;
    disabled: boolean;
}

const DroppableColumn = ({
    droppableId,
    macros,
    actions,
    disabled,
}: DroppableColumnProps) => {
    const getListStyle = (_isDraggingOver: boolean) => ({
        width: '100%',
        display: 'grid',
        gridAutoRows: 'min-content',
        gap: 4,
    });

    const getItemStyle = (
        _isDragging: boolean,
        draggableStyle: React.CSSProperties,
    ) => ({
        ...draggableStyle,
    });

    const handleRunMacro = (macro: Macro) => {
        if (disabled) {
            return;
        }

        const { id, name } = macro;
        actions.runMacro(id, { name });
    };

    const handleEditMacro = (macro: Macro) => {
        actions.openEditMacroModal(macro.id);
    };

    const handleDeleteMacro = (macroID: string) => {
        actions.deleteMacro(macroID);
    };

    const onDeleteClick = ({ name, id }: { name: string; id: string }) => {
        Confirm({
            title: 'Delete Macro',
            content: (
                <>
                    <p>Are you sure you want to delete this macro?</p>
                    <p>
                        <strong>{name}</strong>
                    </p>
                </>
            ),
            confirmLabel: 'Delete',
            onConfirm: () => handleDeleteMacro(id),
        });
    };

    return (
        <Droppable droppableId={droppableId}>
            {(
                provided: DroppableProvided,
                snapshot: DroppableStateSnapshot,
            ) => (
                <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    style={getListStyle(snapshot.isDraggingOver)}
                >
                    {macros.map((macro, index) => (
                        <Draggable
                            key={macro.id}
                            draggableId={macro.id}
                            index={index}
                        >
                            {(
                                provided: DraggableProvided,
                                snapshot: DraggableStateSnapshot,
                            ) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={getItemStyle(
                                        snapshot.isDragging,
                                        provided.draggableProps.style || {},
                                    )}
                                >
                                    {macro.description.trim() !== '' ? (
                                        <Tooltip
                                            content={macro.description}
                                            location="default"
                                        >
                                            <MacroItem
                                                key={macro.id}
                                                macro={macro}
                                                onRun={handleRunMacro}
                                                onEdit={handleEditMacro}
                                                onDelete={() =>
                                                    onDeleteClick({
                                                        name: macro.name,
                                                        id: macro.id,
                                                    })
                                                }
                                                disabled={disabled}
                                            />
                                        </Tooltip>
                                    ) : (
                                        <MacroItem
                                            key={macro.id}
                                            macro={macro}
                                            onRun={handleRunMacro}
                                            onEdit={handleEditMacro}
                                            onDelete={() =>
                                                onDeleteClick({
                                                    name: macro.name,
                                                    id: macro.id,
                                                })
                                            }
                                            disabled={disabled}
                                        />
                                    )}
                                </div>
                            )}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    );
};

export default DroppableColumn;
