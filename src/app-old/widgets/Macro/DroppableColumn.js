import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';

import TooltipCustom from 'app/components/TooltipCustom/ToolTip';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';

import MacroItem from './MacroItem';

const DroppableColumn = ({ droppableId, macros, actions, disabled }) => {
    const getListStyle = () => ({
        padding: 8,
        width: '100%',
        display: 'grid',
        gridAutoRows: 'min-content',
        gap: 5,
    });

    const getItemStyle = (isDragging, draggableStyle) => ({
        ...draggableStyle
    });

    const handleRunMacro = (macro) => {
        if (disabled) {
            return;
        }

        const { id, name } = macro;
        actions.runMacro(id, { name });
    };

    const handleEditMacro = (macro) => (event) => {
        actions.openEditMacroModal(macro.id);
    };

    const handleDeleteMacro = (macroID) => {
        actions.deleteMacro(macroID);
    };

    const onDeleteClick = ({ name, id }) => {
        Confirm({
            title: 'Delete Macro',
            content: (
                <>
                    <p>Are you sure you want to delete this macro?</p>
                    <p><strong>{name}</strong></p>
                </>
            ),
            confirmLabel: 'Delete',
            onConfirm: () => handleDeleteMacro(id),
        });
    };

    return (
        <Droppable
            droppableId={droppableId}
        >
            {(provided, snapshot) => (
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
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
                                >
                                    {
                                        macro.description.trim() !== ''
                                            ? (
                                                <TooltipCustom content={macro.description} location="default">
                                                    <MacroItem
                                                        key={macro.id}
                                                        macro={macro}
                                                        onRun={handleRunMacro}
                                                        onEdit={handleEditMacro}
                                                        onDelete={() => onDeleteClick({ name: macro.name, id: macro.id })}
                                                        disabled={disabled}
                                                    />
                                                </TooltipCustom>
                                            )
                                            : (
                                                <MacroItem
                                                    key={macro.id}
                                                    macro={macro}
                                                    onRun={handleRunMacro}
                                                    onEdit={handleEditMacro}
                                                    onDelete={() => onDeleteClick({ name: macro.name, id: macro.id })}
                                                    disabled={disabled}
                                                />
                                            )
                                    }
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
