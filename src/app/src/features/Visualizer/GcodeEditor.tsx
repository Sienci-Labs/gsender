import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Copy, Save, X, Check, RotateCcw, Trash2, ArrowUp } from 'lucide-react';

import { Button } from 'app/components/Button';
import { toast } from 'app/lib/toaster';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { uploadGcodeFileToServer } from 'app/lib/fileupload';
import controller from 'app/lib/controller';
import {
    VISUALIZER_PRIMARY,
    WORKFLOW_STATE_RUNNING,
    WORKFLOW_STATE_PAUSED,
} from 'app/constants';
import { store as reduxStore } from 'app/store/redux';
import { updateFileContent } from 'app/store/redux/slices/fileInfo.slice';
import { RootState } from 'app/store/redux';
import { cn } from 'app/lib/utils';

type GcodeEditorProps = {
    onClose: () => void;
};

const LINE_HEIGHT = 32; // Height of each line in pixels
const OVERSCAN = 10; // Number of lines to render outside the visible area

const GcodeEditor = ({ onClose }: GcodeEditorProps) => {
    const { content, name } = useTypedSelector((state) => state.file);
    const workflowState = useTypedSelector(
        (state: RootState) => state.controller.workflow.state,
    );
    const senderStatus = useTypedSelector(
        (state: RootState) => state.controller.sender.status,
    );
    const [gcodeLines, setGcodeLines] = useState<string[]>([]);
    const [originalLines, setOriginalLines] = useState<string[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);
    const [selectedLines, setSelectedLines] = useState<Set<number>>(new Set());
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
        null,
    );
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const lineInputsRef = useRef<Map<number, HTMLInputElement>>(new Map());

    const isJobRunning =
        workflowState === WORKFLOW_STATE_RUNNING ||
        workflowState === WORKFLOW_STATE_PAUSED;
    const currentLineRunning = senderStatus?.currentLineRunning ?? -1;

    // Split content into lines asynchronously to avoid blocking UI
    useEffect(() => {
        if (content) {
            // Use setTimeout to defer the splitting to avoid blocking the UI
            const timeoutId = setTimeout(() => {
                const lines = content.split('\n');
                setGcodeLines(lines);
                setOriginalLines(lines); // Store original for revert
                setHasChanges(false);
            }, 0);
            return () => clearTimeout(timeoutId);
        } else {
            setGcodeLines([]);
            setOriginalLines([]);
        }
    }, [content]);

    // Calculate visible range
    const visibleRange = useMemo(() => {
        const start = Math.max(
            0,
            Math.floor(scrollTop / LINE_HEIGHT) - OVERSCAN,
        );
        const end = Math.min(
            gcodeLines.length,
            Math.ceil((scrollTop + containerHeight) / LINE_HEIGHT) + OVERSCAN,
        );
        return { start, end };
    }, [scrollTop, containerHeight, gcodeLines.length]);

    // Handle scroll
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    // Measure container height
    useEffect(() => {
        const updateHeight = () => {
            if (scrollContainerRef.current) {
                setContainerHeight(scrollContainerRef.current.clientHeight);
            }
        };
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(updateHeight);
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    // Calculate total height for scrollbar
    const totalHeight = gcodeLines.length * LINE_HEIGHT;

    // Clear selection and auto-scroll when job starts running
    useEffect(() => {
        if (isJobRunning) {
            // Clear selection when job starts
            setSelectedLines(new Set());
            setLastSelectedIndex(null);
        }
    }, [isJobRunning]);

    // Auto-scroll to current line when job is running
    useEffect(() => {
        if (
            isJobRunning &&
            currentLineRunning >= 0 &&
            scrollContainerRef.current
        ) {
            const lineTop = currentLineRunning * LINE_HEIGHT;
            const lineBottom = lineTop + LINE_HEIGHT;
            const container = scrollContainerRef.current;
            const scrollTop = container.scrollTop;
            const scrollBottom = scrollTop + container.clientHeight;

            // Only scroll if current line is not visible
            if (lineTop < scrollTop || lineBottom > scrollBottom) {
                // Scroll to center the current line
                const targetScroll =
                    lineTop - container.clientHeight / 2 + LINE_HEIGHT / 2;
                container.scrollTo({
                    top: Math.max(0, targetScroll),
                    behavior: 'smooth',
                });
            }
        }
    }, [currentLineRunning, isJobRunning]);

    const handleLineChange = (index: number, value: string) => {
        if (isJobRunning) {
            return; // Disable editing when job is running
        }
        const newLines = [...gcodeLines];
        newLines[index] = value;
        setGcodeLines(newLines);
        setHasChanges(true);
    };

    // Handle checkbox click - always toggles selection
    const handleCheckboxClick = useCallback(
        (index: number, e: React.MouseEvent) => {
            if (isJobRunning) {
                return; // Disable selection when job is running
            }
            e.preventDefault();
            e.stopPropagation();

            const newSelection = new Set(selectedLines);
            let newLastSelectedIndex: number | null = index;

            if (e.shiftKey && lastSelectedIndex !== null) {
                // Range selection with Shift
                const start = Math.min(lastSelectedIndex, index);
                const end = Math.max(lastSelectedIndex, index);
                for (let i = start; i <= end; i++) {
                    newSelection.add(i);
                }
            } else {
                // Always toggle when clicking checkbox
                if (newSelection.has(index)) {
                    newSelection.delete(index);
                    // If we deselected the last selected index, find a new one
                    if (lastSelectedIndex === index && newSelection.size > 0) {
                        newLastSelectedIndex = Math.max(
                            ...Array.from(newSelection),
                        );
                    } else if (newSelection.size === 0) {
                        newLastSelectedIndex = null;
                    }
                } else {
                    newSelection.add(index);
                }
            }

            setSelectedLines(newSelection);
            setLastSelectedIndex(newLastSelectedIndex);
        },
        [selectedLines, lastSelectedIndex, isJobRunning],
    );

    // Handle line click - for clicking on the line itself (not checkbox)
    const handleLineClick = useCallback(
        (index: number, e: React.MouseEvent) => {
            if (isJobRunning) {
                return; // Disable selection when job is running
            }
            e.preventDefault();
            e.stopPropagation();

            const newSelection = new Set(selectedLines);
            let newLastSelectedIndex: number | null = index;

            if (e.shiftKey && lastSelectedIndex !== null) {
                // Range selection with Shift
                const start = Math.min(lastSelectedIndex, index);
                const end = Math.max(lastSelectedIndex, index);
                for (let i = start; i <= end; i++) {
                    newSelection.add(i);
                }
            } else if (e.ctrlKey || e.metaKey) {
                // Toggle selection with Ctrl/Cmd
                if (newSelection.has(index)) {
                    newSelection.delete(index);
                    // If we deselected the last selected index, find a new one
                    if (lastSelectedIndex === index && newSelection.size > 0) {
                        newLastSelectedIndex = Math.max(
                            ...Array.from(newSelection),
                        );
                    } else if (newSelection.size === 0) {
                        newLastSelectedIndex = null;
                    }
                } else {
                    newSelection.add(index);
                }
            } else {
                // Single selection - if clicking the only selected line, deselect it
                if (newSelection.size === 1 && newSelection.has(index)) {
                    newSelection.clear();
                    newLastSelectedIndex = null;
                } else {
                    // Otherwise, select just this line
                    newSelection.clear();
                    newSelection.add(index);
                }
            }

            setSelectedLines(newSelection);
            setLastSelectedIndex(newLastSelectedIndex);
        },
        [selectedLines, lastSelectedIndex, isJobRunning],
    );

    const handleContainerClick = useCallback((e: React.MouseEvent) => {
        // Deselect all when clicking on empty space
        if (
            e.target === e.currentTarget ||
            (e.target as HTMLElement).classList.contains('line-container')
        ) {
            setSelectedLines(new Set());
            setLastSelectedIndex(null);
        }
    }, []);

    // Handle delete selected lines
    const handleDeleteSelected = useCallback(() => {
        if (isJobRunning || selectedLines.size === 0) return;

        const sortedIndices = Array.from(selectedLines).sort((a, b) => b - a);
        const newLines = [...gcodeLines];
        sortedIndices.forEach((index) => {
            newLines.splice(index, 1);
        });
        setGcodeLines(newLines);
        setHasChanges(true);
        setSelectedLines(new Set());
        setLastSelectedIndex(null);
    }, [gcodeLines, selectedLines, isJobRunning]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle shortcuts if editor container is focused or contains focused element
            const container = scrollContainerRef.current;
            if (!container || !container.contains(document.activeElement)) {
                return;
            }

            const activeElement = document.activeElement as HTMLElement;
            const isInputFocused = activeElement?.tagName === 'INPUT';
            const inputValue = isInputFocused
                ? (activeElement as HTMLInputElement).value
                : '';
            const cursorPosition = isInputFocused
                ? (activeElement as HTMLInputElement).selectionStart || 0
                : 0;

            // Select all with Ctrl/Cmd+A
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                const allIndices = new Set(gcodeLines.map((_, i) => i));
                setSelectedLines(allIndices);
            }
            // Deselect with Escape
            else if (e.key === 'Escape') {
                if (selectedLines.size > 0) {
                    setSelectedLines(new Set());
                    setLastSelectedIndex(null);
                }
            }
            // Delete selected lines with Delete or Backspace
            else if (
                (e.key === 'Delete' || e.key === 'Backspace') &&
                selectedLines.size > 0
            ) {
                // Only delete lines if:
                // 1. Not typing in input, OR
                // 2. Input is empty, OR
                // 3. Cursor is at start and Backspace, OR
                // 4. Cursor is at end and Delete
                const shouldDeleteLines =
                    !isInputFocused ||
                    inputValue === '' ||
                    (e.key === 'Backspace' && cursorPosition === 0) ||
                    (e.key === 'Delete' &&
                        cursorPosition === inputValue.length);

                if (shouldDeleteLines) {
                    e.preventDefault();
                    handleDeleteSelected();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gcodeLines, selectedLines, handleDeleteSelected]);

    const handleCopy = async () => {
        try {
            let textToCopy: string;
            if (selectedLines.size > 0) {
                // Copy only selected lines
                const sortedIndices = Array.from(selectedLines).sort(
                    (a, b) => a - b,
                );
                textToCopy = sortedIndices
                    .map((index) => gcodeLines[index])
                    .join('\n');
            } else {
                // Copy all if nothing selected
                textToCopy = gcodeLines.join('\n');
            }
            await navigator.clipboard.writeText(textToCopy);
            toast.info(
                selectedLines.size > 0
                    ? `${selectedLines.size} line(s) copied to clipboard`
                    : 'G-code has been copied to your clipboard',
                {
                    position: 'bottom-right',
                },
            );
        } catch (err) {
            toast.error('Could not copy G-code to clipboard', {
                position: 'bottom-right',
            });
        }
    };

    const handleRevert = useCallback(() => {
        if (isJobRunning) {
            toast.error('Cannot revert while job is running', {
                position: 'bottom-right',
            });
            return;
        }
        if (hasChanges) {
            setGcodeLines([...originalLines]);
            setHasChanges(false);
            setSelectedLines(new Set());
            setLastSelectedIndex(null);
            toast.info('Reverted to original content', {
                position: 'bottom-right',
            });
        }
    }, [hasChanges, originalLines, isJobRunning]);

    const handleSave = async () => {
        if (isJobRunning) {
            toast.error('Cannot save while job is running', {
                position: 'bottom-right',
            });
            return;
        }
        try {
            const gcodeText = gcodeLines.join('\n');
            const fileName = name || 'edited.gcode';
            const file = new File([gcodeText], fileName);

            await uploadGcodeFileToServer(
                file,
                controller.port,
                VISUALIZER_PRIMARY,
            );

            const size = new Blob([gcodeText]).size;
            reduxStore.dispatch(
                updateFileContent({
                    content: gcodeText,
                    name: fileName,
                    size,
                }),
            );

            // Update original lines after successful save
            setOriginalLines([...gcodeLines]);
            setHasChanges(false);
            toast.success('G-code saved successfully', {
                position: 'bottom-right',
            });
        } catch (err) {
            toast.error('Failed to save G-code', {
                position: 'bottom-right',
            });
        }
    };

    if (!content) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <p className="text-gray-500">No G-code file loaded</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-dark rounded-md shadow-lg">
            <div className="flex justify-between items-center p-3 border-b border-gray-300 dark:border-dark-lighter gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <h3 className="text-lg font-semibold dark:text-white whitespace-nowrap">
                        G-code Editor
                    </h3>
                    {isJobRunning && (
                        <span
                            className={cn(
                                'text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap',
                                {
                                    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300':
                                        workflowState === WORKFLOW_STATE_PAUSED,
                                    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300':
                                        workflowState ===
                                        WORKFLOW_STATE_RUNNING,
                                },
                            )}
                        >
                            {workflowState === WORKFLOW_STATE_PAUSED
                                ? 'Paused'
                                : 'Running'}
                        </span>
                    )}
                    {selectedLines.size > 0 && (
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium whitespace-nowrap">
                            {selectedLines.size} selected
                        </span>
                    )}
                    {gcodeLines.length > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {gcodeLines.length.toLocaleString()} lines
                        </span>
                    )}
                </div>
                <div className="flex gap-1.5 items-center flex-shrink-0">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopy}
                        disabled={isJobRunning}
                        className="border border-gray-500"
                        icon={<Copy className="h-4 w-4" />}
                        tooltip={{
                            content: isJobRunning
                                ? 'Copy disabled while job is running'
                                : selectedLines.size > 0
                                  ? `Copy ${selectedLines.size} selected line(s)`
                                  : 'Copy all lines',
                        }}
                    />
                    {selectedLines.size > 0 && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleDeleteSelected}
                            disabled={isJobRunning}
                            className="border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            icon={<Trash2 className="h-4 w-4" />}
                            tooltip={{
                                content: isJobRunning
                                    ? 'Delete disabled while job is running'
                                    : `Delete ${selectedLines.size} selected line(s)`,
                            }}
                        />
                    )}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRevert}
                        disabled={!hasChanges || isJobRunning}
                        className="border border-gray-500"
                        icon={<RotateCcw className="h-4 w-4" />}
                        tooltip={{
                            content: isJobRunning
                                ? 'Revert disabled while job is running'
                                : 'Revert to original content',
                        }}
                    />
                    <Button
                        variant="primary"
                        size="icon"
                        onClick={handleSave}
                        disabled={!hasChanges || isJobRunning}
                        icon={<Save className="h-4 w-4" />}
                        tooltip={{
                            content: isJobRunning
                                ? 'Save disabled while job is running'
                                : 'Save changes',
                        }}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        icon={<X className="h-4 w-4" />}
                        tooltip={{
                            content: 'Close editor',
                        }}
                    />
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                className="relative w-full flex-1 overflow-auto line-container"
                onScroll={handleScroll}
                onClick={handleContainerClick}
                tabIndex={0}
            >
                <div
                    className={`
                        fixed bottom-2 right-2 z-10
                        transition-opacity transition-transform
                        ${scrollTop > 500 ? 'pointer-events-auto' : 'pointer-events-none'}
                    `}
                    style={{
                        opacity: scrollTop > 500 ? 1 : 0,
                        transform:
                            scrollTop > 500
                                ? 'translateY(0)'
                                : 'translateY(1rem)',
                        transition: 'opacity 300ms, transform 300ms',
                    }}
                    aria-hidden={scrollTop <= 500}
                >
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                            scrollContainerRef.current?.scrollTo({
                                top: 0,
                                behavior: 'smooth',
                            });
                        }}
                        disabled={isJobRunning}
                        icon={<ArrowUp className="h-4 w-4" />}
                    />
                </div>
                <div
                    style={{ height: totalHeight, position: 'relative' }}
                    className="font-mono text-sm"
                >
                    {gcodeLines
                        .slice(visibleRange.start, visibleRange.end)
                        .map((line, relativeIndex) => {
                            const index = visibleRange.start + relativeIndex;
                            const isSelected = selectedLines.has(index);

                            // Determine line status for job visualization
                            let lineStatus:
                                | 'processed'
                                | 'current'
                                | 'upcoming'
                                | 'none' = 'none';
                            if (isJobRunning && currentLineRunning >= 0) {
                                // currentLineRunning is 0-indexed and represents the line currently being executed
                                // Lines before currentLineRunning are processed (already executed)
                                // Lines at currentLineRunning and nearby are current (being executed)
                                // Lines after are upcoming (will be executed)
                                if (index < currentLineRunning) {
                                    lineStatus = 'processed';
                                } else if (
                                    index >= currentLineRunning &&
                                    index <= currentLineRunning + 2
                                ) {
                                    lineStatus = 'current';
                                } else if (index > currentLineRunning + 2) {
                                    lineStatus = 'upcoming';
                                }
                            }

                            const getLineStatusClass = () => {
                                if (!isJobRunning) return '';
                                switch (lineStatus) {
                                    case 'processed':
                                        return 'bg-green-50 dark:bg-green-900/20 border-l-2 border-green-500';
                                    case 'current':
                                        return 'bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 animate-pulse';
                                    case 'upcoming':
                                        return 'bg-blue-50 dark:bg-blue-900/10 border-l-2 border-blue-300';
                                    default:
                                        return '';
                                }
                            };

                            return (
                                <div
                                    key={index}
                                    style={{
                                        position: 'absolute',
                                        top: index * LINE_HEIGHT,
                                        left: 0,
                                        right: 0,
                                        height: LINE_HEIGHT,
                                    }}
                                    className={`flex items-center py-1 px-2 transition-colors group ${
                                        isSelected
                                            ? 'bg-blue-100 dark:bg-blue-900/30'
                                            : lineStatus !== 'none'
                                              ? getLineStatusClass()
                                              : index % 2 === 0
                                                ? 'bg-gray-200 dark:bg-dark-lighter'
                                                : 'hover:bg-gray-100 dark:hover:bg-dark-lighter/50'
                                    } ${isJobRunning ? 'cursor-not-allowed' : ''}`}
                                >
                                    {/* Selection checkbox */}
                                    <div
                                        className={`flex items-center justify-center w-6 h-6 mr-3 rounded transition-colors flex-shrink-0 ${
                                            isJobRunning
                                                ? 'cursor-not-allowed opacity-50'
                                                : 'cursor-pointer'
                                        }`}
                                        onClick={(e) =>
                                            handleCheckboxClick(index, e)
                                        }
                                        title={
                                            isJobRunning
                                                ? 'Editing disabled while job is running'
                                                : 'Click to toggle selection'
                                        }
                                        onMouseEnter={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.classList.add(
                                                    'bg-gray-300',
                                                    'dark:bg-gray-600',
                                                );
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.classList.remove(
                                                'bg-gray-300',
                                                'dark:bg-gray-600',
                                            );
                                        }}
                                    >
                                        {isSelected ? (
                                            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        ) : (
                                            <div className="w-5 h-5 border-2 border-gray-400 dark:border-gray-500 rounded hover:border-blue-500" />
                                        )}
                                    </div>
                                    <span
                                        className={`mr-4 min-w-[60px] text-right select-none ${
                                            isSelected
                                                ? 'text-blue-700 dark:text-blue-300 font-medium'
                                                : lineStatus === 'current'
                                                  ? 'text-yellow-700 dark:text-yellow-300 font-bold'
                                                  : lineStatus === 'processed'
                                                    ? 'text-green-700 dark:text-green-300'
                                                    : 'text-muted-foreground'
                                        }`}
                                    >
                                        {index + 1}
                                        {lineStatus === 'current' && (
                                            <span className="ml-1 text-xs">
                                                ▶
                                            </span>
                                        )}
                                    </span>
                                    <input
                                        ref={(el) => {
                                            if (el) {
                                                lineInputsRef.current.set(
                                                    index,
                                                    el,
                                                );
                                            } else {
                                                lineInputsRef.current.delete(
                                                    index,
                                                );
                                            }
                                        }}
                                        type="text"
                                        value={line}
                                        onChange={(e) =>
                                            handleLineChange(
                                                index,
                                                e.target.value,
                                            )
                                        }
                                        onClick={(e) => {
                                            // Select line when clicking on input
                                            if (!isSelected && !isJobRunning) {
                                                handleLineClick(index, e);
                                            }
                                        }}
                                        onFocus={() => {
                                            // Select line when focusing on input (if not already selected)
                                            if (!isSelected && !isJobRunning) {
                                                const newSelection = new Set([
                                                    index,
                                                ]);
                                                setSelectedLines(newSelection);
                                                setLastSelectedIndex(index);
                                            }
                                        }}
                                        disabled={isJobRunning}
                                        className={`flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-1 ${
                                            isSelected
                                                ? 'text-blue-900 dark:text-blue-100'
                                                : lineStatus === 'current'
                                                  ? 'text-yellow-900 dark:text-yellow-100 font-medium'
                                                  : lineStatus === 'processed'
                                                    ? 'text-green-900 dark:text-green-100'
                                                    : 'dark:text-white'
                                        } ${isJobRunning ? 'cursor-not-allowed opacity-75' : ''}`}
                                    />
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
};

export default GcodeEditor;
