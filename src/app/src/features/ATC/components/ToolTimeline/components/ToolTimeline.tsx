import { ChevronDown, ChevronUp } from 'lucide-react';
import cn from 'classnames';
import { Button } from 'app/components/Button';
import { ToolTimelineItem } from './ToolTimelineItem';
import { ToolTimelineProps } from './types';

export function ToolTimeline({
    tools,
    activeToolIndex,
    progress,
    onToggle,
    isCollapsed = false,
}: ToolTimelineProps) {
    const activeTool = tools[activeToolIndex];

    return (
        <div className="fixed top-6 left-6 z-50 max-w-xs">
            <div
                className={cn(
                    'rounded-xl border border-white/20 backdrop-blur-md transition-all duration-300',
                    'shadow-xl',
                    isCollapsed ? 'p-2' : 'p-4',
                )}
            >
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        {isCollapsed && activeTool && (
                            <div
                                className="h-6 w-6 rounded-full border-2 border-white shadow-sm"
                                style={{ backgroundColor: activeTool.color }}
                            />
                        )}
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {isCollapsed
                                ? `T${activeTool?.toolNumber || 0}`
                                : 'Tool Timeline'}
                        </h3>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggle}
                        className="h-7 w-7 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50"
                    >
                        {isCollapsed ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronUp className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                {!isCollapsed && (
                    <div className="mt-4 max-h-[400px] overflow-y-auto scrollbar-hide px-2 py-1">
                        {tools.slice(0, 4).map((tool, index) => (
                            <ToolTimelineItem
                                key={tool.id}
                                tool={tool}
                                isActive={index === activeToolIndex}
                                isLast={index === Math.min(tools.length, 4) - 1}
                                progress={
                                    index === activeToolIndex ? progress : 0
                                }
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
