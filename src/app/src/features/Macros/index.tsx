import React, { useState, useEffect, useRef } from 'react';
import get from 'lodash/get';
import { connect } from 'react-redux';
import includes from 'lodash/includes';
import _ from 'lodash';
import { FaPlus, FaFileImport, FaFileExport } from 'react-icons/fa';

import api from 'app/api';
import store from 'app/store';
import Widget from 'app/components/Widget';
import controller from 'app/lib/controller';
import combokeys from 'app/lib/combokeys';
import log from 'app/lib/log';
import Button from 'app/components/Button';
import Macro from './Macro';
import MacroForm from './MacroForm';
import {
    // Grbl
    GRBL,
    GRBLHAL,
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_RUN,
    // Marlin
    MARLIN,
    // Smoothie
    SMOOTHIE,
    // TinyG
    TINYG,
    // Workflow
    WORKFLOW_STATE_RUNNING,
} from '../../constants';
import {
    MODAL_NONE,
    MODAL_ADD_MACRO,
    MODAL_EDIT_MACRO,
    MODAL_RUN_MACRO,
    ModalType,
} from './constants';
import { deleteGamepadMacro } from '../../lib/gamepad';
import { toast } from 'app/lib/toaster';

type MacroWidgetProps = {
    type: string;
    state: any;
    workflow: any;
    isConnected: boolean;
};

