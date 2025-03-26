/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import pubsub from 'pubsub-js';
import _ from 'lodash';
import Mousetrap from 'mousetrap';

import { ALL_CATEGORY, USAGE_TOOL_NAME } from 'app/constants';
import store from 'app/store';
import Button from 'app/components/Button';
import shuttleEvents from 'app/lib/shuttleEvents';
import { toast } from 'app/lib/toaster';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog';

import CategoryFilter from '../CategoryFilter';
import ShortcutsTable from '../ShortcutsTable';
import EditArea from './EditArea';
import { generateList } from '../utils';

/**
 * Keybinding settings page
 * @prop {Boolean} active Check if this page is currently active or not
 */
const Keyboard = () => {
    const [shortcutsList, setShortcutsList] = useState(
        store.get('commandKeys', {}),
    );
    const [dataSet, setDataSet] = useState(shortcutsList);
    const [filterCategory, setFilterCategory] = useState(ALL_CATEGORY);
    const allShuttleControlEvents = shuttleEvents.allShuttleControlEvents;

    const filter = (category, shortcuts) => {
        const allShortcuts = shortcuts || shortcutsList;
        const filteredData =
            category === ALL_CATEGORY
                ? allShortcuts
                : Object.fromEntries(
                      Object.entries(allShortcuts).filter(([key, entry]) => {
                          if (allShuttleControlEvents[key]) {
                              return (
                                  allShuttleControlEvents[key].category ===
                                  category
                              );
                          }
                          return entry.category === category;
                      }),
                  );
        setDataSet(filteredData);
        setFilterCategory(category);
    };
    // const dispatch = useDispatch();

    const [currentShortcut, setCurrentShortcut] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const stopCallbackFunc = Mousetrap.prototype.stopCallback;

    useEffect(() => {
        // Trigger pubsub for use in Location widget where keybindings are injected
        // When modifing keybindings, we remove the key listener in location widget to prevent
        // it from being fired during the edit
        // dispatch(holdShortcutsListener());
        // pubsub.publish('removeshortcutsListener');

        const token = pubsub.subscribe(
            'keybindingsUpdated',
            (msg, shortcuts) => {
                if (shortcuts) {
                    // if shortcuts not sent, updateKeybindings published it
                    updateKeybindings(shortcuts);
                }
            },
        );

        // When we are not editing the keybindings anymore, make sure to re-inject the keybindings
        // within the location widget again
        return () => {
            pubsub.unsubscribe(token);
            // pubsub.publish('addshortcutsListener');
            // dispatch(unholdShortcutsListener());
        };
    }, []);

    const showToast = _.throttle(
        (msg = 'Shortcut Updated') => {
            toast.info(msg, {
                duration: 3000,
            });
        },
        5000,
        { trailing: false },
    );

    const handleEdit = (currentShortcut) => {
        setShowEditModal(true);
        setCurrentShortcut(currentShortcut.cmd || currentShortcut.id);
    };

    const handleDelete = (shortcut) => {
        const updatedShortcuts = _.cloneDeep(shortcutsList);
        updatedShortcuts[shortcut.cmd].keys = '';
        updateKeybindings(updatedShortcuts, false);

        showToast('Shortcut Cleared');
    };

    /**
     * Function to edit the stores commandKeys array
     * @param {Object} shortcut The shortcut that was modifed
     */
    const editKeybinding = (shortcut, showToast = true) => {
        //Replace old keybinding item with new one
        const updatedShortcuts = _.cloneDeep(shortcutsList);
        updatedShortcuts[shortcut.cmd] = shortcut;
        updateKeybindings(updatedShortcuts, showToast);
    };

    const toggleKeybinding = (shortcut, showToast) => {
        const updatedShortcutsList = _.cloneDeep(shortcutsList);
        const shortcutInUse = Object.entries(updatedShortcutsList)
            .filter(([key, keybinding]) => keybinding.cmd !== shortcut.cmd)
            .find(([key, keybinding]) => keybinding.keys === shortcut.keys);
        if (shortcutInUse && shortcut.isActive) {
            shortcut.keys = '';
        }

        updatedShortcutsList[shortcut.cmd] = shortcut;
        updateKeybindings(updatedShortcutsList, showToast);
    };

    const updateKeybindings = (shortcuts, shouldShowToast) => {
        store.replace('commandKeys', shortcuts);
        setShortcutsList(shortcuts);
        filter(filterCategory, shortcuts);
        pubsub.publish('keybindingsUpdated');

        setShowEditModal(false);
        resumeCallback();
        // dispatch(updateShortcutsList(shortcuts));

        if (shouldShowToast) {
            showToast();
        }
    };

    const closeModal = () => {
        setShowEditModal(false);
        resumeCallback();
    };

    const enableAllShortcuts = () => {
        let enabledKeybindings = _.cloneDeep(shortcutsList);
        let enabledArr = Object.entries(enabledKeybindings);
        enabledArr.forEach(([key, keybinding]) => {
            keybinding.isActive = true;
        });
        enabledKeybindings = Object.fromEntries(enabledArr);

        updateKeybindings(enabledKeybindings, false);
    };

    const disableAllShortcuts = () => {
        let disabledShortcuts = _.cloneDeep(shortcutsList);
        let disabledArr = Object.entries(disabledShortcuts);
        disabledArr.forEach(([key, keybinding]) => {
            keybinding.isActive = false;
        });
        disabledShortcuts = Object.fromEntries(disabledArr);

        updateKeybindings(disabledShortcuts, false);
    };

    const stopCallback = () => {
        Mousetrap.prototype.stopCallback = function () {
            return true;
        };
        return true;
    };

    const resumeCallback = () => {
        Mousetrap.prototype.stopCallback = stopCallbackFunc;
        return true;
    };

    const allShortcutsEnabled = useMemo(
        () =>
            Object.entries(shortcutsList).every(
                ([key, shortcut]) => shortcut.isActive,
            ),
        [shortcutsList],
    );
    const allShortcutsDisabled = useMemo(
        () =>
            Object.entries(shortcutsList).every(
                ([key, shortcut]) => !shortcut.isActive,
            ),
        [shortcutsList],
    );

    const datasetList = generateList(dataSet);

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex gap-4 justify-end">
                <Button
                    onClick={enableAllShortcuts}
                    disabled={allShortcutsEnabled}
                >
                    <i className="fas fa-toggle-on" />
                    Enable All Shortcuts
                </Button>
                <Button
                    onClick={disableAllShortcuts}
                    disabled={allShortcutsDisabled}
                >
                    <i className="fas fa-toggle-off" />
                    Disable All Shortcuts
                </Button>
            </div>

            <CategoryFilter
                onChange={filter}
                filterCategory={filterCategory}
                datasetList={datasetList}
            />
            <div className="overflow-auto relative h-full border border-gray-200 rounded">
                <ShortcutsTable
                    dataSet={datasetList}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onShortcutToggle={toggleKeybinding}
                />
            </div>

            {showEditModal && stopCallback() && (
                <Dialog
                    open={showEditModal}
                    onOpenChange={(open) => !open && closeModal()}
                >
                    <DialogContent className="bg-gray-300 p-6">
                        <DialogHeader>
                            <DialogTitle className="text-center mb-4">
                                Edit Shortcut
                            </DialogTitle>
                        </DialogHeader>

                        <EditArea
                            shortcut={shortcutsList[currentShortcut]}
                            shortcuts={shortcutsList}
                            edit={editKeybinding}
                            onClose={closeModal}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

Keyboard.propTypes = {
    active: PropTypes.bool,
};

export default Keyboard;
