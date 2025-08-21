import React from 'react';
import { Copy } from 'lucide-react';

import { Button } from 'app/components/Button';
import { toast } from 'app/lib/toaster';

interface GcodeViewerProps {
    gcode: string;
}

export const GcodeViewer = ({ gcode }: GcodeViewerProps) => {
    const gcodeLines = gcode.split('\n');

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(gcode);
            toast.info('G-code has been copied to your clipboard', {
                position: 'bottom-right',
            });
        } catch (err) {
            toast.error('Could not copy G-code to clipboard', {
                position: 'bottom-right',
            });
        }
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">G-code Output</h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="flex items-center gap-2 border border-gray-500"
                    icon={<Copy className="h-4 w-4" />}
                    text="Copy G-code"
                />
            </div>

            <div className="relative w-full h-full">
                <div className="rounded-md absolute top-0 left-0 right-0 bottom-0 overflow-auto">
                    <pre className="font-mono text-sm">
                        {gcodeLines.map((line, index) => (
                            <div
                                key={Math.random().toString()}
                                className={`py-1 px-2 rounded-sm ${
                                    index % 2 === 0
                                        ? 'bg-gray-200 dark:bg-dark-lighter'
                                        : ''
                                }`}
                            >
                                <span className="text-muted-foreground mr-4">
                                    {index + 1}
                                </span>
                                {line}
                            </div>
                        ))}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default GcodeViewer;