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
import { useDispatch } from 'react-redux';

import {
    ALL_CATEGORY,
    USAGE_TOOL_NAME,
    SHORTCUT_CATEGORY,
} from 'app/constants';
import store from 'app/store';
import Button from 'app/components/Button';
import shuttleEvents from 'app/lib/shuttleEvents';
import { toast } from 'app/lib/toaster';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog';
import combokeys from 'app/lib/combokeys';
import {
    holdShortcuts,
    unholdShortcuts,
} from 'app/store/redux/slices/preferences.slice';

import { formatShortcut } from '../helpers';
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
    const dispatch = useDispatch();
    const [currentShortcut, setCurrentShortcut] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const allShuttleControlEvents = shuttleEvents.allShuttleControlEvents;
    const stopCallbackFunc = Mousetrap.prototype.stopCallback;

    const formatShortcutForPrint = (shortcut) => {
        if (!shortcut) return '';
        return shortcut
            .split('+')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' + ');
    };

    const getCategoryData = (category) => {
        const categoryColors = {
            GENERAL_CATEGORY: 'bg-blue-100 text-blue-800',
            JOGGING_CATEGORY: 'bg-green-100 text-green-800',
            VISUALIZER_CATEGORY: 'bg-orange-100 text-orange-800',
            TOOLBAR_CATEGORY: 'bg-pink-100 text-pink-800',
            COOLANT_CATEGORY: 'bg-cyan-100 text-cyan-800',
            MACRO_CATEGORY: 'bg-purple-100 text-purple-800',
            PROBING_CATEGORY: 'bg-red-100 text-red-800',
            SPINDLE_LASER_CATEGORY: 'bg-yellow-100 text-yellow-800',
            CARVING_CATEGORY: 'bg-green-100 text-green-800',
            OVERRIDES_CATEGORY: 'bg-blue-100 text-blue-800',
            LOCATION_CATEGORY: 'bg-gray-100 text-gray-800',
        };

        return {
            color: categoryColors[category] || 'bg-gray-100 text-gray-800',
            label: SHORTCUT_CATEGORY[category] || category,
        };
    };

    // Initialize shortcuts from allShuttleControlEvents if they're not in store
    useEffect(() => {
        const currentShortcuts = store.get('commandKeys', {});
        const updatedShortcuts = { ...currentShortcuts };

        // Add any missing shortcuts from allShuttleControlEvents
        Object.entries(allShuttleControlEvents).forEach(([key, event]) => {
            if (
                key !== 'MACRO' &&
                key !== 'STOP_CONT_JOG' &&
                !updatedShortcuts[key]
            ) {
                updatedShortcuts[key] = {
                    cmd: event.cmd,
                    keys: event.keys || '',
                    isActive: event.isActive ?? true,
                    category: event.category,
                    title: event.title,
                    preventDefault: event.preventDefault ?? false,
                    payload: event.payload,
                    callback: event.callback,
                };
            }
        });

        // Only update if there are new shortcuts
        if (
            Object.keys(updatedShortcuts).length >
            Object.keys(currentShortcuts).length
        ) {
            store.replace('commandKeys', updatedShortcuts);
            setShortcutsList(updatedShortcuts);
            setDataSet(updatedShortcuts);
        }
    }, [allShuttleControlEvents]);

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

    useEffect(() => {
        // Trigger pubsub for use in Location widget where keybindings are injected
        // When modifing keybindings, we remove the key listener in location widget to prevent
        // it from being fired during the edit
        dispatch(holdShortcuts());
        combokeys.reload();
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
            pubsub.publish('addshortcutsListener');
            dispatch(unholdShortcuts());
            combokeys.reload();
        };
    }, []);

    const showToast = _.throttle(
        (msg = 'Shortcut Updated') => {
            toast.info(msg, {
                duration: 3000,
                position: 'bottom-right',
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

    const handlePrintShortcuts = () => {
        // Group shortcuts by category
        const shortcutsByCategory = {};

        Object.values(shortcutsList)
            .filter((s) => s.isActive && s.keys)
            .forEach((shortcut) => {
                // Get the shortcut data from allShuttleControlEvents if available
                const shortcutData =
                    allShuttleControlEvents[shortcut.cmd] || shortcut;
                const categoryKey = shortcutData.category;
                const categoryName = getCategoryData(categoryKey).label;

                if (!shortcutsByCategory[categoryName]) {
                    shortcutsByCategory[categoryName] = [];
                }

                shortcutsByCategory[categoryName].push({
                    ...shortcut,
                    title: shortcutData.title || shortcut.cmd,
                    category: categoryKey,
                });
            });

        try {
            const oldIframe = document.getElementById('print-shortcuts-frame');
            if (oldIframe) {
                document.body.removeChild(oldIframe);
            }

            const iframe = document.createElement('iframe');
            iframe.id = 'print-shortcuts-frame';
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';

            document.body.appendChild(iframe);

            let printContent = `
                <div class="header">
                    <h1>gSender Keyboard Shortcuts</h1>
                    <p class="subtitle">Generated on ${new Date().toLocaleDateString()}</p>
                </div>
            `;

            Object.entries(shortcutsByCategory).forEach(
                ([category, categoryShortcuts]) => {
                    const categoryColor =
                        getCategoryData(
                            categoryShortcuts[0].category,
                        ).color.split(' ')[0] || 'bg-gray-100';

                    printContent += `
                    <div class="category">
                        <div class="category-header ${categoryColor}">
                            <h2>${category}</h2>
                        </div>
                        <div class="shortcuts">
                `;

                    categoryShortcuts.forEach((shortcut) => {
                        const keys = formatShortcutForPrint(shortcut.keys);
                        printContent += `
                        <div class="shortcut">
                            <div class="shortcut-info">
                                <div class="shortcut-title">${shortcut.title}</div>
                                ${shortcut.description ? `<div class="shortcut-description">${shortcut.description}</div>` : ''}
                            </div>
                            <div class="shortcut-keys">${keys}</div>
                        </div>
                    `;
                    });

                    printContent += `
                        </div>
                    </div>
                `;
                },
            );

            const iframeDoc = iframe.contentWindow?.document;
            if (iframeDoc) {
                iframeDoc.open();
                iframeDoc.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Keyboard Shortcuts</title>
                        <style>
                            body {
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                                margin: 0;
                                padding: 15px;
                                color: #333;
                            }
                            
                            .header {
                                text-align: center;
                                margin-bottom: 20px;
                                padding-bottom: 10px;
                                border-bottom: 1px solid #eaeaea;
                            }
                            
                            .header h1 {
                                margin: 0;
                                font-size: 24px;
                            }
                            
                            .subtitle {
                                color: #666;
                                margin-top: 3px;
                                font-size: 12px;
                            }
                            
                            .category {
                                margin-bottom: 15px;
                                page-break-inside: avoid;
                            }
                            
                            .category-header {
                                padding: 4px 8px;
                                border-radius: 3px;
                                margin-bottom: 8px;
                            }
                            
                            .category-header h2 {
                                margin: 0;
                                font-size: 14px;
                                font-weight: 600;
                            }
                            
                            .shortcuts {
                                display: grid;
                                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                                gap: 8px;
                            }
                            
                            .shortcut {
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                padding: 6px 8px;
                                border: 1px solid #eaeaea;
                                border-radius: 3px;
                                background-color: #fafafa;
                                font-size: 12px;
                            }
                            
                            .shortcut-info {
                                flex: 1;
                                margin-right: 8px;
                            }
                            
                            .shortcut-title {
                                font-weight: 500;
                                margin-bottom: 2px;
                            }
                            
                            .shortcut-description {
                                font-size: 11px;
                                color: #666;
                            }
                            
                            .shortcut-keys {
                                font-family: monospace;
                                background-color: #f1f5f9;
                                padding: 3px 6px;
                                border-radius: 3px;
                                border: 1px solid #e2e8f0;
                                font-weight: 600;
                                white-space: nowrap;
                                font-size: 11px;
                            }
                            
                            /* Category colors */
                            .bg-blue-100 { background-color: #dbeafe; }
                            .bg-green-100 { background-color: #dcfce7; }
                            .bg-orange-100 { background-color: #ffedd5; }
                            .bg-pink-100 { background-color: #fce7f3; }
                            .bg-cyan-100 { background-color: #cffafe; }
                            .bg-purple-100 { background-color: #f3e8ff; }
                            .bg-red-100 { background-color: #fee2e2; }
                            .bg-yellow-100 { background-color: #fef9c3; }
                            .bg-gray-100 { background-color: #f3f4f6; }
                            
                            @media print {
                                body {
                                    font-size: 10px;
                                    padding: 10px;
                                }
                                
                                .header h1 {
                                    font-size: 18px;
                                }
                                
                                .category-header h2 {
                                    font-size: 12px;
                                }
                                
                                .shortcuts {
                                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                                    gap: 6px;
                                }
                                
                                .shortcut {
                                    padding: 4px 6px;
                                    font-size: 10px;
                                }
                                
                                .shortcut-title {
                                    font-size: 10px;
                                }
                                
                                .shortcut-description {
                                    font-size: 9px;
                                }
                                
                                .shortcut-keys {
                                    font-size: 9px;
                                    padding: 2px 4px;
                                }
                                
                                @page {
                                    margin: 0.5cm;
                                }
                            }
                        </style>
                    </head>
                    <body>${printContent}</body>
                    </html>
                `);
                iframeDoc.close();

                iframe.onload = () => {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                };
            } else {
                toast.error('Unable to create print document.', {
                    position: 'bottom-right',
                });
            }
        } catch (error) {
            console.error('Print error:', error);
            toast.error('Failed to print shortcuts.', {
                position: 'bottom-right',
            });
        }
    };

    return (
        <div className="flex flex-col gap-4 h-full dark:text-white">
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
                <Button onClick={handlePrintShortcuts}>
                    <i className="fas fa-print" />
                    Print Shortcuts
                </Button>
            </div>

            {showEditModal && stopCallback() && (
                <Dialog
                    open={showEditModal}
                    onOpenChange={(open) => !open && closeModal()}
                >
                    <DialogContent className="p-6 w-3/4 max-w-[800px]">
                        <DialogHeader>
                            <DialogTitle>Edit Shortcut</DialogTitle>

                            <DialogDescription>
                                Update the keybinding for this shortcut
                            </DialogDescription>
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
