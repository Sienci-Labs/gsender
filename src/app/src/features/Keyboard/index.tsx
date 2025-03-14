import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { cn } from 'app/lib/utils';

import { SHORTCUT_CATEGORY } from 'app/constants';
import Button from 'app/components/Button';
import { Input } from 'app/components/Input';
import { Switch } from 'app/components/shadcn/Switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'app/components/shadcn/Table';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from 'app/components/shadcn/Tabs';
import { toast } from 'app/lib/toaster';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import {
    updateShortcut,
    setIsEditing,
    resetShortcut,
    resetAllShortcuts,
} from 'app/store/redux/slices/keyboardShortcutsSlice';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from 'app/components/shadcn/AlertDialog';

import { useKeyboardCapture } from './useKeyboardCapture';
import {
    findConflictingShortcuts,
    formatShortcut,
} from './utils/keyboardUtils';
import { KeyboardShortcut } from './types';

const KeyboardShortcuts = () => {
    const dispatch = useDispatch();
    const shortcuts = useTypedSelector(
        (state) => state.keyboardShortcuts.shortcuts,
    );
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [conflictingIds, setConflictingIds] = useState<string[]>([]);
    const {
        capturedKeys,
        isCapturing,
        startCapturing,
        stopCapturing,
        resetCapture,
    } = useKeyboardCapture();

    const categories = Object.entries(SHORTCUT_CATEGORY).map(
        ([key, label]) => ({
            id: key,
            label,
            shortcuts: Object.values(shortcuts).filter(
                (s) => s.category === key,
            ),
        }),
    );

    const filteredShortcuts = Object.values(shortcuts).filter((shortcut) => {
        const matchesSearch = searchQuery
            ? shortcut.title
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
              shortcut.description
                  ?.toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
              shortcut.currentKeys
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase())
            : true;
        return matchesSearch;
    });

    const handleStartEditing = (id: string) => {
        setEditingId(id);
        setConflictingIds([]);
        dispatch(setIsEditing(true));
    };

    const handleSaveShortcut = (id: string) => {
        if (capturedKeys) {
            const conflicts = findConflictingShortcuts(capturedKeys, id);
            if (conflicts.length > 0) {
                setConflictingIds(conflicts);
                return;
            }

            dispatch(
                updateShortcut({
                    id,
                    updates: { currentKeys: capturedKeys },
                }),
            );
            setConflictingIds([]);
        }
        setEditingId(null);
        dispatch(setIsEditing(false));
        stopCapturing();
        toast.info('Shortcut updated');
    };

    const handleResetShortcut = (id: string) => {
        dispatch(resetShortcut(id));
        toast.info('Shortcut reset to default');
    };

    const handleResetAllShortcuts = () => {
        dispatch(resetAllShortcuts());
        toast.info('All shortcuts reset to default');
    };

    const handlePrintShortcuts = () => {
        // Group shortcuts by category
        const shortcutsByCategory: Record<string, KeyboardShortcut[]> = {};

        Object.values(shortcuts)
            .filter((s) => s.isActive && s.currentKeys)
            .forEach((shortcut) => {
                const categoryKey = shortcut.category;
                const categoryName = getCategoryData(categoryKey).label;

                if (!shortcutsByCategory[categoryName]) {
                    shortcutsByCategory[categoryName] = [];
                }

                shortcutsByCategory[categoryName].push(shortcut);
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
                        const keys = formatShortcut(shortcut.currentKeys);
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
                                padding: 20px;
                                color: #333;
                            }
                            
                            .header {
                                text-align: center;
                                margin-bottom: 30px;
                                padding-bottom: 15px;
                                border-bottom: 2px solid #eaeaea;
                            }
                            
                            .header h1 {
                                margin: 0;
                                font-size: 28px;
                            }
                            
                            .subtitle {
                                color: #666;
                                margin-top: 5px;
                            }
                            
                            .category {
                                margin-bottom: 30px;
                                page-break-inside: avoid;
                            }
                            
                            .category-header {
                                padding: 8px 15px;
                                border-radius: 4px;
                                margin-bottom: 15px;
                            }
                            
                            .category-header h2 {
                                margin: 0;
                                font-size: 18px;
                                font-weight: 600;
                            }
                            
                            .shortcuts {
                                display: grid;
                                grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
                                gap: 15px;
                            }
                            
                            .shortcut {
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                padding: 10px 15px;
                                border: 1px solid #eaeaea;
                                border-radius: 4px;
                                background-color: #fafafa;
                            }
                            
                            .shortcut-info {
                                flex: 1;
                            }
                            
                            .shortcut-title {
                                font-weight: 500;
                            }
                            
                            .shortcut-description {
                                font-size: 12px;
                                color: #666;
                                margin-top: 3px;
                            }
                            
                            .shortcut-keys {
                                font-family: monospace;
                                background-color: #f1f5f9;
                                padding: 5px 10px;
                                border-radius: 4px;
                                border: 1px solid #e2e8f0;
                                font-weight: 600;
                                white-space: nowrap;
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
                                    font-size: 11px;
                                }
                                
                                .header h1 {
                                    font-size: 22px;
                                }
                                
                                .category-header h2 {
                                    font-size: 16px;
                                }
                                
                                .shortcuts {
                                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                                }
                                
                                .shortcut {
                                    break-inside: avoid;
                                }
                                
                                @page {
                                    margin: 1cm;
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
                toast.error('Unable to create print document.');
            }
        } catch (error) {
            console.error('Print error:', error);
            toast.error('Failed to print shortcuts.');
        }
    };

    const renderShortcutResetButton = (shortcut: KeyboardShortcut) => (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    Reset
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                    <AlertDialogTitle>Reset Shortcut</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to reset the shortcut for{' '}
                        <strong>{shortcut.title}</strong> to its default value?
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => handleResetShortcut(shortcut.id)}
                    >
                        Reset
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    const renderShortcuts = (shortcuts: KeyboardShortcut[]) => {
        if (shortcuts.length === 0) {
            return (
                <TableRow>
                    <TableCell
                        colSpan={4}
                        className="text-center text-gray-500 text-lg"
                    >
                        No shortcuts found
                    </TableCell>
                </TableRow>
            );
        }

        return shortcuts.map(renderShortcutRow);
    };

    const getCategoryData = (category: keyof typeof SHORTCUT_CATEGORY) => {
        const categoryColors: Record<keyof typeof SHORTCUT_CATEGORY, string> = {
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

        const categoryLabel: Record<keyof typeof SHORTCUT_CATEGORY, string> = {
            GENERAL_CATEGORY: 'General',
            JOGGING_CATEGORY: 'Jogging',
            VISUALIZER_CATEGORY: 'Visualizer',
            TOOLBAR_CATEGORY: 'Toolbar',
            COOLANT_CATEGORY: 'Coolant',
            MACRO_CATEGORY: 'Macro',
            PROBING_CATEGORY: 'Probing',
            SPINDLE_LASER_CATEGORY: 'Spindle Laser',
            CARVING_CATEGORY: 'Carving',
            OVERRIDES_CATEGORY: 'Overrides',
            LOCATION_CATEGORY: 'Location',
        };

        return {
            color: categoryColors[category],
            label: categoryLabel[category],
        };
    };

    const renderShortcutRow = (shortcut: KeyboardShortcut) => (
        <TableRow
            key={shortcut.id}
            className={cn(
                { 'bg-red-50': conflictingIds.includes(shortcut.id) },
                {
                    'bg-gray-300 opacity-50 pointer-events-none':
                        editingId !== null && shortcut.id !== editingId,
                },
                { 'hover:bg-gray-50': editingId === null },
            )}
        >
            <TableCell className="w-[400px]">
                <div>
                    <div className="font-medium">{shortcut.title}</div>
                    {shortcut.description && (
                        <div className="text-sm text-gray-500">
                            {shortcut.description}
                        </div>
                    )}
                    {conflictingIds.includes(shortcut.id) && (
                        <div className="text-sm text-red-600 mt-1">
                            Shortcut conflicts with this action
                        </div>
                    )}
                </div>
            </TableCell>
            <TableCell className="w-[500px] min-w-[500px]">
                <div className="flex items-center gap-4">
                    <div className="w-[150px] min-w-[150px]">
                        <kbd
                            className={cn(
                                'px-3 py-2 text-sm rounded w-full text-center block transition-all',
                                editingId === shortcut.id
                                    ? isCapturing
                                        ? 'bg-blue-50 border-2 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse'
                                        : capturedKeys
                                          ? 'bg-blue-50 border-2 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                                          : 'bg-gray-100'
                                    : 'bg-gray-100',
                            )}
                        >
                            {editingId === shortcut.id
                                ? capturedKeys
                                    ? formatShortcut(capturedKeys)
                                    : isCapturing
                                      ? 'Press keys...'
                                      : formatShortcut(shortcut.currentKeys)
                                : formatShortcut(shortcut.currentKeys)}
                        </kbd>
                    </div>
                    <div className="flex items-center gap-2 min-w-[300px]">
                        {editingId === shortcut.id ? (
                            <>
                                <Button
                                    onClick={startCapturing}
                                    variant="outline"
                                    size="sm"
                                    disabled={isCapturing}
                                >
                                    {isCapturing ? 'Recording...' : 'Record'}
                                </Button>
                                <Button
                                    onClick={() =>
                                        handleSaveShortcut(shortcut.id)
                                    }
                                    variant="primary"
                                    size="sm"
                                    disabled={
                                        !capturedKeys ||
                                        conflictingIds.length > 0
                                    }
                                >
                                    Save
                                </Button>
                                <Button
                                    onClick={() => {
                                        setEditingId(null);
                                        dispatch(setIsEditing(false));
                                        stopCapturing();
                                        resetCapture();
                                    }}
                                    variant="ghost"
                                    size="sm"
                                >
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    onClick={() =>
                                        handleStartEditing(shortcut.id)
                                    }
                                    variant="outline"
                                    size="sm"
                                >
                                    {shortcut.currentKeys === ''
                                        ? 'Add'
                                        : 'Edit'}
                                </Button>
                                {renderShortcutResetButton(shortcut)}
                            </>
                        )}
                    </div>
                </div>
            </TableCell>
            <TableCell className="w-[150px] min-w-[150px]">
                <span
                    className={cn(
                        'px-2 py-1 rounded-md font-medium inline-block',
                        getCategoryData(shortcut.category).color ||
                            'bg-gray-100 text-gray-800',
                    )}
                >
                    {getCategoryData(shortcut.category).label}
                </span>
            </TableCell>
            <TableCell className="w-[100px] min-w-[100px]">
                <div className="flex items-center gap-2">
                    <Switch
                        checked={shortcut.isActive}
                        onCheckedChange={(checked) =>
                            dispatch(
                                updateShortcut({
                                    id: shortcut.id,
                                    updates: { isActive: checked },
                                }),
                            )
                        }
                    />
                    <span className="text-sm">Active</span>
                </div>
            </TableCell>
        </TableRow>
    );

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center mb-4 gap-2 justify-end">
                <Input
                    type="text"
                    placeholder="Search shortcuts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button variant="outline" onClick={handlePrintShortcuts}>
                    Print Shortcuts
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline">Reset All to Default</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white">
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Reset All Shortcuts
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to reset all keyboard
                                shortcuts to their default values? This action
                                cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleResetAllShortcuts}
                            >
                                Reset All
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <div className="relative flex-1 min-h-0">
                <Tabs
                    defaultValue="all"
                    className="flex flex-col absolute inset-0"
                >
                    <TabsList className="flex flex-wrap h-auto gap-2 mb-4">
                        <TabsTrigger value="all">
                            All Shortcuts ({filteredShortcuts.length})
                        </TabsTrigger>
                        {categories.map((category) => (
                            <TabsTrigger key={category.id} value={category.id}>
                                {category.label} ({category.shortcuts.length})
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent
                        value="all"
                        className="flex-1 overflow-auto border rounded-md border-gray-200"
                    >
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Shortcut</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {renderShortcuts(filteredShortcuts)}
                            </TableBody>
                        </Table>
                    </TabsContent>

                    {categories.map((category) => (
                        <TabsContent
                            key={category.id}
                            value={category.id}
                            className="flex-1 overflow-auto border rounded-md border-gray-200"
                        >
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Shortcut</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {renderShortcuts(
                                        category.shortcuts.filter(
                                            (shortcut) => {
                                                return searchQuery
                                                    ? shortcut.title
                                                          .toLowerCase()
                                                          .includes(
                                                              searchQuery.toLowerCase(),
                                                          ) ||
                                                          shortcut.description
                                                              ?.toLowerCase()
                                                              .includes(
                                                                  searchQuery.toLowerCase(),
                                                              ) ||
                                                          shortcut.currentKeys
                                                              .toLowerCase()
                                                              .includes(
                                                                  searchQuery.toLowerCase(),
                                                              )
                                                    : true;
                                            },
                                        ),
                                    )}
                                </TableBody>
                            </Table>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </div>
    );
};

export default KeyboardShortcuts;
