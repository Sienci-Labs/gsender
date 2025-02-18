import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { cn } from 'app/lib/utils';

import { SHORTCUT_CATEGORY } from 'app/constants';
import { Button } from 'app/components/shadcn/Button';
import { Input } from 'app/components/shadcn/Input';
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
            className={
                conflictingIds.includes(shortcut.id) ? 'bg-red-50' : undefined
            }
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
                                    variant="default"
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
        <>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                <p className="text-gray-600">
                    Configure keyboard shortcuts for various actions
                </p>
                <div className="flex gap-2">
                    <Input
                        type="text"
                        placeholder="Search shortcuts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-sm"
                    />
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline">
                                Reset All to Default
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white">
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Reset All Shortcuts
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to reset all keyboard
                                    shortcuts to their default values? This
                                    action cannot be undone.
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
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-4 flex flex-wrap h-auto gap-2">
                    <TabsTrigger value="all">
                        All Shortcuts ({filteredShortcuts.length})
                    </TabsTrigger>
                    {categories.map((category) => (
                        <TabsTrigger key={category.id} value={category.id}>
                            {category.label} ({category.shortcuts.length})
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="all">
                    <div className="flex-1 overflow-auto border rounded-md border-gray-200 h-[800px]">
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
                    </div>
                </TabsContent>

                {categories.map((category) => (
                    <TabsContent key={category.id} value={category.id}>
                        <div className="flex-1 overflow-auto border rounded-md border-gray-200 h-[800px]">
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
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </>
    );
};

export default KeyboardShortcuts;
