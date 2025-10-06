export interface ToolChange {
    id: string;
    toolNumber: number;
    color: string;
    label?: string;
    startLine?: number;
    endLine?: number;
}

export interface ToolTimelineProps {
    tools: ToolChange[];
    activeToolIndex: number;
    progress: number;
    onToggle?: () => void;
    isCollapsed?: boolean;
}