const MacroWidget = ({
    type,
    state,
    workflow,
    isConnected,
}: MacroWidgetProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const [macros, setMacros] = useState<any[]>([]);
    const [modal, setModal] = useState<{ name: ModalType; params: any }>({
        name: MODAL_NONE,
        params: {},
    });
    const [editMacro, setEditMacro] = useState<any>(null);

    const showToast = _.throttle(
        ({
            msg,
            type,
        }: {
            msg: string;
            type: 'info' | 'success' | 'error';
        }) => {
            toast[type](msg);
        },
        3000,
        { trailing: false },
    );

    const actions = {
        openModal: (name: ModalType = MODAL_NONE, params = {}) => {
            setModal({ name, params });
        },
        closeModal: () => {
            setModal({ name: MODAL_NONE, params: {} });
        },
        updateModalParams: (params = {}) => {
            setModal((prev) => ({
                ...prev,
                params: { ...prev.params, ...params },
            }));
        },
        addMacro: async ({
            name,
            content,
            description,
        }: {
            name: string;
            content: string;
            description: string;
        }) => {
            try {
                let res = await api.macros.create({
                    name,
                    content,
                    description,
                });
                const newMacro = res.data.macro;

                setMacros((prev) => [...prev, newMacro]);

                combokeys.reload();

                showToast({ msg: 'Added New Macro', type: 'success' });
                actions.closeModal();
            } catch (err) {
                showToast({
                    msg: 'Failed to add macro',
                    type: 'error',
                });
            }
        },
        deleteMacro: async (id: string) => {
            try {
                await api.macros.delete(id);
                const res = await api.macros.fetch();
                const { records: macros } = res.data;
                setMacros(macros);

                const commandKeys = store.get('commandKeys', {});
                const filteredCommandKeys = _.cloneDeep(commandKeys);
                delete filteredCommandKeys[id];

                store.replace('commandKeys', filteredCommandKeys);
                combokeys.reload();
                deleteGamepadMacro(id);

                showToast({ msg: 'Deleted Macro', type: 'success' });
            } catch (err) {
                // Ignore error
            }
        },
        updateMacro: async ({
            id,
            name,
            content,
            description,
        }: {
            id: string;
            name: string;
            content: string;
            description: string;
        }) => {
            try {
                await api.macros.update(id, {
                    name,
                    content,
                    description,
                });
                const res = await api.macros.fetch();
                const { records: macros } = res.data;
                setMacros(macros);
                actions.closeModal();
                toast.success(`Updated macro '${name}'`);
            } catch (err) {
                // Ignore error
            }
        },
        updateMacros: async (macros: any[] = []) => {
            try {
                if (macros.length > 0) {
                    for await (const macro of macros) {
                        const {
                            id,
                            name,
                            content,
                            column,
                            description,
                            rowIndex,
                        } = macro;
                        api.macros.update(id, {
                            name,
                            content,
                            description,
                            column,
                            rowIndex,
                        });
                    }
                }
            } catch (err) {
                // Ignore error
            }
        },
        runMacro: (id: string, { name }: { name: string }) => {
            controller.command(
                'macro:run',
                id,
                controller.context,
                (err: Error | null, _data: any) => {
                    if (err) {
                        log.error(
                            `Failed to run the macro: id=${id}, name="${name}"`,
                        );
                        return;
                    }
                },
            );
        },
        loadMacro: async (id: string) => {
            try {
                let res = await api.macros.read(id);
                const { name } = res.data;
                controller.command(
                    'macro:load',
                    id,
                    controller.context,
                    (err: Error | null, data: any) => {
                        if (err) {
                            log.error(
                                `Failed to load the macro: id=${id}, name="${name}"`,
                            );
                            return;
                        }

                        log.debug(data); // TODO
                    },
                );
            } catch (err) {
                // Ignore error
            }
        },
        openAddMacroModal: () => {
            setEditMacro(null);
            actions.openModal(MODAL_ADD_MACRO);
        },
        openRunMacroModal: (id: string) => {
            api.macros.read(id).then((res) => {
                const { id, name, content } = res.data;
                actions.openModal(MODAL_RUN_MACRO, { id, name, content });
            });
        },
        openEditMacroModal: (id: string) => {
            api.macros.read(id).then((res) => {
                const { id, name, content, description } = res.data;
                setEditMacro(res.data);
                actions.openModal(MODAL_EDIT_MACRO, {
                    id,
                    name,
                    content,
                    description,
                });
            });
        },
    };

    const fetchMacros = async () => {
        try {
            let res = await api.macros.fetch();
            const { records: macros } = res.data;
            setMacros(macros);
        } catch (err) {
            // Ignore error
        }
    };

    const exportMacros = () => {
        if (macros.length === 0) {
            showToast({ msg: 'No Macros to Export', type: 'error' });
            return;
        }

        const macrosClean = macros.map(({ name, content }) => ({
            name,
            content,
        }));
        const macrosJson = JSON.stringify(macrosClean, null, 1);
        const data = new Blob([macrosJson], {
            type: 'application/json',
        });

        const today = new Date();
        const filename = `gSender-macros-${today.toLocaleDateString()}-${today.toLocaleTimeString()}`;
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(data);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const importMacros = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            const reader = new FileReader();
            reader.readAsText(file, 'UTF-8');
            reader.onload = (event: ProgressEvent<FileReader>) => {
                const macros = JSON.parse(event.target?.result as string);

                for (const { name, content } of macros) {
                    if (name && content) {
                        actions.addMacro({
                            name,
                            content,
                            details: '',
                        });
                    }
                }

                showToast({
                    msg: 'Macros Imported Successfully',
                    type: 'success',
                });
            };
            reader.onerror = () => {
                showToast({
                    msg: 'Error Importing Macros',
                    type: 'error',
                });
            };
        }
    };

    useEffect(() => {
        fetchMacros();
        const configChangeHandler = async () => {
            // await fetchMacros();
        };
        controller.addListener('config:change', configChangeHandler);

        return () => {
            controller.removeListener('config:change', configChangeHandler);
        };
    }, []);

    const canClick = () => {
        if (!isConnected) {
            return false;
        }
        if (workflow.state === WORKFLOW_STATE_RUNNING) {
            return false;
        }
        if (!includes([GRBL, MARLIN, SMOOTHIE, TINYG, GRBLHAL], type)) {
            return false;
        }

        const activeState = get(state, 'status.activeState');
        const states = [GRBL_ACTIVE_STATE_IDLE, GRBL_ACTIVE_STATE_RUN];
        return includes(states, activeState);
    };

    return (
        <Widget>
            {(modal.name === MODAL_ADD_MACRO ||
                modal.name === MODAL_EDIT_MACRO) && (
                <MacroForm
                    onSubmit={(data: {
                        id?: string;
                        name: string;
                        content: string;
                        description: string;
                    }) => {
                        if (modal.name === MODAL_ADD_MACRO) {
                            actions.addMacro(
                                data as {
                                    name: string;
                                    content: string;
                                    description: string;
                                },
                            );
                        } else {
                            actions.updateMacro(
                                data as {
                                    id: string;
                                    name: string;
                                    content: string;
                                    description: string;
                                },
                            );
                        }
                    }}
                    onCancel={actions.closeModal}
                    id={editMacro?.id}
                    macroName={editMacro?.name}
                    macroContent={editMacro?.content}
                    macroDescription={editMacro?.description}
                />
            )}

            <div className="flex flex-col h-full">
                <div className="flex-grow overflow-auto relative">
                    <Macro
                        state={{
                            macros,
                            canClick: canClick(),
                        }}
                        actions={actions}
                    />
                </div>

                <input
                    type="file"
                    onChange={importMacros}
                    onClick={(e) => {
                        (e.target as HTMLInputElement).value = '';
                    }}
                    accept=".json"
                    className="hidden"
                    ref={inputRef}
                />

                <div className="flex justify-center gap-2 mt-2 w-full min-h-8">
                    <Button
                        onClick={actions.openAddMacroModal}
                        className="flex flex-1 justify-center items-center"
                    >
                        <FaPlus />
                    </Button>

                    <Button
                        onClick={() => {
                            inputRef.current?.click();
                        }}
                        className="flex flex-1 justify-center items-center"
                    >
                        <FaFileImport />
                    </Button>

                    <Button
                        onClick={exportMacros}
                        className="flex flex-1 justify-center items-center"
                    >
                        <FaFileExport />
                    </Button>
                </div>
            </div>
        </Widget>
    );
};

export default connect((store: any) => {
    const type = get(store, 'controller.type');
    const state = get(store, 'controller.state');
    const workflow = get(store, 'controller.workflow');
    const isConnected = get(store, 'connection.isConnected');
    return {
        type,
        state,
        workflow,
        isConnected,
    };
})(MacroWidget);
